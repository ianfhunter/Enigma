import { describe, it, expect } from 'vitest';
import { normalize, titleCaseName } from './PokemonGenBlitz.jsx';

describe('PokemonGenBlitz - helpers', () => {
  it('normalizes names (cases, punctuation, gender symbols)', () => {
    expect(normalize(' Mr. Mime ')).toBe('mrmime');
    expect(normalize('Nidoran♀')).toBe('nidoranf');
    expect(normalize('Nidoran♂')).toBe('nidoranm');
  });

  it('titleCaseName converts API names to display', () => {
    expect(titleCaseName('mr-mime')).toBe('Mr Mime');
    expect(titleCaseName('porygon2')).toBe('Porygon2');
  });
});
