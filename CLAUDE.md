# CLAUDE.md - CroMetrics Development Guidelines

## Purpose
This document outlines the core principles and practices for developing Node.js/React applications at CroMetrics. It serves as the primary reference for maintaining code quality, consistency, and professionalism across all prototypes and internal tools.

## Core Development Philosophy

### Write Clean, DRY Code
**DRY (Don't Repeat Yourself)**: Every piece of knowledge must have a single, unambiguous, authoritative representation within the system. If you find yourself writing similar code in multiple places, extract it into a reusable function, component, or module.

### Code Should Be Self-Documenting
Write code that reads like well-written prose. Another developer should understand your intent without extensive comments. Use descriptive variable names, logical function flows, and consistent patterns throughout the application.

### Keep It Simple
Start simple, iterate, and refactor. Don't over-engineer solutions. The best code is often the code you don't write. Choose clarity over cleverness.

## Project Structure & Setup

All projects follow a consistent monorepo structure with separate backend and frontend directories. For detailed setup instructions and configurations, refer to:
- **Setup Guide**: `.claude/commands/setup.md`
- **Technical Patterns**: `.claude/docs/technical-guidelines.md`

## Git Workflow & Version Control

### Branch Strategy
We follow a protected main branch strategy where all development happens on the `develop` branch. The `main` branch represents production-ready code.

**Key Rules:**
1. **Never push directly to main** unless explicitly instructed
2. All development work happens on `develop` 
3. Use feature branches for larger changes
4. Follow conventional commit messages (feat:, fix:, docs:, etc.)

For complete Git workflow documentation, see: `.claude/docs/git.md`

### Quick Git Reference
```bash
# Daily workflow
git checkout develop
git pull origin develop
git add .
git commit -m "feat: add new feature"
git push origin develop

# Only when explicitly told "push to main"
git checkout main
git merge develop
git push origin main
git checkout develop
```

## Development Standards

### React Best Practices
- **Functional Components**: Use hooks and functional components exclusively
- **Component Size**: Keep components under 150 lines
- **Single Responsibility**: Each component does one thing well
- **Composition Over Configuration**: Build from simple, composable parts
- **Custom Hooks**: Extract complex logic into reusable hooks

### Node.js/Express Best Practices
- **Service Layer Pattern**: Separate business logic from HTTP handling
- **Middleware Composition**: Build complex behavior from simple middleware
- **Error Handling**: Use custom error classes and consistent error responses
- **RESTful Design**: Follow REST conventions for API endpoints

### TypeScript Requirements
- **Strict Mode**: Always enable TypeScript strict mode
- **Type Everything**: Define interfaces for all data structures
- **No `any`**: Avoid using `any` type; use `unknown` when type is truly unknown
- **Return Types**: Explicitly define function return types

For detailed code examples and patterns, see: `.claude/docs/technical-guidelines.md`

## Code Style & Formatting

### Naming Conventions
- **Components**: PascalCase (`UserProfile`, `NavigationBar`)
- **Functions/Variables**: camelCase (`getUserData`, `isLoading`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`, `API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`UserDTO`, `ApiResponse`)
- **Files**: Match the default export (`UserProfile.tsx`, `userService.ts`)

### Automated Quality Checks
All code must pass automated checks before being committed:
- **ESLint**: Catches code quality issues
- **Prettier**: Ensures consistent formatting
- **TypeScript**: Type checking with strict mode
- **Husky**: Git hooks enforce standards pre-commit and pre-push

## API Design Principles

### RESTful Endpoints
```
GET    /api/resources     - List all
GET    /api/resources/:id - Get one  
POST   /api/resources     - Create
PUT    /api/resources/:id - Update
DELETE /api/resources/:id - Delete
```

### Consistent Response Format
```typescript
// Success
{ "success": true, "data": {...} }

// Error
{ "success": false, "error": "Error message" }
```

## Security & Performance

### Security First
- Always validate and sanitize input on both client and server
- Use environment variables for all sensitive configuration
- Implement proper authentication and authorization
- Use parameterized queries or ORMs to prevent SQL injection

### Performance Considerations
- Implement caching for frequently accessed data
- Use pagination for large datasets
- Optimize database queries (indexes, select specific fields)
- Code split React applications for faster initial loads
- Memoize expensive computations appropriately

## Testing Philosophy

### Test What Matters
- Focus on user-facing functionality
- Test business logic thoroughly
- Don't test implementation details
- Maintain test files alongside source files

### Test Types
- **Unit Tests**: Individual functions and services
- **Integration Tests**: API endpoints and component interactions
- **End-to-End Tests**: Critical user journeys

## Documentation Requirements

### Code Comments
- Write self-documenting code that rarely needs comments
- When comments are needed, explain "why" not "what"
- Use JSDoc for public APIs and complex functions

### README Files
Every project must have a comprehensive README including:
- Project description and purpose
- Installation and setup instructions
- Environment variables documentation
- API documentation (if applicable)
- Deployment instructions

## Quick Reference Guides

### Essential Resources
- **Project Setup**: `.claude/commands/setup.md`
- **Git Workflow**: `.claude/docs/git.md`
- **Technical Patterns**: `.claude/docs/technical-guidelines.md`
- **Environment Config**: Check project `.env.example`

### Development Workflow
1. Clone repository and checkout `develop`
2. Install dependencies: `npm run install:all`
3. Start development: `npm run dev`
4. Make changes with clear commits
5. Push to `develop` regularly
6. Only merge to `main` when explicitly instructed

## Quality Checklist

Before committing code, ensure:
- [ ] Code follows DRY principles
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] All tests pass
- [ ] Code is self-documenting
- [ ] Commit message follows conventions
- [ ] No sensitive data in code

## Final Principles

1. **Optimize for Readability**: Code is read far more often than written
2. **Refactor Regularly**: Clean up as you work, don't let debt accumulate
3. **Handle Errors Gracefully**: Always consider what could go wrong
4. **Keep Learning**: Stay updated with best practices and new patterns
5. **Collaborate**: Code reviews and pair programming improve quality

Remember: We're building professional, maintainable applications. Every line of code should reflect our commitment to quality and craftsmanship.