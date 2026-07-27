import BaseRoute from 'use-route-manager/routes/BaseRoute';

export default class ClassicPokemonIndexRoute extends BaseRoute {
  <template>
    <div class="classic">
      <h3 data-test-classic-pokemon-index>classic-pokemon.index (pioneer)</h3>
      {{outlet}}
    </div>
  </template>
}
