import EmberObject from '@ember/object';
import type Owner from '@ember/owner';
import { setOwner } from '@ember/owner';
import { setRouteManager } from '@ember/routing';
import type EmberRouter from '@ember/routing/router';
import { PioneerRouteManager } from 'use-route-manager/route-managers/pioneer-manager';

export default class BaseRoute extends EmberObject {
  _router!: EmberRouter;
  _stashNames() {}

  constructor(owner: Owner) {
    super(owner);
    setOwner(this, owner);
    const router = owner.lookup('router:main');
    this._router = router as EmberRouter;
  }
}
setRouteManager(() => new PioneerRouteManager(), BaseRoute);
