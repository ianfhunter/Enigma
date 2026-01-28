import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import SeedDisplay, { useSeed } from '../../components/SeedDisplay/SeedDisplay';
import { useGameState } from '../../hooks/useGameState';
import { useGameStats } from '../../hooks/useGameStats';
import { createSeededRandom, seededShuffleArray } from '../../utils/generatorUtils';
import styles from './Sets.module.css';

// Card attributes
const COLORS = ['red', 'green', 'purple'];
const SHAPES = ['diamond', 'star', 'squiggle'];
const FILLS = ['solid', 'striped', 'empty'];
const COUNTS = [1, 2, 3];

// Distinct colors for found sets
const SET_COLORS = [
  { bg: 'rgba(59, 130, 246, 0.25)', border: '#3b82f6' },   // Blue
  { bg: 'rgba(34, 197, 94, 0.25)', border: '#22c55e' },    // Green
  { bg: 'rgba(168, 85, 247, 0.25)', border: '#a855f7' },   // Purple
  { bg: 'rgba(249, 115, 22, 0.25)', border: '#f97316' },   // Orange
  { bg: 'rgba(236, 72, 153, 0.25)', border: '#ec4899' },   // Pink
  { bg: 'rgba(20, 184, 166, 0.25)', border: '#14b8a6' },   // Teal
  { bg: 'rgba(234, 179, 8, 0.25)', border: '#eab308' },    // Yellow
  { bg: 'rgba(239, 68, 68, 0.25)', border: '#ef4444' },    // Red
  { bg: 'rgba(99, 102, 241, 0.25)', border: '#6366f1' },   // Indigo
  { bg: 'rgba(6, 182, 212, 0.25)', border: '#06b6d4' },    // Cyan
];

// Board size options
const BOARD_SIZES = {
  '12 cards': 12,
  '15 cards': 15,
  '18 cards': 18,
};

/**
 * Generate a full deck of 81 unique cards
 */
function generateDeck() {
  const deck = [];
  for (const color of COLORS) {
    for (const shape of SHAPES) {
      for (const fill of FILLS) {
        for (const count of COUNTS) {
          deck.push({ color, shape, fill, count });
        }
      }
    }
  }
  return deck;
}

/**
 * Check if three cards form a valid Set
 * Each attribute must be either all the same or all different
 */
function isValidSet(card1, card2, card3) {
  const checkAttribute = (a, b, c) =>
    (a === b && b === c) || (a !== b && b !== c && a !== c);

  return (
    checkAttribute(card1.color, card2.color, card3.color) &&
    checkAttribute(card1.shape, card2.shape, card3.shape) &&
    checkAttribute(card1.fill, card2.fill, card3.fill) &&
    checkAttribute(card1.count, card2.count, card3.count)
  );
}

/**
 * Find all valid sets in a collection of cards
 */
function findAllSets(cards) {
  const sets = [];
  for (let i = 0; i < cards.length - 2; i++) {
    for (let j = i + 1; j < cards.length - 1; j++) {
      for (let k = j + 1; k < cards.length; k++) {
        if (isValidSet(cards[i], cards[j], cards[k])) {
          sets.push([i, j, k]);
        }
      }
    }
  }
  return sets;
}

/**
 * Generate a puzzle with a guaranteed number of sets
 */
function generatePuzzle(seed, boardSize) {
  const random = createSeededRandom(seed);
  const deck = seededShuffleArray(generateDeck(), random);

  // Keep drawing cards until we have enough valid sets
  let cards = deck.slice(0, boardSize);
  let sets = findAllSets(cards);

  // If not enough sets, try different combinations
  let attempts = 0;
  while (sets.length < 3 && attempts < 100) {
    // Shuffle and try again with different seed offset
    const newRandom = createSeededRandom(seed + attempts + 1);
    cards = seededShuffleArray(generateDeck(), newRandom).slice(0, boardSize);
    sets = findAllSets(cards);
    attempts++;
  }

  return { cards, totalSets: sets.length, allSets: sets };
}

/**
 * Render a single shape SVG
 */
function ShapeSVG({ shape, fill, color }) {
  const colorMap = {
    red: '#e53e3e',
    green: '#38a169',
    purple: '#805ad5',
  };

  const strokeColor = colorMap[color];
  const fillColor = fill === 'solid' ? strokeColor : 'none';
  const patternId = `stripes-${color}-${shape}`;

  // Shape paths
  const shapes = {
    diamond: 'M25,5 L45,25 L25,45 L5,25 Z',
    star: 'M25,2 L30,18 L47,18 L33,28 L39,45 L25,35 L11,45 L17,28 L3,18 L20,18 Z',
    squiggle: 'M10,35 C5,25 10,15 20,10 C30,5 40,10 42,20 C44,30 40,35 30,40 C20,45 15,45 10,35 Z',
  };

  return (
    <svg viewBox="0 0 50 50" className={styles.shapeSvg}>
      {fill === 'striped' && (
        <defs>
          <pattern id={patternId} patternUnits="userSpaceOnUse" width="6" height="6">
            <line x1="0" y1="0" x2="0" y2="6" stroke={strokeColor} strokeWidth="2" />
          </pattern>
        </defs>
      )}
      <path
        d={shapes[shape]}
        fill={fill === 'striped' ? `url(#${patternId})` : fillColor}
        stroke={strokeColor}
        strokeWidth="3"
      />
    </svg>
  );
}

