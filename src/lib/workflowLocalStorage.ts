import { WorkflowData, IWorkflowStepData, createWorkflow, fetchWorkflows } from './api';

export const FLOW_RUNNER_STORAGE_VERSION = '1.0.0';
const LOCAL_WORKFLOWS_KEY = 'wakeup_local_workflows_v1';
const LOCAL_RUNS_PREFIX = 'wakeup_local_runs_';
export const LOCAL_API_DATA_KEY = 'wakeup_local_api_data_v1';
export const LOCAL_VARIABLES_KEY = 'wakeup_local_variables_v1';

export interface ApiCarriedDataEntry {
  workflowId: string;
  workflowName: string;
  stepId: string;
  stepName: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  bodyPayload: string;
  updatedAt: string;
}

export interface LocalRuntimeVariablesStore {
  variables: Record<string, any>;
  cookies: Record<string, string>;
  updatedAt: string;
}

export interface LocalStorageWorkflowContainer {
  version: string;
  updatedAt: string;
  workflows: WorkflowData[];
}

/**
 * Migration runner for upgrading local storage schemas across versions
 */
export function migrateLocalStorageWorkflows(container: any): LocalStorageWorkflowContainer {
  if (!container || typeof container !== 'object') {
    return {
      version: FLOW_RUNNER_STORAGE_VERSION,
      updatedAt: new Date().toISOString(),
      workflows: [],
    };
  }

  let workflows: WorkflowData[] = [];
  if (Array.isArray(container)) {
    workflows = container;
  } else if (Array.isArray(container.workflows)) {
    workflows = container.workflows;
  } else if (container && typeof container === 'object' && Array.isArray(container.steps)) {
    workflows = [container];
  }

  // Migration rules from pre-1.0.0 or raw arrays
  workflows = workflows.map((wf: any) => {
    return {
      _id: wf._id || `local-flow-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: wf.userId || 'guest-local-user',
      name: wf.name || 'Untitled Local Workflow',
      description: wf.description || '',
      steps: Array.isArray(wf.steps)
        ? wf.steps.map((st: any, idx: number) => ({
            stepId: st.stepId || `step-${Date.now()}-${idx}`,
            name: st.name || `Step ${idx + 1}`,
            url: st.url || '',
            method: st.method || 'GET',
            headers: st.headers || {},
            queryParams: st.queryParams || {},
            bodyPayload: st.bodyPayload || '',
            expectedStatusCode: st.expectedStatusCode || 200,
            captureCookies: st.captureCookies ?? true,
            carryCookies: st.carryCookies ?? true,
            extractVariables: Array.isArray(st.extractVariables) ? st.extractVariables : [],
            skipped: Boolean(st.skipped),
          }))
        : [],
      lastRunAt: wf.lastRunAt,
      lastRunStatus: wf.lastRunStatus,
      createdAt: wf.createdAt || new Date().toISOString(),
      updatedAt: wf.updatedAt || new Date().toISOString(),
      isLocalOnly: true,
    };
  });

  return {
    version: FLOW_RUNNER_STORAGE_VERSION,
    updatedAt: new Date().toISOString(),
    workflows,
  };
}

/**
 * Strips all values from a JSON body payload while preserving keys, objects, and array structures.
 * All primitive values are converted to empty string placeholders ("").
 * This guarantees sensitive request body data is never stored in the API configuration blueprint.
 */
export function stripValuesFromPayload(payload: string): string {
  if (!payload || typeof payload !== 'string' || payload.trim() === '') {
    return '';
  }
  try {
    const parsed = JSON.parse(payload);
    const stripValue = (val: any): any => {
      if (val === null || val === undefined) return null;
      if (Array.isArray(val)) {
        return val.map((item) => stripValue(item));
      }
      if (typeof val === 'object') {
        const strippedObj: Record<string, any> = {};
        for (const [k, v] of Object.entries(val)) {
          strippedObj[k] = stripValue(v);
        }
        return strippedObj;
      }
      return '';
    };

    const stripped = stripValue(parsed);
    return JSON.stringify(stripped, null, 2);
  } catch {
    // If not valid JSON, treat as raw plain text: return empty string to prevent credential leakage
    return '';
  }
}

/**
 * Sanitizes a URL and query parameters.
 * Extracts any concrete parameter values for the carried data store, while converting
 * all query parameters in the blueprint configuration into keys with empty values.
 */
export function sanitizeUrlAndQueryParams(
  rawUrl: string,
  queryParams?: Record<string, string>
): {
  sanitizedUrl: string;
  sanitizedQueryParams: Record<string, string>;
  extractedParamValues: Record<string, string>;
} {
  const sanitizedQueryParams: Record<string, string> = {};
  const extractedParamValues: Record<string, string> = {};

  if (queryParams && typeof queryParams === 'object') {
    for (const [k, v] of Object.entries(queryParams)) {
      sanitizedQueryParams[k] = '';
      if (v !== undefined && v !== null && String(v) !== '') {
        extractedParamValues[k] = String(v);
      }
    }
  }

  let sanitizedUrl = (rawUrl || '').trim();

  if (sanitizedUrl.includes('?')) {
    const qIndex = sanitizedUrl.indexOf('?');
    const baseUrl = sanitizedUrl.substring(0, qIndex);
    const queryString = sanitizedUrl.substring(qIndex + 1);

    if (queryString) {
      const pairs = queryString.split('&');
      const sanitizedPairs: string[] = [];

      for (const pair of pairs) {
        if (!pair) continue;
        const eqIdx = pair.indexOf('=');
        let key = '';
        let val = '';
        if (eqIdx >= 0) {
          key = decodeURIComponent(pair.substring(0, eqIdx));
          val = decodeURIComponent(pair.substring(eqIdx + 1));
        } else {
          key = decodeURIComponent(pair);
          val = '';
        }

        if (key) {
          sanitizedQueryParams[key] = '';
          if (val) {
            extractedParamValues[key] = val;
          }
          sanitizedPairs.push(`${encodeURIComponent(key)}=`);
        }
      }

      sanitizedUrl = sanitizedPairs.length > 0 ? `${baseUrl}?${sanitizedPairs.join('&')}` : baseUrl;
    }
  }

  return { sanitizedUrl, sanitizedQueryParams, extractedParamValues };
}

/**
 * Sanitizes a workflow into an API configuration blueprint where all keys (headers, query params, body)
 * are retained, but all sensitive values are decoupled and replaced with empty placeholders.
 */
export function sanitizeWorkflowConfiguration(wf: WorkflowData): WorkflowData {
  if (!wf) return wf;
  return {
    ...wf,
    steps: Array.isArray(wf.steps)
      ? wf.steps.map((step) => {
          const sanitizedHeaders: Record<string, string> = {};
          if (step.headers && typeof step.headers === 'object') {
            for (const k of Object.keys(step.headers)) {
              sanitizedHeaders[k] = '';
            }
          }

          const { sanitizedUrl, sanitizedQueryParams } = sanitizeUrlAndQueryParams(
            step.url || '',
            step.queryParams
          );

          const sanitizedBody = stripValuesFromPayload(step.bodyPayload || '');

          return {
            ...step,
            url: sanitizedUrl,
            headers: sanitizedHeaders,
            queryParams: sanitizedQueryParams,
            bodyPayload: sanitizedBody,
          };
        })
      : [],
  };
}

/**
 * In-memory rehydration: merges decoupled carried key-values from LOCAL_API_DATA_KEY
 * back into the workflow configuration so the browser editor and runner have live executable values.
 */
export function hydrateWorkflowWithCarriedData(wf: WorkflowData): WorkflowData {
  if (!wf || !Array.isArray(wf.steps)) return wf;
  const store = getSeparatedApiDataStore();

  const hydratedSteps = wf.steps.map((step) => {
    const sId = step.stepId || '';
    const dataKey = `${wf._id}::${sId}`;
    const carried = store[dataKey] || (sId ? store[sId] : undefined);
    if (!carried) return step;

    // Merge headers: preserve all blueprint keys, inject carried values where present
    const headers: Record<string, string> = {};
    if (step.headers) {
      for (const k of Object.keys(step.headers)) {
        headers[k] = carried.headers?.[k] !== undefined ? carried.headers[k] : step.headers[k];
      }
    }
    if (carried.headers) {
      for (const [k, v] of Object.entries(carried.headers)) {
        if (!(k in headers)) {
          headers[k] = v;
        }
      }
    }

    // Merge queryParams
    const queryParams: Record<string, string> = {};
    if (step.queryParams) {
      for (const k of Object.keys(step.queryParams)) {
        queryParams[k] = carried.queryParams?.[k] !== undefined ? carried.queryParams[k] : step.queryParams[k];
      }
    }
    if (carried.queryParams) {
      for (const [k, v] of Object.entries(carried.queryParams)) {
        if (!(k in queryParams)) {
          queryParams[k] = v;
        }
      }
    }

    // Reconstruct URL with real query parameter values for execution
    let hydratedUrl = step.url || '';
    if (hydratedUrl.includes('?') && Object.keys(queryParams).length > 0) {
      const [baseUrl] = hydratedUrl.split('?');
      const pairs: string[] = [];
      for (const [k, v] of Object.entries(queryParams)) {
        pairs.push(`${encodeURIComponent(k)}=${encodeURIComponent(v || '')}`);
      }
      hydratedUrl = pairs.length > 0 ? `${baseUrl}?${pairs.join('&')}` : baseUrl;
    } else if (carried.url && carried.url.includes('?') && !step.url.includes('?')) {
      hydratedUrl = carried.url;
    }

    // Merge bodyPayload: use carried body payload if present, else blueprint payload
    const bodyPayload =
      carried.bodyPayload !== undefined && carried.bodyPayload !== ''
        ? carried.bodyPayload
        : step.bodyPayload || '';

    return {
      ...step,
      url: hydratedUrl,
      headers,
      queryParams,
      bodyPayload,
    };
  });

  return {
    ...wf,
    steps: hydratedSteps,
  };
}

/**
 * Get all decoupled API configuration blueprints directly from LocalStorage
 * Guaranteed to contain only keys and zero sensitive values.
 */
export function getDecoupledWorkflows(): WorkflowData[] {
  if (typeof window === 'undefined') return [];
  try {
    const container = getLocalContainer();
    return (container.workflows || []).map((wf) => sanitizeWorkflowConfiguration(wf));
  } catch (err) {
    console.error('Failed to get decoupled workflow blueprints:', err);
    return [];
  }
}

/**
 * Get all local workflows from LocalStorage (rehydrated with carried data for live usage)
 */
export function getLocalWorkflows(): WorkflowData[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_WORKFLOWS_KEY);
    if (!raw) {
      // Seed initial sample workflow ONLY ONCE for new guest visitors
      const hasSeeded = localStorage.getItem('wakeup_seeded_sample_v1');
      if (!hasSeeded && !localStorage.getItem('wakeup_auth_token')) {
        localStorage.setItem('wakeup_seeded_sample_v1', 'true');
        const sampleContainer = getSampleGuestWorkflowsContainer();
        for (const wf of sampleContainer.workflows) {
          syncCarriedDataForWorkflow(wf);
        }
        saveLocalContainer(sampleContainer);
        return sampleContainer.workflows;
      }
      return [];
    }

    const parsed = JSON.parse(raw);
    let workflows: WorkflowData[] = [];
    if (parsed.version !== FLOW_RUNNER_STORAGE_VERSION || !Array.isArray(parsed.workflows)) {
      const migrated = migrateLocalStorageWorkflows(parsed);
      for (const wf of migrated.workflows) {
        syncCarriedDataForWorkflow(wf);
      }
      saveLocalContainer(migrated);
      workflows = migrated.workflows;
    } else {
      workflows = parsed.workflows;
    }

    // Auto-sanitize existing stored container if any un-sanitized values were previously saved
    let hasUnsanitized = false;
    for (const wf of workflows) {
      for (const st of wf.steps || []) {
        if (
          Object.values(st.headers || {}).some((v) => v !== '') ||
          Object.values(st.queryParams || {}).some((v) => v !== '') ||
          (st.url && st.url.includes('?') && st.url.split('?')[1]?.includes('=')) ||
          (st.bodyPayload && st.bodyPayload !== stripValuesFromPayload(st.bodyPayload))
        ) {
          hasUnsanitized = true;
          break;
        }
      }
      if (hasUnsanitized) break;
    }
    if (hasUnsanitized) {
      for (const wf of workflows) {
        syncCarriedDataForWorkflow(wf);
      }
      saveLocalContainer({
        version: FLOW_RUNNER_STORAGE_VERSION,
        updatedAt: new Date().toISOString(),
        workflows,
      });
    }

    // Rehydrate workflows with separated carried data
    return workflows.map((wf) => hydrateWorkflowWithCarriedData(wf));
  } catch (err) {
    console.error('Failed to read local workflows from LocalStorage:', err);
    return [];
  }
}

/**
 * Get a single local workflow by ID (rehydrated with carried data)
 */
export function getLocalWorkflowById(id: string): WorkflowData | null {
  const workflows = getLocalWorkflows();
  return workflows.find((w) => w._id === id) || null;
}

/**
 * Save or update a local workflow (decouples values to LOCAL_API_DATA_KEY and stores sanitized blueprint)
 */
export function saveLocalWorkflow(data: Partial<WorkflowData> & { name: string }): WorkflowData {
  const container = getLocalContainer();
  const existingIndex = container.workflows.findIndex((w) => w._id === data._id);

  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    const updated: WorkflowData = {
      ...container.workflows[existingIndex],
      ...data,
      updatedAt: now,
      isLocalOnly: true,
    };
    // 1. Sync full carried data with actual values into LOCAL_API_DATA_KEY
    syncCarriedDataForWorkflow(updated);
    // 2. Persist sanitized API blueprint into wakeup_local_workflows_v1
    container.workflows[existingIndex] = sanitizeWorkflowConfiguration(updated);
    saveLocalContainer(container);
    return updated;
  } else {
    const created: WorkflowData = {
      _id: data._id || `local-flow-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: 'guest-local-user',
      name: data.name,
      description: data.description || '',
      steps: data.steps || [],
      createdAt: now,
      updatedAt: now,
      isLocalOnly: true,
    };
    // 1. Sync full carried data with actual values into LOCAL_API_DATA_KEY
    syncCarriedDataForWorkflow(created);
    // 2. Persist sanitized API blueprint into wakeup_local_workflows_v1
    container.workflows.unshift(sanitizeWorkflowConfiguration(created));
    saveLocalContainer(container);
    return created;
  }
}

/**
 * Replace entire local workflows list with synced database workflows
 */
export function setLocalWorkflowsContainer(workflows: WorkflowData[]): void {
  if (typeof window === 'undefined') return;
  for (const wf of workflows) {
    syncCarriedDataForWorkflow(wf);
  }
  const sanitizedWorkflows = workflows.map((wf) => sanitizeWorkflowConfiguration(wf));
  saveLocalContainer({
    version: FLOW_RUNNER_STORAGE_VERSION,
    updatedAt: new Date().toISOString(),
    workflows: sanitizedWorkflows,
  });
}

/**
 * Delete a local workflow
 */
export function deleteLocalWorkflow(id: string): void {
  const container = getLocalContainer();
  container.workflows = container.workflows.filter((w) => w._id !== id);
  saveLocalContainer(container);
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`${LOCAL_RUNS_PREFIX}${id}`);
    try {
      const store = getSeparatedApiDataStore();
      let changed = false;
      for (const k of Object.keys(store)) {
        if (store[k].workflowId === id || k.startsWith(`${id}::`)) {
          delete store[k];
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem(LOCAL_API_DATA_KEY, JSON.stringify(store));
      }
    } catch {}
  }
}

