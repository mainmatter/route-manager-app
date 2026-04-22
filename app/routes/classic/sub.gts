import BaseRoute from 'use-route-manager/routes/BaseRoute';
import { cached } from '@glimmer/tracking';
export default class ClassicSubRoute extends BaseRoute {
  async model() {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return null;
  }

  @cached
  get loading() {
    return <template>
      <div class="pioneer">
        <h3>Loading sub route...</h3>
      </div>
    </template>;
  }

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
