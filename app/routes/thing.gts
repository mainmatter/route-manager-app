import BaseRoute from './BaseRoute';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';

export default class ThingRoute extends BaseRoute {
  @tracked something = 1;

  increment = () => {
    this.something++;
  };

  component = <template>
    <h1>Hello from a Pioneer Route! {{this.something}}</h1>
    <p>This route is rendered using a route manager entirely defined inside this
      app.</p>
    <button type="button" {{on "click" this.increment}}>Increment</button>
  </template>;
}
