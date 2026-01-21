import { describe, it, expect, beforeEach, vi } from 'vitest';
import i18n, { supportedLanguages } from './index';
import en from './locales/en.json';

describe('i18n configuration', () => {
  beforeEach(() => {
    // Reset to English before each test
    i18n.changeLanguage('en');
  });

  describe('initialization', () => {
    it('should initialize with English as default language', () => {
      expect(i18n.language).toBe('en');
    });

    it('should have English translations loaded', () => {
      expect(i18n.hasResourceBundle('en', 'translation')).toBe(true);
    });

    it('should fallback to English for unknown languages', async () => {
      await i18n.changeLanguage('xyz');
      // Should still be able to get translations (fallback)
      expect(i18n.t('common.giveUp')).toBe('Give Up');
    });
  });

  describe('supportedLanguages', () => {
    it('should export an array of supported languages', () => {
      expect(Array.isArray(supportedLanguages)).toBe(true);
      expect(supportedLanguages.length).toBeGreaterThan(0);
    });

    it('should include English as a supported language', () => {
      const english = supportedLanguages.find(lang => lang.code === 'en');
      expect(english).toBeDefined();
      expect(english.name).toBe('English');
      expect(english.flag).toBe('🇬🇧');
    });

    it('should have code, name, and flag for each language', () => {
      supportedLanguages.forEach(lang => {
        expect(lang).toHaveProperty('code');
        expect(lang).toHaveProperty('name');
        expect(lang).toHaveProperty('flag');
        expect(typeof lang.code).toBe('string');
        expect(typeof lang.name).toBe('string');
        expect(typeof lang.flag).toBe('string');
      });
    });
  });

  describe('translations', () => {
    it('should translate common.giveUp', () => {
      expect(i18n.t('common.giveUp')).toBe('Give Up');
    });

    it('should translate common.loading', () => {
      expect(i18n.t('common.loading')).toBe('Loading...');
    });

    it('should translate gameResult.congratulations', () => {
      expect(i18n.t('gameResult.congratulations')).toBe('🎉 Congratulations!');
    });

    it('should translate footer.selfHosted', () => {
      expect(i18n.t('footer.selfHosted')).toBe('Self-hosted puzzle collection');
    });

    it('should handle interpolation', () => {
      expect(i18n.t('common.viewAllResults', { count: 10 })).toBe('+10 more — view all results');
    });

    it('should return key for missing translations', () => {
      const result = i18n.t('nonexistent.key');
      expect(result).toBe('nonexistent.key');
    });
  });

  describe('language change', () => {
    it('should change language programmatically', async () => {
      await i18n.changeLanguage('en');
      expect(i18n.language).toBe('en');
    });
  });
});

describe('English translation file structure', () => {
  it('should have common section', () => {
    expect(en.common).toBeDefined();
    expect(typeof en.common).toBe('object');
  });

  it('should have header section', () => {
    expect(en.header).toBeDefined();
    expect(en.header.surpriseMe).toBe('Surprise Me!');
    expect(en.header.store).toBe('Store');
    expect(en.header.profile).toBe('Profile');
  });

  it('should have footer section', () => {
    expect(en.footer).toBeDefined();
    expect(en.footer.selfHosted).toBe('Self-hosted puzzle collection');
    expect(en.footer.viewOnGithub).toBe('View on GitHub');
  });

  it('should have home section', () => {
    expect(en.home).toBeDefined();
    expect(en.home.favourites).toBe('Favourites');
    expect(en.home.wantMorePuzzles).toBe('Want more puzzles?');
  });

  it('should have gameResult section', () => {
    expect(en.gameResult).toBeDefined();
    expect(en.gameResult.congratulations).toBe('🎉 Congratulations!');
    expect(en.gameResult.gameOver).toBe('😔 Game Over');
    expect(en.gameResult.solutionRevealed).toBe('🏳️ Solution Revealed');
  });

  it('should have settings section', () => {
    expect(en.settings).toBeDefined();
    expect(en.settings.theme).toBe('Theme');
    expect(en.settings.dark).toBe('Dark');
    expect(en.settings.light).toBe('Light');
    expect(en.settings.interfaceLanguage).toBe('Interface Language');
  });

  it('should have profile section', () => {
    expect(en.profile).toBeDefined();
    expect(en.profile.title).toBe('Profile');
    expect(en.profile.logOut).toBe('Log Out');
  });

  it('should have auth section', () => {
    expect(en.auth).toBeDefined();
    expect(en.auth.login).toBe('Log In');
    expect(en.auth.register).toBe('Register');
  });

  it('should have loading phrases section', () => {
    expect(en.loading).toBeDefined();
    expect(en.loading.scheming).toBe('Scheming');
    expect(en.loading.thinking).toBe('Thinking');
  });

  it('should have store section', () => {
    expect(en.store).toBeDefined();
    expect(en.store.title).toBe('Game Store');
    expect(en.store.officialPacks).toBe('Official Packs');
    expect(en.store.communityPacks).toBe('Community Packs');
  });

  describe('common section completeness', () => {
    const requiredCommonKeys = [
      'loading',
      'giveUp',
      'giveUpConfirm',
      'newGame',
      'playAgain',
      'hint',
      'cancel',
      'save',
      'delete',
      'edit',
      'back',
      'close',
      'yes',
      'no',
      'search',
      'searchGames',
      'noGamesFound',
      'games',
      'error',
      'success',
    ];

    requiredCommonKeys.forEach(key => {
      it(`should have common.${key}`, () => {
        expect(en.common[key]).toBeDefined();
        expect(typeof en.common[key]).toBe('string');
        expect(en.common[key].length).toBeGreaterThan(0);
      });
    });
  });
});
