/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable warp-drive/no-external-request-patterns */
import BaseRoute from 'use-route-manager/routes/BaseRoute';

export const LoadingState = <template>
  <div class="pioneer">
    <h3>Loading Pokemon...</h3>
  </div>
</template>;

export default class ApplicationRoute extends BaseRoute {
  async model(ancestorPromises) {
    const response = await fetch(
      'https://pokeapi.co/api/v2/pokemon/charmander'
    );

    const parentContext = await ancestorPromises;

    const data = await response.json();
    console.log('charmander route has bulbasaur context', parentContext);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      message: 'Hello from the pokemon model!',
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
