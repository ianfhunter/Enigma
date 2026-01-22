import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import StatsPanel from '../../components/StatsPanel';
import { usePersistedState } from '../../hooks/usePersistedState';
import styles from './Trivia.module.css';

// Import trivia data files
import generalTrivia from '@datasets/trivia_datasets/opentriviaqa.txt?raw';
import animalsTrivia from '@datasets/trivia_datasets/opentriviaqa_animals.txt?raw';
import entertainmentTrivia from '@datasets/trivia_datasets/opentriviaqa_entertainment.txt?raw';
import geographyTrivia from '@datasets/trivia_datasets/opentriviaqa_geography.txt?raw';
import historyTrivia from '@datasets/trivia_datasets/opentriviaqa_history.txt?raw';
import literatureTrivia from '@datasets/trivia_datasets/opentriviaqa_literature.txt?raw';
import musicTrivia from '@datasets/trivia_datasets/opentriviaqa_music.txt?raw';
import sportsTrivia from '@datasets/trivia_datasets/opentriviaqa_sports.txt?raw';

const TOTAL_ROUNDS = 15;

// Parse OpenTriviaQA format
const parseTrivia = (text, category) => {
  const questions = [];
  const lines = text.split('\n');
  let currentQuestion = null;
  let correctAnswer = null;
  let options = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('#Q ')) {
      // Save previous question if exists
      if (currentQuestion && correctAnswer && options.length >= 2) {
        questions.push({
          question: currentQuestion,
          answer: correctAnswer,
          options: options,
          category
        });
      }
      // Start new question
      currentQuestion = trimmed.substring(3).trim();
      correctAnswer = null;
      options = [];
    } else if (trimmed.startsWith('^ ')) {
      correctAnswer = trimmed.substring(2).trim();
    } else if (/^[A-D] /.test(trimmed)) {
      options.push(trimmed.substring(2).trim());
    }
  }

  // Don't forget the last question
  if (currentQuestion && correctAnswer && options.length >= 2) {
    questions.push({
      question: currentQuestion,
      answer: correctAnswer,
      options: options,
      category
    });
  }

  return questions;
};

