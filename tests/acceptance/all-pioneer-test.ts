/**
 * Every route in this app is a `.gts` file backed by `PioneerRouteManager`.
 * This walks the whole route tree, including back-transitions and a sibling
 * switch, and asserts each active route is driven by that manager.
 */
import { module, test } from 'qunit';
import { visit, currentURL, getRootElement } from '@ember/test-helpers';
import type Owner from '@ember/owner';
import { setupApplicationTest } from 'use-route-manager/tests/helpers';
import { PioneerRouteManager } from 'use-route-manager/route-managers/pioneer-manager';

/** Every URL the app can be at, deepest-last. */
const ALL_ROUTES = [
  '/',
  '/demo',
  '/demo/sub',
  '/pokemon',
  '/pokemon/pikachu',
  '/pokemon/pikachu/bulbasaur',
  '/pokemon/pikachu/bulbasaur/charmander',
  '/pokemon/pikachu/bulbasaur/charmander/squirtle',
  '/classic-pokemon',
  '/classic-pokemon/pikachu',
  '/classic-pokemon/pikachu/bulbasaur',
  '/classic-pokemon/pikachu/bulbasaur/charmander',
  '/classic-pokemon/pikachu/bulbasaur/charmander/squirtle',
];

/** Deep → shallow: outlet teardown without a full rebuild. */
const BACK_TRANSITIONS = [
  '/pokemon/pikachu/bulbasaur/charmander/squirtle',
  '/pokemon/pikachu/bulbasaur/charmander',
  '/pokemon/pikachu/bulbasaur',
  '/pokemon/pikachu',
  '/pokemon',
  '/classic-pokemon/pikachu/bulbasaur/charmander/squirtle',
  '/classic-pokemon/pikachu/bulbasaur',
  '/classic-pokemon',
  '/',
];

/** Unrelated trees: the outlet chain is torn down and rebuilt. */
const SIBLING_SWITCH = [
  '/demo/sub',
  '/pokemon/pikachu',
  '/demo',
  '/pokemon/pikachu/bulbasaur',
  '/classic-pokemon/pikachu/bulbasaur',
  '/pokemon/pikachu/bulbasaur',
  '/demo/sub',
];

interface ActiveRouteInfo {
  name: string;
  manager?: object;
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

/** Constructor name, for readable failures. */
function managerName(manager: object | undefined): string {
  return manager?.constructor?.name ?? 'none';
}

/**
 * Every route template wraps itself in exactly one `div.pioneer` (or
 * `div.classic`) and renders exactly one `{{outlet}}`, so a fully rendered
 * outlet chain puts one such div on screen per active route. Counting them is
 * how we catch an outlet that resolves but renders nothing — the router is
 * perfectly happy in that case, so `currentRouteInfos` alone cannot see it.
 */
function renderedRouteLevels(): number {
  return getRootElement().querySelectorAll('div.pioneer, div.classic').length;
}

module('Acceptance | all-pioneer routing', function (hooks) {
  setupApplicationTest(hooks);

  test('every route renders and is driven by the pioneer manager', async function (assert) {
    // Asks the router directly, so a route that silently failed to load
    // cannot pass by being inert.
    const managersSeen = new Map<string, string>();
    const notPioneer: string[] = [];

    for (const url of [...ALL_ROUTES, ...BACK_TRANSITIONS, ...SIBLING_SWITCH]) {
      await visit(url);
      assert.strictEqual(currentURL(), url, `visited ${url}`);

      const active = activeRouteManagers(this.owner);

      assert.strictEqual(
        renderedRouteLevels(),
        active.length,
        `${url} rendered all ${active.length} levels of its outlet chain`
      );

      for (const { name, manager } of active) {
        managersSeen.set(name, managerName(manager));
        if (!(manager instanceof PioneerRouteManager)) {
          notPioneer.push(`${name} → ${managerName(manager)}`);
        }
      }
    }

    console.log(
      `__ROUTE_MANAGERS__ ${JSON.stringify(Object.fromEntries([...managersSeen].sort()))}`
    );

    assert.deepEqual(
      notPioneer,
      [],
      'every active route on every visit was driven by PioneerRouteManager'
    );

    for (const name of [
      'classic-pokemon',
      'classic-pokemon.pikachu',
      'classic-pokemon.pikachu.bulbasaur',
      'classic-pokemon.pikachu.bulbasaur.charmander',
      'classic-pokemon.pikachu.bulbasaur.charmander.squirtle',
    ]) {
      assert.strictEqual(
        managersSeen.get(name),
        'PioneerRouteManager',
        `${name} was actually entered, and by the pioneer manager`
      );
    }
  });
});
