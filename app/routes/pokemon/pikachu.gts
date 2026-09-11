import BaseRoute, {
  type RouteModelArgs,
} from 'use-route-manager/routes/BaseRoute';
import { loadPokemon } from 'use-route-manager/utils/pokemon-api';

export const LoadingState = <template>
  <div class="pioneer">
    <h3>Loading Pikachu...</h3>
  </div>
</template>;

export default class PikachuRoute extends BaseRoute {
  async model({ signal }: RouteModelArgs) {
    return {
      message: 'Hello from the pokemon model!',
      pokemon: await loadPokemon('pikachu', signal),
    };
  }

  <template>
    <div class="pioneer" data-test-route-level="pokemon.pikachu">

      <h1>{{@context.pokemon.name}}</h1>

      <img
        src={{@context.pokemon.sprites.front_default}}
        alt={{@context.pokemon.name}}
      />

      {{outlet}}
    </div>
  </template>
}
