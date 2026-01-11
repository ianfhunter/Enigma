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

Since Enigma is a client-side application:

- **No Backend**: Enigma runs entirely in the browser with no server-side code
- **No Data Collection**: We don't collect or store user data
- **No External APIs**: All game logic runs locally
- **No Authentication**: No user accounts or login systems

However, we still take security seriously:

- **Dependency Updates**: We regularly update dependencies to patch vulnerabilities
- **Code Review**: All contributions are reviewed before merging
- **Input Validation**: User inputs are validated and sanitized
- **XSS Prevention**: We use React's built-in XSS protections

## Known Security Considerations

- **Client-Side Only**: All game state is stored in browser memory/localStorage
- **No Sensitive Data**: No passwords, API keys, or personal information is handled
- **Static Assets**: Images and audio files are served as static assets
- **Third-Party Dependencies**: We use well-maintained, popular libraries (React, Vite, etc.)

## Reporting Non-Security Bugs

For non-security bugs, please use the [GitHub Issues](https://github.com/ianfhunter/enigma/issues) page with the bug report template.

## Security Updates

Security updates will be:
- Released as soon as possible after discovery
- Documented in release notes
- Tagged with security labels on GitHub

Thank you for helping keep Enigma secure! 🔒

