import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  WARNING_TYPES,
  getAvailableWarningTypes,
  getWarningDefinition,
  hasActiveWarnings
} from './systemWarnings';

describe('systemWarnings utilities', () => {
  beforeEach(() => {
    const store = {};
    global.localStorage = {
      getItem: (key) => (key in store ? store[key] : null),
      setItem: (key, value) => {
        store[key] = value;
      },
      removeItem: (key) => {
        delete store[key];
      }
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true
    });
  });

  it('returns the full set of warning types', () => {
    expect(getAvailableWarningTypes()).toEqual([
      WARNING_TYPES.SAMPLE_WARNING,
      WARNING_TYPES.GIT_LFS,
      WARNING_TYPES.NEW_VERSION_AVAILABLE
    ]);
  });

  it('looks up warning definitions by type', () => {
    const definition = getWarningDefinition(WARNING_TYPES.SAMPLE_WARNING);
    expect(definition).toMatchObject({
      id: WARNING_TYPES.SAMPLE_WARNING,
      title: 'Sample Warning',
      action: 'Sample action'
    });
  });

  it('reports active warnings when checks pass', async () => {
    await expect(hasActiveWarnings([WARNING_TYPES.SAMPLE_WARNING])).resolves.toBe(true);
  });
});
