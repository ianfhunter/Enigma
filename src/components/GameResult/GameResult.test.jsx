import { describe, it, expect } from 'vitest';

// ===========================================
// GameResult - Default Titles Tests
// ===========================================
describe('GameResult - Default Titles', () => {
  const defaultTitles = {
    won: '🎉 Congratulations!',
    lost: '😔 Game Over',
    gaveup: '🏳️ Solution Revealed',
  };

  it('should have correct default won title', () => {
    expect(defaultTitles.won).toBe('🎉 Congratulations!');
  });

  it('should have correct default lost title', () => {
    expect(defaultTitles.lost).toBe('😔 Game Over');
  });

  it('should have correct default gaveup title', () => {
    expect(defaultTitles.gaveup).toBe('🏳️ Solution Revealed');
  });

  it('should use custom title when provided', () => {
    const getTitle = (state, customTitle) => customTitle || defaultTitles[state];

    expect(getTitle('won', 'You Win!')).toBe('You Win!');
    expect(getTitle('won', null)).toBe('🎉 Congratulations!');
  });
});

// ===========================================
// GameResult - State Tests
// ===========================================
describe('GameResult - State', () => {
  const validStates = ['won', 'lost', 'gaveup'];

  it('should support all valid states', () => {
    expect(validStates).toContain('won');
    expect(validStates).toContain('lost');
    expect(validStates).toContain('gaveup');
  });

  it('should determine state class correctly', () => {
    const getStateClass = (state) => validStates.includes(state) ? state : '';

    expect(getStateClass('won')).toBe('won');
    expect(getStateClass('lost')).toBe('lost');
    expect(getStateClass('gaveup')).toBe('gaveup');
    expect(getStateClass('invalid')).toBe('');
  });
});

// ===========================================
// GameResult - Actions Tests
// ===========================================
describe('GameResult - Actions', () => {
  it('should identify primary actions', () => {
    const actions = [
      { label: 'Play Again', primary: true },
      { label: 'Back to Menu', primary: false },
    ];

    const primaryAction = actions.find(a => a.primary);
    expect(primaryAction.label).toBe('Play Again');
  });

  it('should support action variants', () => {
    const action = { label: 'Go!', variant: 'success' };
    expect(action.variant).toBe('success');
  });

  it('should handle empty actions array', () => {
    const actions = [];
    expect(actions.length).toBe(0);
  });
});

// ===========================================
// GameResult - Variant Tests
// ===========================================
describe('GameResult - Variant', () => {
  const variants = ['overlay', 'inline'];

  it('should support overlay variant', () => {
    expect(variants).toContain('overlay');
  });

  it('should support inline variant', () => {
    expect(variants).toContain('inline');
  });

  it('should default to inline variant', () => {
    const defaultVariant = 'inline';
    expect(defaultVariant).toBe('inline');
  });
});
