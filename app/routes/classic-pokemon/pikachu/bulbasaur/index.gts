import BaseRoute from 'use-route-manager/routes/BaseRoute';

export default class ClassicPokemonBulbasaurIndexRoute extends BaseRoute {
  <template>
    <div class="classic">
      <h3
        data-test-classic-pokemon-bulbasaur-index
      >classic-pokemon.pikachu.bulbasaur.index (pioneer)</h3>
      {{outlet}}
    </div>
  </template>
}
