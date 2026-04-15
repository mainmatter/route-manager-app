import BaseRoute from 'use-route-manager/routes/BaseRoute';

export default class ThingSubRoute extends BaseRoute {
  <template>
    <div class="pioneer">
      <div>Hi from pioneer sub route</div>
      {{outlet}}
    </div>
  </template>
}
