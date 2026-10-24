# API Engine Guardrails & Request/Response Integrity

READ AGENT_INSTRUCTIONS.md at workspace root.

Protected Core:
- `src/core/engine/runnerEngine.ts`
- `src/core/engine/runnerClient.ts`
- `src/core/engine/types.ts`
- `src/lib/workflowLocalStorage.ts`
- `src/components/JsonColorViewer.tsx`
- `src/components/ApiResponseDrawer.tsx`

Rules:
1. Always ask user permission and propose the exact change before editing protected files.
2. Syntax highlighting and foldable `{ ... }` / `[ ... ]` arrows are the default behavior.
3. Localhost requests must always execute directly in browser.
