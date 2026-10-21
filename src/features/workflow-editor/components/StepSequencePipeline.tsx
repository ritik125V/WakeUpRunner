'use client';

import React from 'react';
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Layers,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { IWorkflowStepData } from '@/lib/api';

interface StepSequencePipelineProps {
  steps: IWorkflowStepData[];
  activeStepIndex: number;
  onSelectStep: (index: number) => void;
  onAddStep: () => void;
  onDeleteStep: (index: number) => void;
  onDuplicateStep: (index: number) => void;
  onMoveStep: (index: number, direction: 'up' | 'down') => void;
  onToggleSkipStep: (index: number) => void;
  stepExecutionStatus?: Record<number, 'success' | 'failed' | 'running' | 'skipped'>;
  disabled?: boolean;
}

export function StepSequencePipeline({
  steps,
  activeStepIndex,
  onSelectStep,
  onAddStep,
  onDeleteStep,
  onDuplicateStep,
  onMoveStep,
  onToggleSkipStep,
  stepExecutionStatus = {},
  disabled,
}: StepSequencePipelineProps) {
  const getMethodBadgeClass = (method: string) => {
    switch ((method || 'GET').toUpperCase()) {
      case 'GET':
        return 'text-emerald-400 bg-emerald-950/80';
      case 'POST':
        return 'text-amber-300 bg-amber-950/80';
      case 'PUT':
        return 'text-sky-300 bg-sky-950/80';
      case 'DELETE':
        return 'text-rose-400 bg-rose-950/80';
      case 'PATCH':
        return 'text-purple-300 bg-purple-950/80';
      default:
        return 'text-neutral-300 bg-neutral-800';
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3 font-sans">
      {/* Sequence Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-neutral-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
            Pipeline Steps ({steps.length})
          </span>
        </div>

        <button
          type="button"
          onClick={onAddStep}
          disabled={disabled}
          className="flex items-center gap-1 px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer border-none"
        >
          <Plus className="w-3.5 h-3.5 text-[#FF6C37]" />
          <span>Add Step</span>
        </button>
      </div>

      {/* Steps List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {steps.map((step, idx) => {
          const isActive = idx === activeStepIndex;
          const isSkipped = Boolean(step.skip);
          const execStatus = stepExecutionStatus[idx];

          return (
            <div
              key={idx}
              onClick={() => onSelectStep(idx)}
              className={`group p-3 rounded-xl transition-all cursor-pointer relative ${
                isActive
                  ? 'bg-[#18181c] border-l-2 border-[#FF6C37] shadow-lg'
                  : 'bg-[#101012] hover:bg-[#141417]'
              } ${isSkipped ? 'opacity-50' : ''}`}
            >
              {/* Top row: Method + Step Name + Reordering */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-mono text-neutral-500 font-bold shrink-0">
                    #{idx + 1}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${getMethodBadgeClass(
                      step.method || 'GET'
                    )}`}
                  >
                    {step.method || 'GET'}
                  </span>
                  <span className="text-xs font-bold text-white truncate">
                    {step.stepName || `Step ${idx + 1}`}
                  </span>
                </div>

                {/* Status indicator if executing / executed */}
                {execStatus === 'success' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
                {execStatus === 'failed' && (
                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                )}
                {execStatus === 'running' && (
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                )}

                {/* Card Controls */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveStep(idx, 'up');
                    }}
                    disabled={idx === 0 || disabled}
                    className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 disabled:opacity-20 cursor-pointer border-none"
                    title="Move Step Up"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveStep(idx, 'down');
                    }}
                    disabled={idx === steps.length - 1 || disabled}
                    className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 disabled:opacity-20 cursor-pointer border-none"
                    title="Move Step Down"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* URL Preview */}
              <div className="text-[11px] font-mono text-neutral-400 truncate">
                {step.url || '<no endpoint configured>'}
              </div>

              {/* Quick Actions Footer (Duplicate, Skip, Delete) */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-900/80 text-[10px] text-neutral-500">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSkipStep(idx);
                    }}
                    disabled={disabled}
                    className="flex items-center gap-1 hover:text-neutral-300 transition-colors cursor-pointer border-none bg-transparent"
                    title={isSkipped ? 'Enable step in flow' : 'Skip step during full workflow run'}
                  >
                    {isSkipped ? (
                      <>
                        <EyeOff className="w-3 h-3 text-amber-400" />
                        <span className="text-amber-400 font-bold">SKIPPED</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3 text-neutral-500" />
                        <span>Active</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateStep(idx);
                    }}
                    disabled={disabled}
                    className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 cursor-pointer border-none"
                    title="Duplicate Step"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteStep(idx);
                    }}
                    disabled={steps.length <= 1 || disabled}
                    className="p-1 text-neutral-400 hover:text-red-400 rounded hover:bg-neutral-800 disabled:opacity-20 cursor-pointer border-none"
                    title="Delete Step"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Step Card */}
        <button
          type="button"
          onClick={onAddStep}
          disabled={disabled}
          className="w-full py-3 rounded-xl border border-dashed border-neutral-800/80 hover:border-neutral-700 hover:bg-[#141417] text-neutral-400 hover:text-white flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer bg-transparent"
        >
          <Plus className="w-3.5 h-3.5 text-[#FF6C37]" />
          <span>Add New Pipeline Step</span>
        </button>
      </div>
    </div>
  );
}
