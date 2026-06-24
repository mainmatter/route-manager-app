import { capabilities } from '@ember/component';
import type Owner from '@ember/owner';
import { setRouteManager } from '@ember/routing';
import { destroy, registerDestructor } from '@glimmer/destroyable';
import {
  PioneerRouteManager,
  RouteBucket,
} from 'use-route-manager/route-managers/pioneer-manager';
import type { Constructor } from '@glimmer/component/dist/-private/base-component-manager';
import type { Arguments } from '@glimmer/interfaces/lib/runtime/arguments';
import type GlimmerComponent from '@glimmer/component/dist/-private/component';
import { setComponentManager } from '@ember/component';
import { setOwner } from '@ember/owner';

export default class BaseRoute {
  declare bucket: RouteBucket;
  declare manager: PioneerRouteManager;

  LoadingState?: object;

  constructor(protected owner: Owner) {
    setOwner(this, owner);
  }

  model(
    _parentContext: Promise<unknown>,
    _params: Record<string, unknown>
  ): unknown {
    return Promise.resolve();
  }
}

setRouteManager((owner) => new PioneerRouteManager(owner), BaseRoute);

class RouteShellComponentManager {
  capabilities = capabilities('3.13');

  private owner: Owner;

  constructor(owner: Owner) {
    this.owner = owner;
  }

  createComponent(
    ComponentClass: Constructor<GlimmerComponent>,
    args: Arguments
  ): GlimmerComponent {
    const component = new ComponentClass(this.owner, args.named);
    registerDestructor(component, () => component.willDestroy());
    return component;
  }

  getContext(component: GlimmerComponent): GlimmerComponent {
    return component;
  }

  destroyComponent(component: GlimmerComponent): void {
    destroy(component);
  }
}

setComponentManager(
  (owner: Owner) => new RouteShellComponentManager(owner),
  BaseRoute
);
