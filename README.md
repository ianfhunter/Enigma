# 🎮 Enigma

<div align="center">

**A self-hosted collection of classic word, number, and logic puzzles**

[![Games](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/ianfhunter/enigma/main/badge.json)](https://raw.githubusercontent.com/ianfhunter/enigma/main/badge.json)
[![License](https://img.shields.io/badge/license-Custom-blue.svg)](LICENSE)

<img width="1912" height="883" alt="image" src="https://github.com/user-attachments/assets/dae88e2f-673c-4294-b482-79967be085fc" />

[Features](#-features) • [Quick Start](#-quick-start) • [Installation](#-installation) • [Documentation](https://www.ianhunter.ie/Enigma) • [Contributing](#-contributing)

</div>

---

## 📖 About

**Enigma** is a comprehensive, self-hosted web application featuring a curated collection of classic puzzles and games. From word formation challenges like WordGuess and Word Wheel, to number puzzles like Sudoku and Kakuro, to logic puzzles like Einstein's Riddle and Nonograms—Enigma brings together over 100+ games in one beautiful, modern interface.

Perfect for puzzle enthusiasts, educators, or anyone looking to host their own games collection ad-free without relying on external services.

---

## ✨ Features

A sample of our puzzles:

- **📝 Word Formation**: WordGuess, Word Wheel, Word Ladder, Anagrams, Hangman, and more
- **🔢 Number Puzzles**: Sudoku, Kakuro, Calcudoku, Futoshiki, and variants
- **🧩 Logic Puzzles**: Nonograms, Einstein's Riddle, Knights and Knaves, Code Breaker
- **🎯 Pattern Recognition**: Categories, Threads, Word Search, Memory Match
- **🌍 Geography & Trivia**: Flag Guesser, Capital Guesser, Currency Quiz, Classical Music Quiz
- **🎨 Visual Puzzles**: Jigsaw, Famous Paintings, Constellations
- **♟️ Strategy Games**: Chess Puzzles, Sokoban, Minesweeper, Tower of Hanoi
- **🔐 Code Breaking**: Cryptogram, Word Arithmetic, Drop Quotes, Phrase Guess

### Key Features

- **Account Management**: Play with your friends, share your scores on leaderboards
- **Multiple Difficulties**: Adjustable difficulty levels for many puzzles
- **Hint Systems**: Get help when you're stuck on challenging puzzles
- **Responsive Design**: Optimized for all screen sizes

---

## 🚀 Quick Start

There are two ways to get set up. We recommend using Docker, but you can run it natively if you wish:

### Prerequisites

- **Node.js** 18+ and npm (or yarn/pnpm)
- A modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ianfhunter/enigma.git
   cd enigma
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   Navigate to http://localhost:5173
   ```

That's it! 🎉 You should now see the Enigma home page with all available games.

### Building for Production

To create an optimized production build:

```bash
npm run build
```

The built files will be in the `dist/` directory. You can serve them with any static file server:

```bash
# Using the built-in preview server
npm run preview

# Or using a simple HTTP server
npx serve dist
```

### Docker Deployment

Enigma is available as a pre-built Docker image that includes both the frontend and backend in a single container.

#### Using the Published Docker Image

**Quick Start:**
```bash
# Pull and run the latest image
docker run -d \
  --name enigma \
  -p 3000:3000 \
  -v enigma-data:/app/data \
  -e SESSION_SECRET=$(openssl rand -hex 32) \
  -e FRONTEND_URL=http://localhost:3000 \
  ianfhunter/enigma:latest
```

**With docker-compose:**
```yaml
version: '3.8'

services:
  enigma:
    image: boopboopboop/enigma:latest
    container_name: enigma
    ports:
      - "3000:3000"
    volumes:
      - enigma-data:/app/data
    environment:
      - NODE_ENV=production
      - SESSION_SECRET=your-secret-here-change-in-production
      - FRONTEND_URL=http://localhost:3000
    restart: unless-stopped

volumes:
  enigma-data:
```

Save this as `docker-compose.yml` and run:
```bash
docker-compose up -d
```

**Available Image Tags:**
- `latest` - Latest stable release
- `dev` - Development builds (manual workflow dispatch)
- Version tags like `1.0.1`, `1.0`, `1` - Specific versions

**Environment Variables:**
- `SESSION_SECRET` (required) - Secret for session cookies. Generate with `openssl rand -hex 32`
- `FRONTEND_URL` (optional) - Frontend URL for CORS. Defaults to `http://localhost:5173`
- `DB_PATH` (optional) - Database path. Defaults to `/app/data/enigma.db`
- `PORT` (optional) - Server port. Defaults to `3000`

**Data Persistence:**
The container stores data in `/app/data`. Use a Docker volume (as shown above) to persist your database and user data between container restarts.

**Health Check:**
The image includes a health check. Monitor with:
```bash
docker ps  # Check STATUS column
```

Or test manually:
```bash
curl http://localhost:3000/api/health
```

#### Building Your Own Image

If you prefer to build the image yourself:

```bash
docker build -t enigma .
docker run -p 3000:3000 -v enigma-data:/app/data enigma
```

---

## 🛠️ Development

### Project Structure

```
enigma/
├── src/
│   ├── components/      # Reusable React components
│   ├── pages/           # Game pages (one folder per game)
│   ├── hooks/           # Custom React hooks
│   └── assets/          # Images, audio, and other assets
├── public/              # Static assets served directly
├── branding/            # Logo and branding assets
├── datasets/            # Data for building puzzles
└── scripts/             # Build and utility scripts
```

### Adding a New Game

1. Create a new folder in `src/pages/` with your game name (PascalCase)
2. Add your game component files:
   - `YourGame.jsx` - Main game component
   - `YourGame.module.css` - Styles
   - `index.js` - Export file
3. Register your game in `src/data/gameRegistry.js`:
   ```javascript
   {
     title: 'Your Game',
     slug: 'your-game',
     description: 'A brief description',
     icon: '🎮',
     category: 'Your Category',
     version: 'v0.1',
   }
   ```
4. Add the route in `src/App.jsx`

### Code Style

- We use ESLint for code quality
- Run `npm run lint` to check for issues
- Follow React best practices and hooks guidelines
- Use CSS Modules for component styling

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

### Testing

#### Unit and Integration Tests

Run tests inside Docker to match CI:

```bash
docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm bash -lc "npm ci && npm run test:run"
```

#### Docker Image Tests

Test the published Docker image to ensure it works correctly:

```bash
# Test the latest published image
./tests/docker/docker-image.test.sh

# Test a specific version
./tests/docker/docker-image.test.sh boopboopboop/enigma:1.0.1
```

See [tests/docker/README.md](tests/docker/README.md) for more details.

---

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding new games, improving documentation, or enhancing features, your help makes Enigma better for everyone.

### How to Contribute

1. **Fork the Repository**
   Click the "Fork" button at the top of this page to create your own copy.

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make Your Changes**
   - Write clean, readable code
   - Add comments for complex logic
   - Update documentation if needed
   - Test your changes thoroughly

4. **Commit Your Changes**
   ```bash
   git commit -m "Add feature: brief description of your changes"
   ```
   Use clear, descriptive commit messages. We follow [Conventional Commits](https://www.conventionalcommits.org/) style.

5. **Push to Your Branch**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Navigate to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template with details about your changes
   - Link any related issues

### Contribution Guidelines

- **Code Quality**: Ensure your code passes linting (`npm run lint`)
- **Testing**: Test your changes in multiple browsers if possible
- **Documentation**: Update README or add comments for new features
- **Game Additions**: When adding new games, ensure they're fully playable and polished
- **Accessibility**: Consider keyboard navigation and screen readers
- **Performance**: Keep bundle size in mind for new dependencies
- **Permission To Use**: If you are contributing Datasets, Images, Puzzles, etc. Please make sure the terms are compatible with our project.

### Types of Contributions We're Looking For

- 🎮 **New Games**: Add classic puzzles or create original games
- 🐛 **Bug Fixes**: Fix issues, improve error handling
- 🎨 **UI/UX Improvements**: Enhance design, add animations, improve mobile experience
- 📚 **Documentation**: Improve README, add code comments, create guides
- ⚡ **Performance**: Optimize rendering, reduce bundle size
- 🌐 **Internationalization**: Add support for multiple languages
- ♿ **Accessibility**: Improve keyboard navigation, ARIA labels, screen reader support

### Getting Help

- 💬 **Discussions**: Use GitHub Discussions for questions and ideas
- 🐛 **Issues**: Report bugs or request features via GitHub Issues
- 📖 **Documentation**: Check existing code comments and game implementations

---

## 🐛 Known Issues

See [GitHub Issues](https://github.com/ianfhunter/enigma/issues) for a complete list.

---

## 📄 License

This project uses multiple licenses. See the [LICENSE/](LICENSE/) folder for details.

**Main Project**: Licensed under a custom Personal Use License.
- **Personal Use**: You are free to use, modify, and host Enigma for personal, non-commercial purposes.
- **Commercial Use**: If you wish to host Enigma or any derivatives thereof for commercial purposes (SaaS, paid services, client hosting, etc.), please contact us to discuss commercial licensing terms.

**Crossword Component**: Licensed under GPL-3.0 (see [LICENSE/GPL3-CROSSWORD.txt](LICENSE/GPL3-CROSSWORD.txt))

See the [LICENSE/](LICENSE/) folder for complete terms and conditions.

---

## 📧 Copyright Issues

If you believe that content in this project infringes on your copyright, please reach out to us through GitHub Issues or Discussions. We take intellectual property rights seriously and will make every effort to address valid copyright concerns promptly.

---

## 🙏 Attributions

Please see our separate file [ATTRIBUTIONS.md](ATTRIBUTIONS.md).

**Note**: Some riddles in the dataset were manually added by the Enigma project contributors to expand the collection.

---

## 🔗 Links

- [📚 Documentation](https://www.ianhunter.ie/Enigma) - Game guides and development documentation
- [Report a Bug](https://github.com/ianfhunter/enigma/issues)
- [Request a Feature](https://github.com/ianfhunter/enigma/issues)
- [Discussions](https://github.com/ianfhunter/enigma/discussions)

---

<div align="center">

**Made with ❤️ by the Enigma community**

⭐ Star this repo if you find it useful!

</div>