// Category configuration
const CATEGORIES = [
  { id: 'all', name: 'All Categories', icon: '🎯', color: '#7c3aed' },
  { id: 'general', name: 'General Knowledge', icon: '🧠', color: '#8b5cf6' },
  { id: 'animals', name: 'Animals', icon: '🦁', color: '#22c55e' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#ec4899' },
  { id: 'geography', name: 'Geography', icon: '🌍', color: '#06b6d4' },
  { id: 'history', name: 'History', icon: '📜', color: '#f59e0b' },
  { id: 'literature', name: 'Literature', icon: '📚', color: '#6366f1' },
  { id: 'music', name: 'Music', icon: '🎵', color: '#ef4444' },
  { id: 'sports', name: 'Sports', icon: '⚽', color: '#10b981' },
];

// Lazy load and parse all trivia
const getAllTrivia = () => {
  const all = [
    ...parseTrivia(generalTrivia, 'general'),
    ...parseTrivia(animalsTrivia, 'animals'),
    ...parseTrivia(entertainmentTrivia, 'entertainment'),
    ...parseTrivia(geographyTrivia, 'geography'),
    ...parseTrivia(historyTrivia, 'history'),
    ...parseTrivia(literatureTrivia, 'literature'),
    ...parseTrivia(musicTrivia, 'music'),
    ...parseTrivia(sportsTrivia, 'sports'),
  ];
  return all;
};

// Shuffle array helper
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// Export helpers for testing
export {
  parseTrivia,
  CATEGORIES,
  getAllTrivia,
  shuffle,
  TOTAL_ROUNDS,
};

export default function Trivia() {
  const { t } = useTranslation();
  const [mode, setMode] = useState(null);
  const [category, setCategory] = useState('all');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [stats, setStats] = usePersistedState('trivia-stats', { played: 0, won: 0, totalCorrect: 0, bestStreak: 0 });

  // Parse all trivia data once
  const allTrivia = useMemo(() => getAllTrivia(), []);

  // Get count per category
  const categoryCounts = useMemo(() => {
    const counts = { all: allTrivia.length };
    CATEGORIES.forEach(cat => {
      if (cat.id !== 'all') {
        counts[cat.id] = allTrivia.filter(q => q.category === cat.id).length;
      }
    });
    return counts;
  }, [allTrivia]);

  const startGame = (selectedMode, selectedCategory) => {
    setMode(selectedMode);
    setCategory(selectedCategory);

    // Filter and shuffle questions
    let filtered = selectedCategory === 'all'
      ? allTrivia
      : allTrivia.filter(q => q.category === selectedCategory);

    const shuffled = shuffle(filtered);
    const gameQuestions = selectedMode === 'challenge'
      ? shuffled.slice(0, TOTAL_ROUNDS)
      : shuffled;

    setQuestions(gameQuestions);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setGameOver(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  const handleGuess = (answer) => {
    if (selectedAnswer !== null) return;

    const currentQuestion = questions[currentIndex];
    setSelectedAnswer(answer);
    const correct = answer === currentQuestion.answer;
    setIsCorrect(correct);

    if (correct) {
      setScore(prev => prev + 1);
      setStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak > stats.bestStreak) {
          setStats(s => ({ ...s, bestStreak: newStreak }));
        }
        return newStreak;
      });
      setStats(prev => ({ ...prev, totalCorrect: prev.totalCorrect + 1 }));
    } else {
      setStreak(0);
    }
  };

  const nextQuestion = () => {
    if (mode === 'challenge' && currentIndex >= TOTAL_ROUNDS - 1) {
      setGameOver(true);
      setStats(prev => ({
        ...prev,
        played: prev.played + 1,
        won: score >= Math.floor(TOTAL_ROUNDS / 2) ? prev.won + 1 : prev.won
      }));
      return;
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } else if (mode === 'endless') {
      // Reshuffle and continue for endless mode
      const shuffled = shuffle(category === 'all' ? allTrivia : allTrivia.filter(q => q.category === category));
      setQuestions(shuffled);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setIsCorrect(null);
    }
  };

  const backToMenu = () => {
    setMode(null);
    setQuestions([]);
    setGameOver(false);
  };

  const getCategoryInfo = (catId) => CATEGORIES.find(c => c.id === catId) || CATEGORIES[0];

  // Menu screen
  if (!mode) {
    return (
      <div className={styles.container}>
        <GameHeader
          title="Trivia"
          instructions="Test your knowledge across multiple categories! Choose a category and game mode."
        />

        <div className={styles.menuArea}>
          <div className={styles.categorySection}>
            <h2 className={styles.sectionTitle}>{t('common.selectCategory')}</h2>
            <div className={styles.categoryGrid}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`${styles.categoryCard} ${category === cat.id ? styles.selected : ''}`}
                  onClick={() => setCategory(cat.id)}
                  style={{ '--cat-color': cat.color }}
                >
                  <span className={styles.categoryIcon}>{cat.icon}</span>
                  <span className={styles.categoryName}>{cat.name}</span>
                  <span className={styles.categoryCount}>{categoryCounts[cat.id]} questions</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.modeSection}>
            <h2 className={styles.sectionTitle}>{t('common.gameMode')}</h2>
            <div className={styles.modeCards}>
              <button className={styles.modeCard} onClick={() => startGame('challenge', category)}>
                <span className={styles.modeIcon}>🏆</span>
                <span className={styles.modeTitle}>Challenge</span>
                <span className={styles.modeDesc}>{TOTAL_ROUNDS} questions</span>
              </button>

              <button className={styles.modeCard} onClick={() => startGame('endless', category)}>
                <span className={styles.modeIcon}>∞</span>
                <span className={styles.modeTitle}>Endless</span>
                <span className={styles.modeDesc}>Keep playing!</span>
              </button>
            </div>
          </div>

          <StatsPanel
            stats={[
              { label: 'Played', value: stats.played },
              { label: 'Correct', value: stats.totalCorrect },
              { label: 'Best Streak', value: stats.bestStreak },
              { label: 'Win Rate', value: `${stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0}%` },
            ]}
          />

          <div className={styles.dataInfo}>
            <span>🧠 {allTrivia.length.toLocaleString()} trivia questions</span>
          </div>
        </div>
      </div>
    );
  }

  // Game over screen
  if (gameOver) {
    const percentage = Math.round((score / TOTAL_ROUNDS) * 100);
    const isPerfect = score === TOTAL_ROUNDS;
    const catInfo = getCategoryInfo(category);

    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Quiz Complete!</h1>
        </div>

        <div className={styles.gameOverArea}>
          <div className={styles.categoryBadge} style={{ '--cat-color': catInfo.color }}>
            {catInfo.icon} {catInfo.name}
          </div>

          <div className={styles.finalScore}>
            <span className={styles.scoreNumber}>{score}</span>
            <span className={styles.scoreTotal}>/ {TOTAL_ROUNDS}</span>
          </div>

          <div className={styles.resultMessage}>
            {isPerfect && <span className={styles.perfect}>🎉 Perfect Score! 🎉</span>}
            {percentage >= 80 && !isPerfect && <span>🌟 Excellent!</span>}
            {percentage >= 60 && percentage < 80 && <span>👍 Good job!</span>}
            {percentage >= 40 && percentage < 60 && <span>Keep practicing!</span>}
            {percentage < 40 && <span>Better luck next time!</span>}
          </div>

          <div className={styles.gameOverActions}>
            <button className={styles.playAgainBtn} onClick={() => startGame('challenge', category)}>
              Play Again
            </button>
            <button className={styles.menuBtn} onClick={backToMenu}>
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game screen
  const currentQuestion = questions[currentIndex];
  const catInfo = getCategoryInfo(currentQuestion?.category || category);

  if (!currentQuestion) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading questions...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backLink} onClick={backToMenu}>← Back to Menu</button>
        <h1 className={styles.title}>Trivia</h1>

        <div className={styles.gameInfo}>
          <span className={styles.categoryBadge} style={{ '--cat-color': catInfo.color }}>
            {catInfo.icon} {catInfo.name}
          </span>
          {mode === 'challenge' && (
            <span className={styles.roundInfo}>{t('common.question')} {currentIndex + 1}/{TOTAL_ROUNDS}</span>
          )}
          {mode === 'endless' && (
            <span className={styles.roundInfo}>{t('common.question')} {currentIndex + 1}</span>
          )}
          <span className={styles.scoreInfo}>{t('gameStatus.score')}: {score}</span>
          {streak > 1 && <span className={styles.streakBadge}>🔥 {streak} streak</span>}
        </div>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.questionCard}>
          <p className={styles.questionText}>{currentQuestion.question}</p>
        </div>

        <div className={styles.optionsGrid}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isAnswer = option === currentQuestion.answer;
            const showResult = selectedAnswer !== null;

            let buttonClass = styles.optionBtn;
            if (showResult) {
              if (isAnswer) {
                buttonClass += ` ${styles.correct}`;
              } else if (isSelected && !isAnswer) {
                buttonClass += ` ${styles.wrong}`;
              }
            }

            return (
              <button
                key={index}
                className={buttonClass}
                onClick={() => handleGuess(option)}
                disabled={selectedAnswer !== null}
              >
                <span className={styles.optionLetter}>{String.fromCharCode(65 + index)}</span>
                <span className={styles.optionText}>{option}</span>
              </button>
            );
          })}
        </div>

        {selectedAnswer !== null && (
          <div className={styles.resultArea}>
            <div className={isCorrect ? styles.correctMsg : styles.wrongMsg}>
              {isCorrect ? '✓ Correct!' : `✗ Wrong! The answer is: ${currentQuestion.answer}`}
            </div>

            <button className={styles.nextBtn} onClick={nextQuestion}>
              {mode === 'challenge' && currentIndex >= TOTAL_ROUNDS - 1 ? 'See Results' : 'Next Question →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
