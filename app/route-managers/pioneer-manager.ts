import type { RouteStateBucket } from '@ember/-internals/routing';
import { assert } from '@ember/debug';
import type Owner from '@ember/owner';
import { routeCapabilities } from '@ember/routing';
import type { Destroyable } from '@glimmer/interfaces';
import RouteShell from 'use-route-manager/route-managers/route-shell';
import type BaseRoute from 'use-route-manager/routes/BaseRoute';

const routes = import.meta.glob('../routes/**/*.gts');

export class RouteBucket implements RouteStateBucket {
  route: BaseRoute;
  args: { name: string };

  // Cached after the first call to getInvokable so subsequent calls return
  // the same component definition.
  invokable: object | undefined = undefined;

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
    // Key difference from ClassicRouteManager, no EmberObject.create().
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
    console.log(`PioneerRouteManager: will enter route "${bucket.args.name}"`);
  }

  async enter(
    bucket: RouteBucket,
    { getAncestorPromise }: { getAncestorPromise: () => Promise<unknown> }
  ): Promise<unknown> {
    console.log(`PioneerRouteManager: entering route "${bucket.args.name}"`);
    const ancestorPromises = getAncestorPromise();
    console.log('ancestor promises', ancestorPromises);
    const context = await bucket.route.model(ancestorPromises);
    // The router writes this return value onto routeInfo.context. The
    // framework's @model arg is a compute ref over routeInfo.context that
    // re-reads when the outlet state dirties. The wrapper derives loading
    // state from routeInfo.enterPromise (the promise this very async
    // function returns), so no bucket flag is needed.
    return context;
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

  getRouteWrapper(_bucket: RouteBucket): object {
    // Module stable wrapper, the same definition is returned for every
    // bucket. Per route data flows in via @routeInfo at render time.
    return RouteShell;
  }

  async getInvokable(bucket: RouteBucket): Promise<object | undefined> {
    console.log(
      `PioneerRouteManager: getInvokable for route "${bucket.args.name}"`
    );
    if (bucket.invokable !== undefined) {
      return bucket.invokable;
    }

    // Pull the named LoadingState export off the route module if it has one
    // and stash it on the route instance so the wrapper can read it via
    // @routeInfo.route.LoadingState. Routes that omit the export leave the
    // field undefined and the wrapper renders the route component immediately.
    const routePath = `../routes/${bucket.args.name.replace(/\./g, '/')}.gts`;
    const routeModule = (await routes[routePath]?.()) as
      | { LoadingState?: object; default: object }
      | undefined;
    const RouteClass = routeModule?.default;
    bucket.route.LoadingState = routeModule?.LoadingState;

    assert(
      `PioneerRouteManager: failed to load route class for "${bucket.args.name}". ` +
        `Make sure the route file is named correctly and exports a route class as default.`,
      RouteClass
    );

    bucket.invokable = RouteClass;
    return RouteClass;
  }
}
