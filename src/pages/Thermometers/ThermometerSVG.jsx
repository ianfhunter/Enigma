import { useId } from 'react';
import styles from './Thermometers.module.css';

const CELL_SIZE = 40;

// Bulb SVG - circular bulb at the end with tube connection
export function ThermometerBulb({ direction, filled, hasError }) {
  const gradientId = useId();
  const filterId = useId();
  const bulbRadius = 14;
  const tubeWidth = 6;
  
  let viewBox, bulbCenterX, bulbCenterY, tubeX, tubeY, tubeWidthPx, tubeHeightPx;
  
  if (direction === 'up') {
    // Bulb at bottom, tube extends upward
    viewBox = `0 0 ${CELL_SIZE} ${CELL_SIZE}`;
    bulbCenterX = CELL_SIZE / 2;
    bulbCenterY = CELL_SIZE - bulbRadius - 4; // Position bulb closer to tube connection
    tubeX = (CELL_SIZE - tubeWidth) / 2;
    tubeY = 0;
    tubeWidthPx = tubeWidth;
    tubeHeightPx = bulbCenterY - bulbRadius; // Tube connects to bulb top edge
  } else if (direction === 'down') {
    // Bulb at top, tube extends downward
    viewBox = `0 0 ${CELL_SIZE} ${CELL_SIZE}`;
    bulbCenterX = CELL_SIZE / 2;
    bulbCenterY = bulbRadius + 4; // Position bulb closer to tube connection
    tubeX = (CELL_SIZE - tubeWidth) / 2;
    tubeY = bulbCenterY + bulbRadius; // Tube starts at bulb bottom edge
    tubeWidthPx = tubeWidth;
    tubeHeightPx = CELL_SIZE - tubeY;
  } else if (direction === 'left') {
    // Bulb at right, tube extends leftward
    viewBox = `0 0 ${CELL_SIZE} ${CELL_SIZE}`;
    bulbCenterX = CELL_SIZE - bulbRadius - 4; // Position bulb closer to tube connection
    bulbCenterY = CELL_SIZE / 2;
    tubeX = 0;
    tubeY = (CELL_SIZE - tubeWidth) / 2;
    tubeWidthPx = bulbCenterX - bulbRadius; // Tube connects to bulb left edge
    tubeHeightPx = tubeWidth;
  } else if (direction === 'right') {
    // Bulb at left, tube extends rightward
    viewBox = `0 0 ${CELL_SIZE} ${CELL_SIZE}`;
    bulbCenterX = bulbRadius + 4; // Position bulb closer to tube connection
    bulbCenterY = CELL_SIZE / 2;
    tubeX = bulbCenterX + bulbRadius; // Tube starts at bulb right edge
    tubeY = (CELL_SIZE - tubeWidth) / 2;
    tubeWidthPx = CELL_SIZE - tubeX;
    tubeHeightPx = tubeWidth;
  }
  
  const glassColor = filled 
    ? 'rgba(220, 38, 38, 0.9)' 
    : 'rgba(160, 180, 200, 0.8)';
  const fillColor = filled
    ? `url(#${gradientId})`
    : 'rgba(240, 245, 250, 0.2)';
  const tubeFillColor = filled
    ? `url(#${gradientId}Tube)`
    : 'rgba(240, 245, 250, 0.2)';
  
  return (
    <svg
      viewBox={viewBox}
      className={styles.thermoSvg}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    >
      <defs>
        {filled && (
          <>
            <radialGradient id={gradientId} cx="50%" cy="50%">
              <stop offset="0%" stopColor="#fca5a5" />
              <stop offset="30%" stopColor="#f87171" />
              <stop offset="60%" stopColor="#ef4444" />
              <stop offset="80%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#991b1b" />
            </radialGradient>
            <linearGradient 
              id={`${gradientId}Tube`}
              x1={direction === 'up' || direction === 'down' ? '0%' : '0%'} 
              y1={direction === 'up' || direction === 'down' ? '0%' : '0%'}
              x2={direction === 'up' || direction === 'down' ? '0%' : '100%'} 
              y2={direction === 'up' || direction === 'down' ? '100%' : '0%'}
            >
              <stop offset="0%" stopColor="#fca5a5" />
              <stop offset="30%" stopColor="#ef4444" />
              <stop offset="60%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
            <filter id={filterId}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </>
        )}
      </defs>
      {/* Tube connection segment */}
      <rect
        x={tubeX}
        y={tubeY}
        width={tubeWidthPx}
        height={tubeHeightPx}
        fill={tubeFillColor}
        stroke={glassColor}
        strokeWidth="1.5"
      />
      {/* Circular bulb */}
      <circle
        cx={bulbCenterX}
        cy={bulbCenterY}
        r={bulbRadius}
        fill={fillColor}
        stroke={glassColor}
        strokeWidth="1.5"
        filter={filled ? `url(#${filterId})` : undefined}
      />
      {hasError && (
        <>
          <rect
            x={tubeX}
            y={tubeY}
            width={tubeWidthPx}
            height={tubeHeightPx}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeDasharray="2,2"
          />
          <circle
            cx={bulbCenterX}
            cy={bulbCenterY}
            r={bulbRadius}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeDasharray="2,2"
          />
        </>
      )}
    </svg>
  );
}

// Tube SVG - narrow rectangle
export function ThermometerTube({ direction, filled, hasError, isEnd }) {
  const gradientId = useId();
  const tubeWidth = 6;
  
  let viewBox, x, y, width, height;
  
  if (direction === 'up' || direction === 'down') {
    viewBox = `0 0 ${CELL_SIZE} ${CELL_SIZE}`;
    x = (CELL_SIZE - tubeWidth) / 2;
    y = 0;
    width = tubeWidth;
    height = CELL_SIZE;
  } else {
    viewBox = `0 0 ${CELL_SIZE} ${CELL_SIZE}`;
    x = 0;
    y = (CELL_SIZE - tubeWidth) / 2;
    width = CELL_SIZE;
    height = tubeWidth;
  }
  
  const glassColor = filled 
    ? 'rgba(220, 38, 38, 0.9)' 
    : 'rgba(180, 200, 220, 0.8)';
  const fillColor = filled
    ? `url(#${gradientId})`
    : 'rgba(240, 245, 250, 0.2)';
  
  return (
    <svg
      viewBox={viewBox}
      className={styles.thermoSvg}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    >
      <defs>
        {filled && (
          <linearGradient 
            id={gradientId}
            x1={direction === 'up' || direction === 'down' ? '0%' : '0%'} 
            y1={direction === 'up' || direction === 'down' ? '0%' : '0%'}
            x2={direction === 'up' || direction === 'down' ? '0%' : '100%'} 
            y2={direction === 'up' || direction === 'down' ? '100%' : '0%'}
          >
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="30%" stopColor="#ef4444" />
            <stop offset="60%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
        )}
      </defs>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={isEnd ? (direction === 'up' || direction === 'down' ? tubeWidth / 2 : tubeWidth / 2) : 0}
        ry={isEnd ? (direction === 'up' || direction === 'down' ? tubeWidth / 2 : tubeWidth / 2) : 0}
        fill={fillColor}
        stroke={glassColor}
        strokeWidth="1.5"
        style={{ transition: 'all 0.2s' }}
      />
      {hasError && (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={isEnd ? (direction === 'up' || direction === 'down' ? tubeWidth / 2 : tubeWidth / 2) : 0}
          ry={isEnd ? (direction === 'up' || direction === 'down' ? tubeWidth / 2 : tubeWidth / 2) : 0}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="2"
          strokeDasharray="2,2"
        />
      )}
    </svg>
  );
}

