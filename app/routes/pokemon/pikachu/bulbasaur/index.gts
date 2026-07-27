import BaseRoute from 'use-route-manager/routes/BaseRoute';

export default class BulbasaurIndexRoute extends BaseRoute {
  <template>
    <div class="pioneer">
      <h3 data-test-bulbasaur-index>pokemon.pikachu.bulbasaur.index (pioneer)</h3>
      {{outlet}}
    </div>
  </template>
}
