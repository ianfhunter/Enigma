import { describe, it, expect } from 'vitest';
import en from './locales/en.json';
import es from './locales/es.json';

const ISSUE_URL = 'https://github.com/ianfhunter/Enigma/issues';

describe('url translations include issue urls', () => {
  it('failedToLoadGame translations include issue url text', () => {
    expect(en.common.failedToLoadGame).toContain(ISSUE_URL);
    expect(es.common.failedToLoadGame).toContain(ISSUE_URL);
  });

  it('failedToLoadPuzzle translations include issue url text', () => {
    expect(en.common.failedToLoadPuzzle).toContain(ISSUE_URL);
    expect(es.common.failedToLoadPuzzle).toContain(ISSUE_URL);
  });
});
