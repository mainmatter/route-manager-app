import type { PokemonName } from 'use-route-manager/utils/pokemon-api';

type PokemonEndpoint = 'pokemon' | PokemonName;

function responseFor(endpoint: PokemonEndpoint): Response {
  return Response.json({
    name: endpoint,
    results: [],
    sprites: { front_default: '' },
  });
}

function deferredResponse() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

export function setupPokemonApiStub() {
  const originalFetch = globalThis.fetch;
  const requests = new Set<PokemonEndpoint>();
  const deferred = new Map<
    PokemonEndpoint,
    ReturnType<typeof deferredResponse>
  >();

  globalThis.fetch = async (input: RequestInfo | URL): Promise<Response> => {
    const url = input instanceof Request ? input.url : String(input);
    const endpoint = new URL(url).pathname.split('/').at(-1) as PokemonEndpoint;
    requests.add(endpoint);

    return (
      (await deferred.get(endpoint)?.promise)?.clone() ?? responseFor(endpoint)
    );
  };

  function resolve(endpoint: PokemonEndpoint): void {
    deferred.get(endpoint)?.resolve(responseFor(endpoint));
    deferred.delete(endpoint);
  }

  return {
    requests,

    defer(endpoint: PokemonEndpoint): void {
      deferred.set(endpoint, deferredResponse());
    },

    resolve,

    restore(): void {
      for (const endpoint of deferred.keys()) resolve(endpoint);
      globalThis.fetch = originalFetch;
    },
  };
}

export type PokemonApiStub = ReturnType<typeof setupPokemonApiStub>;
