import BaseRoute, {
  type RouteModelArgs,
} from 'use-route-manager/routes/BaseRoute';
import { loadPokemonList } from 'use-route-manager/utils/pokemon-api';

export const LoadingState = <template>
  <div class="pioneer">
    <h3>Loading Pokemon...</h3>
  </div>
</template>;

export default class PokemonRoute extends BaseRoute {
  static LoadingState = LoadingState;

  async model({ signal }: RouteModelArgs) {
    return {
      message: 'Hello from the pokemon model!',
      pokemon: await loadPokemonList(signal),
    };
  }

  <template>
    <div class="pioneer" data-test-route-level="pokemon">

      <h1>Pokemon be loaded</h1>

      <p>
        {{JSON.stringify @context.pokemon null 2}}
      </p>

      {{outlet}}
    </div>
  </template>
}
