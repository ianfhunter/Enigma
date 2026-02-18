import { describe, it, expect } from 'vitest';
import { renderTranslationWithLinks } from './linkifyTranslation';

describe('renderTranslationWithLinks', () => {
  it('returns plain string when there are no links', () => {
    expect(renderTranslationWithLinks('Hello world')).toBe('Hello world');
  });

  it('converts url text into anchor nodes', () => {
    const result = renderTranslationWithLinks('File bug: https://github.com/ianfhunter/Enigma/issues');

    expect(Array.isArray(result)).toBe(true);
    const anchor = result.find(node => node?.type === 'a');
    expect(anchor).toBeTruthy();
    expect(anchor.props.href).toBe('https://github.com/ianfhunter/Enigma/issues');
    expect(anchor.props.children).toBe('https://github.com/ianfhunter/Enigma/issues');
  });
});
