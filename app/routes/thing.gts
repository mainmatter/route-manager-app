import BaseRoute from 'use-route-manager/routes/BaseRoute';

export default class ThingRoute extends BaseRoute {
  <template>
    <div>
      <h1>Hello from a Pioneer Route! </h1>
      <p>This route is rendered using a route manager entirely defined inside
        this app.</p>
      <p>No controller or model</p>

      {{outlet}}
    </div>
  </template>
}
