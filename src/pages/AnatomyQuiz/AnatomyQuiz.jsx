/**
 * Anatomy Quiz
 *
 * Interactive quiz where users identify body parts by clicking
 * on a human body diagram.
 */

import { useState, useEffect, useCallback } from 'react';
import GameHeader from '../../components/GameHeader';
import { usePersistedState } from '../../hooks/usePersistedState';
import { BODY_SYSTEMS, getPartsBySystem, getRandomPart, SYSTEM_IDS } from '../../data/anatomyData';
import BodySVG from './BodySVG';
import styles from './AnatomyQuiz.module.css';

const FEEDBACK_DURATION = 1500;

export default function AnatomyQuiz() {
  const [selectedSystem, setSelectedSystem] = useState('all');
  const [currentPart, setCurrentPart] = useState(null);
  const [highlightedPart, setHighlightedPart] = useState(null);
  const [highlightType, setHighlightType] = useState(null);
  const [showHints, setShowHints] = useState(false);
  const [message, setMessage] = useState(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [stats, setStats] = usePersistedState('anatomy-quiz-stats', {
    played: 0,
    correct: 0,
    streak: 0,
    maxStreak: 0,
    bySystem: {},
  });

  // Get parts for current system
  const getActiveParts = useCallback(() => {
    if (selectedSystem === 'all') {
      return SYSTEM_IDS.flatMap(id =>
        getPartsBySystem(id).map(p => ({ ...p, systemId: id }))
      );
    }
    return getPartsBySystem(selectedSystem).map(p => ({
      ...p,
      systemId: selectedSystem
    }));
  }, [selectedSystem]);

  // Pick a new random part
  const pickNewPart = useCallback(() => {
    const parts = getActiveParts();
    if (parts.length === 0) return;

    // Avoid picking the same part twice in a row
    let newPart;
    let attempts = 0;
    do {
      const idx = Math.floor(Math.random() * parts.length);
      newPart = parts[idx];
      attempts++;
    } while (newPart?.id === currentPart?.id && attempts < 10 && parts.length > 1);

    setCurrentPart(newPart);
    setHighlightedPart(null);
    setHighlightType(null);
    setMessage(null);
    setWrongAttempts(0);
    setShowHints(false);
    setIsTransitioning(false);
  }, [getActiveParts, currentPart]);

  // Initialize on mount and when system changes
  useEffect(() => {
    pickNewPart();
  }, [selectedSystem]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle clicking on a body part
  const handlePartClick = useCallback((clickedPart) => {
    if (isTransitioning || !currentPart) return;

    if (!clickedPart) {
      // Clicked on body but not a hotspot
      setWrongAttempts(prev => prev + 1);
      setMessage({ text: 'Click on a highlighted region!', type: 'hint' });

      // Show hints after 2 wrong attempts
      if (wrongAttempts >= 1) {
        setShowHints(true);
      }
      return;
    }

    const isCorrect = clickedPart.id === currentPart.id;

    setHighlightedPart(clickedPart);
    setHighlightType(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      // Correct answer
      setMessage({ text: '✓ Correct!', type: 'success' });
      setIsTransitioning(true);

      // Update stats
      setStats(prev => {
        const newStreak = prev.streak + 1;
        const systemKey = currentPart.systemId || selectedSystem;
        const bySystem = { ...prev.bySystem };
        bySystem[systemKey] = (bySystem[systemKey] || 0) + 1;

        return {
          played: prev.played + 1,
          correct: prev.correct + 1,
          streak: newStreak,
          maxStreak: Math.max(prev.maxStreak, newStreak),
          bySystem,
        };
      });

      // Move to next question after delay
      setTimeout(() => {
        pickNewPart();
      }, FEEDBACK_DURATION);

    } else {
      // Wrong answer
      const newWrongAttempts = wrongAttempts + 1;
      setWrongAttempts(newWrongAttempts);
      setMessage({
        text: `✗ That's the ${clickedPart.name}`,
        type: 'error'
      });

      // Show hints after 2 wrong attempts
      if (newWrongAttempts >= 2) {
        setShowHints(true);
      }

      // Clear highlight after brief delay
      setTimeout(() => {
        setHighlightedPart(null);
        setHighlightType(null);
      }, 800);
    }
  }, [currentPart, wrongAttempts, isTransitioning, selectedSystem, setStats, pickNewPart]);

  // Handle giving up / skip
  const handleSkip = () => {
    if (isTransitioning) return;

    // Show the correct answer
    setHighlightedPart(currentPart);
    setHighlightType('correct');
    setMessage({ text: `The answer was: ${currentPart.name}`, type: 'reveal' });
    setIsTransitioning(true);

    // Update stats (count as played but not correct)
    setStats(prev => ({
      ...prev,
      played: prev.played + 1,
      streak: 0,
    }));

    // Move to next question
    setTimeout(() => {
      pickNewPart();
    }, FEEDBACK_DURATION + 500);
  };

  // Handle system change
  const handleSystemChange = (systemId) => {
    setSelectedSystem(systemId);
  };

  // Get display color for current system
  const getSystemColor = () => {
    if (selectedSystem === 'all') return '#a78bfa';
    return BODY_SYSTEMS[selectedSystem]?.color || '#666';
  };

  // Get current system display parts
  const displayParts = getActiveParts();

  return (
    <div className={styles.container}>
      <GameHeader
        title="Anatomy Quiz"
        instructions={currentPart ? (
          <>Click on the <strong>{currentPart.name}</strong></>
        ) : 'Loading...'}
      />

      {/* System selector */}
      <div className={styles.systemSelector}>
        <button
          className={`${styles.systemBtn} ${selectedSystem === 'all' ? styles.active : ''}`}
          onClick={() => handleSystemChange('all')}
          style={{ '--system-color': '#a78bfa' }}
        >
          <span className={styles.systemIcon}>🧬</span>
          <span>All Systems</span>
        </button>
        {SYSTEM_IDS.map(id => {
          const system = BODY_SYSTEMS[id];
          return (
            <button
              key={id}
              className={`${styles.systemBtn} ${selectedSystem === id ? styles.active : ''}`}
              onClick={() => handleSystemChange(id)}
              style={{ '--system-color': system.color }}
            >
              <span className={styles.systemIcon}>{system.icon}</span>
              <span>{system.name.replace(' System', '').replace('Internal ', '')}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.gameArea}>
        {/* Body diagram */}
        <div className={styles.bodyContainer}>
          <BodySVG
            parts={displayParts}
            targetPart={currentPart}
            onPartClick={handlePartClick}
            showHints={showHints}
            highlightedPart={highlightedPart}
            highlightType={highlightType}
            systemColor={getSystemColor()}
            selectedSystem={selectedSystem}
          />

          {/* Hint display */}
          {currentPart && showHints && !isTransitioning && (
            <div className={styles.hintBox}>
              <span className={styles.hintLabel}>Hint:</span> {currentPart.hint}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className={styles.sidePanel}>
          {/* Message display */}
          {message && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              {message.text}
            </div>
          )}

          {/* Current target info */}
          {currentPart && (
            <div className={styles.targetCard}>
              <div className={styles.targetLabel}>Find:</div>
              <div className={styles.targetName}>{currentPart.name}</div>
              {currentPart.systemId && (
                <div className={styles.targetSystem}>
                  {BODY_SYSTEMS[currentPart.systemId]?.icon} {BODY_SYSTEMS[currentPart.systemId]?.name}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <button
              className={styles.hintBtn}
              onClick={() => setShowHints(true)}
              disabled={showHints || isTransitioning}
            >
              💡 Show Hint
            </button>
            <button
              className={styles.skipBtn}
              onClick={handleSkip}
              disabled={isTransitioning}
            >
              ⏭️ Skip
            </button>
          </div>

          {/* Stats panel */}
          <div className={styles.statsPanel}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.played}</span>
              <span className={styles.statLabel}>Played</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {stats.played > 0 ? Math.round((stats.correct / stats.played) * 100) : 0}%
              </span>
              <span className={styles.statLabel}>Accuracy</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.streak}</span>
              <span className={styles.statLabel}>Streak</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.maxStreak}</span>
              <span className={styles.statLabel}>Best</span>
            </div>
          </div>

          {/* Wrong attempts indicator */}
          {wrongAttempts > 0 && !isTransitioning && (
            <div className={styles.attemptsInfo}>
              {wrongAttempts} wrong {wrongAttempts === 1 ? 'attempt' : 'attempts'}
              {wrongAttempts >= 2 && ' • Hint revealed!'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
