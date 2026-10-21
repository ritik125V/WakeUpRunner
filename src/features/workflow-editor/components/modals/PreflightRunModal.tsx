'use client';

import React, { useState } from 'react';
import { Play, X, CheckSquare, Square, Layers, Sparkles } from 'lucide-react';
import { IWorkflowStepData } from '@/lib/api';

interface PreflightRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowName: string;
  steps: IWorkflowStepData[];
  baseUrl?: string;
  onConfirmRun: (skippedIndices: number[]) => void;
  isRunning: boolean;
}

export function PreflightRunModal({
  isOpen,
  onClose,
  workflowName,
  steps,
  baseUrl,
  onConfirmRun,
  isRunning,
}: PreflightRunModalProps) {
  // Local state for which steps are included in this run
  const [includedSteps, setIncludedSteps] = useState<boolean[]>(() =>
    steps.map((s) => !s.skip)
  );

  if (!isOpen) return null;

  const toggleStep = (idx: number) => {
    const updated = [...includedSteps];
    updated[idx] = !updated[idx];
    setIncludedSteps(updated);
  };

  const handleSelectAll = (select: boolean) => {
    setIncludedSteps(steps.map(() => select));
  };

  const handleStart = () => {
    const skipped = steps
      .map((_, i) => (!includedSteps[i] ? i : -1))
      .filter((i) => i !== -1);
    onConfirmRun(skipped);
  };

  const activeCount = includedSteps.filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-[#141417] border border-neutral-800 shadow-2xl p-5 space-y-4 font-sans text-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF6C37]/15 text-[#FF6C37] flex items-center justify-center">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Pre-Flight Run Configuration</h3>
              <p className="text-[11px] text-neutral-400">
                Execute workflow: <strong className="text-white">{workflowName}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer border-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info card */}
        <div className="p-3 bg-[#0d0d10] rounded-xl border border-neutral-850 text-xs space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">Base URL:</span>
            <span className="font-mono text-purple-300 font-bold truncate max-w-[280px]">
              {baseUrl || '<Direct Step URLs>'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-neutral-400">Steps to Execute:</span>
            <span className="font-bold text-white">
              {activeCount} of {steps.length} steps
            </span>
          </div>
        </div>

        {/* Step checklist */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-neutral-300">Step Checklist</span>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleSelectAll(true)}
                className="text-[#FF8A5C] hover:underline cursor-pointer border-none bg-transparent"
              >
                Select All
              </button>
              <span className="text-neutral-600">•</span>
              <button
                type="button"
                onClick={() => handleSelectAll(false)}
                className="text-neutral-400 hover:underline cursor-pointer border-none bg-transparent"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
            {steps.map((step, idx) => (
              <div
                key={idx}
                onClick={() => toggleStep(idx)}
                className={`flex items-center gap-2.5 p-2 rounded-xl border transition-colors cursor-pointer ${
                  includedSteps[idx]
                    ? 'bg-[#18181c] border-neutral-750 text-white'
                    : 'bg-[#0d0d10] border-neutral-900 text-neutral-500 opacity-60'
                }`}
              >
                {includedSteps[idx] ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-neutral-600 shrink-0" />
                )}

                <span className="text-[10px] text-neutral-500 font-bold shrink-0">
                  #{idx + 1}
                </span>

                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 bg-neutral-800 text-neutral-300">
                  {step.method || 'GET'}
                </span>

                <span className="truncate font-sans font-semibold text-xs flex-1">
                  {step.stepName || `Step ${idx + 1}`}
                </span>

                <span className="text-[10px] text-neutral-500 truncate max-w-[140px]">
                  {step.url}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-850 cursor-pointer border-none"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleStart}
            disabled={isRunning || activeCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF6C37] hover:bg-[#FF8A5C] text-white font-bold text-xs rounded-xl border-none transition-all cursor-pointer shadow-md disabled:opacity-40"
          >
            <Play className="w-3.5 h-3.5 fill-current text-white" />
            <span>Start Execution ({activeCount} Steps)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
