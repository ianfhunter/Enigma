import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Format seconds into a time string
 * @param {number} seconds - Total seconds
 * @param {'mm:ss'|'hh:mm:ss'|'auto'} format - Format style
 * @returns {string} Formatted time string
 */
export function formatTime(seconds, format = 'auto') {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (format === 'hh:mm:ss' || (format === 'auto' && hrs > 0)) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // For mm:ss format, include hours as minutes when > 0
  const totalMins = hrs * 60 + mins;
  return `${String(totalMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Hook for managing a game timer
 * @param {Object} options
 * @param {number} [options.initialTime] - Initial time in seconds (default: 0)
 * @param {boolean} [options.autoStart] - Whether to start automatically (default: false)
 * @param {'up'|'down'} [options.direction] - Count up or down (default: 'up')
 * @param {number} [options.limit] - Time limit for countdown (required if direction='down')
 * @param {function} [options.onTick] - Callback on each tick with current time
 * @param {function} [options.onComplete] - Callback when countdown reaches 0
 * @param {'mm:ss'|'hh:mm:ss'|'auto'} [options.format] - Time format (default: 'auto')
 * @returns {Object} Timer controls and state
 */
export function useTimer({
  initialTime = 0,
  autoStart = false,
  direction = 'up',
  limit,
  onTick,
  onComplete,
  format = 'auto',
} = {}) {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef(null);
  const onTickRef = useRef(onTick);
  const onCompleteRef = useRef(onComplete);

  // Update refs when callbacks change
  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prev) => {
          let newTime;

          if (direction === 'down') {
            newTime = prev - 1;
            if (newTime <= 0) {
              setIsRunning(false);
              onCompleteRef.current?.();
              return 0;
            }
          } else {
            newTime = prev + 1;
          }

          onTickRef.current?.(newTime);
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, direction]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback((newTime) => {
    setIsRunning(false);
    setTime(newTime ?? initialTime);
  }, [initialTime]);

  const toggle = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const setTimeTo = useCallback((newTime) => {
    setTime(newTime);
  }, []);

  return {
    time,
    formatted: formatTime(time, format),
    isRunning,
    start,
    stop,
    reset,
    toggle,
    setTime: setTimeTo,
  };
}

export default useTimer;
