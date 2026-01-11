# 🎮 Enigma

<div align="center">

**A self-hosted collection of classic word, number, and logic puzzles**

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/license-Custom-blue.svg)](LICENSE)

[Features](#-features) • [Quick Start](#-quick-start) • [Installation](#-installation) • [Contributing](#-contributing)

</div>

---

## 📖 About

**Enigma** is a comprehensive, self-hosted web application featuring a curated collection of classic puzzles and games. From word formation challenges like WordGuess and Word Wheel, to number puzzles like Sudoku and Kakuro, to logic puzzles like Einstein's Riddle and Nonograms—Enigma brings together over 100+ games in one beautiful, modern interface.

Perfect for puzzle enthusiasts, educators, or anyone looking to host their own games collection without relying on external services. All games run entirely in your browser with no backend required.

### Why Enigma?

- 🎯 **100+ Games**: Word puzzles, number games, logic challenges, and trivia quizzes
- 🚀 **Zero Backend**: Pure client-side application—no database or server required
- 🎨 **Modern UI**: Beautiful, responsive design with smooth animations
- 🔒 **Privacy First**: All data stays in your browser—no tracking, no analytics
- 📱 **Mobile Friendly**: Works seamlessly on desktop, tablet, and mobile devices
- ⚡ **Fast & Lightweight**: Built with React and Vite for optimal performance
- 🎲 **Surprise Me**: Discover new games with the random game selector

---

## ✨ Features

### Game Categories

- **📝 Word Formation**: WordGuess, Word Wheel, Word Ladder, Anagrams, Hangman, and more
- **🔢 Number Puzzles**: Sudoku, Kakuro, Calcudoku, Killer Sudoku, Futoshiki, and variants
- **🧩 Logic Puzzles**: Nonograms, Einstein's Riddle, Knights and Knaves, Code Breaker
- **🎯 Pattern Recognition**: Connections, Strands, Word Search, Memory Match
- **🌍 Geography & Trivia**: Flag Guesser, Capital Guesser, Currency Quiz, Classical Music Quiz
- **🎨 Visual Puzzles**: Jigsaw, Famous Paintings, Constellations, Tangram
- **♟️ Strategy Games**: Chess Puzzles, Sokoban, Minesweeper, Tower of Hanoi
- **🔐 Code Breaking**: Cryptogram, Word Arithmetic, Drop Quotes, Phrase Guess

### Key Features

- **Daily Challenges**: Many games feature daily puzzles with seeded random generation
- **Progress Tracking**: Track your performance across different game modes
- **Multiple Difficulties**: Adjustable difficulty levels for many puzzles
- **Hint Systems**: Get help when you're stuck on challenging puzzles
- **Responsive Design**: Optimized for all screen sizes
- **Dark Theme**: Easy on the eyes with a beautiful dark color scheme
- **Keyboard Shortcuts**: Efficient navigation and gameplay controls
- **Game History**: Resume puzzles or view your past games

---

## 🚀 Quick Start

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

### Docker Deployment (Optional)

```dockerfile
# Example Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🛠️ Development

### Project Structure

```
enigma/
├── src/
│   ├── components/      # Reusable React components
│   ├── pages/           # Game pages (one folder per game)
│   ├── data/            # Game data, word lists, puzzles
│   ├── hooks/           # Custom React hooks
│   └── assets/          # Images, audio, and other assets
├── public/              # Static assets served directly
├── branding/            # Logo and branding assets
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

## 📋 Roadmap

- [ ] Add user accounts and progress tracking (optional backend)
- [ ] Implement multiplayer/competitive modes
- [ ] Add more game categories (sports, science, history)
- [ ] Create mobile app versions (PWA improvements)
- [ ] Add game statistics and leaderboards
- [ ] Implement custom puzzle creation tools
- [ ] Add export/import functionality for puzzle sharing
- [ ] Internationalization (i18n) support

---

## 🐛 Known Issues

- Some games are marked as "DEV" and may have incomplete features
- Mobile experience for some games could be improved
- Performance optimizations needed for games with large datasets

See [GitHub Issues](https://github.com/ianfhunter/enigma/issues) for a complete list.

---

## 📄 License

This project is licensed under a custom Personal Use License. 

**Personal Use**: You are free to use, modify, and host Enigma for personal, non-commercial purposes.

**Commercial Use**: If you wish to host Enigma or any derivatives thereof for commercial purposes (SaaS, paid services, client hosting, etc.), please contact us to discuss commercial licensing terms.

See the [LICENSE](LICENSE) file for complete terms and conditions.

---

## 🙏 Acknowledgments

- **Game Inspiration**: Many games are inspired by classic puzzles from newspapers, magazines, and online puzzle sites
- **Open Source Libraries**: Built with [React](https://react.dev/), [Vite](https://vitejs.dev/), and [React Router](https://reactrouter.com/)
- **Community**: Thanks to all contributors who help improve Enigma

### Credits

- Puzzle algorithms and generators inspired by various open-source puzzle implementations
- Word lists compiled from public domain sources
- UI design inspired by modern puzzle game interfaces

For detailed attributions of all assets and resources, see [ATTRIBUTIONS.md](ATTRIBUTIONS.md).

---

## 🔗 Links

- [Report a Bug](https://github.com/ianfhunter/enigma/issues)
- [Request a Feature](https://github.com/ianfhunter/enigma/issues)
- [Discussions](https://github.com/ianfhunter/enigma/discussions)

---

<div align="center">

**Made with ❤️ by the Enigma community**

⭐ Star this repo if you find it useful!

</div>
