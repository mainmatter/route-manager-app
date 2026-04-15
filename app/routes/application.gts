import BaseRoute from 'use-route-manager/routes/BaseRoute';
import { LinkTo } from '@ember/routing';

export default class ApplicationRoute extends BaseRoute {
  <template>
    <LinkTo @route="index">Go home</LinkTo>
    <LinkTo @route="thing">Go to thing route</LinkTo>
    <LinkTo @route="thing.sub">Go to thing.sub route</LinkTo>

    <h1>Pioneer Route Manager Example App</h1>
    <p>This route is rendered using a route manager entirely defined inside this
      app.</p>

    {{outlet}}
  </template>
}
