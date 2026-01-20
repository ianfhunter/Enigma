import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cssPath = path.resolve(__dirname, 'Layout.module.css');
const jsxPath = path.resolve(__dirname, 'Layout.jsx');

const layoutCss = readFileSync(cssPath, 'utf-8');
const layoutJsx = readFileSync(jsxPath, 'utf-8');

describe('Layout surprise button styles', () => {
  it('defines a surpriseText class for toggling the label', () => {
    expect(layoutCss).toContain('.surpriseText');
  });

  it('hides the surpriseText class on small screens', () => {
    expect(layoutCss).toMatch(/@media \(max-width: 640px\)[\s\S]*\.surpriseText\s*{\s*display: none;/);
  });
});

describe('Layout header markup', () => {
  it('wraps the surprise label in the surpriseText span', () => {
    expect(layoutJsx).toContain('<span className={styles.surpriseText}>Surprise Me!</span>');
  });
});

describe('Layout footer', () => {
  it('contains a GitHub link pointing to the repository', () => {
    expect(layoutJsx).toContain('href="https://github.com/ianfhunter/enigma"');
  });

  it('renders the GitHub link with proper accessibility attributes', () => {
    expect(layoutJsx).toContain('target="_blank"');
    expect(layoutJsx).toContain('rel="noopener noreferrer"');
  });

  it('has a githubLink class defined in CSS', () => {
    expect(layoutCss).toContain('.githubLink');
  });

  it('has a githubIcon class for the SVG icon', () => {
    expect(layoutCss).toContain('.githubIcon');
  });
});
