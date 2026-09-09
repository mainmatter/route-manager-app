import BaseRoute, {
  type RouteModelArgs,
} from 'use-route-manager/routes/BaseRoute';
import { loadPokemon } from 'use-route-manager/utils/pokemon-api';

export const LoadingState = <template>
  <div class="pioneer">
    <h3>Loading Charmander...</h3>
  </div>
</template>;

export default class CharmanderRoute extends BaseRoute {
  static LoadingState = LoadingState;

  async model({ parent, signal }: RouteModelArgs) {
    const parentContext = await parent;
    return {
      message: 'Hello from the pokemon model!',
      pokemon: await loadPokemon('charmander', signal),
      parent: parentContext,
    };
  }

  <template>
    <div
      class="pioneer"
      data-test-route-level="pokemon.pikachu.bulbasaur.charmander"
    >

      <h1>{{@context.pokemon.name}}</h1>

      {{#if @context.parent}}
        <h2>My parent is {{@context.parent.pokemon.name}}</h2>
      {{/if}}

      <img
        src={{@context.pokemon.sprites.front_default}}
        alt={{@context.pokemon.name}}
      />

      {{outlet}}
    </div>
  </template>
}
