# 🛡️ Agent Instructions & Guardrail Rules

> **CRITICAL MANDATORY DIRECTIVE FOR ALL AI AGENTS & SUBAGENTS**  
> **READ THIS DOCUMENT FIRST BEFORE PROCEEDING WITH ANY TASK IN THIS CODEBASE.**

---

## 1. Absolute Protected Core Systems

The following files and directories constitute the **Putman Core API Engine, Data Storage, and Request/Response Architecture**. They have been rigorously built, tested, and verified to achieve a **100% pass rate across the Master Test Suite**.

### 🔒 Guarded Files:
1. **Core Execution Engine**:
   - `src/core/engine/runnerEngine.ts` (Native HTTP execution, assertion engine, cookie parser, JSONPath extraction, variable interpolation)
   - `src/core/engine/runnerClient.ts` (Dual execution router: direct loopback browser execution for localhost vs. Cloudflare Edge Runner `https://run.putman.r8r.in/api`)
   - `src/core/engine/types.ts` (Telemetry contracts, step data schemas, run summaries)

2. **Decoupled Local-First Storage Architecture**:
   - `src/lib/workflowLocalStorage.ts` (Architectural decoupling of static workflow blueprints `wakeup_local_workflows_v1`, dynamic carried data `wakeup_local_api_data_v1`, and runtime session variables/cookies `wakeup_local_variables_v1`)

3. **Request & Response Body Engine**:
   - `src/components/JsonColorViewer.tsx` (Default Postman-style token syntax highlighter with collapsible tree folding arrows `▼`/`▶` for objects `{ ... }` and arrays `[ ... ]`)
   - `src/components/ApiResponseDrawer.tsx` (Default API response telemetry viewer)
   - Request Body Editor in `src/app/workflows/[id]/page.tsx` and `src/features/workflow-editor/components/tabs/BodyPayloadTab.tsx`

---

## 2. Mandatory Rules for Agents

### ❌ Rule 1: DO NOT Touch or Refactor Without Explicit Prior Approval
Under **NO circumstances** may any agent, subagent, or autonomous tool modify, rewrite, delete, or refactor any of the protected files listed above without explicit user instruction.

### 💬 Rule 2: Always Propose Changes to the User First
If a task, bug fix, or feature request appears to require modifications to the API Engine or Request/Response components:
1. **STOP** before touching the code.
2. Explain to the user **why** you believe a change is needed.
3. Propose the **exact diff / changes** in detail.
4. **Wait for explicit user permission** before writing or editing the protected files.

### 🎨 Rule 3: Syntax Highlighting & Tree Folding are the Permanent DEFAULT
- Request and response bodies **must always display syntax-colored tokens by default** (Keys in cyan, strings in emerald, numbers in orange, booleans in purple, variables in amber, brackets in slate).
- Objects `{ ... }` and arrays `[ ... ]` **must always show collapse/expand arrows (`▼` / `▶`)** by default.
- **DO NOT** re-introduce mode switchers like "Pretty (Colors) vs Raw", "Colors Preview", or extra clutter like "key value 123 true".

### 🔒 Rule 4: Preserve Zero-Leakage & Localhost Loopback Guarantees
- Localhost and private network requests (`127.0.0.1`, `localhost`, `192.168.*`, `10.*`, `.local`) **must ALWAYS execute directly in the browser** via `executeSingleStep`. Never route them through Cloudflare or any edge proxy.
- Public Internet requests route through the dedicated Putman Edge Runner (`https://run.putman.r8r.in/api/execute-step`), falling back to browser execution.
- Guest tokens, secrets, and carried data must **never** be transmitted to any external logging service or persisted to cloud databases without the user's manual action.

---

## 3. Reference Documentation
For a complete understanding of how the API Engine works, how cookies are carried between steps, and the security architecture, refer to:
📖 [`docs/API_ENGINE_ARCHITECTURE_AND_SECURITY.md`](file:///home/ritikk/Projects/WakeUpRunner/docs/API_ENGINE_ARCHITECTURE_AND_SECURITY.md)
