import BaseRoute from 'use-route-manager/routes/BaseRoute';

/**
 * The application's implicit `index` route, made explicit so the router does
 * not auto-generate it from `route:basic` (which would make it classic).
 */
export default class IndexRoute extends BaseRoute {
  <template>
    <div class="pioneer">
      <h2>Index (pioneer)</h2>
      <p data-test-index>Every route in this app is driven by
        PioneerRouteManager.</p>
      {{outlet}}
    </div>
  </template>
}
