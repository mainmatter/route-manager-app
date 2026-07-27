/**
 * EXPERIMENT ONLY — Stage 3 primary evidence.
 * See ../../../EXPERIMENT-CLASSIC-OUTLET-USAGE.md
 *
 * Every route in this app is a `.gts` file backed by `PioneerRouteManager`.
 * This test walks the whole route tree (including back-transitions and a
 * sibling switch) and then asserts the probe ledger written by the
 * instrumented ember-source build:
 *
 *   - every `classic:*` INVOCATION probe is 0 (the `*-eval` probes are
 *     excluded: those only say the module was loaded, which always happens
 *     because `@ember/application` imports `@ember/routing/route`);
 *   - the `outlet:*` and `root-outlet:*` probes are > 0 — the outlet is the
 *     shared spine, not a classic detail;
 *   - `router:generated-route` is 0 — the tripwire proving no route fell back
 *     to the classic `route:basic`.
 */
import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import type Owner from '@ember/owner';
import { setupApplicationTest } from 'use-route-manager/tests/helpers';
import { PioneerRouteManager } from 'use-route-manager/route-managers/pioneer-manager';
import {
  classicInvocationProbes,
  dumpLedger,
  dumpStack,
  probeCount,
  probeCounts,
  probesInstalled,
  resetProbes,
} from 'use-route-manager/tests/helpers/probe';

/**
 * Every URL the app can be at, deepest-last. The `classic-pokemon` family has
 * the same shape as `pokemon` but loads waterfall-style (each level awaits its
 * parent's context before fetching); both are driven by `PioneerRouteManager`.
 */
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

/** Deep → shallow, i.e. outlet teardown without a full tree rebuild. */
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

/**
 * Unrelated trees, so the outlet chain is torn down and rebuilt — including a
 * switch between the two same-shaped pokemon families, where every level
 * changes identity at once.
 */
const SIBLING_SWITCH = [
  '/demo/sub',
  '/pokemon/pikachu',
  '/demo',
  '/pokemon/pikachu/bulbasaur',
  '/classic-pokemon/pikachu/bulbasaur',
  '/pokemon/pikachu/bulbasaur',
  '/demo/sub',
];

/**
 * Snapshot taken at test-module evaluation, i.e. after every ember-source
 * module has been evaluated but before any route has been visited. This is
 * where the "evaluated vs invoked" distinction is measured — `resetProbes()`
 * below would otherwise erase the module-scope probes.
 */
const BOOT_SNAPSHOT = probeCounts();

interface ActiveRouteInfo {
  name: string;
  manager?: object;
}

/* eslint-disable ember/no-private-routing-service */
/**
 * The manager instance router_js is actually dispatching each active route
 * through, read off `currentRouteInfos` — the same field `Router#_setOutlets`
 * destructures `{ manager, bucket }` from when it builds the outlet chain.
 */
function activeRouteManagers(owner: Owner): ActiveRouteInfo[] {
  const router = owner.lookup('router:main') as {
    _routerMicrolib?: { currentRouteInfos?: ActiveRouteInfo[] };
  };

  return router._routerMicrolib?.currentRouteInfos ?? [];
}
/* eslint-enable ember/no-private-routing-service */

/** Constructor name of whatever is driving a route, for readable failures. */
function managerName(manager: object | undefined): string {
  return manager?.constructor?.name ?? 'none';
}

module('Acceptance | EXPERIMENT all-pioneer', function (hooks) {
  setupApplicationTest(hooks);

  test('the instrumented ember-source build is in use', function (assert) {
    assert.true(
      probesInstalled(),
      'globalThis.__EMBER_CLASSIC_PROBE__ exists — probes compiled in. ' +
        'If this fails the run used the production ember-source build, where ' +
        'the DEBUG-guarded probes are compiled out; build with NODE_ENV=development.'
    );
  });

  test('the classic island is module-evaluated at boot even though it is never used', function (assert) {
    console.log(
      `__PROBE_LEDGER__ boot-snapshot ${JSON.stringify(BOOT_SNAPSHOT)}`
    );

    for (const id of [
      'classic:manager-eval',
      'classic:wrapper-eval',
      'classic:substates-eval',
      'classic:query-params-eval',
      'classic:outlet-template-eval',
    ]) {
      assert.strictEqual(
        BOOT_SNAPSHOT[id] ?? 0,
        1,
        `${id} fired once at boot (module evaluated via @ember/application → @ember/routing/route)`
      );
    }

    const bootClassicInvocations = Object.keys(BOOT_SNAPSHOT).filter(
      (id) => id.startsWith('classic:') && !id.endsWith('-eval')
    );
    assert.deepEqual(
      bootClassicInvocations,
      [],
      'no classic route-manager code was invoked during boot'
    );
  });

  test('every route renders through the outlet with no classic code invoked', async function (assert) {
    resetProbes();

    // Positive control. "No classic probe fired" is evidence of absence; this
    // asks the router directly which manager instance is driving each active
    // route, so a route that silently failed to load — or quietly resolved to
    // something else — cannot pass by being inert.
    const managersSeen = new Map<string, string>();
    const notPioneer: string[] = [];

    for (const url of [...ALL_ROUTES, ...BACK_TRANSITIONS, ...SIBLING_SWITCH]) {
      await visit(url);
      assert.strictEqual(currentURL(), url, `visited ${url}`);

      for (const { name, manager } of activeRouteManagers(this.owner)) {
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

    dumpLedger('all-pioneer');

    const counts = probeCounts();
    const classic = classicInvocationProbes();

    // Explain any surprise before asserting it away.
    for (const id of Object.keys(classic)) {
      if (classic[id]! > 0) dumpStack(id);
    }
    dumpStack('router:generated-route');

    // Evidence for the ledger's "shared spine" rows: where the outlet is first
    // entered from, in an app with no classic route at all.
    dumpStack('root-outlet:create-state');
    dumpStack('outlet:helper');
    dumpStack('outlet:component-create');

    console.log(
      `__PROBE_SUMMARY__ all-pioneer classicInvocations=${JSON.stringify(classic)} ` +
        `generatedRoutes=${counts['router:generated-route'] ?? 0}`
    );

    // --- the tripwire -------------------------------------------------------
    assert.strictEqual(
      probeCount('router:generated-route'),
      0,
      'no route was auto-generated from `route:basic` — the app really is all-pioneer'
    );

    // --- classic-only island: evaluated, never invoked -----------------------
    assert.deepEqual(
      classic,
      {},
      'no classic route-manager code was invoked at any point'
    );

    // --- shared spine: load-bearing -----------------------------------------
    assert.true(
      probeCount('root-outlet:create-state') > 0,
      'createRootOutletState ran'
    );
    assert.true(
      probeCount('root-outlet:create') > 0,
      'RootOutletManager#create ran'
    );
    assert.true(
      probeCount('outlet:helper') > 0,
      'outletHelper (classic/outlet.ts) ran'
    );
    assert.true(
      probeCount('outlet:helper-compute') > 0,
      "outletHelper's compute ref ran"
    );
    assert.true(
      probeCount('outlet:component-create') > 0,
      'OutletComponentManager#create (classic/outlet-manager.ts) ran'
    );

    // --- module evaluation still happens, and that is the point --------------
    assert.strictEqual(
      BOOT_SNAPSHOT['classic:manager-eval'] ?? 0,
      1,
      'classic/manager.ts was module-evaluated exactly once despite never being invoked'
    );
  });
});
