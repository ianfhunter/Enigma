import { useState, useEffect, useCallback, useRef } from 'react';
import GameHeader from '../../components/GameHeader';
import DifficultySelector from '../../components/DifficultySelector';
import Timer, { formatTime } from '../../components/Timer/Timer';
import GameResult from '../../components/GameResult';
import styles from './Minesweeper.module.css';

const DIFFICULTIES = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 },
};

export default function Minesweeper() {
  const [difficulty, setDifficulty] = useState('easy');
  const [board, setBoard] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [gameState, setGameState] = useState('ready'); // 'ready', 'playing', 'won', 'lost'
  const [time, setTime] = useState(0);
  const [firstClick, setFirstClick] = useState(true);
  const [flagMode, setFlagMode] = useState(false); // Mobile flag mode
  const timerRef = useRef(null);

  const { rows, cols, mines } = DIFFICULTIES[difficulty];

  const createEmptyBoard = useCallback(() => {
    return Array(rows).fill(null).map(() => Array(cols).fill(0));
  }, [rows, cols]);

  const initGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setRevealed(Array(rows).fill(null).map(() => Array(cols).fill(false)));
    setFlagged(Array(rows).fill(null).map(() => Array(cols).fill(false)));
    setGameState('ready');
    setTime(0);
    setFirstClick(true);
    setFlagMode(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [rows, cols, createEmptyBoard]);

  useEffect(() => {
    initGame();
  }, [initGame, difficulty]);

  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  const placeMines = (excludeRow, excludeCol) => {
    const newBoard = createEmptyBoard();
    let placed = 0;

    while (placed < mines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);

      // Don't place mine on first click or adjacent cells
      const isExcluded = Math.abs(r - excludeRow) <= 1 && Math.abs(c - excludeCol) <= 1;

      if (newBoard[r][c] !== -1 && !isExcluded) {
        newBoard[r][c] = -1; // -1 = mine
        placed++;
      }
    }

    // Calculate numbers
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (newBoard[r][c] === -1) continue;

        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc] === -1) {
              count++;
            }
          }
        }
        newBoard[r][c] = count;
      }
    }

    return newBoard;
  };

  const revealCell = (row, col, currentBoard, currentRevealed) => {
    if (row < 0 || row >= rows || col < 0 || col >= cols) return currentRevealed;
    if (currentRevealed[row][col]) return currentRevealed;
    if (flagged[row][col]) return currentRevealed;

    const newRevealed = currentRevealed.map(r => [...r]);
    newRevealed[row][col] = true;

    // If empty cell, reveal neighbors
    if (currentBoard[row][col] === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const result = revealCell(row + dr, col + dc, currentBoard, newRevealed);
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              newRevealed[r][c] = newRevealed[r][c] || result[r][c];
            }
          }
        }
      }
    }

    return newRevealed;
  };

  const checkWin = (revealedState, boardState) => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (boardState[r][c] !== -1 && !revealedState[r][c]) {
          return false;
        }
      }
    }
    return true;
  };

  const handleClick = (row, col) => {
    if (gameState === 'won' || gameState === 'lost') return;
    if (revealed[row][col]) return;

    // In flag mode, toggle flag instead of revealing
    if (flagMode) {
      const newFlagged = flagged.map(r => [...r]);
      newFlagged[row][col] = !newFlagged[row][col];
      setFlagged(newFlagged);
      return;
    }

    if (flagged[row][col]) return;

    let currentBoard = board;

    if (firstClick) {
      currentBoard = placeMines(row, col);
      setBoard(currentBoard);
      setFirstClick(false);
      setGameState('playing');
    }

    if (currentBoard[row][col] === -1) {
      // Hit a mine
      setRevealed(Array(rows).fill(null).map(() => Array(cols).fill(true)));
      setGameState('lost');
      return;
    }

    const newRevealed = revealCell(row, col, currentBoard, revealed);
    setRevealed(newRevealed);

    if (checkWin(newRevealed, currentBoard)) {
      setGameState('won');
    }
  };

  const handleRightClick = (e, row, col) => {
    e.preventDefault();
    if (gameState === 'won' || gameState === 'lost') return;
    if (revealed[row][col]) return;

    const newFlagged = flagged.map(r => [...r]);
    newFlagged[row][col] = !newFlagged[row][col];
    setFlagged(newFlagged);
  };

  const flagCount = flagged.flat().filter(Boolean).length;

  const getCellContent = (row, col) => {
    if (flagged[row][col] && !revealed[row][col]) return '🚩';
    if (!revealed[row][col]) return '';
    if (board[row][col] === -1) return '💣';
    if (board[row][col] === 0) return '';
    return board[row][col];
  };

  const getCellClass = (row, col) => {
    const classes = [styles.cell];

    if (revealed[row][col]) {
      classes.push(styles.revealed);
      if (board[row][col] === -1) {
        classes.push(styles.mine);
      } else if (board[row][col] > 0) {
        classes.push(styles[`num${board[row][col]}`]);
      }
    } else if (flagged[row][col]) {
      classes.push(styles.flagged);
    }

    return classes.join(' ');
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Minesweeper"
        instructions="Clear the minefield! Tap to reveal, use flag mode or long-press to flag."
      />

      <DifficultySelector
        options={Object.keys(DIFFICULTIES)}
        value={difficulty}
        onChange={setDifficulty}
        className={styles.difficultySelector}
      />

      <div className={styles.gameArea}>
        <div className={styles.statusBar}>
          <div className={styles.mineCounter}>💣 {mines - flagCount}</div>
          <button className={styles.resetBtn} onClick={initGame}>
            {gameState === 'won' ? '😎' : gameState === 'lost' ? '😵' : '🙂'}
          </button>
          <Timer seconds={time} size="compact" running={gameState === 'playing'} />
        </div>

        {/* Mobile Flag Toggle */}
        <button
          className={`${styles.flagToggle} ${flagMode ? styles.flagModeActive : ''}`}
          onClick={() => setFlagMode(!flagMode)}
        >
          🚩 {flagMode ? 'Flag Mode ON' : 'Flag Mode'}
        </button>

        <div
          className={styles.board}
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            maxWidth: `${cols * 28}px`,
          }}
        >
          {board.map((row, r) =>
            row.map((_, c) => (
              <button
                key={`${r}-${c}`}
                className={getCellClass(r, c)}
                onClick={() => handleClick(r, c)}
                onContextMenu={(e) => handleRightClick(e, r, c)}
              >
                {getCellContent(r, c)}
              </button>
            ))
          )}
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title="🎉 Minefield Cleared!"
            message={`Completed in ${time} seconds!`}
            actions={[{ label: 'Play Again', onClick: initGame, primary: true }]}
          />
        )}

        {gameState === 'lost' && (
          <GameResult
            state="lost"
            title="💥 Game Over!"
            message="Click the face to try again."
            actions={[{ label: 'Try Again', onClick: initGame, primary: true }]}
          />
        )}
      </div>
    </div>
  );
}
