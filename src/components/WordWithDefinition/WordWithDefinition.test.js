import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSearchUrl } from './WordWithDefinition.jsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsxPath = path.resolve(__dirname, 'WordWithDefinition.jsx');
const jsx = readFileSync(jsxPath, 'utf-8');

// ===========================================
// WordWithDefinition - getSearchUrl Tests
// ===========================================
describe('WordWithDefinition - getSearchUrl', () => {
  it('should generate Google search URL by default', () => {
    const url = getSearchUrl('apple', 'google');
    expect(url).toContain('www.google.com/search');
    expect(url).toContain('q=');
    expect(url).toContain(encodeURIComponent('define:apple'));
  });

  it('should generate Bing search URL', () => {
    const url = getSearchUrl('banana', 'bing');
    expect(url).toContain('www.bing.com/search');
    expect(url).toContain('q=');
    expect(url).toContain(encodeURIComponent('define:banana'));
  });

  it('should generate DuckDuckGo search URL', () => {
    const url = getSearchUrl('cherry', 'duckduckgo');
    expect(url).toContain('duckduckgo.com');
    expect(url).toContain('q=');
    expect(url).toContain(encodeURIComponent('define:cherry'));
  });

  it('should generate Yahoo search URL', () => {
    const url = getSearchUrl('dragon', 'yahoo');
    expect(url).toContain('search.yahoo.com/search');
    expect(url).toContain('p=');
    expect(url).toContain(encodeURIComponent('define:dragon'));
  });

  it('should generate Brave search URL', () => {
    const url = getSearchUrl('elephant', 'brave');
    expect(url).toContain('search.brave.com/search');
    expect(url).toContain('q=');
    expect(url).toContain(encodeURIComponent('define:elephant'));
  });

  it('should fall back to Google for invalid search engine', () => {
    const url = getSearchUrl('word', 'invalid');
    expect(url).toContain('www.google.com/search');
  });

  it('should fall back to Google for undefined search engine', () => {
    const url = getSearchUrl('word', undefined);
    expect(url).toContain('www.google.com/search');
  });

  it('should URL encode special characters in words', () => {
    const url = getSearchUrl('test word', 'google');
    expect(url).toContain(encodeURIComponent('define:test word'));
    expect(url).not.toContain('test word'); // Should be encoded
  });

  it('should handle words with special characters', () => {
    const url = getSearchUrl('café', 'google');
    expect(url).toContain(encodeURIComponent('define:café'));
  });

  it('should handle multi-word queries correctly', () => {
    const word = 'hello world';
    const url = getSearchUrl(word, 'google');
    const expected = `https://www.google.com/search?q=${encodeURIComponent('define:hello world')}`;
    expect(url).toBe(expected);
  });

  it('should prefix all queries with "define:"', () => {
    const engines = ['google', 'bing', 'duckduckgo', 'yahoo', 'brave'];
    const word = 'testword';
    
    engines.forEach(engine => {
      const url = getSearchUrl(word, engine);
      expect(url).toContain(encodeURIComponent('define:testword'));
    });
  });

  it('should use correct query parameter names for each engine', () => {
    // Google, Bing, DuckDuckGo, Brave use "q"
    expect(getSearchUrl('test', 'google')).toContain('q=');
    expect(getSearchUrl('test', 'bing')).toContain('q=');
    expect(getSearchUrl('test', 'duckduckgo')).toContain('q=');
    expect(getSearchUrl('test', 'brave')).toContain('q=');
    
    // Yahoo uses "p"
    expect(getSearchUrl('test', 'yahoo')).toContain('p=');
    expect(getSearchUrl('test', 'yahoo')).not.toContain('q=');
  });
});

