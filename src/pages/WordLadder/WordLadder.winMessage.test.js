import { describe, it, expect } from 'vitest';
import { getWinMessage } from './WordLadder';

describe('WordLadder - getWinMessage', () => {
  it('returns perfect message when user matches optimal steps', () => {
    expect(getWinMessage(4, 4)).toBe('🎉 Perfect! You found the optimal path!');
  });

  it('returns excellent message when user is within two steps of optimal', () => {
    expect(getWinMessage(5, 4)).toBe('✨ Excellent work!');
    expect(getWinMessage(6, 4)).toBe('✨ Excellent work!');
  });

  it('returns made it message when user is more than two steps over optimal', () => {
    expect(getWinMessage(7, 4)).toBe('✓ You made it!');
  });
});
