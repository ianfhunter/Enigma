import { Component } from 'react';
import { useTranslation } from 'react-i18next';
import { reportGamePageError } from '../utils/gamePageErrorReporter';
import { buildGamePageDebugText } from '../utils/gamePageDebugInfo';

export class GamePageErrorBoundaryInner extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorPayload: null,
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const payload = reportGamePageError({
      slug: this.props.slug,
      error,
      errorInfo,
    });

    this.setState({ errorPayload: payload });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback(this.state.errorPayload);
    }

    return this.props.children;
  }
}

export default function GamePageErrorBoundary({ children, slug }) {
  const { t } = useTranslation();

  const renderFallback = errorPayload => (
    <div role="alert">
      <p>{t('common.failedToLoadGame')}</p>
      <p>{t('common.errorDebugHint')}</p>
      <textarea
        aria-label={t('common.errorDebugInfo')}
        readOnly
        rows={12}
        value={buildGamePageDebugText({ slug, errorPayload })}
        style={{ width: '100%', maxWidth: '720px', fontFamily: 'monospace' }}
      />
    </div>
  );

  return (
    <GamePageErrorBoundaryInner
      slug={slug}
      fallback={renderFallback}
    >
      {children}
    </GamePageErrorBoundaryInner>
  );
}
