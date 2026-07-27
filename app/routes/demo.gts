import BaseRoute from 'use-route-manager/routes/BaseRoute';

/**
 * Formerly the `classic` route (a classic `Route` + `app/templates/classic.gts`).
 * Now pioneer, so a second, shallow route tree still exists to exercise
 * sibling transitions (outlet teardown and rebuild).
 */
export default class DemoRoute extends BaseRoute {
  async model() {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return {
      name: 'Thing',
    };
  }

  <template>
    <div class="pioneer">
      <h2 data-test-demo>Hello from the demo route!</h2>

      <p>Model data is passed in as expected: {{@model.name}}</p>
      <p>No generated controller:
        {{if @controller "Unexpected" "Undefined"}}</p>

      {{outlet}}
    </div>
  </template>
}
