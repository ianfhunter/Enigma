import { Component } from 'react';
import { useTranslation } from 'react-i18next';
import { reportGamePageError } from '../utils/gamePageErrorReporter';

export class GamePageErrorBoundaryInner extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    reportGamePageError({
      slug: this.props.slug,
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export default function GamePageErrorBoundary({ children, slug }) {
  const { t } = useTranslation();

  return (
    <GamePageErrorBoundaryInner
      slug={slug}
      fallback={<div role="alert">{t('common.failedToLoadGame')}</div>}
    >
      {children}
    </GamePageErrorBoundaryInner>
  );
}
