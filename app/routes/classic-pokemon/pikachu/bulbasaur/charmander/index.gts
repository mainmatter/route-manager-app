import BaseRoute from 'use-route-manager/routes/BaseRoute';

export default class ClassicPokemonCharmanderIndexRoute extends BaseRoute {
  <template>
    <div class="classic">
      <h3
        data-test-classic-pokemon-charmander-index
      >classic-pokemon.pikachu.bulbasaur.charmander.index (pioneer)</h3>
      {{outlet}}
    </div>
  </template>
}
