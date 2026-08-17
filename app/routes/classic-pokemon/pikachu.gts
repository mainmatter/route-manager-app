/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable warp-drive/no-external-request-patterns */
import BaseRoute from 'use-route-manager/routes/BaseRoute';

export const LoadingState = <template>
  <div class="classic">
    <h3>Loading Pikachu...</h3>
  </div>
</template>;

export default class ClassicPokemonPikachuRoute extends BaseRoute {
  // Waterfall: the parent's context is awaited *before* this route's own
  // request starts, reproducing the classic manager's sequential model
  // resolution.
  async model(parentContext: Promise<unknown>) {
    await parentContext;

    const response = await fetch('https://pokeapi.co/api/v2/pokemon/pikachu');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const data = await response.json();

    return {
      message: 'Hello from the classic pokemon model!',
      pokemon: data,
    };
  }

  <template>
    <div class="classic">
      <h1>{{@context.pokemon.name}}</h1>

      <img
        src={{@context.pokemon.sprites.front_default}}
        alt={{@context.pokemon.name}}
      />

      {{outlet}}
    </div>
  </template>
}
