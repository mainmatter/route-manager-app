import BaseRoute from 'use-route-manager/routes/BaseRoute';
import { LinkTo } from '@ember/routing';

export default class ApplicationRoute extends BaseRoute {
  <template>
    <LinkTo @route="index">Go home</LinkTo>
    <LinkTo @route="thing">Go to thing route</LinkTo>
    <LinkTo @route="thing.sub">Go to thing.sub route</LinkTo>
    {{outlet}}
  </template>
}
