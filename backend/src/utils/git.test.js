/**
 * Tests for Git Utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseGitHubUrl,
  isSemver,
  compareSemver,
} from './git.js';

describe('parseGitHubUrl', () => {
  it('parses SSH format correctly', () => {
    const result = parseGitHubUrl('git@github.com:ianfhunter/EnigmaSampleCommunityPack.git');

    expect(result).not.toBeNull();
    expect(result.owner).toBe('ianfhunter');
    expect(result.repo).toBe('EnigmaSampleCommunityPack');
    expect(result.httpsUrl).toBe('https://github.com/ianfhunter/EnigmaSampleCommunityPack.git');
    expect(result.sshUrl).toBe('git@github.com:ianfhunter/EnigmaSampleCommunityPack.git');
  });

  it('parses HTTPS format with .git correctly', () => {
    const result = parseGitHubUrl('https://github.com/ianfhunter/EnigmaSampleCommunityPack.git');

    expect(result).not.toBeNull();
    expect(result.owner).toBe('ianfhunter');
    expect(result.repo).toBe('EnigmaSampleCommunityPack');
    expect(result.httpsUrl).toBe('https://github.com/ianfhunter/EnigmaSampleCommunityPack.git');
    expect(result.sshUrl).toBe('git@github.com:ianfhunter/EnigmaSampleCommunityPack.git');
  });

  it('parses HTTPS format without .git correctly', () => {
    const result = parseGitHubUrl('https://github.com/ianfhunter/EnigmaSampleCommunityPack');

    expect(result).not.toBeNull();
    expect(result.owner).toBe('ianfhunter');
    expect(result.repo).toBe('EnigmaSampleCommunityPack');
  });

  it('parses bare format correctly', () => {
    const result = parseGitHubUrl('github.com/ianfhunter/EnigmaSampleCommunityPack');

    expect(result).not.toBeNull();
    expect(result.owner).toBe('ianfhunter');
    expect(result.repo).toBe('EnigmaSampleCommunityPack');
  });

  it('returns null for invalid URLs', () => {
    expect(parseGitHubUrl('')).toBeNull();
    expect(parseGitHubUrl(null)).toBeNull();
    expect(parseGitHubUrl(undefined)).toBeNull();
    expect(parseGitHubUrl('not-a-url')).toBeNull();
    expect(parseGitHubUrl('https://gitlab.com/user/repo')).toBeNull();
    expect(parseGitHubUrl('https://github.com/only-owner')).toBeNull();
  });

  it('handles URLs with whitespace', () => {
    const result = parseGitHubUrl('  git@github.com:owner/repo.git  ');

    expect(result).not.toBeNull();
    expect(result.owner).toBe('owner');
    expect(result.repo).toBe('repo');
  });
});

describe('isSemver', () => {
  it('accepts valid semver versions', () => {
    expect(isSemver('1.0.0')).toBe(true);
    expect(isSemver('v1.0.0')).toBe(true);
    expect(isSemver('0.1.0')).toBe(true);
    expect(isSemver('10.20.30')).toBe(true);
    expect(isSemver('1.2.3-alpha')).toBe(true);
    expect(isSemver('1.2.3-beta.1')).toBe(true);
    expect(isSemver('1.2.3+build')).toBe(true);
  });

  it('rejects invalid semver versions', () => {
    expect(isSemver('1.0')).toBe(false);
    expect(isSemver('1')).toBe(false);
    expect(isSemver('main')).toBe(false);
    expect(isSemver('release-1.0')).toBe(false);
    expect(isSemver('')).toBe(false);
  });
});

describe('compareSemver', () => {
  it('compares major versions correctly', () => {
    expect(compareSemver('2.0.0', '1.0.0')).toBe(1);
    expect(compareSemver('1.0.0', '2.0.0')).toBe(-1);
    expect(compareSemver('1.0.0', '1.0.0')).toBe(0);
  });

  it('compares minor versions correctly', () => {
    expect(compareSemver('1.2.0', '1.1.0')).toBe(1);
    expect(compareSemver('1.1.0', '1.2.0')).toBe(-1);
    expect(compareSemver('1.1.0', '1.1.0')).toBe(0);
  });

  it('compares patch versions correctly', () => {
    expect(compareSemver('1.0.2', '1.0.1')).toBe(1);
    expect(compareSemver('1.0.1', '1.0.2')).toBe(-1);
    expect(compareSemver('1.0.1', '1.0.1')).toBe(0);
  });

  it('handles v prefix', () => {
    expect(compareSemver('v2.0.0', 'v1.0.0')).toBe(1);
    expect(compareSemver('v1.0.0', '1.0.0')).toBe(0);
    expect(compareSemver('1.0.0', 'v1.0.0')).toBe(0);
  });

  it('ignores pre-release tags in comparison', () => {
    // Note: This is a simplified comparison that ignores pre-release
    expect(compareSemver('1.0.0-alpha', '1.0.0')).toBe(0);
    expect(compareSemver('1.0.0-beta', '1.0.0-alpha')).toBe(0);
  });

  it('correctly sorts an array of versions', () => {
    const versions = ['1.0.0', '2.1.0', '1.5.3', '2.0.0', 'v1.2.0'];
    const sorted = versions.sort((a, b) => compareSemver(b, a)); // Descending

    expect(sorted).toEqual(['2.1.0', '2.0.0', '1.5.3', 'v1.2.0', '1.0.0']);
  });
});
