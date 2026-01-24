import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import GameResult from '../../components/GameResult';
import { usePersistedState } from '../../hooks/usePersistedState';
import { useGameState } from '../../hooks/useGameState';
import { useGameStats } from '../../hooks/useGameStats';
import styles from './TowerOfHanoi.module.css';

const DISK_COUNTS = [3, 4, 5, 6, 7];
const DISK_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
];

// Export helpers for testing
export { DISK_COUNTS, DISK_COLORS };

export default function TowerOfHanoi() {
  const { t } = useTranslation();
  const [diskCount, setDiskCount] = useState(4);
  const [towers, setTowers] = useState([[], [], []]);
  const [selectedTower, setSelectedTower] = useState(null);
  const [moves, setMoves] = useState(0);
  const { gameState, checkWin: checkWinState, reset: resetGameState, isPlaying, isWon } = useGameState();
  const [bestMoves, setBestMoves] = usePersistedState('tower-hanoi-best', {});

  const minMoves = Math.pow(2, diskCount) - 1;

  const initGame = useCallback(() => {
    // Initialize with all disks on the first tower (largest at bottom)
    const firstTower = Array.from({ length: diskCount }, (_, i) => diskCount - i);
    setTowers([firstTower, [], []]);
    setSelectedTower(null);
    setMoves(0);
    resetGameState();
  }, [diskCount, resetGameState]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const checkWin = useCallback((newTowers) => {
    // Win if all disks are on the third tower
    return newTowers[2].length === diskCount;
  }, [diskCount]);

  const handleTowerClick = (towerIndex) => {
    if (isWon) return;

    if (selectedTower === null) {
      // Select a tower (only if it has disks)
      if (towers[towerIndex].length > 0) {
        setSelectedTower(towerIndex);
      }
    } else {
      // Try to move disk
      if (towerIndex === selectedTower) {
        // Deselect
        setSelectedTower(null);
      } else {
        const sourceTower = towers[selectedTower];
        const targetTower = towers[towerIndex];
        const diskToMove = sourceTower[sourceTower.length - 1];
        const topDiskOnTarget = targetTower[targetTower.length - 1];

        // Check if move is valid (can only place smaller on larger)
        if (topDiskOnTarget === undefined || diskToMove < topDiskOnTarget) {
          const newTowers = towers.map(t => [...t]);
          newTowers[selectedTower] = sourceTower.slice(0, -1);
          newTowers[towerIndex] = [...targetTower, diskToMove];

          setTowers(newTowers);
          setMoves(prev => prev + 1);
          setSelectedTower(null);

          if (checkWin(newTowers)) {
            checkWinState(true);
            const key = diskCount.toString();
            const totalMoves = moves + 1;
            if (!bestMoves[key] || totalMoves < bestMoves[key]) {
              setBestMoves(prev => ({ ...prev, [key]: totalMoves }));
            }
          }
        } else {
          // Invalid move - just deselect
          setSelectedTower(null);
        }
      }
    }
  };

  const getDiskWidth = (diskSize) => {
    const minWidth = 30;
    const maxWidth = 100;
    const widthPerDisk = (maxWidth - minWidth) / diskCount;
    return minWidth + (diskSize * widthPerDisk);
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Tower of Hanoi"
        instructions="Move all disks to the rightmost peg. Larger disks can't go on smaller ones!"
      />

      <div className={styles.diskSelector}>
        {DISK_COUNTS.map((count) => (
          <button
            key={count}
            className={`${styles.diskBtn} ${diskCount === count ? styles.active : ''}`}
            onClick={() => setDiskCount(count)}
          >
            {count} Disks
          </button>
        ))}
      </div>

      <div className={styles.gameArea}>
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Moves</span>
            <span className={styles.statValue}>{moves}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>{t('common.minimum')}</span>
            <span className={styles.statValue}>{minMoves}</span>
          </div>
          {bestMoves[diskCount.toString()] && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>{t('common.best')}</span>
              <span className={styles.statValue}>{bestMoves[diskCount.toString()]}</span>
            </div>
          )}
        </div>

        <div className={styles.towersContainer}>
          {towers.map((tower, towerIndex) => (
            <div
              key={towerIndex}
              className={`${styles.tower} ${selectedTower === towerIndex ? styles.selected : ''}`}
              onClick={() => handleTowerClick(towerIndex)}
            >
              <div className={styles.peg} />
              <div className={styles.base} />
              <div className={styles.disksContainer}>
                {tower.map((diskSize, diskIndex) => (
                  <div
                    key={diskIndex}
                    className={`${styles.disk} ${
                      selectedTower === towerIndex && diskIndex === tower.length - 1
                        ? styles.selectedDisk
                        : ''
                    }`}
                    style={{
                      width: `${getDiskWidth(diskSize)}%`,
                      backgroundColor: DISK_COLORS[diskSize - 1],
                      bottom: `${diskIndex * 28}px`,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title="Tower Complete!"
            message={`Solved in ${moves} moves!${moves === minMoves ? ' Perfect!' : ''}`}
          />
        )}

        <button className={styles.resetBtn} onClick={initGame}>
          {gameState === 'won' ? 'Play Again' : 'Reset'}
        </button>
      </div>
    </div>
  );
}
