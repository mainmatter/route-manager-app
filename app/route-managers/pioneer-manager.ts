import { makeRouteTemplate } from '@ember/-internals/glimmer';
import type { InternalOwner } from '@ember/-internals/owner';
import type { RouteStateBucket } from '@ember/-internals/routing';
import type Owner from '@ember/owner';
import { routeCapabilities } from '@ember/routing';
import type { CurriedComponent, Destroyable } from '@glimmer/interfaces';
import { getComponentTemplate } from '@glimmer/manager';
import { getOwner } from '@glimmer/owner';
import type { Reference } from '@glimmer/reference';
import { createComputeRef } from '@glimmer/reference';
import { createCapturedArgs, curry, EMPTY_POSITIONAL } from '@glimmer/runtime';
import { tracked } from '@glimmer/tracking';
import { dict } from '@glimmer/util';
import type BaseRoute from 'use-route-manager/routes/BaseRoute';

const routes = import.meta.glob('../routes/**/*.gts');

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

  willEnter(bucket: RouteBucket): void {}

  async enter(bucket: RouteBucket): Promise<unknown> {
    const context = await bucket.route.model();
    bucket.context = context;
    return context;
  }

  didEnter(_bucket: RouteBucket): void {}

  willExit(_bucket: RouteBucket): void {}

  exit(_bucket: RouteBucket): void {}

  didExit(_bucket: RouteBucket): void {}

  nameToFilePath(name: string): string {
    name = name.replace(/\./g, '/');
    return `${name}`;
  }

  async getInvokable(bucket: RouteBucket): Promise<object | undefined> {
    if (bucket.invokable !== undefined) {
      return Promise.resolve(bucket.invokable);
    }

    console.log(
      `PioneerRouteManager: rendering route "${this.nameToFilePath(bucket.args.name)}"`
    );

    const { LoadingState } =
      await routes[`../routes/${this.nameToFilePath(bucket.args.name)}.gts`]();

    console.log('PioneerRouteManager: got LoadingState', LoadingState);

    const owner = getOwner(bucket.route)!;
    const RouteClass = bucket.route.constructor;

    // Retrieve the template factory from the co-located .gts class and wrap it
    // in a RouteTemplate so it can be rendered as a component by the outlet helper.
    const templateFactory = getComponentTemplate(RouteClass);
    if (!templateFactory) {
      throw new Error(
        `PioneerRouteManager: no template found for route "${bucket.args.name}". ` +
          `Make sure the route class is defined in a .gts file with a co-located <template>.`
      );
    }

    // templateFactory(owner) returns a raw Template, which has no component
    // manager attached. makeRouteTemplate wraps it in a RouteTemplate component
    // definition that knows how to render the template, so the curry below has
    // a real ComponentDefinition to operate on.
    const template = templateFactory(owner);
    const component = makeRouteTemplate(
      owner as InternalOwner,
      bucket.args.name,
      template
    );

    // @model is a compute ref over bucket.context, which is @tracked, so the
    // template re-renders when model() resolves and bucket.context updates.
    const namedArgs = dict<Reference>();
    namedArgs['model'] = createComputeRef(() => bucket.context);

    const args = createCapturedArgs(namedArgs, EMPTY_POSITIONAL);
    // isResolved=true because makeRouteTemplate already produced a resolved
    // CurriedValue with its own internal component manager.
    const invokable = curry(
      0 as CurriedComponent,
      component,
      owner,
      args,
      true
    );

    bucket.invokable = invokable;
    return Promise.resolve(invokable);
  }
}
