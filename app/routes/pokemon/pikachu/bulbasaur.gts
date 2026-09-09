import BaseRoute, {
  type RouteModelArgs,
} from 'use-route-manager/routes/BaseRoute';
import { loadPokemon } from 'use-route-manager/utils/pokemon-api';

export const LoadingState = <template>
  <div class="pioneer">
    <h3>Loading Bulbasaur...</h3>
  </div>
</template>;

export default class BulbasaurRoute extends BaseRoute {
  static LoadingState = LoadingState;

  async model({ signal }: RouteModelArgs) {
    return {
      message: 'Hello from the bulbasaur model!',
      pokemon: await loadPokemon('bulbasaur', signal),
    };
  }

  <template>
    <div class="pioneer" data-test-route-level="pokemon.pikachu.bulbasaur">

      <h1>{{@context.pokemon.name}}</h1>

      <img
        src={{@context.pokemon.sprites.front_default}}
        alt={{@context.pokemon.name}}
      />

      {{outlet}}
    </div>
  </template>
}
