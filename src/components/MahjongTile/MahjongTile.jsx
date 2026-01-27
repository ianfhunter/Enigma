/**
 * MahjongTile - Renders authentic-looking mahjong tiles with SVG
 *
 * Supports all traditional mahjong tile types:
 * - Bamboo (Suo/索子) 1-9
 * - Characters (Wan/萬子) 1-9
 * - Dots (Tong/筒子) 1-9
 * - Winds (Feng/風牌): East, South, West, North
 * - Dragons (Sanyuan/三元牌): Red, Green, White
 */

import React from 'react';
import styles from './MahjongTile.module.css';

// Bamboo tiles - vertical green sticks with traditional patterns
const Bamboo = ({ value }) => {
  // Traditional bamboo arrangements with proper spacing
  const positions = {
    1: [[25, 25]], // Special: bird/peacock
    2: [[20, 20], [30, 30]],
    3: [[25, 15], [20, 30], [30, 30]],
    4: [[18, 18], [32, 18], [18, 32], [32, 32]],
    5: [[18, 18], [32, 18], [25, 25], [18, 32], [32, 32]],
    6: [[18, 15], [32, 15], [18, 25], [32, 25], [18, 35], [32, 35]],
    7: [[18, 13], [32, 13], [18, 23], [32, 23], [25, 28], [18, 37], [32, 37]],
    // Bamboo 8: Two M-shaped groups (one inverted)
    8: [
      [18, 15], [25, 20], [32, 15],  // Top M
      [18, 35], [25, 30], [32, 35]   // Bottom inverted M
    ],
    9: [[16, 12], [25, 12], [34, 12], [16, 23], [25, 23], [34, 23], [16, 34], [25, 34], [34, 34]]
  };

  const pos = positions[value] || positions[1];

  const renderBambooStick = (x, y, i) => (
    <g key={i} transform={`translate(${x}, ${y})`}>
      {/* Bamboo stick with segments - BIGGER */}
      <rect x="-2.5" y="-8" width="5" height="16" rx="2.5" fill="#2d5016" />
      <rect x="-2" y="-7.5" width="4" height="15" rx="2" fill="#4a7c1f" />
      <rect x="-1.5" y="-7" width="3" height="14" rx="1.5" fill="#6fa830" />
      {/* Bamboo segments/nodes */}
      <line x1="-2" y1="-3.5" x2="2" y2="-3.5" stroke="#2d5016" strokeWidth="1" />
      <line x1="-2" y1="0" x2="2" y2="0" stroke="#2d5016" strokeWidth="1" />
      <line x1="-2" y1="3.5" x2="2" y2="3.5" stroke="#2d5016" strokeWidth="1" />
    </g>
  );

  return (
    <g>
      {/* Small numeric indicator top-left for English speakers - BIGGER */}
      <text x="5" y="11" fontSize="9" fill="#228B22" textAnchor="start" fontFamily="Arial, sans-serif" fontWeight="bold" opacity="0.8">
        {value}
      </text>

      {value === 1 ? (
        // Traditional peacock/bird for bamboo 1 - BIGGER
        <g transform="translate(25, 25) scale(1.3)">
          {/* Peacock body */}
          <ellipse cx="0" cy="0" rx="7" ry="9" fill="#006400" />
          <ellipse cx="0" cy="1" rx="5.5" ry="7" fill="#228B22" />
          {/* Head */}
          <circle cx="0" cy="-6" r="4" fill="#006400" />
          <circle cx="0" cy="-6" r="3" fill="#32CD32" />
          {/* Eye */}
          <circle cx="-1.5" cy="-6.5" r="1.2" fill="white" />
          <circle cx="-1.5" cy="-6.5" r="0.7" fill="black" />
          {/* Beak */}
          <path d="M -3,-6 L -5,-6.5 L -3,-7 Z" fill="#8B4513" />
          {/* Tail feathers */}
          <path d="M -6,5 Q -8,7 -7,9" stroke="#228B22" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 0,8 Q 0,10 0,12" stroke="#228B22" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 6,5 Q 8,7 7,9" stroke="#228B22" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Feet */}
          <line x1="-2" y1="8" x2="-3" y2="10" stroke="#8B4513" strokeWidth="1" strokeLinecap="round" />
          <line x1="2" y1="8" x2="3" y2="10" stroke="#8B4513" strokeWidth="1" strokeLinecap="round" />
        </g>
      ) : value === 8 ? (
        // Special M-pattern for bamboo 8
        <>
          {/* Top M - three sticks */}
          {renderBambooStick(18, 16, 0)}
          {renderBambooStick(25, 20, 1)}
          {renderBambooStick(32, 16, 2)}
          {/* Bottom inverted M - three sticks */}
          {renderBambooStick(18, 34, 3)}
          {renderBambooStick(25, 30, 4)}
          {renderBambooStick(32, 34, 5)}
          {/* Add two more sticks to make 8 total */}
          {renderBambooStick(12, 25, 6)}
          {renderBambooStick(38, 25, 7)}
        </>
      ) : (
        pos.map((p, i) => renderBambooStick(p[0], p[1], i))
      )}
    </g>
  );
};

