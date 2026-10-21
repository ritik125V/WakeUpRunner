'use client';

import React, { createContext, useContext, useState } from 'react';

export interface WorkflowHeaderState {
  workflowName: string;
  setWorkflowName: (name: string) => void;
  syncState: 'idle' | 'editing' | 'autosaving' | 'saved' | 'error';
  saving: boolean;
  onSave: () => void;
  isRunning: boolean;
  onRunWorkflow: () => void;
}

interface WorkflowHeaderContextType {
  headerState: WorkflowHeaderState | null;
  setHeaderState: React.Dispatch<React.SetStateAction<WorkflowHeaderState | null>>;
}

const WorkflowHeaderContext = createContext<WorkflowHeaderContextType>({
  headerState: null,
  setHeaderState: () => {},
});

export function WorkflowHeaderProvider({ children }: { children: React.ReactNode }) {
  const [headerState, setHeaderState] = useState<WorkflowHeaderState | null>(null);

  return (
    <WorkflowHeaderContext.Provider value={{ headerState, setHeaderState }}>
      {children}
    </WorkflowHeaderContext.Provider>
  );
}

export function useWorkflowHeader() {
  return useContext(WorkflowHeaderContext);
}
