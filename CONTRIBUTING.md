# Contributing to AI Dev Workflow

Thank you for your interest in contributing! 🎉

## How to Contribute

### Reporting Bugs

1. Check if the issue already exists
2. Open a new issue with:
   - Clear title
   - Steps to reproduce
   - Expected vs actual behavior
   - Your environment (OS, Node version, etc.)

### Suggesting Features

1. Open an issue with the `enhancement` label
2. Describe the use case and proposed solution

### Pull Requests

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Test locally
5. Commit with a clear message
6. Push and open a PR

## Development Setup

```bash
git clone https://github.com/wyofalcon/ai-dev-workflow.git
cd ai-dev-workflow

# Make scripts executable
chmod +x scripts/*.sh scripts/*.py .devcontainer/*.sh

# Test locally
bash scripts/audit-watch.sh
```

## Code Style

- Shell scripts: Use `shellcheck` for linting
- Python: Follow PEP 8
- Keep scripts POSIX-compatible where possible

## Adding New Audit Patterns

Edit `.audit-config.json` and test with:

```bash
echo 'password = "test123"' > test.js
python3 scripts/audit-file.py test.js
rm test.js
```

## Questions?

Open an issue or discussion. We're happy to help!
