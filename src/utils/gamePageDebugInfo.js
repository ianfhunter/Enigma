function getRuntimeDebugMetadata() {
  if (typeof window === 'undefined') {
    return {
      userAgent: null,
      language: null,
      platform: null,
      viewport: null,
      screen: null,
      url: null,
    };
  }

  return {
    userAgent: window.navigator?.userAgent || null,
    language: window.navigator?.language || null,
    platform: window.navigator?.platform || null,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    screen: window.screen ? `${window.screen.width}x${window.screen.height}` : null,
    url: window.location?.href || null,
  };
}

export function buildGamePageDebugText({ slug, errorPayload }) {
  const metadata = getRuntimeDebugMetadata();
  const timestamp = errorPayload?.timestamp
    ? new Date(errorPayload.timestamp).toISOString()
    : null;

  return [
    `slug: ${slug || 'unknown'}`,
    `timestamp: ${timestamp || 'unknown'}`,
    `errorName: ${errorPayload?.error?.name || 'unknown'}`,
    `errorMessage: ${errorPayload?.error?.message || 'unknown'}`,
    `url: ${metadata.url || 'unknown'}`,
    `userAgent: ${metadata.userAgent || 'unknown'}`,
    `language: ${metadata.language || 'unknown'}`,
    `platform: ${metadata.platform || 'unknown'}`,
    `viewport: ${metadata.viewport || 'unknown'}`,
    `screen: ${metadata.screen || 'unknown'}`,
    '',
    'errorStack:',
    errorPayload?.error?.stack || 'unavailable',
    '',
    'componentStack:',
    errorPayload?.componentStack || 'unavailable',
  ].join('\n');
}

export function buildIframeGameDebugText({ packId, gameId, gameUrl, timestamp }) {
  const baseText = buildGamePageDebugText({
    slug: `custom/${packId || 'unknown'}/${gameId || 'unknown'}`,
    errorPayload: {
      timestamp,
      error: {
        name: 'IframeLoadError',
        message: 'Iframe game failed to load or was blocked from embedding',
      },
      componentStack: null,
    },
  });

  return `${baseText}\n\niframeUrl: ${gameUrl || 'unknown'}`;
}
