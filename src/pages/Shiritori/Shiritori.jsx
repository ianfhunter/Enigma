import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  getLastKana,
  endsInN,
  getWordsByStartKana,
  getWordData,
  getSafeStartWords,
  startsWithKana,
  setCommonOnlyFilter,
  getCommonOnlyFilter,
  getWordStats,
} from '@datasets/japaneseWords';
import styles from './Shiritori.module.css';

// Japanese Shiritori: Last kana of word = first kana of next word
// If you say a word ending in ん, you lose!

// UI text in both languages
const TEXT = {
  native: {
    title: 'しりとり',
    subtitle: 'Shiritori',
    instructions: '日本語の言葉を繋げよう！前の言葉の最後の音で始まる言葉を言おう。',
    warning: '⚠️ 「ん」で終わる言葉を言ったら負け！',
    chain: 'チェーン',
    wins: '勝ち',
    best: '最高',
    nextIs: '次は:',
    startsWith: 'で始まる言葉',
    placeholder: (kana) => `ローマ字で入力... (${kana}...)`,
    submit: '言う',
    hint: 'ローマ字で入力してください (例: sakura, neko, yama)',
    giveUp: '降参する',
    newGame: '新しいゲーム',
    thinking: '🤖 考えています...',
    unknownWord: '知らない言葉です',
    mustStartWith: (kana) => `「${kana}」で始まる言葉を言ってください！`,
    alreadyUsed: 'もう使った言葉です！',
    playerWin: (len) => `🎉 勝ち！ AIが言葉を見つけられませんでした。チェーン: ${len}`,
    nLose: (len) => `💀「ん」で終わったので負けです！チェーン: ${len}`,
    gameOver: (len) => `ゲームオーバー！チェーン: ${len}`,
    couldHavePlayed: '言えた言葉:',
    commonWords: '一般的な言葉のみ',
    allWords: '全ての言葉',
    wordCount: (count) => `${count.toLocaleString()} 語`,
  },
  beginner: {
    title: 'しりとり',
    subtitle: 'Shiritori',
    instructions: 'Chain Japanese words! Say a word that starts with the last sound of the previous word.',
    warning: '⚠️ If you say a word ending in "ん" (n), you lose!',
    chain: 'Chain',
    wins: 'Wins',
    best: 'Best',
    nextIs: 'Next:',
    startsWith: '... word',
    placeholder: (kana) => `Type in romaji... (${kana}...)`,
    submit: 'Say',
    hint: 'Type in romaji (e.g., sakura, neko, yama)',
    giveUp: 'Give Up',
    newGame: 'New Game',
    thinking: '🤖 Thinking...',
    unknownWord: 'Unknown word',
    mustStartWith: (kana) => `Word must start with "${kana}"!`,
    alreadyUsed: 'Already used!',
    playerWin: (len) => `🎉 You win! AI couldn't find a word. Chain: ${len}`,
    nLose: (len) => `💀 You said a word ending in "ん"! Chain: ${len}`,
    gameOver: (len) => `Game Over! Chain: ${len}`,
    couldHavePlayed: 'You could have played:',
    commonWords: 'Common words only',
    allWords: 'All words',
    wordCount: (count) => `${count.toLocaleString()} words`,
  },
};

function getRandomStartWord() {
  const safeWords = getSafeStartWords();
  const shuffled = [...safeWords].sort(() => Math.random() - 0.5);
  return shuffled[0];
}

function getAIWord(lastKana, usedWords) {
  // Find a word starting with lastKana that hasn't been used
  const candidates = getWordsByStartKana(lastKana);

  // First try to find a word that doesn't end in ん
  for (const word of candidates) {
    if (!usedWords.has(word.hiragana) && !endsInN(word.hiragana)) {
      return word;
    }
  }

  // If only ん-ending words are left, AI will say one and lose
  for (const word of candidates) {
    if (!usedWords.has(word.hiragana)) {
      return word;
    }
  }

  return null;
}

