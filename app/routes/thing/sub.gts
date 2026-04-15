import BaseRoute from 'use-route-manager/routes/BaseRoute';

export default class ThingSubRoute extends BaseRoute {
  <template>
    <div>hi from sub route</div>
    {{outlet}}
  </template>
}
