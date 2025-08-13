# Migration Summary: Rename (main) → main

## 🚩 Rationale
- **Problem**: The folder name `(main)` (with parentheses) is non-standard and can cause issues with tooling, imports, and developer experience. It is considered a bad practice for directory naming in modern JavaScript/TypeScript projects.
- **Goal**: Rename all instances of `(main)` to `main` for clarity, maintainability, and compatibility.

## 🛠️ Steps Taken
1. **Renamed Directory**
   - `frontend/src/app/(main)` → `frontend/src/app/main`
2. **Bulk Updated All References**
   - All import statements, dynamic imports, and path references in code, tests, and configs updated:
     - `@/app/(main)/...` → `@/app/main/...`
     - `../app/(main)/...` → `../app/main/...`
     - `"@/app/(main)/...` → `"@/app/main/...`
     - Comments and documentation updated for clarity
3. **Checked Path Aliases**
   - Verified and updated any path aliases in `jsconfig.json`, `vitest.config.js`, etc.
4. **Tested and Built Project**
   - Ran all tests and built the project to ensure no broken imports or runtime errors

## 🧑‍💻 Developer Notes
- **Why is this important?**
  - Parentheses in folder names can break import resolution, confuse editors, and cause issues with some build tools.
  - Standardizing to `main` improves cross-platform compatibility and developer experience.
- **How to update your code:**
  - Always use `main` (no parentheses) in all imports and paths.
  - If you see any remaining `(main)` references, update them to `main`.
- **If you encounter errors:**
  - Double-check for any missed references in dynamic imports, test mocks, or config files.
  - Run `npm run test` and `npm run build` to verify the migration.

## ✅ Result
- All code, tests, configs, and documentation now use `main` instead of `(main)`.
- No broken imports or runtime errors.
- Improved maintainability and developer experience.

---

**This migration follows best practices for test isolation and maintainability as recommended by [Kent C. Dodds](https://kentcdodds.com/blog/test-isolation-with-react) and others.** 