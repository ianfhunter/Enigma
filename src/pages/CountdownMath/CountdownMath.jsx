import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import { shuffleArray, randomInt, pickRandom } from '../../data/wordUtils';
import styles from './CountdownMath.module.css';

// Large numbers available in Countdown
const LARGE_NUMBERS = [25, 50, 75, 100];
// Small numbers available (1-10, with duplicates in the pool)
const SMALL_NUMBERS = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10];

const OPERATIONS = ['+', '−', '×', '÷'];
const OP_MAP = { '+': '+', '−': '-', '×': '*', '÷': '/' };
const DISPLAY_OP = { '+': '+', '-': '−', '*': '×', '/': '÷' };

/**
 * Generate a set of 6 numbers based on the number of large numbers requested
 */
function generateNumbers(largeCount) {
  const large = pickRandom(LARGE_NUMBERS, largeCount);
  const small = pickRandom(SMALL_NUMBERS, 6 - largeCount);
  return shuffleArray([...large, ...small]);
}

/**
 * Token types for the expression
 */
const TokenType = {
  NUMBER: 'number',
  OPERATOR: 'operator',
  OPEN_BRACKET: 'open',
  CLOSE_BRACKET: 'close',
};

/**
 * Parse and evaluate an expression with proper operator precedence and brackets
 * Returns null if invalid (division not exact, negative intermediate, etc.)
 */
function evaluateTokens(tokens) {
  if (tokens.length === 0) return null;

  // Convert tokens to a string expression for evaluation
  // But we need to validate Countdown rules (no negatives, exact division only)

  // First, parse into a proper expression tree
  try {
    const result = parseExpression(tokens, 0);
    if (result.index !== tokens.length) return null; // Didn't consume all tokens
    return result.value;
  } catch {
    return null;
  }
}

/**
 * Recursive descent parser for expressions with brackets
 */
function parseExpression(tokens, startIndex) {
  // Parse addition/subtraction (lowest precedence)
  let result = parseTerm(tokens, startIndex);
  if (result.value === null) return result;

  while (result.index < tokens.length) {
    const token = tokens[result.index];
    if (token.type !== TokenType.OPERATOR || (token.value !== '+' && token.value !== '-')) {
      break;
    }

    const op = token.value;
    const right = parseTerm(tokens, result.index + 1);
    if (right.value === null) return { value: null, index: right.index };

    if (op === '+') {
      result = { value: result.value + right.value, index: right.index };
    } else {
      result = { value: result.value - right.value, index: right.index };
      if (result.value < 0) return { value: null, index: right.index };
    }
  }

  return result;
}

function parseTerm(tokens, startIndex) {
  // Parse multiplication/division (higher precedence)
  let result = parseFactor(tokens, startIndex);
  if (result.value === null) return result;

  while (result.index < tokens.length) {
    const token = tokens[result.index];
    if (token.type !== TokenType.OPERATOR || (token.value !== '*' && token.value !== '/')) {
      break;
    }

    const op = token.value;
    const right = parseFactor(tokens, result.index + 1);
    if (right.value === null) return { value: null, index: right.index };

    if (op === '*') {
      result = { value: result.value * right.value, index: right.index };
    } else {
      if (right.value === 0 || result.value % right.value !== 0) {
        return { value: null, index: right.index };
      }
      result = { value: result.value / right.value, index: right.index };
    }
  }

  return result;
}

function parseFactor(tokens, startIndex) {
  // Parse numbers and bracketed expressions
  if (startIndex >= tokens.length) return { value: null, index: startIndex };

  const token = tokens[startIndex];

  if (token.type === TokenType.NUMBER) {
    return { value: token.value, index: startIndex + 1 };
  }

  if (token.type === TokenType.OPEN_BRACKET) {
    const result = parseExpression(tokens, startIndex + 1);
    if (result.value === null) return result;

    if (result.index >= tokens.length || tokens[result.index].type !== TokenType.CLOSE_BRACKET) {
      return { value: null, index: result.index };
    }

    return { value: result.value, index: result.index + 1 };
  }

  return { value: null, index: startIndex };
}