/**
 * Render a card with its shapes
 */
function Card({ card, isSelected, onClick, isHinted, setColorIndices }) {
  const isPartOfFoundSet = setColorIndices && setColorIndices.length > 0;
  const setColors = isPartOfFoundSet
    ? setColorIndices.map(idx => SET_COLORS[idx % SET_COLORS.length])
    : [];

  // Create stacked border effect for multiple sets
  const getMultiBorderStyle = () => {
    if (!isPartOfFoundSet) return undefined;

    if (setColors.length === 1) {
      return {
        backgroundColor: setColors[0].bg,
        borderColor: setColors[0].border,
        boxShadow: `0 0 12px ${setColors[0].border}40`,
      };
    }

    // Multiple sets - create layered box-shadow borders
    const shadows = setColors.map((color, i) => {
      const offset = (i + 1) * 4;
      return `0 0 0 ${offset}px ${color.border}`;
    });
    shadows.push(`0 0 20px ${setColors[0].border}40`);

    return {
      backgroundColor: setColors[0].bg,
      borderColor: setColors[0].border,
      boxShadow: shadows.join(', '),
      margin: `${(setColors.length - 1) * 4}px`,
    };
  };

  // Enhanced selection styling that works with found set styling
  const getSelectionStyle = () => {
    if (isSelected && isPartOfFoundSet) {
      // Selected card that's part of a found set - add a strong outline
      return {
        outline: '3px solid #ffffff',
        outlineOffset: '-3px',
        zIndex: 10,
      };
    } else if (isSelected) {
      // Regular selected card
      return {
        backgroundColor: '#e3f2fd',
        borderColor: '#2196f3',
        boxShadow: '0 0 15px rgba(33, 150, 243, 0.5)',
        transform: 'scale(1.05)',
        zIndex: 10,
      };
    }
    return {};
  };

  return (
    <button
      className={`${styles.card} ${isSelected ? styles.selected : ''} ${isHinted ? styles.hinted : ''} ${isPartOfFoundSet ? styles.found : ''} ${setColors.length > 1 ? styles.multiSet : ''}`}
      onClick={onClick}
      style={{ ...getMultiBorderStyle(), ...getSelectionStyle() }}
    >
      <div className={styles.cardContent}>
        {Array.from({ length: card.count }, (_, i) => (
          <ShapeSVG
            key={i}
            shape={card.shape}
            fill={card.fill}
            color={card.color}
          />
        ))}
      </div>
    </button>
  );
}

// Export helpers for testing
export { isValidSet, findAllSets, generatePuzzle, COLORS, SHAPES, FILLS, COUNTS, SET_COLORS };

