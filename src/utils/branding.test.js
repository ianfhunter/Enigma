import { describe, it, expect } from 'vitest';
import { branding } from './branding';

describe('branding config', () => {
  it('exports required branding fields for layout usage', () => {
    expect(branding).toMatchObject({
      appName: expect.any(String),
      logo: expect.any(String),
      logoAnimated: expect.any(String),
      githubUrl: expect.any(String),
    });
  });

  it('uses the expected public branding asset paths', () => {
    expect(branding.logo).toBe('/branding/logo-simple-e.svg');
    expect(branding.logoAnimated).toBe('/branding/logo-animated-e.svg');
  });
});
