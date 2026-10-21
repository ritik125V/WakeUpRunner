'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { WorkflowData, IWorkflowStepData, testSingleWorkflowStep } from '@/lib/api';
import { runCompleteWorkflow } from '@/core/engine/runnerEngine';
import { IWorkflowRunSummary, IStepLogTelemetry } from '@/core/engine/types';
import { IApiResponseData } from '@/components/ApiResponseDrawer';

function toApiResponseData(t: IStepLogTelemetry): IApiResponseData {
  return {
    stepName: t.stepName,
    url: t.url,
    method: t.method,
    status: t.status === 'failed' ? 'failed' : t.status === 'success' ? 'success' : 'skipped',
    statusCode: t.statusCode,
    latencyMs: t.latencyMs,
    errorMessage: t.errorMessage,
    responseBody: t.responseBody,
    responseSnippet: t.responseSnippet,
    headers: t.responseHeaders,
    cookies: t.capturedCookies,
    extractedVars: t.extractedVars as Record<string, string>,
    timestamp: t.timestamp,
  };
}

export function useWorkflowRunner(workflow: WorkflowData | null) {
  const router = useRouter();

  // Interactive single step testing state
  const [isSingleTesting, setIsSingleTesting] = useState(false);
  const [singleStepResponse, setSingleStepResponse] = useState<IApiResponseData | null>(null);
  const [isResponseDrawerOpen, setIsResponseDrawerOpen] = useState(false);
  const [liveCookieJar, setLiveCookieJar] = useState<Record<string, string>>({});
  const [liveVariablesMap, setLiveVariablesMap] = useState<Record<string, string>>({});

  // Full workflow run state
  const [isRunningFlow, setIsRunningFlow] = useState(false);
  const [stepExecutionStatus, setStepExecutionStatus] = useState<
    Record<number, 'success' | 'failed' | 'running' | 'skipped'>
  >({});
  const [latestRunSummary, setLatestRunSummary] = useState<IWorkflowRunSummary | null>(null);

  // 1. Single Step Test
  const testSingleStep = useCallback(
    async (step: IWorkflowStepData) => {
      if (!step) return;
      setIsSingleTesting(true);

      try {
        const result = await testSingleWorkflowStep(step, liveVariablesMap, liveCookieJar);
        const mapped = toApiResponseData(result);

        setSingleStepResponse(mapped);
        setIsResponseDrawerOpen(true);

        // Update live cookie jar if cookies were captured
        if (result.capturedCookies && Object.keys(result.capturedCookies).length > 0) {
          setLiveCookieJar((prev) => ({ ...prev, ...result.capturedCookies }));
        }

        // Update live variables if extracted
        if (result.extractedVars && Object.keys(result.extractedVars).length > 0) {
          const stringifiedVars: Record<string, string> = {};
          for (const [k, v] of Object.entries(result.extractedVars)) {
            stringifiedVars[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
          }
          setLiveVariablesMap((prev) => ({ ...prev, ...stringifiedVars }));
        }

        return mapped;
      } catch (err: any) {
        console.error('Single step test execution error:', err);
        const errResult: IApiResponseData = {
          stepName: step.stepName || step.name || 'Step',
          url: step.url,
          method: step.method,
          status: 'failed',
          statusCode: 0,
          latencyMs: 0,
          errorMessage: err.message || 'Request execution failed',
          responseBody: { error: err.message || 'Network request failed' },
          headers: {},
        };
        setSingleStepResponse(errResult);
        setIsResponseDrawerOpen(true);
      } finally {
        setIsSingleTesting(false);
      }
    },
    [liveCookieJar, liveVariablesMap]
  );

  // 2. Full Flow Run
  const executeFullWorkflow = useCallback(
    async (skippedIndices: number[] = []) => {
      if (!workflow || !workflow.steps || workflow.steps.length === 0) return;

      setIsRunningFlow(true);
      const initialStatus: Record<number, 'success' | 'failed' | 'running' | 'skipped'> = {};
      workflow.steps.forEach((_, i) => {
        initialStatus[i] = skippedIndices.includes(i) ? 'skipped' : 'running';
      });
      setStepExecutionStatus(initialStatus);

      try {
        const summary = await runCompleteWorkflow(workflow, {
          skippedStepIndices: skippedIndices,
          onStepStart: (stepIndex) => {
            setStepExecutionStatus((prev) => ({ ...prev, [stepIndex]: 'running' }));
          },
          onStepComplete: (stepIndex, status) => {
            setStepExecutionStatus((prev) => ({ ...prev, [stepIndex]: status }));
          },
        });

        setLatestRunSummary(summary);

        // Persist summary into localStorage for the report page
        if (typeof window !== 'undefined') {
          try {
            const targetId = workflow.id || workflow._id;
            localStorage.setItem(`putman_latest_run_${targetId}`, JSON.stringify(summary));
            // Also push to history
            const historyKey = `putman_history_${targetId}`;
            const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
            existingHistory.unshift({
              runId: summary.runId || `run_${Date.now()}`,
              timestamp: summary.timestamp || summary.startedAt || new Date().toISOString(),
              workflowName: summary.workflowName,
              overallStatus: summary.overallStatus,
              totalSteps: summary.totalSteps,
              successSteps: summary.successSteps,
              failedSteps: summary.failedSteps,
              totalTimeMs: summary.totalTimeMs,
            });
            // Cap history to recent 25 runs
            localStorage.setItem(historyKey, JSON.stringify(existingHistory.slice(0, 25)));
          } catch {
            // Quota protection
          }
        }

        // Navigate to full audit telemetry report
        const targetId = workflow.id || workflow._id;
        router.push(`/workflows/${targetId}/report`);
      } catch (err: any) {
        console.error('Workflow execution pipeline failure:', err);
      } finally {
        setIsRunningFlow(false);
      }
    },
    [workflow, router]
  );

  const clearCookieJar = useCallback(() => {
    setLiveCookieJar({});
    setLiveVariablesMap({});
  }, []);

  return {
    isSingleTesting,
    singleStepResponse,
    isResponseDrawerOpen,
    setIsResponseDrawerOpen,
    liveCookieJar,
    liveVariablesMap,
    clearCookieJar,
    testSingleStep,
    isRunningFlow,
    stepExecutionStatus,
    latestRunSummary,
    executeFullWorkflow,
  };
}
