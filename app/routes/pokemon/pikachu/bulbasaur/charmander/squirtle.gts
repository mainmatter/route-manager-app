import BaseRoute, {
  type RouteModelArgs,
} from 'use-route-manager/routes/BaseRoute';
import { loadPokemon } from 'use-route-manager/utils/pokemon-api';
import { LinkTo } from '@ember/routing';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { registerDestructor } from '@ember/destroyable';

function cleanup(instance) {
  console.log('SquirtleRoute destroyed', instance);
}

export const LoadingState = <template>
  <div class="pioneer">
    <h3>Loading Squirtle...</h3>
  </div>
</template>;

export default class SquirtleRoute extends BaseRoute {
  @tracked counter = 0;

  @action
  upCounter() {
    this.counter++;
  }

  constructor() {
    super(...arguments);
    console.log('SquirtleRoute constructor', {...this.args});

    registerDestructor(this, cleanup);
  }

  static async model({ parent, signal, params: { squirtle_id} }: RouteModelArgs) {
    console.log('SQUIRTLE ID: ', squirtle_id);
    return {
      message: 'Hello from the Squirtle model!',
      pokemon: await loadPokemon(squirtle_id, signal),
    };
  }

  <template>
    <div
      class="pioneer"
      data-test-route-level="pokemon.pikachu.bulbasaur.charmander.squirtle"
    >
      <LinkTo @route="pokemon.pikachu.bulbasaur.charmander.squirtle" @model="squirtle">Go to Squirtle</LinkTo>
      <LinkTo @route="pokemon.pikachu.bulbasaur.charmander.squirtle" @model="ditto">Go to Ditto</LinkTo>

      <h1>{{@context.pokemon.name}}</h1>

      <img
        src={{@context.pokemon.sprites.front_default}}
        alt={{@context.pokemon.name}}
      />

      <div>
        <p>Counter: {{this.counter}}</p>
        <button {{on "click" this.upCounter}}>Increase counter</button>
      </div>

      {{outlet}}
    </div>
  </template>
}
