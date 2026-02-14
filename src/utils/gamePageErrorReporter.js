const GAME_PAGE_ERROR_BUCKET = '__ENIGMA_GAME_PAGE_ERRORS__';

function toSerializableError(error) {
  if (!error) {
    return null;
  }

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
}

export function reportGamePageError({ slug, error, errorInfo }) {
  const payload = {
    slug,
    error: toSerializableError(error),
    componentStack: errorInfo?.componentStack || null,
    timestamp: Date.now(),
  };

  if (typeof window !== 'undefined') {
    const bucket = window[GAME_PAGE_ERROR_BUCKET] || [];
    bucket.push(payload);
    window[GAME_PAGE_ERROR_BUCKET] = bucket;

    window.dispatchEvent(new CustomEvent('enigma:game-page-error', { detail: payload }));
  }

  return payload;
}

export function getGamePageErrorBucketKey() {
  return GAME_PAGE_ERROR_BUCKET;
}
