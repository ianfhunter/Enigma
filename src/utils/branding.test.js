import { describe, it, expect, vi, beforeEach } from 'vitest';
import { branding, isBrandingConfigured, getBrandColorOverrides } from './branding';

describe('branding utilities', () => {
  describe('branding object', () => {
    it('should have expected properties', () => {
      expect(branding).toHaveProperty('appName');
      expect(branding).toHaveProperty('logo');
      expect(branding).toHaveProperty('logoAnimated');
      expect(branding).toHaveProperty('logoSimple');
      expect(branding).toHaveProperty('favicon');
      expect(branding).toHaveProperty('ogImage');
      expect(branding).toHaveProperty('primaryColor');
      expect(branding).toHaveProperty('secondaryColor');
      expect(branding).toHaveProperty('footerPrefix');
      expect(branding).toHaveProperty('githubUrl');
      expect(branding).toHaveProperty('websiteUrl');
    });

    it('should have default app name', () => {
      expect(branding.appName).toBe('Enigma');
    });

    it('should have default logo paths', () => {
      expect(branding.logo).toBe('/branding/logo.svg');
      expect(branding.logoAnimated).toBe('/branding/logo-animated-e.svg');
      expect(branding.logoSimple).toBe('/branding/logo-simple-e.svg');
    });
  });

  describe('isBrandingConfigured', () => {
    beforeEach(() => {
      vi.unstubAllEnvs();
    });

    it('should return false when no branding env vars are set', async () => {
      vi.stubEnv('VITE_APP_NAME', undefined);
      vi.stubEnv('VITE_BRAND_LOGO', undefined);
      vi.stubEnv('VITE_BRAND_PRIMARY_COLOR', undefined);
      vi.stubEnv('VITE_BRAND_FOOTER_TEXT', undefined);

      vi.resetModules();
      const { isBrandingConfigured: check } = await import('./branding');
      expect(check()).toBe(false);
    });

    it('should return true when app name is set', async () => {
      vi.stubEnv('VITE_APP_NAME', 'My Puzzle App');
      vi.resetModules();
      const { isBrandingConfigured: check } = await import('./branding');
      expect(check()).toBe(true);
    });

    it('should return true when logo is set', async () => {
      vi.stubEnv('VITE_BRAND_LOGO', '/custom-logo.svg');
      vi.resetModules();
      const { isBrandingConfigured: check } = await import('./branding');
      expect(check()).toBe(true);
    });

    it('should return true when primary color is set', async () => {
      vi.stubEnv('VITE_BRAND_PRIMARY_COLOR', '#ff0000');
      vi.resetModules();
      const { isBrandingConfigured: check } = await import('./branding');
      expect(check()).toBe(true);
    });

    it('should return true when footer text is set', async () => {
      vi.stubEnv('VITE_BRAND_FOOTER_TEXT', 'Powered by MyBrand');
      vi.resetModules();
      const { isBrandingConfigured: check } = await import('./branding');
      expect(check()).toBe(true);
    });
  });

  describe('getBrandColorOverrides', () => {
    beforeEach(() => {
      vi.unstubAllEnvs();
    });

    it('should return empty object when no brand colors set', () => {
      const overrides = getBrandColorOverrides();
      expect(overrides).toEqual({});
    });

    it('should return primary color override when set', async () => {
      vi.stubEnv('VITE_BRAND_PRIMARY_COLOR', '#ff6600');
      vi.resetModules();
      const { getBrandColorOverrides: getOverrides } = await import('./branding');
      const overrides = getOverrides();
      expect(overrides).toHaveProperty('--brand-override-primary', '#ff6600');
    });

    it('should return both color overrides when both set', async () => {
      vi.stubEnv('VITE_BRAND_PRIMARY_COLOR', '#ff6600');
      vi.stubEnv('VITE_BRAND_SECONDARY_COLOR', '#cc5500');
      vi.resetModules();
      const { getBrandColorOverrides: getOverrides } = await import('./branding');
      const overrides = getOverrides();
      expect(overrides).toHaveProperty('--brand-override-primary', '#ff6600');
      expect(overrides).toHaveProperty('--brand-override-secondary', '#cc5500');
    });
  });
});
