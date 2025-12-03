# CVstomize - AI-Powered Resume Builder

## 🚀 Quick Start for Developers

### Prerequisites
- [VS Code](https://code.visualstudio.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### One-Click Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/wyofalcon/cvstomize.git
   cd cvstomize
   ```

2. **Open in VS Code**
   ```bash
   code .
   ```

3. **Reopen in Dev Container**
   - When VS Code opens, you'll see a notification: "Folder contains a Dev Container configuration file"
   - Click **"Reopen in Container"**
   - Or use Command Palette: `Ctrl+Shift+P` → "Dev Containers: Reopen in Container"
   - ☕ First time takes ~3-5 minutes to build

4. **Start the development servers**
   ```bash
   ./start-local.sh
   ```

5. **Open in browser**
   - Frontend: http://localhost:3000
   - API Health: http://localhost:3001/health

That's it! 🎉

---

## 📁 Project Structure

```
cvstomize/
├── api/                    # Backend (Express + Prisma)
│   ├── routes/             # API endpoints
│   ├── services/           # Business logic (Gemini AI, PDF gen)
│   ├── prisma/             # Database schema & migrations
│   └── __tests__/          # Backend tests
├── src/                    # Frontend (React + MUI)
│   ├── components/         # React components
│   ├── contexts/           # Auth & state management
│   └── services/           # API client
├── tests/                  # E2E tests (Playwright)
├── .devcontainer/          # Dev container config
├── start-local.sh          # Start dev environment
└── stop-local.sh           # Stop dev environment
```

## 🛠️ Common Commands

| Command | Description |
|---------|-------------|
| `./start-local.sh` | Start all services (frontend, backend, DB, Redis) |
| `./stop-local.sh` | Stop all services |
| `npm test` | Run frontend tests |
| `cd api && npm test` | Run backend tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Run E2E tests with interactive UI |

## 🔧 Development Workflow

### Making Changes
1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test locally with `./start-local.sh`
4. Commit and push: `git push origin feature/your-feature`
5. Create a Pull Request to `dev`

### Database Changes
```bash
cd api
npx prisma migrate dev --name your_migration_name  # Create migration
npx prisma generate                                 # Regenerate client
npx prisma studio                                   # Visual DB browser
```

### Viewing Logs
```bash
docker logs -f cvstomize-api-local       # Backend logs
docker logs -f cvstomize-frontend-local  # Frontend logs
docker logs -f cvstomize-db-local        # Database logs
```

## 🔑 Environment & Secrets

The dev container is pre-configured with:
- Local PostgreSQL database
- Local Redis cache
- Firebase Auth (dev project)
- Vertex AI (for resume generation)

**Note:** Secrets are managed via GCP Secret Manager. For local dev, the `gcp-key.json` files handle authentication.

## 🧪 Testing

### Backend Tests
```bash
cd api
npm test                           # All tests
npm test -- --coverage             # With coverage
npm test jobDescriptionAnalyzer    # Single file
```

### E2E Tests
```bash
npm run test:e2e        # Headless (fast)
npm run test:e2e:ui     # Interactive UI (best for debugging)
npm run test:e2e:headed # See browser
npm run test:report     # View HTML report
```

## 🐛 Troubleshooting

### Container won't start
```bash
./stop-local.sh
docker system prune -f
./start-local.sh
```

### Database issues
```bash
cd api
npx prisma migrate reset  # Reset DB (WARNING: deletes data)
npx prisma db push        # Push schema without migration
```

### Port already in use
```bash
docker ps -a                          # Find conflicting containers
docker stop <container_id>            # Stop them
./start-local.sh                      # Try again
```

## 📚 Key Documentation

- [Architecture & API Reference](.github/copilot-instructions.md)
- [Testing Strategy](api/TESTING_STRATEGY.md)
- [Deployment Guide](docs/deployment/)

## 🤝 Need Help?

- Check existing issues on GitHub
- Ask in the team chat
- Review the code with GitHub Copilot (pre-installed in dev container)

---

Happy coding! 🚀
