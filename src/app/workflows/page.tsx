'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Play,
  Trash2,
  RefreshCw,
  Search,
  ChevronRight,
  Layers,
  Cloud,
  CloudOff,
  Sparkles,
} from 'lucide-react';
import {
  fetchWorkflows,
  createWorkflow,
  deleteWorkflow,
  WorkflowData,
  IWorkflowStepData,
} from '@/lib/api';
import { AIAgentImportModal } from '@/features/workflow-editor/components/AIAgentImportModal';
// Cloud sync functions commented out as Putman uses local storage with no cloud database
// import { syncLocalWorkflowsToCloud, getUnsyncedLocalWorkflows } from '@/lib/workflowLocalStorage';
import { WorkflowsSkeleton } from '@/components/Skeleton';

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newFlowName, setNewFlowName] = useState<string>('');
  const [newFlowDesc, setNewFlowDesc] = useState<string>('');
  const [showAIModal, setShowAIModal] = useState<boolean>(false);
  // const [isSyncing, setIsSyncing] = useState<boolean>(false);
  // const [syncedCount, setSyncedCount] = useState<number | null>(null);
  // const [showSyncBanner, setShowSyncBanner] = useState<boolean>(false);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const res = await fetchWorkflows();
      setWorkflows(res.workflows || []);
      /*
      const token = typeof window !== 'undefined' ? localStorage.getItem('wakeup_auth_token') : null;
      if (token) {
        const unsynced = getUnsyncedLocalWorkflows();
        if (unsynced.length === 0) {
          setShowSyncBanner(false);
        }
      }
      */
    } catch (err) {
      console.error('Failed to load workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    /*
    const token = typeof window !== 'undefined' ? localStorage.getItem('wakeup_auth_token') : null;
    if (token) {
      const unsynced = getUnsyncedLocalWorkflows();
      if (unsynced.length > 0) {
        setShowSyncBanner(true);
      }
    }
    */
    loadWorkflows();
  }, []);

  /*
  const handleManualSync = async () => {
    try {
      await syncLocalWorkflowsToCloud((syncing, count) => {
        setIsSyncing(syncing);
        if (!syncing && count > 0) {
          setSyncedCount(count);
          setTimeout(() => setSyncedCount(null), 4000);
        }
      });
      setShowSyncBanner(false);
      loadWorkflows();
    } catch (err) {
      console.error('Failed to manually sync workflows:', err);
    }
  };

  const handleSkipSync = () => {
    setShowSyncBanner(false);
  };
  */

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlowName.trim()) return;

    try {
      const initialSteps: IWorkflowStepData[] = [
        {
          stepId: `step-${Date.now()}-1`,
          name: '1. User Signup',
          url: 'https://httpbin.org/post',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          queryParams: {},
          bodyPayload: JSON.stringify({ email: 'user@example.com', password: 'secretpassword' }, null, 2),
          expectedStatusCode: 200,
          captureCookies: true,
          carryCookies: true,
          extractVariables: [{ varName: 'userEmail', jsonPath: 'json.email' }],
        },
        {
          stepId: `step-${Date.now()}-2`,
          name: '2. User Login',
          url: 'https://httpbin.org/post',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          queryParams: {},
          bodyPayload: JSON.stringify({ email: '{{userEmail}}', password: 'secretpassword' }, null, 2),
          expectedStatusCode: 200,
          captureCookies: true,
          carryCookies: true,
          extractVariables: [],
        },
      ];

      const res = await createWorkflow({
        name: newFlowName.trim(),
        description: newFlowDesc.trim(),
        steps: initialSteps,
      });

      setNewFlowName('');
      setNewFlowDesc('');
      setIsCreating(false);
      router.push(`/workflows/${res.workflow._id}`);
    } catch (err) {
      console.error('Failed to create workflow:', err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await deleteWorkflow(id);
      loadWorkflows();
    } catch (err) {
      console.error('Failed to delete workflow:', err);
    }
  };

  const filteredWorkflows = workflows.filter(
    (flow) =>
      flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (flow.description && flow.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getMethodBadgeClass = (method?: string) => {
    switch (method?.toUpperCase()) {
      case 'POST':
        return 'bg-amber-950/60 text-amber-300';
      case 'PUT':
        return 'bg-blue-950/60 text-blue-300';
      case 'DELETE':
        return 'bg-rose-950/60 text-rose-300';
      default:
        return 'bg-emerald-950/60 text-emerald-300';
    }
  };

  return (
    <div
      className="min-h-screen px-3.5 sm:px-6 py-4 sm:py-8 font-sans touch-manipulation transition-colors duration-200"
      style={{
        backgroundColor: 'var(--color-canvas, #09090b)',
        color: 'var(--color-text-primary, #f5f0e8)',
      }}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Sleek Minimal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Workflows</h1>
              <p className="text-xs text-neutral-400 mt-0.5">Automate and test multi-step API journeys</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowAIModal(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[44px] bg-[#1a1a1e] hover:bg-[#242429] text-neutral-200 hover:text-white font-semibold text-xs rounded-md transition-all border border-neutral-800 cursor-pointer shadow-sm touch-press"
              title="Import workflow from Cursor, Claude Code, or terminal agent"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF6C37]" />
              <span>AI Agent Import</span>
            </button>

            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-[#FF6C37] hover:bg-[#FF8A5C] text-white font-semibold text-xs rounded-md transition-all border-none cursor-pointer shadow-md touch-press"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Create Workflow</span>
            </button>
          </div>
        </div>

        {/* Local Workflows Sync Prompt Banner - Commented out for local-first Putman setup (no cloud MongoDB sync) */}
        {/*
        {showSyncBanner && (
          <div className="p-4 bg-[#121214] rounded-lg border-none flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <CloudOff className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                  Local Device Workflows Detected
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Do you want to sync your locally created workflows to your cloud database account?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-3.5 py-1.5 bg-[#f5f0e8] hover:bg-[#e6e1d9] text-black font-bold text-xs rounded-md border-none cursor-pointer transition-colors"
              >
                {isSyncing ? 'Syncing...' : 'Yes, Sync to Cloud'}
              </button>
              <button
                type="button"
                onClick={handleSkipSync}
                className="px-3 py-1.5 bg-[#161619] hover:bg-[#242429] text-neutral-400 hover:text-white text-xs rounded-md border-none cursor-pointer transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        )}
        */}

        {/* Minimal Search & Count Bar */}
        <div className="flex items-center justify-between gap-3 bg-neutral-950 p-2.5 rounded-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-white pl-9 pr-4 py-1.5 rounded-lg text-xs outline-none placeholder:text-neutral-600 border-none"
            />
          </div>

          <div className="text-xs text-neutral-500 font-mono pr-2 shrink-0">
            {filteredWorkflows.length} {filteredWorkflows.length === 1 ? 'workflow' : 'workflows'}
          </div>
        </div>

        {/* Create Workflow Modal */}
        <AnimatePresence>
          {isCreating && (
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
                className="bg-neutral-950 p-6 rounded-2xl max-w-md w-full space-y-5 border-none shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Create Workflow</h3>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="text-neutral-500 hover:text-white text-sm"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5 font-medium">Workflow Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Checkout Journey"
                      value={newFlowName}
                      onChange={(e) => setNewFlowName(e.target.value)}
                      className="w-full bg-neutral-900 text-white px-3.5 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#FF6C37]/50 border-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5 font-medium font-sans">Description (Optional)</label>
                    <textarea
                      rows={3}
                      placeholder="Brief description of this API test flow..."
                      value={newFlowDesc}
                      onChange={(e) => setNewFlowDesc(e.target.value)}
                      className="w-full bg-neutral-900 text-white px-3.5 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#FF6C37]/50 border-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-3.5 py-1.5 bg-[#1a1a1e] text-neutral-300 hover:bg-[#242429] text-xs font-medium rounded-md border-none cursor-pointer touch-press"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#FF6C37] hover:bg-[#FF8A5C] text-white font-bold text-xs rounded-md border-none transition-colors cursor-pointer touch-press shadow-sm"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Workflows Grid */}
        {loading ? (
          <WorkflowsSkeleton />
        ) : filteredWorkflows.length === 0 ? (
          <div className="p-16 bg-[#121214] rounded-lg text-center space-y-3">
            <Layers className="w-8 h-8 text-neutral-600 mx-auto" />
            <h3 className="text-sm font-semibold text-white">
              {searchQuery ? 'No workflows match your search' : 'No workflows yet'}
            </h3>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              Create a workflow to chain multi-step API requests together.
            </p>
            <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
              <button
                onClick={() => setShowAIModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1a1a1e] hover:bg-[#242429] text-neutral-200 text-xs font-semibold rounded-md border border-neutral-800 transition-colors shadow-sm touch-press cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FF6C37]" /> AI Agent Import
              </button>
              <button
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF6C37] hover:bg-[#FF8A5C] text-white text-xs font-bold rounded-md border-none transition-colors shadow-sm touch-press cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" /> Create Workflow
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredWorkflows.map((flow) => (
              <div
                key={flow._id}
                onClick={() => router.push(`/workflows/${flow._id}`)}
                className="p-5 bg-[#121214] hover:bg-[#1a1a1e] rounded-lg cursor-pointer transition-all space-y-4 group border-none flex flex-col justify-between touch-card"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-white group-hover:text-[#FF8A5C] transition-colors">
                      {flow.name}
                    </h3>

                    <button
                      onClick={(e) => handleDelete(flow._id, e)}
                      className="p-1 text-neutral-500 hover:text-red-400 hover:bg-[#242429] rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete Workflow"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {flow.description && (
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {flow.description}
                    </p>
                  )}
                </div>

                {/* Steps Pipeline Badge Strip */}
                {flow.steps && flow.steps.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {flow.steps.slice(0, 5).map((s, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold ${getMethodBadgeClass(s.method)}`}>
                          {s.method}
                        </span>
                        {idx < Math.min(flow.steps.length, 5) - 1 && (
                          <ChevronRight className="w-3 h-3 text-neutral-700" />
                        )}
                      </div>
                    ))}
                    {flow.steps.length > 5 && (
                      <span className="text-[10px] text-neutral-500 font-mono font-medium">
                        +{flow.steps.length - 5}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer Info & Actions */}
                <div className="flex items-center justify-between text-xs text-neutral-500 pt-3 border-t border-neutral-900">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px]">
                      {flow.steps?.length || 0} {flow.steps?.length === 1 ? 'step' : 'steps'}
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#161619] text-amber-300 rounded text-[10px] font-mono border-none" title="Stored locally on device (LocalStorage)">
                      <CloudOff className="w-3 h-3 text-amber-400" /> Local
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/workflows/${flow._id}/report`);
                      }}
                      className="px-2.5 py-1 bg-[#FF6C37] hover:bg-[#FF8A5C] text-white rounded-md text-xs font-bold transition-colors flex items-center gap-1 border-none touch-press shadow-sm"
                    >
                      <Play className="w-3 h-3 fill-current text-white" /> Run
                    </button>

                    <span className="text-xs font-medium text-neutral-400 group-hover:text-white transition-colors">
                      Edit →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Agent Import Modal */}
        <AIAgentImportModal isOpen={showAIModal} onClose={() => setShowAIModal(false)} />
      </div>
    </div>
  );
}
