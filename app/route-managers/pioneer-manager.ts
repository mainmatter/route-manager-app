/* eslint-disable ember/no-runloop */
import type { RouteStateBucket } from '@ember/-internals/routing';
import type Owner from '@ember/owner';
import { routeCapabilities } from '@ember/routing';
import { once } from '@ember/runloop';
import type { Destroyable } from '@glimmer/interfaces';
import { getComponentTemplate } from '@glimmer/manager';
import { getOwner } from '@glimmer/owner';
import type BaseRoute from 'use-route-manager/routes/BaseRoute';

export class RouteBucket implements RouteStateBucket {
  route: BaseRoute;
  invokable: object | undefined;
  args: { name: string };

  constructor(route: BaseRoute, args: { name: string }) {
    this.route = route;
    this.invokable = undefined;
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

    const bucket = new RouteBucket(route, args);

    route.bucket = bucket;
    route.manager = this;

    return bucket;
  }

  getDestroyable(bucket: RouteBucket): Destroyable | null {
    return bucket.route;
  }

  willEnter(bucket: RouteBucket): void {
    console.log(`Will enter route`, bucket.args.name);

    if (!bucket.route.loading) {
      return;
    }

    const fakeRouteInfo = {
      route: bucket.route, // needs .routeName, .bucket, and an owner set
      invokable: bucket.route.loading, // the loading template
    };

    const microlib = bucket.route._router._routerMicrolib;

    if (!microlib.currentRouteInfos) {
      microlib.currentRouteInfos = [];
    }

    microlib.currentRouteInfos.push(fakeRouteInfo);
    once(bucket.route._router, '_setOutlets');
  }

  async enter(bucket: RouteBucket): Promise<unknown> {
    console.log(`Entering route`, bucket.args.name);

    const ctx = await bucket.route.model();

    return ctx;
  }

  didEnter(bucket: RouteBucket): void {
    console.log(`Did enter route`, bucket.args.name);
    console.log(`------------------------`);
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
    if (bucket.invokable) {
      console.log(`Invokable already exists for route`, bucket.args.name);
      return Promise.resolve(bucket.invokable);
    }

    const owner = getOwner(bucket.route)!;

    console.log('route bucket', bucket);

    const RouteClass = bucket.route.constructor;
    const template = getComponentTemplate(RouteClass)!(owner);

    bucket.invokable = template;
    console.log(`Getting invokable for route`, bucket.args.name);
    console.log('template', bucket.invokable);
    return Promise.resolve(bucket.invokable);
  }
}
