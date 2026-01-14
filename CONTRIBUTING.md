# Contributing to Enigma

Thank you for your interest in contributing to Enigma! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report, please check the [existing issues](https://github.com/ianfhunter/enigma/issues) to see if the bug has already been reported.

When creating a bug report, please include:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs. actual behavior
- Screenshots if applicable
- Browser and OS information
- Any error messages from the console

### Suggesting Features

We welcome feature suggestions! Please:
- Check if the feature has already been suggested
- Provide a clear description of the feature
- Explain why it would be useful
- Consider implementation complexity

### Adding New Games

One of the best ways to contribute is by adding new puzzle games! Here's how:

1. **Choose a game** that fits Enigma's style (word puzzles, number puzzles, logic games, etc.). Please note that this project prefers puzzles that can be generated rather than curated, and that we use in-project data rather than relying on APIs. This is to protect the longevity of the project.

2. **Create the game files** in `src/pages/YourGameName/`:
   - `YourGameName.jsx` - Main game component
   - `YourGameName.module.css` - Styles
   - `index.js` - Export file

3. **Register the game** in `src/data/gameRegistry.js`:
   ```javascript
   {
     title: 'Your Game Name',
     slug: 'your-game-name',
     description: 'A brief description of the game',
     icon: '🎮',
     category: 'Appropriate Category',
     version: 'v0.1',
   }
   ```

4. **Add the route** in `src/App.jsx`

5. **Test thoroughly** - Make sure the game works on different screen sizes and browsers. Make sure your game always produces solvable problems and where applicable, unique solutions.

6. **Follow the code style** - Use ESLint, follow React best practices, use CSS Modules

### Improving Documentation

- Fix typos or clarify unclear instructions
- Add examples or tutorials
- Improve code comments
- Update README with new features

### Code Style

- Run `npm run lint` before submitting
- Use meaningful variable and function names
- Add comments for complex logic
- Follow React hooks best practices
- Use CSS Modules for component styling
- Keep components focused and reusable

## AI-Assisted Contributions

We welcome contributions that are created or assisted by AI tools (such as ChatGPT, GitHub Copilot, Claude, etc.). However, **all AI-generated or AI-assisted code must be thoroughly tested** before submission.

### Requirements for AI Contributions

1. **Comprehensive Testing**:
   - Test all functionality manually in multiple browsers
   - Test edge cases and error scenarios
   - Verify the code works as intended, not just that it compiles
   - Test on different screen sizes if UI-related

2. **Code Review**:
   - Review AI-generated code carefully before submitting
   - Ensure it follows our code style guidelines
   - Verify it integrates properly with existing code
   - Check for any obvious bugs or issues

3. **Documentation**:
   - If using AI assistance, you may mention it in your PR (optional)
   - Ensure code comments are clear and helpful
   - Update relevant documentation if needed

4. **Quality Standards**:
   - AI-generated code is held to the same quality standards as human-written code
   - All PRs will be reviewed regardless of the source
   - Be prepared to iterate based on feedback

**Remember**: AI tools are powerful assistants, but they can produce code that looks correct but doesn't work as expected. Always test thoroughly!

## Development Setup

1. **Fork the repository**

2. **Clone your fork**:
   ```bash
   git clone https://github.com/ianfhunter/enigma.git
   cd enigma
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Make your changes** in a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Pull Request Process

1. **Update your fork** with the latest changes from the main repository

2. **Create a descriptive branch name**:
   - `feature/add-sudoku-variants`
   - `fix/word-wheel-center-letter-bug`
   - `docs/update-installation-guide`

3. **Make your changes** following the code style guidelines

4. **Test your changes** (Docker path):
   ```bash
   docker run --rm -v "$PWD":/workspace -w /workspace node:22-bookworm bash -lc "npm ci && npm run lint && npm run test:run"
   ```
   - Test in multiple browsers if possible
   - Test on mobile devices if UI-related

5. **Commit your changes** with clear messages:
   ```bash
   git commit -m "Add feature: brief description"
   ```
   Use [Conventional Commits](https://www.conventionalcommits.org/) format when possible:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `style:` for formatting
   - `refactor:` for code restructuring
   - `test:` for tests
   - `chore:` for maintenance

6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**:
   - Use the PR template
   - Provide a clear description of your changes
   - Link any related issues
   - Include screenshots for UI changes
   - Be responsive to feedback

## Review Process

- All PRs require review before merging
- Maintainers may request changes
- Be open to feedback and suggestions
- Keep discussions respectful and constructive

## Questions?

- Open a [GitHub Discussion](https://github.com/ianfhunter/enigma/discussions) for questions
- Check existing issues and discussions first
- Be patient - maintainers are volunteers

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see [LICENSE](LICENSE) file).

Thank you for contributing to Enigma! 🎮
