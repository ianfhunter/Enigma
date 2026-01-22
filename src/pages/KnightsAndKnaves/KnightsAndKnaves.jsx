import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import { usePersistedState } from '../../hooks/usePersistedState';
import styles from './KnightsAndKnaves.module.css';

function buildPuzzleIndex(puzzles) {
  const byId = new Map();
  for (const p of puzzles) byId.set(p.id, p);
  return byId;
}

function pickPracticePuzzleId(puzzles, peopleCount) {
  const filtered = puzzles.filter(p => p.peopleCount === peopleCount);
  if (filtered.length === 0) return null;
  const idx = Math.floor(Math.random() * filtered.length);
  return filtered[idx].id;
}

function pickDailyPuzzleId(dateString, puzzles) {
  if (!puzzles || puzzles.length === 0) return null;
  // Generate deterministic hash from date string
  const hash = dateString.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  const index = Math.abs(hash) % puzzles.length;
  return puzzles[index].id;
}

// Export helpers for testing
export {
  buildPuzzleIndex,
  pickPracticePuzzleId,
  pickDailyPuzzleId,
};

export default function KnightsAndKnaves() {
  const [puzzles, setPuzzles] = useState(null); // null while loading
  const [puzzleId, setPuzzleId] = useState(null);
  const [practicePeopleCount, setPracticePeopleCount] = useState(3);

  const [assignments, setAssignments] = useState([]); // (boolean|null)[]
  const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState('loading'); // loading | playing | correct
  const [message, setMessage] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [countedThisPuzzle, setCountedThisPuzzle] = useState(false);

  const [stats, setStats] = usePersistedState('knk-stats', {
    played: 0,
    won: 0,
    streak: 0,
    maxStreak: 0,
  });

  const puzzleIndex = useMemo(() => (puzzles ? buildPuzzleIndex(puzzles) : null), [puzzles]);
  const puzzle = useMemo(() => (puzzleIndex && puzzleId ? puzzleIndex.get(puzzleId) : null), [puzzleIndex, puzzleId]);

  const resetForPuzzle = useCallback((newPuzzleId, restored = null) => {
    setPuzzleId(newPuzzleId);
    if (restored) {
      setAssignments(restored.assignments ?? []);
      setAttempts(restored.attempts ?? 0);
      setStatus(restored.status ?? 'playing');
      setMessage(restored.message ?? '');
      setRevealed(restored.revealed ?? false);
      setCountedThisPuzzle(restored.countedThisPuzzle ?? false);
      return;
    }
    setAssignments([]);
    setAttempts(0);
    setStatus('playing');
    setMessage('');
    setRevealed(false);
    setCountedThisPuzzle(false);
  }, []);

  const initGame = useCallback(() => {
    if (!puzzles || puzzles.length === 0) return;
    const practiceId = pickPracticePuzzleId(puzzles, practicePeopleCount);
    resetForPuzzle(practiceId);
  }, [puzzles, practicePeopleCount, resetForPuzzle]);

  // Load puzzle data lazily
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await fetch('/datasets/knightsAndKnaves.json');
        if (!resp.ok) throw new Error(`Failed to load Knights & Knaves puzzles: ${resp.status}`);
        const data = await resp.json();
        if (!mounted) return;
        setPuzzles(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load Knights & Knaves puzzles:', e);
        if (mounted) setPuzzles([]);
      }
    })().catch((e) => {
      console.error('Failed to load Knights & Knaves puzzles:', e);
      setPuzzles([]);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Initialize once puzzles are ready
  useEffect(() => {
    if (!puzzles) return;
    initGame();
  }, [puzzles, initGame]);

  // Ensure assignments length matches puzzle size
  useEffect(() => {
    if (!puzzle) return;
    setAssignments((prev) => {
      const next = Array.from({ length: puzzle.names.length }, (_, i) => prev[i] ?? null);
      return next;
    });
  }, [puzzleId]); // eslint-disable-line react-hooks/exhaustive-deps


  const setPerson = (idx, isKnight) => {
    if (status === 'correct') return;
    setAssignments((prev) => {
      const next = [...prev];
      next[idx] = isKnight;
      return next;
    });
    setMessage('');
  };

  const checkAnswer = () => {
    if (!puzzle) return;
    if (assignments.some(v => v === null || typeof v !== 'boolean')) {
      setMessage('Assign Knight/Knave for everyone first.');
      return;
    }

    const correct = assignments.every((v, i) => v === puzzle.solution[i]);
    setAttempts((a) => a + 1);

    if (correct) {
      setStatus('correct');
      setMessage('Correct!');
      if (!countedThisPuzzle) {
        setCountedThisPuzzle(true);
        setStats(prev => ({
          played: prev.played + 1,
          won: prev.won + 1,
          streak: prev.streak + 1,
          maxStreak: Math.max(prev.maxStreak, prev.streak + 1),
        }));
      }
    } else {
      setMessage('Not quite — adjust and try again.');
    }
  };

  const newPracticePuzzle = () => {
    if (!puzzles) return;
    const id = pickPracticePuzzleId(puzzles, practicePeopleCount);
    resetForPuzzle(id);
  };

  const revealSolution = () => {
    setRevealed(true);
    if (!countedThisPuzzle) {
      setCountedThisPuzzle(true);
      setStats(prev => ({
        ...prev,
        played: prev.played + 1,
        streak: 0,
      }));
    }
  };

  const titleSuffix = puzzle ? ` (${puzzle.peopleCount} people)` : '';

  return (
    <div className={styles.container}>
      <GameHeader
        title={`Knights & Knaves${titleSuffix}`}
        instructions="Each inhabitant is either a Knight (always tells the truth) or a Knave (always lies). Assign each person correctly."
      />

      <div className={styles.controls}>
        <div className={styles.practiceControls}>
          <label className={styles.label}>
            People
            <select
              className={styles.select}
              value={practicePeopleCount}
              onChange={(e) => {
                setPracticePeopleCount(Number(e.target.value));
                // Generate new puzzle when people count changes
                setTimeout(() => {
                  if (puzzles) {
                    const id = pickPracticePuzzleId(puzzles, Number(e.target.value));
                    resetForPuzzle(id);
                  }
                }, 0);
              }}
            >
              {[2, 3, 4, 5, 6, 7, 8].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <button className={styles.secondaryBtn} onClick={newPracticePuzzle} disabled={!puzzles}>
            New Puzzle
          </button>
        </div>
      </div>

      <div className={styles.gameArea}>
        {!puzzles && (
          <div className={styles.loading}>Loading puzzles...</div>
        )}

        {puzzles && puzzles.length === 0 && (
          <div className={styles.loading}>No puzzles available.</div>
        )}

        {puzzle && (
          <>
            <div className={styles.puzzleCard}>
              <div className={styles.quizText}>{puzzle.quiz}</div>
            </div>

            <div className={styles.assignmentCard}>
              <div className={styles.assignmentTitle}>Your assignments</div>
              <div className={styles.peopleGrid}>
                {puzzle.names.map((name, i) => {
                  const choice = assignments[i];
                  return (
                    <div key={name} className={styles.personRow}>
                      <div className={styles.personName}>{name}</div>
                      <div className={styles.toggleGroup}>
                        <button
                          className={`${styles.toggleBtn} ${choice === true ? styles.selected : ''}`}
                          onClick={() => setPerson(i, true)}
                        >
                          Knight
                        </button>
                        <button
                          className={`${styles.toggleBtn} ${choice === false ? styles.selected : ''}`}
                          onClick={() => setPerson(i, false)}
                        >
                          Knave
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.actions}>
                <button className={styles.primaryBtn} onClick={checkAnswer} disabled={status === 'correct'}>
                  Check
                </button>
                <button className={styles.secondaryBtn} onClick={revealSolution}>
                  Reveal Solution
                </button>
                <div className={styles.meta}>
                  Attempts: <strong>{attempts}</strong>
                </div>
              </div>

              {message && (
                <div className={`${styles.message} ${status === 'correct' ? styles.messageSuccess : ''}`}>
                  {message}
                </div>
              )}
            </div>

            {(status === 'correct' || revealed) && (
              <div className={styles.solutionCard}>
                <div className={styles.solutionTitle}>Solution</div>
                <div className={styles.solutionText}>
                  {puzzle.solutionTextFormat || puzzle.solutionText || 'Solution unavailable.'}
                </div>
              </div>
            )}

            <div className={styles.statsPanel}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{stats.played}</span>
                <span className={styles.statLabel}>Played</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  {stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0}%
                </span>
                <span className={styles.statLabel}>Win %</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{stats.streak}</span>
                <span className={styles.statLabel}>Streak</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{stats.maxStreak}</span>
                <span className={styles.statLabel}>Max</span>
              </div>
            </div>

            <div className={styles.attribution}>
              Puzzles sourced from <a href="https://huggingface.co/datasets/K-and-K/knights-and-knaves" target="_blank" rel="noreferrer">K-and-K/knights-and-knaves</a> (CC BY-NC-SA 4.0).
            </div>
          </>
        )}
      </div>
    </div>
  );
}
