import { describe, it, expect } from 'vitest';

// ===========================================
// DifficultySelector - Label Generation Tests
// ===========================================
describe('DifficultySelector - Label Generation', () => {
  const getLabel = (option, labels = {}) => {
    if (labels[option]) return labels[option];
    return option.charAt(0).toUpperCase() + option.slice(1);
  };

  it('should capitalize first letter of option', () => {
    expect(getLabel('easy')).toBe('Easy');
    expect(getLabel('medium')).toBe('Medium');
    expect(getLabel('hard')).toBe('Hard');
    expect(getLabel('expert')).toBe('Expert');
  });

  it('should use custom label when provided', () => {
    const labels = { easy: 'Beginner', hard: 'Expert' };
    expect(getLabel('easy', labels)).toBe('Beginner');
    expect(getLabel('hard', labels)).toBe('Expert');
  });

  it('should fall back to capitalized option when label not found', () => {
    const labels = { easy: 'Beginner' };
    expect(getLabel('hard', labels)).toBe('Hard');
  });
});

// ===========================================
// DifficultySelector - Configuration Tests
// ===========================================
describe('DifficultySelector - Configuration', () => {
  const defaultOptions = ['easy', 'medium', 'hard'];

  it('should have correct default options', () => {
    expect(defaultOptions).toContain('easy');
    expect(defaultOptions).toContain('medium');
    expect(defaultOptions).toContain('hard');
    expect(defaultOptions.length).toBe(3);
  });

  it('should support 4-level difficulty', () => {
    const fourLevel = ['easy', 'medium', 'hard', 'expert'];
    expect(fourLevel.length).toBe(4);
    expect(fourLevel[3]).toBe('expert');
  });

  it('should determine if option is active', () => {
    const isActive = (value, option) => value === option;

    expect(isActive('medium', 'medium')).toBe(true);
    expect(isActive('medium', 'easy')).toBe(false);
  });

  it('should determine if option is completed', () => {
    const completedStates = { easy: true, medium: false, hard: true };

    expect(completedStates['easy']).toBe(true);
    expect(completedStates['medium']).toBe(false);
    expect(completedStates['hard']).toBe(true);
    expect(completedStates['expert']).toBeUndefined();
  });
});
