/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable warp-drive/no-external-request-patterns */
import BaseRoute from 'use-route-manager/routes/BaseRoute';

export const LoadingState = <template>
  <div class="pioneer">
    <h3>Loading Bulbasaur...</h3>
  </div>
</template>;

export default class ApplicationRoute extends BaseRoute {
  async model() {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon/bulbasaur');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const data = await response.json();

    return {
      message: 'Hello from the bulbasaur model!',
      pokemon: data,
    };
  }

  <template>
    <div class="pioneer">

      <h1>{{@model.pokemon.name}}</h1>

      <img
        src={{@model.pokemon.sprites.front_default}}
        alt={{@model.pokemon.name}}
      />

      {{outlet}}
    </div>
  </template>
}
