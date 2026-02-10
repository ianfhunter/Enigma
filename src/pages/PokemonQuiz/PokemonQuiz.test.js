import { describe, expect, it } from 'vitest';
import { evaluatePokemonQuizGuess } from './PokemonQuiz.jsx';

describe('PokemonQuiz - evaluatePokemonQuizGuess', () => {
  const current = {
    gen: 3,
    pokemon: { name: 'gardevoir', types: ['psychic', 'fairy'] },
  };

  it('awards full points for a perfect guess', () => {
    const result = evaluatePokemonQuizGuess({
      guessGen: 3,
      guessTypes: new Set(['fairy', 'psychic']),
      current,
    });

    expect(result.correct).toBe(true);
    expect(result.genOk).toBe(true);
    expect(result.typesOk).toBe(true);
    expect(result.earnedPoints).toBe(3);
    expect(result.maxPoints).toBe(3);
    expect(result.typePoints).toBe(2);
  });

  it('awards partial credit when only one type is right', () => {
    const result = evaluatePokemonQuizGuess({
      guessGen: 1,
      guessTypes: new Set(['fairy', 'ghost']),
      current,
    });

    expect(result.correct).toBe(false);
    expect(result.genOk).toBe(false);
    expect(result.typesOk).toBe(false);
    expect(result.correctGuessedTypes).toEqual(['fairy']);
    expect(result.earnedPoints).toBe(1);
    expect(result.maxPoints).toBe(3);
  });

  it('reveals answer with zero earned points when player gives up', () => {
    const result = evaluatePokemonQuizGuess({
      guessGen: 3,
      guessTypes: new Set(['psychic', 'fairy']),
      current,
      gaveUp: true,
    });

    expect(result.gaveUp).toBe(true);
    expect(result.correct).toBe(false);
    expect(result.genOk).toBe(false);
    expect(result.typesOk).toBe(false);
    expect(result.earnedPoints).toBe(0);
    expect(result.maxPoints).toBe(3);
  });
});
