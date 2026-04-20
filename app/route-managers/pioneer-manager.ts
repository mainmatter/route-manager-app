import { routeCapabilities } from '@ember/routing';
import type { Destroyable } from '@glimmer/interfaces';
import { getComponentTemplate } from '@glimmer/manager';
import { getOwner } from '@glimmer/owner';
import { once } from '@ember/runloop';
import type Owner from '@ember/owner';
import type BaseRoute from 'use-route-manager/routes/BaseRoute';
import type { RouteStateBucket } from '@ember/-internals/routing';

export class RouteBucket implements RouteStateBucket {
  route: BaseRoute;
  invokable: object | undefined;
  instance: object;
  args: { name: string };

  constructor(route: BaseRoute, args: { name: string }) {
    this.route = route;
    this.invokable = undefined;
    this.instance = route;
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
    // This is the key difference from ClassicRouteManager — no EmberObject.create().
    const route = new RouteClass(this.#owner);

    console.log('Creating route:', args.name);

    return new RouteBucket(route, args);
  }

  getDestroyable(bucket: RouteBucket): Destroyable | null {
    return bucket.route;
  }

  willEnter(bucket: RouteBucket): void {
    console.log(`Will enter route`, bucket.args.name);
  }

  enter(bucket: RouteBucket): Promise<unknown> {
    console.log(`Entering route`, bucket.args.name);
    return Promise.resolve();
  }

  didEnter(bucket: RouteBucket): void {
    // eslint-disable-next-line ember/no-runloop
    once(bucket.route._router, '_setOutlets');
  }

  willExit(bucket: RouteBucket): void {
    console.log(`Will exit route`, bucket.args.name);
  }

  exit(bucket: RouteBucket): void {
    console.log(`Exiting route`, bucket.args.name);
  }

  didExit(bucket: RouteBucket): void {
    console.log(`Did exit route`, bucket.args.name);
  }

  getInvokable(bucket: RouteBucket): Promise<object | undefined> {
    const owner = getOwner(bucket.instance)!;

    const RouteClass = bucket.instance.constructor;
    const template = getComponentTemplate(RouteClass)!(owner);

    bucket.invokable = template;
    console.log(`Getting invokable for route`, bucket.args.name);
    return Promise.resolve(bucket.invokable);
  }
}
