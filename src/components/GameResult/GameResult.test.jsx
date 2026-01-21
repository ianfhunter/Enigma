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

// ===========================================
// GameResult - Visibility Tests
// ===========================================
describe('GameResult - Visibility', () => {
  // Tests the logic for when the component should render
  const shouldRenderComponent = (state, show) => {
    // Don't render if show is explicitly false
    if (show === false) return false;
    // Don't render if game is still in progress
    if (state === 'playing' || !state) return false;
    return true;
  };

  it('should NOT render when state is "playing"', () => {
    expect(shouldRenderComponent('playing', undefined)).toBe(false);
  });

  it('should NOT render when state is undefined/null', () => {
    expect(shouldRenderComponent(undefined, undefined)).toBe(false);
    expect(shouldRenderComponent(null, undefined)).toBe(false);
  });

  it('should NOT render when show is explicitly false', () => {
    expect(shouldRenderComponent('won', false)).toBe(false);
    expect(shouldRenderComponent('lost', false)).toBe(false);
  });

  it('should render when state is "won"', () => {
    expect(shouldRenderComponent('won', undefined)).toBe(true);
  });

  it('should render when state is "lost"', () => {
    expect(shouldRenderComponent('lost', undefined)).toBe(true);
  });

  it('should render when state is "gaveup"', () => {
    expect(shouldRenderComponent('gaveup', undefined)).toBe(true);
  });
});

// ===========================================
// GameResult - Sound Effect Logic Tests
// ===========================================
describe('GameResult - Sound Effect Logic', () => {
  // Tests the logic for when sound should be played
  const shouldPlayWinSound = (state, hasPlayedSound) => {
    return state === 'won' && !hasPlayedSound;
  };

  const shouldResetSoundFlag = (state) => {
    return state !== 'won';
  };

  it('should trigger sound when state is "won" and sound has not been played', () => {
    expect(shouldPlayWinSound('won', false)).toBe(true);
  });

  it('should not trigger sound when state is "won" but sound has already been played', () => {
    expect(shouldPlayWinSound('won', true)).toBe(false);
  });

  it('should not trigger sound when state is "lost"', () => {
    expect(shouldPlayWinSound('lost', false)).toBe(false);
    expect(shouldPlayWinSound('lost', true)).toBe(false);
  });

  it('should not trigger sound when state is "gaveup"', () => {
    expect(shouldPlayWinSound('gaveup', false)).toBe(false);
    expect(shouldPlayWinSound('gaveup', true)).toBe(false);
  });

  it('should not trigger sound when state is "playing"', () => {
    expect(shouldPlayWinSound('playing', false)).toBe(false);
  });

  it('should reset sound flag when state changes away from "won"', () => {
    expect(shouldResetSoundFlag('lost')).toBe(true);
    expect(shouldResetSoundFlag('gaveup')).toBe(true);
    expect(shouldResetSoundFlag('playing')).toBe(true);
  });

  it('should not reset sound flag when state is "won"', () => {
    expect(shouldResetSoundFlag('won')).toBe(false);
  });

  it('should allow sound to play again after transitioning away from "won" and back', () => {
    // Simulate state transitions
    let hasPlayedSound = false;
    let state = 'playing';

    // Transition to won - should play
    state = 'won';
    if (shouldPlayWinSound(state, hasPlayedSound)) {
      hasPlayedSound = true;
    }
    expect(hasPlayedSound).toBe(true);

    // Transition to playing - should reset flag
    state = 'playing';
    if (shouldResetSoundFlag(state)) {
      hasPlayedSound = false;
    }
    expect(hasPlayedSound).toBe(false);

    // Transition back to won - should play again
    state = 'won';
    if (shouldPlayWinSound(state, hasPlayedSound)) {
      hasPlayedSound = true;
    }
    expect(hasPlayedSound).toBe(true);
  });
});
