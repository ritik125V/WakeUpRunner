'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Copy, Check, Terminal, ExternalLink, X, FlaskConical } from 'lucide-react';
import { generateAIAgentPrompt } from '@/lib/aiAgentImport';
import { saveLocalWorkflow } from '@/lib/workflowLocalStorage';

interface AIAgentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIAgentImportModal({ isOpen, onClose }: AIAgentImportModalProps) {
  const router = useRouter();
  const [copied, setCopied] = useState<boolean>(false);
  const [pastedLink, setPastedLink] = useState<string>('');
  const [loadingMaster, setLoadingMaster] = useState<boolean>(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const prompt = generateAIAgentPrompt(origin);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleLoadMasterSuite = async () => {
    try {
      setLoadingMaster(true);
      const res = await fetch('/putman-test-workflows.json');
      const data = await res.json();
      const master = data.workflows[0];
      const saved = saveLocalWorkflow({
        name: master.name,
        description: master.description,
        steps: master.steps,
      });
      onClose();
      router.push(`/workflows/${saved._id}`);
    } catch (err: any) {
      alert('Failed to load test suite: ' + err.message);
    } finally {
      setLoadingMaster(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedLink.trim()) return;

    const trimmed = pastedLink.trim();
    if (trimmed.includes('#data=')) {
      router.push(`/workflows/import#${trimmed.split('#')[1]}`);
    } else {
      router.push(`/workflows/import#data=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans"
      >
        <motion.div
          initial={{ scale: 0.96, y: 8 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.96, y: 8 }}
          className="bg-neutral-950 p-6 sm:p-7 rounded-2xl max-w-xl w-full space-y-5 border border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF6C37]/10 text-[#FF6C37] text-[11px] font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                Add-on Service
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Import Workflow via AI Agent
              </h3>
              <p className="text-xs text-neutral-400">
                Connect Cursor, Claude Code, Copilot, or any terminal agent running in your project.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-white p-1 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 2-Step Process Visualizer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-neutral-900/60 rounded-xl border border-neutral-800/60 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#FF6C37] text-white flex items-center justify-center font-bold text-[11px]">
                  1
                </span>
                <span className="font-semibold text-white">Copy Agent Prompt</span>
              </div>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                Paste into your AI agent. It inspects your project routes and structures the workflow.
              </p>
            </div>

            <div className="p-3.5 bg-neutral-900/60 rounded-xl border border-neutral-800/60 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-[11px]">
                  2
                </span>
                <span className="font-semibold text-white">Click Magic Link</span>
              </div>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                Your agent returns a clickable Putman link. Click it to import and run without saving files!
              </p>
            </div>
          </div>

          {/* Prompt Copy Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400 font-medium flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#FF6C37]" /> Prompt for Your Agent
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FF6C37] hover:bg-[#FF8A5C] text-white font-semibold text-xs rounded-md transition-all cursor-pointer shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Prompt!' : 'Copy Agent Prompt'}</span>
              </button>
            </div>

            <pre className="p-3 bg-[#09090b] text-neutral-300 rounded-xl text-[11px] font-mono border border-neutral-800/80 max-h-36 overflow-y-auto whitespace-pre-wrap select-all">
              {prompt}
            </pre>
          </div>

          {/* 1-Click Load TestLab Master Suite */}
          <div className="p-3 bg-[#121214] border border-neutral-800 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <FlaskConical className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">WakeUp TestLab Master Suite</h5>
                <p className="text-[11px] text-neutral-400">Pre-built 25-step test suite covering All Categories A to F</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLoadMasterSuite}
              disabled={loadingMaster}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0 shadow-sm"
            >
              {loadingMaster ? 'Loading...' : 'Load 25 Steps →'}
            </button>
          </div>

          {/* Fallback Paste Input */}
          <form onSubmit={handleManualSubmit} className="space-y-2 pt-1 border-t border-neutral-900">
            <label className="text-[11px] text-neutral-400 block font-medium">
              Already have an AI-generated link or JSON snippet?
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={`${origin || ''}/workflows/import#data=... or JSON`}
                value={pastedLink}
                onChange={(e) => setPastedLink(e.target.value)}
                className="flex-1 bg-neutral-900 text-white px-3 py-2 rounded-lg text-xs font-mono outline-none focus:ring-1 focus:ring-[#FF6C37]/50 border border-neutral-800"
              />
              <button
                type="submit"
                disabled={!pastedLink.trim()}
                className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Preview →
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-neutral-500">
              Zero-install · Works with Cursor, Claude Code & Copilot
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-[#1a1a1e] hover:bg-[#242429] text-neutral-300 text-xs font-medium rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
