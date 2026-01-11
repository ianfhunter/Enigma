import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './TrainShunting.module.css';
import { deepClone } from '../../data/wordUtils';

const CAR_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const CAR_PALETTE = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#06b6d4', '#ec4899', '#84cc16'];

function getCarColor(car) {
  const idx = CAR_LABELS.indexOf(car);
  if (idx >= 0) return CAR_PALETTE[idx % CAR_PALETTE.length];
  // For numeric cars
  const num = parseInt(car, 10);
  if (!isNaN(num)) return CAR_PALETTE[(num - 1) % CAR_PALETTE.length];
  return '#666';
}

function arraysEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function tracksEqual(tracks1, tracks2) {
  const keys = Object.keys(tracks1);
  for (const key of keys) {
    if (!arraysEqual(tracks1[key], tracks2[key])) return false;
  }
  return true;
}

// Shuffle array
function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// BFS solver for train shunting puzzles
function solvePuzzle(level, maxMoves = 30) {
  const trackNames = Object.keys(level.tracks);
  
  const stateKey = (tracks, engine) => {
    const parts = trackNames.map(name => `${name}:${(tracks[name] || []).join(',')}`);
    parts.push(`eng:${engine.track}:${engine.attached.join(',')}`);
    return parts.join('|');
  };
  
  const initialTracks = deepClone(level.initial);
  trackNames.forEach(name => {
    if (!initialTracks[name]) initialTracks[name] = [];
  });
  
  const initialEngine = { track: level.engine, attached: [] };
  const visited = new Set();
  const queue = [{ tracks: initialTracks, engine: initialEngine, moves: 0 }];
  visited.add(stateKey(initialTracks, initialEngine));
  
  while (queue.length > 0) {
    const { tracks, engine, moves } = queue.shift();
    
    if (moves > maxMoves) continue;
    
    // Check win condition
    if (engine.attached.length === 0 && tracksEqual(tracks, level.target)) {
      return { solvable: true, minMoves: moves };
    }
    
    const tryState = (newTracks, newEngine, newMoves) => {
      const key = stateKey(newTracks, newEngine);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ tracks: newTracks, engine: newEngine, moves: newMoves });
      }
    };
    
    // Move engine to each track
    for (const trackName of trackNames) {
      if (trackName !== engine.track) {
        tryState(tracks, { ...engine, track: trackName }, moves + 1);
      }
    }
    
    const currentTrack = engine.track;
    const currentCars = tracks[currentTrack] || [];
    const capacity = level.tracks[currentTrack];
    
    // Pick up cars (all cars on current track)
    if (currentCars.length > 0) {
      const newTracks = deepClone(tracks);
      newTracks[currentTrack] = [];
      const newEngine = { ...engine, attached: [...engine.attached, ...currentCars] };
      tryState(newTracks, newEngine, moves + 1);
    }
    
    // Drop cars (as many as fit)
    if (engine.attached.length > 0) {
      const availableSpace = capacity - currentCars.length;
      if (availableSpace > 0) {
        const toDrop = engine.attached.slice(0, availableSpace);
        const remaining = engine.attached.slice(availableSpace);
        const newTracks = deepClone(tracks);
        newTracks[currentTrack] = [...currentCars, ...toDrop];
        const newEngine = { ...engine, attached: remaining };
        tryState(newTracks, newEngine, moves + 1);
      }
    }
  }
  
  return { solvable: false, minMoves: -1 };
}

// Generate a puzzle
function generatePuzzle(settings) {
  const { numCars, numSidings, difficulty } = settings;
  
  const minMoves = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 6 : 10;
  const maxMoves = difficulty === 'easy' ? 8 : difficulty === 'medium' ? 15 : 25;
  
  for (let attempt = 0; attempt < 50; attempt++) {
    // Create cars
    const cars = CAR_LABELS.slice(0, numCars);
    
    // Generate initial arrangement (shuffled)
    const initial = shuffle(cars);
    
    // Generate target arrangement
    let target;
    const targetType = Math.random();
    if (targetType < 0.4) {
      // Reverse
      target = [...initial].reverse();
    } else if (targetType < 0.7) {
      // Sorted
      target = [...cars];
    } else {
      // Random different permutation
      do {
        target = shuffle(cars);
      } while (arraysEqual(target, initial));
    }
    
    // Skip if already solved
    if (arraysEqual(initial, target)) continue;
    
    // Create track structure
    const tracks = { main: numCars + 1 };
    const initialState = { main: initial };
    const targetState = { main: target };
    
    for (let i = 1; i <= numSidings; i++) {
      const sidingName = `siding${i}`;
      const sidingSize = Math.max(2, Math.floor(numCars / 2) + (i === 1 ? 1 : 0));
      tracks[sidingName] = sidingSize;
      initialState[sidingName] = [];
      targetState[sidingName] = [];
    }
    
    const level = {
      name: `${numCars} Cars, ${numSidings} Sidings`,
      tracks,
      initial: initialState,
      target: targetState,
      engine: 'main',
    };
    
    // Check solvability
    const result = solvePuzzle(level, maxMoves + 5);
    if (result.solvable && result.minMoves >= minMoves && result.minMoves <= maxMoves) {
      level.minMoves = result.minMoves;
      return level;
    }
  }
  
  // Fallback to simple puzzle
  return {
    name: 'Simple Swap',
    tracks: { main: 4, siding1: 2, siding2: 2 },
    initial: { main: ['A', 'B', 'C'], siding1: [], siding2: [] },
    target: { main: ['C', 'B', 'A'], siding1: [], siding2: [] },
    engine: 'main',
    minMoves: 6,
  };
}

