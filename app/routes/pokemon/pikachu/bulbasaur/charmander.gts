/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable warp-drive/no-external-request-patterns */
import BaseRoute from 'use-route-manager/routes/BaseRoute';

export const LoadingState = <template>
  <div class="pioneer">
    <h3>Loading Charmander...</h3>
  </div>
</template>;

export default class ApplicationRoute extends BaseRoute {
  async model(parentContext: Promise<unknown>) {
    const response = await fetch(
      'https://pokeapi.co/api/v2/pokemon/charmander'
    );

    const parentContextData = await parentContext;
    console.log('charmander route has bulbasaur context', parentContextData);

    const data = await response.json();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      message: 'Hello from the pokemon model!',
      pokemon: data,
      parent: parentContextData,
    };
  }

  <template>
    <div class="pioneer">

      <h1>{{@model.pokemon.name}}</h1>

      {{#if @model.parent}}
        <h2>My parent is {{@model.parent.pokemon.name}}</h2>
      {{/if}}

      <img
        src={{@model.pokemon.sprites.front_default}}
        alt={{@model.pokemon.name}}
      />

      {{outlet}}
    </div>
  </template>
}
