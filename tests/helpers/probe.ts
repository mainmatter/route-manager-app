/**
 * EXPERIMENT ONLY — see ../../../EXPERIMENT-CLASSIC-OUTLET-USAGE.md
 *
 * Reads the side ledger written by the `recordUse` probes compiled into the
 * instrumented `ember-source` build (`@ember/-internals/routing/route-managers/probe.ts`).
 *
 * The ledger lives on `globalThis` so nothing here needs to import ember internals.
 */

export interface ProbeRecord {
  count: number;
  firstStack: string | undefined;
}

export type ProbeLedger = Record<string, ProbeRecord>;

const LEDGER_KEY = '__EMBER_CLASSIC_PROBE__';

function globalLedger(): ProbeLedger {
  const g = globalThis as unknown as Record<string, ProbeLedger | undefined>;
  let ledger = g[LEDGER_KEY];
  if (ledger === undefined) {
    ledger = Object.create(null) as ProbeLedger;
    g[LEDGER_KEY] = ledger;
  }
  return ledger;
}

/** True when the running ember-source is the instrumented build. */
export function probesInstalled(): boolean {
  const g = globalThis as unknown as Record<string, ProbeLedger | undefined>;
  return g[LEDGER_KEY] !== undefined;
}

export function resetProbes(): void {
  const g = globalThis as unknown as Record<string, ProbeLedger | undefined>;
  g[LEDGER_KEY] = Object.create(null) as ProbeLedger;
}

export function probeCounts(): Record<string, number> {
  const ledger = globalLedger();
  const out: Record<string, number> = {};
  for (const id of Object.keys(ledger)) {
    out[id] = ledger[id]!.count;
  }
  return out;
}

export function probeCount(id: string): number {
  const ledger = globalLedger();
  return ledger[id]?.count ?? 0;
}

export function firstStack(id: string): string | undefined {
  return globalLedger()[id]?.firstStack;
}

/**
 * Probe ids that mean "this module was *evaluated*". They fire on every boot
 * because `@ember/application` → `@ember/routing/route` → `classic/manager.ts`
 * pulls the whole classic island into the module graph. They are NOT evidence
 * that classic code ran.
 */
export const EVAL_PROBES = [
  'classic:manager-eval',
  'classic:wrapper-eval',
  'classic:substates-eval',
  'classic:query-params-eval',
  'classic:outlet-template-eval',
] as const;

/** Every `classic:*` probe that only fires when classic code is actually invoked. */
export function classicInvocationProbes(): Record<string, number> {
  const counts = probeCounts();
  const out: Record<string, number> = {};
  for (const id of Object.keys(counts)) {
    if (!id.startsWith('classic:')) continue;
    if ((EVAL_PROBES as readonly string[]).includes(id)) continue;
    out[id] = counts[id]!;
  }
  return out;
}

/**
 * Dump the ledger somewhere a CI run can actually read it: the browser console
 * (testem forwards it) *and* a marker line the runner greps for.
 */
export function dumpLedger(label: string): string {
  const counts = probeCounts();
  const sorted = Object.keys(counts)
    .sort()
    .reduce<Record<string, number>>((acc, k) => {
      acc[k] = counts[k]!;
      return acc;
    }, {});
  const line = `__PROBE_LEDGER__ ${label} ${JSON.stringify(sorted)}`;

  console.log(line);
  return line;
}

/** Dump the recorded first stack for a probe (used to explain surprises). */
export function dumpStack(id: string): void {
  const stack = firstStack(id);
  if (stack) {
    console.log(`__PROBE_STACK__ ${id}\n${stack}`);
  }
}
