# API Engine & Request/Response Guardrail Rules

CRITICAL: Consult `AGENT_INSTRUCTIONS.md` at workspace root before proceeding.

1. DO NOT touch, modify, or refactor the core API Engine (`src/core/engine/runnerEngine.ts`, `src/core/engine/runnerClient.ts`), the Decoupled Storage (`src/lib/workflowLocalStorage.ts`), or the Request/Response components (`src/components/JsonColorViewer.tsx`, `src/components/ApiResponseDrawer.tsx`).
2. If any change is considered necessary, propose the change first and ask the user for explicit approval.
3. Syntax highlighting (keys, strings, numbers, booleans) and tree folding arrows for objects and arrays are the DEFAULT standard and must not be wrapped in toggles.
4. Localhost requests must always execute directly in the browser via `executeSingleStep`.
