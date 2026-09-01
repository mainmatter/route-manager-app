import { makeRouteTemplate } from '@ember/-internals/glimmer';
import type { InternalOwner } from '@ember/-internals/owner';
import type Owner from '@ember/owner';
import type {
  CreateRouteArgs,
  EnterState,
  RouteManager,
  RouteStateBucket,
} from '@ember/routing';
import { routeCapabilities } from '@ember/routing';
import { getComponentTemplate } from '@glimmer/manager';
import { tracked } from '@glimmer/tracking';
import type { ComponentLike } from '@glint/template';
import { PioneerOutlet } from 'use-route-manager/route-managers/pioneer-outlet';
import type BaseRoute from 'use-route-manager/routes/BaseRoute';

export type RouteComponent = ComponentLike<{
  Args: { context: unknown; outlet: unknown };
}>;

interface RouteModule {
  LoadingState?: RouteComponent;
}

const routeModules = import.meta.glob<RouteModule>('../routes/**/*.gts');

export class RouteBucket implements RouteStateBucket {
  @tracked loadingState: RouteComponent | undefined;

  constructor(
    readonly route: BaseRoute,
    readonly routeClass: typeof BaseRoute,
    readonly args: CreateRouteArgs
  ) {}
}

export class PioneerRouteManager implements RouteManager<RouteBucket> {
  readonly capabilities = routeCapabilities('1.0');

  readonly #owner: Owner;

  constructor(owner: Owner) {
    this.#owner = owner;
  }

  createRoute(
    routeClass: typeof BaseRoute,
    args: CreateRouteArgs
  ): RouteBucket {
    const bucket = new RouteBucket(
      new routeClass(this.#owner),
      routeClass,
      args
    );

    void this.#loadLoadingState(bucket);
    return bucket;
  }

  getDestroyable(bucket: RouteBucket): object | null {
    return bucket.route;
  }

  getRouteWrapper(): object {
    return PioneerOutlet;
  }

  willEnter(bucket: RouteBucket): void {
    console.log(`PioneerRouteManager: will enter route "${bucket.args.name}"`);
  }

  async enter(bucket: RouteBucket, state: EnterState): Promise<unknown> {
    console.log(`PioneerRouteManager: entering route "${bucket.args.name}"`);

    const routeInfo = state.to.find(({ name }) => name === bucket.args.name);
    if (!routeInfo) {
      throw new Error(
        `PioneerRouteManager: route "${bucket.args.name}" is missing from the destination route tree.`
      );
    }

    const parent = routeInfo.parent
      ? state.getAncestorPromise(routeInfo.parent)
      : Promise.resolve(undefined);

    return await bucket.route.model({ parent, signal: state.signal });
  }

  didEnter(bucket: RouteBucket): void {
    console.log(`PioneerRouteManager: did enter route "${bucket.args.name}"`);
  }

  willExit(bucket: RouteBucket): void {
    console.log(`PioneerRouteManager: will exit route "${bucket.args.name}"`);
  }

  exit(bucket: RouteBucket): void {
    console.log(`PioneerRouteManager: exiting route "${bucket.args.name}"`);
  }

  didExit(bucket: RouteBucket): void {
    console.log(`PioneerRouteManager: did exit route "${bucket.args.name}"`);
  }

  getInvokable(bucket: RouteBucket): Promise<object> {
    console.log(
      `PioneerRouteManager: getInvokable for route "${bucket.args.name}"`
    );

    const owner = this.#owner as InternalOwner;

    // Retrieve the template factory from the co-located .gts class and wrap it
    // in a RouteTemplate so it can be rendered as a component.
    const templateFactory = getComponentTemplate(bucket.routeClass);
    if (!templateFactory) {
      throw new Error(
        `PioneerRouteManager: no template found for route "${bucket.args.name}". ` +
          `Make sure the route class is defined in a .gts file with a co-located <template>.`
      );
    }

    const template = templateFactory(owner);
    return Promise.resolve(
      makeRouteTemplate(
        owner,
        bucket.args.name,
        template
      ) as unknown as RouteComponent
    );
  }

  async #loadLoadingState(bucket: RouteBucket): Promise<void> {
    const routePath = `../routes/${bucket.args.name.replace(/\./g, '/')}.gts`;
    const loadRouteModule = routeModules[routePath];

    if (!loadRouteModule) {
      return;
    }

    const routeModule = await loadRouteModule();
    bucket.loadingState = routeModule.LoadingState;
  }
}