export default function Shiritori() {
  const [chain, setChain] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [message, setMessage] = useState('');
  const [gameState, setGameState] = useState('playing'); // 'playing', 'playerWin', 'aiWin', 'nLose'
  const [usedWords, setUsedWords] = useState(new Set());
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('shiritori-lang');
    return saved || 'beginner';
  });
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('shiritori-stats');
    return saved ? JSON.parse(saved) : { wins: 0, losses: 0, longestChain: 0 };
  });
  const [suggestions, setSuggestions] = useState([]);
  const [commonOnly, setCommonOnly] = useState(() => {
    const saved = localStorage.getItem('shiritori-common-only');
    const initial = saved === 'true';
    setCommonOnlyFilter(initial);
    return initial;
  });

  const inputRef = useRef(null);
  const chainRef = useRef(null);
  const t = TEXT[lang];
  const wordStats = getWordStats();

  const initGame = useCallback(() => {
    const startWord = getRandomStartWord();
    setChain([{ ...startWord, player: 'ai' }]);
    setUsedWords(new Set([startWord.hiragana]));
    setCurrentInput('');
    setMessage('');
    setGameState('playing');
    setIsAIThinking(false);
    setSuggestions([]);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    localStorage.setItem('shiritori-stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('shiritori-lang', lang);
  }, [lang]);

  useEffect(() => {
    if (inputRef.current && !isAIThinking && gameState === 'playing') {
      inputRef.current.focus();
    }
  }, [isAIThinking, chain, gameState]);

  useEffect(() => {
    // Scroll chain to bottom when new words are added
    if (chainRef.current) {
      chainRef.current.scrollTop = chainRef.current.scrollHeight;
    }
  }, [chain]);

  const getRequiredKana = () => {
    if (chain.length === 0) return '';
    const lastWord = chain[chain.length - 1];
    return getLastKana(lastWord.hiragana);
  };

  const toggleLang = () => {
    setLang(prev => prev === 'native' ? 'beginner' : 'native');
  };

  const toggleCommonOnly = () => {
    setCommonOnly(prev => {
      const newValue = !prev;
      setCommonOnlyFilter(newValue);
      localStorage.setItem('shiritori-common-only', newValue.toString());
      // Restart game with new word set
      initGame();
      return newValue;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentInput || gameState !== 'playing' || isAIThinking) return;

    const input = currentInput.toLowerCase().trim();
    const wordData = getWordData(input);
    const requiredKana = getRequiredKana();

    // Check if valid word
    if (!wordData) {
      setMessage(t.unknownWord);
      return;
    }

    // Check if starts with required kana
    if (!startsWithKana(wordData, requiredKana)) {
      setMessage(t.mustStartWith(requiredKana));
      return;
    }

    // Check if already used
    if (usedWords.has(wordData.hiragana)) {
      setMessage(t.alreadyUsed);
      return;
    }

    // Add player word
    const newChain = [...chain, { ...wordData, player: 'human' }];
    const newUsedWords = new Set(usedWords);
    newUsedWords.add(wordData.hiragana);

    setChain(newChain);
    setUsedWords(newUsedWords);
    setCurrentInput('');
    setMessage('');

    // Check if player said a word ending in ん
    if (endsInN(wordData.hiragana)) {
      setGameState('nLose');
      setStats(prev => ({
        ...prev,
        losses: prev.losses + 1,
        longestChain: Math.max(prev.longestChain, newChain.length),
      }));
      return;
    }

    // AI's turn
    setIsAIThinking(true);

    setTimeout(() => {
      const lastKana = getLastKana(wordData.hiragana);
      const aiWord = getAIWord(lastKana, newUsedWords);

      if (aiWord) {
        // Check if AI is forced to say a ん word
        if (endsInN(aiWord.hiragana)) {
          const aiChain = [...newChain, { ...aiWord, player: 'ai' }];
          setChain(aiChain);
          setGameState('playerWin');
          setIsAIThinking(false);
          setStats(prev => ({
            ...prev,
            wins: prev.wins + 1,
            longestChain: Math.max(prev.longestChain, aiChain.length),
          }));
          return;
        }

        const aiChain = [...newChain, { ...aiWord, player: 'ai' }];
        const aiUsedWords = new Set(newUsedWords);
        aiUsedWords.add(aiWord.hiragana);

        setChain(aiChain);
        setUsedWords(aiUsedWords);
        setIsAIThinking(false);

        // Update longest chain
        if (aiChain.length > stats.longestChain) {
          setStats(prev => ({ ...prev, longestChain: aiChain.length }));
        }
      } else {
        // AI can't find a word - player wins!
        setGameState('playerWin');
        setIsAIThinking(false);
        setStats(prev => ({
          ...prev,
          wins: prev.wins + 1,
          longestChain: Math.max(prev.longestChain, newChain.length),
        }));
      }
    }, 1000);
  };

  const handleGiveUp = () => {
    // Find words the player could have played
    const requiredKana = getRequiredKana();
    const candidates = getWordsByStartKana(requiredKana);
    const availableWords = candidates
      .filter(word => !usedWords.has(word.hiragana) && !endsInN(word.hiragana))
      .slice(0, 5); // Show up to 5 suggestions

    setSuggestions(availableWords);
    setGameState('aiWin');
    setStats(prev => ({
      ...prev,
      losses: prev.losses + 1,
      longestChain: Math.max(prev.longestChain, chain.length),
    }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>{t.title}</h1>
        <p className={styles.subtitle}>{t.subtitle}</p>

        <div className={styles.toggleGroup}>
          <button className={styles.langToggle} onClick={toggleLang}>
            <span className={`${styles.langOption} ${lang === 'native' ? styles.active : ''}`}>
              Native
            </span>
            <span className={`${styles.langOption} ${lang === 'beginner' ? styles.active : ''}`}>
              Beginner
            </span>
          </button>

          <button className={styles.langToggle} onClick={toggleCommonOnly}>
            <span className={`${styles.langOption} ${commonOnly ? styles.active : ''}`}>
              {t.commonWords}
            </span>
            <span className={`${styles.langOption} ${!commonOnly ? styles.active : ''}`}>
              {t.allWords}
            </span>
          </button>
        </div>

        <p className={styles.wordCountInfo}>
          {t.wordCount(wordStats.current)}
        </p>

        <p className={styles.instructions}>
          {t.instructions}
          <br />
          <span className={styles.warning}>{t.warning}</span>
        </p>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>{t.chain}</span>
            <span className={styles.statValue}>{chain.length}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>{t.wins}</span>
            <span className={styles.statValue}>{stats.wins}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>{t.best}</span>
            <span className={styles.statValue}>{stats.longestChain}</span>
          </div>
        </div>

        <div className={styles.chain} ref={chainRef}>
          {chain.map((entry, index) => (
            <div
              key={index}
              className={`${styles.chainWord} ${styles[entry.player]}`}
            >
              <div className={styles.wordContent}>
                <span className={styles.hiragana}>
                  {entry.hiragana.split('').map((char, i) => (
                    <span
                      key={i}
                      className={
                        i === 0 && index > 0 ? styles.startKana :
                        i === entry.hiragana.length - 1 ?
                          (char === 'ん' ? styles.nKana : styles.endKana) : ''
                      }
                    >
                      {char}
                    </span>
                  ))}
                </span>
                <span className={styles.romaji}>{entry.romaji}</span>
                <span className={styles.meaning}>{entry.meaning}</span>
              </div>
              <span className={styles.playerLabel}>
                {entry.player === 'ai' ? '🤖' : '👤'}
              </span>
            </div>
          ))}

          {isAIThinking && (
            <div className={styles.thinking}>
              {t.thinking}
            </div>
          )}
        </div>

        {gameState === 'playing' && !isAIThinking && (
          <>
            <div className={styles.nextKana}>
              {t.nextIs} <span className={styles.kanaHighlight}>{getRequiredKana()}</span> {t.startsWith}
            </div>

            <form className={styles.inputForm} onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={(e) => {
                  setCurrentInput(e.target.value);
                  setMessage('');
                }}
                placeholder={t.placeholder(getRequiredKana())}
                className={styles.input}
              />
              <button type="submit" className={styles.submitBtn}>
                {t.submit}
              </button>
            </form>

            <p className={styles.hint}>
              {t.hint}
            </p>

            <button className={styles.giveUpBtn} onClick={handleGiveUp}>
              {t.giveUp}
            </button>
          </>
        )}

        {message && (
          <div className={styles.message}>{message}</div>
        )}

        {gameState === 'playerWin' && (
          <div className={styles.winMessage}>
            {t.playerWin(chain.length)}
          </div>
        )}

        {gameState === 'nLose' && (
          <div className={styles.loseMessage}>
            {t.nLose(chain.length)}
          </div>
        )}

        {gameState === 'aiWin' && (
          <div className={styles.loseMessage}>
            {t.gameOver(chain.length)}
          </div>
        )}

        {gameState === 'aiWin' && suggestions.length > 0 && (
          <div className={styles.suggestions}>
            <p className={styles.suggestionsTitle}>{t.couldHavePlayed}</p>
            <div className={styles.suggestionsList}>
              {suggestions.map((word, i) => (
                <div key={i} className={styles.suggestionWord}>
                  <span className={styles.suggestionHiragana}>{word.hiragana}</span>
                  <span className={styles.suggestionRomaji}>{word.romaji}</span>
                  <span className={styles.suggestionMeaning}>{word.meaning}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button className={styles.newGameBtn} onClick={initGame}>
          {t.newGame}
        </button>
      </div>
    </div>
  );
}
