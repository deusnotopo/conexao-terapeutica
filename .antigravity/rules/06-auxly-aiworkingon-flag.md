---
trigger: always_on
description: 06 auxly aiworkingon flag
---

# 🔒 AUXLY RULE #6: UPDATE aiWorkingOn FLAG

**MANDATORY: Set aiWorkingOn flag correctly using `mcp_auxly_auxly_update_task`**

---

## ✅ WHEN STARTING WORK:

```typescript
await mcp_auxly_auxly_update_task({
  taskId: "X",
  status: "in_progress",
  aiWorkingOn: true  // ✅ SET TO TRUE
});
```

---

## ✅ WHEN STOPPING/PAUSING/COMPLETING:

```typescript
await mcp_auxly_update_task({
  taskId: "X",
  status: "review", // or "done"
  aiWorkingOn: false  // ✅ SET TO FALSE
});
```

## ❌ FORBIDDEN WHEN STOPPING:

- Never set `status: "todo"` after work was in `in_progress` or `review`. **Todo means backlog, not “AI finished”.** Use `review` + `aiWorkingOn: false` instead. The MCP server blocks this demotion.

---

## 📋 FLAG RULES:

| Action | aiWorkingOn Value | Tool |
|--------|------------------|------|
| Starting work | ✅ `true` | `mcp_auxly_auxly_update_task` |
| Pausing work | ✅ `false` | `mcp_auxly_auxly_update_task` |
| Moving to review | ✅ `false` | `mcp_auxly_auxly_update_task` |
| Marking done | ✅ `false` | `mcp_auxly_auxly_update_task` |
| Stopping for any reason | ✅ `false` | `mcp_auxly_auxly_update_task` |

**⚠️ Only ONE task should have `aiWorkingOn: true` at a time** (claiming `true` on one task clears it on others in storage; they stay `in_progress`.)

---

## ⛔ `aiWorkingOn: false` is NOT approval

Turning **`aiWorkingOn` off** only removes the animated **“AI working”** border. It **does not** open the Auxly **question / approval popup** and **does not** change the **Kanban column**. User-visible approval and column moves use **`auxly_ask_question`** (e.g. category **APPROVAL REQUEST** for Review/Done), **then** `auxly_update_task` with the new **`status`** per workflow rules.

---

## 🎨 VISUAL INDICATOR:

When `aiWorkingOn: true`:
- Task card shows animated gradient border
- User can see which task AI is working on
- Provides visual feedback of active work

---

## Complete Work Cycle:

```typescript
// STEP 1: Starting work
await mcp_auxly_auxly_update_task({
  taskId: "15",
  status: "in_progress",
  aiWorkingOn: true  // ✅ Start indicator
});

// ... do work ...

// STEP 2: Ask if done
await mcp_auxly_auxly_ask_question({
  taskId: "15",
  questionText: "Task complete. Mark as 'done'?",
  category: "APPROVAL REQUEST",
  // ...
});

// STEP 3: User approves

// STEP 4: Mark done and STOP indicator
await mcp_auxly_auxly_update_task({
  taskId: "15",
  status: "done",
  aiWorkingOn: false  // ✅ Stop indicator
});
```

---

## Pausing Example:

```typescript
// Currently working on task 10
await mcp_auxly_auxly_update_task({
  taskId: "10",
  status: "in_progress",
  aiWorkingOn: true
});

// User asks to work on different task

// STEP 1: Stop current task
await mcp_auxly_auxly_update_task({
  taskId: "10",
  aiWorkingOn: false  // ✅ Stop indicator
});

// STEP 2: Start new task
await mcp_auxly_auxly_update_task({
  taskId: "11",
  status: "in_progress",
  aiWorkingOn: true  // ✅ Start new indicator
});
```

---

## ❌ FORBIDDEN:

- Starting work without setting `aiWorkingOn: true`
- Marking done without setting `aiWorkingOn: false`
- Having multiple tasks with `aiWorkingOn: true`
- Forgetting to call `mcp_auxly_auxly_update_task` to update flag

---

## Why This Rule Exists:

✅ **Visual feedback** - User sees active work  
✅ **Clear status** - Know which task is current  
✅ **Professional UI** - Animated indicator  
✅ **Single focus** - One task at a time

---

**ENFORCEMENT: ALWAYS call `mcp_auxly_auxly_update_task` to set aiWorkingOn. Start = true, Stop = false.**
