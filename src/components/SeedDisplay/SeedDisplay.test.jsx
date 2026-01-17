import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cssPath = path.resolve(__dirname, 'SeedDisplay.module.css');
const jsxPath = path.resolve(__dirname, 'SeedDisplay.jsx');

const css = readFileSync(cssPath, 'utf-8');
const jsx = readFileSync(jsxPath, 'utf-8');

describe('SeedDisplay component', () => {
  describe('CSS styles', () => {
    it('defines container styles', () => {
      expect(css).toContain('.container');
    });

    it('defines compact variant styles', () => {
      expect(css).toContain('.compact');
    });

    it('defines inline variant styles', () => {
      expect(css).toContain('.inline');
    });

    it('defines seed value styles with monospace font', () => {
      expect(css).toContain('.seedValue');
      expect(css).toMatch(/font-family.*monospace/);
    });

    it('defines action button styles', () => {
      expect(css).toContain('.actionButton');
    });

    it('defines new button styles', () => {
      expect(css).toContain('.newButton');
    });

    it('uses CSS variables for theming', () => {
      expect(css).toContain('var(--color-');
    });

    it('has hover effects for action buttons', () => {
      expect(css).toContain('.actionButton:hover');
    });

    it('has responsive styles for mobile', () => {
      expect(css).toContain('@media');
    });
  });

  describe('JSX structure', () => {
    it('exports a default component function', () => {
      expect(jsx).toMatch(/export default function SeedDisplay/);
    });

    it('exports useSeed hook', () => {
      expect(jsx).toContain('export function useSeed');
    });

    it('accepts seed prop', () => {
      expect(jsx).toContain('seed,');
    });

    it('accepts variant prop with default value', () => {
      expect(jsx).toMatch(/variant\s*=\s*['"]default['"]/);
    });

    it('accepts showCopy prop with default true', () => {
      expect(jsx).toMatch(/showCopy\s*=\s*true/);
    });

    it('accepts showShare prop with default true', () => {
      expect(jsx).toMatch(/showShare\s*=\s*true/);
    });

    it('accepts showNewButton prop', () => {
      expect(jsx).toContain('showNewButton');
    });

    it('accepts onNewSeed callback', () => {
      expect(jsx).toContain('onNewSeed');
    });

    it('handles clipboard copy', () => {
      expect(jsx).toContain('navigator.clipboard.writeText');
    });

    it('handles Web Share API', () => {
      expect(jsx).toContain('navigator.share');
    });

    it('includes copy icon', () => {
      expect(jsx).toContain('function CopyIcon');
    });

    it('includes share icon', () => {
      expect(jsx).toContain('function ShareIcon');
    });

    it('includes check icon for success state', () => {
      expect(jsx).toContain('function CheckIcon');
    });

    it('has fallback for clipboard API', () => {
      expect(jsx).toContain('document.execCommand');
    });
  });

  describe('useSeed hook', () => {
    it('checks URL for seed parameter', () => {
      expect(jsx).toContain('URLSearchParams');
      expect(jsx).toMatch(/params\.get\(['"]seed['"]\)/);
    });

    it('provides newSeed function', () => {
      expect(jsx).toContain('const newSeed = useCallback');
    });

    it('handles both numeric and string seeds from URL', () => {
      expect(jsx).toContain('parseInt(urlSeed, 10)');
      expect(jsx).toContain('hashString');
    });

    it('returns seedFromUrl flag', () => {
      expect(jsx).toContain('seedFromUrl');
    });
  });
});

describe('SeedDisplay helper functions', () => {
  describe('hashString', () => {
    it('is defined for converting strings to numeric seeds', () => {
      expect(jsx).toContain('function hashString(str)');
    });

    it('uses character codes for hashing', () => {
      expect(jsx).toContain('str.charCodeAt');
    });

    it('returns absolute value to ensure positive', () => {
      expect(jsx).toContain('Math.abs(hash)');
    });
  });

  describe('generateDefaultSeed', () => {
    it('is defined for generating date-based seeds', () => {
      expect(jsx).toContain('function generateDefaultSeed');
    });

    it('uses current date for seeding', () => {
      expect(jsx).toContain('toISOString()');
    });
  });
});

describe('SeedDisplay accessibility', () => {
  it('has aria-label on buttons', () => {
    expect(jsx).toContain('aria-label=');
  });

  it('has title attributes for tooltips', () => {
    expect(jsx).toContain('title=');
  });
});
