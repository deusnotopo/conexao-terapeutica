---
trigger: always_on
description: 08 auxly no mcp excuses
---

# 🔒 AUXLY: NO EXCUSES FOR SKIPPING MCP

On any work turn (analysis, plan, audit, grep-only, **or** code edits), **still** use Auxly MCP. Chat is **not** a substitute.

| Excuse | Wrong | Required |
|--------|--------|----------|
| No task / no `taskId` | Answer in chat | `auxly_list_tasks` → `auxly_create_task` (or reuse) → then comment/research |
| Read-only, no edits | Skip MCP | Same sequence; use `auxly_add_research` and/or `auxly_add_comment`. `auxly_log_change` only after real file edits |
| No HTTP URLs for sources | Skip `auxly_add_research` | Put **local paths** in `sources`: `Local: src/app.js`, `Repo: path/to/file` — URLs optional |
| “Extension enforces MCP” | Assume hard block | **0.1.56 does not inject prompts into the model** — you must call tools; `.cursorrules` + this rule are the contract |
| “NOTE: MCP connection issues, worked manually without task board” | Acceptable transparency | **Forbidden** — retry tools once, then recovery steps only; no large “manual” deliverable paired with that disclaimer |

**Order:** list → create if needed → get → add_research → update_task (`in_progress`, `aiWorkingOn: true`) before substantive output. Rule #2 word limits **do not** waive this sequence.
