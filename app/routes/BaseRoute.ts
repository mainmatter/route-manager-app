import type Owner from '@ember/owner';
import { setOwner } from '@ember/owner';
import { setRouteManager } from '@ember/routing';
import { PioneerRouteManager } from 'use-route-manager/route-managers/pioneer-manager';

export interface RouteModelArgs {
  parent: Promise<unknown>;
  signal: AbortSignal;
}

export default class BaseRoute {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  model(_args: RouteModelArgs): Promise<unknown> {
    return Promise.resolve(null);
  }

  constructor(owner: Owner) {
    setOwner(this, owner);
  }
}

setRouteManager((owner) => new PioneerRouteManager(owner), BaseRoute);
