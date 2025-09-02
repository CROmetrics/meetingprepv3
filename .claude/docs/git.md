# Git Workflow Guide

## Overview

This guide explains how to use Git effectively for CROmetrics prototype development. Every prototype follows these Git conventions to ensure clean, professional repository management.

## Repository Structure

### Repository Naming
Each prototype gets its own repository in the CROmetrics GitHub organization:
- **Format**: `prototype-[descriptive-name]`
- **Examples**: 
  - `prototype-client-dashboard`
  - `prototype-revenue-tracker`
  - `prototype-ab-test-analyzer`

### Branch Structure
```
main                 # Production-ready code only
├── develop         # Active development branch
    ├── feature/*   # New features
    ├── fix/*       # Bug fixes
    └── chore/*     # Maintenance tasks
```

## Core Principles

### 1. Main Branch Protection
**The `main` branch is sacred.** It represents production-ready, deployable code.

**Never push to main unless:**
- The user explicitly says "push to main"
- The user says "deploy to production"
- The user says "this is ready for main"
- The user says "merge to main branch"
- You're making the initial repository setup commit

### 2. Develop Branch is Default
All regular development work happens on the `develop` branch:
```bash
# After initial setup, immediately switch to develop
git checkout -b develop
git push -u origin develop

# All regular commits go here
git add .
git commit -m "feat: add new feature"
git push origin develop
```

### 3. Feature Branches for Isolation
For significant new features or experiments:
```bash
# Create feature branch from develop
git checkout develop
git checkout -b feature/user-authentication

# Work on the feature
git add .
git commit -m "feat: implement login form"

# Push feature branch
git push origin feature/user-authentication

# When ready, merge back to develop
git checkout develop
git merge feature/user-authentication
git push origin develop
```

## Commit Message Convention

Follow the Conventional Commits specification for all commit messages.

### Format
```
<type>: <description>

[optional body]

[optional footer]
```

### Types
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (white-space, formatting)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to build process or auxiliary tools

### Examples
```bash
# New feature
git commit -m "feat: add client filtering to dashboard"

# Bug fix
git commit -m "fix: resolve API connection timeout issue"

# Documentation
git commit -m "docs: update API endpoint documentation"

# Refactoring
git commit -m "refactor: simplify user service logic"

# Chore
git commit -m "chore: update npm dependencies"
```

## Daily Workflow

### Starting Your Day
```bash
# Make sure you're on develop
git checkout develop

# Pull latest changes
git pull origin develop

# Start working
npm run dev
```

### During Development
```bash
# Regular commits to develop
git add .
git commit -m "feat: implement data export functionality"
git push origin develop

# Check your branch status
git status

# View commit history
git log --oneline -10
```

### Creating a Feature Branch
When working on a larger feature that might take multiple sessions:
```bash
# Create and switch to feature branch
git checkout -b feature/advanced-analytics

# Work and commit to feature branch
git add .
git commit -m "feat: add initial analytics structure"
git push origin feature/advanced-analytics

# Continue work across multiple commits
git add .
git commit -m "feat: implement data aggregation"
git push origin feature/advanced-analytics

# When feature is complete, merge to develop
git checkout develop
git merge feature/advanced-analytics
git push origin develop

# Clean up feature branch
git branch -d feature/advanced-analytics
git push origin --delete feature/advanced-analytics
```

## Deployment Workflow

### When Ready for Production
Only when the user explicitly indicates the prototype is ready:

```bash
# Ensure develop is up to date
git checkout develop
git pull origin develop

# Switch to main
git checkout main
git pull origin main

# Merge develop into main
git merge develop

# Push to main (triggers deployment)
git push origin main

# Tag the release (optional)
git tag -a v1.0.0 -m "Initial production release"
git push origin v1.0.0

# Switch back to develop for continued work
git checkout develop
```

## Common Scenarios

