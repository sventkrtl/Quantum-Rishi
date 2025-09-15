# Contributing to Quantum Rishi

Thank you for your interest in contributing to Quantum Rishi! This document provides guidelines for contributing to our ethical AI storytelling platform.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### 1. Fork and Clone
```bash
git clone https://github.com/sventkrtl/quantum-rishi.git
cd quantum-rishi
npm install
```

### 2. Create a Branch
```bash
git checkout -b feature/your-feature-name
```

### 3. Make Changes
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass

### 4. Commit Messages
Use conventional commit format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests

### 5. Submit a Pull Request
- Push your branch to your fork
- Create a pull request with a clear description
- Link any related issues

## Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation
```bash
npm install
npm run dev
```

### Testing
```bash
npm test
npm run test:watch
```

### Building
```bash
npm run build
```

## Project Structure

```
quantum-rishi/
├── src/
│   ├── app/          # Next.js app router
│   ├── components/   # React components
│   └── lib/          # Utility functions
├── pages/
│   └── api/          # API routes
├── public/           # Static assets
└── docs/             # Documentation
```

## Ethical Guidelines

As an ethical AI platform, please ensure:
- No harmful or biased content
- Respect for user privacy
- Transparent AI usage
- Charitable mission alignment

## Getting Help

- Create an issue for bugs or feature requests
- Join discussions in GitHub Discussions
- Review existing documentation

Thank you for contributing to making AI storytelling more ethical and accessible!