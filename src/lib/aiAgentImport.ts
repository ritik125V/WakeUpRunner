import type { WorkflowData, IWorkflowStepData } from './api';
import { migrateLocalStorageWorkflows } from './workflowLocalStorage';

/**
 * AI Agent Magic Link & Integration Service for Putman
 * Handles zero-friction importing from local agents (Cursor, Claude Code, Terminal agents, Copilot).
 */

/**
 * Dynamically resolves the current domain origin (no hardcoded hosts)
 */
export function getCurrentOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  return '';
}

/**
 * Base64 URL-safe encoding and decoding helpers
 */
export function toUrlSafeBase64(str: string): string {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return window
      .btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  // Node / Server environment
  return Buffer.from(str, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function fromUrlSafeBase64(base64Str: string): string {
  let str = base64Str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }

  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    return decodeURIComponent(escape(window.atob(str)));
  }
  // Node / Server environment
  return Buffer.from(str, 'base64').toString('utf-8');
}

/**
 * Encode a workflow or workflow list into a Putman Magic Import URL
 */
export function encodeWorkflowToMagicLink(
  payload: any,
  origin?: string
): string {
  const base = (origin || getCurrentOrigin() || '').replace(/\/$/, '');
  const jsonStr = JSON.stringify(payload);
  const encoded = toUrlSafeBase64(jsonStr);
  return `${base}/workflows/import#data=${encoded}`;
}

/**
 * Decodes and validates inbound payload from URL hash, query parameter, or pasted snippet
 */
