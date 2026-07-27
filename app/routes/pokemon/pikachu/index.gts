import BaseRoute from 'use-route-manager/routes/BaseRoute';

export default class PikachuIndexRoute extends BaseRoute {
  <template>
    <div class="pioneer">
      <h3 data-test-pikachu-index>pokemon.pikachu.index (pioneer)</h3>
      {{outlet}}
    </div>
  </template>
}
