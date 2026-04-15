import BaseRoute from 'use-route-manager/routes/BaseRoute';

export default class ThingSubRoute extends BaseRoute {
  <template>
    <div>Hi from pioneer sub route</div>
    {{outlet}}
  </template>
}
