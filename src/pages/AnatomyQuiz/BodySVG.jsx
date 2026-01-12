/**
 * Interactive Body SVG Component
 *
 * Displays an anatomically accurate human body with clickable
 * organ/bone/muscle regions for anatomy quiz interactions.
 */

import { useState, useMemo } from 'react';
import styles from './AnatomyQuiz.module.css';
import {
  INTEGUMENTARY_PATHS,
  SKELETAL_PATHS,
  MUSCULAR_PATHS,
  ORGAN_PATHS,
  BODY_OUTLINE_PATH,
} from './anatomySvgPaths';

export default function BodySVG({
  parts = [],
  targetPart = null,
  onPartClick,
  showHints = false,
  highlightedPart = null,
  highlightType = null, // 'correct' | 'incorrect' | null
  systemColor = '#666',
  selectedSystem = 'all',
}) {
  const [hoveredPart, setHoveredPart] = useState(null);

  // Get SVG path data for a part
  const getPartPathData = (part) => {
    return (
      INTEGUMENTARY_PATHS[part.id] ||
      SKELETAL_PATHS[part.id] ||
      MUSCULAR_PATHS[part.id] ||
      ORGAN_PATHS[part.id] ||
      null
    );
  };

  // Determine which system layers to show
  const visibleLayers = useMemo(() => {
    if (selectedSystem === 'all') {
      return ['organs']; // Default view shows organs
    }
    return [selectedSystem];
  }, [selectedSystem]);

  // Get parts with their path data
  const partsWithPaths = useMemo(() => {
    return parts
      .map((part) => ({
        ...part,
        pathData: getPartPathData(part),
      }))
      .filter((part) => part.pathData);
  }, [parts]);

  const handleClick = (part, e) => {
    e.stopPropagation();
    if (onPartClick) {
      onPartClick(part);
    }
  };

  const handleBackgroundClick = () => {
    if (onPartClick) {
      onPartClick(null);
    }
  };

  // Calculate label position from path (approximate center)
  const getLabelPosition = (pathData) => {
    // Use a simple heuristic - find approximate center from path commands
    const path = pathData.path;
    const matches = path.match(/[ML]\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/g) || [];

    if (matches.length === 0) return { x: 150, y: 250 };

    let sumX = 0, sumY = 0, count = 0;
    matches.forEach(match => {
      const coords = match.match(/(\d+(?:\.\d+)?)/g);
      if (coords && coords.length >= 2) {
        sumX += parseFloat(coords[0]);
        sumY += parseFloat(coords[1]);
        count++;
      }
    });

    return {
      x: count > 0 ? sumX / count : 150,
      y: count > 0 ? sumY / count : 250,
    };
  };

  return (
    <svg
      viewBox="0 0 300 545"
      className={styles.bodySvg}
      onClick={handleBackgroundClick}
    >
      <defs>
        {/* Gradient for body fill */}
        <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
        </linearGradient>

        {/* Subtle body gradient for depth */}
        <linearGradient id="bodyDepthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.03)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.03)" />
        </linearGradient>

        {/* Glow filter for hover */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Correct answer glow - green */}
        <filter id="correctGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feFlood floodColor="#22c55e" floodOpacity="0.8" />
          <feComposite in2="coloredBlur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Incorrect answer glow - red */}
        <filter id="incorrectGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feFlood floodColor="#ef4444" floodOpacity="0.8" />
          <feComposite in2="coloredBlur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Target hint pulse filter */}
        <filter id="hintGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="coloredBlur" />
          <feFlood floodColor="#fbbf24" floodOpacity="0.6" />
          <feComposite in2="coloredBlur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Drop shadow for depth */}
        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Human body outline - anatomically accurate */}
      <g className={styles.bodyOutline}>
        <path
          d={BODY_OUTLINE_PATH}
          fill="url(#bodyDepthGradient)"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="1.5"
        />
      </g>

      {/* Anatomical parts - clickable regions */}
      <g className={styles.anatomyParts}>
        {partsWithPaths.map((part) => {
          const isTarget = targetPart?.id === part.id;
          const isHighlighted = highlightedPart?.id === part.id;
          const isHovered = hoveredPart?.id === part.id;
          const pathData = part.pathData;

          // Determine visual state
          let filter = '';
          let fillColor = pathData.fill || systemColor;
          let fillOpacity = 0.6;
          let strokeColor = fillColor;
          let strokeWidth = 1;
          let strokeOpacity = 0.8;

          // Hover state
          if (isHovered && !isHighlighted) {
            filter = 'url(#glow)';
            fillOpacity = 0.85;
            strokeWidth = 2;
            strokeOpacity = 1;
            strokeColor = '#fff';
          }

          // Highlighted states (correct/incorrect answer)
          if (isHighlighted) {
            if (highlightType === 'correct') {
              filter = 'url(#correctGlow)';
              fillColor = '#22c55e';
              fillOpacity = 0.9;
              strokeColor = '#22c55e';
              strokeWidth = 2.5;
              strokeOpacity = 1;
            } else if (highlightType === 'incorrect') {
              filter = 'url(#incorrectGlow)';
              fillColor = '#ef4444';
              fillOpacity = 0.9;
              strokeColor = '#ef4444';
              strokeWidth = 2.5;
              strokeOpacity = 1;
            }
          }

          // Target with hints showing (pulsing)
          if (isTarget && showHints && !isHighlighted) {
            filter = 'url(#hintGlow)';
            fillOpacity = 0.8;
            strokeColor = '#fbbf24';
            strokeWidth = 2;
            strokeOpacity = 1;
          }

          const labelPos = getLabelPosition(pathData);

          return (
            <g key={part.id}>
              <path
                d={pathData.path}
                fill={fillColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeOpacity={strokeOpacity}
                strokeWidth={strokeWidth}
                filter={filter}
                className={styles.anatomyPart}
                onClick={(e) => handleClick(part, e)}
                onMouseEnter={() => setHoveredPart(part)}
                onMouseLeave={() => setHoveredPart(null)}
                style={{ cursor: 'pointer' }}
              />

              {/* Only show label after correct answer - not on hover (that would give away the answer!) */}
              {isHighlighted && highlightType === 'correct' && (
                <g className={styles.labelGroup}>
                  {/* Label background */}
                  <rect
                    x={labelPos.x - 45}
                    y={labelPos.y - 28}
                    width="90"
                    height="20"
                    rx="4"
                    fill="rgba(0, 0, 0, 0.85)"
                    stroke="rgba(34, 197, 94, 0.5)"
                    strokeWidth="1"
                  />
                  {/* Label text */}
                  <text
                    x={labelPos.x}
                    y={labelPos.y - 14}
                    textAnchor="middle"
                    className={styles.partLabel}
                    fill="#22c55e"
                    fontSize="10"
                    fontWeight="600"
                  >
                    ✓ {part.name}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>

      {/* Attribution text */}
      <text
        x="150"
        y="543"
        textAnchor="middle"
        className={styles.attribution}
        fill="rgba(255, 255, 255, 0.15)"
        fontSize="7"
      >
        Anatomical diagram • Educational use
      </text>
    </svg>
  );
}
