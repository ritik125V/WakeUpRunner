import {
  IWorkflowStepData,
  IStepLogTelemetry,
  IWorkflowRunSummary,
} from './types';
import { executeSingleStep } from './runnerEngine';

export const CENTRALIZED_API_RUNNER_URL =
  process.env.NEXT_PUBLIC_API_RUNNER_URL ||
  'https://wakeup-api-runner.ritikvermav5.workers.dev/api';

const RUNNER_URL_KEY = 'putman_custom_api_runner_url';

export function getApiRunnerUrl(): string {
  if (typeof window === 'undefined') return CENTRALIZED_API_RUNNER_URL;
  try {
    const custom = localStorage.getItem(RUNNER_URL_KEY);
    if (custom && custom.trim()) return custom.trim();
  } catch {}
  return CENTRALIZED_API_RUNNER_URL;
}

export function setApiRunnerUrl(url: string): void {
  if (typeof window === 'undefined') return;
  if (!url || url.trim() === '' || url === CENTRALIZED_API_RUNNER_URL) {
    localStorage.removeItem(RUNNER_URL_KEY);
  } else {
    localStorage.setItem(RUNNER_URL_KEY, url.trim());
  }
}

/**
 * Checks whether a URL targets localhost, 127.0.0.1, or a private local area network IP
 */
export function isLocalOrInternalUrl(urlStr: string = ''): boolean {
  if (!urlStr) return false;
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.endsWith('.local') ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.startsWith('172.16.')
    );
  } catch {
    return urlStr.includes('localhost') || urlStr.includes('127.0.0.1');
  }
}

/**
 * Execute a single step
 * 1. Prioritizes local Next.js proxy route (/api/runner/execute-step) to bypass CORS and access localhost:*
 * 2. For local targets, NEVER routes to remote Cloudflare workers (which fail with error 1003)
 * 3. Falls back seamlessly to in-memory browser engine
 */
export async function executeStepClient(
  step: IWorkflowStepData,
  variablesContext: Record<string, string> = {},
  cookiesContext: Record<string, string> = {}
): Promise<IStepLogTelemetry> {
  const isLocalTarget = isLocalOrInternalUrl(step.url);

  // 1. First Priority: Local Next.js API Runner Proxy
  // Has direct access to local machine ports, zero CORS restrictions, and handles Set-Cookie headers
  try {
    const localRes = await fetch('/api/runner/execute-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step,
        variablesContext,
        cookiesContext,
      }),
    });

    if (localRes.ok) {
      const data = await localRes.json();
      if (data && data.result) {
        return data.result;
      }
    }
  } catch (err) {
    // Next.js API route not available or offline
  }

  // 2. If URL targets localhost/LAN: NEVER send to Cloudflare Worker (Worker will fail with error 1003)
  if (isLocalTarget) {
    return await executeSingleStep(step, variablesContext, cookiesContext);
  }

  // 3. For public external URLs: Try configured edge runner
  const runnerUrl = getApiRunnerUrl().replace(/\/$/, '');
  try {
    const res = await fetch(`${runnerUrl}/execute-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step,
        variablesContext,
        cookiesContext,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.result) {
        // If edge worker encountered a Cloudflare direct IP block, fallback to browser engine
        const respStr = String(data.result.responseBody || data.result.responseSnippet || '');
        if (respStr.includes('error code: 1003') || (data.result.statusCode === 403 && respStr.includes('1003'))) {
          return await executeSingleStep(step, variablesContext, cookiesContext);
        }
        return data.result;
      }
    }
  } catch (err) {
    console.warn(`Centralized runner via ${runnerUrl} failed, falling back to local runner engine:`, err);
  }

  // 4. In-memory browser runner engine fallback
  return await executeSingleStep(step, variablesContext, cookiesContext);
}

/**
 * Execute full workflow step-by-step with real-time UI streaming
 */
export async function executeFlowClient(
  steps: IWorkflowStepData[],
  workflowName: string = 'Workflow Run',
  onStepProgress?: (stepTelemetry: IStepLogTelemetry) => void
): Promise<IWorkflowRunSummary> {
  const startTime = Date.now();
  const stepLogs: IStepLogTelemetry[] = [];
  let variablesContext: Record<string, string> = {};
  let cookiesContext: Record<string, string> = {};
  let overallStatus: 'success' | 'failed' | 'error' = 'success';

  for (let idx = 0; idx < steps.length; idx++) {
    const step = steps[idx];

    if (step.skipped) {
      const skippedTelemetry: IStepLogTelemetry = {
        stepIndex: idx + 1,
        stepId: step.stepId,
        stepName: step.name || step.stepName || `Step ${idx + 1}`,
        method: step.method,
        url: step.url,
        requestHeaders: step.headers || {},
        statusCode: 0,
        responseBody: '',
        responseSnippet: '',
        latencyMs: 0,
        status: 'skipped',
        errorMessage: 'Step skipped by user',
        timestamp: new Date().toISOString(),
      };
      stepLogs.push(skippedTelemetry);
      if (onStepProgress) onStepProgress(skippedTelemetry);
      continue;
    }

    const stepResult = await executeStepClient(step, variablesContext, cookiesContext);
    stepResult.stepIndex = idx + 1;

    if (stepResult.extractedVars) {
      variablesContext = { ...variablesContext, ...stepResult.extractedVars };
    }
    if (stepResult.capturedCookies) {
      cookiesContext = { ...cookiesContext, ...stepResult.capturedCookies };
    }

    if (stepResult.status === 'failed' || stepResult.status === 'error') {
      overallStatus = 'failed';
    }

    stepLogs.push(stepResult);
    if (onStepProgress) onStepProgress(stepResult);
  }

  const finishedAt = new Date().toISOString();
  const totalTimeMs = Date.now() - startTime;

  return {
    workflowName,
    startedAt: new Date(startTime).toISOString(),
    finishedAt,
    totalTimeMs,
    totalSteps: steps.length,
    successSteps: stepLogs.filter((s) => s.status === 'success').length,
    failedSteps: stepLogs.filter((s) => s.status === 'failed' || s.status === 'error').length,
    overallStatus,
    steps: stepLogs,
  };
}
