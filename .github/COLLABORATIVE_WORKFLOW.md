# 🤝 CVstomize Collaborative Workflow Guide

> **For AI Agents & Developers:** Follow this guide to work collaboratively without creating conflicts.

---

## 📋 Before Starting Any Work

### 1. Check Current State

```bash
# Always start fresh
git fetch origin
git status
git log --oneline -5

# Check for any in-progress work
gh pr list --state open
gh issue list --assignee @me
```

### 2. Claim Your Issue

- **NEVER work on an issue without assigning yourself first**
- Check if someone else is already assigned
- Comment on the issue: "I'm starting work on this"

```bash
# Assign yourself to an issue
gh issue edit <issue-number> --add-assignee @me

# Or comment to claim
gh issue comment <issue-number> --body "🚀 Starting work on this now"
```

---

## 🌿 Branch Naming Convention

**Format:** `<type>/<issue-number>-<short-description>`

| Type        | Use For       | Example                       |
| ----------- | ------------- | ----------------------------- |
| `feature/`  | New features  | `feature/12-help-chatbot`     |
| `fix/`      | Bug fixes     | `fix/10-data-persistence`     |
| `docs/`     | Documentation | `docs/20-workflow-guide`      |
| `refactor/` | Code cleanup  | `refactor/17-session-storage` |
| `chore/`    | Maintenance   | `chore/7-dependency-updates`  |

```bash
# Create your branch from dev (NOT main)
git checkout dev
git pull origin dev
git checkout -b feature/12-help-chatbot
```

---

## 🚫 File Ownership Boundaries

To prevent conflicts, certain files/directories are "owned" by specific team members during active development.

### Current Assignments (Update as Needed)

| Area          | Files/Directories                  | Owner | Status |
| ------------- | ---------------------------------- | ----- | ------ |
| Frontend Core | `src/components/*.js`              | --    | Open   |
| Backend API   | `api/routes/*.js`                  | --    | Open   |
| Database      | `api/prisma/schema.prisma`         | --    | Open   |
| Auth          | `src/contexts/AuthContext.js`      | --    | Open   |
| Styling       | `src/theme.js`, `src/App.css`      | --    | Open   |
| Config        | `package.json`, `api/package.json` | --    | Open   |

### Rules:

1. **Before modifying a file someone else owns:** Comment on their PR or ping them
2. **Shared files (package.json, schema.prisma):** Always pull latest before editing
3. **If you need to modify an owned file:** Request temporary ownership transfer

---

## 📝 Commit Message Format

```
<type>(<scope>): <short description>

[optional body]

Fixes #<issue-number>
```

**Examples:**

```bash
git commit -m "feat(chatbot): add floating help widget - Fixes #12"
git commit -m "fix(profile): persist resume data on logout - Fixes #10"
git commit -m "docs(workflow): add collaborative guide - Fixes #20"
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`

---

## 🔄 Daily Sync Routine

### Start of Session

```bash
# 1. Fetch latest changes
git fetch origin

# 2. Check if your branch is behind
git status

# 3. If behind, rebase (preferred) or merge
git rebase origin/dev
# OR
git merge origin/dev

# 4. Check for new issues/PRs
gh pr list
gh issue list
```

### Before Pushing

```bash
# 1. Run tests
cd api && npm test
cd .. && npm test

# 2. Check for lint errors
npm run lint

# 3. Rebase on latest dev
git fetch origin
git rebase origin/dev

# 4. Push your branch
git push origin <your-branch> --force-with-lease
```

---

## 🔀 Pull Request Protocol

### Creating a PR

```bash
gh pr create --base dev --title "feat(chatbot): implement help widget" --body "
## Summary
Brief description of changes

## Issue
Fixes #12

## Changes
- Added HelpChatbot.js component
- Created /api/help/chat endpoint
- Updated App.js with new route

## Testing
- [ ] Tested locally
- [ ] All existing tests pass
- [ ] Added new tests for feature

## Screenshots
(if UI changes)
"
```

### PR Requirements

