import BaseRoute from 'use-route-manager/routes/BaseRoute';

export default class PokemonIndexRoute extends BaseRoute {
  <template>
    <div class="pioneer">
      <h3 data-test-pokemon-index>pokemon.index (pioneer)</h3>
      {{outlet}}
    </div>
  </template>
}
