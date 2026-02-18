/**
 * Branding Utilities
 *
 * Provides centralized access to custom branding configuration
 * from environment variables for self-hosted deployments.
 */

// Get custom branding values from environment variables
// Vite uses VITE_ prefix for env vars exposed to the browser
export const branding = {
  // App name (default: "Enigma")
  appName: import.meta.env.VITE_APP_NAME || 'Enigma',

  // Logo paths (default: use built-in branding)
  logo: import.meta.env.VITE_BRAND_LOGO || '/branding/logo.svg',
  logoAnimated: import.meta.env.VITE_BRAND_LOGO_ANIMATED || '/branding/logo-animated-e.svg',
  logoSimple: import.meta.env.VITE_BRAND_LOGO_SIMPLE || '/branding/logo-simple-e.svg',

  // Favicon
  favicon: import.meta.env.VITE_BRAND_FAVICON || '/favicon.ico',

  // OG Image (for social sharing)
  ogImage: import.meta.env.VITE_BRAND_OG_IMAGE || '/branding/og-image.png',

  // Primary brand color (CSS hex value)
  primaryColor: import.meta.env.VITE_BRAND_PRIMARY_COLOR || null,

  // Secondary brand color (CSS hex value)
  secondaryColor: import.meta.env.VITE_BRAND_SECONDARY_COLOR || null,

  // Footer prefix text (shown before "powered by Enigma")
  footerPrefix: import.meta.env.VITE_BRAND_FOOTER_PREFIX || null,

  // Custom GitHub link
  githubUrl: import.meta.env.VITE_BRAND_GITHUB_URL || null,

  // Custom website link
  websiteUrl: import.meta.env.VITE_BRAND_WEBSITE_URL || null,
};

/**
 * Check if custom branding is configured
 */
export function isBrandingConfigured() {
  return !!(
    import.meta.env.VITE_APP_NAME ||
    import.meta.env.VITE_BRAND_LOGO ||
    import.meta.env.VITE_BRAND_PRIMARY_COLOR ||
    import.meta.env.VITE_BRAND_FOOTER_TEXT
  );
}

/**
 * Get CSS variables for custom brand colors
 * Returns an object suitable for setting style properties
 */
export function getBrandColorOverrides() {
  const overrides = {};

  if (branding.primaryColor) {
    overrides['--brand-override-primary'] = branding.primaryColor;
  }

  if (branding.secondaryColor) {
    overrides['--brand-override-secondary'] = branding.secondaryColor;
  }

  return overrides;
}

export default branding;
