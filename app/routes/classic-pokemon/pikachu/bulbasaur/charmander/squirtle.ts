/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable warp-drive/no-external-request-patterns */
import Route from '@ember/routing/route';

export default class ClassicPokemonSquirtleRoute extends Route {
  async model() {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon/squirtle');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const data = await response.json();

    return {
      message: 'Hello from the classic pokemon model!',
      pokemon: data,
    };
  }
}
