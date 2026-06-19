# Contributing to Open Monitor YT

Thank you for your interest in contributing to Open Monitor YT! This document provides guidelines and information about contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

When creating a bug report, please include:

- **Clear and descriptive title**
- **Steps to reproduce** the issue
- **Expected behavior** vs **actual behavior**
- **Environment details** (OS, Node.js version, browser, etc.)
- **Screenshots** if applicable

### Suggesting Features

Feature suggestions are welcome! Please create an issue with:

- **Clear description** of the feature
- **Use case** — why this feature would be useful
- **Possible implementation** ideas (optional)

### Pull Requests

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/Open-Monitor-YT.git
cd Open-Monitor-YT

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env

# Start development
pnpm dev
```

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow the existing code conventions
- Use functional components with hooks
- Use TanStack Query for data fetching
- Use Shadcn/UI components
- Use Tailwind CSS for styling
- Use Framer Motion for animations

### Commits

- Use clear and descriptive commit messages
- Reference issues when applicable (e.g., "Fix #123")
- Keep commits focused on single changes

### Testing

- Write tests for new features
- Ensure existing tests pass
- Run `pnpm test` before submitting

### Documentation

- Update README if adding new features
- Add JSDoc comments for complex functions
- Update any relevant documentation

## Project Structure

Please refer to the [README](README.md#project-structure) for the project structure.

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all tests pass**
4. **Update CHANGELOG.md** with your changes
5. **Request review** from maintainers

## Labels

- `good first issue` — Good for newcomers
- `help wanted` — Extra attention needed
- `bug` — Something isn't working
- `enhancement` — New feature or request
- `documentation` — Documentation improvements
- `dependencies` — Dependency updates

## Questions?

If you have questions about contributing, feel free to:

- Open a [Discussion](https://github.com/springmusk026/Open-Monitor-YT/discussions)
- Check existing discussions for answers
