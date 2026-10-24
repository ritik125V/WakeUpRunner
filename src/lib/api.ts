import {
  WorkflowData,
  IWorkflowStepData,
  IStepLogTelemetry,
  IWorkflowRunSummary,
  UserData,
  IScannedEndpoint,
  IWorkflowVariableExtract,
  HttpMethod,
} from '@/core/engine/types';
import {
  getLocalWorkflows,
  getLocalWorkflowById,
  saveLocalWorkflow,
  deleteLocalWorkflow,
  saveLocalRunReport,
  getLocalRunHistory,
} from '@/lib/workflowLocalStorage';
import { executeStepClient, executeFlowClient } from '@/core/engine/runnerClient';

// Re-export core engine types for backward compatibility across existing components
export type {
  WorkflowData,
  IWorkflowStepData,
  IStepLogTelemetry,
  IWorkflowRunSummary,
  UserData,
  IScannedEndpoint,
  IWorkflowVariableExtract,
  HttpMethod,
};

export interface IGithubRepoItem {
  id: number;
  name: string;
  full_name: string;
  owner: string;
  private?: boolean;
  default_branch?: string;
  description?: string;
  html_url?: string;
}

export interface IWebhookLogItem {
  id: string;
  _id?: string;
  githubEvent?: string;
  repo?: string;
  repoFullName?: string;
  branch?: string;
  receivedAt: string;
  deliveryStatus?: string;
  status?: string;
  commitMsg?: string;
  author?: string;
  clientIp?: string;
}

export interface IUserGithubStatus {
  githubAppConnected: boolean;
  githubUsername?: string;
  githubAvatar?: string;
  connectedReposCount: number;
}

/**
 * Workflows CRUD Gateway (Local-First Architecture)
 */
export const fetchWorkflows = async (): Promise<{ workflows: WorkflowData[] }> => {
  return { workflows: getLocalWorkflows() };
};

export const fetchWorkflowById = async (id: string): Promise<{ workflow: WorkflowData }> => {
  const local = getLocalWorkflowById(id);
  if (local) return { workflow: local };
  throw new Error(`Workflow with ID ${id} not found in local storage.`);
};

export const createWorkflow = async (data: {
  name: string;
  description?: string;
  steps?: IWorkflowStepData[];
}): Promise<{ workflow: WorkflowData }> => {
  const created = saveLocalWorkflow({
    name: data.name,
    description: data.description,
    steps: data.steps,
  });
  return { workflow: created };
};

export const updateWorkflow = async (
  id: string,
  data: Partial<WorkflowData>
): Promise<{ workflow: WorkflowData }> => {
  const updated = saveLocalWorkflow({ _id: id, ...data } as any);
  return { workflow: updated };
};

export const deleteWorkflow = async (id: string): Promise<void> => {
  deleteLocalWorkflow(id);
};

export const triggerWorkflow = async (id: string): Promise<{ message: string; workflowId: string }> => {
  return { message: 'Workflow triggered', workflowId: id };
};

export const triggerTestGithubPush = async (
  id: string
): Promise<{ message: string; triggeredBy: string; repoName: string; branch: string }> => {
  return {
    message: 'Push simulation completed locally',
    triggeredBy: 'Local Simulator',
    repoName: 'local-repo',
    branch: 'main',
  };
};

/**
 * Step Execution Gateways
 */
export const testSingleWorkflowStep = async (
  step: IWorkflowStepData,
  variablesContext?: Record<string, string>,
  cookiesContext?: Record<string, string>
): Promise<IStepLogTelemetry> => {
  // Postman synchronization: If step.url already includes query params and step.queryParams is non-empty,
  // sanitize step so neither the edge runner nor browser engine duplicates query parameters
  const stepToRun =
    step.url && step.url.includes('?') && step.queryParams && Object.keys(step.queryParams).length > 0
      ? { ...step, queryParams: {} }
      : step;
  return await executeStepClient(stepToRun, variablesContext || {}, cookiesContext || {});
};

