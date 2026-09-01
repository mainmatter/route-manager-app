import type { TOC } from '@ember/component/template-only';
import type { Pokemon } from 'use-route-manager/utils/pokemon-api';

interface ClassicPokemonTemplateSignature {
  Args: {
    model: { pokemon: Pokemon };
  };
}

const ClassicPokemonTemplate: TOC<ClassicPokemonTemplateSignature> = <template>
  <div class="classic" data-test-route-level="classic-pokemon.pikachu">
    <h1>{{@model.pokemon.name}}</h1>

    <img
      src={{@model.pokemon.sprites.front_default}}
      alt={{@model.pokemon.name}}
    />

    {{outlet}}
  </div>
</template>;

export default ClassicPokemonTemplate;
