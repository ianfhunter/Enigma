import { describe, it, expect, afterEach } from 'vitest';
import { buildGamePageDebugText, buildIframeGameDebugText } from './gamePageDebugInfo';

describe('gamePageDebugInfo', () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it('buildGamePageDebugText includes browser/runtime metadata and error details', () => {
    globalThis.window = {
      navigator: {
        userAgent: 'test-agent',
        language: 'en-GB',
        platform: 'TestOS',
      },
      innerWidth: 1200,
      innerHeight: 900,
      screen: {
        width: 2560,
        height: 1440,
      },
      location: {
        href: 'https://example.com/games/sudoku',
      },
    };

    const output = buildGamePageDebugText({
      slug: 'sudoku',
      errorPayload: {
        timestamp: Date.parse('2024-01-02T03:04:05.000Z'),
        error: {
          name: 'TypeError',
          message: 'Cannot read property',
          stack: 'Error stack trace',
        },
        componentStack: 'at Sudoku',
      },
    });

    expect(output).toContain('slug: sudoku');
    expect(output).toContain('timestamp: 2024-01-02T03:04:05.000Z');
    expect(output).toContain('errorName: TypeError');
    expect(output).toContain('errorMessage: Cannot read property');
    expect(output).toContain('url: https://example.com/games/sudoku');
    expect(output).toContain('userAgent: test-agent');
    expect(output).toContain('language: en-GB');
    expect(output).toContain('platform: TestOS');
    expect(output).toContain('viewport: 1200x900');
    expect(output).toContain('screen: 2560x1440');
    expect(output).toContain('componentStack:\nat Sudoku');
  });

  it('buildIframeGameDebugText includes iframe-specific context and deterministic timestamp', () => {
    globalThis.window = {
      navigator: {
        userAgent: 'iframe-agent',
        language: 'en-US',
        platform: 'MacIntel',
      },
      innerWidth: 1024,
      innerHeight: 768,
      screen: {
        width: 1920,
        height: 1080,
      },
      location: {
        href: 'https://example.com/custom/pack-1/game-1',
      },
    };

    const output = buildIframeGameDebugText({
      packId: 'pack-1',
      gameId: 'game-1',
      gameUrl: 'https://games.example/embed',
      timestamp: Date.parse('2025-02-03T04:05:06.000Z'),
    });

    expect(output).toContain('slug: custom/pack-1/game-1');
    expect(output).toContain('timestamp: 2025-02-03T04:05:06.000Z');
    expect(output).toContain('errorName: IframeLoadError');
    expect(output).toContain('errorMessage: Iframe game failed to load or was blocked from embedding');
    expect(output).toContain('iframeUrl: https://games.example/embed');
  });
});
