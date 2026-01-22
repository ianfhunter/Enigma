import { describe, it, expect, beforeEach, vi } from 'vitest';
import i18n, { supportedLanguages } from './index';
import en from './locales/en.json';
import es from './locales/es.json';

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

    it('should have Spanish translations loaded', () => {
      expect(i18n.hasResourceBundle('es', 'translation')).toBe(true);
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

    it('should include Spanish as a supported language', () => {
      const spanish = supportedLanguages.find(lang => lang.code === 'es');
      expect(spanish).toBeDefined();
      expect(spanish.name).toContain('Español');
      expect(spanish.flag).toBe('🇪🇸');
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

    it('should translate new common keys', () => {
      expect(i18n.t('common.comingSoon')).toBe('Coming Soon');
      expect(i18n.t('common.playNow')).toBe('Play Now');
      expect(i18n.t('common.addToFavourites')).toBe('Add to favourites');
      expect(i18n.t('common.removeFromFavourites')).toBe('Remove from favourites');
      expect(i18n.t('common.copied')).toBe('Copied!');
      expect(i18n.t('common.copySeed')).toBe('Copy seed');
      expect(i18n.t('common.sharePuzzle')).toBe('Share puzzle');
    });

    it('should translate difficulty keys', () => {
      expect(i18n.t('difficulties.easy')).toBe('Easy');
      expect(i18n.t('difficulties.medium')).toBe('Medium');
      expect(i18n.t('difficulties.hard')).toBe('Hard');
      expect(i18n.t('difficulties.expert')).toBe('Expert');
    });

    it('should translate mode keys', () => {
      expect(i18n.t('modes.daily')).toBe('Daily');
      expect(i18n.t('modes.practice')).toBe('Practice');
      expect(i18n.t('modes.endless')).toBe('Endless');
    });
  });

  describe('language change', () => {
    it('should change language programmatically', async () => {
      await i18n.changeLanguage('en');
      expect(i18n.language).toBe('en');
    });

    it('should translate to Spanish when language is changed', async () => {
      await i18n.changeLanguage('es');
      expect(i18n.t('common.giveUp')).toBe('Rendirse');
      expect(i18n.t('common.loading')).toBe('Cargando...');
      expect(i18n.t('gameResult.congratulations')).toBe('🎉 ¡Felicidades!');
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
    expect(en.auth.welcomeBack).toBe('Welcome Back');
    expect(en.auth.createAccount).toBe('Create Account');
    expect(en.auth.firstAccountAdmin).toBe('The first account created will have admin privileges.');
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

  it('should have difficulties section', () => {
    expect(en.difficulties).toBeDefined();
    expect(en.difficulties.easy).toBe('Easy');
    expect(en.difficulties.medium).toBe('Medium');
    expect(en.difficulties.hard).toBe('Hard');
    expect(en.difficulties.expert).toBe('Expert');
  });

  it('should have modes section', () => {
    expect(en.modes).toBeDefined();
    expect(en.modes.daily).toBe('Daily');
    expect(en.modes.practice).toBe('Practice');
    expect(en.modes.endless).toBe('Endless');
    expect(en.modes.challenge).toBe('Challenge');
  });

  describe('common section completeness', () => {
    const requiredCommonKeys = [
      'loading',
      'loadingPuzzle',
      'giveUp',
      'giveUpConfirm',
      'newGame',
      'newPuzzle',
      'playAgain',
      'tryAgain',
      'hint',
      'cancel',
      'save',
      'delete',
      'edit',
      'back',
      'backToGames',
      'close',
      'yes',
      'no',
      'search',
      'searchGames',
      'noGamesFound',
      'clearSearch',
      'games',
      'game',
      'viewAllResults',
      'error',
      'success',
      'settingSaved',
      'enabled',
      'disabled',
      'time',
      'seed',
      'progress',
      'settings',
      'notes',
      'clear',
      'undo',
      'comingSoon',
      'playNow',
      'addToFavourites',
      'removeFromFavourites',
      'copied',
      'copySeed',
      'shared',
      'sharePuzzle',
      'generateNewPuzzle',
      'clickToEditSeed',
      'enterSeedValue',
      'checkOutThisPuzzle',
      'tryThisPuzzle',
      'showErrors',
      'keyboardShortcuts',
      'difficulty',
      'difficultySelector',
      'completed',
      'size',
      'sizeSelector',
      'gameMode',
      'gameModeSelector',
      'unavailable',
      'gameStatistics',
      'user',
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

describe('Translation completeness across languages', () => {
  /**
   * Get all keys from an object recursively, joining nested keys with dots
   */
  function getAllKeys(obj, prefix = '') {
    let keys = [];
    for (const key of Object.keys(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        keys = keys.concat(getAllKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    return keys;
  }

  const enKeys = getAllKeys(en);
  const esKeys = getAllKeys(es);

  it('should have the same top-level sections in both languages', () => {
    const enSections = Object.keys(en).sort();
    const esSections = Object.keys(es).sort();
    expect(esSections).toEqual(enSections);
  });

  it('should have all English keys present in Spanish', () => {
    const missingInSpanish = enKeys.filter(key => !esKeys.includes(key));
    if (missingInSpanish.length > 0) {
      console.warn('Keys missing in Spanish:', missingInSpanish);
    }
    expect(missingInSpanish).toEqual([]);
  });

  it('should have all Spanish keys present in English', () => {
    const missingInEnglish = esKeys.filter(key => !enKeys.includes(key));
    if (missingInEnglish.length > 0) {
      console.warn('Keys missing in English:', missingInEnglish);
    }
    expect(missingInEnglish).toEqual([]);
  });

  it('should have translations for common UI strings', () => {
    const criticalKeys = [
      'common.loading',
      'common.giveUp',
      'common.newGame',
      'common.playAgain',
      'common.cancel',
      'common.save',
      'common.back',
      'auth.login',
      'auth.register',
      'gameResult.congratulations',
      'gameResult.gameOver',
    ];

    criticalKeys.forEach(key => {
      const [section, subKey] = key.split('.');
      expect(en[section]?.[subKey]).toBeDefined();
      expect(es[section]?.[subKey]).toBeDefined();
      // Ensure Spanish translation is different from English (actually translated)
      if (en[section]?.[subKey] && es[section]?.[subKey]) {
        // Some keys like emojis or technical terms might be the same
        // But common UI strings should be different
        const isTranslated = en[section][subKey] !== es[section][subKey] ||
          en[section][subKey].includes('🎉') || // Allow emoji-only matches
          en[section][subKey].includes('😔') ||
          en[section][subKey].includes('🏳️');
        expect(isTranslated).toBe(true);
      }
    });
  });

  it('should have same interpolation variables in both languages', () => {
    // Find keys with interpolation ({{variable}})
    const interpolationRegex = /\{\{(\w+)\}\}/g;

    enKeys.forEach(key => {
      const enValue = key.split('.').reduce((obj, k) => obj?.[k], en);
      const esValue = key.split('.').reduce((obj, k) => obj?.[k], es);

      if (typeof enValue === 'string' && typeof esValue === 'string') {
        const enVars = [...enValue.matchAll(interpolationRegex)].map(m => m[1]).sort();
        const esVars = [...esValue.matchAll(interpolationRegex)].map(m => m[1]).sort();

        if (enVars.length > 0 || esVars.length > 0) {
          expect(esVars).toEqual(enVars);
        }
      }
    });
  });
});

describe('Spanish translations quality', () => {
  it('should translate common section to Spanish', () => {
    expect(es.common.loading).toBe('Cargando...');
    expect(es.common.giveUp).toBe('Rendirse');
    expect(es.common.newGame).toBe('Nuevo Juego');
    expect(es.common.cancel).toBe('Cancelar');
  });

  it('should translate auth section to Spanish', () => {
    expect(es.auth.login).toBe('Iniciar Sesión');
    expect(es.auth.register).toBe('Registrarse');
    expect(es.auth.username).toBe('Nombre de Usuario');
    expect(es.auth.password).toBe('Contraseña');
    expect(es.auth.welcomeBack).toBe('Bienvenido de Nuevo');
  });

  it('should translate gameResult section to Spanish', () => {
    expect(es.gameResult.congratulations).toBe('🎉 ¡Felicidades!');
    expect(es.gameResult.gameOver).toBe('😔 Fin del Juego');
    expect(es.gameResult.solutionRevealed).toBe('🏳️ Solución Revelada');
  });

  it('should translate difficulties to Spanish', () => {
    expect(es.difficulties.easy).toBe('Fácil');
    expect(es.difficulties.medium).toBe('Medio');
    expect(es.difficulties.hard).toBe('Difícil');
    expect(es.difficulties.expert).toBe('Experto');
  });

  it('should translate modes to Spanish', () => {
    expect(es.modes.daily).toBe('Diario');
    expect(es.modes.practice).toBe('Práctica');
    expect(es.modes.endless).toBe('Sin Fin');
  });

  it('should translate new UI strings to Spanish', () => {
    expect(es.common.comingSoon).toBe('Próximamente');
    expect(es.common.playNow).toBe('Jugar Ahora');
    expect(es.common.addToFavourites).toBe('Añadir a favoritos');
    expect(es.common.removeFromFavourites).toBe('Quitar de favoritos');
    expect(es.common.copied).toBe('¡Copiado!');
  });
});
