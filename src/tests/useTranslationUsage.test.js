import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ===========================================
// useTranslation Usage Tests
//
// These tests verify that components that import useTranslation
// actually call it. This catches the bug where:
// - Component imports useTranslation from 'react-i18next'
// - Component uses t() function somewhere in JSX
// - But component never calls useTranslation() to get the t function
//
// This is a static analysis test - it reads the source files
// and checks for the pattern.
// ===========================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Recursively get all .jsx files in a directory
function getJsxFiles(dir) {
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getJsxFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.jsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

describe('useTranslation Usage - Static Analysis', () => {
  const pagesDir = join(__dirname, '..', 'pages');
  const componentsDir = join(__dirname, '..', 'components');

  // Get all JSX files from pages and components directories
  const jsxFiles = [
    ...getJsxFiles(pagesDir),
    ...getJsxFiles(componentsDir),
  ];

  it('should find JSX files to test', () => {
    expect(jsxFiles.length).toBeGreaterThan(50);
  });

  describe('Components importing useTranslation must call it', () => {
    for (const filePath of jsxFiles) {
      const relativePath = filePath.replace(join(__dirname, '..') + '/', '');

      it(`${relativePath} - if imports useTranslation, must call it`, () => {
        const content = readFileSync(filePath, 'utf-8');

        // Check if file imports useTranslation
        const importsUseTranslation = /import\s+\{[^}]*useTranslation[^}]*\}\s+from\s+['"]react-i18next['"]/.test(content);

        if (!importsUseTranslation) {
          // File doesn't import useTranslation, nothing to check
          return;
        }

        // File imports useTranslation - verify it's called
        // Look for patterns like:
        // - const { t } = useTranslation()
        // - const { t, i18n } = useTranslation()
        // - useTranslation() at component top level
        const callsUseTranslation = /useTranslation\s*\(/.test(content);

        expect(
          callsUseTranslation,
          `${relativePath} imports useTranslation but never calls it! Add: const { t } = useTranslation();`
        ).toBe(true);

        // If file uses t() function, verify it's destructured from useTranslation
        const usesT = /\bt\s*\(\s*['"`]/.test(content);
        if (usesT) {
          // Check for proper destructuring: const { t } = useTranslation() or const { t, ... } = useTranslation()
          const destructuresT = /const\s+\{[^}]*\bt\b[^}]*\}\s*=\s*useTranslation\s*\(/.test(content);

          expect(
            destructuresT,
            `${relativePath} uses t() but doesn't destructure it from useTranslation()! Add: const { t } = useTranslation();`
          ).toBe(true);
        }
      });
    }
  });
});
