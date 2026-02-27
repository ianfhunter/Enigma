import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import SeedDisplay, { useSeed } from '../../components/SeedDisplay/SeedDisplay';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import {
  CELL_COUNT,
  generateLetterTrianglesPuzzle,
  buildLineWordsFromPlacement,
  isSolvedPlacement,
} from './letterTrianglesLogic';
import styles from './LetterTriangles.module.css';

const BOARD_ROWS = [1, 3, 5];

export default function LetterTriangles() {
  const { t } = useTranslation();
  const { seed, setSeed, newSeed } = useSeed('letter-triangles', () => Math.floor(Math.random() * 1000000));

  const [puzzle, setPuzzle] = useState(() => generateLetterTrianglesPuzzle(seed));
  const [placement, setPlacement] = useState(() => Array(CELL_COUNT).fill(null));
  const [selectedTileId, setSelectedTileId] = useState(null);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    setPuzzle(generateLetterTrianglesPuzzle(seed));
    setPlacement(Array(CELL_COUNT).fill(null));
    setSelectedTileId(null);
    setGaveUp(false);
  }, [seed]);

  const tileById = useMemo(() => new Map(puzzle.solvedTiles.map((tile) => [tile.id, tile])), [puzzle]);

  const trayTileIds = useMemo(() => {
    const placed = new Set(placement.filter((id) => id !== null));
    return puzzle.shuffledTiles.map((tile) => tile.id).filter((id) => !placed.has(id));
  }, [placement, puzzle]);

  const lineWords = useMemo(() => buildLineWordsFromPlacement(placement, tileById), [placement, tileById]);
  const solved = isSolvedPlacement(placement);

  const handleCellClick = useCallback((cellIndex) => {
    if (gaveUp || solved) return;

    setPlacement((prev) => {
      const next = [...prev];
      const occupant = next[cellIndex];

      if (selectedTileId === null) {
        if (occupant !== null) {
          next[cellIndex] = null;
          setSelectedTileId(occupant);
        }
        return next;
      }

      next[cellIndex] = selectedTileId;
      setSelectedTileId(occupant);
      return next;
    });
  }, [selectedTileId, gaveUp, solved]);

  const handleTileClick = useCallback((tileId) => {
    if (gaveUp || solved) return;

    setSelectedTileId((current) => (current === tileId ? null : tileId));
  }, [gaveUp, solved]);

  const handleGiveUp = useCallback(() => {
    setPlacement(Array.from({ length: CELL_COUNT }, (_, index) => index));
    setSelectedTileId(null);
    setGaveUp(true);
  }, []);

  const renderTile = (tileId) => {
    if (tileId === null || tileId === undefined) return null;
    const tile = tileById.get(tileId);
    const [a, b, c] = tile.letters;

    return (
      <div className={styles.tileFace}>
        <span className={`${styles.letter} ${styles.top}`}>{a}</span>
        <span className={`${styles.letter} ${styles.left}`}>{b}</span>
        <span className={`${styles.letter} ${styles.right}`}>{c}</span>
      </div>
    );
  };

  let cellIndex = 0;

  return (
    <div className={styles.container}>
      <GameHeader
        title={t('letterTriangles.title', { defaultValue: 'Letter Triangles' })}
        instructions={t('letterTriangles.instructions', { defaultValue: 'Place all triangle tiles so every displayed line becomes the target English word.' })}
      />

      <div className={styles.topBar}>
        <button className={styles.actionButton} onClick={newSeed}>
          {t('common.newPuzzle', { defaultValue: 'New Puzzle' })}
        </button>
        <GiveUpButton onGiveUp={handleGiveUp} disabled={gaveUp || solved} />
      </div>

      <SeedDisplay
        seed={seed}
        onSeedChange={setSeed}
        onNewSeed={newSeed}
        showNewButton
        variant="compact"
      />

      {(solved || gaveUp) && (
        <GameResult
          state={solved && !gaveUp ? 'won' : 'gaveup'}
          title={solved && !gaveUp
            ? t('gameStatus.solved', { defaultValue: 'Solved!' })
            : t('common.solutionShown', { defaultValue: 'Solution shown' })}
          variant="inline"
        />
      )}

      <div className={styles.board}>
        {BOARD_ROWS.map((rowSize, rowIdx) => (
          <div key={rowIdx} className={styles.boardRow}>
            {Array.from({ length: rowSize }).map((_, i) => {
              const current = cellIndex++;
              const orientation = i % 2 === 1 ? styles.down : styles.up;
              return (
                <button
                  key={current}
                  className={`${styles.cell} ${orientation}`}
                  onClick={() => handleCellClick(current)}
                  aria-label={t('letterTriangles.boardCell', { defaultValue: 'Board cell {{index}}', index: current + 1 })}
                >
                  {renderTile(placement[current])}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {selectedTileId !== null && (
        <p className={styles.selectionHint}>
          {t('letterTriangles.selectedHint', { defaultValue: 'Tile selected: click a board cell to place it.' })}
        </p>
      )}

      <div className={styles.tray}>
        {trayTileIds.map((tileId) => (
          <button
            key={tileId}
            className={`${styles.trayTile} ${selectedTileId === tileId ? styles.selected : ''}`}
            onClick={() => handleTileClick(tileId)}
            aria-label={t('letterTriangles.tileLabel', { defaultValue: 'Tile {{id}}', id: tileId + 1 })}
          >
            {renderTile(tileId)}
          </button>
        ))}
      </div>

      <div className={styles.linesPanel}>
        {puzzle.targetWords.map((targetWord, idx) => {
          const currentWord = lineWords[idx];
          const complete = !currentWord.includes('_');
          const correct = currentWord === targetWord;

          return (
            <div key={targetWord + idx} className={styles.lineRow}>
              <span className={styles.lineLabel}>{t('letterTriangles.lineN', { defaultValue: 'Line {{num}}', num: idx + 1 })}</span>
              <code className={styles.currentWord}>{currentWord}</code>
              <span className={correct ? styles.correct : complete ? styles.incorrect : styles.pending}>
                {targetWord}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
