# Internationalization (i18n) Guide

Enigma uses [react-i18next](https://react.i18next.com/) for internationalization support.

## Architecture

```
src/i18n/
├── index.js          # i18n configuration
└── locales/
    ├── en.json       # English translations (default)
    └── es.json       # Spanish translations (Alpha - machine translated)
```

## How It Works

1. **Initialization**: i18n is initialized in `src/main.jsx` before the app renders
2. **Language Sync**: `useLanguageSync` hook (in Layout) syncs user's saved language preference with i18n
3. **Language Setting**: Users can change language in Profile → Settings

## Adding a New Language

### Step 1: Create Translation File

Create a new JSON file in `src/i18n/locales/` (e.g., `es.json` for Spanish):

```json
{
  "common": {
    "loading": "Cargando...",
    "giveUp": "Rendirse",
    ...
  }
}
```

Use `en.json` as a reference template - copy all keys and translate the values.

### Step 2: Register the Language

Update `src/i18n/index.js`:

```javascript
import en from './locales/en.json';
import es from './locales/es.json';  // Add import

// Add to supportedLanguages array
export const supportedLanguages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },  // Add entry
];

// Add to resources in init()
i18n.init({
  resources: {
    en: { translation: en },
    es: { translation: es },  // Add resource
  },
  ...
});
```

### Step 3: Test

Run the tests and verify translations work:

```bash
npm run test:run -- src/i18n/i18n.test.js
```

## Using Translations in Components

### Basic Usage

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return <button>{t('common.giveUp')}</button>;
}
```

### With Interpolation

```jsx
// In en.json: "viewAllResults": "+{{count}} more — view all results"
<span>{t('common.viewAllResults', { count: 10 })}</span>
```

### Changing Language Programmatically

```jsx
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <button onClick={() => i18n.changeLanguage('es')}>
      Español
    </button>
  );
}
```

## Translation Key Organization

| Section | Purpose |
|---------|---------|
| `common.*` | Shared UI elements (buttons, labels, etc.) |
| `header.*` | Header navigation elements |
| `footer.*` | Footer content |
| `home.*` | Home page specific |
| `gameResult.*` | Win/lose/giveup screens |
| `profile.*` | Profile page |
| `settings.*` | Settings tab |
| `gamesTab.*` | Games management tab |
| `securityTab.*` | Security tab |
| `adminTab.*` | Admin panel |
| `store.*` | Game store page |
| `auth.*` | Login/register modals |
| `loading.*` | Loading screen phrases |

## Docker Configuration

You can set the default language for your Enigma instance via Docker environment variables.

### Development (docker-compose)

In your `docker-compose.yml`, set `DEFAULT_LANGUAGE`:

```yaml
enigma-frontend:
  environment:
    - VITE_DEFAULT_LANGUAGE=${DEFAULT_LANGUAGE:-en}
```

Or use a `.env` file:

```env
DEFAULT_LANGUAGE=es
```

### Production Build

When building the production Docker image, use the `--build-arg` flag:

```bash
# Build with Spanish as default
docker build --build-arg DEFAULT_LANGUAGE=es -t enigma .

# Build with English as default (or omit the arg)
docker build -t enigma .
```

### Supported Language Codes

| Code | Language |
|------|----------|
| `en` | English (default) |
| `es` | Español (Alpha) |

**Note**: Users can always change their language preference in Settings → Interface Language, regardless of the server default.

## Notes

- **Game Content**: Game titles and descriptions in `gameRegistry.js` are not yet translated. These could be moved to translation files for full localization.
- **Datasets**: Some puzzle datasets contain language-specific content (riddles, word games). Full localization of these would require language-specific datasets.
- **Fallback**: If a translation key is missing, i18next will fall back to the configured default language (or English).
- **Browser Detection**: The language detector tries localStorage first, then browser language settings, then falls back to the configured default.

## Contributing Translations

To contribute a translation:

1. Fork the repository
2. Create the translation file
3. Register the language in the config
4. Submit a pull request

Please ensure all keys from `en.json` are translated.
