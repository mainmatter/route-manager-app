import BaseRoute from 'use-route-manager/routes/BaseRoute';

export default class ClassicPokemonPikachuIndexRoute extends BaseRoute {
  <template>
    <div class="classic">
      <h3 data-test-classic-pokemon-pikachu-index>classic-pokemon.pikachu.index
        (pioneer)</h3>
      {{outlet}}
    </div>
  </template>
}
