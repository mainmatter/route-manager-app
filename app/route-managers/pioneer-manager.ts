import { makeRouteTemplate } from '@ember/-internals/glimmer';
import type { InternalOwner } from '@ember/-internals/owner';
import type { RouteStateBucket } from '@ember/-internals/routing';
import templateOnly from '@ember/component/template-only';
import { assert } from '@ember/debug';
import type Owner from '@ember/owner';
import { routeCapabilities } from '@ember/routing';
import { precompileTemplate } from '@ember/template-compilation';
import type { CurriedComponent, Destroyable } from '@glimmer/interfaces';
import { getComponentTemplate, setComponentTemplate } from '@glimmer/manager';
import { getOwner } from '@glimmer/owner';
import type { Reference } from '@glimmer/reference';
import { createComputeRef, createConstRef } from '@glimmer/reference';
import { createCapturedArgs, curry, EMPTY_POSITIONAL } from '@glimmer/runtime';
import { tracked } from '@glimmer/tracking';
import { dict } from '@glimmer/util';
import type BaseRoute from 'use-route-manager/routes/BaseRoute';

const routes = import.meta.glob('../routes/**/*.gts');

// Wrapper template-only component that switches between the route's loading
// state and its main template based on @isLoading. The route's resolved invokable
// is passed in as @RouteComponent and the optional loading template as
// @LoadingState. @model is forwarded to the route component once loading is done.
const RouteShell = templateOnly();
setComponentTemplate(
  precompileTemplate(
    `
    {{#if @LoadingState}}
      {{#if @isLoading}}
        <@LoadingState />
      {{else}}
        <@RouteComponent @model={{@model}} />
      {{/if}}
    {{else}}
      <@RouteComponent @model={{@model}} />
     {{/if}}`,
    { strictMode: true }
  ),
  RouteShell
);

export class RouteBucket implements RouteStateBucket {
  route: BaseRoute;
  args: { name: string };

  invokable: object | undefined = undefined;

  // Populated by the router synchronously after calling manager.enter(), so that
  // child routes can await the parent's data resolution via getAncestorPromise.
  enterPromise: Promise<unknown> | undefined = undefined;

  // The resolved model returned from enter(). Tracked so that the @model ref
  // in the curried invokable re-renders the template when data arrives.
  @tracked context: unknown = undefined;

  // True while enter() is in flight. The wrapper template reads this to
  // switch between the loading state and the resolved route component.
  @tracked isLoading = true;

  constructor(route: BaseRoute, args: { name: string }) {
    this.route = route;
    this.args = args;
  }
}

export class PioneerRouteManager {
  capabilities = routeCapabilities('1.0');

  #owner: Owner;

  constructor(owner: Owner) {
    this.#owner = owner;
  }

  createRoute(
    RouteClass: typeof BaseRoute,
    args: { name: string }
  ): RouteBucket {
    // Instantiate the plain class route using `new`, passing the owner.
    // Key difference from ClassicRouteManager — no EmberObject.create().
    const route = new RouteClass(this.#owner);
    const bucket = new RouteBucket(route, args);
    route.bucket = bucket;
    route.manager = this;
    return bucket;
  }

  getDestroyable(bucket: RouteBucket): Destroyable | null {
    return bucket.route;
  }

  willEnter(bucket: RouteBucket): void {
    // Mark loading at the start of every enter so re-entries (same route, new
    // params) flip the wrapper back to the loading state.
    bucket.isLoading = true;
    console.log(`PioneerRouteManager: will enter route "${bucket.args.name}"`);
  }

  async enter(
    bucket: RouteBucket,
    { getAncestorPromise }: { getAncestorPromise: () => Promise<unknown> }
  ): Promise<unknown> {
    console.log(`PioneerRouteManager: entering route "${bucket.args.name}"`);
    try {
      const ancestorPromises = getAncestorPromise();
      console.log('ancestor promises', ancestorPromises);
      const context = await bucket.route.model(ancestorPromises);
      bucket.context = context;
      return context;
    } finally {
      // Tracked field, so the wrapper template re-renders to show the route
      // component once data has arrived (or after a failure, to avoid getting
      // stuck on the loading state).
      bucket.isLoading = false;
    }
  }

  didEnter(_bucket: RouteBucket): void {
    console.log(`PioneerRouteManager: did enter route "${_bucket.args.name}"`);
  }

  willExit(_bucket: RouteBucket): void {
    console.log(`PioneerRouteManager: will exit route "${_bucket.args.name}"`);
  }

  exit(_bucket: RouteBucket): void {
    console.log(`PioneerRouteManager: exiting route "${_bucket.args.name}"`);
  }

  didExit(_bucket: RouteBucket): void {
    console.log(`PioneerRouteManager: did exit route "${_bucket.args.name}"`);
  }

  async getInvokable(bucket: RouteBucket): Promise<object | undefined> {
    console.log(
      `PioneerRouteManager: getInvokable for route "${bucket.args.name}"`
    );
    if (bucket.invokable !== undefined) {
      return bucket.invokable;
    }

    const owner = getOwner(bucket.route)! as InternalOwner;

    // Pull the named LoadingState export off the route module if it has one.
    // Routes that omit it will render the route template immediately.
    const routePath = `../routes/${bucket.args.name.replace(/\./g, '/')}.gts`;
    const routeModule = (await routes[routePath]?.()) as
      | { LoadingState?: object; default: object }
      | undefined;
    const LoadingState = routeModule?.LoadingState;
    const RouteClass = routeModule?.default;

    assert(
      `PioneerRouteManager: failed to load route class for "${bucket.args.name}". ` +
        `Make sure the route file is named correctly and exports a route class as default.`,
      RouteClass
    );

    // Retrieve the template factory from the co-located .gts class and wrap it
    // in a RouteTemplate so it can be rendered as a component.
    const templateFactory = getComponentTemplate(RouteClass);
    if (!templateFactory) {
      throw new Error(
        `PioneerRouteManager: no template found for route "${bucket.args.name}". ` +
          `Make sure the route class is defined in a .gts file with a co-located <template>.`
      );
    }

    const template = templateFactory(owner);
    const RouteComponent = makeRouteTemplate(owner, bucket.args.name, template);

    // Curry RouteShell with the three args it needs. @model is a compute ref
    // over bucket.context (tracked) so the route template re-renders when
    // model() resolves. @isLoading is a compute ref over bucket.isLoading
    // (tracked) so the wrapper switches from LoadingState to RouteComponent
    // when enter() finishes. The component args are const refs since they
    // never change for the lifetime of the route.
    const namedArgs = dict<Reference>();
    namedArgs['model'] = createComputeRef(() => bucket.context);
    namedArgs['isLoading'] = createComputeRef(() => bucket.isLoading);
    namedArgs['RouteComponent'] = createConstRef(
      RouteComponent,
      'RouteComponent'
    );
    namedArgs['LoadingState'] = createConstRef(LoadingState, 'LoadingState');

    const args = createCapturedArgs(namedArgs, EMPTY_POSITIONAL);
    // isResolved=false because RouteShell is a raw template-only component
    // class that the VM still needs to look up via its component manager.
    const invokable = curry(
      0 as CurriedComponent,
      RouteShell,
      owner,
      args,
      false
    );

    bucket.invokable = invokable;
    return invokable;
  }
}
