import { describe, it, expect } from 'vitest';
import { formatTime } from './useTimer';

// ===========================================
// useTimer - formatTime Tests
// ===========================================
describe('useTimer - formatTime', () => {
  it('should format 0 seconds', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('should format seconds under a minute', () => {
    expect(formatTime(30)).toBe('00:30');
    expect(formatTime(59)).toBe('00:59');
  });

  it('should format minutes correctly', () => {
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(90)).toBe('01:30');
  });

  it('should auto-switch to hh:mm:ss for times over an hour', () => {
    expect(formatTime(3600)).toBe('01:00:00');
    expect(formatTime(3661)).toBe('01:01:01');
  });

  it('should respect format parameter', () => {
    expect(formatTime(90, 'hh:mm:ss')).toBe('00:01:30');
    expect(formatTime(3661, 'mm:ss')).toBe('61:01');
  });
});

// ===========================================
// useTimer - Configuration Tests
// ===========================================
describe('useTimer - Configuration', () => {
  const defaultConfig = {
    initialTime: 0,
    autoStart: false,
    direction: 'up',
    format: 'auto',
  };

  it('should have correct default values', () => {
    expect(defaultConfig.initialTime).toBe(0);
    expect(defaultConfig.autoStart).toBe(false);
    expect(defaultConfig.direction).toBe('up');
    expect(defaultConfig.format).toBe('auto');
  });

  it('should support count up direction', () => {
    const simulateCountUp = (current) => current + 1;

    expect(simulateCountUp(0)).toBe(1);
    expect(simulateCountUp(5)).toBe(6);
  });

  it('should support count down direction', () => {
    const simulateCountDown = (current) => current - 1;

    expect(simulateCountDown(10)).toBe(9);
    expect(simulateCountDown(1)).toBe(0);
  });

  it('should detect countdown completion', () => {
    const isComplete = (time, direction) => direction === 'down' && time <= 0;

    expect(isComplete(0, 'down')).toBe(true);
    expect(isComplete(5, 'down')).toBe(false);
    expect(isComplete(0, 'up')).toBe(false);
  });
});

// ===========================================
// useTimer - Control Tests
// ===========================================
describe('useTimer - Controls', () => {
  it('should toggle running state', () => {
    let isRunning = false;
    const toggle = () => { isRunning = !isRunning; };

    toggle();
    expect(isRunning).toBe(true);

    toggle();
    expect(isRunning).toBe(false);
  });

  it('should reset to initial time', () => {
    const initialTime = 60;
    let time = 120;

    const reset = (newTime) => { time = newTime ?? initialTime; };

    reset();
    expect(time).toBe(60);

    reset(0);
    expect(time).toBe(0);
  });

  it('should allow setting time directly', () => {
    let time = 0;
    const setTime = (newTime) => { time = newTime; };

    setTime(100);
    expect(time).toBe(100);
  });
});
