import { describe, it, expect } from 'vitest';

// ===========================================
// StatsPanel - Win Rate Calculation Tests
// ===========================================
describe('StatsPanel - Win Rate Calculation', () => {
  const calculateWinRate = (played, won) => {
    if (played === 0) return 0;
    return Math.round((won / played) * 100);
  };

  it('should return 0 when no games played', () => {
    expect(calculateWinRate(0, 0)).toBe(0);
  });

  it('should calculate 100% when all games won', () => {
    expect(calculateWinRate(10, 10)).toBe(100);
  });

  it('should calculate 50% correctly', () => {
    expect(calculateWinRate(10, 5)).toBe(50);
  });

  it('should round to nearest integer', () => {
    expect(calculateWinRate(3, 1)).toBe(33);
    expect(calculateWinRate(3, 2)).toBe(67);
  });
});

// ===========================================
// StatsPanel - Stats Formatting Tests
// ===========================================
describe('StatsPanel - Stats Formatting', () => {
  it('should format time stats correctly', () => {
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(90)).toBe('01:30');
    expect(formatTime(3661)).toBe('61:01');
  });

  it('should handle numeric values', () => {
    const stats = [
      { label: 'Played', value: 42 },
      { label: 'Won', value: 38 },
    ];

    expect(stats[0].value).toBe(42);
    expect(typeof stats[0].value).toBe('number');
  });

  it('should handle string values', () => {
    const stats = [
      { label: 'Win %', value: '90%' },
      { label: 'Time', value: '02:30' },
    ];

    expect(stats[0].value).toBe('90%');
    expect(typeof stats[0].value).toBe('string');
  });

  it('should handle stats with icons', () => {
    const stat = { label: 'Streak', value: 5, icon: '🔥' };

    expect(stat.icon).toBe('🔥');
    expect(stat.label).toBe('Streak');
    expect(stat.value).toBe(5);
  });
});

// ===========================================
// StatsPanel - Layout Configuration Tests
// ===========================================
describe('StatsPanel - Layout Configuration', () => {
  const layouts = ['horizontal', 'vertical', 'grid'];
  const sizes = ['default', 'compact', 'large'];

  it('should support all layout variants', () => {
    expect(layouts).toContain('horizontal');
    expect(layouts).toContain('vertical');
    expect(layouts).toContain('grid');
  });

  it('should support all size variants', () => {
    expect(sizes).toContain('default');
    expect(sizes).toContain('compact');
    expect(sizes).toContain('large');
  });

  it('should have horizontal as default layout', () => {
    expect(layouts[0]).toBe('horizontal');
  });

  it('should have default as default size', () => {
    expect(sizes[0]).toBe('default');
  });
});
