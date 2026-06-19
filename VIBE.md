# VIBE.md — How This Project Was Built

> **This project was built entirely with AI assistance in a full vibe-coding session.**

## What is Vibe Coding?

Vibe coding is a development approach where you collaborate with AI to build software. You describe what you want, the AI generates code, you review and iterate. It's not about writing every line yourself — it's about directing the AI to build what you envision.

## How Open Monitor YT Was Built

Open Monitor YT was built in a single, extended AI-assisted coding session using [MiMoCode](https://github.com/springmusk026/MiMoCode) (formerly Codex). The entire codebase — from database schema to UI components, from API routes to deployment configuration — was generated through conversational collaboration with AI.

### The Process

1. **Vision** — Started with a detailed prompt describing the product: a self-hostable YouTube competitive intelligence platform
2. **Research** — AI researched Firecrawl APIs, Prisma schema design, BullMQ queue patterns, and Shadcn/UI components
3. **Architecture** — Designed the project structure, database schema, and API layer
4. **Implementation** — Built modules iteratively: config → scraper → diff engine → queue → LLM → API → UI
5. **Refactoring** — Refined UI/UX with Shadcn components, Framer Motion animations, and theme management
6. **Centralization** — Created unified types, Axios client, and TanStack Query hooks

### What AI Generated

- **100% of the codebase** — Every file, every component, every API route
- **Database schema** — Prisma models with relations and enums
- **API layer** — REST endpoints with proper error handling
- **UI components** — React components with animations and responsive design
- **Infrastructure** — Docker Compose, worker processes, queue management
- **Documentation** — README, contributing guidelines, security policy

### What AI Did NOT Generate

- **Product vision** — The idea and requirements came from the human
- **Design taste** — Color choices, animation timing, and UX decisions were guided by human feedback
- **Business decisions** — Licensing, pricing, and feature priorities were human-directed

## The AI Stack

| Tool | Role |
|------|------|
| MiMoCode | Primary coding assistant |
| Firecrawl | Web research and documentation lookup |
| Claude | Code generation and review |

## Lessons Learned

1. **Be specific** — Detailed prompts produce better code than vague ones
2. **Iterate** — First drafts are rarely perfect; refine through conversation
3. **Test early** — Build and test frequently to catch issues before they compound
4. **Trust but verify** — AI generates good code, but always review for edge cases
5. **Centralize early** — Types, API clients, and hooks should be centralized from the start

## Why This Matters

This project demonstrates that AI-assisted development can produce production-quality software. The codebase is:

- **Well-structured** — Clean architecture with separation of concerns
- **Fully typed** — TypeScript throughout with centralized types
- **Testable** — Modular design with dependency injection
- **Deployable** — Docker Compose ready for production
- **Maintainable** — Clear conventions and documentation

## A Note on Attribution

When using AI to build software, attribution matters. This project:

- Is licensed under BSL-1.1 (personal use free, commercial use requires license)
- Clearly states it was built with AI assistance
- Includes proper credits for all dependencies and tools used

If you build on this project, please:
1. Credit the original project
2. Include this VIBE.md or a similar note
3. Follow the license terms

## Future

This project is a starting point. The AI helped build the foundation — the community will shape what it becomes.

---

**Built with AI. Guided by humans. Open to all.**