// ===========================================
// WordWithDefinition - Component Structure Tests
// ===========================================
describe('WordWithDefinition - Component Structure', () => {
  it('exports getSearchUrl function', () => {
    expect(typeof getSearchUrl).toBe('function');
  });

  it('exports default component function', () => {
    expect(jsx).toMatch(/export default function WordWithDefinition/);
  });

  it('uses useSettings hook from SettingsContext', () => {
    expect(jsx).toContain('useSettings');
    expect(jsx).toContain('SettingsContext');
  });

  it('accepts word prop', () => {
    expect(jsx).toContain('{ word,');
  });

  it('accepts className prop with default empty string', () => {
    expect(jsx).toMatch(/className\s*=\s*['"]\s*['"]/);
  });

  it('accepts children prop', () => {
    expect(jsx).toContain('{ word, className');
    expect(jsx).toContain('children');
  });

  it('renders question mark button', () => {
    expect(jsx).toContain('?');
    expect(jsx).toContain('button');
  });

  it('has aria-label on button for accessibility', () => {
    expect(jsx).toContain('aria-label');
  });

  it('has title attribute on button', () => {
    expect(jsx).toContain('title=');
  });

  it('handles click events to open search', () => {
    expect(jsx).toContain('onClick');
    expect(jsx).toContain('window.open');
  });

  it('prevents event propagation on click', () => {
    expect(jsx).toContain('e.preventDefault');
    expect(jsx).toContain('e.stopPropagation');
  });

  it('opens search in new tab (_blank)', () => {
    expect(jsx).toContain("'_blank'");
  });
});

// ===========================================
// WordWithDefinition - Search Engine Support Tests
// ===========================================
describe('WordWithDefinition - Search Engine Support', () => {
  const supportedEngines = ['google', 'bing', 'duckduckgo', 'yahoo', 'brave'];

  it('should support all configured search engines', () => {
    const testWord = 'example';
    
    supportedEngines.forEach(engine => {
      const url = getSearchUrl(testWord, engine);
      expect(url).toBeTruthy();
      expect(typeof url).toBe('string');
      expect(url.length).toBeGreaterThan(0);
    });
  });

  it('should generate valid URLs for all engines', () => {
    const testWord = 'test';
    
    supportedEngines.forEach(engine => {
      const url = getSearchUrl(testWord, engine);
      expect(url).toMatch(/^https:\/\//);
    });
  });

  it('should have unique base URLs for each engine', () => {
    const testWord = 'word';
    const urls = supportedEngines.map(engine => getSearchUrl(testWord, engine));
    const baseUrls = urls.map(url => {
      const match = url.match(/https:\/\/[^\/]+/);
      return match ? match[0] : '';
    });

    // Each engine should have a unique base URL
    const uniqueUrls = new Set(baseUrls);
    expect(uniqueUrls.size).toBe(supportedEngines.length);
  });
});

// ===========================================
// WordWithDefinition - Edge Cases Tests
// ===========================================
describe('WordWithDefinition - Edge Cases', () => {
  it('should handle empty string word', () => {
    const url = getSearchUrl('', 'google');
    expect(url).toContain('define%3A'); // URL encoded version of "define:"
    // Verify it decodes to "define:" when decoded
    const decoded = decodeURIComponent(url.split('q=')[1]);
    expect(decoded).toContain('define:');
  });

  it('should handle very long words', () => {
    const longWord = 'a'.repeat(100);
    const url = getSearchUrl(longWord, 'google');
    expect(url).toContain(encodeURIComponent(`define:${longWord}`));
  });

  it('should handle numbers in words', () => {
    const url = getSearchUrl('word123', 'google');
    expect(url).toContain(encodeURIComponent('define:word123'));
  });

  it('should handle uppercase words', () => {
    const url = getSearchUrl('WORD', 'google');
    expect(url).toContain(encodeURIComponent('define:WORD'));
  });

  it('should handle lowercase words', () => {
    const url = getSearchUrl('word', 'google');
    expect(url).toContain(encodeURIComponent('define:word'));
  });

  it('should handle mixed case words', () => {
    const url = getSearchUrl('WoRd', 'google');
    expect(url).toContain(encodeURIComponent('define:WoRd'));
  });
});
