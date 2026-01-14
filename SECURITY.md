# Security Policy

## Supported Versions

We actively support the latest version of Enigma. Security updates will be provided for:

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < Latest| :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, please follow these steps:

1. **Email us directly** at: ianfhunter@gmail.com
   - Use a descriptive subject line: "Security Vulnerability: [brief description]"
   - Include details about the vulnerability
   - Provide steps to reproduce (if applicable)
   - Suggest a fix if you have one

2. **What to include in your report**:
   - Type of vulnerability (XSS, CSRF, data exposure, etc.)
   - Affected component or file
   - Potential impact
   - Steps to reproduce
   - Suggested fix (if available)

3. **What to expect**:
   - We will acknowledge receipt within 48 hours
   - We will investigate and respond within 7 days
   - We will keep you informed of the progress
   - We will credit you in the security advisory (if you wish)

## Security Best Practices

Enigma consists of a frontend React application and a backend API for user accounts, dataset reading and leaderboards.

### Frontend Security

- **Dependency Updates**: We regularly update dependencies to patch vulnerabilities
- **Code Review**: All contributions are reviewed before merging
- **Input Validation**: User inputs are validated and sanitized
- **XSS Prevention**: We use React's built-in XSS protections
- **Game Logic**: All puzzle logic runs client-side in the browser

### Backend Security (Optional)

The optional backend provides user authentication and leaderboard features:

- **Password Hashing**: User passwords are hashed using bcrypt with appropriate salt rounds
- **Session Management**: Secure session handling with configurable secrets
- **Input Validation**: All API inputs are validated server-side
- **CORS Configuration**: Configurable cross-origin resource sharing
- **SQL Injection Prevention**: Uses parameterized queries via better-sqlite3

## Known Security Considerations

- **Game State**: Game progress is stored in browser localStorage
- **User Data**: When using the backend, user credentials and scores are stored in a local SQLite database
- **Static Assets**: Images and audio files are served as static assets
- **Third-Party Dependencies**: We use well-maintained, popular libraries (React, Vite, Express, etc.)
- **Session Secret**: Production deployments should set a strong `SESSION_SECRET` environment variable

## Reporting Non-Security Bugs

For non-security bugs, please use the [GitHub Issues](https://github.com/ianfhunter/enigma/issues) page with the bug report template.

## Security Updates

Security updates will be:
- Released as soon as possible after discovery
- Documented in release notes
- Tagged with security labels on GitHub

Thank you for helping keep Enigma secure! 🔒
