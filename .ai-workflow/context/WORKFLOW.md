# Workflow Configuration

## 🔄 Prompt Relay Mode

Controls how Copilot-generated prompts are sent to the Builder (Gemini/Claude).

| Mode       | Value    | Description                                                    |
| ---------- | -------- | -------------------------------------------------------------- |
| **Review** | `review` | Copilot writes prompt to file, user reviews and sends manually |
| **Auto**   | `auto`   | Copilot writes prompt, automatically sent to Builder           |

**Current Mode:** Check `.context/RELAY_MODE`

---

## 🔍 Audit Watch Mode

Controls whether the Auditor automatically checks files when you save them.

| Mode    | Value | Description                                       |
| ------- | ----- | ------------------------------------------------- |
| **On**  | `on`  | Auditor runs checks on every file save (default)  |
| **Off** | `off` | Manual auditing only - no automatic file watching |

**Current Mode:** Check `.context/AUDIT_WATCH_MODE`

---

## How It Works

### Hybrid Task Routing (Default)

The Auditor (Copilot) uses a **hybrid approach** — it can either code directly or delegate to the Builder:

| Task Size | Who Codes | Examples |
|-----------|-----------|----------|
| **Small/focused** | Auditor (Copilot) directly | Add a button, fix a bug, small refactor |
| **Large/multi-file** | Builder (Gemini/Claude) | New feature, new API endpoints, major refactor |

**Audit runs on ALL code regardless of author.**

### Prompt Relay (Review Mode)

1. You describe your idea to Copilot
2. Copilot assesses: small task or large task?
3. **If small:** Copilot implements directly, commits through audit
4. **If large:** Prompt refined, saved to `.context/PROMPT.md`
5. You review and copy/paste to Builder terminal (or run `send-prompt`)

### Prompt Relay (Auto Mode)

1. You describe your idea to Copilot
2. Copilot assesses: small task or large task?
3. **If small:** Copilot implements directly, commits through audit
4. **If large:** Prompt refined and automatically piped to Builder terminal

### Audit Watch (On - Default)

- Watches `src/`, `api/`, `scripts/` for file changes
- Runs `audit-file.py` on each saved file
- Reports issues in real-time in the Audit Watch terminal

### Audit Watch (Off)

- No automatic file watching
- Run audits manually with `./scripts/audit-file.py <file>`

---

## Changing Modes

### Toggle via UI (Recommended)

```bash
./scripts/toggle-relay-mode.sh    # Toggle Prompt Relay (review/auto)
./scripts/toggle-audit-watch.sh   # Toggle Audit Watch (on/off)
```

### Toggle via Command

```bash
# Prompt Relay
echo "auto" > .context/RELAY_MODE
echo "review" > .context/RELAY_MODE

# Audit Watch
echo "on" > .context/AUDIT_WATCH_MODE
echo "off" > .context/AUDIT_WATCH_MODE
```

### Toggle via Copilot

Just say: "switch to auto mode", "turn off audit watch", etc.
