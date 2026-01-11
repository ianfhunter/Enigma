/**
 * Build a small offline Pokémon dataset from PokéAPI.
 *
 * Output: `src/data/pokemon_min.json`
 * Schema:
 * {
 *   "generations": [
 *     { "gen": 1, "name": "generation-i", "pokemon": [{ "id": 1, "name": "bulbasaur", "types": ["grass","poison"] }, ...] },
 *     ...
 *   ],
 *   "types": ["normal", "fire", ...]
 * }
 *
 * Notes:
 * - Text-only facts (names/types/generation) so the app can run fully offline.
 * - Do NOT bundle sprites/artwork.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API = 'https://pokeapi.co/api/v2';
const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchJson(url, tries = 5) {
  let lastErr = null;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'accept': 'application/json' } });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      // backoff (pokeapi rate limiting / transient net)
      await sleep(250 * (i + 1));
    }
  }
  throw new Error(`Failed to fetch ${url}: ${lastErr?.message || lastErr}`);
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

function getIdFromUrl(url) {
  // .../pokemon/25/ -> 25
  const m = url.match(/\/(\d+)\/?$/);
  return m ? Number(m[1]) : null;
}

async function getPokemonTypes(pokemonName) {
  const normalizeTypes = (data) => {
    const types = data.types
      .slice()
      .sort((a, b) => a.slot - b.slot)
      .map(t => t.type.name);
    return { id: data.id, types };
  };

  try {
    const data = await fetchJson(`${API}/pokemon/${encodeURIComponent(pokemonName)}`, 2);
    return normalizeTypes(data);
  } catch (e) {
    // Some species names (e.g. "deoxys") don't exist as /pokemon/{species} but do as a form.
    // Fallback: resolve to the default variety via /pokemon-species/{name}.
    const species = await fetchJson(`${API}/pokemon-species/${encodeURIComponent(pokemonName)}`);
    const defaultVariety = (species.varieties || []).find(v => v.is_default) || (species.varieties || [])[0];
    const resolvedName = defaultVariety?.pokemon?.name;
    if (!resolvedName) throw e;
    const data2 = await fetchJson(`${API}/pokemon/${encodeURIComponent(resolvedName)}`);
    return normalizeTypes(data2);
  }
}

async function main() {
  const out = {
    generations: [],
    types: [],
    source: 'PokéAPI (https://pokeapi.co/)',
    generatedAt: new Date().toISOString(),
  };

  const allTypes = [];

  for (const gen of GENERATIONS) {
    const genData = await fetchJson(`${API}/generation/${gen}`);
    const species = genData.pokemon_species || [];

    // Sort by national dex number using species url id
    const speciesSorted = species
      .map(s => ({ name: s.name, speciesId: getIdFromUrl(s.url) }))
      .filter(s => typeof s.name === 'string' && s.name)
      .sort((a, b) => (a.speciesId ?? 1e9) - (b.speciesId ?? 1e9) || a.name.localeCompare(b.name));

    const pokemon = [];

    // Fetch each pokemon's types. Small delay to be gentle to PokéAPI.
    for (let i = 0; i < speciesSorted.length; i++) {
      const s = speciesSorted[i];
      const { id, types } = await getPokemonTypes(s.name);
      allTypes.push(...types);
      pokemon.push({ id, name: s.name, types });
      if ((i + 1) % 20 === 0) await sleep(150);
    }

    out.generations.push({
      gen,
      name: genData.name,
      pokemon: pokemon.sort((a, b) => a.id - b.id || a.name.localeCompare(b.name)),
    });
  }

  out.types = uniq(allTypes).sort();

  const outputPath = path.resolve(__dirname, '..', 'src', 'data', 'pokemon_min.json');
  await fs.writeFile(outputPath, `${JSON.stringify(out, null, 2)}\n`, 'utf-8');
  console.log(`Wrote generations=${out.generations.length}, pokemon=${out.generations.reduce((n,g)=>n+g.pokemon.length,0)} -> ${outputPath}`);
}

await main();

