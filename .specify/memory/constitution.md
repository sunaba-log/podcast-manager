# Podcast Manager Constitution

## Core Principles

### I. Code Quality

Clean, maintainable code is foundational to all development:

- **Consistency**: Follow established conventions; use linters/formatters (ESLint, Prettier) to enforce style
- **Documentation**: Public APIs must have JSDoc/TypeDoc comments; complex logic requires explanatory comments
- **Modularity**: Functions/classes have single, clear responsibilities; favor composition over inheritance
- **Type Safety**: TypeScript strict mode enabled; no implicit any; types are part of the contract
- **Code Review**: All code reviewed before merge; reviewers verify quality, readability, and adherence to principles

### II. Testing Standards (NON-NEGOTIABLE)

Test-driven development is mandatory at all levels:

- **Unit Tests**: Minimum 80% code coverage; each unit tested in isolation
- **Integration Tests**: Critical paths tested end-to-end; new library contracts require contract tests
- **Test Naming**: Clear, descriptive names (`should_returnError_whenInputIsInvalid`) indicate expected behavior
- **Test Data**: Use fixtures and factories; avoid hard-coded magic values; tests independent and repeatable
- **Performance Tests**: API response times and data processing benchmarked; regressions caught early
- **Test Workflow**: Red-Green-Refactor cycle: tests written first, validated to fail, then implementation, then refactor

### III. User Experience Consistency

Seamless, predictable user interactions across all touchpoints:

- **Interface Design**: UI patterns consistent across features; design system documented and enforced
- **Error Handling**: User-friendly error messages; technical details in logs, human guidance in UI
- **Loading States**: Spinners/progress indicators for all async operations; prevent user confusion
- **Accessibility**: WCAG 2.1 AA compliance; keyboard navigation, screen reader support, contrast ratios
- **Performance Perception**: Visual feedback immediate (< 100ms); full loads under 2 seconds
- **Feedback Loops**: User actions confirmed; results clearly communicated; status always visible

### IV. Performance Requirements

Fast, efficient systems that scale:

- **Response Times**: API endpoints respond in < 500ms (p95); UI interactions respond in < 100ms
- **Data Processing**: Bulk operations stream data; avoid loading entire datasets into memory
- **Database Queries**: Indexed appropriately; N+1 queries eliminated; query performance monitored
- **Caching Strategy**: HTTP caching headers set correctly; client-side caching for static assets; invalidation clear
- **Bundle Size**: JavaScript bundles < 250KB (gzipped); lazy-load non-critical code; monitor with tools
- **Resource Usage**: Memory leaks prevented; connection pooling configured; monitoring/alerts active

## Quality Assurance & Implementation

### Code Review Process

- All PRs require at least one approval before merge
- Reviewers verify adherence to code quality, testing, and performance standards
- Tests must pass and coverage maintained
- Performance impact of changes assessed

### Testing Gates

- No merge without test coverage above 80%
- All tests must pass on main branch (CI/CD blocking)
- Performance regressions detected and flagged
- Integration tests run for any feature touching multiple systems

### Performance Monitoring

- Application Performance Monitoring (APM) active in staging and production
- Alerts trigger on: API latency > 1s, bundle size increase > 10KB, memory leaks, error rate > 1%
- Weekly performance reports reviewed
- Performance budget maintained and tracked

## Development Standards & Guidelines

### Code Quality Tools

- **Linting**: ESLint with strict configuration; pre-commit hooks enforce checks
- **Formatting**: Prettier for consistent code style; automated on save
- **Type Checking**: TypeScript strict mode; no escape hatches without justification
- **Static Analysis**: SonarQube or similar to detect code smells, vulnerabilities, duplicates

### Testing Framework & Tools

- Unit: Jest with 80%+ coverage requirement
- Integration: Supertest (API) + Cypress/Playwright (E2E)
- Performance: Artillery or K6 for load testing
- Mocking: MSW for API mocking; factories for data generation

### UX Standards

- Accessibility: Axe DevTools, Lighthouse audits (target score: 95+)
- Design System: Component library documented; Storybook for visual testing
- Internationalization: i18n framework configured; message catalogs reviewed
- Analytics: User interaction tracking implemented; privacy compliant

### Performance Budgets

- JavaScript: 250KB gzipped
- CSS: 50KB gzipped
- Images: 2MB total per page (optimized)
- API Endpoints: p95 latency < 500ms

## Governance

**Constitution Authority**: This constitution is the source of truth for all development practices. All PRs and reviews must verify compliance with these principles.

**Amendment Process**:

- Changes require documentation and team approval
- Migration plan provided for existing code
- Version number incremented and date recorded

**Violations**: Deviations flagged in code review; patterns escalated to team leads.

**Version**: 1.0.0 | **Ratified**: 2026-01-03 | **Last Amended**: 2026-01-03
