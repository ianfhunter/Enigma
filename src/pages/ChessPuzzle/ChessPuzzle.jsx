import { useTranslation } from 'react-i18next';
import { useState, useCallback, useEffect, useMemo } from 'react';
import GameHeader from '../../components/GameHeader';
import { useGameState } from '../../hooks/useGameState';
import { parseFEN, applyMove, indexToAlgebraic, PIECE_CHARS, getPieceColor } from './chessUtils';
import { getRandomPuzzleByRating, getPuzzleById, DIFFICULTIES, loadChessPuzzles } from './chessPuzzles';
import styles from './ChessPuzzle.module.css';

export default function ChessPuzzle() {
  const [difficulty, setDifficulty] = useState('beginner');
  const [puzzle, setPuzzle] = useState(null);
  const [boardState, setBoardState] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [moveIndex, setMoveIndex] = useState(0);
  const { gameState: gameStatus, setGameState: setGameStatus, reset: resetGameState, isPlaying } = useGameState();
  const [showHint, setShowHint] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [animatingSquare, setAnimatingSquare] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [showingSolution, setShowingSolution] = useState(false);
  const [solutionStep, setSolutionStep] = useState(0);
  const [solutionStates, setSolutionStates] = useState([]);
  const [puzzleIdInput, setPuzzleIdInput] = useState('');
  const [showPuzzleIdInput, setShowPuzzleIdInput] = useState(false);
  const [wrongMove, setWrongMove] = useState(false);
  const [hintLevel, setHintLevel] = useState(0); // 0 = no hint, 1 = show piece, 2 = show destination
  const [puzzleList, setPuzzleList] = useState([]);
  const [loadingPuzzles, setLoadingPuzzles] = useState(true);

// Load a specific puzzle by ID
  const loadPuzzleById = useCallback((id) => {
    const foundPuzzle = getPuzzleById(puzzleList, id);
    if (!foundPuzzle) {
      alert(`Puzzle "${id}" not found`);
      return false;
    }

    const initialState = parseFEN(foundPuzzle.fen);

    // In Lichess puzzles: FEN is position BEFORE puzzle, moves[0] is opponent's move
    const opponentColor = initialState.turn === 'w' ? 'white' : 'black';
    const playerColor = opponentColor === 'white' ? 'black' : 'white';

    // Play the opponent's first move automatically
    const opponentMove = foundPuzzle.moves[0];
    const afterOpponentMove = applyMove(initialState, opponentMove);
    const fromSquare = opponentMove.substring(0, 2);
    const toSquare = opponentMove.substring(2, 4);

    setPuzzle({ ...foundPuzzle, playerColor });
    setBoardState(afterOpponentMove);
    setSelectedSquare(null);
    setMoveIndex(1);
    resetGameState();
    setShowHint(false);
    setHintLevel(0);
    setMoveHistory([]);
    setLastMove({ from: fromSquare, to: toSquare });
    setWrongMove(false);
    setIsFlipped(playerColor === 'black');
    setShowingSolution(false);
    setSolutionStep(0);
    setSolutionStates([]);
    setShowPuzzleIdInput(false);
    setPuzzleIdInput('');
    return true;
  }, [puzzleList]);

  // Load a new puzzle
  const loadPuzzle = useCallback((diff = difficulty) => {
    if (!puzzleList || puzzleList.length === 0) return;
    const { min, max } = DIFFICULTIES[diff];
    const newPuzzle = getRandomPuzzleByRating(puzzleList, min, max);
    if (!newPuzzle) return;

    // Parse the starting position
    const initialState = parseFEN(newPuzzle.fen);

    // In Lichess puzzles: FEN is position BEFORE puzzle, moves[0] is opponent's move
    // Player plays OPPOSITE of who moves first in FEN
    const opponentColor = initialState.turn === 'w' ? 'white' : 'black';
    const playerColor = opponentColor === 'white' ? 'black' : 'white';

    // Play the opponent's first move automatically
    const opponentMove = newPuzzle.moves[0];
    const afterOpponentMove = applyMove(initialState, opponentMove);
    const fromSquare = opponentMove.substring(0, 2);
    const toSquare = opponentMove.substring(2, 4);

    setPuzzle({ ...newPuzzle, playerColor });
    setBoardState(afterOpponentMove);
    setSelectedSquare(null);
    setMoveIndex(1); // Player starts at move index 1
    resetGameState();
    setShowHint(false);
    setHintLevel(0);
    setMoveHistory([]);
    setLastMove({ from: fromSquare, to: toSquare });
    setWrongMove(false);

    // Flip board if playing as black
    setIsFlipped(playerColor === 'black');
    setShowingSolution(false);
    setSolutionStep(0);
    setSolutionStates([]);
  }, [difficulty, puzzleList]);

// Retry the current puzzle
  const retryPuzzle = useCallback(() => {
    if (!puzzle) return;

    const initialState = parseFEN(puzzle.fen);

    // Play the opponent's first move automatically
    const opponentMove = puzzle.moves[0];
    const afterOpponentMove = applyMove(initialState, opponentMove);
    const fromSquare = opponentMove.substring(0, 2);
    const toSquare = opponentMove.substring(2, 4);

    setBoardState(afterOpponentMove);
    setSelectedSquare(null);
    setMoveIndex(1);
    resetGameState();
    setShowHint(false);
    setHintLevel(0);
    setMoveHistory([]);
    setLastMove({ from: fromSquare, to: toSquare });
    setWrongMove(false);
    setShowingSolution(false);
    setSolutionStep(0);
    setSolutionStates([]);
  }, [puzzle]);

  // Show the solution - compute all states for step-through navigation
  const showSolution = useCallback(() => {
    if (!puzzle || showingSolution) return;

    // Compute all board states for the solution
    const initialState = parseFEN(puzzle.fen);
    const states = [{
      boardState: initialState,
      lastMove: null,
      move: null,
      description: 'Starting position'
    }];

    let currentState = initialState;
    for (let i = 0; i < puzzle.moves.length; i++) {
      const move = puzzle.moves[i];
      const newState = applyMove(currentState, move);
      const fromSquare = move.substring(0, 2);
      const toSquare = move.substring(2, 4);
      // moves[0] is opponent's setup, moves[1], [3], [5]... are player moves
      const isPlayerMove = i % 2 === 1;

      states.push({
        boardState: newState,
        lastMove: { from: fromSquare, to: toSquare },
        move: move,
        description: i === 0 ? "Opponent's move" : (isPlayerMove ? 'Your move' : "Opponent's response")
      });

      currentState = newState;
    }

    setSolutionStates(states);
    setSolutionStep(0);
    setBoardState(initialState);
    setLastMove(null);
    setMoveHistory([]);
    setShowingSolution(true);
    setGameStatus('solution');
  }, [puzzle, showingSolution]);

  // Navigate solution steps
  const goToSolutionStep = useCallback((step) => {
    if (step < 0 || step >= solutionStates.length) return;

    const state = solutionStates[step];
    setBoardState(state.boardState);
    setLastMove(state.lastMove);
    setSolutionStep(step);

    if (state.lastMove) {
      setAnimatingSquare(state.lastMove.to);
      setTimeout(() => setAnimatingSquare(null), 300);
    }
  }, [solutionStates]);

  const nextSolutionStep = useCallback(() => {
    goToSolutionStep(solutionStep + 1);
  }, [goToSolutionStep, solutionStep]);

  const prevSolutionStep = useCallback(() => {
    goToSolutionStep(solutionStep - 1);
  }, [goToSolutionStep, solutionStep]);

  // Initialize puzzle on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await loadChessPuzzles();
        if (!mounted) return;
        setPuzzleList(list);
      } catch (e) {
        console.error(e);
        if (mounted) setPuzzleList([]);
      } finally {
        if (mounted) setLoadingPuzzles(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (puzzleList.length > 0) {
      loadPuzzle();
    }
  }, [puzzleList, loadPuzzle]);

  // Handle square click
  const handleSquareClick = useCallback((row, col) => {
    if (!isPlaying || !boardState || !puzzle) return;

    const square = indexToAlgebraic(row, col);
    const piece = boardState.board[row][col];
    const pieceColor = getPieceColor(piece);
    const isPlayerPiece = pieceColor === puzzle.playerColor;

    if (selectedSquare === null) {
      // Select a piece
      if (isPlayerPiece) {
        setSelectedSquare(square);
      }
    } else {
      // Try to make a move
      if (selectedSquare === square) {
        // Deselect
        setSelectedSquare(null);
        return;
      }

      if (isPlayerPiece) {
        // Select different piece
        setSelectedSquare(square);
        return;
      }

      // Attempt the move
      const moveAttempt = selectedSquare + square;
      const expectedMove = puzzle.moves[moveIndex];

      // Check for promotion
      const fromRow = 8 - parseInt(selectedSquare[1]);
      const toRow = 8 - parseInt(square[1]);
      const movingPiece = boardState.board[fromRow]?.[selectedSquare.charCodeAt(0) - 'a'.charCodeAt(0)];

      let finalMove = moveAttempt;
      if (movingPiece?.toLowerCase() === 'p' && (toRow === 0 || toRow === 7)) {
        // Auto-promote to queen for now
        finalMove = moveAttempt + 'q';
      }

      // Compare with expected move (ignoring promotion piece in some cases)
      const isCorrect = finalMove.startsWith(expectedMove.substring(0, 4)) &&
                       (expectedMove.length <= 4 || finalMove === expectedMove);

      if (isCorrect) {
        // Correct move!
        const newState = applyMove(boardState, finalMove);
        setBoardState(newState);
        setMoveHistory(prev => [...prev, { move: finalMove, correct: true }]);
        setLastMove({ from: selectedSquare, to: square });
        setSelectedSquare(null);
        setShowHint(false); // Reset hint for next move
        setHintLevel(0);
        setWrongMove(false);

        const nextMoveIndex = moveIndex + 1;

        if (nextMoveIndex >= puzzle.moves.length) {
          // Puzzle complete!
          setGameStatus('correct');
          setPuzzlesSolved(prev => prev + 1);
          setStreak(prev => prev + 1);
        } else {
          // Apply opponent's response after a delay
          setMoveIndex(nextMoveIndex);

          if (nextMoveIndex < puzzle.moves.length) {
            setTimeout(() => {
              const opponentMove = puzzle.moves[nextMoveIndex];
              const afterOpponent = applyMove(newState, opponentMove);
              setBoardState(afterOpponent);

              const fromSquare = opponentMove.substring(0, 2);
              const toSquare = opponentMove.substring(2, 4);
              setLastMove({ from: fromSquare, to: toSquare });
              setAnimatingSquare(toSquare);
              setTimeout(() => setAnimatingSquare(null), 300);

              setMoveIndex(nextMoveIndex + 1);
            }, 400);
          }
        }
      } else {
        // Wrong move - let them try again
        setWrongMove(true);
        setSelectedSquare(null);
        // Clear wrong indicator after a moment
        setTimeout(() => setWrongMove(false), 1500);
      }
    }
  }, [selectedSquare, boardState, puzzle, moveIndex, gameStatus]);

  // Get hint - two stages: first shows piece, second shows destination
  const handleHint = useCallback(() => {
    if (!puzzle || moveIndex >= puzzle.moves.length) return;

    if (hintLevel === 0) {
      // First hint: show the piece to move
      setHintLevel(1);
      setShowHint(true);
    } else if (hintLevel === 1) {
      // Second hint: show the destination
      setHintLevel(2);
      setStreak(0); // Full hint breaks streak
    }
  }, [puzzle, moveIndex, hintLevel]);

  // Give up on the puzzle
  const giveUp = useCallback(() => {
    setGameStatus('wrong');
    setStreak(0);
  }, []);

  // Handle difficulty change
  const handleDifficultyChange = useCallback((newDiff) => {
    setDifficulty(newDiff);
    loadPuzzle(newDiff);
  }, [loadPuzzle]);

  // Render the board
  const renderBoard = useMemo(() => {
    if (!boardState) return null;

    const { board } = boardState;
    const squares = [];

    // Note: Row/col arrays are used for iteration display logic
    const _rows = isFlipped ? [0, 1, 2, 3, 4, 5, 6, 7] : [0, 1, 2, 3, 4, 5, 6, 7];
    const _cols = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

    for (let displayRow = 0; displayRow < 8; displayRow++) {
      for (let displayCol = 0; displayCol < 8; displayCol++) {
        const row = isFlipped ? 7 - displayRow : displayRow;
        const col = isFlipped ? 7 - displayCol : displayCol;

        const square = indexToAlgebraic(row, col);
        const piece = board[row][col];
        const isLight = (row + col) % 2 === 0;
        const isSelected = selectedSquare === square;
        const isLastMoveSquare = lastMove && (lastMove.from === square || lastMove.to === square);
        const isAnimating = animatingSquare === square;

        // Hint highlighting - level 1 shows piece, level 2 shows destination too
        const hintMove = showHint && puzzle?.moves[moveIndex];
        const isHintFrom = hintMove && hintLevel >= 1 && hintMove.substring(0, 2) === square;
        const isHintTo = hintMove && hintLevel >= 2 && hintMove.substring(2, 4) === square;

        const squareClasses = [
          styles.square,
          isLight ? styles.light : styles.dark,
          isSelected && styles.selected,
          isLastMoveSquare && styles.lastMove,
          isAnimating && styles.animating,
          isHintFrom && styles.hintFrom,
          isHintTo && styles.hintTo,
        ].filter(Boolean).join(' ');

        squares.push(
          <div
            key={square}
            className={squareClasses}
            onClick={() => handleSquareClick(row, col)}
            data-square={square}
          >
            {piece && (
              <span className={`${styles.piece} ${getPieceColor(piece) === 'white' ? styles.whitePiece : styles.blackPiece}`}>
                {PIECE_CHARS[piece]}
              </span>
            )}
            {/* Coordinate labels */}
            {displayCol === 0 && (
              <span className={styles.rankLabel}>{8 - row}</span>
            )}
            {displayRow === 7 && (
              <span className={styles.fileLabel}>
                {String.fromCharCode('a'.charCodeAt(0) + col)}
              </span>
            )}
          </div>
        );
      }
    }

    return squares;
  }, [boardState, selectedSquare, isFlipped, showHint, hintLevel, puzzle, moveIndex, handleSquareClick, lastMove, animatingSquare]);

  // Theme styling
  const themeStyle = useMemo(() => ({
    '--primary-color': '#b58863',
    '--secondary-color': '#f0d9b5',
  }), []);

  if (loadingPuzzles) {
    return (
      <div className={styles.container} style={themeStyle}>
        <GameHeader
          title="Chess Puzzles"
          instructions="Find the best move to win material or deliver checkmate!"
        />
        <div className={styles.gameArea}>{t('common.loadingPuzzles')}</div>
      </div>
    );
  }

  if (!puzzleList || puzzleList.length === 0) {
    return (
      <div className={styles.container} style={themeStyle}>
        <GameHeader
          title="Chess Puzzles"
          instructions="Find the best move to win material or deliver checkmate!"
        />
        <div className={styles.gameArea}>{t('common.noPuzzlesAvailable')}</div>
      </div>
    );
  }

  return (
    <div className={styles.container} style={themeStyle}>
      <GameHeader
        title="Chess Puzzles"
        instructions="Find the best move to win material or deliver checkmate!"
      />

      <div className={styles.gameArea}>
        {/* Turn indicator */}
        {puzzle && (
          <div className={styles.turnIndicator}>
            <div className={`${styles.turnBadge} ${puzzle.playerColor === 'white' ? styles.whiteTurn : styles.blackTurn}`}>
              <span className={styles.turnPiece}>
                {puzzle.playerColor === 'white' ? '♔' : '♚'}
              </span>
              <span className={styles.turnText}>
                {puzzle.playerColor === 'white' ? 'White' : 'Black'} to move
              </span>
            </div>
            {puzzle.themes && puzzle.themes.length > 0 && (
              <div className={styles.puzzleThemeBadge}>
                {puzzle.themes.find(t => ['mateIn1', 'mateIn2', 'mateIn3', 'fork', 'pin', 'skewer', 'sacrifice', 'discoveredAttack', 'backRankMate', 'smotheredMate'].includes(t))?.replace(/([A-Z])/g, ' $1').trim()
                  || puzzle.themes[0].replace(/([A-Z])/g, ' $1').trim()}
              </div>
            )}
          </div>
        )}

        {/* Difficulty selector */}
        <div className={styles.difficultySelector}>
          {Object.entries(DIFFICULTIES).map(([key, { label }]) => (
            <button
              key={key}
              className={`${styles.difficultyBtn} ${difficulty === key ? styles.active : ''}`}
              onClick={() => handleDifficultyChange(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statIcon}>⭐</span>
            <span className={styles.statValue}>{puzzlesSolved}</span>
            <span className={styles.statLabel}>Solved</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statIcon}>🔥</span>
            <span className={styles.statValue}>{streak}</span>
            <span className={styles.statLabel}>{t('common.streak')}</span>
          </div>
          {puzzle && (
            <div className={styles.stat}>
              <span className={styles.statIcon}>📊</span>
              <span className={styles.statValue}>{puzzle.rating}</span>
              <span className={styles.statLabel}>Rating</span>
            </div>
          )}
        </div>

        {/* Chess board */}
        <div className={`${styles.boardWrapper} ${wrongMove ? styles.wrongShake : ''}`}>
          <div className={styles.board}>
            {renderBoard}
          </div>
        </div>

        {/* Wrong move indicator */}
        {wrongMove && isPlaying && (
          <div className={styles.wrongMoveIndicator}>
            That's not right — try again!
          </div>
        )}

        {/* Game status */}
        {gameStatus === 'correct' && (
          <div className={`${styles.statusMessage} ${styles.success}`}>
            <span className={styles.statusIcon}>✓</span>
            Excellent! Puzzle solved.
          </div>
        )}

        {gameStatus === 'wrong' && (
          <div className={`${styles.statusMessage} ${styles.error}`}>
            <span className={styles.statusIcon}>✗</span>
            You gave up on this one.
          </div>
        )}

        {gameStatus === 'solution' && solutionStates.length > 0 && (
          <div className={styles.solutionPanel}>
            <div className={styles.solutionHeader}>
              <span className={styles.solutionTitle}>📖 Solution</span>
              <span className={styles.solutionStepInfo}>
                Step {solutionStep} of {solutionStates.length - 1}
              </span>
            </div>

            <div className={styles.solutionDescription}>
              {solutionStates[solutionStep]?.description}
              {solutionStates[solutionStep]?.move && (
                <span className={styles.solutionMove}>
                  {solutionStates[solutionStep].move}
                </span>
              )}
            </div>

            <div className={styles.solutionNav}>
              <button
                className={styles.stepBtn}
                onClick={prevSolutionStep}
                disabled={solutionStep === 0}
              >
                ← Back
              </button>
              <div className={styles.stepIndicators}>
                {solutionStates.map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.stepDot} ${i === solutionStep ? styles.activeDot : ''} ${i <= solutionStep ? styles.visitedDot : ''}`}
                    onClick={() => goToSolutionStep(i)}
                    title={`Step ${i}`}
                  />
                ))}
              </div>
              <button
                className={styles.stepBtn}
                onClick={nextSolutionStep}
                disabled={solutionStep >= solutionStates.length - 1}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className={styles.controls}>
          {isPlaying && (
            <>
              <button
                className={styles.hintBtn}
                onClick={handleHint}
                disabled={hintLevel >= 2}
              >
                💡 {hintLevel === 0 ? 'Hint' : hintLevel === 1 ? 'Show Move' : 'Hint'}
              </button>
              <button
                className={styles.giveUpBtn}
                onClick={giveUp}
              >
                🏳️ Give Up
              </button>
            </>
          )}

          {gameStatus === 'wrong' && (
            <>
              <button
                className={styles.retryBtn}
                onClick={retryPuzzle}
              >
                🔄 Retry
              </button>
              <button
                className={styles.solutionBtn}
                onClick={showSolution}
              >
                📖 Show Solution
              </button>
            </>
          )}

          <button
            className={styles.newPuzzleBtn}
            onClick={() => loadPuzzle()}
          >
            {isPlaying ? '⏭️ Skip' : '➡️ Next Puzzle'}
          </button>

          <button
            className={styles.flipBtn}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            🔄 Flip Board
          </button>
        </div>

        {/* Themes */}
        {puzzle?.themes && puzzle.themes.length > 0 && (
          <div className={styles.themes}>
            <span className={styles.themesLabel}>Themes:</span>
            {puzzle.themes.map(theme => (
              <span key={theme} className={styles.theme}>
                {theme.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            ))}
          </div>
        )}

        {/* Move history */}
        {moveHistory.length > 0 && (
          <div className={styles.moveHistory}>
            <span className={styles.moveHistoryLabel}>{t('common.yourMoves')}:</span>
            {moveHistory.map((m, i) => (
              <span
                key={i}
                className={`${styles.move} ${m.correct ? styles.correctMove : styles.wrongMove}`}
              >
                {m.move}
              </span>
            ))}
          </div>
        )}

        {/* Puzzle info */}
        <div className={styles.puzzleInfo}>
          {puzzle && (
            <div className={styles.puzzleIdSection}>
              <span className={styles.puzzleIdLabel}>{t('common.puzzleId')}:</span>
              <code
                className={styles.puzzleId}
                onClick={() => {
                  navigator.clipboard.writeText(puzzle.id);
                }}
                title="Click to copy"
              >
                {puzzle.id}
              </code>
              <a
                href={`https://lichess.org/training/${puzzle.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.lichessLink}
                title="View on Lichess"
              >
                ↗
              </a>
            </div>
          )}

          <div className={styles.puzzleIdInputSection}>
            {showPuzzleIdInput ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (puzzleIdInput.trim()) {
                    loadPuzzleById(puzzleIdInput.trim());
                  }
                }}
                className={styles.puzzleIdForm}
              >
                <input
                  type="text"
                  value={puzzleIdInput}
                  onChange={(e) => setPuzzleIdInput(e.target.value)}
                  placeholder="Enter puzzle ID"
                  className={styles.puzzleIdInputField}
                  autoFocus
                />
                <button type="submit" className={styles.puzzleIdSubmit}>Go</button>
                <button
                  type="button"
                  className={styles.puzzleIdCancel}
                  onClick={() => {
                    setShowPuzzleIdInput(false);
                    setPuzzleIdInput('');
                  }}
                >
                  ✕
                </button>
              </form>
            ) : (
              <button
                className={styles.loadPuzzleBtn}
                onClick={() => setShowPuzzleIdInput(true)}
              >
                Load specific puzzle
              </button>
            )}
          </div>

          <span className={styles.puzzleCount}>
            {puzzleList.length} puzzles available
          </span>
        </div>
      </div>
    </div>
  );
}
