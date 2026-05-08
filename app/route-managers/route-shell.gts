import type Owner from '@ember/owner';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import type BaseRoute from 'use-route-manager/routes/BaseRoute';

// Module stable wrapper component returned by PioneerRouteManager.getRouteWrapper.
// The framework curries the per render args onto this template:
//
//   @Component  : the uncurried invokable from getInvokable
//   @model      : compute ref over routeInfo.context, re-renders when the
//                 route's enter resolves
//   @controller : eagerly resolved by the outlet helper, unused by pioneer
//   @routeInfo  : the InternalRouteInfo, exposes the route via `route` and
//                 the per render enterPromise
//
// Loading state is derived from routeInfo.enterPromise: while the promise
// is pending isLoading is true, once it settles we flip it to false. The
// instance is recreated whenever the framework rebuilds the curried wrapper
// (e.g. on a new transition with a new enterPromise), so the loading flag
// resets naturally.

interface RouteInfoLike {
  route: BaseRoute;
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

  constructor(owner: Owner, args: RouteShellSignature['Args']) {
    super(owner, args);
    const promise = args.routeInfo.enterPromise;
    if (promise === undefined) {
      this.isLoading = false;
      return;
    }
    const markSettled = () => {
      this.isLoading = false;
    };
    promise.then(markSettled, markSettled);
  }

  get LoadingState(): object | undefined {
    return this.args.routeInfo.route.LoadingState;
  }

  <template>
    {{#if this.LoadingState}}
      {{#if this.isLoading}}
        <this.LoadingState />
      {{else}}
        <@Component @model={{@model}} />
      {{/if}}
    {{else}}
      <@Component @model={{@model}} />
    {{/if}}
  </template>
}