/**
 * Save run summary for a local workflow
 */
export function saveLocalRunReport(workflowId: string, runData: any): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `${LOCAL_RUNS_PREFIX}${workflowId}`;
    const raw = localStorage.getItem(key);
    const runs: any[] = raw ? JSON.parse(raw) : [];
    runs.unshift({
      _id: `run-${Date.now()}`,
      workflowId,
      ...runData,
      createdAt: new Date().toISOString(),
    });
    // Keep max 20 recent runs locally
    localStorage.setItem(key, JSON.stringify(runs.slice(0, 20)));

    // Update lastRunAt and lastRunStatus on workflow
    const container = getLocalContainer();
    const wf = container.workflows.find((w) => w._id === workflowId);
    if (wf) {
      wf.lastRunAt = new Date().toISOString();
      wf.lastRunStatus = runData.summary?.overallStatus === 'success' ? 'success' : 'failed';
      saveLocalContainer(container);
    }
  } catch (err) {
    console.error('Failed to save local run report:', err);
  }
}

/**
 * Get run history for a local workflow
 */
export function getLocalRunHistory(workflowId: string): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${LOCAL_RUNS_PREFIX}${workflowId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const CLOUD_SYNC_PREF_KEY = 'wakeup_cloud_sync_enabled';

/**
 * Check if cloud synchronization is enabled in user settings (default: false)
 */
export function isCloudSyncEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(CLOUD_SYNC_PREF_KEY) === 'true';
}

