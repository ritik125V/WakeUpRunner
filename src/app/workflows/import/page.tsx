'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Play,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Layers,
  ChevronRight,
  Copy,
  Check,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import { WorkflowData } from '@/lib/api';
import { saveLocalWorkflow } from '@/lib/workflowLocalStorage';
import { decodeWorkflowFromPayload, generateAIAgentPrompt } from '@/lib/aiAgentImport';

export default function WorkflowImportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [decodedWorkflow, setDecodedWorkflow] = useState<WorkflowData | null>(null);
  const [allWorkflows, setAllWorkflows] = useState<WorkflowData[]>([]);
  const [manualInput, setManualInput] = useState<string>('');
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [origin, setOrigin] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
      handleProcessUrl();
    }
  }, []);

  const handleProcessUrl = () => {
    setLoading(true);
    setError(null);

    const hash = window.location.hash;
    const search = window.location.search;

    const rawInput = hash || search;

    if (!rawInput || (rawInput === '#' && !search)) {
      setLoading(false);
      return;
    }

    const res = decodeWorkflowFromPayload(rawInput);
    if (res.success && res.workflow) {
      setDecodedWorkflow(res.workflow);
      setAllWorkflows(res.allWorkflows || [res.workflow]);
    } else {
      setError(res.error || 'Unable to decode workflow payload from URL.');
    }
    setLoading(false);
  };

  const handleManualDecode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    setLoading(true);
    setError(null);

    const res = decodeWorkflowFromPayload(manualInput.trim());
    if (res.success && res.workflow) {
      setDecodedWorkflow(res.workflow);
      setAllWorkflows(res.allWorkflows || [res.workflow]);
    } else {
      setError(res.error || 'Failed to decode input. Ensure it is a valid Putman magic link or JSON.');
    }
    setLoading(false);
  };

  const handleSaveAndOpen = (runImmediately: boolean = false) => {
    if (!decodedWorkflow) return;

    try {
      let firstSavedId = '';
      for (const wf of allWorkflows) {
        const saved = saveLocalWorkflow({
          name: wf.name,
          description: wf.description,
          steps: wf.steps,
        });
        if (!firstSavedId) firstSavedId = saved._id;
      }

      if (runImmediately && firstSavedId) {
        router.push(`/workflows/${firstSavedId}/report`);
      } else if (firstSavedId) {
        router.push(`/workflows/${firstSavedId}`);
      } else {
        router.push('/workflows');
      }
    } catch (err: any) {
      setError(`Failed to save workflow: ${err.message || 'Storage error'}`);
    }
  };

  const handleCopyPrompt = () => {
    const prompt = generateAIAgentPrompt(origin);
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  const getMethodBadgeClass = (method?: string) => {
    switch (method?.toUpperCase()) {
      case 'POST':
        return 'bg-amber-950/60 text-amber-300 border-amber-900/40';
      case 'PUT':
        return 'bg-blue-950/60 text-blue-300 border-blue-900/40';
      case 'DELETE':
        return 'bg-rose-950/60 text-rose-300 border-rose-900/40';
      case 'PATCH':
        return 'bg-purple-950/60 text-purple-300 border-purple-900/40';
      default:
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-900/40';
    }
  };

  return (
    <div
      className="min-h-screen px-4 sm:px-6 py-6 sm:py-12 font-sans transition-colors duration-200"
      style={{
        backgroundColor: 'var(--color-canvas, #09090b)',
        color: 'var(--color-text-primary, #f5f0e8)',
      }}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Link href="/workflows" className="hover:text-neutral-300 transition-colors">
            Workflows
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
          <span className="text-neutral-300 font-medium">AI Agent Import</span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-12 bg-[#121214] rounded-xl text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#FF6C37] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-neutral-400">Decoding AI-generated workflow payload...</p>
          </div>
        )}

        {/* Success Preview Card */}
        {!loading && decodedWorkflow && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 sm:p-8 bg-[#121214] rounded-xl border border-neutral-800 space-y-6 shadow-2xl"
          >
            {/* Header Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-900">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF6C37]/10 text-[#FF6C37] text-[11px] font-semibold tracking-wide">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Agent Workflow Ready
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {decodedWorkflow.name}
                </h1>
                {decodedWorkflow.description && (
                  <p className="text-xs text-neutral-400 max-w-xl">
                    {decodedWorkflow.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-xs text-neutral-400 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800">
                  {decodedWorkflow.steps?.length || 0} {decodedWorkflow.steps?.length === 1 ? 'Step' : 'Steps'}
                </span>
              </div>
            </div>

            {/* Steps Preview List */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Workflow Execution Plan
              </h3>

              <div className="space-y-2">
                {decodedWorkflow.steps?.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#0d0d0f] rounded-lg border border-neutral-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-[11px] font-mono text-neutral-500 w-5 text-right shrink-0">
                        {idx + 1}.
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${getMethodBadgeClass(
                          step.method
                        )}`}
                      >
                        {step.method || 'GET'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">
                          {step.name || `Step ${idx + 1}`}
                        </p>
                        <p className="text-[11px] font-mono text-neutral-500 truncate">
                          {step.url || 'No URL specified'}
                        </p>
                      </div>
                    </div>

                    {/* Step Variables & Badges */}
                    <div className="flex items-center gap-2 text-[10px] font-mono pl-8 sm:pl-0 shrink-0">
                      {step.extractVariables && step.extractVariables.length > 0 && (
                        <span className="px-2 py-0.5 bg-amber-950/40 text-amber-300 rounded border border-amber-900/30">
                          Extracts: {step.extractVariables.map((v) => `{{${v.varName}}}`).join(', ')}
                        </span>
                      )}
                      {step.expectedStatusCode && (
                        <span className="px-1.5 py-0.5 text-neutral-500">
                          Expects {step.expectedStatusCode}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-neutral-900">
              <Link
                href="/workflows"
                className="w-full sm:w-auto px-4 py-2 bg-[#1a1a1e] hover:bg-[#242429] text-neutral-300 text-xs font-semibold rounded-lg text-center transition-colors"
              >
                Discard & Back
              </Link>
              <button
                type="button"
                onClick={() => handleSaveAndOpen(false)}
                className="w-full sm:w-auto px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                Save to Workflows
              </button>
              <button
                type="button"
                onClick={() => handleSaveAndOpen(true)}
                className="w-full sm:w-auto px-5 py-2 bg-[#FF6C37] hover:bg-[#FF8A5C] text-white text-xs font-bold rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Save & Run Now 🚀
              </button>
            </div>
          </motion.div>
        )}

        {/* Fallback & Manual Link / JSON Input (When no URL hash is present or on error) */}
        {!loading && (!decodedWorkflow || error) && (
          <div className="space-y-6">
            {error && (
              <div className="p-4 bg-rose-950/30 border border-rose-900/50 rounded-xl flex items-start gap-3 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div>
                  <h4 className="font-semibold text-rose-200">Import Error</h4>
                  <p className="mt-0.5 text-neutral-400">{error}</p>
                </div>
              </div>
            )}

            <div className="p-6 sm:p-8 bg-[#121214] rounded-xl border border-neutral-800 space-y-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-900 text-neutral-400 text-[11px] font-medium">
                  <Terminal className="w-3.5 h-3.5 text-[#FF6C37]" />
                  AI Agent Connector Add-on
                </div>
                <h2 className="text-lg font-bold text-white">Import from Your AI Agent</h2>
                <p className="text-xs text-neutral-400">
                  Connect Cursor, Claude Code, Copilot, or any terminal agent running in your project.
                </p>
              </div>

              {/* Instructions Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 bg-[#0d0d0f] rounded-lg border border-neutral-900 space-y-2">
                  <div className="w-6 h-6 rounded-full bg-[#FF6C37]/10 text-[#FF6C37] flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h4 className="font-semibold text-white">Copy Agent Prompt</h4>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    Give this command to your AI agent in your terminal or IDE chat. It scans your API routes.
                  </p>
                  <button
                    onClick={handleCopyPrompt}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6C37] hover:bg-[#FF8A5C] text-white font-semibold text-xs rounded-md transition-all cursor-pointer shadow-sm"
                  >
                    {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPrompt ? 'Copied Prompt!' : 'Copy Agent Prompt'}</span>
                  </button>
                </div>

                <div className="p-4 bg-[#0d0d0f] rounded-lg border border-neutral-900 space-y-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h4 className="font-semibold text-white">Click Agent's Magic Link</h4>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    The agent outputs a clickable link. Clicking it automatically opens Putman with all endpoints pre-configured.
                  </p>
                </div>
              </div>

              {/* Manual Input Form */}
              <form onSubmit={handleManualDecode} className="space-y-3 pt-2">
                <label className="text-xs font-semibold text-neutral-400 block">
                  Or paste an AI Agent Magic Link / JSON payload here:
                </label>
                <textarea
                  rows={4}
                  placeholder={`Paste URL (${origin || ''}/workflows/import#data=...) or raw JSON...`}
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="w-full bg-[#0d0d0f] text-white p-3 rounded-lg text-xs font-mono outline-none focus:ring-1 focus:ring-[#FF6C37]/50 border border-neutral-800 placeholder:text-neutral-600"
                />

                <div className="flex items-center justify-between">
                  <Link href="/workflows" className="text-xs text-neutral-500 hover:text-white">
                    ← Back to Workflows
                  </Link>

                  <button
                    type="submit"
                    disabled={!manualInput.trim()}
                    className="px-4 py-2 bg-[#FF6C37] hover:bg-[#FF8A5C] disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Decode & Preview
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
