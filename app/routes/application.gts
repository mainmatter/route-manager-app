import BaseRoute from 'use-route-manager/routes/BaseRoute';
import { LinkTo } from '@ember/routing';

export default class ApplicationRoute extends BaseRoute {
  <template>
    <div class="pioneer">
      <LinkTo @route="index">Home</LinkTo>
      |
      <LinkTo @route="thing">Classic Route</LinkTo>
      |
      <LinkTo @route="thing.sub">Go to Sub Route</LinkTo>

      <h1>Pioneer Route Manager Example App</h1>
      <p>This route is rendered using a route manager entirely defined inside
        this app.</p>

      {{outlet}}
    </div>
  </template>
}
