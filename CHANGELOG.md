# Changelog

All notable changes to Open Monitor YT will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup
- Channel monitoring with automatic polling
- Change detection engine (title, thumbnail, description, tags, view counts)
- AI-powered insights (A/B test detection, upload schedule analysis, title pattern analysis, content gap analysis, thumbnail style analysis, competitor summaries, trending topic detection)
- Activity feed with filtering and pagination
- Channel management UI
- Channel comparison page
- Alert rules (Email, Slack, Discord, Telegram, Webhook)
- Admin panel with full configuration
- Theme support (dark/light mode)
- Docker Compose deployment
- TanStack Query for data fetching
- Axios for HTTP requests
- Centralized types and API layer

### Changed
- Refactored UI with Shadcn components and Framer Motion animations
- Moved theme toggle to header
- Centralized all types, API calls, and data fetching hooks

### Fixed
- API key not persisting in admin config (GET endpoint was missing key in response)

## [0.1.0] - 2026-06-19

### Added
- Initial release
