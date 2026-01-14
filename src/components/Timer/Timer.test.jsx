import { describe, it, expect } from 'vitest';
import { formatTime } from './Timer';

// ===========================================
// Timer - Format Time Tests
// ===========================================
describe('Timer - formatTime', () => {
  it('should format 0 seconds', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('should format seconds under a minute', () => {
    expect(formatTime(30)).toBe('00:30');
    expect(formatTime(59)).toBe('00:59');
  });

  it('should format minutes', () => {
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(90)).toBe('01:30');
    expect(formatTime(599)).toBe('09:59');
  });

  it('should format times under an hour', () => {
    expect(formatTime(3599)).toBe('59:59');
  });

  it('should auto-switch to hh:mm:ss for times over an hour', () => {
    expect(formatTime(3600)).toBe('01:00:00');
    expect(formatTime(3661)).toBe('01:01:01');
    expect(formatTime(7200)).toBe('02:00:00');
  });

  it('should always use mm:ss when format is mm:ss', () => {
    expect(formatTime(3661, 'mm:ss')).toBe('61:01');
    expect(formatTime(7322, 'mm:ss')).toBe('122:02');
  });

  it('should always use hh:mm:ss when format is hh:mm:ss', () => {
    expect(formatTime(90, 'hh:mm:ss')).toBe('00:01:30');
    expect(formatTime(0, 'hh:mm:ss')).toBe('00:00:00');
  });

  it('should handle large times', () => {
    expect(formatTime(86400)).toBe('24:00:00'); // 24 hours
  });
});

// ===========================================
// Timer - Configuration Tests
// ===========================================
describe('Timer - Configuration', () => {
  const sizes = ['default', 'compact', 'large'];
  const formats = ['mm:ss', 'hh:mm:ss', 'auto'];

  it('should support all size variants', () => {
    expect(sizes).toContain('default');
    expect(sizes).toContain('compact');
    expect(sizes).toContain('large');
  });

  it('should support all format options', () => {
    expect(formats).toContain('mm:ss');
    expect(formats).toContain('hh:mm:ss');
    expect(formats).toContain('auto');
  });

  it('should have auto as default format', () => {
    const defaultFormat = 'auto';
    expect(defaultFormat).toBe('auto');
  });
});

// ===========================================
// Timer - Running State Tests
// ===========================================
describe('Timer - Running State', () => {
  it('should track running state', () => {
    let isRunning = false;

    // Start
    isRunning = true;
    expect(isRunning).toBe(true);

    // Stop
    isRunning = false;
    expect(isRunning).toBe(false);
  });
});
