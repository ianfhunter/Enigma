import { describe, it, expect } from 'vitest';
import en from './locales/en.json';
import es from './locales/es.json';

const ISSUE_URL = 'https://github.com/ianfhunter/Enigma/issues';

describe('url translations renderable as links', () => {
  it('failedToLoadGame translations include a link wrapper with the issue URL', () => {
    expect(en.common.failedToLoadGame).toContain(`<link>${ISSUE_URL}</link>`);
    expect(es.common.failedToLoadGame).toContain(`<link>${ISSUE_URL}</link>`);
  });

  it('failedToLoadPuzzle translations include a link wrapper with the issue URL', () => {
    expect(en.common.failedToLoadPuzzle).toContain(`<link>${ISSUE_URL}</link>`);
    expect(es.common.failedToLoadPuzzle).toContain(`<link>${ISSUE_URL}</link>`);
  });
});
