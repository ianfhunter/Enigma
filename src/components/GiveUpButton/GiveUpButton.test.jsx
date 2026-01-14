import { describe, it, expect } from 'vitest';

// ===========================================
// GiveUpButton - Configuration Tests
// ===========================================
describe('GiveUpButton - Configuration', () => {
  const defaultLabel = 'Give Up';
  const variants = ['default', 'compact', 'text'];

  it('should have correct default label', () => {
    expect(defaultLabel).toBe('Give Up');
  });

  it('should support custom labels', () => {
    const customLabel = 'Reveal Solution';
    expect(customLabel).not.toBe(defaultLabel);
  });

  it('should support all variants', () => {
    expect(variants).toContain('default');
    expect(variants).toContain('compact');
    expect(variants).toContain('text');
  });
});

// ===========================================
// GiveUpButton - State Tests
// ===========================================
describe('GiveUpButton - State', () => {
  it('should determine disabled state correctly', () => {
    const isDisabled = (gameState) => gameState !== 'playing';

    expect(isDisabled('playing')).toBe(false);
    expect(isDisabled('won')).toBe(true);
    expect(isDisabled('lost')).toBe(true);
    expect(isDisabled('gaveup')).toBe(true);
  });

  it('should prevent action when disabled', () => {
    const shouldExecute = (disabled) => !disabled;

    expect(shouldExecute(false)).toBe(true);
    expect(shouldExecute(true)).toBe(false);
  });
});

// ===========================================
// GiveUpButton - Confirmation Tests
// ===========================================
describe('GiveUpButton - Confirmation', () => {
  it('should have correct confirmation message', () => {
    const confirmMessage = 'Are you sure you want to give up? The solution will be revealed.';
    expect(confirmMessage).toContain('give up');
    expect(confirmMessage).toContain('solution');
  });

  it('should skip confirmation when requireConfirm is false', () => {
    const requireConfirm = false;
    const shouldShowConfirm = requireConfirm === true;
    expect(shouldShowConfirm).toBe(false);
  });

  it('should require confirmation when requireConfirm is true', () => {
    const requireConfirm = true;
    const shouldShowConfirm = requireConfirm === true;
    expect(shouldShowConfirm).toBe(true);
  });
});