export default function Sets() {
  const { t } = useTranslation();
  const [sizeKey, setSizeKey] = useState('12 cards');
  const { seed, setSeed, newSeed } = useSeed('sets', () => Math.floor(Math.random() * 1000000));

  const [puzzleData, setPuzzleData] = useState(null);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [foundSets, setFoundSets] = useState([]);
  const [hintIndices, setHintIndices] = useState([]);
  const [message, setMessage] = useState('');

  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();

  const boardSize = BOARD_SIZES[sizeKey];

  // Initialize puzzle
  const initGame = useCallback((newSeedValue) => {
    const seedToUse = newSeedValue !== undefined ? newSeedValue : seed;
    const puzzle = generatePuzzle(seedToUse, boardSize);
    setPuzzleData(puzzle);
    setSelectedIndices([]);
    setFoundSets([]);
    setHintIndices([]);
    setMessage('');
    resetGameState();
  }, [boardSize, seed, resetGameState]);

  useEffect(() => {
    initGame();
  }, [seed, boardSize]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check win condition
  useEffect(() => {
    if (!puzzleData || !isPlaying) return;

    // Win when all sets are found
    if (foundSets.length === puzzleData.totalSets && puzzleData.totalSets > 0) {
      checkWin(true);
    }
  }, [foundSets, puzzleData, isPlaying, checkWin]);

  // Map each card index to ALL sets it belongs to (array of set indices)
  const cardToSetIndices = useMemo(() => {
    const map = new Map();
    foundSets.forEach((set, setIndex) => {
      for (const cardIdx of set) {
        if (!map.has(cardIdx)) {
          map.set(cardIdx, []);
        }
        map.get(cardIdx).push(setIndex);
      }
    });
    return map;
  }, [foundSets]);

  // Get indices of cards that are part of found sets (for quick lookups)
  const foundSetIndices = useMemo(() => {
    return new Set(cardToSetIndices.keys());
  }, [cardToSetIndices]);

  const handleCardClick = (index) => {
    if (!isPlaying) return;

    setHintIndices([]);
    setMessage('');

    if (selectedIndices.includes(index)) {
      // Deselect
      setSelectedIndices(prev => prev.filter(i => i !== index));
    } else if (selectedIndices.length < 3) {
      const newSelected = [...selectedIndices, index];
      setSelectedIndices(newSelected);

      // Check if we have 3 cards selected
      if (newSelected.length === 3) {
        const [i, j, k] = newSelected;
        const cards = puzzleData.cards;

        if (isValidSet(cards[i], cards[j], cards[k])) {
          // Valid set found!
          setFoundSets(prev => [...prev, newSelected.sort((a, b) => a - b)]);
          setSelectedIndices([]);
          setMessage(t('sets.validSet', 'Valid Set! 🎉'));
        } else {
          // Invalid set
          setMessage(t('sets.invalidSet', 'Not a valid Set'));
          setTimeout(() => {
            setSelectedIndices([]);
            setMessage('');
          }, 1000);
        }
      }
    }
  };

  const handleHint = () => {
    if (!puzzleData || !isPlaying) return;

    // Find a set that hasn't been found yet
    const remainingIndices = puzzleData.cards
      .map((_, i) => i)
      .filter(i => !foundSetIndices.has(i));

    // Find sets among remaining cards
    for (const set of puzzleData.allSets) {
      const isRemaining = set.every(idx => !foundSetIndices.has(idx));
      if (isRemaining) {
        // Show first card of the hint
        setHintIndices([set[0]]);
        return;
      }
    }
  };

  const handleNewGame = () => {
    const nextSeed = newSeed();
    initGame(nextSeed);
  };

  const handleGiveUp = () => {
    if (!puzzleData || !isPlaying) return;
    // Reveal all remaining sets
    const allSetsNormalized = puzzleData.allSets.map(set => [...set].sort((a, b) => a - b));
    setFoundSets(allSetsNormalized);
    giveUp();
  };

  const handleSeedChange = (newSeedValue) => {
    setSeed(newSeedValue);
  };

  if (!puzzleData) return null;

  const remainingSets = puzzleData.totalSets - foundSets.length;

  return (
    <div className={styles.container}>
      <GameHeader
        title={t('sets.title', 'Sets')}
        instructions={t('sets.instructions', 'Find groups of 3 cards where each attribute (color, shape, fill, count) is either all the same or all different. Cards can be part of multiple sets!')}
      />

      <div className={styles.controls}>
        <SizeSelector
          options={Object.keys(BOARD_SIZES)}
          value={sizeKey}
          onChange={setSizeKey}
        />
        <SeedDisplay
          seed={seed}
          onSeedChange={handleSeedChange}
          onNewSeed={handleNewGame}
          showNewButton
        />
      </div>

      <div className={styles.stats}>
        <span className={styles.stat}>
          {t('sets.found', 'Found')}: {foundSets.length} / {puzzleData.totalSets}
        </span>
        {remainingSets > 0 && isPlaying && (
          <span className={styles.stat}>
            {t('sets.remaining', 'Remaining')}: {remainingSets}
          </span>
        )}
      </div>

      {message && (
        <div className={`${styles.message} ${message.includes('🎉') ? styles.success : styles.error}`}>
          {message}
        </div>
      )}

      <div className={styles.gameArea}>
        <div
          className={styles.board}
          style={{
            gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(boardSize))}, 1fr)`,
          }}
        >
          {puzzleData.cards.map((card, index) => (
            <Card
              key={index}
              card={card}
              isSelected={selectedIndices.includes(index)}
              isHinted={hintIndices.includes(index)}
              setColorIndices={cardToSetIndices.get(index) || null}
              onClick={() => handleCardClick(index)}
            />
          ))}
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title={t('sets.won', 'All Sets Found!')}
            message={t('sets.wonMessage', 'You found all {{count}} sets!', { count: puzzleData.totalSets })}
            actions={[{ label: t('common.newGame'), onClick: handleNewGame, primary: true }]}
          />
        )}

        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            title={t('sets.gaveUp', 'Sets Revealed')}
            message={t('sets.gaveUpMessage', 'The sets have been highlighted. Try another puzzle!')}
            actions={[{ label: t('common.newGame'), onClick: handleNewGame, primary: true }]}
          />
        )}
      </div>

      <div className={styles.buttons}>
        <button
          className={styles.hintBtn}
          onClick={handleHint}
          disabled={!isPlaying || remainingSets === 0}
        >
          {t('common.hint')}
        </button>
        <GiveUpButton
          onGiveUp={handleGiveUp}
          disabled={!isPlaying}
        />
        <button className={styles.newGameBtn} onClick={handleNewGame}>
          {t('common.newGame')}
        </button>
      </div>

      <div className={styles.legend}>
        <h4>{t('sets.legend', 'Attributes')}</h4>
        <div className={styles.legendGrid}>
          <div><strong>{t('sets.color', 'Color')}:</strong> Red, Green, Purple</div>
          <div><strong>{t('sets.shape', 'Shape')}:</strong> Diamond, Star, Squiggle</div>
          <div><strong>{t('sets.fill', 'Fill')}:</strong> Solid, Striped, Empty</div>
          <div><strong>{t('sets.count', 'Count')}:</strong> 1, 2, 3</div>
        </div>
      </div>
    </div>
  );
}
