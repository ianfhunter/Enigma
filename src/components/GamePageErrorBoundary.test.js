import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GamePageErrorBoundaryInner } from './GamePageErrorBoundary';
import * as reporter from '../utils/gamePageErrorReporter';

describe('gamePageErrorReporter', () => {
  const originalWindow = globalThis.window;
  const originalCustomEvent = globalThis.CustomEvent;

  beforeEach(() => {
    globalThis.CustomEvent = class CustomEvent {
      constructor(type, init) {
        this.type = type;
        this.detail = init?.detail;
      }
    };
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.CustomEvent = originalCustomEvent;
  });

  it('records a serializable payload on window and dispatches an event', () => {
    const dispatchEvent = vi.fn();
    globalThis.window = { dispatchEvent };

    const error = new Error('render blew up');
    const payload = reporter.reportGamePageError({
      slug: 'maze',
      error,
      errorInfo: { componentStack: 'at Maze' },
    });

    const bucketKey = reporter.getGamePageErrorBucketKey();

    expect(window[bucketKey]).toHaveLength(1);
    expect(window[bucketKey][0]).toMatchObject({
      slug: 'maze',
      error: {
        name: 'Error',
        message: 'render blew up',
      },
      componentStack: 'at Maze',
    });
    expect(payload.timestamp).toEqual(expect.any(Number));
    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    expect(dispatchEvent.mock.calls[0][0].type).toBe('enigma:game-page-error');
    expect(dispatchEvent.mock.calls[0][0].detail).toMatchObject({
      slug: 'maze',
      componentStack: 'at Maze',
    });
  });

  it('returns payload without touching globals when window is unavailable', () => {
    globalThis.window = undefined;

    const payload = reporter.reportGamePageError({
      slug: 'kakuro',
      error: new Error('oops'),
      errorInfo: null,
    });

    expect(payload.slug).toBe('kakuro');
    expect(payload.error.message).toBe('oops');
    expect(payload.componentStack).toBeNull();
  });
});

describe('GamePageErrorBoundaryInner', () => {
  it('switches to fallback state after an error and reports details', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fallback = vi.fn(() => ({ type: 'fallback-view' }));
    const instance = new GamePageErrorBoundaryInner({
      slug: 'sudoku',
      fallback,
      children: { type: 'children-view' },
    });

    expect(instance.render()).toEqual({ type: 'children-view' });

    const setStateSpy = vi.spyOn(instance, 'setState');
    const reporterSpy = vi.spyOn(reporter, 'reportGamePageError').mockReturnValue({
      timestamp: 123,
      error: { message: 'boom' },
      componentStack: 'at Sudoku',
    });
    const derivedState = GamePageErrorBoundaryInner.getDerivedStateFromError(new Error('boom'));
    expect(derivedState).toEqual({ hasError: true });

    instance.state = derivedState;
    const error = new Error('boom');
    const errorInfo = { componentStack: 'at Sudoku' };
    instance.componentDidCatch(error, errorInfo);

    expect(reporterSpy).toHaveBeenCalledWith({
      slug: 'sudoku',
      error,
      errorInfo,
    });
    expect(setStateSpy).toHaveBeenCalledWith({
      errorPayload: {
        timestamp: 123,
        error: { message: 'boom' },
        componentStack: 'at Sudoku',
      },
    });

    instance.state = {
      ...derivedState,
      errorPayload: {
        timestamp: 123,
      },
    };
    expect(instance.render()).toEqual({ type: 'fallback-view' });
    expect(fallback).toHaveBeenCalledWith({ timestamp: 123 });
    consoleErrorSpy.mockRestore();
  });
});
