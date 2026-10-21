'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { WorkflowData, IWorkflowStepData, fetchWorkflowById, updateWorkflow } from '@/lib/api';
import { saveLocalWorkflow } from '@/lib/workflowLocalStorage';
import { SyncState } from '../types';

export function useWorkflowEditor(workflowId: string) {
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDirtyRef = useRef<boolean>(false);

  // 1. Initial Load
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetchWorkflowById(workflowId);
        if (!mounted) return;
        const data = res?.workflow || (res as any);
        if (data) {
          // Normalize steps
          if (!data.steps || data.steps.length === 0) {
            data.steps = [
              {
                stepIndex: 1,
                name: 'Initial API Step',
                stepName: 'Initial API Step',
                method: 'GET',
                url: '',
                headers: {},
                queryParams: {},
                bodyPayload: '',
              },
            ];
          }
          setWorkflow(data);
        } else {
          setErrorMessage('Workflow not found');
        }
      } catch (err: any) {
        if (!mounted) return;
        setErrorMessage(err.message || 'Failed to load workflow');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [workflowId]);

  // 2. Save function
  const saveCurrentWorkflow = useCallback(
    async (updatedWf?: WorkflowData) => {
      const target = updatedWf || workflow;
      if (!target) return;

      try {
        setSaving(true);
        setSyncState('autosaving');

        // Always save to browser localStorage
        saveLocalWorkflow(target);

        // Also call api bridge
        const targetId = target._id || target.id || workflowId;
        await updateWorkflow(targetId, target);

        setSyncState('saved');
        isDirtyRef.current = false;
        setTimeout(() => {
          setSyncState('idle');
        }, 1500);
      } catch (err) {
        console.warn('Auto-save error (persisted to local):', err);
        setSyncState('idle');
      } finally {
        setSaving(false);
      }
    },
    [workflow, workflowId]
  );

  // 3. Trigger auto-save debounce
  const scheduleAutoSave = useCallback(
    (newWorkflow: WorkflowData) => {
      setWorkflow(newWorkflow);
      setSyncState('unsaved');
      isDirtyRef.current = true;

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        saveCurrentWorkflow(newWorkflow);
      }, 500);
    },
    [saveCurrentWorkflow]
  );

  // 4. Mutations
  const updateWorkflowName = useCallback(
    (name: string) => {
      if (!workflow) return;
      scheduleAutoSave({ ...workflow, name });
    },
    [workflow, scheduleAutoSave]
  );

  const updateBaseUrl = useCallback(
    (baseUrl: string) => {
      if (!workflow) return;
      scheduleAutoSave({ ...workflow, baseUrl });
    },
    [workflow, scheduleAutoSave]
  );

  const applyBaseUrlToAll = useCallback(() => {
    if (!workflow || !workflow.baseUrl) return;
    const base = workflow.baseUrl.replace(/\/$/, '');
    const newSteps = (workflow.steps || []).map((step) => {
      if (!step.url || step.url.startsWith('http://') || step.url.startsWith('https://')) {
        return step;
      }
      const path = step.url.startsWith('/') ? step.url : `/${step.url}`;
      return { ...step, url: `${base}${path}` };
    });
    scheduleAutoSave({ ...workflow, steps: newSteps });
  }, [workflow, scheduleAutoSave]);

  const updateActiveStep = useCallback(
    (updates: Partial<IWorkflowStepData>) => {
      if (!workflow) return;
      const steps = [...(workflow.steps || [])];
      if (!steps[activeStepIndex]) return;

      steps[activeStepIndex] = { ...steps[activeStepIndex], ...updates };
      scheduleAutoSave({ ...workflow, steps });
    },
    [workflow, activeStepIndex, scheduleAutoSave]
  );

  const addStep = useCallback(() => {
    if (!workflow) return;
    const steps = [...(workflow.steps || [])];
    const newIndex = steps.length + 1;
    const newStep: IWorkflowStepData = {
      stepIndex: newIndex,
      name: `Step ${newIndex}`,
      stepName: `Step ${newIndex}`,
      method: 'GET',
      url: workflow.baseUrl ? `${workflow.baseUrl.replace(/\/$/, '')}/api` : '',
      headers: {},
      queryParams: {},
      bodyPayload: '',
      captureCookies: true,
      useCookies: true,
    };
    steps.push(newStep);
    scheduleAutoSave({ ...workflow, steps });
    setActiveStepIndex(steps.length - 1);
  }, [workflow, scheduleAutoSave]);

  const deleteStep = useCallback(
    (index: number) => {
      if (!workflow || (workflow.steps || []).length <= 1) return;
      const steps = workflow.steps.filter((_, i) => i !== index).map((s, i) => ({
        ...s,
        stepIndex: i + 1,
      }));
      scheduleAutoSave({ ...workflow, steps });
      if (activeStepIndex >= steps.length) {
        setActiveStepIndex(steps.length - 1);
      }
    },
    [workflow, activeStepIndex, scheduleAutoSave]
  );

  const duplicateStep = useCallback(
    (index: number) => {
      if (!workflow) return;
      const steps = [...(workflow.steps || [])];
      const source = steps[index];
      if (!source) return;

      const clone: IWorkflowStepData = {
        ...JSON.parse(JSON.stringify(source)),
        name: `${source.name || source.stepName || 'Step'} (Copy)`,
        stepName: `${source.stepName || source.name || 'Step'} (Copy)`,
      };
      steps.splice(index + 1, 0, clone);
      const reindexed = steps.map((s, i) => ({ ...s, stepIndex: i + 1 }));
      scheduleAutoSave({ ...workflow, steps: reindexed });
      setActiveStepIndex(index + 1);
    },
    [workflow, scheduleAutoSave]
  );

  const moveStep = useCallback(
    (index: number, direction: 'up' | 'down') => {
      if (!workflow) return;
      const steps = [...(workflow.steps || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= steps.length) return;

      const temp = steps[index];
      steps[index] = steps[targetIndex];
      steps[targetIndex] = temp;

      const reindexed = steps.map((s, i) => ({ ...s, stepIndex: i + 1 }));
      scheduleAutoSave({ ...workflow, steps: reindexed });
      setActiveStepIndex(targetIndex);
    },
    [workflow, scheduleAutoSave]
  );

  const toggleSkipStep = useCallback(
    (index: number) => {
      if (!workflow) return;
      const steps = [...(workflow.steps || [])];
      if (!steps[index]) return;
      const newSkip = !(steps[index].skip || steps[index].skipped);
      steps[index] = { ...steps[index], skip: newSkip, skipped: newSkip };
      scheduleAutoSave({ ...workflow, steps });
    },
    [workflow, scheduleAutoSave]
  );

  const currentStep = workflow?.steps?.[activeStepIndex] || null;

  return {
    workflow,
    steps: workflow?.steps || [],
    currentStep,
    activeStepIndex,
    setActiveStepIndex,
    loading,
    saving,
    syncState,
    errorMessage,
    saveCurrentWorkflow,
    updateWorkflowName,
    updateBaseUrl,
    applyBaseUrlToAll,
    updateActiveStep,
    addStep,
    deleteStep,
    duplicateStep,
    moveStep,
    toggleSkipStep,
  };
}
