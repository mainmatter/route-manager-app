import type { RouteStateBucket } from '@ember/-internals/routing/route-managers/utils';
import { routeCapabilities } from '@ember/routing';
import type { Destroyable } from '@glimmer/interfaces';
import { getComponentTemplate } from '@glimmer/manager';
import { getOwner } from '@glimmer/owner';
import { once } from '@ember/runloop';
import type BaseRoute from 'use-route-manager/routes/BaseRoute';

type StateBucket = RouteStateBucket & {
  invokable?: object;
};

export class RouteBucket {
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

  createRoute(definition: BaseRoute, args: { name: string }): RouteBucket {
    console.log(
      'Creating route with definition:',
      definition,
      'and args:',
      args
    );

    const bucket = {
      route: definition,
      instance: {
        definition,
      },
      args,
      invokable: undefined,
    };

    return bucket;
  }

  getDestroyable(bucket: StateBucket): Destroyable | null {
    return bucket.route;
  }

  willEnter(bucket: StateBucket, args: any): void {
    // Implementation for willEnter
    console.log(`Will enter route with args`, bucket.args);
  }

  enter(bucket: StateBucket, args: any): Promise<unknown> {
    // Implementation for enter
    console.log(`Entering route with args`, bucket.args);
    return Promise.resolve();
  }

  didEnter(bucket: StateBucket, args: any): void {
    once(bucket.route._router, '_setOutlets');
  }

  willExit(bucket: StateBucket, args: any): void {
    console.log(`Will exit route with args`, bucket.args);
    // Implementation for willExit
  }

  exit(bucket: StateBucket, args: any): void {
    console.log(`Exiting route with args`, bucket.args);
    // Implementation for exit
  }

  didExit(bucket: StateBucket, args: any): void {
    console.log(`Did exit route with args`, bucket.args);
    // Implementation for didExit
  }

  getInvokable(bucket: StateBucket): Promise<object | undefined> {
    const owner = getOwner(bucket.instance.definition)!;
    const routeclass = owner.factoryFor(`route:${bucket.args.name}`).class;
    const template = getComponentTemplate(routeclass)!(owner);

    bucket.invokable = template;
    console.log(`Getting invokable for route ${bucket.args.name}`);
    return Promise.resolve(bucket.invokable);
  }
}
