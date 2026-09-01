import { module, test } from 'qunit';
import {
  click,
  visit,
  currentURL,
  getRootElement,
  waitUntil,
} from '@ember/test-helpers';
import type Owner from '@ember/owner';
import { setupApplicationTest } from 'use-route-manager/tests/helpers';
import { PioneerRouteManager } from 'use-route-manager/route-managers/pioneer-manager';
import {
  setupPokemonApiStub,
  type PokemonApiStub,
} from 'use-route-manager/tests/helpers/pokemon-api-stub';

const EXPECTED_LEVELS: Record<string, string[]> = {
  '/': ['application'],
  '/classic': ['application', 'classic'],
  '/classic/sub': ['application', 'classic', 'classic.sub'],
  '/pokemon': ['application', 'pokemon'],
  '/pokemon/pikachu': ['application', 'pokemon', 'pokemon.pikachu'],
  '/pokemon/pikachu/bulbasaur/charmander/squirtle': [
    'application',
    'pokemon',
    'pokemon.pikachu',
    'pokemon.pikachu.bulbasaur',
    'pokemon.pikachu.bulbasaur.charmander',
    'pokemon.pikachu.bulbasaur.charmander.squirtle',
  ],
  '/classic-pokemon': ['application', 'classic-pokemon'],
  '/classic-pokemon/pikachu/bulbasaur/charmander/squirtle': [
    'application',
    'classic-pokemon',
    'classic-pokemon.pikachu',
    'classic-pokemon.pikachu.bulbasaur',
    'classic-pokemon.pikachu.bulbasaur.charmander',
    'classic-pokemon.pikachu.bulbasaur.charmander.squirtle',
  ],
};

const PIONEER_ROUTES = new Set([
  'application',
  'classic.sub',
  'pokemon',
  'pokemon.pikachu',
  'pokemon.pikachu.bulbasaur',
  'pokemon.pikachu.bulbasaur.charmander',
  'pokemon.pikachu.bulbasaur.charmander.squirtle',
]);

interface ActiveRouteInfo {
  name: string;
  manager?: { capabilities?: { classicInterop?: boolean } };
}

/* eslint-disable ember/no-private-routing-service */
function activeRouteManagers(owner: Owner): ActiveRouteInfo[] {
  const router = owner.lookup('router:main') as {
    _routerMicrolib?: { currentRouteInfos?: ActiveRouteInfo[] };
  };

  return router._routerMicrolib?.currentRouteInfos ?? [];
}
/* eslint-enable ember/no-private-routing-service */

function renderedLevels(): string[] {
  return [...getRootElement().querySelectorAll('[data-test-route-level]')].map(
    (el) => el.getAttribute('data-test-route-level')!
  );
}

function managerKind(manager: ActiveRouteInfo['manager']): string {
  if (manager instanceof PioneerRouteManager) return 'pioneer';
  if (manager?.capabilities?.classicInterop === true) return 'classic';
  return `unknown(${managerName(manager)})`;
}

function managerName(manager: object | undefined): string {
  return manager?.constructor?.name ?? 'none';
}

async function assertUrl(
  assert: Assert,
  owner: Owner,
  url: string
): Promise<string[]> {
  await visit(url);
  assert.strictEqual(currentURL(), url, `visited ${url}`);

  assert.deepEqual(
    renderedLevels(),
    EXPECTED_LEVELS[url],
    `${url} rendered its full outlet chain`
  );

  const active = activeRouteManagers(owner);
  const actual = active.map(
    ({ name, manager }) => `${name} → ${managerKind(manager)}`
  );
  const expected = active.map(
    ({ name }) =>
      `${name} → ${PIONEER_ROUTES.has(name) ? 'pioneer' : 'classic'}`
  );

  assert.deepEqual(
    actual,
    expected,
    `${url} dispatched every active route through the expected manager`
  );

  return active.map(({ name }) => name);
}

async function assertPioneerLoadingOrder(
  assert: Assert,
  pokemonApi: PokemonApiStub,
  prepare: () => Promise<void>,
  navigate: () => Promise<void>
): Promise<void> {
  pokemonApi.defer('pikachu');
  pokemonApi.defer('bulbasaur');

  try {
    await prepare();
    pokemonApi.requests.clear();

    const transitionPromise = navigate();

    await waitUntil(() => pokemonApi.requests.has('pikachu'));
    await waitUntil(() => pokemonApi.requests.has('bulbasaur'));

    assert.true(
      pokemonApi.requests.has('bulbasaur'),
      'Bulbasaur started while Pikachu was still unresolved'
    );
    assert.false(
      pokemonApi.requests.has('charmander'),
      'Charmander remained blocked on Bulbasaur'
    );

    pokemonApi.resolve('bulbasaur');

    await waitUntil(() => pokemonApi.requests.has('charmander'));
    assert.true(
      pokemonApi.requests.has('charmander'),
      'Charmander started after Bulbasaur settled, while Pikachu was still unresolved'
    );

    pokemonApi.resolve('pikachu');
    await transitionPromise;
  } finally {
    pokemonApi.resolve('bulbasaur');
    pokemonApi.resolve('pikachu');
  }
}