- [ ] Linked to an issue
- [ ] Has clear description
- [ ] Tests pass
- [ ] No merge conflicts
- [ ] Reviewed by at least 1 person (if available)

### Reviewing a PR

```bash
# Check out PR locally
gh pr checkout <pr-number>

# Test it
npm install
npm test
npm start

# Approve or request changes
gh pr review <pr-number> --approve
# OR
gh pr review <pr-number> --request-changes --body "Please fix X"
```

---

## ⚠️ Conflict Resolution

### If You Encounter a Conflict

1. **DON'T force push over someone else's work**
2. **Communicate first:**

   ```bash
   gh issue comment <issue-number> --body "⚠️ I have a conflict with <other-person>'s changes in <file>. Let's sync."
   ```

3. **Resolve locally:**

   ```bash
   git fetch origin
   git rebase origin/dev
   # Fix conflicts in editor
   git add .
   git rebase --continue
   ```

4. **If unsure, ask before merging**

### High-Risk Files (Extra Caution)

- `api/prisma/schema.prisma` - Database schema changes
- `package.json` / `api/package.json` - Dependency changes
- `src/App.js` - Route changes
- `api/index.js` - API route registration

---

## 📢 Communication Protocol

### When to Comment on Issues

- Starting work: "🚀 Starting this now"
- Blocked: "🚧 Blocked by #X"
- Need input: "❓ Question: ..."
- Done: "✅ Completed in PR #X"

### When to Create a New Issue

- Found a bug while working on something else
- Discovered a related task that should be separate
- Need to track a decision or discussion

### Sync Meetings (If Applicable)

- Brief async updates in issue comments
- Tag collaborator: `@username`

---

## 🛡️ Protected Branches

| Branch           | Protection             | Who Can Merge          |
| ---------------- | ---------------------- | ---------------------- |
| `main`           | Protected - Production | Requires PR + approval |
| `staging`        | Protected              | Requires PR            |
| `dev`            | Default target         | Requires PR            |
| Feature branches | None                   | Anyone                 |

---

## 🎯 Current Sprint Focus

Check the [GitHub Project Board](https://github.com/wyofalcon/cvstomize/projects) or issues labeled `priority:high`:

```bash
gh issue list --label "priority:high"
```

---

## 📁 Project Structure Quick Reference

```
cvstomize/
├── src/                    # Frontend (React)
│   ├── components/         # UI components
│   ├── contexts/           # React contexts (Auth, etc.)
│   ├── hooks/              # Custom hooks
│   └── services/           # API service calls
├── api/                    # Backend (Express)
│   ├── routes/             # API endpoints
│   ├── services/           # Business logic
│   ├── middleware/         # Auth, security, etc.
│   └── prisma/             # Database schema
├── tests/                  # E2E tests (Playwright)
├── docs/                   # Documentation
└── .github/                # GitHub workflows & guides
```

---

## 🤖 Instructions for AI Agents

If you are an AI agent helping a developer:

1. **Always check issue assignment** before suggesting work
2. **Follow branch naming** conventions exactly
3. **Run tests** before committing
4. **Create atomic commits** - one logical change per commit
5. **Never force push to shared branches** (dev, staging, main)
6. **When in doubt, comment on the issue** to ask
7. **Respect file ownership** boundaries
8. **Include issue numbers** in commit messages

### Example AI Workflow

```
1. Human: "Work on issue #12"
2. AI: Check if #12 is assigned → If not, assign to human
3. AI: Create branch `feature/12-help-chatbot`
4. AI: Make changes, run tests
5. AI: Commit with message "feat(chatbot): add help widget - Fixes #12"
6. AI: Create PR to dev branch
7. AI: Wait for review before suggesting merge
```

---

## ✅ Checklist Before Ending Session

- [ ] All changes committed with proper messages
- [ ] Branch pushed to origin
- [ ] PR created (if feature complete)
- [ ] Issue updated with progress
- [ ] No uncommitted changes left
- [ ] Tests passing

```bash
# Quick status check
git status
git log --oneline -3
gh pr list --author @me
```

---

_Last Updated: December 5, 2025_
_Maintainers: @wyofalcon_
