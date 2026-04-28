import type Owner from '@ember/owner';
import { setOwner } from '@ember/owner';
import { setRouteManager } from '@ember/routing';
import type EmberRouter from '@ember/routing/router';
import {
  PioneerRouteManager,
  type RouteBucket,
} from 'use-route-manager/route-managers/pioneer-manager';

export default class BaseRoute {
  _router!: EmberRouter;
  _stashNames() {} // used by ember/router for QP's but not relevant to this demo

  manager!: PioneerRouteManager;
  bucket!: RouteBucket;

  // eslint-disable-next-line @typescript-eslint/require-await
  async model(): Promise<unknown> {
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