/**
 * Check if brackets are balanced
 */
function areBracketsBalanced(tokens) {
  let depth = 0;
  for (const token of tokens) {
    if (token.type === TokenType.OPEN_BRACKET) depth++;
    if (token.type === TokenType.CLOSE_BRACKET) depth--;
    if (depth < 0) return false;
  }
  return depth === 0;
}

/**
 * Get current bracket depth
 */
function getBracketDepth(tokens) {
  let depth = 0;
  for (const token of tokens) {
    if (token.type === TokenType.OPEN_BRACKET) depth++;
    if (token.type === TokenType.CLOSE_BRACKET) depth--;
  }
  return depth;
}

/**
 * Check what token type can come next
 */
function getNextAllowed(tokens) {
  if (tokens.length === 0) {
    return { number: true, operator: false, openBracket: true, closeBracket: false };
  }

  const lastToken = tokens[tokens.length - 1];
  const depth = getBracketDepth(tokens);

  switch (lastToken.type) {
    case TokenType.NUMBER:
      return {
        number: false,
        operator: true,
        openBracket: false,
        closeBracket: depth > 0
      };
    case TokenType.OPERATOR:
      return { number: true, operator: false, openBracket: true, closeBracket: false };
    case TokenType.OPEN_BRACKET:
      return { number: true, operator: false, openBracket: true, closeBracket: false };
    case TokenType.CLOSE_BRACKET:
      return {
        number: false,
        operator: true,
        openBracket: false,
        closeBracket: depth > 0
      };
    default:
      return { number: false, operator: false, openBracket: false, closeBracket: false };
  }
}

/**
 * Solver: Find the best solution using recursive search with brackets
 */
function solve(numbers, target, timeLimit = 2000) {
  const startTime = Date.now();
  let bestSolution = null;
  let bestDiff = Infinity;

  function combine(a, b, aExpr, bExpr) {
    const results = [];

    // Addition (commutative, only need one order)
    results.push({ value: a + b, expr: `(${aExpr} + ${bExpr})` });

    // Subtraction (both orders)
    if (a >= b) results.push({ value: a - b, expr: `(${aExpr} − ${bExpr})` });
    if (b > a) results.push({ value: b - a, expr: `(${bExpr} − ${aExpr})` });

    // Multiplication (commutative)
    if (a !== 1 && b !== 1) {
      results.push({ value: a * b, expr: `(${aExpr} × ${bExpr})` });
    }

    // Division (both orders, must be exact)
    if (b !== 0 && a % b === 0 && b !== 1) {
      results.push({ value: a / b, expr: `(${aExpr} ÷ ${bExpr})` });
    }
    if (a !== 0 && b % a === 0 && a !== 1) {
      results.push({ value: b / a, expr: `(${bExpr} ÷ ${aExpr})` });
    }

    return results.filter(r => r.value >= 0 && Number.isInteger(r.value));
  }

  function search(available) {
    if (Date.now() - startTime > timeLimit) return;
    if (bestDiff === 0) return;

    // Check each available number/expression against target
    for (const item of available) {
      const diff = Math.abs(item.value - target);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestSolution = {
          expression: item.expr,
          result: item.value,
          exact: diff === 0
        };
        if (diff === 0) return;
      }
    }

    if (available.length < 2) return;

    // Try combining each pair
    for (let i = 0; i < available.length; i++) {
      for (let j = i + 1; j < available.length; j++) {
        const combinations = combine(
          available[i].value,
          available[j].value,
          available[i].expr,
          available[j].expr
        );

        for (const combo of combinations) {
          const remaining = available.filter((_, idx) => idx !== i && idx !== j);
          search([...remaining, combo]);
          if (bestDiff === 0) return;
        }
      }
    }
  }

  // Start with each number as a simple expression
  const initial = numbers.map(n => ({ value: n, expr: String(n) }));
  search(initial);

  return bestSolution;
}