/**
 * Enable or disable cloud synchronization in user settings
 */
export function setCloudSyncEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CLOUD_SYNC_PREF_KEY, enabled ? 'true' : 'false');
}

/**
 * Get only local workflows created offline/unauthenticated that are not yet synced to MongoDB
 */
export function getUnsyncedLocalWorkflows(): WorkflowData[] {
  const workflows = getLocalWorkflows();
  return workflows.filter((w) => w.isLocalOnly === true || w._id.startsWith('local-flow-'));
}

/**
 * Sync local guest workflows to cloud MongoDB one-by-one sequentially when enabled by user
 */
export async function syncLocalWorkflowsToCloud(
  onStatusChange?: (syncing: boolean, count: number) => void,
  bypassPrefCheck: boolean = false
): Promise<number> {
  if (typeof window === 'undefined') return 0;
  if (!bypassPrefCheck && !isCloudSyncEnabled()) return 0;
  const token = localStorage.getItem('wakeup_auth_token');
  if (!token) return 0;

  const unsyncedWorkflows = getUnsyncedLocalWorkflows();
  if (unsyncedWorkflows.length === 0) return 0;

  let syncedCount = 0;
  if (onStatusChange) onStatusChange(true, unsyncedWorkflows.length);

  try {
    for (const flow of unsyncedWorkflows) {
      try {
        await createWorkflow({
          name: flow.name,
          description: flow.description,
          steps: flow.steps,
        });
        syncedCount++;
      } catch (err) {
        console.error(`Failed to sync workflow "${flow.name}" to cloud:`, err);
      }
    }

    // Refetch fresh database workflows to overwrite local storage container cleanly
    try {
      const dbRes = await fetchWorkflows();
      if (dbRes.workflows) {
        setLocalWorkflowsContainer(dbRes.workflows);
      }
    } catch {
      const remaining = getLocalWorkflows().filter((w) => !w.isLocalOnly && !w._id.startsWith('local-flow-'));
      setLocalWorkflowsContainer(remaining);
    }
  } finally {
    if (onStatusChange) onStatusChange(false, syncedCount);
  }

  return syncedCount;
}

