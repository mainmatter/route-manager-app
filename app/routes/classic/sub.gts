import BaseRoute from 'use-route-manager/routes/BaseRoute';

export default class ThingSubRoute extends BaseRoute {
  <template>
    <div class="pioneer">
      <h3>Hi from pioneer sub route</h3>

      <p>No model: {{if @model "Unexpected" "Undefined"}}</p>
      <p>No generated controller:
        {{if @controller "Unexpected" "Undefined"}}</p>
      {{outlet}}
    </div>
  </template>
}
