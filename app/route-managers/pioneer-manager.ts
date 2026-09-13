import type { InternalOwner } from '@ember/-internals/owner';
import { isDestroyed, isDestroying, destroy } from '@ember/destroyable';
import type Owner from '@ember/owner';
import type RouteInfo from '@ember/routing/route-info';
import type EmberRouter from '@ember/routing/router';
import type {
  CreateRouteArgs,
  EnterState,
  RouteManager,
  RouteStateBucket,
} from '@ember/routing';
import { routeCapabilities } from '@ember/routing';
import { cancel, scheduleOnce } from '@ember/runloop';
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

interface LoadingAttempt {
  pending: boolean;
}

const routeModules = import.meta.glob<RouteModule>('../routes/**/*.gts');

export class RouteBucket implements RouteStateBucket {
  @tracked token: object = {};

  constructor(
    readonly routeClass: typeof BaseRoute,
    readonly args: CreateRouteArgs
  ) {}
}

export class PioneerRouteManager implements RouteManager<RouteBucket> {
  readonly capabilities = routeCapabilities('1.0');

  readonly #owner: InternalOwner;
  readonly #loadingStates = new Map<string, RouteComponent>();

  constructor(owner: Owner) {
    this.#owner = owner as InternalOwner;
  }

  createRoute(
    routeClass: typeof BaseRoute,
    args: CreateRouteArgs
  ): RouteBucket {
    return new RouteBucket(
      routeClass,
      args
    );
  }

  getDestroyable(): object | null {
    return null;
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

    const loading = { pending: true };
    const showLoadingSubstate = () =>
      void this.#showLoadingSubstate(bucket, routeInfo, state, loading);
    // Match classic routes: only show a loading substate when work survives
    // the current router-transition queue.
    // eslint-disable-next-line ember/no-runloop
    const loadingTimer = scheduleOnce('routerTransitions', showLoadingSubstate);

    try {
      const model = await bucket.routeClass.model({
        owner: this.#owner,
        params: routeInfo?.params ?? {},
        queryParams: routeInfo?.queryParams ?? {},
        signal: state.signal,
        parent,
      });

      // Update the token after the model hook loaded, meaning our route is
      // ready to render. We still hook up a signal abort listener in case the
      // transition is aborted in another route.
      state.signal.throwIfAborted();

      const token = {};
      const previous = bucket.token;
      bucket.token = token;

      // Undo it if this transition never commits. Guarded on identity, so a
      // later visit that already replaced the token wins and this is a no-op.
      state.signal.addEventListener(
        'abort',
        () => {
          if (bucket.token === token) bucket.token = previous;
        },
        { once: true }
      );

      return model;
    } finally {
      loading.pending = false;
      // eslint-disable-next-line ember/no-runloop
      cancel(loadingTimer);
    }
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

    const loadingState = this.#loadingStates.get(bucket.args.name);
    if (loadingState) {
      return Promise.resolve(loadingState);
    }

    return Promise.resolve(bucket.routeClass);
  }

  async #showLoadingSubstate(
    bucket: RouteBucket,
    routeInfo: RouteInfo,
    state: EnterState,
    loading: LoadingAttempt
  ): Promise<void> {
    const routePath = `../routes/${bucket.args.name.replace(/\./g, '/')}.gts`;
    const loadRouteModule = routeModules[routePath];
    if (!loadRouteModule) {
      return;
    }

    const ancestors = [];
    for (
      let ancestor = routeInfo.parent;
      ancestor;
      ancestor = ancestor.parent
    ) {
      ancestors.push(ancestor);
    }

    let routeModule: RouteModule;
    try {
      [routeModule] = await Promise.all([
        loadRouteModule(),
        ...ancestors.map((ancestor) => state.getAncestorPromise(ancestor)),
      ]);
    } catch {
      return;
    }

    if (!routeModule.LoadingState || this.#loadingStopped(state, loading)) {
      return;
    }

    // eslint-disable-next-line ember/no-private-routing-service
    const router = this.#owner.lookup('router:main') as EmberRouter;
    const substateName = `${bucket.args.name}_loading`;
    if (!router.hasRoute(substateName)) {
      return;
    }

    const registrationName: `route:${string}` = `route:${substateName}`;
    if (!this.#owner.factoryFor(registrationName)) {
      this.#loadingStates.set(substateName, routeModule.LoadingState);
      this.#owner.register(registrationName, bucket.routeClass);
    }

    router.intermediateTransitionTo(substateName);
  }

  #loadingStopped(state: EnterState, loading: LoadingAttempt): boolean {
    return (
      !loading.pending ||
      state.signal.aborted ||
      isDestroying(this.#owner) ||
      isDestroyed(this.#owner)
    );
  }
}
