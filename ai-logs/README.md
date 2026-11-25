# AI prompt logs

Hub's Quest rule: the repository must contain the complete prompt chain and the agent's response to every prompt.
This folder is that record. Nothing in it is edited after the fact except to append new entries.

## How the logs are kept

1. **One file per AI session** in `sessions/`, numbered in order:
   `NNN-YYYY-MM-DD-<tool>-<topic>.md` (for example `001-2026-11-26-claude-planning-and-setup.md`).
2. **Every exchange is one entry** in that file, using [`TEMPLATE.md`](TEMPLATE.md):
   the prompt verbatim, the agent's response verbatim, the actions the agent took (files written, commands run) and the commit that holds the result.
3. **Claude chat (claude.ai):** Claude appends the entry for each prompt to the session file at the end of every turn, directly in this folder.
   Faiyaj checks it before each commit.
4. **Any other agent** (coding agent in the terminal or editor, ChatGPT, Gemini, etc.): export or copy the session right after it ends, before committing its code.
5. **`raw/`** holds untouched full exports (PDF, HTML or JSON) of each chat as a backup to the markdown entries.
6. **Logs are committed together with the code they produced**, and the commit message names the entry, for example:
   `feat(backend): garden API [log 001#3]`.

## Session index

| # | Started (GMT+6) | Tool | Topic | File |
| --- | --- | --- | --- | --- |
| 001 | 2026-11-26 01:29 | Claude (claude.ai, Opus 5.5) | Brief analysis, concept, plan, repo and backend setup | [sessions/001-2026-11-26-claude-planning-and-setup.md](sessions/001-2026-11-26-claude-planning-and-setup.md) |
