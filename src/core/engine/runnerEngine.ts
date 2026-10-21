import {
  IWorkflowStepData,
  IStepLogTelemetry,
  IWorkflowRunSummary,
} from './types';

/**
 * Extracts value from nested JSON object by dot-path or JSONPath (e.g. data.token, json.email, $.user.id)
 */
export function getValueByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  const cleanPath = path.replace(/^(\$\.|data\.)/, '');
  const keys = cleanPath.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  return current;
}

/**
 * Replaces dynamic variables formatted as {{varName}} inside a string template
 */
export function interpolateVariables(template: string = '', variablesContext: Record<string, string> = {}): string {
  if (!template) return template;
  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (match, varName) => {
    return variablesContext[varName] !== undefined ? variablesContext[varName] : match;
  });
}

/**
 * Parses set-cookie response headers into a cookie dictionary
 */
export function parseSetCookieHeaders(responseHeaders: Headers): Record<string, string> {
  const cookieDict: Record<string, string> = {};
  try {
    const rawList: string[] =
      typeof (responseHeaders as any).getSetCookie === 'function'
        ? (responseHeaders as any).getSetCookie()
        : responseHeaders.get('set-cookie')
        ? [responseHeaders.get('set-cookie')!]
        : [];

    for (const item of rawList) {
      const parts = item.split(',');
      for (const part of parts) {
        const pair = part.split(';')[0].trim();
        const [k, ...vParts] = pair.split('=');
        if (k && vParts.length > 0) {
          cookieDict[k.trim()] = vParts.join('=').trim();
        }
      }
    }
  } catch {}
  return cookieDict;
}

/**
 * Updates a cookie jar with new cookies from response headers
 */
export function updateCookieJar(
  responseHeaders: Headers,
  existingJar: Record<string, string> = {}
): Record<string, string> {
  const updatedJar = { ...existingJar, ...parseSetCookieHeaders(responseHeaders) };
  return updatedJar;
}

/**
 * Core Step Execution Engine
 * Executes an HTTP API step natively with variable interpolation & assertions
 */
export async function executeSingleStep(
  step: IWorkflowStepData,
  variablesContext: Record<string, string> = {},
  cookiesContext: Record<string, string> = {}
): Promise<IStepLogTelemetry> {
  const stepStartTime = Date.now();

  // 1. Interpolate dynamic variables in URL
  let finalUrl = interpolateVariables(step.url || '', variablesContext);

  // 2. Append query parameters
  if (step.queryParams && Object.keys(step.queryParams).length > 0) {
    try {
      const urlObj = new URL(finalUrl);
      Object.entries(step.queryParams).forEach(([k, v]) => {
        if (!k.trim()) return;
        const resolvedK = interpolateVariables(k, variablesContext);
        const resolvedV = interpolateVariables(v, variablesContext);
        urlObj.searchParams.append(resolvedK, resolvedV);
      });
      finalUrl = urlObj.toString();
    } catch {
      const qs = Object.entries(step.queryParams)
        .filter(([k]) => k.trim())
        .map(([k, v]) => `${encodeURIComponent(interpolateVariables(k, variablesContext))}=${encodeURIComponent(interpolateVariables(v, variablesContext))}`)
        .join('&');
      if (qs) {
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + qs;
      }
    }
  }

  // 3. Interpolate request headers
  const rawHeaders = step.headers || {};
  const finalHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawHeaders)) {
    if (!k.trim()) continue;
    finalHeaders[interpolateVariables(k, variablesContext)] = interpolateVariables(v, variablesContext);
  }

  // 4. Carry forward cookies across steps
  if (step.carryCookies !== false && Object.keys(cookiesContext).length > 0) {
    const cookieStr = Object.entries(cookiesContext)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
    if (finalHeaders['Cookie']) {
      finalHeaders['Cookie'] += `; ${cookieStr}`;
    } else {
      finalHeaders['Cookie'] = cookieStr;
    }
  }

  // 5. Interpolate request body payload
  let finalBody: string | undefined = undefined;
  if (step.bodyPayload && step.method !== 'GET' && step.method !== 'HEAD') {
    finalBody = interpolateVariables(step.bodyPayload, variablesContext);
  }

  const stepTelemetry: IStepLogTelemetry = {
    stepIndex: 1,
    stepId: step.stepId || 'step-1',
    stepName: step.name || 'API Step',
    method: step.method || 'GET',
    url: finalUrl,
    requestHeaders: finalHeaders,
    requestBody: finalBody,
    statusCode: 0,
    latencyMs: 0,
    status: 'success',
    timestamp: new Date().toISOString(),
  };

  try {
    const fetchOptions: RequestInit = {
      method: step.method || 'GET',
      headers: Object.keys(finalHeaders).length > 0 ? finalHeaders : undefined,
      body: finalBody,
    };

    const response = await fetch(finalUrl, fetchOptions);
    const latencyMs = Date.now() - stepStartTime;

    stepTelemetry.latencyMs = latencyMs;
    stepTelemetry.statusCode = response.status;

    // Convert response headers
    const respHeadersObj: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      respHeadersObj[key] = val;
    });
    stepTelemetry.responseHeaders = respHeadersObj;

    // Parse response body
    let responseText = '';
    try {
      responseText = await response.text();
      if (responseText.length > 20000) {
        stepTelemetry.responseSnippet = responseText.substring(0, 20000) + '\n... (truncated for telemetry display)';
      } else {
        stepTelemetry.responseSnippet = responseText;
      }

      try {
        stepTelemetry.responseBody = JSON.parse(responseText);
      } catch {
        stepTelemetry.responseBody = responseText;
      }
    } catch {
      stepTelemetry.responseSnippet = '[Binary / Non-text Response Payload]';
    }

    // Evaluate assertions (Expected Status Code)
    const expected = step.expectedStatusCode || 200;
    const isSuccess =
      response.status === expected ||
      (expected === 200 && response.status === 201) ||
      (expected === 201 && response.status === 200) ||
      (response.status >= 200 && response.status < 300 && (!step.expectedStatusCode || step.expectedStatusCode === 200 || step.expectedStatusCode === 201));

    if (!isSuccess) {
      stepTelemetry.status = 'failed';
      stepTelemetry.errorMessage = `Status code mismatch: Expected ${expected}, received ${response.status}`;
    } else {
      stepTelemetry.status = 'success';
    }

    // Capture response cookies
    if (step.captureCookies !== false) {
      const capturedCookies = parseSetCookieHeaders(response.headers);
      if (Object.keys(capturedCookies).length > 0) {
        stepTelemetry.capturedCookies = capturedCookies;
      }
    }

    // Extract dynamic variables via JSONPath / dot notation
    if (step.extractVariables && Array.isArray(step.extractVariables) && responseText) {
      const extracted: Record<string, string> = {};
      try {
        const jsonParsed = typeof stepTelemetry.responseBody === 'object' ? stepTelemetry.responseBody : JSON.parse(responseText);
        for (const ext of step.extractVariables) {
          if (!ext.varName) continue;
          const val = getValueByPath(jsonParsed, ext.jsonPath);
          if (val !== undefined && val !== null) {
            extracted[ext.varName] = typeof val === 'object' ? JSON.stringify(val) : String(val);
          }
        }
      } catch {}

      if (Object.keys(extracted).length > 0) {
        stepTelemetry.extractedVars = extracted;
      }
    }

    return stepTelemetry;
  } catch (err: any) {
    const latencyMs = Date.now() - stepStartTime;
    stepTelemetry.latencyMs = latencyMs;
    stepTelemetry.status = 'error';
    stepTelemetry.statusCode = 0;
    stepTelemetry.errorMessage = err?.message || 'Failed to execute API request';
    return stepTelemetry;
  }
}

