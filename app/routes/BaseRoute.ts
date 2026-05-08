// this is all experimental, perfectly correct types are not a concern
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { capabilities } from '@ember/component';
import type Owner from '@ember/owner';
import { setOwner } from '@ember/owner';
import { setRouteManager } from '@ember/routing';
import type EmberRouter from '@ember/routing/router';
import { destroy, registerDestructor } from '@glimmer/destroyable';
import { setComponentManager } from '@glimmer/manager';
import {
  PioneerRouteManager,
  type RouteBucket,
} from 'use-route-manager/route-managers/pioneer-manager';

export default class BaseRoute {
  _router!: EmberRouter;
  _stashNames() {} // used by ember/router for QP's but not relevant to this demo

  manager!: PioneerRouteManager;
  bucket!: RouteBucket;

  // Optional named export from the route module. Stashed on the instance by
  // PioneerRouteManager.getInvokable when it loads the route module so the
  // module stable RouteShell wrapper can render it during loading.
  LoadingState?: object;

  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  async model(_parentContext: Promise<unknown>): Promise<unknown> {
    return null;
  }

  constructor(owner: Owner) {
    setOwner(this, owner);
    // eslint-disable-next-line ember/no-private-routing-service
    const router = owner.lookup('router:main');
    this._router = router as EmberRouter;
  }
}
setRouteManager((owner) => new PioneerRouteManager(owner), BaseRoute);

class RouteShellComponentManager {
  capabilities = capabilities('3.13');

  private owner: unknown;

  constructor(owner: unknown) {
    this.owner = owner;
  }

  createComponent(ComponentClass: any, args: any): any {
    const component = new ComponentClass(this.owner, args.named);

    registerDestructor(component, () => component.willDestroy());

    return component;
  }

  getContext(component: any): any {
    return component;
  }

  destroyComponent(component: any): void {
    destroy(component);
  }
}

setComponentManager(
  (owner: Owner) => new RouteShellComponentManager(owner),
  BaseRoute
);
