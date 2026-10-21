export interface IWorkflowVariableExtract {
  varName: string;
  jsonPath: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface IWorkflowStepData {
  stepId?: string;
  stepIndex?: number;
  name?: string;
  stepName?: string;
  url: string;
  method: HttpMethod | string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  bodyPayload?: string;
  expectedStatusCode?: number;
  captureCookies?: boolean;
  carryCookies?: boolean;
  useCookies?: boolean;
  skipped?: boolean;
  skip?: boolean;
  extractVariables?: IWorkflowVariableExtract[];
}

export interface IStepLogTelemetry {
  stepIndex: number;
  stepId?: string;
  stepName: string;
  method: string;
  url: string;
  requestHeaders: Record<string, string>;
  requestBody?: string;
  statusCode: number;
  responseHeaders?: Record<string, string>;
  responseBody?: any;
  responseSnippet?: string;
  latencyMs: number;
  status: 'success' | 'failed' | 'error' | 'skipped';
  errorMessage?: string;
  capturedCookies?: Record<string, string>;
  extractedVars?: Record<string, string>;
  timestamp: string;
}

export interface IWorkflowRunSummary {
  runId?: string;
  workflowName: string;
  timestamp?: string;
  startedAt: string;
  finishedAt: string;
  totalTimeMs: number;
  totalSteps: number;
  successSteps: number;
  failedSteps: number;
  overallStatus: 'success' | 'failed' | 'error' | 'running';
  steps: IStepLogTelemetry[];
}

export interface WorkflowData {
  _id: string;
  id?: string;
  userId?: string;
  name: string;
  baseUrl?: string;
  description?: string;
  steps: IWorkflowStepData[];
  lastRunAt?: string;
  lastRunStatus?: 'success' | 'failed' | 'error' | 'pending' | 'none';
  isLocalOnly?: boolean;
  createdAt: string;
  updatedAt: string;
  // Optional GitHub & Notification integrations
  githubEnabled?: boolean;
  githubRepo?: string;
  githubBranch?: string;
  githubSecretToken?: string;
  githubInstallationId?: string;
  githubAppConnected?: boolean;
  notificationEmail?: string;
}

export interface UserData {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  provider: 'credentials' | 'google' | 'github';
}

export interface IScannedEndpoint {
  method: HttpMethod;
  path: string;
  sourceFile: string;
  line: number;
  framework?: string;
  suggestedBody?: string;
  expectedStatus?: number;
}
