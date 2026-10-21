'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  Save,
  Check,
  RefreshCw,
  Sparkles,
  FileText,
  Download,
  MoreVertical,
  Globe,
} from 'lucide-react';
import { SyncState } from '../types';

interface TopActionBarProps {
  workflowId: string;
  workflowName: string;
  onUpdateWorkflowName: (name: string) => void;
  baseUrl: string;
  onUpdateBaseUrl: (url: string) => void;
  onApplyBaseUrlToAll: () => void;
  onSave: () => void;
  saving: boolean;
  syncState: SyncState;
  onRunWorkflow: () => void;
  isRunning: boolean;
  onOpenGuide: () => void;
  onExportJson: () => void;
}

export function TopActionBar({
  workflowId,
  workflowName,
  onUpdateWorkflowName,
  baseUrl,
  onUpdateBaseUrl,
  onApplyBaseUrlToAll,
  onSave,
  saving,
  syncState,
  onRunWorkflow,
  isRunning,
  onOpenGuide,
  onExportJson,
}: TopActionBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-[#121214] border-none font-sans flex-wrap">
      {/* Left: Back & Workflow Name */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/workflows"
          className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          title="Back to Workflows"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="flex items-center gap-2 min-w-0">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => onUpdateWorkflowName(e.target.value)}
            placeholder="Workflow Name"
            className="text-base font-bold text-white bg-transparent outline-none border-b border-transparent focus:border-neutral-700 pb-0.5 truncate max-w-[200px] sm:max-w-xs transition-colors"
          />
        </div>
      </div>

      {/* Center: Base URL input with Bulk Apply */}
      <div className="flex items-center gap-2 bg-[#0d0d10] border border-neutral-800/80 rounded-xl px-2.5 py-1.5 flex-1 max-w-md min-w-[240px]">
        <Globe className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
        <input
          type="text"
          value={baseUrl}
          onChange={(e) => onUpdateBaseUrl(e.target.value)}
          placeholder="Workflow Base URL (e.g. https://api.example.com)"
          className="w-full bg-transparent text-white placeholder-neutral-600 outline-none font-mono text-xs"
        />
        <button
          type="button"
          onClick={onApplyBaseUrlToAll}
          className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded text-[10px] font-semibold transition-colors cursor-pointer border-none shrink-0"
          title="Prefix all relative step endpoints with this Base URL"
        >
          Apply to All
        </button>
      </div>

      {/* Right Actions: Save, More Actions, Run */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Save Button */}
        <button
          type="button"
          onClick={onSave}
          disabled={saving || syncState === 'autosaving'}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none ${
            syncState === 'autosaving'
              ? 'bg-amber-950/80 text-amber-300'
              : syncState === 'saved'
              ? 'bg-emerald-950/80 text-emerald-300'
              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200'
          }`}
          title="Click to save immediately. Auto-saves changes automatically."
        >
          {syncState === 'autosaving' ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>Auto-saving...</span>
            </>
          ) : syncState === 'saved' ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Saved</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5 text-[#FF6C37]" />
              <span>Save</span>
            </>
          )}
        </button>

        {/* More Actions Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer border-none"
            title="More Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-[#161619] border border-neutral-800 shadow-2xl z-50 py-1 font-sans text-xs overflow-hidden">
              <Link
                href={`/workflows/${workflowId}/report`}
                onClick={() => setMenuOpen(false)}
                className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer border-none"
              >
                <FileText className="w-3.5 h-3.5 text-neutral-400" />
                <span>Execution Telemetry Report</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenGuide();
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer border-none"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FF6C37]" />
                <span>cURL & SDK Guide</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onExportJson();
                }}
                className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer border-none border-t border-neutral-800/80"
              >
                <Download className="w-3.5 h-3.5 text-neutral-400" />
                <span>Export Workflow JSON</span>
              </button>
            </div>
          )}
        </div>

        {/* Primary Run Workflow Button */}
        <button
          type="button"
          onClick={onRunWorkflow}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF6C37] hover:bg-[#FF8A5C] text-white font-bold text-xs rounded-xl border-none transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          {isRunning ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current text-white" />
          )}
          <span>{isRunning ? 'Running Flow...' : 'Run Workflow'}</span>
        </button>
      </div>
    </div>
  );
}