// Character tiles - Chinese characters in red
const Character = ({ value }) => {
  const chars = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

  return (
    <g>
      {/* Small arabic numeral indicator top-left for English speakers */}
      <text x="5" y="11" fontSize="9" fill="#c41e3a" textAnchor="start" fontFamily="Arial, sans-serif" fontWeight="bold" opacity="0.8">
        {value}
      </text>
      {/* Chinese numeral on top - BIGGER */}
      <text x="25" y="24" fontSize="20" fill="#DC143C" textAnchor="middle" fontFamily="SimSun, 'Microsoft YaHei', serif" fontWeight="bold">
        {chars[value - 1]}
      </text>
      {/* 萬 (wan) on bottom - BIGGER */}
      <text x="25" y="43" fontSize="16" fill="#DC143C" textAnchor="middle" fontFamily="SimSun, 'Microsoft YaHei', serif" fontWeight="bold">
        萬
      </text>
    </g>
  );
};

// Dots tiles - circles arranged in traditional patterns
const Dots = ({ value }) => {
  // Traditional dot/circle positions matching real mahjong tiles
  const positions = {
    1: [[25, 25]], // Single large center dot
    2: [[18, 20], [32, 30]], // Diagonal
    3: [[18, 18], [25, 25], [32, 32]], // Diagonal line
    4: [[18, 18], [32, 18], [18, 32], [32, 32]], // Four corners
    5: [[18, 18], [32, 18], [25, 25], [18, 32], [32, 32]], // Four corners + center
    6: [[18, 15], [32, 15], [18, 25], [32, 25], [18, 35], [32, 35]], // Two columns
    7: [[18, 15], [32, 15], [18, 25], [25, 25], [32, 25], [18, 35], [32, 35]], // Two columns + center
    8: [[16, 14], [34, 14], [16, 22], [34, 22], [16, 30], [34, 30], [16, 38], [34, 38]], // Four rows of two
    9: [[16, 13], [25, 13], [34, 13], [16, 25], [25, 25], [34, 25], [16, 37], [25, 37], [34, 37]] // Three rows of three
  };

  const pos = positions[value] || positions[1];

  // Traditional colors: dots 1-4 are red, 5-8 are blue, 9 is red
  const getColors = (val) => {
    if (val === 1 || val === 4) return { outer: '#8B0000', inner: '#DC143C' }; // Dark red
    if (val === 2 || val === 3) return { outer: '#006400', inner: '#228B22' }; // Dark green
    if (val === 5 || val === 8) return { outer: '#00008B', inner: '#4169E1' }; // Dark blue
    if (val === 6 || val === 7) return { outer: '#8B0000', inner: '#DC143C' }; // Dark red
    if (val === 9) return { outer: '#00008B', inner: '#4169E1' }; // Dark blue
    return { outer: '#8B0000', inner: '#DC143C' };
  };

  const colors = getColors(value);
  // Make dots BIGGER
  const radius = value === 1 ? 11 : value <= 4 ? 7 : 5.5;

  return (
    <g>
      {/* Small numeric indicator top-left for English speakers - BIGGER */}
      <text x="5" y="11" fontSize="9" fill={colors.inner} textAnchor="start" fontFamily="Arial, sans-serif" fontWeight="bold" opacity="0.8">
        {value}
      </text>

      {pos.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r={radius} fill={colors.outer} />
          <circle cx={p[0]} cy={p[1]} r={radius * 0.7} fill={colors.inner} />
        </g>
      ))}
    </g>
  );
};

// Wind tiles - Chinese characters for directions
const Wind = ({ direction }) => {
  const chars = { east: '東', south: '南', west: '西', north: '北' };
  const letters = { east: 'E', south: 'S', west: 'W', north: 'N' };

  return (
    <g>
      {/* Small letter indicator top-left for English speakers - BIGGER */}
      <text x="5" y="11" fontSize="9" fill="#1e40af" textAnchor="start" fontFamily="Arial, sans-serif" fontWeight="bold" opacity="0.8">
        {letters[direction]}
      </text>
      {/* Chinese character - BIGGER */}
      <text x="25" y="37" fontSize="28" fill="#1e40af" textAnchor="middle" fontFamily="SimSun, 'Microsoft YaHei', serif" fontWeight="bold">
        {chars[direction]}
      </text>
    </g>
  );
};

// Dragon tiles - special tiles with traditional styling
const Dragon = ({ color }) => {
  if (color === 'red') {
    return (
      <g>
        {/* Red Dragon - 中 (center/middle) - BIGGER */}
        <text x="25" y="38" fontSize="30" fill="#DC143C" textAnchor="middle" fontFamily="SimSun, 'Microsoft YaHei', serif" fontWeight="bold">
          中
        </text>
      </g>
    );
  }

  if (color === 'green') {
    return (
      <g>
        {/* Green Dragon - 發 (prosperity/fortune) - BIGGER */}
        <text x="25" y="38" fontSize="30" fill="#228B22" textAnchor="middle" fontFamily="SimSun, 'Microsoft YaHei', serif" fontWeight="bold">
          發
        </text>
      </g>
    );
  }

  // White dragon - traditionally shown as empty frame (some sets show 白) - BIGGER
  return (
    <g>
      <rect x="10" y="15" width="30" height="20" rx="1" fill="none" stroke="#4169E1" strokeWidth="3" />
    </g>
  );
};

const MahjongTile = ({ type, value, className = '' }) => {
  return (
    <div className={`${styles.tile} ${className}`}>
      <svg viewBox="0 0 50 50" className={styles.tileSvg}>
        {/* Content based on type */}
        {type === 'bamboo' && <Bamboo value={value} />}
        {type === 'character' && <Character value={value} />}
        {type === 'dot' && <Dots value={value} />}
        {type === 'wind' && <Wind direction={value} />}
        {type === 'dragon' && <Dragon color={value} />}
      </svg>
    </div>
  );
};

export default MahjongTile;
