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

### Prompt Relay (Review Mode - Default)

1. You describe your idea to Copilot
2. Copilot refines it into a proper prompt
3. Prompt is saved to `.context/PROMPT.md`
4. You review and copy/paste to Builder terminal (or run `send-prompt`)

### Prompt Relay (Auto Mode)

1. You describe your idea to Copilot
2. Copilot refines it into a proper prompt
3. Prompt is automatically piped to Builder terminal

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
