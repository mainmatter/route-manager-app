/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable warp-drive/no-external-request-patterns */
import BaseRoute from 'use-route-manager/routes/BaseRoute';

/**
 * Formerly a classic `Route` + `app/templates/classic-pokemon*.gts`, restored
 * under `PioneerRouteManager` with a colocated template.
 *
 * The family keeps its original *loading* semantics: every route below awaits
 * its parent's context before starting its own fetch, so the tree resolves
 * level by level (waterfall) the way the classic manager did. The sibling
 * `pokemon` family does the opposite — it starts its fetch first and awaits the
 * parent afterwards (parallel). Same manager, two loading strategies.
 */
export const LoadingState = <template>
  <div class="classic">
    <h3>Loading Classic Pokemon...</h3>
  </div>
</template>;

export default class ClassicPokemonRoute extends BaseRoute {
  async model() {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const data = await response.json();

    return {
      message: 'Hello from the classic pokemon model!',
      pokemon: data.results,
    };
  }

  <template>
    <div class="classic">
      <h1 data-test-classic-pokemon>Classic Pokemon be loaded</h1>

      <p>
        {{JSON.stringify @context.pokemon null 2}}
      </p>

      {{outlet}}
    </div>
  </template>
}