export function decodeWorkflowFromPayload(rawInput: string): {
  success: boolean;
  workflow?: WorkflowData;
  allWorkflows?: WorkflowData[];
  error?: string;
} {
  try {
    if (!rawInput || typeof rawInput !== 'string') {
      return { success: false, error: 'Empty or invalid import payload provided.' };
    }

    let payloadString = rawInput.trim();

    // 1. If user passed full URL or hash, extract the data token
    if (payloadString.includes('#data=')) {
      payloadString = payloadString.split('#data=')[1];
    } else if (payloadString.includes('?data=')) {
      const match = payloadString.match(/[?&]data=([^&#]+)/);
      if (match) payloadString = match[1];
    } else if (payloadString.startsWith('#')) {
      payloadString = payloadString.substring(1);
    }

    // Clean any remaining query/hash fragments
    if (payloadString.includes('&')) {
      payloadString = payloadString.split('&')[0];
    }

    let parsedJson: any = null;

    // 2. Try decoding as Base64 URL-safe
    try {
      const decodedStr = fromUrlSafeBase64(payloadString);
      parsedJson = JSON.parse(decodedStr);
    } catch {
      // 3. Fallback: Try decoding standard URI Component
      try {
        const decodedUri = decodeURIComponent(payloadString);
        parsedJson = JSON.parse(decodedUri);
      } catch {
        // 4. Fallback: Try direct JSON parse (if user pasted raw JSON)
        try {
          parsedJson = JSON.parse(payloadString);
        } catch (e: any) {
          return {
            success: false,
            error: 'Failed to decode workflow: Payload is neither valid Base64 nor valid JSON.',
          };
        }
      }
    }

    if (!parsedJson || typeof parsedJson !== 'object') {
      return { success: false, error: 'Parsed payload is not a valid object.' };
    }

    // 5. Migrate and normalize workflow structure
    const migrated = migrateLocalStorageWorkflows(parsedJson);

    if (!migrated.workflows || migrated.workflows.length === 0) {
      return {
        success: false,
        error: 'No valid workflow steps or definition found in decoded data.',
      };
    }

    // Ensure IDs are unique to avoid collision with existing local items
    const normalizedWorkflows = migrated.workflows.map((wf) => ({
      ...wf,
      _id: `ai-imported-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: wf.name || 'AI Generated Workflow',
      isLocalOnly: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    return {
      success: true,
      workflow: normalizedWorkflows[0],
      allWorkflows: normalizedWorkflows,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Decoding error: ${err.message || 'Unknown error occurred'}`,
    };
  }
}

/**
 * Generates the standardized instruction prompt for user's AI Agent
 * Dynamically resolves domain origin from runtime context (no hardcoding).
 */
export function generateAIAgentPrompt(customBaseUrl?: string): string {
  const currentOrigin =
    customBaseUrl ||
    getCurrentOrigin() ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  const importTarget = currentOrigin
    ? `${currentOrigin.replace(/\/$/, '')}/workflows/import#data=`
    : '/workflows/import#data=';

  return `You are an expert API Testing & Workflow Architect generating an automated test suite for **Putman** (the open-source, local-first API workflow runner).

### 📘 ABOUT PUTMAN & HOW IT EXECUTES APIs
Putman runs multi-step HTTP API test journeys sequentially in the user's browser runtime with zero cloud dependencies. To build the most reliable workflow, adhere to how Putman operates:

1. **Sequential Step-by-Step Execution**:
   - Steps execute in strict sequential order (1 ➔ 2 ➔ 3...).
   - The output state of preceding steps is immediately available to all subsequent steps.

2. **JSONPath Dynamic Variable Extraction & Chaining**:
   - Each step can define \`extractVariables: [{ "varName": "tokenName", "jsonPath": "path.to.value" }]\`.
   - Standard JSONPath notation is supported: e.g. \`token\`, \`data.token\`, \`user.id\`, \`items[0].id\`, \`cart.id\`.
   - **Runtime Interpolation**: Any extracted variable can be dynamically injected into subsequent steps using double curly braces \`{{varName}}\` anywhere:
     - In the URL: \`http://localhost:4000/api/users/{{userId}}\`
     - In Query Parameters: \`?token={{authToken}}\`
     - In Request Headers: \`Authorization: Bearer {{authToken}}\` or \`X-CSRF-Token: {{csrfToken}}\`
     - Inside stringified JSON bodies: \`"{ \\"userId\\": \\"{{userId}}\\", \\"cartId\\": \\"{{activeCartId}}\\" }"\`

3. **Automatic Cookie Jar & Session State**:
   - \`captureCookies: true\`: Putman intercepts all \`Set-Cookie\` response headers (including \`HttpOnly\`, \`SameSite\`, and multiple simultaneous cookies) and stores them in the workflow's local Cookie Jar.
   - \`carryCookies: true\`: Putman automatically attaches all accumulated session cookies to the outgoing \`Cookie\` header of that step.
   - *Best Practice*: Enable both flags for session-based auth (e.g. Express session, Django session, banking CSRF tokens).

4. **HTTP Verbs & REST Conventions**:
   - \`POST\`: Resource creation (assert \`expectedStatusCode: 201\`) or authentication login.
   - \`PUT\`: Strict full replacement (always provide complete entity payload; Putman asserts strict schema replacements).
   - \`PATCH\`: Partial merge / updates.
   - \`DELETE\`: Idempotent removal (assert \`expectedStatusCode: 204\` or \`200\`).
   - \`GET\`, \`HEAD\`, \`OPTIONS\`: Retrieval and capability checks.

5. **Expected Status Code Assertions**:
   - \`expectedStatusCode\`: Integer (e.g. \`200\`, \`201\`, \`204\`, or \`400\`/\`422\` for intentional error tests). Putman asserts this and flags mismatches in the telemetry report.

---

### 📋 YOUR TASK AS AN AI AGENT

#### Phase 1: Codebase Inspection
- Examine the backend routes, controllers, models, and OpenAPI/swagger specifications in this workspace.

#### Phase 2: Clarification Interview
Before generating the workflow, briefly ask me:
1. What host & port is my backend server running on (e.g. \`http://localhost:4000\`, \`http://127.0.0.1:8000\`)?
2. What authentication strategy does the app use (JWT Bearer tokens, Cookie sessions, API Keys, Basic Auth)?
3. Are there specific critical user journeys or edge cases you want to cover (e.g. Register ➔ Login ➔ Cart ➔ Checkout ➔ Verify)?

#### Phase 3: Construct the Putman Workflow Schema
Assemble the workflow adhering to this JSON schema:
\`\`\`json
{
  "name": "E-Commerce Checkout Journey",
  "description": "Multi-step automated flow validating login, cart initialization, shipping PUT, and checkout",
  "steps": [
    {
      "name": "1. User Login",
      "url": "http://localhost:4000/api/test/journeys/ecommerce/login",
      "method": "POST",
      "headers": {
        "Content-Type": "application/json"
      },
      "queryParams": {},
      "bodyPayload": "{\\n  \\"email\\": \\"alex@putman.dev\\",\\n  \\"password\\": \\"password123\\"\\n}",
      "expectedStatusCode": 200,
      "captureCookies": true,
      "carryCookies": true,
      "extractVariables": [
        { "varName": "authToken", "jsonPath": "token" },
        { "varName": "userId", "jsonPath": "userId" }
      ]
    },
    {
      "name": "2. Add to Cart",
      "url": "http://localhost:4000/api/test/journeys/ecommerce/cart",
      "method": "POST",
      "headers": {
        "Content-Type": "application/json",
        "Authorization": "Bearer {{authToken}}"
      },
      "queryParams": {},
      "bodyPayload": "{\\n  \\"productId\\": \\"prod_keyboard\\",\\n  \\"quantity\\": 2\\n}",
      "expectedStatusCode": 201,
      "captureCookies": true,
      "carryCookies": true,
      "extractVariables": [
        { "varName": "cartId", "jsonPath": "cartId" }
      ]
    },
    {
      "name": "3. Clean PUT Shipping Address",
      "url": "http://localhost:4000/api/test/journeys/ecommerce/cart/{{cartId}}/shipping",
      "method": "PUT",
      "headers": {
        "Content-Type": "application/json",
        "Authorization": "Bearer {{authToken}}"
      },
      "queryParams": {},
      "bodyPayload": "{\\n  \\"fullName\\": \\"Alex Rivera\\",\\n  \\"addressLine1\\": \\"100 Innovation Way\\",\\n  \\"city\\": \\"San Francisco\\",\\n  \\"postalCode\\": \\"94105\\",\\n  \\"country\\": \\"USA\\",\\n  \\"shippingMethod\\": \\"express\\"\\n}",
      "expectedStatusCode": 200,
      "captureCookies": true,
      "carryCookies": true,
      "extractVariables": []
    }
  ]
}
\`\`\`

---

### ⚡ CRITICAL DELIVERY REQUIREMENT (Magic 1-Click Link):
Do NOT ask me to save, download, or manually upload an MD or JSON file.
Instead:
1. Minify your generated JSON workflow object.
2. Base64-URL encode it (\`base64url\` format).
3. Append it to this exact target URL:
   \`${importTarget}<YOUR_BASE64_URL_STRING>\`

If you have shell access in this environment, you can run this command to generate it cleanly:
\`\`\`bash
node -e 'const fs=require("fs"); const b=Buffer.from(JSON.stringify(WORKFLOW_OBJ)).toString("base64url"); console.log("${importTarget}" + b);'
\`\`\`

Print the clickable markdown link to me:
**[👉 Click here to Open & Run in Putman](${importTarget}...)**
`;
}
