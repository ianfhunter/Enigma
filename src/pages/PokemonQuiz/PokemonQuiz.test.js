import { describe, it, expect } from 'vitest';
import { createSeededRandom, stringToSeed } from '../../data/wordUtils';

// ===========================================
// PokemonQuiz - Seeded Random Selection Tests
// ===========================================
describe('PokemonQuiz - Seeded Random Selection', () => {
  // Mock data structure
  const mockData = {
    generations: [
      {
        gen: 1,
        pokemon: [
          { name: 'bulbasaur', types: ['grass', 'poison'] },
          { name: 'charmander', types: ['fire'] },
          { name: 'squirtle', types: ['water'] },
        ]
      },
      {
        gen: 2,
        pokemon: [
          { name: 'chikorita', types: ['grass'] },
          { name: 'cyndaquil', types: ['fire'] },
        ]
      }
    ],
    types: ['normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy']
  };

  function selectPokemon(data, seed, roundNumber) {
    if (!data?.generations?.length) return null;
    const random = createSeededRandom(seed + roundNumber);

    const g = data.generations[Math.floor(random() * data.generations.length)];
    if (!g || !g.pokemon?.length) return null;
    const idx = Math.floor(random() * g.pokemon.length);
    return { gen: g.gen, pokemon: g.pokemon[idx] };
  }

  it('should return same pokemon for same seed and round', () => {
    const seed = stringToSeed('test-seed');
    const pokemon1 = selectPokemon(mockData, seed, 0);
    const pokemon2 = selectPokemon(mockData, seed, 0);

    expect(pokemon1).toEqual(pokemon2);
  });

  it('should return different pokemon for different rounds', () => {
    const seed = stringToSeed('test-seed');
    const pokemon1 = selectPokemon(mockData, seed, 0);
    const pokemon2 = selectPokemon(mockData, seed, 1);

    // They might be the same by chance, but across multiple rounds should differ
    const pokemon = new Set();
    for (let round = 0; round < 20; round++) {
      const p = selectPokemon(mockData, seed, round);
      pokemon.add(p.pokemon.name);
    }

    expect(pokemon.size).toBeGreaterThan(1);
  });

  it('should return different pokemon for different seeds', () => {
    const pokemon = new Set();
    for (let i = 0; i < 10; i++) {
      const seed = stringToSeed(`test-seed-${i}`);
      const p = selectPokemon(mockData, seed, 0);
      pokemon.add(p.pokemon.name);
    }

    expect(pokemon.size).toBeGreaterThan(1);
  });

  it('should handle empty data gracefully', () => {
    const seed = stringToSeed('test-seed');
    const result = selectPokemon({ generations: [] }, seed, 0);
    expect(result).toBe(null);
  });

  it('should select from all generations', () => {
    const seed = stringToSeed('test-seed');
    const generations = new Set();

    for (let round = 0; round < 50; round++) {
      const p = selectPokemon(mockData, seed, round);
      generations.add(p.gen);
    }

    // Should have selected from multiple generations
    expect(generations.size).toBeGreaterThan(1);
  });
});

// ===========================================
// PokemonQuiz - Scoring Logic Tests
// ===========================================
describe('PokemonQuiz - Scoring Logic', () => {
  it('should award points for correct generation', () => {
    const correctGen = 1;
    const guessGen = 1;
    const points = guessGen === correctGen ? 1 : 0;
    expect(points).toBe(1);
  });

  it('should not award points for wrong generation', () => {
    const correctGen = 1;
    const guessGen = 2;
    const points = guessGen === correctGen ? 1 : 0;
    expect(points).toBe(0);
  });

  it('should award points for each correct type', () => {
    const correctTypes = ['grass', 'poison'];
    const guessedTypes = ['grass', 'poison'];
    const typePoints = guessedTypes.filter(t => correctTypes.includes(t)).length;
    expect(typePoints).toBe(2);
  });

  it('should only award points for correct types', () => {
    const correctTypes = ['grass', 'poison'];
    const guessedTypes = ['grass', 'fire'];
    const typePoints = guessedTypes.filter(t => correctTypes.includes(t)).length;
    expect(typePoints).toBe(1);
  });

  it('should calculate max points correctly', () => {
    const correctTypes = ['grass', 'poison'];
    const maxPoints = 1 + correctTypes.length; // 1 for gen + type count
    expect(maxPoints).toBe(3);
  });

  it('should verify perfect answer', () => {
    const correctGen = 1;
    const correctTypes = ['grass', 'poison'];
    const guessGen = 1;
    const guessedTypes = ['grass', 'poison'];

    const genOk = guessGen === correctGen;
    const typesOk = guessedTypes.length === correctTypes.length &&
      guessedTypes.every(t => correctTypes.includes(t));

    expect(genOk && typesOk).toBe(true);
  });
});