export async function executeWorkflowInBrowser(
  workflow: WorkflowData,
  onStepCompleted?: (telemetry: IStepLogTelemetry) => void
): Promise<IWorkflowRunSummary> {
  const sanitizedSteps = workflow.steps.map((step) => {
    if (step.url && step.url.includes('?') && step.queryParams && Object.keys(step.queryParams).length > 0) {
      return { ...step, queryParams: {} };
    }
    return step;
  });
  const summary = await executeFlowClient(sanitizedSteps, workflow.name, onStepCompleted);

  // Automatically save run report locally
  try {
    saveLocalRunReport(workflow._id, {
      summary,
      stepLogs: summary.steps,
      triggerSource: 'browser_direct',
    });
  } catch (err) {
    console.error('Failed to save run report locally:', err);
  }

  return summary;
}

export const saveWorkflowRunReport = async (
  workflowId: string,
  data: {
    summary?: any;
    stepLogs?: any[];
    triggerSource?: string;
  }
): Promise<void> => {
  saveLocalRunReport(workflowId, data);
};

export const fetchWorkflowRunHistory = async (workflowId: string, _page?: number): Promise<{ runs: any[] }> => {
  return { runs: getLocalRunHistory(workflowId) };
};

/**
 * Stubbed GitHub & Webhook Helpers (Commented / Cleanly Handled for Local-First Putman)
 */
export const fetchGithubRepos = async (_params?: any): Promise<{ repos: IGithubRepoItem[] }> => {
  return { repos: [] };
};

export const fetchGithubBranches = async (_repoOrOpts: any, _token?: string): Promise<{ branches: { name: string }[] }> => {
  return { branches: [{ name: 'main' }, { name: 'master' }, { name: 'dev' }] };
};

export const autoCreateGithubWebhook = async (_data: any): Promise<{ message: string }> => {
  return { message: 'Local mode: webhooks are disabled.' };
};

export const fetchGithubRepoFiles = async (_repoOrOpts: any, _token?: string, _branch?: string): Promise<{ files: any[]; count: number }> => {
  return { files: [], count: 0 };
};

export const scanGithubRepoEndpoints = async (_data: any): Promise<{ endpoints: IScannedEndpoint[]; total: number; count: number }> => {
  return { endpoints: [], total: 0, count: 0 };
};

export const importScannedEndpointsToWorkflow = async (_id: string, _data: any): Promise<{ workflow: WorkflowData; importedCount: number }> => {
  const wf = await fetchWorkflowById(_id);
  return { workflow: wf.workflow, importedCount: 0 };
};

export const fetchWebhookLogs = async (_id?: string): Promise<{ logs: IWebhookLogItem[] }> => {
  return { logs: [] };
};

export const fetchGithubAppConfig = async (): Promise<{ appName: string; installUrl: string; enabled: boolean }> => {
  return { appName: 'PutmanLocal', installUrl: '', enabled: false };
};

export const bindUserGithubInstallationId = async (_id: string): Promise<{ message: string }> => {
  return { message: 'Connected' };
};

export const syncUserGithubStatus = async (): Promise<any> => {
  return { connected: false };
};

export const getBackendWebhookUrl = (_id: string): string => {
  return 'https://localhost/api/webhook-disabled';
};

export const fetchUserGithubStatus = async (_forceSync?: boolean): Promise<IUserGithubStatus> => {
  return {
    githubAppConnected: false,
    connectedReposCount: 0,
  };
};

export const disconnectUserGithub = async (): Promise<{ message: string }> => {
  return { message: 'Disconnected' };
};

export const fetchCurrentUser = async (): Promise<UserData | null> => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('putman_user') || localStorage.getItem('wakeup_user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return {
    id: 'guest-local-user',
    email: 'developer@putman.local',
    name: 'Local Developer',
    provider: 'credentials',
  };
};

export const logoutUser = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('putman_user');
    localStorage.removeItem('wakeup_user');
  }
};
