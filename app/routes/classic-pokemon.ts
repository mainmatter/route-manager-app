/* eslint-disable warp-drive/no-external-request-patterns */
import Route from '@ember/routing/route';

export default class ClassicPokemonRoute extends Route {
  async model() {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const data = (await response.json()) as { results: unknown };

    return {
      message: 'Hello from the classic pokemon model!',
      pokemon: data.results,
    };
  }
}
