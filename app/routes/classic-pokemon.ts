import Route from '@ember/routing/route';
import { loadPokemonList } from 'use-route-manager/utils/pokemon-api';

export default class ClassicPokemonRoute extends Route {
  async model() {
    return {
      message: 'Hello from the classic pokemon model!',
      pokemon: await loadPokemonList(),
    };
  }
}
