import { module, test } from 'qunit';
import { visit, currentURL, getRootElement } from '@ember/test-helpers';
import type Owner from '@ember/owner';
import { setupApplicationTest } from 'use-route-manager/tests/helpers';
import { PioneerRouteManager } from 'use-route-manager/route-managers/pioneer-manager';

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

module('Acceptance | manager interop', function (hooks) {
  setupApplicationTest(hooks);

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

  // These hit pokeapi.co.
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
