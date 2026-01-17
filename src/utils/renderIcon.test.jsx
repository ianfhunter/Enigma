import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderIcon, isSvgIcon } from './renderIcon';

describe('renderIcon', () => {
  describe('with emoji strings', () => {
    it('returns emoji directly when icon is a simple emoji', () => {
      const result = renderIcon('🎮');
      expect(result).toBe('🎮');
    });

    it('returns emoji directly when icon is text', () => {
      const result = renderIcon('ABC');
      expect(result).toBe('ABC');
    });
  });

  describe('with SVG URLs', () => {
    it('renders an img element for .svg files', () => {
      const result = renderIcon('/path/to/icon.svg', 'test-class');
      expect(React.isValidElement(result)).toBe(true);
      expect(result.type).toBe('img');
      expect(result.props.src).toBe('/path/to/icon.svg');
      expect(result.props.className).toBe('test-class');
    });

    it('renders an img element for /assets/ paths', () => {
      const result = renderIcon('/assets/icons/game.png', 'svg-icon');
      expect(React.isValidElement(result)).toBe(true);
      expect(result.type).toBe('img');
      expect(result.props.src).toBe('/assets/icons/game.png');
    });

    it('renders an img element for /api/ paths', () => {
      const result = renderIcon('/api/packs/my-pack/logo.svg', 'svg-icon');
      expect(React.isValidElement(result)).toBe(true);
      expect(result.type).toBe('img');
      expect(result.props.src).toBe('/api/packs/my-pack/logo.svg');
    });

    it('renders an img element for data:image URLs', () => {
      const dataUrl = 'data:image/svg+xml,<svg></svg>';
      const result = renderIcon(dataUrl);
      expect(React.isValidElement(result)).toBe(true);
      expect(result.type).toBe('img');
      expect(result.props.src).toBe(dataUrl);
    });

    it('renders an img element for http:// URLs', () => {
      const result = renderIcon('http://example.com/icon.png');
      expect(React.isValidElement(result)).toBe(true);
      expect(result.type).toBe('img');
      expect(result.props.src).toBe('http://example.com/icon.png');
    });

    it('renders an img element for https:// URLs', () => {
      const result = renderIcon('https://example.com/icon.svg');
      expect(React.isValidElement(result)).toBe(true);
      expect(result.type).toBe('img');
      expect(result.props.src).toBe('https://example.com/icon.svg');
    });
  });

  describe('with fallback', () => {
    it('returns default fallback for null/undefined icon', () => {
      expect(renderIcon(null)).toBe('🎮');
      expect(renderIcon(undefined)).toBe('🎮');
      expect(renderIcon('')).toBe('🎮');
    });

    it('returns custom fallback when provided', () => {
      expect(renderIcon(null, '', '📦')).toBe('📦');
      expect(renderIcon('', '', '🔧')).toBe('🔧');
    });
  });

  describe('with React components', () => {
    it('renders function components', () => {
      const MockIcon = ({ className }) => <span className={className}>icon</span>;
      const result = renderIcon(MockIcon, 'custom-class');
      expect(React.isValidElement(result)).toBe(true);
      expect(result.type).toBe(MockIcon);
      expect(result.props.className).toBe('custom-class');
    });
  });

  describe('with React elements', () => {
    it('returns React elements as-is', () => {
      const element = <div data-testid="test-element">test</div>;
      const result = renderIcon(element);
      expect(result).toBe(element);
    });
  });
});

describe('isSvgIcon', () => {
  it('returns true for .svg files', () => {
    expect(isSvgIcon('/path/to/icon.svg')).toBe(true);
    expect(isSvgIcon('icon.svg')).toBe(true);
  });

  it('returns true for /assets/ paths', () => {
    expect(isSvgIcon('/assets/logo.png')).toBe(true);
  });

  it('returns true for /api/ paths', () => {
    expect(isSvgIcon('/api/packs/test/icon.svg')).toBe(true);
  });

  it('returns true for data:image URLs', () => {
    expect(isSvgIcon('data:image/svg+xml,<svg></svg>')).toBe(true);
  });

  it('returns true for http/https URLs', () => {
    expect(isSvgIcon('http://example.com/icon.svg')).toBe(true);
    expect(isSvgIcon('https://example.com/icon.png')).toBe(true);
  });

  it('returns false for emojis', () => {
    expect(isSvgIcon('🎮')).toBe(false);
    expect(isSvgIcon('🌟')).toBe(false);
  });

  it('returns false for plain text', () => {
    expect(isSvgIcon('ABC')).toBe(false);
    expect(isSvgIcon('icon')).toBe(false);
  });

  it('returns false for non-string values', () => {
    expect(isSvgIcon(null)).toBe(false);
    expect(isSvgIcon(undefined)).toBe(false);
    expect(isSvgIcon(123)).toBe(false);
    expect(isSvgIcon(() => {})).toBe(false);
  });
});
