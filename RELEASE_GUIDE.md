# Release Guide

This guide outlines the process for creating new releases of the CEDO Google Auth project.

## Release Process

### 1. Pre-Release Checklist
- [ ] All tests are passing
- [ ] Code has been reviewed and approved
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated with new features
- [ ] Version numbers are synchronized across all package.json files

### 2. Version Bumping

#### For Patch Releases (Bug fixes)
```bash
npm run version:bump
```

#### For Minor Releases (New features)
```bash
npm run version:minor
```

#### For Major Releases (Breaking changes)
```bash
npm run version:major
```

### 3. Manual Version Update Process

#### Update Package Versions
1. Update `package.json` (root)
2. Update `frontend/package.json`
3. Update `backend/package.json`

#### Update CHANGELOG.md
1. Move features from `[Unreleased]` to new version section
2. Add release date
3. Create new `[Unreleased]` section

### 4. Git Workflow for Releases

#### Commit Changes
```bash
git add .
git commit -m "chore: bump version to v0.3.0"
```

#### Create Git Tag
```bash
git tag -a v0.3.0 -m "Release v0.3.0: Enhanced lib structure and API utilities"
```

#### Push Changes and Tags
```bash
git push origin main
git push origin v0.3.0
```

### 5. GitHub Release

1. Go to GitHub repository
2. Click "Releases" → "Create a new release"
3. Choose tag: `v0.3.0`
4. Release title: `v0.3.0: Enhanced lib structure and API utilities`
5. Description: Copy from CHANGELOG.md for this version
6. Click "Publish release"

## Version Naming Convention

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

## Pre-1.0.0 Releases

For versions 0.x.y:
- **0.MINOR.PATCH**
- **MINOR**: Any changes (features or breaking changes)
- **PATCH**: Bug fixes only

## Release Notes Template

```markdown
## What's Changed

### ✨ New Features
- Feature 1 description
- Feature 2 description

### 🐛 Bug Fixes
- Bug fix 1 description
- Bug fix 2 description

### 🔧 Improvements
- Improvement 1 description
- Improvement 2 description

### 📖 Documentation
- Documentation update 1
- Documentation update 2

### ⚠️ Breaking Changes
- Breaking change 1 description (if any)

**Full Changelog**: https://github.com/yourusername/cedo-google-auth/compare/v0.2.0...v0.3.0
```

## Hotfix Process

For urgent bug fixes:

1. Create hotfix branch from main
2. Make minimal fix
3. Update patch version
4. Create PR and merge
5. Tag and release immediately

```bash
git checkout -b hotfix/v0.3.1
# Make fixes
git commit -m "fix: critical security fix"
git checkout main
git merge hotfix/v0.3.1
npm run version:bump
git tag -a v0.3.1 -m "Hotfix v0.3.1: Critical security fix"
git push origin main --tags
``` 