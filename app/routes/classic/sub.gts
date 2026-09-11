import BaseRoute from 'use-route-manager/routes/BaseRoute';

export default class ClassicSubRoute extends BaseRoute {
  <template>
    <div class="pioneer" data-test-route-level="classic.sub">
      <h3>Hi from pioneer sub route</h3>

      <p>No model: {{if @context "Unexpected" "Undefined"}}</p>
      <p>No generated controller:
        {{if @controller "Unexpected" "Undefined"}}</p>
      {{outlet}}
    </div>
  </template>
}