function getLocalContainer(): LocalStorageWorkflowContainer {
  if (typeof window === 'undefined') {
    return { version: FLOW_RUNNER_STORAGE_VERSION, updatedAt: new Date().toISOString(), workflows: [] };
  }
  try {
    const raw = localStorage.getItem(LOCAL_WORKFLOWS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return migrateLocalStorageWorkflows(parsed);
    }
  } catch {}
  return { version: FLOW_RUNNER_STORAGE_VERSION, updatedAt: new Date().toISOString(), workflows: [] };
}

function saveLocalContainer(container: LocalStorageWorkflowContainer): void {
  if (typeof window === 'undefined') return;
  try {
    container.updatedAt = new Date().toISOString();
    container.version = FLOW_RUNNER_STORAGE_VERSION;
    // Always guarantee that only sanitized configurations (keys retained, values stripped) are stored in LOCAL_WORKFLOWS_KEY
    const sanitizedWorkflows = (container.workflows || []).map((wf) => sanitizeWorkflowConfiguration(wf));
    const toSave: LocalStorageWorkflowContainer = {
      ...container,
      workflows: sanitizedWorkflows,
    };
    localStorage.setItem(LOCAL_WORKFLOWS_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.error('Failed to write local workflows to LocalStorage:', err);
  }
}

function getSampleGuestWorkflowsContainer(): LocalStorageWorkflowContainer {
  const initialSteps: IWorkflowStepData[] = [
    {
      stepId: `step-sample-1`,
      name: '1. User Signup',
      url: 'https://httpbin.org/post',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      queryParams: {},
      bodyPayload: JSON.stringify({ email: 'guest_user@example.com', password: 'securepassword123' }, null, 2),
      expectedStatusCode: 200,
      captureCookies: true,
      carryCookies: true,
      extractVariables: [{ varName: 'userEmail', jsonPath: 'json.email' }],
    },
    {
      stepId: `step-sample-2`,
      name: '2. User Login',
      url: 'https://httpbin.org/post',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      queryParams: {},
      bodyPayload: JSON.stringify({ email: '{{userEmail}}', password: 'securepassword123' }, null, 2),
      expectedStatusCode: 200,
      captureCookies: true,
      carryCookies: true,
      extractVariables: [{ varName: 'authToken', jsonPath: 'json.email' }],
    },
    {
      stepId: `step-sample-3`,
      name: '3. Fetch User Profile',
      url: 'https://httpbin.org/get',
      method: 'GET',
      headers: { Authorization: 'Bearer {{authToken}}' },
      queryParams: {},
      bodyPayload: '',
      expectedStatusCode: 200,
      captureCookies: true,
      carryCookies: true,
      extractVariables: [],
    },
  ];

  const sampleWorkflow: WorkflowData = {
    _id: `local-flow-sample-1`,
    userId: 'guest-local-user',
    name: 'Sample E2E Auth & API Journey',
    description: 'Local-first sample API workflow. Runs directly in browser with WakeUp API Engine.',
    steps: initialSteps,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isLocalOnly: true,
  };

  return {
    version: FLOW_RUNNER_STORAGE_VERSION,
    updatedAt: new Date().toISOString(),
    workflows: [sampleWorkflow],
  };
}

/**
 * Export all local workflows as JSON string (Sanitized API configurations - keys retained, zero sensitive values)
 */
export function exportLocalWorkflowsJSON(): string {
  const container = getLocalContainer();
  const sanitizedContainer = {
    version: FLOW_RUNNER_STORAGE_VERSION,
    type: 'putman_api_configurations',
    description: 'Decoupled API configurations blueprint (keys only, zero sensitive values)',
    updatedAt: new Date().toISOString(),
    workflows: (container.workflows || []).map((wf) => sanitizeWorkflowConfiguration(wf)),
  };
  return JSON.stringify(sanitizedContainer, null, 2);
}

/**
 * Import workflows from JSON string (decouples any values to LOCAL_API_DATA_KEY and stores sanitized blueprints)
 */
export function importLocalWorkflowsJSON(jsonStr: string): number {
  try {
    const parsed = JSON.parse(jsonStr);
    const container = migrateLocalStorageWorkflows(parsed);
    if (container.workflows.length > 0) {
      const existing = getLocalContainer();
      const existingIds = new Set(existing.workflows.map((w) => w._id));
      let count = 0;
      for (const flow of container.workflows) {
        // 1. Sync any carried values that might have accompanied the imported workflow
        syncCarriedDataForWorkflow(flow);

        // 2. Sanitize blueprint configuration
        const sanitizedFlow = sanitizeWorkflowConfiguration(flow);
        if (!existingIds.has(sanitizedFlow._id)) {
          existing.workflows.push(sanitizedFlow);
          existingIds.add(sanitizedFlow._id);
          count++;
        } else {
          sanitizedFlow._id = `local-flow-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          sanitizedFlow.name = `${sanitizedFlow.name} (Imported)`;
          // Also sync under new ID
          syncCarriedDataForWorkflow(sanitizedFlow);
          existing.workflows.push(sanitizedFlow);
          count++;
        }
      }
      saveLocalContainer(existing);
      return count;
    }
    return 0;
  } catch (err: any) {
    throw new Error('Invalid JSON format for workflows import.');
  }
}

/**
 * Clear all local workflows and run telemetry logs from LocalStorage
 */
export function clearAllLocalWorkflows(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOCAL_WORKFLOWS_KEY);
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && (key.startsWith(LOCAL_RUNS_PREFIX) || key.startsWith('wakeup_local_') || key.startsWith('putman_local_'))) {
      localStorage.removeItem(key);
    }
  }
}

/**
 * Completely wipe all browser LocalStorage keys
 */
export function clearEntireLocalStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.clear();
}

const LOCAL_USERNAME_KEY = 'putman_username';

export function getLocalUsername(): string {
  if (typeof window === 'undefined') return 'Local Developer';
  return localStorage.getItem(LOCAL_USERNAME_KEY) || 'Local Developer';
}

export function setLocalUsername(name: string): void {
  if (typeof window === 'undefined') return;
  const cleanName = name.trim() || 'Local Developer';
  localStorage.setItem(LOCAL_USERNAME_KEY, cleanName);
  const userObj = {
    id: 'guest-local-user',
    email: `${cleanName.toLowerCase().replace(/\s+/g, '_')}@putman.local`,
    name: cleanName,
    provider: 'credentials' as const,
  };
  localStorage.setItem('putman_user', JSON.stringify(userObj));
  localStorage.setItem('wakeup_user', JSON.stringify(userObj));
}

export function getStorageUsageStats(): {
  workflowsCount: number;
  stepsCount: number;
  dataItemsCount: number;
  runsCount: number;
  variablesCount: number;
  cookiesCount: number;
  bytesUsed: number;
} {
  const workflows = getLocalWorkflows();
  const stepsCount = workflows.reduce((acc, wf) => acc + (wf.steps?.length || 0), 0);
  const dataStore = getSeparatedApiDataStore();

  let dataItemsCount = 0;
  for (const entry of Object.values(dataStore)) {
    dataItemsCount += Object.keys(entry.headers || {}).length;
    dataItemsCount += Object.keys(entry.queryParams || {}).length;
    if (entry.bodyPayload && entry.bodyPayload.trim() !== '') dataItemsCount += 1;
  }

  const varStore = getRuntimeVariablesStore();
  const variablesCount = Object.keys(varStore.variables || {}).length;
  const cookiesCount = Object.keys(varStore.cookies || {}).length;

  let runsCount = 0;
  let bytesUsed = 0;

  if (typeof window !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key) || '';
        bytesUsed += (key.length + val.length) * 2;
        if (key.startsWith(LOCAL_RUNS_PREFIX)) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) runsCount += parsed.length;
          } catch {}
        }
      }
    }
  }

  return {
    workflowsCount: workflows.length,
    stepsCount,
    dataItemsCount,
    runsCount,
    variablesCount,
    cookiesCount,
    bytesUsed,
  };
}

/**
 * Synchronize carried API data (headers, queryParams, bodyPayload) from workflow steps into separated store
 */
export function syncCarriedDataForWorkflow(wf: WorkflowData): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(LOCAL_API_DATA_KEY);
    const store: Record<string, ApiCarriedDataEntry> = raw ? JSON.parse(raw) : {};
    const now = new Date().toISOString();
    let changed = false;

    for (const step of wf.steps || []) {
      const stepId = step.stepId || `step-${Date.now()}`;
      const stepName = step.name || 'API Step';
      const dataKey = `${wf._id}::${stepId}`;

      const { extractedParamValues } = sanitizeUrlAndQueryParams(step.url || '', step.queryParams);
      const existingEntry = store[dataKey] || (stepId ? store[stepId] : undefined);
      const existingHeaders = existingEntry?.headers || {};
      const existingQuery = existingEntry?.queryParams || {};

      const mergedHeaders: Record<string, string> = { ...existingHeaders };
      if (step.headers && typeof step.headers === 'object') {
        for (const [k, v] of Object.entries(step.headers)) {
          if (v !== '' && v !== undefined && v !== null) {
            mergedHeaders[k] = String(v);
          } else if (!(k in mergedHeaders)) {
            mergedHeaders[k] = '';
          }
        }
      }

      const mergedQueryParams: Record<string, string> = { ...existingQuery, ...extractedParamValues };
      if (step.queryParams && typeof step.queryParams === 'object') {
        for (const [k, v] of Object.entries(step.queryParams)) {
          if (v !== '' && v !== undefined && v !== null) {
            mergedQueryParams[k] = String(v);
          } else if (!(k in mergedQueryParams)) {
            mergedQueryParams[k] = '';
          }
        }
      }

      const bodyPayload =
        step.bodyPayload && step.bodyPayload.trim() !== ''
          ? step.bodyPayload
          : existingEntry?.bodyPayload || '';

      store[dataKey] = {
        workflowId: wf._id,
        workflowName: wf.name,
        stepId,
        stepName,
        method: step.method || 'GET',
        url: step.url || '',
        headers: mergedHeaders,
        queryParams: mergedQueryParams,
        bodyPayload,
        updatedAt: now,
      };
      changed = true;
    }

    if (changed) {
      localStorage.setItem(LOCAL_API_DATA_KEY, JSON.stringify(store));
    }
  } catch (err) {
    console.error('Failed to sync carried API data:', err);
  }
}

/**
 * Update a single carried value (header value, query param value, or body payload)
 */
export function updateSeparatedApiDataValue(
  workflowId: string,
  stepId: string,
  category: 'headers' | 'queryParams' | 'bodyPayload',
  key: string,
  newValue: string
): void {
  if (typeof window === 'undefined') return;
  try {
    const store = getSeparatedApiDataStore();
    const dataKey = `${workflowId}::${stepId}`;
    let entry = store[dataKey] || (stepId ? store[stepId] : undefined);
    if (!entry) {
      entry = {
        workflowId,
        workflowName: 'Workflow',
        stepId,
        stepName: 'API Step',
        method: 'GET',
        url: '',
        headers: {},
        queryParams: {},
        bodyPayload: '',
        updatedAt: new Date().toISOString(),
      };
    }

    if (category === 'headers') {
      entry.headers = entry.headers || {};
      entry.headers[key] = newValue;
    } else if (category === 'queryParams') {
      entry.queryParams = entry.queryParams || {};
      entry.queryParams[key] = newValue;
    } else if (category === 'bodyPayload') {
      entry.bodyPayload = newValue;
    }
    entry.updatedAt = new Date().toISOString();
    store[dataKey] = entry;
    localStorage.setItem(LOCAL_API_DATA_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Failed to update API data value:', err);
  }
}

/**
 * Get all decoupled API carried data entries from LocalStorage
 */
export function getSeparatedApiDataStore(): Record<string, ApiCarriedDataEntry> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_API_DATA_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    // Read raw container directly without recursion
    const rawWorkflows = localStorage.getItem(LOCAL_WORKFLOWS_KEY);
    if (!rawWorkflows) return {};
    const parsed = JSON.parse(rawWorkflows);
    const workflows: WorkflowData[] = Array.isArray(parsed?.workflows)
      ? parsed.workflows
      : Array.isArray(parsed)
      ? parsed
      : [];

    const initialStore: Record<string, ApiCarriedDataEntry> = {};
    const now = new Date().toISOString();
    for (const wf of workflows) {
      for (const step of wf.steps || []) {
        const stepId = step.stepId || `step-${Date.now()}`;
        const stepName = step.name || 'API Step';
        const dataKey = `${wf._id}::${stepId}`;
        initialStore[dataKey] = {
          workflowId: wf._id,
          workflowName: wf.name,
          stepId,
          stepName,
          method: step.method || 'GET',
          url: step.url || '',
          headers: step.headers || {},
          queryParams: step.queryParams || {},
          bodyPayload: step.bodyPayload || '',
          updatedAt: now,
        };
      }
    }
    localStorage.setItem(LOCAL_API_DATA_KEY, JSON.stringify(initialStore));
    return initialStore;
  } catch (err) {
    console.error('Failed to read separated API data store:', err);
    return {};
  }
}

/**
 * Delete a specific key or payload from an API's carried data.
 * If deleteOnlyValue is true, clears the value in carried data while preserving the key in the workflow configuration.
 * If deleteOnlyValue is false, removes the key from both carried data and workflow configuration.
 */
export function deleteSeparatedApiDataKey(
  workflowId: string,
  stepId: string,
  category: 'headers' | 'queryParams' | 'bodyPayload',
  key?: string,
  deleteOnlyValue: boolean = false
): void {
  if (typeof window === 'undefined') return;
  try {
    // 1. Update separated data store
    const store = getSeparatedApiDataStore();
    const dataKey = `${workflowId}::${stepId}`;
    const entry = store[dataKey] || (stepId ? store[stepId] : undefined);
    if (entry) {
      if (category === 'headers' && key) {
        if (deleteOnlyValue) {
          entry.headers[key] = '';
        } else {
          delete entry.headers[key];
        }
      } else if (category === 'queryParams' && key) {
        if (deleteOnlyValue) {
          entry.queryParams[key] = '';
        } else {
          delete entry.queryParams[key];
        }
      } else if (category === 'bodyPayload') {
        entry.bodyPayload = '';
      }
      entry.updatedAt = new Date().toISOString();
      store[dataKey] = entry;
      localStorage.setItem(LOCAL_API_DATA_KEY, JSON.stringify(store));
    }

    // 2. Synchronize back into workflow configuration in wakeup_local_workflows_v1
    const container = getLocalContainer();
    const wf = container.workflows.find((w) => w._id === workflowId);
    if (wf) {
      const step = wf.steps?.find((s) => s.stepId === stepId);
      if (step) {
        if (!deleteOnlyValue) {
          if (category === 'headers' && key && step.headers) {
            delete step.headers[key];
          } else if (category === 'queryParams' && key && step.queryParams) {
            delete step.queryParams[key];
          }
        }
        if (category === 'bodyPayload') {
          step.bodyPayload = '';
        }
        wf.updatedAt = new Date().toISOString();
        saveLocalContainer(container);
      }
    }
  } catch (err) {
    console.error('Failed to delete API data key:', err);
  }
}

/**
 * Delete/clear only the exact value of a key while preserving the key in the API configuration
 */
export function deleteSeparatedApiValue(
  workflowId: string,
  stepId: string,
  category: 'headers' | 'queryParams' | 'bodyPayload',
  key?: string
): void {
  deleteSeparatedApiDataKey(workflowId, stepId, category, key, true);
}

/**
 * Delete an individual step from a workflow
 */
export function deleteWorkflowStep(workflowId: string, stepId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const container = getLocalContainer();
    const wf = container.workflows.find((w) => w._id === workflowId);
    if (wf && wf.steps) {
      wf.steps = wf.steps.filter((s) => s.stepId !== stepId);
      wf.updatedAt = new Date().toISOString();
      saveLocalContainer(container);
    }

    // Also remove from separated data store
    const store = getSeparatedApiDataStore();
    const dataKey = `${workflowId}::${stepId}`;
    if (store[dataKey]) {
      delete store[dataKey];
      localStorage.setItem(LOCAL_API_DATA_KEY, JSON.stringify(store));
    }
  } catch (err) {
    console.error('Failed to delete workflow step:', err);
  }
}

/**
 * Delete a specific run execution log
 */
export function deleteRunLog(workflowId: string, runId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `${LOCAL_RUNS_PREFIX}${workflowId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const runs: any[] = JSON.parse(raw);
      const filtered = runs.filter((r) => r._id !== runId);
      localStorage.setItem(key, JSON.stringify(filtered));
    }
  } catch (err) {
    console.error('Failed to delete run log:', err);
  }
}

/**
 * Clear all run logs for a specific workflow
 */
export function clearWorkflowRunHistory(workflowId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${LOCAL_RUNS_PREFIX}${workflowId}`);
}

/**
 * Get runtime variables store
 */
export function getRuntimeVariablesStore(): LocalRuntimeVariablesStore {
  if (typeof window === 'undefined') {
    return { variables: {}, cookies: {}, updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(LOCAL_VARIABLES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    return { variables: {}, cookies: {}, updatedAt: new Date().toISOString() };
  } catch {
    return { variables: {}, cookies: {}, updatedAt: new Date().toISOString() };
  }
}

/**
 * Delete a runtime variable
 */
export function deleteRuntimeVariable(varName: string): void {
  if (typeof window === 'undefined') return;
  try {
    const store = getRuntimeVariablesStore();
    delete store.variables[varName];
    store.updatedAt = new Date().toISOString();
    localStorage.setItem(LOCAL_VARIABLES_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Failed to delete runtime variable:', err);
  }
}

/**
 * Delete a runtime cookie
 */
export function deleteRuntimeCookie(cookieName: string): void {
  if (typeof window === 'undefined') return;
  try {
    const store = getRuntimeVariablesStore();
    delete store.cookies[cookieName];
    store.updatedAt = new Date().toISOString();
    localStorage.setItem(LOCAL_VARIABLES_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Failed to delete runtime cookie:', err);
  }
}

/**
 * Clear all runtime variables and cookies
 */
export function clearRuntimeData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOCAL_VARIABLES_KEY);
}

/**
 * Get all raw LocalStorage items with sizes and previews
 */
export function getAllRawLocalStorageItems(): {
  key: string;
  sizeBytes: number;
  valuePreview: string;
  category: 'workflow' | 'api-data' | 'runs' | 'variable' | 'setting' | 'other';
}[] {
  if (typeof window === 'undefined') return [];
  const items: {
    key: string;
    sizeBytes: number;
    valuePreview: string;
    category: 'workflow' | 'api-data' | 'runs' | 'variable' | 'setting' | 'other';
  }[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const val = localStorage.getItem(key) || '';
    const sizeBytes = (key.length + val.length) * 2;

    let category: 'workflow' | 'api-data' | 'runs' | 'variable' | 'setting' | 'other' = 'other';
    if (key === LOCAL_WORKFLOWS_KEY) category = 'workflow';
    else if (key === LOCAL_API_DATA_KEY) category = 'api-data';
    else if (key.startsWith(LOCAL_RUNS_PREFIX)) category = 'runs';
    else if (key === LOCAL_VARIABLES_KEY) category = 'variable';
    else if (key.startsWith('putman_') || key.startsWith('wakeup_auth')) category = 'setting';

    let preview = val;
    if (preview.length > 80) {
      preview = preview.slice(0, 80) + '...';
    }

    items.push({ key, sizeBytes, valuePreview: preview, category });
  }

  return items.sort((a, b) => b.sizeBytes - a.sizeBytes);
}

/**
 * Delete any individual raw key from LocalStorage
 */
export function deleteRawLocalStorageKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

/**
 * Export all separated API carried data and runtime session variables/cookies as JSON string
 */
export function exportApiDataJSON(): string {
  const apiData = getSeparatedApiDataStore();
  const runtimeData = getRuntimeVariablesStore();
  return JSON.stringify(
    {
      version: FLOW_RUNNER_STORAGE_VERSION,
      type: 'putman_key_values_data',
      exportedAt: new Date().toISOString(),
      apiData,
      runtimeData,
    },
    null,
    2
  );
}

/**
 * Import separated API carried data and runtime variables/cookies from JSON string
 */
export function importApiDataJSON(jsonStr: string): {
  importedApiEntries: number;
  importedVariables: number;
  importedCookies: number;
} {
  try {
    const parsed = JSON.parse(jsonStr);
    let apiCount = 0;
    let varCount = 0;
    let cookieCount = 0;

    const dataStoreToImport =
      parsed.apiData ||
      (parsed.type === 'putman_key_values_data' ? parsed.apiData : null) ||
      (parsed.headers || parsed.queryParams || parsed.bodyPayload ? { custom: parsed } : null);

    if (dataStoreToImport && typeof dataStoreToImport === 'object') {
      const existing = getSeparatedApiDataStore();
      const merged = { ...existing, ...dataStoreToImport };
      localStorage.setItem(LOCAL_API_DATA_KEY, JSON.stringify(merged));
      apiCount = Object.keys(dataStoreToImport).length;
    }

    if (parsed.runtimeData && typeof parsed.runtimeData === 'object') {
      const existing = getRuntimeVariablesStore();
      const mergedVars = { ...existing.variables, ...(parsed.runtimeData.variables || {}) };
      const mergedCookies = { ...existing.cookies, ...(parsed.runtimeData.cookies || {}) };
      const updatedRuntime: LocalRuntimeVariablesStore = {
        variables: mergedVars,
        cookies: mergedCookies,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(LOCAL_VARIABLES_KEY, JSON.stringify(updatedRuntime));
      varCount = Object.keys(parsed.runtimeData.variables || {}).length;
      cookieCount = Object.keys(parsed.runtimeData.cookies || {}).length;
    }

    return { importedApiEntries: apiCount, importedVariables: varCount, importedCookies: cookieCount };
  } catch (err: any) {
    throw new Error('Invalid JSON format for key-values data import.');
  }
}

/**
 * Export full storage bundle (workflows, decoupled carried data, variables, cookies)
 */
export function exportFullStorageBundleJSON(): string {
  const workflows = getLocalWorkflows();
  const apiData = getSeparatedApiDataStore();
  const runtimeData = getRuntimeVariablesStore();
  return JSON.stringify(
    {
      version: FLOW_RUNNER_STORAGE_VERSION,
      type: 'putman_full_storage_bundle',
      exportedAt: new Date().toISOString(),
      workflows,
      apiData,
      runtimeData,
    },
    null,
    2
  );
}

/**
 * Import full storage bundle for seamless syncing between devices/browsers
 */
export function importFullStorageBundleJSON(jsonStr: string): {
  workflowsCount: number;
  dataCount: number;
} {
  try {
    const parsed = JSON.parse(jsonStr);
    let wfCount = 0;
    let dataCount = 0;

    if (Array.isArray(parsed.workflows) || parsed.workflows) {
      wfCount = importLocalWorkflowsJSON(
        JSON.stringify(Array.isArray(parsed.workflows) ? { workflows: parsed.workflows } : parsed)
      );
    }

    if (parsed.apiData || parsed.runtimeData) {
      const res = importApiDataJSON(
        JSON.stringify({ apiData: parsed.apiData, runtimeData: parsed.runtimeData })
      );
      dataCount = res.importedApiEntries + res.importedVariables + res.importedCookies;
    }

    return { workflowsCount: wfCount, dataCount };
  } catch (err: any) {
    throw new Error('Invalid JSON format for full storage bundle.');
  }
}
