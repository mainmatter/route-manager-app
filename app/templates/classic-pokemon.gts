import type { TOC } from '@ember/component/template-only';
import type { PokemonSummary } from 'use-route-manager/utils/pokemon-api';

interface ClassicPokemonTemplateSignature {
  Args: {
    model: { pokemon: PokemonSummary[] };
  };
}

const ClassicPokemonTemplate: TOC<ClassicPokemonTemplateSignature> = <template>
  <div class="classic" data-test-route-level="classic-pokemon">
    <h1>Classic Pokemon be loaded</h1>

    <p>
      {{JSON.stringify @model.pokemon null 2}}
    </p>

    {{outlet}}
  </div>
</template>;

export default ClassicPokemonTemplate;
