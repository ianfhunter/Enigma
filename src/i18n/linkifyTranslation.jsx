import { Fragment } from 'react';

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

export function renderTranslationWithLinks(value) {
  if (typeof value !== 'string') {
    return value;
  }

  const parts = value.split(URL_PATTERN);
  if (parts.length === 1) {
    return value;
  }

  return parts.map((part, index) => {
    if (part.startsWith('http://') || part.startsWith('https://')) {
      return (
        <a key={`${part}-${index}`} href={part} target="_blank" rel="noopener noreferrer">
          {part}
        </a>
      );
    }

    return <Fragment key={`text-${index}`}>{part}</Fragment>;
  });
}
