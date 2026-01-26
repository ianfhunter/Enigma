/**
 * MahjongTile Component Test Suite
 *
 * Tests the rendering of various mahjong tile types
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import MahjongTile from '../src/components/MahjongTile/MahjongTile';

describe('MahjongTile - Bamboo Tiles', () => {
  it('should render bamboo tile with value 1 (bird)', () => {
    const { container } = render(<MahjongTile type="bamboo" value={1} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg.querySelector('circle')).toBeTruthy(); // Bird has circles
  });

  it('should render bamboo tiles with values 2-9', () => {
    for (let value = 2; value <= 9; value++) {
      const { container } = render(<MahjongTile type="bamboo" value={value} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      const rects = svg.querySelectorAll('rect');
      // Should have bamboo sticks (rectangles)
      expect(rects.length).toBeGreaterThan(0);
    }
  });

  it('should render different number of bamboo sticks for different values', () => {
    const { container: container2 } = render(<MahjongTile type="bamboo" value={2} />);
    const { container: container5 } = render(<MahjongTile type="bamboo" value={5} />);

    // Value 2 should have fewer groups than value 5
    const groups2 = container2.querySelectorAll('g > g');
    const groups5 = container5.querySelectorAll('g > g');

    expect(groups2.length).toBeLessThan(groups5.length);
  });
});

describe('MahjongTile - Character Tiles', () => {
  it('should render character tile with Chinese characters', () => {
    const { container } = render(<MahjongTile type="character" value={1} />);
    const svg = container.querySelector('svg');
    const texts = svg.querySelectorAll('text');
    expect(texts.length).toBe(2); // Should have 萬 and the number
    expect(texts[0].textContent).toBe('萬');
  });

  it('should render all character tiles 1-9', () => {
    const expectedChars = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

    for (let value = 1; value <= 9; value++) {
      const { container } = render(<MahjongTile type="character" value={value} />);
      const svg = container.querySelector('svg');
      const texts = svg.querySelectorAll('text');
      expect(texts[1].textContent).toBe(expectedChars[value - 1]);
    }
  });

  it('should render character tiles in red color', () => {
    const { container } = render(<MahjongTile type="character" value={5} />);
    const svg = container.querySelector('svg');
    const texts = svg.querySelectorAll('text');
    texts.forEach(text => {
      expect(text.getAttribute('fill')).toBe('#c41e3a');
    });
  });
});

describe('MahjongTile - Dot Tiles', () => {
  it('should render dot tile with circles', () => {
    const { container } = render(<MahjongTile type="dot" value={1} />);
    const svg = container.querySelector('svg');
    const circles = svg.querySelectorAll('circle');
    expect(circles.length).toBe(2); // Outer and inner circle
  });

  it('should render correct number of dot pairs for each value', () => {
    for (let value = 1; value <= 9; value++) {
      const { container } = render(<MahjongTile type="dot" value={value} />);
      const svg = container.querySelector('svg');
      const groups = svg.querySelectorAll('g > g');
      // Each dot position has a group
      expect(groups.length).toBe(value);
    }
  });

  it('should render dots with two-layer circles', () => {
    const { container } = render(<MahjongTile type="dot" value={3} />);
    const svg = container.querySelector('svg');
    const circles = svg.querySelectorAll('circle');
    // Each dot has 2 circles (outer and inner)
    expect(circles.length).toBe(6); // 3 dots * 2 circles each
  });
});

describe('MahjongTile - Wind Tiles', () => {
  it('should render east wind with correct character', () => {
    const { container } = render(<MahjongTile type="wind" value="east" />);
    const svg = container.querySelector('svg');
    const text = svg.querySelector('text');
    expect(text.textContent).toBe('東');
  });

  it('should render south wind with correct character', () => {
    const { container } = render(<MahjongTile type="wind" value="south" />);
    const svg = container.querySelector('svg');
    const text = svg.querySelector('text');
    expect(text.textContent).toBe('南');
  });

  it('should render west wind with correct character', () => {
    const { container } = render(<MahjongTile type="wind" value="west" />);
    const svg = container.querySelector('svg');
    const text = svg.querySelector('text');
    expect(text.textContent).toBe('西');
  });

  it('should render north wind with correct character', () => {
    const { container } = render(<MahjongTile type="wind" value="north" />);
    const svg = container.querySelector('svg');
    const text = svg.querySelector('text');
    expect(text.textContent).toBe('北');
  });

  it('should render wind tiles in blue color', () => {
    const { container } = render(<MahjongTile type="wind" value="east" />);
    const svg = container.querySelector('svg');
    const text = svg.querySelector('text');
    expect(text.getAttribute('fill')).toBe('#1e40af');
  });
});

describe('MahjongTile - Dragon Tiles', () => {
  it('should render red dragon with correct character', () => {
    const { container } = render(<MahjongTile type="dragon" value="red" />);
    const svg = container.querySelector('svg');
    const text = svg.querySelector('text');
    expect(text.textContent).toBe('中');
    expect(text.getAttribute('fill')).toBe('#c41e3a');
  });

  it('should render green dragon with correct character', () => {
    const { container } = render(<MahjongTile type="dragon" value="green" />);
    const svg = container.querySelector('svg');
    const text = svg.querySelector('text');
    expect(text.textContent).toBe('發');
    expect(text.getAttribute('fill')).toBe('#15803d');
  });

  it('should render white dragon with frame', () => {
    const { container } = render(<MahjongTile type="dragon" value="white" />);
    const svg = container.querySelector('svg');
    const rect = svg.querySelector('rect[fill="none"]');
    expect(rect).toBeTruthy();
    expect(rect.getAttribute('stroke')).toBe('#3b82f6');
  });
});

describe('MahjongTile - Structure', () => {
  it('should render an SVG element', () => {
    const { container } = render(<MahjongTile type="bamboo" value={5} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('viewBox')).toBe('0 0 50 50');
  });

  it('should apply custom className', () => {
    const { container } = render(<MahjongTile type="dot" value={3} className="custom-class" />);
    const div = container.firstChild;
    expect(div.className).toContain('custom-class');
  });

  it('should have tile background', () => {
    const { container } = render(<MahjongTile type="character" value={7} />);
    const svg = container.querySelector('svg');
    const background = svg.querySelector('rect[fill="#f5f5f0"]');
    expect(background).toBeTruthy();
  });
});

describe('MahjongTile - Rendering Consistency', () => {
  it('should render consistently for the same tile type and value', () => {
    const { container: container1 } = render(<MahjongTile type="bamboo" value={4} />);
    const { container: container2 } = render(<MahjongTile type="bamboo" value={4} />);

    expect(container1.innerHTML).toBe(container2.innerHTML);
  });

  it('should render differently for different tile types', () => {
    const { container: bamboo } = render(<MahjongTile type="bamboo" value={5} />);
    const { container: character } = render(<MahjongTile type="character" value={5} />);
    const { container: dot } = render(<MahjongTile type="dot" value={5} />);

    expect(bamboo.innerHTML).not.toBe(character.innerHTML);
    expect(character.innerHTML).not.toBe(dot.innerHTML);
    expect(bamboo.innerHTML).not.toBe(dot.innerHTML);
  });

  it('should render differently for different values within same type', () => {
    const { container: tile1 } = render(<MahjongTile type="dot" value={3} />);
    const { container: tile2 } = render(<MahjongTile type="dot" value={7} />);

    expect(tile1.innerHTML).not.toBe(tile2.innerHTML);
  });
});
