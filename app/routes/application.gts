import BaseRoute from 'use-route-manager/routes/BaseRoute';
import { LinkTo } from '@ember/routing';
import { tracked } from '@glimmer/tracking';
import type Owner from '@ember/owner';

export const LoadingState = <template>
  <div class="pioneer">
    <h3>Loading The Application...</h3>
  </div>
</template>;

export default class ApplicationRoute extends BaseRoute {
  @tracked thingy = 'Hello, this is the thingy!';

  constructor(owner: Owner) {
    super(owner);

    setInterval(() => {
      if (this.thingy.includes('Hello')) {
        this.thingy = 'This is a tracked property on the application route.';
      } else {
        this.thingy = 'Hello, this is the thingy!';
      }
    }, 2000);
  }

  async model() {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      message: 'Hello from the application model!',
    };
  }

  <template>
    <div class="pioneer">
      <LinkTo @route="index">Home</LinkTo>
      |
      <LinkTo @route="classic">Classic Route</LinkTo>
      |
      <LinkTo @route="classic.sub">Go to Sub Route</LinkTo>
      |
      <LinkTo @route="pokemon">Go to Pokemon Route</LinkTo>
      |
      <LinkTo @route="pokemon.pikachu.bulbasaur.charmander.squirtle">Go to
        Squirtle Route</LinkTo>
      |
      <LinkTo @route="classic-pokemon">Go to Classic Pokemon Route</LinkTo>
      |
      <LinkTo @route="classic-pokemon.pikachu.bulbasaur.charmander.squirtle">Go
        to Classic Squirtle Route</LinkTo>

      <h1>Pioneer Route Manager Example App</h1>
      <p>This route is rendered using a route manager entirely defined inside
        this app.</p>

      <p>Model: {{if @model.message @model.message "Loading"}}</p>

      {{this.thingy}}

      {{outlet}}
    </div>

    <br />
    <a href="https://github.com/mainmatter/route-manager-app/">GitHub</a>
  </template>
}