export default function CountdownMath() {
  const { t } = useTranslation();
  const [numbers, setNumbers] = useState([]);
  const [target, setTarget] = useState(0);
  const [largeCount, setLargeCount] = useState(2);
  const [tokens, setTokens] = useState([]);
  const [usedIndices, setUsedIndices] = useState(new Set());
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [solution, setSolution] = useState(null);
  const [showSolution, setShowSolution] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isRunning, setIsRunning] = useState(false);
  const [gameState, setGameState] = useState('setup');
  const [numberBuffer, setNumberBuffer] = useState('');
  const timerRef = useRef(null);
  const bufferTimeoutRef = useRef(null);
  const statsRecordedRef = useRef(false);

  const initializeGame = useCallback(() => {
    const newNumbers = generateNumbers(largeCount);
    const newTarget = randomInt(100, 999);

    setNumbers(newNumbers);
    setTarget(newTarget);
    setTokens([]);
    setUsedIndices(new Set());
    setResult(null);
    setMessage({ text: '', type: '' });
    setSolution(null);
    setShowSolution(false);
    setTimeLeft(30);
    setIsRunning(false);
    setGameState('setup');
    setNumberBuffer('');

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (bufferTimeoutRef.current) {
      clearTimeout(bufferTimeoutRef.current);
    }
    statsRecordedRef.current = false;
  }, [largeCount]);

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            setGameState('finished');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Record stats when game finishes due to timeout
  useEffect(() => {
    if (gameState === 'finished' && !statsRecordedRef.current) {
      // Placeholder: stats recording can be implemented later.
      // Score calculation would be based on Math.abs(result - target):
      // - diff === 0: score 10 (exact match)
      // - diff <= 5: score 7
      // - diff <= 10: score 5
      // Mark as recorded to avoid re-running this effect.
      statsRecordedRef.current = true;
    }
  }, [gameState, result, target]);

  // Evaluate expression whenever tokens change
  useEffect(() => {
    if (tokens.length === 0) {
      setResult(null);
      return;
    }

    if (areBracketsBalanced(tokens)) {
      const evalResult = evaluateTokens(tokens);
      setResult(evalResult);

      if (evalResult === target && gameState === 'playing') {
        setMessage({ text: '🎉 Perfect! You hit the target!', type: 'success' });
        setIsRunning(false);
        setGameState('finished');
      }
    } else {
      setResult(null);
    }
  }, [tokens, target, gameState]);

  const startTimer = () => {
    setIsRunning(true);
    setGameState('playing');
  };

  const allowed = getNextAllowed(tokens);

  const addNumber = (num, index) => {
    if (usedIndices.has(index) || gameState === 'finished') return;
    if (!allowed.number) {
      setMessage({ text: 'Select an operation first', type: 'error' });
      return;
    }

    const newUsed = new Set(usedIndices);
    newUsed.add(index);
    setUsedIndices(newUsed);
    setTokens([...tokens, { type: TokenType.NUMBER, value: num, sourceIndex: index }]);
    setMessage({ text: '', type: '' });
  };

  const addOperator = (op) => {
    if (gameState === 'finished') return;
    if (!allowed.operator) {
      setMessage({ text: 'Select a number first', type: 'error' });
      return;
    }

    setTokens([...tokens, { type: TokenType.OPERATOR, value: OP_MAP[op] }]);
    setMessage({ text: '', type: '' });
  };

  const addOpenBracket = () => {
    if (gameState === 'finished') return;
    if (!allowed.openBracket) {
      setMessage({ text: 'Cannot add bracket here', type: 'error' });
      return;
    }

    setTokens([...tokens, { type: TokenType.OPEN_BRACKET }]);
    setMessage({ text: '', type: '' });
  };

  const addCloseBracket = () => {
    if (gameState === 'finished') return;
    if (!allowed.closeBracket) {
      setMessage({ text: 'No matching open bracket', type: 'error' });
      return;
    }

    setTokens([...tokens, { type: TokenType.CLOSE_BRACKET }]);
    setMessage({ text: '', type: '' });
  };

  const clearLast = () => {
    if (gameState === 'finished' || tokens.length === 0) return;

    const lastToken = tokens[tokens.length - 1];

    // If removing a number, restore its availability
    if (lastToken.type === TokenType.NUMBER && lastToken.sourceIndex !== undefined) {
      const newUsed = new Set(usedIndices);
      newUsed.delete(lastToken.sourceIndex);
      setUsedIndices(newUsed);
    }

    setTokens(tokens.slice(0, -1));
    setMessage({ text: '', type: '' });
  };

  const clearAll = () => {
    if (gameState === 'finished') return;
    setTokens([]);
    setUsedIndices(new Set());
    setResult(null);
    setMessage({ text: '', type: '' });
  };

  const findSolution = () => {
    const sol = solve(numbers, target, 3000);
    setSolution(sol);
    setShowSolution(true);
  };

  const buildExpressionDisplay = () => {
    if (tokens.length === 0) return null;

    return tokens.map((token, i) => {
      switch (token.type) {
        case TokenType.NUMBER:
          return <span key={i} className={styles.exprNumber}>{token.value}</span>;
        case TokenType.OPERATOR:
          return <span key={i} className={styles.exprOp}> {DISPLAY_OP[token.value]} </span>;
        case TokenType.OPEN_BRACKET:
          return <span key={i} className={styles.exprBracket}>(</span>;
        case TokenType.CLOSE_BRACKET:
          return <span key={i} className={styles.exprBracket}>)</span>;
        default:
          return null;
      }
    });
  };

  const calculateScore = () => {
    if (result === null) return 0;
    const diff = Math.abs(result - target);
    if (diff === 0) return 10;
    if (diff <= 5) return 7;
    if (diff <= 10) return 5;
    return 0;
  };

  const bracketDepth = getBracketDepth(tokens);

  // Get available numbers (not yet used)
  const getAvailableNumbers = useCallback(() => {
    return numbers
      .map((num, idx) => ({ num, idx }))
      .filter(({ idx }) => !usedIndices.has(idx));
  }, [numbers, usedIndices]);

  // Try to match buffer against available numbers
  const tryMatchNumber = useCallback((buffer) => {
    if (!buffer) return null;

    const targetNum = parseInt(buffer, 10);
    const available = getAvailableNumbers();

    // Find first available number that matches exactly
    const match = available.find(({ num }) => num === targetNum);
    return match || null;
  }, [getAvailableNumbers]);

  // Check if buffer could potentially match a larger number
  const couldMatchMore = useCallback((buffer) => {
    if (!buffer) return false;

    const available = getAvailableNumbers();

    // Check if any available number starts with the buffer digits
    return available.some(({ num }) => {
      const numStr = String(num);
      return numStr.startsWith(buffer) && numStr.length > buffer.length;
    });
  }, [getAvailableNumbers]);

  // Process the number buffer - try to use the number
  const processBuffer = useCallback((buffer, clearAfter = true) => {
    const match = tryMatchNumber(buffer);
    if (match && allowed.number) {
      addNumber(match.num, match.idx);
    }
    if (clearAfter) {
      setNumberBuffer('');
    }
  }, [tryMatchNumber, allowed.number, addNumber]);

  const handleKeyDown = useCallback((e) => {
    if (gameState === 'finished') return;

    const key = e.key;

    // Handle digit input - build up number in buffer
    if (key >= '0' && key <= '9') {
      e.preventDefault();

      // Clear any pending timeout
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
      }

      const newBuffer = numberBuffer + key;
      const available = getAvailableNumbers();

      // Check if this number exists in available numbers
      const exactMatch = tryMatchNumber(newBuffer);
      const canMatchMore = couldMatchMore(newBuffer);

      if (exactMatch && !canMatchMore) {
        // Exact match and can't grow to match another number - use it immediately
        if (allowed.number) {
          addNumber(exactMatch.num, exactMatch.idx);
        }
        setNumberBuffer('');
      } else if (exactMatch || canMatchMore) {
        // Could match more digits, or matches but could also grow - buffer it
        setNumberBuffer(newBuffer);

        // Set timeout to auto-submit if user stops typing
        bufferTimeoutRef.current = setTimeout(() => {
          if (exactMatch && allowed.number) {
            addNumber(exactMatch.num, exactMatch.idx);
          }
          setNumberBuffer('');
        }, 600);
      } else {
        // Number doesn't exist - check if partial matches anything
        const partialNum = parseInt(newBuffer, 10);
        const anyStartsWith = available.some(({ num }) =>
          String(num).startsWith(newBuffer)
        );

        if (!anyStartsWith) {
          // No number starts with this - show error and clear
          setMessage({ text: `${partialNum} is not available`, type: 'error' });
          setNumberBuffer('');
        } else {
          setNumberBuffer(newBuffer);
        }
      }
      return;
    }

    // Non-digit key pressed - clear buffer first (and try to use it)
    if (numberBuffer) {
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
      }
      processBuffer(numberBuffer);
    }

    if (['+', '-', '*', '/', 'x', 'X'].includes(key)) {
      e.preventDefault();
      const opMap = { '+': '+', '-': '−', '*': '×', '/': '÷', 'x': '×', 'X': '×' };
      addOperator(opMap[key] || key);
    } else if (key === '(' || key === '[') {
      e.preventDefault();
      addOpenBracket();
    } else if (key === ')' || key === ']') {
      e.preventDefault();
      addCloseBracket();
    } else if (key === 'Backspace') {
      if (numberBuffer) {
        // Just clear the buffer, don't undo tokens
        setNumberBuffer('');
      } else {
        clearLast();
      }
    } else if (key === 'Escape') {
      setNumberBuffer('');
      clearAll();
    } else if (key === 'Enter' && gameState === 'setup') {
      startTimer();
    }
  }, [numbers, usedIndices, tokens, gameState, allowed, numberBuffer, getAvailableNumbers, tryMatchNumber, couldMatchMore, processBuffer, addNumber, addOperator, addOpenBracket, addCloseBracket, clearLast, clearAll, startTimer]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Cleanup buffer timeout on unmount
  useEffect(() => {
    return () => {
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      <GameHeader
        title="Countdown Math"
        instructions={`Use the six numbers to reach the target ${target}. Each number can only be used once. Use +, −, ×, ÷ and brackets.`}
      />

      <div className={styles.gameArea}>
        <div className={styles.mainSection}>
          {/* Target Display */}
          <div className={styles.targetSection}>
            <div className={styles.targetLabel}>TARGET</div>
            <div className={styles.targetNumber}>{target}</div>
            <div className={styles.timer} data-warning={timeLeft <= 10}>
              <span className={styles.timerIcon}>⏱</span>
              <span className={styles.timerValue}>{timeLeft}s</span>
            </div>
          </div>

          {/* Number Selection */}
          <div className={styles.numbersSection}>
            <div className={styles.sectionLabel}>Available Numbers {numberBuffer && <span className={styles.typingIndicator}>typing: {numberBuffer}_</span>}</div>
            <div className={styles.numberGrid}>
              {numbers.map((num, index) => {
                const isHighlighted = numberBuffer && String(num).startsWith(numberBuffer);
                return (
                  <button
                    key={index}
                    className={`${styles.numberTile} ${usedIndices.has(index) ? styles.used : ''} ${isHighlighted ? styles.highlighted : ''}`}
                    onClick={() => addNumber(num, index)}
                    disabled={usedIndices.has(index) || gameState === 'finished' || !allowed.number}
                  >
                    <span className={styles.numberValue}>{num}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Operations & Brackets */}
          <div className={styles.operationsSection}>
            <div className={styles.sectionLabel}>Operations & Brackets</div>
            <div className={styles.operationsGrid}>
              <button
                className={`${styles.bracketButton} ${!allowed.openBracket ? styles.disabled : ''}`}
                onClick={addOpenBracket}
                disabled={gameState === 'finished' || !allowed.openBracket}
              >
                (
              </button>
              {OPERATIONS.map((op) => (
                <button
                  key={op}
                  className={`${styles.opButton} ${!allowed.operator ? styles.disabled : ''}`}
                  onClick={() => addOperator(op)}
                  disabled={gameState === 'finished' || !allowed.operator}
                >
                  {op}
                </button>
              ))}
              <button
                className={`${styles.bracketButton} ${!allowed.closeBracket ? styles.disabled : ''}`}
                onClick={addCloseBracket}
                disabled={gameState === 'finished' || !allowed.closeBracket}
              >
                )
                {bracketDepth > 0 && <span className={styles.bracketCount}>{bracketDepth}</span>}
              </button>
            </div>
          </div>

          {/* Current Expression */}
          <div className={styles.expressionSection}>
            <div className={styles.sectionLabel}>Your Calculation</div>
            <div className={styles.expressionDisplay}>
              {buildExpressionDisplay() || <span className={styles.placeholder}>Type or click numbers...</span>}
            </div>
            {result !== null && (
              <div className={`${styles.resultDisplay} ${result === target ? styles.exact : ''}`}>
                = {result}
                {result !== target && (
                  <span className={styles.difference}>
                    ({result > target ? '+' : ''}{result - target} from target)
                  </span>
                )}
              </div>
            )}
            {bracketDepth > 0 && (
              <div className={styles.bracketWarning}>
                {bracketDepth} unclosed bracket{bracketDepth > 1 ? 's' : ''}
              </div>
            )}
            {message.text && (
              <div className={`${styles.message} ${styles[message.type]}`}>
                {message.text}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            {gameState === 'setup' && (
              <button className={styles.startBtn} onClick={startTimer}>
                Start Timer
              </button>
            )}
            <button className={styles.btn} onClick={clearLast} disabled={gameState === 'finished' || tokens.length === 0}>
              Undo
            </button>
            <button className={styles.btn} onClick={clearAll} disabled={gameState === 'finished' || tokens.length === 0}>
              Clear
            </button>
          </div>
        </div>

        {/* Side Panel */}
        <div className={styles.sidePanel}>
          <div className={styles.scorePanel}>
            <div className={styles.scoreItem}>
              <span className={styles.scoreLabel}>Score</span>
              <span className={styles.scoreValue}>{calculateScore()}</span>
            </div>
            <div className={styles.scoreItem}>
              <span className={styles.scoreLabel}>Status</span>
              <span className={styles.scoreValue}>
                {gameState === 'setup' ? 'Ready' : gameState === 'playing' ? 'Playing' : 'Finished'}
              </span>
            </div>
          </div>

          {/* Large Numbers Selector */}
          <div className={styles.settingsPanel}>
            <div className={styles.settingLabel}>Large Numbers</div>
            <div className={styles.largeSelector}>
              {[0, 1, 2, 3, 4].map((count) => (
                <button
                  key={count}
                  className={`${styles.largeOption} ${largeCount === count ? styles.selected : ''}`}
                  onClick={() => setLargeCount(count)}
                  disabled={gameState !== 'setup'}
                >
                  {count}
                </button>
              ))}
            </div>
            <p className={styles.settingHint}>
              {largeCount} large ({LARGE_NUMBERS.join(', ')}) + {6 - largeCount} small (1-10)
            </p>
          </div>

          {/* Game Actions */}
          <div className={styles.gameActions}>
            <button className={styles.newGameBtn} onClick={initializeGame}>
              New Game
            </button>
            <button
              className={styles.revealBtn}
              onClick={findSolution}
              disabled={showSolution}
            >
              {showSolution ? 'Solution Shown' : 'Show Solution'}
            </button>
          </div>

          {/* Solution Display */}
          {showSolution && solution && (
            <div className={styles.solutionPanel}>
              <h4>Best Solution Found</h4>
              <div className={styles.solutionExpr}>{solution.expression}</div>
              <div className={styles.solutionResult}>
                = {solution.result}
                {!solution.exact && (
                  <span className={styles.solutionDiff}>
                    ({Math.abs(solution.result - target)} away)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Rules */}
          <div className={styles.rulesPanel}>
            <h4>Scoring</h4>
            <ul>
              <li><strong>10 points</strong> — Exact target</li>
              <li><strong>7 points</strong> — Within 5</li>
              <li><strong>5 points</strong> — Within 10</li>
              <li><strong>0 points</strong> — More than 10 away</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