/**
 * Sequential Workflow Runner with context & cookie carryover
 */
export async function executeWorkflowFlow(
  steps: IWorkflowStepData[],
  workflowName: string = 'Workflow Journey',
  initialVariables: Record<string, string> = {},
  initialCookies: Record<string, string> = {},
  onStepProgress?: (stepTelemetry: IStepLogTelemetry) => void
): Promise<IWorkflowRunSummary> {
  const startTime = Date.now();
  const stepLogs: IStepLogTelemetry[] = [];
  let variablesContext: Record<string, string> = { ...initialVariables };
  let cookiesContext: Record<string, string> = { ...initialCookies };
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
        errorMessage: 'Step skipped by user preference',
        timestamp: new Date().toISOString(),
      };
      stepLogs.push(skippedTelemetry);
      if (onStepProgress) onStepProgress(skippedTelemetry);
      continue;
    }

    const stepResult = await executeSingleStep(step, variablesContext, cookiesContext);
    stepResult.stepIndex = idx + 1;

    // Merge extracted variables and captured cookies
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


export interface RunCompleteWorkflowOptions {
  skippedStepIndices?: number[];
  initialVariables?: Record<string, string>;
  initialCookies?: Record<string, string>;
  onStepStart?: (stepIndex: number) => void;
  onStepComplete?: (stepIndex: number, status: 'success' | 'failed' | 'skipped') => void;
}

/**
 * High-level workflow runner accepting WorkflowData and optional skip/progress callbacks
 */
export async function runCompleteWorkflow(
  workflow: { name?: string; steps?: any[]; baseUrl?: string },
  options: RunCompleteWorkflowOptions = {}
): Promise<IWorkflowRunSummary> {
  const steps = (workflow.steps || []).map((s, idx) => {
    const isSkipped = Boolean(s.skip || s.skipped || options.skippedStepIndices?.includes(idx));
    let targetUrl = s.url || '';
    if (targetUrl.startsWith('/') && workflow.baseUrl) {
      targetUrl = `${workflow.baseUrl.replace(/\/$/, '')}${targetUrl}`;
    }
    return {
      ...s,
      url: targetUrl,
      skipped: isSkipped,
    };
  });

  return await executeWorkflowFlow(
    steps,
    workflow.name || 'Workflow Journey',
    options.initialVariables || {},
    options.initialCookies || {},
    (telemetry) => {
      if (options.onStepComplete) {
        options.onStepComplete(telemetry.stepIndex - 1, telemetry.status as any);
      }
    }
  );
}
