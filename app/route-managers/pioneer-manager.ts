import { makeRouteTemplate } from '@ember/-internals/glimmer';
import type { InternalOwner } from '@ember/-internals/owner';
import type Owner from '@ember/owner';
import type {
  CreateRouteArgs,
  EnterState,
  RouteStateBucket,
} from '@ember/routing';
import { routeCapabilities } from '@ember/routing';
import { getComponentTemplate } from '@glimmer/manager';
import { getOwner } from '@glimmer/owner';
import { tracked } from '@glimmer/tracking';
import type { ComponentLike } from '@glint/template';
import { PioneerOutlet } from 'use-route-manager/route-managers/pioneer-outlet';
import type BaseRoute from 'use-route-manager/routes/BaseRoute';

const routes = import.meta.glob('../routes/**/*.gts');

/** What a route renders: its own template, or its `LoadingState`. */
export type RouteComponent = ComponentLike<{
  Args: { context: unknown; outlet: unknown };
}>;

export class RouteBucket implements RouteStateBucket {
  route: BaseRoute;
  RouteClass: typeof BaseRoute;
  args: CreateRouteArgs;

  @tracked invokable: RouteComponent | undefined = undefined;

  @tracked LoadingState: RouteComponent | undefined = undefined;

  @tracked isLoading = true;

  get renderable(): RouteComponent | undefined {
    if (this.LoadingState !== undefined && this.isLoading) {
      return this.LoadingState;
    }

    return this.invokable;
  }

  constructor(
    route: BaseRoute,
    RouteClass: typeof BaseRoute,
    args: CreateRouteArgs
  ) {
    this.route = route;
    this.RouteClass = RouteClass;
    this.args = args;
  }
}

export class PioneerRouteManager {
  capabilities = routeCapabilities('1.0', { awaitEnter: false });

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
    const bucket = new RouteBucket(route, RouteClass, args);
    route.bucket = bucket;
    route.manager = this;
    void this.#loadLoadingState(bucket);
    return bucket;
  }

  getRoute(bucket: RouteBucket): BaseRoute {
    return bucket.route;
  }

  getDestroyable(bucket: RouteBucket): object | null {
    return bucket.route;
  }

  getRouteWrapper(): object {
    return PioneerOutlet;
  }

  willEnter(bucket: RouteBucket): void {
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

      // The framework puts what this resolves with on the route info and
      // hands it to the wrapper as `@context`.
      return await bucket.route.model(parentContext);
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

  getInvokable(bucket: RouteBucket): object {
    console.log(
      `PioneerRouteManager: getInvokable for route "${bucket.args.name}"`
    );

    const owner = getOwner(bucket.route)! as InternalOwner;

    // Retrieve the template factory from the co-located .gts class and wrap it
    // in a RouteTemplate so it can be rendered as a component.
    const templateFactory = getComponentTemplate(bucket.RouteClass);
    if (!templateFactory) {
      throw new Error(
        `PioneerRouteManager: no template found for route "${bucket.args.name}". ` +
          `Make sure the route class is defined in a .gts file with a co-located <template>.`
      );
    }

    const template = templateFactory(owner);
    return makeRouteTemplate(
      owner,
      bucket.args.name,
      template
    ) as unknown as RouteComponent;
  }

  // Pull the named LoadingState export off the route module if it has one.
  // Routes that omit it will render the route template immediately.
  async #loadLoadingState(bucket: RouteBucket): Promise<void> {
    const routePath = `../routes/${bucket.args.name.replace(/\./g, '/')}.gts`;
    const loader = routes[routePath];

    if (!loader) {
      return;
    }

    const routeModule = (await loader()) as
      | { LoadingState?: RouteComponent }
      | undefined;

    bucket.LoadingState = routeModule?.LoadingState;
    console.log(
      `PioneerRouteManager: loading state for route "${bucket.args.name}" is ` +
        `${bucket.LoadingState ? 'available' : 'not defined'}`
    );
  }
}
