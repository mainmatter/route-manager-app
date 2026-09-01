/* eslint-disable warp-drive/no-external-request-patterns */

const POKEMON_API_URL = 'https://pokeapi.co/api/v2/pokemon';
const DEMO_DELAY_MS = 1000;

export type PokemonName = 'bulbasaur' | 'charmander' | 'pikachu' | 'squirtle';

export interface Pokemon {
  name: string;
  sprites: {
    front_default: string;
  };
}

export interface PokemonSummary {
  name: string;
  url: string;
}

async function request<T>(path = '', signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${POKEMON_API_URL}${path}`, { signal });

  if (!response.ok) {
    throw new Error(`PokéAPI request failed with status ${response.status}.`);
  }

  await new Promise((resolve) => setTimeout(resolve, DEMO_DELAY_MS));

  const data: unknown = await response.json();
  return data as T;
}

export async function loadPokemon(
  name: PokemonName,
  signal?: AbortSignal
): Promise<Pokemon> {
  return await request<Pokemon>(`/${name}`, signal);
}

export async function loadPokemonList(
  signal?: AbortSignal
): Promise<PokemonSummary[]> {
  const { results } = await request<{ results: PokemonSummary[] }>('', signal);
  return results;
}
