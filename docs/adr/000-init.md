# ADR 000: Dual-Agent Architecture
* **Status:** Accepted
* **Context:** We need a coding workflow that balances speed (Builder) with security/quality (Auditor).
* **Decision:** Use Gemini for scaffolding and Claude for auditing/refactoring.
* **Consequences:** All features must pass Auditor review before merging.
