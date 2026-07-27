import BaseRoute from 'use-route-manager/routes/BaseRoute';

export default class DemoIndexRoute extends BaseRoute {
  <template>
    <div class="pioneer">
      <h3 data-test-demo-index>demo.index (pioneer)</h3>
      {{outlet}}
    </div>
  </template>
}
