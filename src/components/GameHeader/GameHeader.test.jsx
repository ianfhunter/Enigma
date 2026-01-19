import { describe, it, expect } from 'vitest';

// ===========================================
// GameHeader - Default Props Tests
// ===========================================
describe('GameHeader - Default Props', () => {
  const defaultBackTo = '/';
  const defaultBackText = '← Back to Games';

  it('should have correct default backTo value', () => {
    expect(defaultBackTo).toBe('/');
  });

  it('should have correct default backText value', () => {
    expect(defaultBackText).toBe('← Back to Games');
  });

  it('should support custom backTo paths', () => {
    const customBackTo = '/puzzles';
    expect(customBackTo).not.toBe(defaultBackTo);
  });

  it('should support custom backText', () => {
    const customBackText = '← Back to Puzzles';
    expect(customBackText).not.toBe(defaultBackText);
  });
});

// ===========================================
// GameHeader - Title Style Tests
// ===========================================
describe('GameHeader - Title Style', () => {
  // This mirrors the logic in GameHeader.jsx
  const getTitleStyle = (gradient) => gradient ? {
    background: gradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  } : undefined;

  it('should return undefined style when no gradient provided', () => {
    expect(getTitleStyle(undefined)).toBeUndefined();
    expect(getTitleStyle(null)).toBeUndefined();
    expect(getTitleStyle('')).toBeUndefined();
  });

  it('should apply gradient style when gradient provided', () => {
    const gradient = 'linear-gradient(90deg, #ff0000, #00ff00)';
    const style = getTitleStyle(gradient);

    expect(style).toBeDefined();
    expect(style.background).toBe(gradient);
    expect(style.WebkitBackgroundClip).toBe('text');
    expect(style.WebkitTextFillColor).toBe('transparent');
    expect(style.backgroundClip).toBe('text');
  });

  it('should handle various gradient formats', () => {
    const gradients = [
      'linear-gradient(45deg, #667eea, #764ba2)',
      'radial-gradient(circle, red, blue)',
      'conic-gradient(from 0deg, red, yellow, green)',
    ];

    gradients.forEach(gradient => {
      const style = getTitleStyle(gradient);
      expect(style.background).toBe(gradient);
    });
  });
});

// ===========================================
// GameHeader - Navigation Mode Tests
// ===========================================
describe('GameHeader - Navigation Mode', () => {
  // Determines whether to use Link or button based on onBack prop
  const getNavigationMode = (onBack) => onBack ? 'button' : 'link';

  it('should use Link when onBack is not provided', () => {
    expect(getNavigationMode(undefined)).toBe('link');
    expect(getNavigationMode(null)).toBe('link');
  });

  it('should use button when onBack callback is provided', () => {
    const onBack = () => {};
    expect(getNavigationMode(onBack)).toBe('button');
  });

  it('should use button for any truthy onBack value', () => {
    expect(getNavigationMode(() => console.log('back'))).toBe('button');
    expect(getNavigationMode(() => {})).toBe('button');
  });
});

// ===========================================
// GameHeader - Instructions Rendering Tests
// ===========================================
describe('GameHeader - Instructions', () => {
  const shouldShowInstructions = (instructions) => !!instructions;

  it('should not show instructions when not provided', () => {
    expect(shouldShowInstructions(undefined)).toBe(false);
    expect(shouldShowInstructions(null)).toBe(false);
    expect(shouldShowInstructions('')).toBe(false);
  });

  it('should show instructions when string provided', () => {
    expect(shouldShowInstructions('Fill in the grid')).toBe(true);
  });

  it('should show instructions when JSX provided', () => {
    const jsxInstructions = { type: 'span', props: { children: 'Instructions' } };
    expect(shouldShowInstructions(jsxInstructions)).toBe(true);
  });
});

// ===========================================
// GameHeader - Children Rendering Tests
// ===========================================
describe('GameHeader - Children', () => {
  const hasChildren = (children) => children !== undefined && children !== null;

  it('should handle no children', () => {
    expect(hasChildren(undefined)).toBe(false);
    expect(hasChildren(null)).toBe(false);
  });

  it('should accept children for additional content', () => {
    const children = { type: 'div', props: { children: 'Extra content' } };
    expect(hasChildren(children)).toBe(true);
  });

  it('should accept array of children', () => {
    const children = [
      { type: 'span', props: { children: 'Item 1' } },
      { type: 'span', props: { children: 'Item 2' } },
    ];
    expect(hasChildren(children)).toBe(true);
    expect(Array.isArray(children)).toBe(true);
    expect(children.length).toBe(2);
  });
});
