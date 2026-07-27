import { makeRouteTemplate } from '@ember/-internals/glimmer';
import type { InternalOwner } from '@ember/-internals/owner';
import templateOnly from '@ember/component/template-only';
import { assert } from '@ember/debug';
import type Owner from '@ember/owner';
import type {
  CreateRouteArgs,
  EnterState,
  RouteStateBucket,
} from '@ember/routing';
import { routeCapabilities } from '@ember/routing';
import { precompileTemplate } from '@ember/template-compilation';
import { getComponentTemplate, setComponentTemplate } from '@glimmer/manager';
import { getOwner } from '@glimmer/owner';
import { createComputeRef } from '@glimmer/reference';
import { tracked } from '@glimmer/tracking';
import type BaseRoute from 'use-route-manager/routes/BaseRoute';

const routes = import.meta.glob('../routes/**/*.gts');

// Wrapper template-only component that switches between the route's loading
// state and its main template based on @isLoading. The route's resolved invokable
// is passed in as @Component and the optional loading template as
// @bucket.LoadingState. @model is forwarded to the route component once loading is done.
const RouteShell = templateOnly();
setComponentTemplate(
  precompileTemplate(
    `
    {{#if @bucket.LoadingState}}
      {{#if @bucket.isLoading}}
        <@bucket.LoadingState />
      {{else}}
        <@Component @model={{@context}} @outlet={{@outlet}} />
      {{/if}}
    {{else}}
      <@Component @model={{@context}} @outlet={{@outlet}} />
     {{/if}}`,
    { strictMode: true }
  ),
  RouteShell
);

export class RouteBucket implements RouteStateBucket {
  route: BaseRoute;
  args: CreateRouteArgs;

  invokable: object | undefined = undefined;

  LoadingState: object | undefined = undefined;

  @tracked context: unknown = undefined;

  @tracked isLoading = true;

  constructor(route: BaseRoute, args: CreateRouteArgs) {
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
    args: CreateRouteArgs
  ): RouteBucket {
    // Instantiate the plain class route using `new`, passing the owner.
    // Key difference from ClassicRouteManager — no EmberObject.create().
    const route = new RouteClass(this.#owner);
    const bucket = new RouteBucket(route, args);
    route.bucket = bucket;
    route.manager = this;
    return bucket;
  }

  getRoute(bucket: RouteBucket): BaseRoute {
    return bucket.route;
  }

  getDestroyable(bucket: RouteBucket): object | null {
    return bucket.route;
  }

  getRouteWrapper(): object {
    return RouteShell;
  }

  getRenderState(bucket: RouteBucket) {
    return {
      owner: this.#owner,
      name: bucket.args.name,
      controller: undefined,
      model: bucket.context,
      wrapper: this.getRouteWrapper(),
      invokable: bucket.invokable,
      bucket,
      // @TODO: This will likely be gone. For now it's used here in classic as the "@model stability" provider
      produceContext: () => createComputeRef(() => bucket.context),
    };
  }

  willEnter(bucket: RouteBucket): void {
    // Mark loading at the start of every enter so re-entries (same route, new
    // params) flip the wrapper back to the loading state.
    bucket.isLoading = true;
    console.log(`PioneerRouteManager: will enter route "${bucket.args.name}"`);
  }

  async enter(bucket: RouteBucket, state: EnterState): Promise<unknown> {
    console.log(`PioneerRouteManager: entering route "${bucket.args.name}"`);
    try {
      const self = state.to.find(
        (routeInfo) => routeInfo.name === bucket.args.name
      );
      const parent = self?.parent ?? null;

      // Gets parent promise but doesn't await! Concurrency
      const parentContext = parent
        ? state.getAncestorContext(parent)
        : Promise.resolve(undefined);
      console.log('ancestor promise', parentContext);

      const context = await bucket.route.model(parentContext);
      bucket.context = context;
      return context;
    } finally {
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

    bucket.LoadingState = LoadingState;
    bucket.invokable = RouteComponent;
    return RouteComponent;
  }
}
