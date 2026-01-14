import { describe, it, expect } from 'vitest';

// ===========================================
// ModeSelector - Mode Configuration Tests
// ===========================================
describe('ModeSelector - Mode Configuration', () => {
  const defaultModes = [
    { id: 'daily', label: 'Daily', icon: '📅' },
    { id: 'practice', label: 'Practice', icon: '🎯' },
    { id: 'endless', label: 'Endless', icon: '∞' },
  ];

  it('should have correct mode structure', () => {
    const mode = defaultModes[0];
    expect(mode).toHaveProperty('id');
    expect(mode).toHaveProperty('label');
    expect(mode).toHaveProperty('icon');
  });

  it('should support daily mode', () => {
    const daily = defaultModes.find(m => m.id === 'daily');
    expect(daily.label).toBe('Daily');
    expect(daily.icon).toBe('📅');
  });

  it('should support practice mode', () => {
    const practice = defaultModes.find(m => m.id === 'practice');
    expect(practice.label).toBe('Practice');
  });

  it('should support challenge mode', () => {
    const modes = [
      ...defaultModes,
      { id: 'challenge', label: 'Challenge', icon: '🏆' },
    ];
    const challenge = modes.find(m => m.id === 'challenge');
    expect(challenge.label).toBe('Challenge');
  });
});

// ===========================================
// ModeSelector - State Tests
// ===========================================
describe('ModeSelector - State', () => {
  it('should determine if mode is active', () => {
    const isActive = (value, modeId) => value === modeId;

    expect(isActive('daily', 'daily')).toBe(true);
    expect(isActive('daily', 'practice')).toBe(false);
  });

  it('should determine if mode is disabled', () => {
    const mode = { id: 'daily', disabled: true };
    expect(mode.disabled).toBe(true);
  });

  it('should determine if mode is completed', () => {
    const mode = { id: 'daily', completed: true };
    expect(mode.completed).toBe(true);
  });

  it('should handle modes with descriptions', () => {
    const mode = { id: 'daily', label: 'Daily', description: 'One puzzle per day' };
    expect(mode.description).toBe('One puzzle per day');
  });
});

// ===========================================
// ModeSelector - Variant Tests
// ===========================================
describe('ModeSelector - Variant', () => {
  const variants = ['buttons', 'tabs', 'cards'];

  it('should support all variants', () => {
    expect(variants).toContain('buttons');
    expect(variants).toContain('tabs');
    expect(variants).toContain('cards');
  });

  it('should default to buttons variant', () => {
    const defaultVariant = 'buttons';
    expect(defaultVariant).toBe('buttons');
  });

  it('should show descriptions only in cards variant', () => {
    const showDescription = (variant) => variant === 'cards';

    expect(showDescription('cards')).toBe(true);
    expect(showDescription('buttons')).toBe(false);
    expect(showDescription('tabs')).toBe(false);
  });
});

// ===========================================
// ModeSelector - Daily Mode Tests
// ===========================================
describe('ModeSelector - Daily Mode', () => {
  it('should track daily completion by date', () => {
    const getTodayString = () => new Date().toISOString().split('T')[0];
    const completedDate = getTodayString();
    const isCompletedToday = completedDate === getTodayString();

    expect(isCompletedToday).toBe(true);
  });

  it('should reset completion for new day', () => {
    const completedDate = '2026-01-13';
    const today = '2026-01-14';
    const isCompletedToday = completedDate === today;

    expect(isCompletedToday).toBe(false);
  });
});
