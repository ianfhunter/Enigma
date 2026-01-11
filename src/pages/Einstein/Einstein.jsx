import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styles from './Einstein.module.css';
import { generatePuzzle, formatClue } from './generator';
import { THEME_SETS, THEME_SETS_4, DIFFICULTIES, getRandomTheme } from './puzzleData';

const GRID_SIZES = {
  '4 Houses': 4,
  '5 Houses': 5,
};

const CELL_STATES = {
  UNKNOWN: 'unknown',
  TRUE: 'true',
  FALSE: 'false',
};

export default function Einstein() {
  const [sizeKey, setSizeKey] = useState('4 Houses');
  const [difficulty, setDifficulty] = useState('medium');
  const [themeId, setThemeId] = useState(null);
  const [puzzleData, setPuzzleData] = useState(null);
  const [logicGrid, setLogicGrid] = useState(null);
  const [checkedClues, setCheckedClues] = useState(new Set());
  const [gameState, setGameState] = useState('playing');
  const [showHints, setShowHints] = useState(false);
  const [autoEliminate, setAutoEliminate] = useState(true);

  const numHouses = GRID_SIZES[sizeKey];

  const availableThemes = useMemo(() => {
    return numHouses === 4 ? THEME_SETS_4 : THEME_SETS;
  }, [numHouses]);

  const theme = useMemo(() => {
    if (themeId && availableThemes[themeId]) {
      return availableThemes[themeId];
    }
    return getRandomTheme(numHouses);
  }, [themeId, availableThemes, numHouses]);

  // Position category (house numbers 1-N)
  const positionCategory = useMemo(() => ({
    name: 'position',
    icon: '🏠',
    items: Array.from({ length: numHouses }, (_, i) => `${i + 1}`),
  }), [numHouses]);

  // All categories: position first, then theme categories
  const allCategories = useMemo(() => {
    return [positionCategory, ...theme.categories];
  }, [positionCategory, theme.categories]);

  // Initialize logic grid storage
  const initializeLogicGrid = useCallback(() => {
    const grid = {};
    for (let i = 0; i < allCategories.length; i++) {
      for (let j = i + 1; j < allCategories.length; j++) {
        const key = `${i}-${j}`;
        grid[key] = {};
        for (const item1 of allCategories[i].items) {
          grid[key][item1] = {};
          for (const item2 of allCategories[j].items) {
            grid[key][item1][item2] = CELL_STATES.UNKNOWN;
          }
        }
      }
    }
    return grid;
  }, [allCategories]);

  const initGame = useCallback(() => {
    const categories = theme.categories;
    const { solution, clues } = generatePuzzle(numHouses, categories, difficulty);
    setPuzzleData({ solution, clues, categories });
    setLogicGrid(initializeLogicGrid());
    setCheckedClues(new Set());
    setGameState('playing');
  }, [numHouses, theme, difficulty, initializeLogicGrid]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Get grid key with consistent ordering
  const getGridKey = useCallback((cat1Idx, cat2Idx) => {
    if (cat1Idx < cat2Idx) {
      return { key: `${cat1Idx}-${cat2Idx}`, swapped: false };
    } else {
      return { key: `${cat2Idx}-${cat1Idx}`, swapped: true };
    }
  }, []);

  // Get cell value
  const getCell = useCallback((cat1Idx, cat2Idx, item1, item2) => {
    if (!logicGrid) return CELL_STATES.UNKNOWN;
    const { key, swapped } = getGridKey(cat1Idx, cat2Idx);
    if (swapped) {
      return logicGrid[key]?.[item2]?.[item1] || CELL_STATES.UNKNOWN;
    }
    return logicGrid[key]?.[item1]?.[item2] || CELL_STATES.UNKNOWN;
  }, [logicGrid, getGridKey]);

  // LEFT CLICK: Set to TRUE (or toggle off if already TRUE)
  const handleLeftClick = useCallback((cat1Idx, cat2Idx, item1, item2) => {
    if (gameState !== 'playing') return;

    const currentState = getCell(cat1Idx, cat2Idx, item1, item2);
    const { key, swapped } = getGridKey(cat1Idx, cat2Idx);
    const [storeItem1, storeItem2] = swapped ? [item2, item1] : [item1, item2];
    const [storeCat1Idx, storeCat2Idx] = swapped ? [cat2Idx, cat1Idx] : [cat1Idx, cat2Idx];

    setLogicGrid(prev => {
      const newGrid = JSON.parse(JSON.stringify(prev));

      if (currentState === CELL_STATES.TRUE) {
        // Toggle off - clear to unknown
        newGrid[key][storeItem1][storeItem2] = CELL_STATES.UNKNOWN;
      } else {
        // Set to TRUE
        newGrid[key][storeItem1][storeItem2] = CELL_STATES.TRUE;

        // Auto-eliminate if enabled
        if (autoEliminate) {
          const cat1 = allCategories[storeCat1Idx];
          const cat2 = allCategories[storeCat2Idx];

          // Eliminate others in same row
          for (const other of cat2.items) {
            if (other !== storeItem2) {
              newGrid[key][storeItem1][other] = CELL_STATES.FALSE;
            }
          }
          // Eliminate others in same column
          for (const other of cat1.items) {
            if (other !== storeItem1) {
              newGrid[key][other][storeItem2] = CELL_STATES.FALSE;
            }
          }
        }
      }

      return newGrid;
    });
  }, [gameState, getCell, getGridKey, allCategories, autoEliminate]);

  // RIGHT CLICK: Set to FALSE (or toggle off if already FALSE)
  const handleRightClick = useCallback((e, cat1Idx, cat2Idx, item1, item2) => {
    e.preventDefault();
    if (gameState !== 'playing') return;

    const currentState = getCell(cat1Idx, cat2Idx, item1, item2);
    const { key, swapped } = getGridKey(cat1Idx, cat2Idx);
    const [storeItem1, storeItem2] = swapped ? [item2, item1] : [item1, item2];

    setLogicGrid(prev => {
      const newGrid = JSON.parse(JSON.stringify(prev));

      if (currentState === CELL_STATES.FALSE) {
        // Toggle off - clear to unknown
        newGrid[key][storeItem1][storeItem2] = CELL_STATES.UNKNOWN;
      } else {
        // Set to FALSE
        newGrid[key][storeItem1][storeItem2] = CELL_STATES.FALSE;
      }

      return newGrid;
    });
  }, [gameState, getCell, getGridKey]);

  // Check for win
  useEffect(() => {
    if (!logicGrid || !puzzleData || gameState === 'won') return;

    const { solution } = puzzleData;
    let allCorrect = true;

    // Check position grids (index 0 vs others)
    for (let catIdx = 1; catIdx < allCategories.length; catIdx++) {
      const cat = allCategories[catIdx];
      const key = `0-${catIdx}`;
      const subGrid = logicGrid[key];

      if (!subGrid) { allCorrect = false; break; }

      for (let h = 0; h < numHouses; h++) {
        const houseStr = `${h + 1}`;
        const correctItem = solution[cat.name][h];

        for (const item of cat.items) {
          const expected = item === correctItem ? CELL_STATES.TRUE : CELL_STATES.FALSE;
          const actual = subGrid[houseStr]?.[item];
          if (actual !== expected) { allCorrect = false; break; }
        }
        if (!allCorrect) break;
      }
      if (!allCorrect) break;
    }

    if (allCorrect) setGameState('won');
  }, [logicGrid, puzzleData, gameState, numHouses, allCategories]);

  const toggleClue = (index) => {
    setCheckedClues(prev => {
      const newSet = new Set(prev);
      newSet.has(index) ? newSet.delete(index) : newSet.add(index);
      return newSet;
    });
  };

  const getHint = () => {
    if (!puzzleData || gameState !== 'playing') return;
    const { solution } = puzzleData;

    for (let catIdx = 1; catIdx < allCategories.length; catIdx++) {
      const cat = allCategories[catIdx];
      const key = `0-${catIdx}`;

      for (let h = 0; h < numHouses; h++) {
        const houseStr = `${h + 1}`;
        const correctItem = solution[cat.name][h];
        const current = logicGrid[key]?.[houseStr]?.[correctItem];

        if (current !== CELL_STATES.TRUE) {
          handleLeftClick(0, catIdx, houseStr, correctItem);
          return;
        }
      }
    }
  };

  const handleReset = () => {
    setLogicGrid(initializeLogicGrid());
    setCheckedClues(new Set());
    setGameState('playing');
  };

  if (!puzzleData || !logicGrid) return null;

  const { clues, categories } = puzzleData;

  // Build triangular grid structure
  const triangularRows = [];
  for (let rowCatIdx = 1; rowCatIdx < allCategories.length; rowCatIdx++) {
    const rowCat = allCategories[rowCatIdx];
    const grids = [];
    for (let colCatIdx = 0; colCatIdx < rowCatIdx; colCatIdx++) {
      const colCat = allCategories[colCatIdx];
      grids.push({ rowCat, colCat, rowCatIdx, colCatIdx });
    }
    triangularRows.push({ rowCat, grids });
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Einstein Puzzle</h1>
        <p className={styles.instructions}>
          <strong>Left click</strong> = ✓ match &nbsp;|&nbsp; <strong>Right click</strong> = ✕ no match
        </p>
      </div>

      <div className={styles.settings}>
        <div className={styles.settingGroup}>
          <label>Size:</label>
          <div className={styles.buttonGroup}>
            {Object.keys(GRID_SIZES).map(key => (
              <button
                key={key}
                className={`${styles.settingBtn} ${sizeKey === key ? styles.active : ''}`}
                onClick={() => { setSizeKey(key); setThemeId(null); }}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.settingGroup}>
          <label>Difficulty:</label>
          <div className={styles.buttonGroup}>
            {Object.values(DIFFICULTIES).map(diff => (
              <button
                key={diff.id}
                className={`${styles.settingBtn} ${difficulty === diff.id ? styles.active : ''}`}
                onClick={() => setDifficulty(diff.id)}
              >
                {diff.name}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.settingGroup}>
          <label>Theme:</label>
          <select
            className={styles.themeSelect}
            value={themeId || theme.id}
            onChange={(e) => setThemeId(e.target.value)}
          >
            {Object.values(availableThemes).map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.gameArea}>
        {/* Triangular Logic Grid */}
        <div className={styles.triangularSection}>
          {/* Column headers */}
          <div className={styles.columnHeaders}>
            <div className={styles.rowLabelSpacer}></div>
            {allCategories.slice(0, -1).map((cat) => (
              <div key={cat.name} className={styles.columnHeader}>
                <span className={styles.headerIcon}>{cat.icon}</span>
                <span className={styles.headerName}>{cat.name}</span>
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {triangularRows.map(({ rowCat, grids }) => (
            <div key={rowCat.name} className={styles.triangularRow}>
              {/* Row label */}
              <div className={styles.rowLabel}>
                <span className={styles.headerIcon}>{rowCat.icon}</span>
                <span className={styles.headerName}>{rowCat.name}</span>
              </div>

              {/* Sub-grids */}
              {grids.map(({ colCat, rowCatIdx, colCatIdx }) => (
                <div
                  key={`${rowCat.name}-${colCat.name}`}
                  className={`${styles.subGrid} ${colCatIdx === 0 ? styles.positionGrid : ''}`}
                >
                  {/* Mini column headers */}
                  <div className={styles.miniHeaders}>
                    <div className={styles.miniCorner}></div>
                    {colCat.items.map(item => (
                      <div key={item} className={styles.miniColHeader} title={item}>
                        {item.length > 3 ? item.substring(0, 2) : item}
                      </div>
                    ))}
                  </div>

                  {/* Grid cells */}
                  {rowCat.items.map(rowItem => (
                    <div key={rowItem} className={styles.miniRow}>
                      <div className={styles.miniRowHeader} title={rowItem}>
                        {rowItem.length > 3 ? rowItem.substring(0, 2) : rowItem}
                      </div>
                      {colCat.items.map(colItem => {
                        const state = getCell(colCatIdx, rowCatIdx, colItem, rowItem);

                        let shouldBeTrue = false;
                        if (showHints && colCatIdx === 0) {
                          const houseIdx = parseInt(colItem) - 1;
                          shouldBeTrue = puzzleData.solution[rowCat.name]?.[houseIdx] === rowItem;
                        }

                        return (
                          <button
                            key={colItem}
                            className={`
                              ${styles.cell}
                              ${state === CELL_STATES.TRUE ? styles.cellTrue : ''}
                              ${state === CELL_STATES.FALSE ? styles.cellFalse : ''}
                              ${showHints && shouldBeTrue && state !== CELL_STATES.TRUE ? styles.hintCell : ''}
                            `}
                            onClick={() => handleLeftClick(colCatIdx, rowCatIdx, colItem, rowItem)}
                            onContextMenu={(e) => handleRightClick(e, colCatIdx, rowCatIdx, colItem, rowItem)}
                            title={`${colItem} ↔ ${rowItem}`}
                          >
                            {state === CELL_STATES.TRUE && '✓'}
                            {state === CELL_STATES.FALSE && '✕'}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}

              {/* Spacers for triangular shape */}
              {Array.from({ length: allCategories.length - 1 - grids.length }, (_, i) => (
                <div key={`spacer-${i}`} className={styles.gridSpacer}></div>
              ))}
            </div>
          ))}
        </div>

        {/* Clues Panel */}
        <div className={styles.cluesPanel}>
          <h3 className={styles.cluesTitle}>📜 Clues ({clues.length})</h3>
          <div className={styles.cluesList}>
            {clues.map((clue, index) => {
              const formatted = formatClue(clue, categories);
              const isChecked = checkedClues.has(index);

              return (
                <div
                  key={index}
                  className={`${styles.clue} ${isChecked ? styles.checked : ''}`}
                  onClick={() => toggleClue(index)}
                >
                  <span className={styles.clueCheck}>{isChecked ? '✓' : '○'}</span>
                  <span className={styles.clueIcon}>{formatted.icon}</span>
                  <span className={styles.clueText}>{formatted.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {gameState === 'won' && (
        <div className={styles.winOverlay}>
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🧠</div>
            <h2>Puzzle Solved!</h2>
            <p>You cracked the Einstein puzzle!</p>
            <button className={styles.newGameBtn} onClick={initGame}>New Puzzle</button>
          </div>
        </div>
      )}

      <div className={styles.controls}>
        <div className={styles.toggleGroup}>
          <label className={styles.toggle}>
            <input type="checkbox" checked={autoEliminate} onChange={(e) => setAutoEliminate(e.target.checked)} />
            <span className={styles.toggleSlider}></span>
            Auto-eliminate
          </label>

          <label className={styles.toggle}>
            <input type="checkbox" checked={showHints} onChange={(e) => setShowHints(e.target.checked)} />
            <span className={styles.toggleSlider}></span>
            Show hints
          </label>
        </div>

        <div className={styles.buttons}>
          <button className={styles.hintBtn} onClick={getHint} disabled={gameState === 'won'}>💡 Hint</button>
          <button className={styles.resetBtn} onClick={handleReset}>🔄 Reset</button>
          <button className={styles.newGameBtn} onClick={initGame}>✨ New Puzzle</button>
        </div>
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.legendCell} ${styles.cellTrue}`}>✓</span> Match (left click)
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendCell} ${styles.cellFalse}`}>✕</span> No match (right click)
        </span>
      </div>
    </div>
  );
}
