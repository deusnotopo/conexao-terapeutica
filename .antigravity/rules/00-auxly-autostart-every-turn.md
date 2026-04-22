---
trigger: always_on
description: 00 auxly autostart every turn
---

# 🔒 AUXLY RULE #0: AUTO-START MCP EVERY TURN

For every user message that implies work (implement, fix, edit, review, debug, continue, test, deploy, plan, roadmap, improvement plan, analyze or summarize docs — including right after a task reopen):

1. `mcp_auxly_auxly_list_tasks` for `todo`
2. `mcp_auxly_auxly_list_tasks` for `in_progress`
3. Reuse or create task (`mcp_auxly_auxly_create_task`)
4. `mcp_auxly_auxly_get_task`
5. `mcp_auxly_auxly_add_research` (technical + business)
6. `mcp_auxly_auxly_update_task` to `status: "in_progress", aiWorkingOn: true`

Never ask user to remind MCP usage.
Never start coding before step 6 succeeds.
