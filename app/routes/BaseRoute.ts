import { setRouteManager } from '@ember/routing';
import { PioneerRouteManager } from 'use-route-manager/route-managers/pioneer-manager';
import Component from '@glimmer/component';

export interface RouteModelArgs {
  parent: Promise<unknown>;
  signal: AbortSignal;
}

export default class BaseRoute extends Component {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static model(_args: RouteModelArgs): Promise<unknown> {
    return Promise.resolve(null);
  }
}

setRouteManager((owner) => new PioneerRouteManager(owner), BaseRoute);
