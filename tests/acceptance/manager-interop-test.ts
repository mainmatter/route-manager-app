/**
 * This app runs two route managers side by side: the in-app
 * `PioneerRouteManager` (every `.gts` route extending `BaseRoute`) and Ember's
 * built-in classic manager (every `.ts` route extending `Route`, plus every
 * auto-generated `index` route).
 *
 * The router being happy is not evidence that anything rendered — an outlet
 * that resolves to nothing leaves `currentRouteInfos` completely intact. So
 * each route template carries a `data-test-route-level` marker on its outermost
 * element, and we assert the exact chain of markers on screen. Auto-generated
 * `index` routes have no template of their own and render only their outlet, so
 * they contribute no marker; the expected chains below are hard-coded rather
 * than derived from `currentRouteInfos.length`.
 */
import { module, test } from 'qunit';
import { visit, currentURL, getRootElement } from '@ember/test-helpers';
import type Owner from '@ember/owner';
import { setupApplicationTest } from 'use-route-manager/tests/helpers';
import { PioneerRouteManager } from 'use-route-manager/route-managers/pioneer-manager';

/** The marker chain each URL must put on screen, outermost first. */
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

/**
 * The routes backed by a `.gts` file extending `BaseRoute`. Everything else
 * that can go active — the `classic*` `.ts` routes and every auto-generated
 * `index` — is driven by the classic manager.
 */
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
/**
 * The manager router_js is dispatching each active route through — the same
 * `{ manager, bucket }` `Router#_setOutlets` builds the outlet chain from.
 */
function activeRouteManagers(owner: Owner): ActiveRouteInfo[] {
  const router = owner.lookup('router:main') as {
    _routerMicrolib?: { currentRouteInfos?: ActiveRouteInfo[] };
  };

  return router._routerMicrolib?.currentRouteInfos ?? [];
}
/* eslint-enable ember/no-private-routing-service */

/** The markers actually on screen, in document order (outermost first). */
function renderedLevels(): string[] {
  return [...getRootElement().querySelectorAll('[data-test-route-level]')].map(
    (el) => el.getAttribute('data-test-route-level')!
  );
}

/**
 * Classify by the capability the framework itself branches on, and by identity
 * for the in-app manager. Constructor names are only ever used to describe a
 * failure, never to decide one.
 */
function managerKind(manager: ActiveRouteInfo['manager']): string {
  if (manager instanceof PioneerRouteManager) return 'pioneer';
  if (manager?.capabilities?.classicInterop === true) return 'classic';
  return `unknown(${managerName(manager)})`;
}

/** Constructor name, for readable failures. */
function managerName(manager: object | undefined): string {
  return manager?.constructor?.name ?? 'none';
}

/**
 * Assert the outlet chain rendered exactly, then assert every active route is
 * driven by the manager we expect. Returns the route names seen, so the caller
 * can prove the deep routes were genuinely entered.
 */
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

  // Kept free of network access so a pokeapi.co outage cannot redden the
  // core interop assertions.
  module('interop core', function () {
    test('the classic/pioneer mixture renders and dispatches correctly', async function (assert) {
      for (const url of ['/', '/classic', '/classic/sub']) {
        await assertUrl(assert, this.owner, url);
      }

      // /classic/sub is the load-bearing case: a pioneer leaf rendering
      // inside a classic parent's outlet.
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

      // Every pioneer route in this module's trees was actually entered, not
      // merely declared. `classic.sub` is the one pioneer route these URLs
      // never reach — the "interop core" module covers it.
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
