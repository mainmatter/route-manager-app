import BaseRoute from 'use-route-manager/routes/BaseRoute';
import { LinkTo } from '@ember/routing';

export const LoadingState = <template>
  <div class="pioneer">
    <h3>Loading The Application...</h3>
  </div>
</template>;

export default class ApplicationRoute extends BaseRoute {
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

      {{outlet}}
    </div>

    <br />
    <a href="https://github.com/mainmatter/route-manager-app/">GitHub</a>
  </template>
}
