import type { RouteStateBucket } from '@ember/-internals/routing/route-managers/utils';
import {
  setRouteManager,
  type RouteManager,
  routeCapabilities,
} from '@ember/routing';
import type { Destroyable } from '@glimmer/interfaces';
import EmberObject from '@ember/object';
import { getOwner, setOwner } from '@ember/owner';
import type EmberRouter from '@ember/routing/router';

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

export class PioneerRouteManager implements RouteManager {
  capabilities = routeCapabilities('1.0');

  private owner: unknown;
  private router: unknown;

  constructor(owner: Owner) {
    console.log('PioneerRouteManager initialized with owner:', owner);
    this.owner = owner;
  }

  // createRoute, getDestroyable, willEnter, willExit, didEnter, didExit methods would be implemented here as needed

  createRoute(definition: object, args: { name: string }): RouteBucket {
    console.log(
      'Creating route with definition:',
      definition,
      'and args:',
      args
    );
    let classicRouteInstance = {
      definition,
      routeName: '',
      fullRouteName: '',
      _setRouteName(name: string) {
        console.log(`Setting route name to: ${name}`);
        this.routeName = name;
        let owner = getOwner(this);
        console.log('Owner of route instance:', owner);
        assert(
          'Expected route to have EngineInstance as owner',
          owner instanceof EngineInstance
        );
        //this.fullRouteName = getEngineRouteName(owner, name);
      },
      _router: undefined,
      _stashNames() {},
    };
    setOwner(classicRouteInstance, this.owner);
    const bucket = { definition, args, instance: classicRouteInstance };

    return bucket;
  }

  getDestroyable(bucket: StateBucket): Destroyable | null {
    return null;
  }

  willEnter(bucket: StateBucket, args: any): void {
    // Implementation for willEnter
    console.log(`Will enter route with args`);
  }

  enter(bucket: StateBucket, args: any): Promise<unknown> {
    // Implementation for enter
    console.log(`Entering route with args`);
    return Promise.resolve();
  }

  didEnter(bucket: StateBucket, args: any): void {
    console.log(`Did enter route with args`);
    // Implementation for didEnter
  }

  willExit(bucket: StateBucket, args: any): void {
    console.log(`Will exit route with args`);
    // Implementation for willExit
  }

  exit(bucket: StateBucket, args: any): void {
    console.log(`Exiting route with args`);
    // Implementation for exit
  }

  didExit(bucket: StateBucket, args: any): void {
    console.log(`Did exit route with args`);
    // Implementation for didExit
  }

  getInvokable(bucket: StateBucket): Promise<object | undefined> {
    console.log(`Getting invokable for route with args`, bucket);
    bucket.invokable = bucket.definition.component;
    return Promise.resolve(bucket.invokable);
  }
}

export default class BaseRoute extends EmberObject {
  _router!: EmberRouter;
  _stashNames() {}

  constructor(owner: unknown, args: { name: string }) {
    super(owner);

    if (owner) {
      const router = owner.lookup('router:main');
      this._router = router as EmberRouter;
      this._topLevelViewTemplate = owner.lookup('template:-outlet');
      this._environment = owner.lookup('-environment:main');
    }
  }
}
setRouteManager(() => new PioneerRouteManager(), BaseRoute);
