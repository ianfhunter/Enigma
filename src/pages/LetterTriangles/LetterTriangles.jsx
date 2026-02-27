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
  isDownCell,
  getTileLetterForLine,
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
  const [rotations, setRotations] = useState(() => ({}));
  const [draggingTileId, setDraggingTileId] = useState(null);

  useEffect(() => {
    const next = generateLetterTrianglesPuzzle(seed);
    setPuzzle(next);
    setPlacement(Array(CELL_COUNT).fill(null));
    setSelectedTileId(null);
    setGaveUp(false);
    setRotations(next.initialRotations || {});
  }, [seed]);

  const tileById = useMemo(() => new Map(puzzle.solvedTiles.map((tile) => [tile.id, tile])), [puzzle]);

  const trayTileIds = useMemo(() => {
    const placed = new Set(placement.filter((id) => id !== null));
    return puzzle.shuffledTiles.map((tile) => tile.id).filter((id) => !placed.has(id));
  }, [placement, puzzle]);

  const lineWords = useMemo(() => buildLineWordsFromPlacement(placement, tileById, rotations), [placement, tileById, rotations]);
  const solved = isSolvedPlacement(placement, rotations);

  const rotateTile = useCallback((tileId) => {
    if (gaveUp || solved) return;
    setRotations((prev) => ({
      ...prev,
      [tileId]: ((prev[tileId] ?? 0) + 1) % 3,
    }));
  }, [gaveUp, solved]);

  const moveTileToCell = useCallback((tileId, targetCellIndex) => {
    setPlacement((prev) => {
      const next = [...prev];
      const fromIndex = next.findIndex((id) => id === tileId);
      const targetOccupant = next[targetCellIndex];

      if (fromIndex !== -1) {
        next[fromIndex] = targetOccupant;
      }

      next[targetCellIndex] = tileId;
      return next;
    });
  }, []);

  const returnTileToTray = useCallback((tileId) => {
    setPlacement((prev) => {
      const next = [...prev];
      const idx = next.findIndex((id) => id === tileId);
      if (idx !== -1) next[idx] = null;
      return next;
    });
  }, []);

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

      const fromIndex = next.findIndex((id) => id === selectedTileId);
      if (fromIndex !== -1) next[fromIndex] = occupant;
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
    setRotations(() => {
      const reset = {};
      for (let i = 0; i < CELL_COUNT; i++) reset[i] = 0;
      return reset;
    });
  }, []);

  const handleDragStart = useCallback((tileId, event) => {
    if (gaveUp || solved) return;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(tileId));
    setDraggingTileId(tileId);
  }, [gaveUp, solved]);

  const handleDragEnd = useCallback(() => {
    setDraggingTileId(null);
  }, []);

  const handleDropOnCell = useCallback((cellIndex, event) => {
    event.preventDefault();
    if (gaveUp || solved) return;
    const tileId = Number(event.dataTransfer.getData('text/plain'));
    if (Number.isNaN(tileId)) return;
    moveTileToCell(tileId, cellIndex);
    setSelectedTileId(null);
    setDraggingTileId(null);
  }, [gaveUp, solved, moveTileToCell]);

  const handleDropOnTray = useCallback((event) => {
    event.preventDefault();
    if (gaveUp || solved) return;
    const tileId = Number(event.dataTransfer.getData('text/plain'));
    if (Number.isNaN(tileId)) return;
    returnTileToTray(tileId);
    setSelectedTileId(null);
    setDraggingTileId(null);
  }, [gaveUp, solved, returnTileToTray]);

  const renderTile = (tileId, cellIndex = null) => {
    if (tileId === null || tileId === undefined) return null;
    const tile = tileById.get(tileId);
    const rotation = rotations[tileId] ?? 0;
    const isDown = cellIndex !== null && isDownCell(cellIndex);
    const a = getTileLetterForLine(tile, 'A', rotation, cellIndex);
    const b = getTileLetterForLine(tile, 'B', rotation, cellIndex);
    const c = getTileLetterForLine(tile, 'C', rotation, cellIndex);

    return (
      <div className={`${styles.tileFace} ${isDown ? styles.down : ''}`}>
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
        instructions={t('letterTriangles.instructions', { defaultValue: 'Drag and drop triangle tiles onto the board. Rotate them so every line spells its target word.' })}
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
            {Array.from({ length: rowSize }).map(() => {
              const current = cellIndex++;
              const tileId = placement[current];
              return (
                <div
                  key={current}
                  className={`${styles.cell} ${draggingTileId !== null ? styles.dragTarget : ''}`}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDropOnCell(current, event)}
                >
                  <button
                    className={styles.cellButton}
                    onClick={() => handleCellClick(current)}
                    aria-label={t('letterTriangles.boardCell', { defaultValue: 'Board cell {{index}}', index: current + 1 })}
                  >
                    {renderTile(tileId, current)}
                  </button>

                  {tileId !== null && tileId !== undefined && (
                    <>
                      <button
                        className={styles.rotateButton}
                        onClick={() => rotateTile(tileId)}
                        aria-label={t('letterTriangles.rotateTile', { defaultValue: 'Rotate tile' })}
                      >
                        ↻
                      </button>
                      <div
                        className={styles.dragHandle}
                        draggable
                        onDragStart={(event) => handleDragStart(tileId, event)}
                        onDragEnd={handleDragEnd}
                        aria-label={t('letterTriangles.dragTile', { defaultValue: 'Drag tile' })}
                        title={t('letterTriangles.dragTile', { defaultValue: 'Drag tile' })}
                      >
                        ⋮⋮
                      </div>
                    </>
                  )}
                </div>
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

      <div className={styles.tray} onDragOver={(event) => event.preventDefault()} onDrop={handleDropOnTray}>
        {trayTileIds.map((tileId) => (
          <div
            key={tileId}
            className={`${styles.trayTile} ${selectedTileId === tileId ? styles.selected : ''}`}
            draggable
            onDragStart={(event) => handleDragStart(tileId, event)}
            onDragEnd={handleDragEnd}
          >
            <button
              className={styles.trayMainButton}
              onClick={() => handleTileClick(tileId)}
              aria-label={t('letterTriangles.tileLabel', { defaultValue: 'Tile {{id}}', id: tileId + 1 })}
            >
              {renderTile(tileId)}
            </button>
            <button
              className={styles.rotateButton}
              onClick={() => rotateTile(tileId)}
              aria-label={t('letterTriangles.rotateTile', { defaultValue: 'Rotate tile' })}
            >
              ↻
            </button>
          </div>
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
