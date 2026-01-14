/**
 * Copyright (C) 2024 Ian Hunter
 * 
 * This file is part of Enigma and is licensed under GPL-3.0.
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { describe, it, expect } from 'vitest';
import {
  shouldUseNativeKeyboard,
  getLastTypedLetter,
  CLUES_DATA,
} from './Crossword.jsx';

const mockMatchMedia = (responses = {}) => (query) => ({
  matches: Boolean(responses[query]),
});

describe('shouldUseNativeKeyboard', () => {
  it('returns false when matchMedia is unavailable', () => {
    expect(shouldUseNativeKeyboard(null)).toBe(false);
  });

  it('returns true for small screens', () => {
    const media = mockMatchMedia({
      '(max-width: 768px)': true,
      '(pointer: coarse)': false,
    });
    expect(shouldUseNativeKeyboard(media)).toBe(true);
  });

  it('returns true for coarse pointers', () => {
    const media = mockMatchMedia({
      '(max-width: 768px)': false,
      '(pointer: coarse)': true,
    });
    expect(shouldUseNativeKeyboard(media)).toBe(true);
  });

  it('returns false when neither condition matches', () => {
    const media = mockMatchMedia({
      '(max-width: 768px)': false,
      '(pointer: coarse)': false,
    });
    expect(shouldUseNativeKeyboard(media)).toBe(false);
  });
});

describe('getLastTypedLetter', () => {
  it('returns the last letter uppercased', () => {
    expect(getLastTypedLetter('abc')).toBe('C');
    expect(getLastTypedLetter('helloZ')).toBe('Z');
  });

  it('ignores trailing whitespace', () => {
    expect(getLastTypedLetter('cross ')).toBe('S');
  });

  it('returns null for non-letters or empty input', () => {
    expect(getLastTypedLetter('')).toBeNull();
    expect(getLastTypedLetter('123')).toBeNull();
    expect(getLastTypedLetter('word1')).toBeNull();
  });
});

describe('Crossword clues dataset', () => {
  it('parses non-empty clue list with across/down entries', () => {
    // Basic sanity: data should be an array with clue entries that have numbers and directions
    expect(Array.isArray(CLUES_DATA)).toBe(true);
    expect(CLUES_DATA.length).toBeGreaterThan(0);
    const sample = CLUES_DATA[0];
    expect(sample).toHaveProperty('direction');
    expect(['across', 'down']).toContain(sample.direction);
    expect(sample).toHaveProperty('clue');
    expect(sample).toHaveProperty('answer');
    expect(sample.answer.length).toBeGreaterThan(1);
  });
});
