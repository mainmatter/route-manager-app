import BaseRoute from 'use-route-manager/routes/BaseRoute';

export default class CharmanderIndexRoute extends BaseRoute {
  <template>
    <div class="pioneer">
      <h3 data-test-charmander-index>pokemon.pikachu.bulbasaur.charmander.index
        (pioneer)</h3>
      {{outlet}}
    </div>
  </template>
}