const DIFFICULTIES = ['easy', 'medium', 'hard'];

export default function TrainShunting() {
  const [level, setLevel] = useState(null);
  const [tracks, setTracks] = useState({});
  const [enginePosition, setEnginePosition] = useState({ track: 'main', attached: [] });
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState('playing');
  const [history, setHistory] = useState([]);
  
  // Generation settings
  const [numCars, setNumCars] = useState(3);
  const [numSidings, setNumSidings] = useState(2);
  const [difficulty, setDifficulty] = useState('medium');

  const generateNew = useCallback(() => {
    const newLevel = generatePuzzle({ numCars, numSidings, difficulty });
    setLevel(newLevel);
    const initialTracks = deepClone(newLevel.initial);
    Object.keys(newLevel.tracks).forEach(track => {
      if (!initialTracks[track]) initialTracks[track] = [];
    });
    setTracks(initialTracks);
    setEnginePosition({ track: newLevel.engine, attached: [] });
    setMoves(0);
    setGameState('playing');
    setHistory([]);
  }, [numCars, numSidings, difficulty]);

  const initGame = useCallback(() => {
    if (!level) return;
    const initialTracks = deepClone(level.initial);
    Object.keys(level.tracks).forEach(track => {
      if (!initialTracks[track]) initialTracks[track] = [];
    });
    setTracks(initialTracks);
    setEnginePosition({ track: level.engine, attached: [] });
    setMoves(0);
    setGameState('playing');
    setHistory([]);
  }, [level]);

  useEffect(() => {
    generateNew();
  }, []);

  useEffect(() => {
    if (!level || gameState !== 'playing') return;
    
    // Check if target reached (engine must have no cars attached)
    if (enginePosition.attached.length === 0 && tracksEqual(tracks, level.target)) {
      setGameState('won');
    }
  }, [tracks, enginePosition, level, gameState]);

  const saveHistory = () => {
    setHistory(prev => [...prev, { tracks: deepClone(tracks), enginePosition: deepClone(enginePosition), moves }]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setTracks(prev.tracks);
    setEnginePosition(prev.enginePosition);
    setMoves(prev.moves);
    setHistory(h => h.slice(0, -1));
  };

  const handlePickUp = (trackName) => {
    if (gameState !== 'playing') return;
    if (enginePosition.track !== trackName) return;
    if (tracks[trackName].length === 0) return;

    saveHistory();
    
    // Pick up all cars from this track
    const cars = [...tracks[trackName]];
    setTracks(prev => ({
      ...prev,
      [trackName]: []
    }));
    setEnginePosition(prev => ({
      ...prev,
      attached: [...prev.attached, ...cars]
    }));
    setMoves(m => m + 1);
  };

  const handleDrop = (trackName) => {
    if (gameState !== 'playing') return;
    if (enginePosition.track !== trackName) return;
    if (enginePosition.attached.length === 0) return;

    const trackCapacity = level.tracks[trackName];
    const currentOnTrack = tracks[trackName].length;
    const availableSpace = trackCapacity - currentOnTrack;

    if (availableSpace === 0) return;

    saveHistory();

    // Drop cars (as many as fit)
    const toDrop = enginePosition.attached.slice(0, availableSpace);
    const remaining = enginePosition.attached.slice(availableSpace);

    setTracks(prev => ({
      ...prev,
      [trackName]: [...prev[trackName], ...toDrop]
    }));
    setEnginePosition(prev => ({
      ...prev,
      attached: remaining
    }));
    setMoves(m => m + 1);
  };

  const handleMoveEngine = (trackName) => {
    if (gameState !== 'playing') return;
    if (enginePosition.track === trackName) return;

    saveHistory();
    setEnginePosition(prev => ({
      ...prev,
      track: trackName
    }));
    setMoves(m => m + 1);
  };

  const renderTrack = (trackName) => {
    const capacity = level.tracks[trackName];
    const cars = tracks[trackName] || [];
    const isEngineHere = enginePosition.track === trackName;
    const targetCars = level.target[trackName] || [];

    return (
      <div key={trackName} className={styles.trackContainer}>
        <div className={styles.trackLabel}>
          {trackName === 'main' ? 'Main Line' : trackName.replace('siding', 'Siding ')}
          <span className={styles.trackCapacity}>({cars.length}/{capacity})</span>
        </div>
        
        <div className={styles.trackRow}>
          {/* Engine area */}
          <div 
            className={`${styles.engineArea} ${isEngineHere ? styles.hasEngine : ''}`}
            onClick={() => handleMoveEngine(trackName)}
          >
            {isEngineHere && (
              <div className={styles.engine}>
                🚂
                {enginePosition.attached.length > 0 && (
                  <div className={styles.attachedCars}>
                    {enginePosition.attached.map((car, i) => (
                      <div 
                        key={i} 
                        className={styles.car}
                        style={{ backgroundColor: getCarColor(car) }}
                      >
                        {car}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Track with cars */}
          <div className={styles.track}>
            <div className={styles.rails}></div>
            <div className={styles.carsContainer}>
              {cars.map((car, i) => (
                <div 
                  key={i} 
                  className={styles.car}
                  style={{ backgroundColor: getCarColor(car) }}
                >
                  {car}
                </div>
              ))}
              {/* Empty slots */}
              {Array(capacity - cars.length).fill(null).map((_, i) => (
                <div key={`empty-${i}`} className={styles.emptySlot}></div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {isEngineHere && (
            <div className={styles.trackActions}>
              <button 
                className={styles.actionBtn}
                onClick={() => handlePickUp(trackName)}
                disabled={cars.length === 0}
              >
                Pick Up
              </button>
              <button 
                className={styles.actionBtn}
                onClick={() => handleDrop(trackName)}
                disabled={enginePosition.attached.length === 0 || cars.length >= capacity}
              >
                Drop
              </button>
            </div>
          )}
        </div>

        {/* Target indicator */}
        <div className={styles.targetRow}>
          <span className={styles.targetLabel}>Target:</span>
          {targetCars.map((car, i) => (
            <div 
              key={i} 
              className={styles.targetCar}
              style={{ backgroundColor: getCarColor(car) }}
            >
              {car}
            </div>
          ))}
          {targetCars.length === 0 && <span className={styles.emptyTarget}>(empty)</span>}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Train Shunting</h1>
        <p className={styles.instructions}>
          Move the engine between tracks to pick up and rearrange train cars.
          Match the target arrangement on each track to win!
        </p>
      </div>

      <div className={styles.levelSelector}>
        <div className={styles.settingGroup}>
          <label>Cars:</label>
          {[2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className={`${styles.levelBtn} ${numCars === n ? styles.active : ''}`}
              onClick={() => setNumCars(n)}
            >
              {n}
            </button>
          ))}
        </div>
        <div className={styles.settingGroup}>
          <label>Sidings:</label>
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              className={`${styles.levelBtn} ${numSidings === n ? styles.active : ''}`}
              onClick={() => setNumSidings(n)}
            >
              {n}
            </button>
          ))}
        </div>
        <div className={styles.settingGroup}>
          <label>Difficulty:</label>
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              className={`${styles.levelBtn} ${difficulty === d ? styles.active : ''}`}
              onClick={() => setDifficulty(d)}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <button className={styles.generateBtn} onClick={generateNew}>
          Generate New
        </button>
      </div>

      <div className={styles.stats}>
        <span>Moves: {moves}</span>
        {level?.minMoves && <span>Par: {level.minMoves}</span>}
      </div>

      {level && (
        <div className={styles.gameArea}>
          {Object.keys(level.tracks).map(trackName => renderTrack(trackName))}

          {gameState === 'won' && (
            <div className={styles.winMessage}>
              <div className={styles.winEmoji}>🚂</div>
              <h3>Track Clear!</h3>
              <p>Completed in {moves} moves!{level.minMoves && moves === level.minMoves && ' (Perfect!)'}</p>
            </div>
          )}

          <div className={styles.buttons}>
            <button 
              className={styles.undoBtn} 
              onClick={handleUndo}
              disabled={history.length === 0}
            >
              Undo
            </button>
            <button className={styles.resetBtn} onClick={initGame}>
              Reset
            </button>
            {gameState === 'won' && (
              <button 
                className={styles.nextBtn} 
                onClick={generateNew}
              >
                New Puzzle →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
