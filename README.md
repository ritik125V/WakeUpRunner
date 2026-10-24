# Putman ⚡

> **Open-Source, Local-First Multi-Step API Workflow & Journey Runner**  
> A lightweight, free, and open-source Postman alternative. No accounts, no signups, no cloud databases.

![Putman](https://img.shields.io/badge/Status-Active-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Zero_Login](https://img.shields.io/badge/Auth-No_Login_Required-orange)
![Storage](https://img.shields.io/badge/Storage-100%25_Local_Storage-purple)
![Themes](https://img.shields.io/badge/Themes-6_VS_Code_Themes-pink)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Zero_Errors-blue)

---

## 🌟 Why Putman?

Most modern API testing tools force you to create an account, log in with corporate SSO, or synchronize your private API endpoints, payloads, and tokens to cloud databases.

**Putman** is built from the ground up to be:
- **100% Free & Open Source**: Full source code available, modify and run anywhere.
- **Zero Login / No Signups**: Open the page and immediately start creating and testing workflows.
- **Local-First Privacy**: All workflows, step configurations, and execution histories are stored directly in your browser (`localStorage`). No MongoDB, no analytics trackers, zero data leakage.
- **Pluggable VS Code-Style Themes**: Built-in instant theme switcher supporting:
  - 🌙 **Putman Dark** (Default)
  - 🧛 **Dracula Official**
  - 🐼 **Panda Syntax**
  - 🌌 **Tokyo Night Storm**
  - 🎨 **Monokai Pro**
  - ☀️ **Modern Clean Light**
- **Multi-Step API Journey Testing**: Chain requests sequentially just like end-to-end user journeys (e.g. `Register User` ➔ `Login` ➔ `Extract Auth Token` ➔ `Call Protected Endpoint with Bearer Token` ➔ `Verify & Cleanup`).
- **Dynamic Variable Extraction & Chaining**: Extract values like `token` or `id` using dot notation / JSONPath (`json.token`, `data.user.id`) and interpolate them into subsequent URLs, headers, or payloads using `{{variableName}}`.
- **Automatic Cookie Jar Handling**: Capture `Set-Cookie` response headers and automatically forward cookies step-to-step across API calls.
- **Uses Centralized API Runner Backend**: Connected directly to the centralized, high-speed, deployed API Runner backend (Cloudflare Workers edge engine) for zero CORS limitations.
- **Executive Audit & PDF Reports**: Generate and download professional PDF audit reports (dynamically lazy-loaded) and Markdown debug logs with a single click.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm or yarn

### Installation

```bash
# Clone the repository
git clone git@github.com:ritik125V/WakeUpRunner.git
cd WakeUpRunner

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 📚 Core Architecture, Cookie Engine & Security Documentation

For detailed architectural and security specifications, see:
- 📖 [**API Engine Architecture, Cookie Management & Security Specification**](docs/API_ENGINE_ARCHITECTURE_AND_SECURITY.md) — Exhaustive deep dive on dual-path routing, loopback direct browser execution, stateful cookie carry-forward, and zero-leakage token guarantees.
- 🛡️ [**Agent Instructions & Guardrail Rules**](AGENT_INSTRUCTIONS.md) — Mandatory policies and protected core boundaries for AI coding agents and contributors.

---

## 🧪 Architecture & Quality Verification Benchmark

To verify architectural health, monolith deconstruction, and feature preservation across releases, run:

```bash
npm run benchmark
```

### Benchmark Metrics Evaluated:
1. **Monolith Deconstruction**: Asserts `src/app/workflows/[id]/page.tsx` line reduction (reduced from 4,520 lines to ~260 lines, a **94.2% reduction**).
2. **Modular Subcomponents**: Asserts all 14 feature submodules exist and compile independently.
3. **Dead Code Elimination**: Asserts zero `socket.io-client` dependencies and zero obsolete backend calls.
4. **Theme Token Completeness**: Asserts all 6 themes are registered and cover 100% of semantic CSS variables.
5. **Bundle Optimization**: Asserts `jspdf` is lazy-loaded on demand (`await import('jspdf')`), saving ~300KB on initial load.
6. **Core Engine Correctness**: Asserts context variable interpolation (`{{var}}`) and JSONPath extraction (`data.user.token`).

---

## 📂 Feature-Sliced Project Architecture

```
WakeUpRunner/
├── src/
│   ├── app/
│   │   ├── globals.css                       # Semantic CSS variable tokens & micro-interactions
│   │   ├── layout.tsx                        # Root layout wrapped with ThemeProvider
│   │   ├── page.tsx                          # Landing redirect to /workflows
│   │   ├── profile/page.tsx                  # Local developer workspace, storage telemetry & JSON export
│   │   └── workflows/
│   │       ├── page.tsx                      # Flow Runner workflow manager & creation modal
│   │       └── [id]/
│   │           ├── page.tsx                  # Lean orchestrator page (260 lines)
│   │           └── report/page.tsx           # Execution audit telemetry report & PDF generator
│   ├── components/
│   │   ├── Navbar.tsx                        # Navigation & theme selector
│   │   ├── ThemeSelector.tsx                 # Dropdown theme marketplace
│   │   ├── ApiResponseDrawer.tsx             # Postman-style response drawer
│   │   └── AiSpecImportModal.tsx             # Markdown spec importer
│   ├── core/
│   │   ├── engine/
│   │   │   ├── runnerEngine.ts               # Core execution engine, variable interpolation & cookie jar
│   │   │   ├── runnerClient.ts               # Gateway to deployed Cloudflare Worker API runner
│   │   │   └── types.ts                      # Strict TypeScript types
│   │   └── theme/
│   │       ├── themes.ts                     # 6 Theme definitions with semantic tokens
│   │       └── themeContext.tsx              # Theme provider & dynamic CSS variable injector
│   ├── features/
│   │   └── workflow-editor/
│   │       ├── types.ts                      # Editor types
│   │       ├── hooks/
│   │       │   ├── useWorkflowEditor.ts      # Reactive state, auto-save (debounced) & step CRUD
│   │       │   └── useWorkflowRunner.ts      # Single-step tester & full workflow executor
│   │       └── components/
│   │           ├── TopActionBar.tsx          # Workflow title, bulk base URL, save & run trigger
│   │           ├── StepSequencePipeline.tsx  # Pipeline step reordering, duplicate, delete & skip
│   │           ├── StepHeaderBar.tsx         # HTTP method dropdown, URL input & test trigger
│   │           ├── tabs/
│   │           │   ├── StepRequestTabs.tsx   # Request tabs wrapper
│   │           │   ├── BodyPayloadTab.tsx    # Raw JSON editor & format beautifier
│   │           │   ├── ParamsTab.tsx         # Query parameters grid
│   │           │   ├── HeadersTab.tsx        # Request headers grid with presets
│   │           │   ├── CookiesTab.tsx        # Cookie jar toggle & carryover
│   │           │   └── VariablesTab.tsx      # Dynamic JSONPath variable extraction rules
│   │           └── modals/
│   │               ├── PreflightRunModal.tsx # Step checklist before running
│   │               ├── AuthPresetsModal.tsx  # Bearer / Basic / API Key helper
│   │               └── CurlGuideModal.tsx    # Copyable cURL, Fetch & Python snippets
│   └── lib/
│       ├── api.ts                            # Clean local-first bridge
│       ├── workflowLocalStorage.ts           # Schema validation, CRUD, quota & export/import
│       ├── pdfReportGenerator.ts             # Dynamic lazy-loaded PDF generator
│       └── codeParser.ts                     # AST route extraction
├── scripts/
│   └── benchmark-architecture.js             # Automated architecture & quality benchmark suite
├── package.json
└── tsconfig.json
```

---

## 📄 License
MIT License. Free to use, modify, and distribute.
