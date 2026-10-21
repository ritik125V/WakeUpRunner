import { IWorkflowStepData, WorkflowData } from '@/lib/api';

export type StepEditorTab = 'body' | 'params' | 'headers' | 'cookies' | 'variables';

export type SyncState = 'idle' | 'unsaved' | 'autosaving' | 'saved';

export interface KeyValuePair {
  key: string;
  value: string;
  enabled?: boolean;
  description?: string;
}

export interface AuthPresetConfig {
  type: 'bearer' | 'basic' | 'apikey';
  token?: string;
  username?: string;
  password?: string;
  apiKeyName?: string;
  apiKeyValue?: string;
  addTo?: 'header' | 'query';
}
