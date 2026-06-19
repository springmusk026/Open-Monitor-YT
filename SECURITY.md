# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within Open Monitor YT, please send an email to **[springmusk@gmail.com]**. All security vulnerabilities will be promptly addressed.

**Please do NOT report security vulnerabilities through public GitHub issues.**

### What to include

When reporting a vulnerability, please include:

- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if any)

### Response timeline

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 1 week
- **Fix or mitigation:** Within 30 days for critical issues

### What we promise

- We will respond to your report within 48 hours
- We will keep you informed of our progress
- We will not take legal action against researchers who report vulnerabilities
- We will credit you in the fix announcement (unless you prefer to remain anonymous)

## Security Best Practices

When deploying Open Monitor YT:

1. **Environment Variables** — Never commit `.env` files. Use environment variables for all secrets.
2. **Database** — Use strong passwords and restrict network access to PostgreSQL.
3. **Redis** — Enable authentication and restrict network access.
4. **API Keys** — Rotate API keys regularly. Never share them publicly.
5. **HTTPS** — Always use HTTPS in production.
6. **Updates** — Keep dependencies updated to patch known vulnerabilities.

## Scope

This security policy applies to:

- The Open Monitor YT application code
- The Docker Compose configuration
- The Prisma schema and database migrations

This security policy does NOT apply to:

- Third-party services (Firecrawl, LLM providers, etc.)
- Your own modifications to the codebase

## Contact

For security-related inquiries, contact: **[springmusk@gmail.com]**