### Scenario 1: Quick Bug Fix
```bash
# Create fix branch from develop
git checkout -b fix/data-loading-error

# Make the fix
# ... edit files ...
git add .
git commit -m "fix: resolve data loading race condition"

# Merge back to develop
git checkout develop
git merge fix/data-loading-error
git push origin develop
```

### Scenario 2: Experimental Feature
```bash
# Create feature branch for experiment
git checkout -b feature/experimental-viz

# Multiple commits during experimentation
git add .
git commit -m "feat: try D3.js approach"

git add .
git commit -m "feat: switch to Chart.js for better performance"

# If experiment succeeds, merge to develop
git checkout develop
git merge feature/experimental-viz

# If experiment fails, just delete the branch
git checkout develop
git branch -D feature/experimental-viz
```

### Scenario 3: Updating Dependencies
```bash
# Always do dependency updates on develop
git checkout develop

# Update dependencies
npm update

# Test everything works
npm run dev
npm run type-check

# Commit the changes
git add .
git commit -m "chore: update npm dependencies"
git push origin develop
```

## Git Commands Reference

### Essential Commands
```bash
# Check current branch and status
git status
git branch

# Switch branches
git checkout branch-name
git checkout -b new-branch-name  # Create and switch

# Stage and commit changes
git add .                        # Stage all changes
git add file.ts                  # Stage specific file
git commit -m "message"          # Commit staged changes

# Push and pull
git push origin branch-name      # Push to remote
git pull origin branch-name      # Pull from remote

# View history
git log --oneline -10           # Last 10 commits
git log --graph --pretty=oneline --abbrev-commit

# Merge branches
git checkout target-branch
git merge source-branch
```

### Useful Aliases
Add these to your git config for faster workflow:
```bash
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.last "log -1 HEAD"
```

## Best Practices

### Do's ✅
- Commit early and often to develop
- Write clear, descriptive commit messages
- Pull latest changes before starting work
- Use feature branches for substantial changes
- Test your code before committing
- Keep commits focused on a single change

### Don'ts ❌
- Never push directly to main (unless explicitly instructed)
- Don't commit sensitive data (.env files are gitignored)
- Don't commit node_modules (already in .gitignore)
- Don't force push to shared branches
- Don't commit broken code to develop
- Don't mix unrelated changes in one commit

## Troubleshooting

### Accidentally Committed to Main
```bash
# If you haven't pushed yet
git checkout develop
git cherry-pick main
git checkout main
git reset --hard HEAD~1
git checkout develop
```

### Need to Undo Last Commit
```bash
# Undo commit but keep changes
git reset --soft HEAD~1

# Undo commit and discard changes
git reset --hard HEAD~1
```

### Merge Conflicts
```bash
# When merge conflicts occur
git merge feature-branch
# Git will indicate conflicted files

# Edit conflicted files manually
# Look for <<<<<<< HEAD markers

# After resolving
git add .
git commit -m "fix: resolve merge conflicts"
```

## GitHub Integration

### Creating a New Repository
1. Go to https://github.com/CROmetrics
2. Click "New Repository"
3. Name: `prototype-[your-project-name]`
4. Set visibility (Private recommended for internal tools)
5. Don't initialize with README (we create our own)
6. Click "Create Repository"

### Connecting Local to GitHub
```bash
git remote add origin https://github.com/CROmetrics/prototype-name.git
git push -u origin main
git push -u origin develop
```

### Pull Requests (Optional)
For team collaboration, use Pull requests:
1. Push feature branch to GitHub
2. Open PR from feature branch to develop
3. Request review from team members
4. Merge after approval

## Summary

1. **Always work on `develop` branch** for daily development
2. **Only push to `main`** when explicitly told to deploy
3. **Use feature branches** for larger changes
4. **Follow commit conventions** for clear history
5. **Test before committing** to maintain code quality

Remember: The `main` branch represents what's deployed and stable. The `develop` branch is where active work happens. This separation ensures we always have a working version while allowing freedom to experiment and develop.