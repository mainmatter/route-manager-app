import Route from '@ember/routing/route';
import { loadPokemon } from 'use-route-manager/utils/pokemon-api';

export default class ClassicPokemonCharmanderRoute extends Route {
  async model() {
    return {
      message: 'Hello from the classic pokemon model!',
      pokemon: await loadPokemon('charmander'),
    };
  }
}
