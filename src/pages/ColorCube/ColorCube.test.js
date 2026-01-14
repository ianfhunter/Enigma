import { describe, it, expect } from 'vitest';
import {
  parseMove,
  inverseMove,
  applyMove,
  makeSolvedStickers,
  renderColorsFromStickers,
  isSolved,
  randomScramble,
  stickerToIndex,
  indexToSticker,
} from './ColorCube.jsx';

describe('ColorCube - move parsing and inversion', () => {
  it('parses base move and times correctly', () => {
    expect(parseMove('R')).toEqual({ base: 'R', times: 1 });
    expect(parseMove("R'")).toEqual({ base: 'R', times: 3 }); // inverse rotation
    expect(parseMove('R2')).toEqual({ base: 'R', times: 2 });
  });

  it('inverts moves as expected', () => {
    expect(inverseMove('R')).toBe("R'");
    expect(inverseMove("R'")).toBe('R');
    expect(inverseMove('R2')).toBe('R2'); // double turns are self-inverse
  });
});

describe('ColorCube - sticker mapping', () => {
  it('stickerToIndex/indexToSticker are consistent', () => {
    for (let idx = 0; idx < 54; idx++) {
      const sticker = indexToSticker(idx);
      const roundTrip = stickerToIndex(sticker);
      expect(roundTrip).toBe(idx);
    }
  });
});

describe('ColorCube - solved state detection', () => {
  it('detects solved colors from a solved sticker set', () => {
    const stickers = makeSolvedStickers();
    const colors = renderColorsFromStickers(stickers);
    expect(isSolved(colors)).toBe(true);
  });

  it('unsolved after a scramble and solved after applying inverse moves', () => {
    const solved = makeSolvedStickers();
    const scrambleMoves = ['R', "U'", 'F2', 'L', "D'", 'B2'];
    const scrambled = scrambleMoves.reduce((s, mv) => applyMove(s, mv), solved);
    const colorsScrambled = renderColorsFromStickers(scrambled);
    expect(isSolved(colorsScrambled)).toBe(false);

    const backToSolved = scrambleMoves.slice().reverse().map(inverseMove)
      .reduce((s, mv) => applyMove(s, mv), scrambled);
    const colorsBack = renderColorsFromStickers(backToSolved);
    expect(isSolved(colorsBack)).toBe(true);
  });
});

describe('ColorCube - scramble generation', () => {
  it('produces requested number of moves without repeating bases consecutively', () => {
    const moves = randomScramble(20);
    expect(moves.length).toBe(20);
    for (let i = 1; i < moves.length; i++) {
      const prevBase = moves[i - 1][0];
      const currBase = moves[i][0];
      expect(currBase).not.toBe(prevBase);
    }
  });
});
