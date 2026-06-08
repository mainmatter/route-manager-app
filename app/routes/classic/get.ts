/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable warp-drive/no-external-request-patterns */
import Route from '@ember/routing/route';

export default class GetRoute extends Route {
  async model(params: Record<string, unknown>) {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${params.pokemon_id}`
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const data = await response.json();

    return Promise.resolve({
      message: 'Hello from the pokemon model!',
      pokemon: data,
    });
  }
}
