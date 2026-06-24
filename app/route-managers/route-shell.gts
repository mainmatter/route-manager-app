import type Owner from '@ember/owner';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import type BaseRoute from 'use-route-manager/routes/BaseRoute';

// Module stable wrapper component returned by PioneerRouteManager.getRouteWrapper.
// The framework curries the per render args onto this template:
//
//   @Component  : the uncurried invokable from getInvokable
//   @model      : route.currentModel, unused by pioneer (which has no
//                 controller/currentModel); the model is sourced from the
//                 routeInfo instead
//   @controller : eagerly resolved by the outlet helper, unused by pioneer
//   @routeInfo  : the InternalRouteInfo, exposes the route via `route`, the
//                 resolved `context`, and the per render `enterPromise`
//
// The pioneer manager renders immediately (its getInvokable does not await
// enter), so the model arrives asynchronously. We read it from the
// routeInfo's enterPromise: while the promise is pending isLoading is true
// and we render the route's LoadingState (if any); once it resolves we render
// the route component with the resolved context as @model. A new transition
// rebuilds the curried wrapper with a fresh enterPromise, so the loading flag
// resets naturally.

interface RouteInfoLike {
  route: BaseRoute;
  context?: unknown;
  enterPromise?: Promise<unknown>;
}

interface RouteShellSignature {
  Args: {
    Component: object;
    model: unknown;
    controller: unknown;
    routeInfo: RouteInfoLike;
  };
}

export default class RouteShell extends Component<RouteShellSignature> {
  @tracked isLoading = true;
  @tracked model: unknown = undefined;

  constructor(owner: Owner, args: RouteShellSignature['Args']) {
    super(owner, args);

    const promise = args.routeInfo.enterPromise;

    // No enter promise means there is nothing to wait for, render the route's
    // already-resolved context immediately.
    if (promise === undefined) {
      this.model = args.model;
      this.isLoading = false;
      return;
    }

    const settle = (context: unknown) => {
      this.model = context;
      this.isLoading = false;
    };
    promise.then(settle, () => settle(undefined));
  }

  get LoadingState(): object | undefined {
    return this.args.routeInfo.route.LoadingState;
  }

  <template>
    {{#if this.LoadingState}}
      {{#if this.isLoading}}
        <this.LoadingState />
      {{else}}
        <@Component @model={{this.model}} />
      {{/if}}
    {{else}}
      <@Component @model={{this.model}} />
    {{/if}}
  </template>
}
