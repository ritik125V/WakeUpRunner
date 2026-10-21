'use client';

import React from 'react';
import { Code, SlidersHorizontal, Key, Cookie, Database } from 'lucide-react';
import { StepEditorTab } from '../../types';
import { BodyPayloadTab } from './BodyPayloadTab';
import { ParamsTab } from './ParamsTab';
import { HeadersTab } from './HeadersTab';
import { CookiesTab } from './CookiesTab';
import { VariablesTab } from './VariablesTab';
import { IWorkflowStepData } from '@/lib/api';

interface StepRequestTabsProps {
  activeTab: StepEditorTab;
  onTabChange: (tab: StepEditorTab) => void;
  step: IWorkflowStepData;
  onUpdateStep: (updates: Partial<IWorkflowStepData>) => void;
  disabled?: boolean;
}

export function StepRequestTabs({
  activeTab,
  onTabChange,
  step,
  onUpdateStep,
  disabled,
}: StepRequestTabsProps) {
  const queryCount = Object.keys(step.queryParams || {}).length;
  const headerCount = Object.keys(step.headers || {}).length;
  const varCount = (step.extractVariables || []).length;
  const hasBody = Boolean(step.bodyPayload && step.bodyPayload.trim() !== '');

  return (
    <div className="space-y-3 my-2 flex-1 flex flex-col justify-start w-full min-w-0 overflow-hidden">
      {/* Navigation Bar */}
      <div className="flex items-center gap-6 pt-1 pb-0 border-b border-neutral-800 text-xs overflow-x-auto flex-nowrap scrollbar-thin w-full font-mono">
        <button
          type="button"
          onClick={() => onTabChange('body')}
          className={`pb-2 transition-all flex items-center gap-1.5 whitespace-nowrap text-xs cursor-pointer border-t-0 border-x-0 border-b-2 bg-transparent ${
            activeTab === 'body'
              ? 'border-[#f5f0e8] text-white font-bold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200 font-medium'
          }`}
        >
          <Code className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Body</span>
          {hasBody && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />}
        </button>

        <button
          type="button"
          onClick={() => onTabChange('params')}
          className={`pb-2 transition-all flex items-center gap-1.5 whitespace-nowrap text-xs cursor-pointer border-t-0 border-x-0 border-b-2 bg-transparent ${
            activeTab === 'params'
              ? 'border-[#f5f0e8] text-white font-bold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200 font-medium'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Params</span>
          {queryCount > 0 && (
            <span className="px-1.5 py-0.2 bg-[#1e1e24] text-amber-300 text-[10px] rounded-full font-bold">
              {queryCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onTabChange('headers')}
          className={`pb-2 transition-all flex items-center gap-1.5 whitespace-nowrap text-xs cursor-pointer border-t-0 border-x-0 border-b-2 bg-transparent ${
            activeTab === 'headers'
              ? 'border-[#f5f0e8] text-white font-bold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200 font-medium'
          }`}
        >
          <Key className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Headers</span>
          {headerCount > 0 && (
            <span className="px-1.5 py-0.2 bg-[#1e1e24] text-emerald-400 text-[10px] rounded-full font-bold">
              {headerCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onTabChange('cookies')}
          className={`pb-2 transition-all flex items-center gap-1.5 whitespace-nowrap text-xs cursor-pointer border-t-0 border-x-0 border-b-2 bg-transparent ${
            activeTab === 'cookies'
              ? 'border-[#f5f0e8] text-white font-bold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200 font-medium'
          }`}
        >
          <Cookie className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Cookies & Carry</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('variables')}
          className={`pb-2 transition-all flex items-center gap-1.5 whitespace-nowrap text-xs cursor-pointer border-t-0 border-x-0 border-b-2 bg-transparent ${
            activeTab === 'variables'
              ? 'border-[#f5f0e8] text-white font-bold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200 font-medium'
          }`}
        >
          <Database className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Extract Variables</span>
          {varCount > 0 && (
            <span className="px-1.5 py-0.2 bg-[#1e1e24] text-purple-300 text-[10px] rounded-full font-bold">
              {varCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="pt-2 flex-1">
        {activeTab === 'body' && (
          <BodyPayloadTab
            body={step.bodyPayload || ''}
            onChange={(bodyPayload) => onUpdateStep({ bodyPayload })}
            disabled={disabled}
          />
        )}

        {activeTab === 'params' && (
          <ParamsTab
            params={step.queryParams || {}}
            onChange={(queryParams) => onUpdateStep({ queryParams })}
            disabled={disabled}
          />
        )}

        {activeTab === 'headers' && (
          <HeadersTab
            headers={step.headers || {}}
            onChange={(headers) => onUpdateStep({ headers })}
            disabled={disabled}
          />
        )}

        {activeTab === 'cookies' && (
          <CookiesTab
            captureCookies={Boolean(step.captureCookies)}
            useCookies={Boolean(step.useCookies)}
            onUpdate={(field, val) => onUpdateStep({ [field]: val })}
            disabled={disabled}
          />
        )}

        {activeTab === 'variables' && (
          <VariablesTab
            extractVariables={step.extractVariables || []}
            onChange={(extractVariables) => onUpdateStep({ extractVariables })}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}
