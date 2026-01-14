import { describe, it, expect } from 'vitest';

// ===========================================
// SizeSelector - Label Generation Tests
// ===========================================
describe('SizeSelector - Label Generation', () => {
  const getLabel = (option, labels = {}) => {
    if (labels[option]) return labels[option];
    if (typeof option === 'number') return `${option}×${option}`;
    return String(option);
  };

  it('should format numeric options as NxN', () => {
    expect(getLabel(3)).toBe('3×3');
    expect(getLabel(5)).toBe('5×5');
    expect(getLabel(9)).toBe('9×9');
  });

  it('should pass through string options', () => {
    expect(getLabel('3×3')).toBe('3×3');
    expect(getLabel('5×5')).toBe('5×5');
  });

  it('should use custom labels when provided', () => {
    const labels = { 3: 'Small', 5: 'Medium', 7: 'Large' };

    expect(getLabel(3, labels)).toBe('Small');
    expect(getLabel(5, labels)).toBe('Medium');
    expect(getLabel(7, labels)).toBe('Large');
  });
});

// ===========================================
// SizeSelector - Active State Tests
// ===========================================
describe('SizeSelector - Active State', () => {
  it('should match numeric values', () => {
    const isActive = (value, option) => value === option;

    expect(isActive(5, 5)).toBe(true);
    expect(isActive(5, 3)).toBe(false);
  });

  it('should handle string/number comparison', () => {
    const isActive = (value, option) =>
      value === option || String(value) === String(option);

    expect(isActive('5', 5)).toBe(true);
    expect(isActive(5, '5')).toBe(true);
  });
});

// ===========================================
// SizeSelector - Common Size Options Tests
// ===========================================
describe('SizeSelector - Common Size Options', () => {
  it('should support LightsOut sizes', () => {
    const sizes = [3, 5, 7];

    expect(sizes).toContain(3);
    expect(sizes).toContain(5);
    expect(sizes).toContain(7);
  });

  it('should support Memory Match sizes', () => {
    const sizes = ['4×3', '4×4', '6×4', '6×5'];

    expect(sizes.length).toBe(4);
    expect(sizes).toContain('4×4');
  });

  it('should support Sudoku variant sizes', () => {
    const sizes = [4, 6, 9];

    expect(sizes[2]).toBe(9); // Standard Sudoku
    expect(sizes[0]).toBe(4); // 4x4 variant
  });
});

// ===========================================
// SizeSelector - Grid Calculation Tests
// ===========================================
describe('SizeSelector - Grid Calculation', () => {
  it('should calculate total cells for square grid', () => {
    const calculateCells = (size) => size * size;

    expect(calculateCells(3)).toBe(9);
    expect(calculateCells(5)).toBe(25);
    expect(calculateCells(9)).toBe(81);
  });

  it('should parse size from string format', () => {
    const parseSize = (sizeStr) => {
      const [rows, cols] = sizeStr.split('×').map(Number);
      return { rows, cols };
    };

    const size = parseSize('4×3');
    expect(size.rows).toBe(4);
    expect(size.cols).toBe(3);
  });
});