module('Acceptance | manager interop', function (hooks) {
  setupApplicationTest(hooks);

  let pokemonApi: PokemonApiStub;

  hooks.beforeEach(function () {
    pokemonApi = setupPokemonApiStub();
  });

  hooks.afterEach(function () {
    pokemonApi.restore();
  });

  test('the manager enters a custom loading substate before publication', async function (assert) {
    const visitPromise = visit('/');

    await waitUntil(() =>
      getRootElement().textContent?.includes('Loading The Application...')
    );
    assert.true(
      getRootElement().textContent?.includes('Loading The Application...'),
      'the custom loading substate rendered while enter was pending'
    );

    await visitPromise;
    assert.false(
      getRootElement().textContent?.includes('Loading The Application...'),
      'the published route component replaced the loading substate'
    );
  });

  test('direct visits reveal settled routes progressively', async function (assert) {
    pokemonApi.defer('pokemon');
    pokemonApi.defer('pikachu');

    try {
      const visitPromise = visit(
        '/pokemon/pikachu/bulbasaur/charmander/squirtle'
      );

      await waitUntil(
        () =>
          getRootElement().textContent?.includes('Loading The Application...'),
        { timeout: 3000 }
      );
      assert.deepEqual(
        renderedLevels(),
        [],
        'the application loading state gates every child'
      );

      await waitUntil(
        () => getRootElement().textContent?.includes('Loading Pokemon...'),
        { timeout: 3000 }
      );
      assert.deepEqual(
        renderedLevels(),
        ['application'],
        'the resolved application reveals the Pokemon loading state'
      );

      pokemonApi.resolve('pokemon');

      await waitUntil(
        () => getRootElement().textContent?.includes('Loading Pikachu...'),
        { timeout: 3000 }
      );
      assert.deepEqual(
        renderedLevels(),
        ['application', 'pokemon'],
        'the resolved Pokemon route reveals the Pikachu loading state'
      );

      pokemonApi.resolve('pikachu');
      await visitPromise;
    } finally {
      pokemonApi.resolve('pokemon');
      pokemonApi.resolve('pikachu');
    }
  });

  test('direct visits start independent routes in parallel', async function (assert) {
    await assertPioneerLoadingOrder(
      assert,
      pokemonApi,
      () => Promise.resolve(),
      () => visit('/pokemon/pikachu/bulbasaur/charmander/squirtle')
    );
  });

  test('LinkTo transitions start independent routes in parallel', async function (assert) {
    await assertPioneerLoadingOrder(
      assert,
      pokemonApi,
      () => visit('/pokemon'),
      () => click('a[href="/pokemon/pikachu/bulbasaur/charmander/squirtle"]')
    );
  });

  module('interop core', function () {
    test('the classic/pioneer mixture renders and dispatches correctly', async function (assert) {
      for (const url of ['/', '/classic', '/classic/sub']) {
        await assertUrl(assert, this.owner, url);
      }

      const active = activeRouteManagers(this.owner);
      const kinds = new Set(active.map(({ manager }) => managerKind(manager)));
      assert.true(
        kinds.has('pioneer') && kinds.has('classic'),
        `/classic/sub is genuinely mixed (saw ${[...kinds].sort().join(', ')})`
      );
    });
  });

  module('deep trees', function () {
    test('deep pioneer and classic trees render every level', async function (assert) {
      const seen = new Set<string>();

      for (const url of [
        '/pokemon',
        '/pokemon/pikachu',
        '/pokemon/pikachu/bulbasaur/charmander/squirtle',
        '/classic-pokemon',
        '/classic-pokemon/pikachu/bulbasaur/charmander/squirtle',
      ]) {
        for (const name of await assertUrl(assert, this.owner, url)) {
          seen.add(name);
        }
      }

      // `classic.sub` is the one pioneer route these URLs never reach.
      assert.deepEqual(
        [...PIONEER_ROUTES].filter(
          (name) => name !== 'classic.sub' && !seen.has(name)
        ),
        [],
        'every pioneer route in the pokemon tree was entered at least once'
      );
    });
  });
});
