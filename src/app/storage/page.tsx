'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HardDrive,
  Layers,
  Trash2,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Key,
  Search,
  Check,
  AlertTriangle,
  Upload,
  Download,
  Eye,
  EyeOff,
  Copy,
  FileCode,
} from 'lucide-react';
import {
  getDecoupledWorkflows,
  deleteLocalWorkflow,
  deleteWorkflowStep,
  exportLocalWorkflowsJSON,
  importLocalWorkflowsJSON,
  getSeparatedApiDataStore,
  deleteSeparatedApiDataKey,
  exportApiDataJSON,
  importApiDataJSON,
  getAllRawLocalStorageItems,
  deleteRawLocalStorageKey,
  ApiCarriedDataEntry,
} from '@/lib/workflowLocalStorage';
import { WorkflowData } from '@/lib/api';

export default function StorageAnalyticsPage() {
  // 3 Tabs: 'api_workflows' | 'key_values' | 'extras'
  const [activeTab, setActiveTab] = useState<'api_workflows' | 'key_values' | 'extras'>('api_workflows');

  // Storage State
  const [decoupledWorkflows, setDecoupledWorkflows] = useState<WorkflowData[]>([]);
  const [apiDataStore, setApiDataStore] = useState<Record<string, ApiCarriedDataEntry>>({});
  const [rawStorageItems, setRawStorageItems] = useState<
    {
      key: string;
      sizeBytes: number;
      valuePreview: string;
      category: 'workflow' | 'api-data' | 'runs' | 'variable' | 'setting' | 'other';
    }[]
  >([]);

  // Search, Filter & Feedback
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedWorkflowFilter, setSelectedWorkflowFilter] = useState<string>('all');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Hidden/Revealed Eye state for Table values
  const [revealedValues, setRevealedValues] = useState<Record<string, boolean>>({});

  // 1. Separate Import Modal for APIs
  const [isApiImportModalOpen, setIsApiImportModalOpen] = useState<boolean>(false);
  const [apiImportJson, setApiImportJson] = useState<string>('');

  // 2. Separate Import Modal for Keys
  const [isKeyImportModalOpen, setIsKeyImportModalOpen] = useState<boolean>(false);
  const [keyImportJson, setKeyImportJson] = useState<string>('');

  const loadAllStorageData = () => {
    setDecoupledWorkflows(getDecoupledWorkflows());
    setApiDataStore(getSeparatedApiDataStore());
    setRawStorageItems(getAllRawLocalStorageItems());
  };

  useEffect(() => {
    loadAllStorageData();
    const handleStorageChange = () => loadAllStorageData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const toggleRevealValue = (id: string) => {
    setRevealedValues((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const downloadJsonFile = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- 1. APIs: Export & Import Handlers ---
  const handleExportApis = () => {
    const jsonStr = exportLocalWorkflowsJSON();
    downloadJsonFile(jsonStr, `putman_api_configurations_${Date.now()}.json`);
    showNotification('success', 'Exported API configurations');
  };

  const handleExecuteApiImport = () => {
    if (!apiImportJson.trim()) {
      showNotification('error', 'Please paste valid API JSON data or select a file.');
      return;
    }
    try {
      const count = importLocalWorkflowsJSON(apiImportJson);
      showNotification('success', `Imported ${count} API workflow(s)!`);
      loadAllStorageData();
      setIsApiImportModalOpen(false);
      setApiImportJson('');
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to import API JSON.');
    }
  };

  const handleApiFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setApiImportJson((event.target?.result as string) || '');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --- 2. Keys: Export & Import Handlers ---
  const handleExportKeys = () => {
    const jsonStr = exportApiDataJSON();
    downloadJsonFile(jsonStr, `putman_keys_and_values_${Date.now()}.json`);
    showNotification('success', 'Exported key-value data');
  };

  const handleExecuteKeyImport = () => {
    if (!keyImportJson.trim()) {
      showNotification('error', 'Please paste valid Key-Values JSON or select a file.');
      return;
    }
    try {
      const res = importApiDataJSON(keyImportJson);
      showNotification('success', `Imported ${res.importedApiEntries} key-value entries!`);
      loadAllStorageData();
      setIsKeyImportModalOpen(false);
      setKeyImportJson('');
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to import Key-Values JSON.');
    }
  };

  const handleKeyFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setKeyImportJson((event.target?.result as string) || '');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --- Deletion Handlers ---
  const handleDeleteRequest = (workflowId: string, stepId: string, requestName: string) => {
    if (confirm(`Delete request "${requestName}"?`)) {
      deleteWorkflowStep(workflowId, stepId);
      loadAllStorageData();
      showNotification('success', `Deleted request "${requestName}"`);
    }
  };

  const handleDeleteWorkflow = (workflowId: string, workflowName: string) => {
    if (confirm(`Delete entire workflow "${workflowName}" and all its requests?`)) {
      deleteLocalWorkflow(workflowId);
      loadAllStorageData();
      showNotification('success', `Deleted workflow "${workflowName}"`);
    }
  };

  const handleDeleteKeyItem = (item: {
    workflowId: string;
    stepId: string;
    category: 'Header' | 'Query' | 'Body';
    key: string;
    requestName: string;
  }) => {
    if (confirm(`Delete ${item.category} key "${item.key}" from "${item.requestName}"?`)) {
      if (item.category === 'Header') {
        deleteSeparatedApiDataKey(item.workflowId, item.stepId, 'headers', item.key, false);
      } else if (item.category === 'Query') {
        deleteSeparatedApiDataKey(item.workflowId, item.stepId, 'queryParams', item.key, false);
      } else if (item.category === 'Body') {
        try {
          const store = getSeparatedApiDataStore();
          const dataKey = `${item.workflowId}::${item.stepId}`;
          const entry = store[dataKey] || (item.stepId ? store[item.stepId] : undefined);
          if (entry && entry.bodyPayload) {
            const parsed = JSON.parse(entry.bodyPayload);
            delete parsed[item.key];
            entry.bodyPayload = Object.keys(parsed).length > 0 ? JSON.stringify(parsed, null, 2) : '';
            store[dataKey] = entry;
            localStorage.setItem('wakeup_local_api_data_v1', JSON.stringify(store));
          }
        } catch {}
      }
      loadAllStorageData();
      showNotification('success', `Deleted "${item.key}"`);
    }
  };

  const handleDeleteExtraItem = (key: string) => {
    if (confirm(`Delete extra item "${key}" from LocalStorage?`)) {
      deleteRawLocalStorageKey(key);
      loadAllStorageData();
      showNotification('success', `Deleted "${key}"`);
    }
  };

  const handleClearAllExtras = () => {
    if (
      confirm(
        'Clear all extra data from LocalStorage? (API workflows and key values will remain safe)'
      )
    ) {
      const keysToDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k !== 'wakeup_local_workflows_v1' && k !== 'wakeup_local_api_data_v1') {
          keysToDelete.push(k);
        }
      }
      for (const k of keysToDelete) {
        localStorage.removeItem(k);
      }
      loadAllStorageData();
      showNotification('success', 'Cleared all extra data from LocalStorage');
    }
  };

  // =========================================================================
  // TAB 1 DATA: Overview list of all saved requests across workflows
  // =========================================================================
  const allRequests = useMemo(() => {
    const list: {
      workflowId: string;
      workflowName: string;
      stepId: string;
      name: string;
      method: string;
      url: string;
    }[] = [];

    for (const wf of decoupledWorkflows) {
      for (const st of wf.steps || []) {
        list.push({
          workflowId: wf._id,
          workflowName: wf.name || 'Untitled Workflow',
          stepId: st.stepId || '',
          name: st.name || 'Untitled Request',
          method: (st.method || 'GET').toUpperCase(),
          url: st.url || '',
        });
      }
    }

    const q = searchQuery.toLowerCase().trim();
    return list.filter((item) => {
      if (selectedWorkflowFilter !== 'all' && item.workflowId !== selectedWorkflowFilter) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q) ||
        item.workflowName.toLowerCase().includes(q) ||
        item.method.toLowerCase().includes(q)
      );
    });
  }, [decoupledWorkflows, searchQuery, selectedWorkflowFilter]);

  // =========================================================================
  // TAB 2 DATA: Flat table data of Type, API Request, Key, Value
  // =========================================================================
  const allKeyValues = useMemo(() => {
    const items: {
      id: string;
      workflowId: string;
      stepId: string;
      requestName: string;
      workflowName: string;
      category: 'Header' | 'Query' | 'Body';
      key: string;
      value: string;
    }[] = [];

    for (const [_, entry] of Object.entries(apiDataStore)) {
      // 1. Headers
      for (const [k, v] of Object.entries(entry.headers || {})) {
        items.push({
          id: `${entry.workflowId}:${entry.stepId}:h:${k}`,
          workflowId: entry.workflowId,
          stepId: entry.stepId,
          requestName: entry.stepName || 'API Request',
          workflowName: entry.workflowName || 'Workflow',
          category: 'Header',
          key: k,
          value: String(v),
        });
      }

      // 2. Query Params
      for (const [k, v] of Object.entries(entry.queryParams || {})) {
        items.push({
          id: `${entry.workflowId}:${entry.stepId}:q:${k}`,
          workflowId: entry.workflowId,
          stepId: entry.stepId,
          requestName: entry.stepName || 'API Request',
          workflowName: entry.workflowName || 'Workflow',
          category: 'Query',
          key: k,
          value: String(v),
        });
      }

      // 3. Body Keys
      if (entry.bodyPayload && entry.bodyPayload.trim() !== '') {
        try {
          const parsed = JSON.parse(entry.bodyPayload);
          if (typeof parsed === 'object' && parsed !== null) {
            for (const [k, v] of Object.entries(parsed)) {
              items.push({
                id: `${entry.workflowId}:${entry.stepId}:b:${k}`,
                workflowId: entry.workflowId,
                stepId: entry.stepId,
                requestName: entry.stepName || 'API Request',
                workflowName: entry.workflowName || 'Workflow',
                category: 'Body',
                key: k,
                value: typeof v === 'object' ? JSON.stringify(v) : String(v),
              });
            }
          }
        } catch {
          items.push({
            id: `${entry.workflowId}:${entry.stepId}:b:raw`,
            workflowId: entry.workflowId,
            stepId: entry.stepId,
            requestName: entry.stepName || 'API Request',
            workflowName: entry.workflowName || 'Workflow',
            category: 'Body',
            key: 'payload',
            value: entry.bodyPayload,
          });
        }
      }
    }

    const q = searchQuery.toLowerCase().trim();
    if (!q) return items;

    return items.filter(
      (item) =>
        item.key.toLowerCase().includes(q) ||
        item.value.toLowerCase().includes(q) ||
        item.requestName.toLowerCase().includes(q) ||
        item.workflowName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [apiDataStore, searchQuery]);

  // =========================================================================
  // TAB 3 DATA: All things present in LocalStorage other than APIs
  // =========================================================================
  const extraStorageItems = useMemo(() => {
    if (typeof window === 'undefined') return [];
    const items: {
      key: string;
      description: string;
      sizeBytes: number;
      preview: string;
    }[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;

      if (k === 'wakeup_local_workflows_v1' || k === 'wakeup_local_api_data_v1') {
        continue;
      }

      const val = localStorage.getItem(k) || '';
      const sizeBytes = (k.length + val.length) * 2;

      let description = 'Browser Item';
      if (k.startsWith('wakeup_local_runs_')) {
        description = 'Execution Run Log';
      } else if (k === 'wakeup_local_variables_v1') {
        description = 'Session Variables & Cookies';
      } else if (k.startsWith('putman_user') || k.startsWith('wakeup_user')) {
        description = 'User Profile Data';
      } else if (k === 'putman_username') {
        description = 'Username Setting';
      } else if (k === 'putman_theme') {
        description = 'Theme Preference';
      } else if (k.startsWith('wakeup_auth_token')) {
        description = 'Auth Token';
      } else if (k === 'wakeup_cloud_sync_enabled') {
        description = 'Cloud Sync Setting';
      } else if (k === 'wakeup_seeded_sample_v1') {
        description = 'Initial Setup Flag';
      }

      let preview = val;
      if (preview.length > 80) {
        preview = preview.slice(0, 80) + '...';
      }

      items.push({
        key: k,
        description,
        sizeBytes,
        preview,
      });
    }

    const q = searchQuery.toLowerCase().trim();
    const sorted = items.sort((a, b) => b.sizeBytes - a.sizeBytes);
    if (!q) return sorted;

    return sorted.filter(
      (item) =>
        item.key.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.preview.toLowerCase().includes(q)
    );
  }, [rawStorageItems, searchQuery]);

  const getMethodBadgeClass = (method: string) => {
    switch (method.toUpperCase()) {
      case 'POST':
        return 'bg-amber-500/15 text-amber-400';
      case 'PUT':
        return 'bg-sky-500/15 text-sky-400';
      case 'DELETE':
        return 'bg-rose-500/15 text-rose-400';
      case 'PATCH':
        return 'bg-purple-500/15 text-purple-400';
      default:
        return 'bg-emerald-500/15 text-emerald-400';
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'Header':
        return 'bg-sky-500/15 text-sky-400';
      case 'Query':
        return 'bg-amber-500/15 text-amber-400';
      case 'Body':
        return 'bg-purple-500/15 text-purple-400';
      default:
        return 'bg-zinc-800 text-zinc-300';
    }
  };

  return (
    <div
      className="min-h-screen px-4 sm:px-8 py-6 font-sans transition-colors duration-200"
      style={{
        backgroundColor: 'var(--color-canvas, #09090b)',
        color: 'var(--color-text-primary, #f4f4f5)',
      }}
    >
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Top Header - Zero Borders */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors"
              title="Back to Profile"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-amber-400" />
                <h1 className="text-xl font-bold tracking-tight text-white font-mono">
                  Storage
                </h1>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Overview of saved requests, keys and values, and extra browser storage.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadAllStorageData}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Alert - Zero Borders */}
        <AnimatePresence>
          {feedbackMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className={`p-2.5 rounded-xl text-xs font-mono flex items-center gap-2 ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-950/70 text-emerald-300'
                  : 'bg-rose-950/70 text-rose-300'
              }`}
            >
              {feedbackMsg.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Seamless 3-Tab Pill Switcher - Zero Borders */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900/60 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('api_workflows');
              setSearchQuery('');
            }}
            className={`flex-1 py-2 px-3 text-xs font-bold font-mono rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'api_workflows'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>API and Workflows</span>
            <span className="px-1.5 py-0.2 rounded-full bg-zinc-900 text-[10px] text-zinc-400">
              {allRequests.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('key_values');
              setSearchQuery('');
            }}
            className={`flex-1 py-2 px-3 text-xs font-bold font-mono rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'key_values'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/40'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Key Values</span>
            <span className="px-1.5 py-0.2 rounded-full bg-zinc-900 text-[10px] text-zinc-400">
              {allKeyValues.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('extras');
              setSearchQuery('');
            }}
            className={`flex-1 py-2 px-3 text-xs font-bold font-mono rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'extras'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Extras</span>
            <span className="px-1.5 py-0.2 rounded-full bg-zinc-900 text-[10px] text-zinc-400">
              {extraStorageItems.length}
            </span>
          </button>
        </div>

        {/* Global Search Bar - Zero Borders */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder={
              activeTab === 'api_workflows'
                ? 'Search requests by name, method, or URL...'
                : activeTab === 'key_values'
                ? 'Search by type, API request, key, or value...'
                : 'Search extra storage items...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-900/80 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:bg-zinc-900 font-mono transition-colors"
          />
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: API and Workflows (Separate Export & Import, Zero Borders)          */}
        {/* ========================================================================= */}
        {activeTab === 'api_workflows' && (
          <div className="space-y-3">
            {/* Dedicated API Toolbar: Workflow Filter & Separate Export/Import */}
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-[11px]">Workflow:</span>
                <select
                  value={selectedWorkflowFilter}
                  onChange={(e) => setSelectedWorkflowFilter(e.target.value)}
                  className="bg-zinc-900 text-zinc-300 text-xs px-2.5 py-1 rounded-lg focus:outline-none font-mono cursor-pointer"
                >
                  <option value="all">All Workflows ({decoupledWorkflows.length})</option>
                  {decoupledWorkflows.map((wf) => (
                    <option key={wf._id} value={wf._id}>
                      {wf.name} ({wf.steps?.length || 0})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dedicated API Export & Import */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsApiImportModalOpen(true)}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Import API configurations from JSON file"
                >
                  <Upload className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Import APIs</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportApis}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Export all API configurations as JSON"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Export APIs</span>
                </button>
              </div>
            </div>

            {/* List View of All Saved Requests */}
            {allRequests.length === 0 ? (
              <div className="text-center py-12 p-6 rounded-2xl bg-zinc-900/30 space-y-2">
                <Layers className="w-7 h-7 text-zinc-600 mx-auto" />
                <h3 className="text-xs font-bold text-zinc-400 font-mono">No Requests Found</h3>
                <p className="text-[11px] text-zinc-500">
                  {searchQuery ? `No requests matching "${searchQuery}"` : 'No API requests saved yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {allRequests.map((req) => (
                  <div
                    key={`${req.workflowId}-${req.stepId}`}
                    className="p-3 bg-zinc-900/50 hover:bg-zinc-900/80 rounded-xl flex items-center justify-between gap-3 transition-colors text-xs font-mono"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${getMethodBadgeClass(
                          req.method
                        )}`}
                      >
                        {req.method}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-zinc-100 truncate">{req.name}</div>
                        <div className="text-[11px] text-zinc-500 truncate max-w-lg mt-0.5">
                          {req.url || '<No URL configured>'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 text-[10px]">
                        {req.workflowName}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDeleteRequest(req.workflowId, req.stepId, req.name)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Delete request"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Workflow Level Quick Management */}
            {decoupledWorkflows.length > 0 && (
              <div className="pt-3 space-y-2">
                <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-mono">
                  Saved Workflows ({decoupledWorkflows.length})
                </div>
                <div className="space-y-1.5 font-mono text-xs">
                  {decoupledWorkflows.map((wf) => (
                    <div
                      key={wf._id}
                      className="p-2.5 bg-zinc-900/30 hover:bg-zinc-900/60 rounded-xl flex items-center justify-between gap-2 transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-bold text-zinc-300 truncate">{wf.name}</span>
                        <span className="text-[10px] text-zinc-500 shrink-0">
                          ({wf.steps?.length || 0} requests)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteWorkflow(wf._id, wf.name)}
                        className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                        title="Delete entire workflow"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: Key Values (TABLE FORMAT: Type | API Request | Key | Value | Delete) */}
        {/* ========================================================================= */}
        {activeTab === 'key_values' && (
          <div className="space-y-3">
            {/* Dedicated Keys Toolbar: Separate Export & Import */}
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
              <span className="text-zinc-500 text-[11px]">
                {allKeyValues.length} key-value pair(s) stored
              </span>

              {/* Dedicated Keys Export & Import */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsKeyImportModalOpen(true)}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Import keys and values from JSON file"
                >
                  <Upload className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Import Keys</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportKeys}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Export all keys and values as JSON"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Export Keys</span>
                </button>
              </div>
            </div>

            {/* Table View of Key Values - Zero Borders */}
            {allKeyValues.length === 0 ? (
              <div className="text-center py-12 p-6 rounded-2xl bg-zinc-900/30 space-y-2">
                <Key className="w-7 h-7 text-zinc-600 mx-auto" />
                <h3 className="text-xs font-bold text-zinc-400 font-mono">No Keys or Values Found</h3>
                <p className="text-[11px] text-zinc-500">
                  {searchQuery ? `No matches for "${searchQuery}"` : 'No keys or values stored.'}
                </p>
              </div>
            ) : (
              <div className="bg-zinc-900/50 rounded-2xl overflow-hidden font-mono text-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-zinc-900/80 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">API Request</th>
                        <th className="py-2.5 px-3">Key</th>
                        <th className="py-2.5 px-3">Value</th>
                        <th className="py-2.5 px-3 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-0">
                      {allKeyValues.map((item) => {
                        const isRevealed = Boolean(revealedValues[item.id]);

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-zinc-850/50 transition-colors"
                          >
                            {/* 1. Type: Header, Query, Body */}
                            <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${getTypeBadgeClass(
                                  item.category
                                )}`}
                              >
                                {item.category}
                              </span>
                            </td>

                            {/* 2. API Request */}
                            <td className="py-2.5 px-3 align-middle">
                              <div className="font-bold text-zinc-200 truncate max-w-[160px] sm:max-w-[200px]">
                                {item.requestName}
                              </div>
                              <div className="text-[10px] text-zinc-500 truncate max-w-[160px] sm:max-w-[200px]">
                                {item.workflowName}
                              </div>
                            </td>

                            {/* 3. Key */}
                            <td className="py-2.5 px-3 align-middle font-bold text-zinc-100 whitespace-nowrap">
                              {item.key}
                            </td>

                            {/* 4. Value with Eye Toggle (Hidden by Default) */}
                            <td className="py-2.5 px-3 align-middle">
                              <div className="flex items-center gap-2 max-w-xs sm:max-w-md">
                                {isRevealed ? (
                                  <span className="text-zinc-200 break-all select-all text-[11px] bg-zinc-950/60 px-2 py-1 rounded">
                                    {item.value === '' ? (
                                      <span className="text-zinc-500 italic">&lt;empty&gt;</span>
                                    ) : (
                                      item.value
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-zinc-500 font-mono tracking-widest select-none text-xs bg-zinc-950/40 px-2 py-1 rounded">
                                    ••••••••
                                  </span>
                                )}

                                {/* Eye Icon Toggle */}
                                <button
                                  type="button"
                                  onClick={() => toggleRevealValue(item.id)}
                                  className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors shrink-0"
                                  title={isRevealed ? 'Hide value' : 'Show value'}
                                >
                                  {isRevealed ? (
                                    <EyeOff className="w-3.5 h-3.5" />
                                  ) : (
                                    <Eye className="w-3.5 h-3.5 text-zinc-400" />
                                  )}
                                </button>

                                {/* Copy Button */}
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(item.value, item.id)}
                                  className="p-1 text-zinc-500 hover:text-white rounded hover:bg-zinc-800 transition-colors shrink-0"
                                  title="Copy value"
                                >
                                  {copiedKey === item.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* 5. Delete Action Only */}
                            <td className="py-2.5 px-3 align-middle text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleDeleteKeyItem(item)}
                                className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                title="Delete key"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: Extras (All Things Present in LocalStorage Other than APIs)        */}
        {/* ========================================================================= */}
        {activeTab === 'extras' && (
          <div className="space-y-3 font-mono text-xs">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 text-[11px]">
                {extraStorageItems.length} extra item(s) in LocalStorage
              </span>
              {extraStorageItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllExtras}
                  className="px-2.5 py-1 bg-rose-950/30 hover:bg-rose-950/50 text-rose-300 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Clear All Extras
                </button>
              )}
            </div>

            {/* List of All Extra Items in LocalStorage */}
            {extraStorageItems.length === 0 ? (
              <div className="text-center py-12 p-6 rounded-2xl bg-zinc-900/30 space-y-2">
                <Sparkles className="w-7 h-7 text-zinc-600 mx-auto" />
                <h3 className="text-xs font-bold text-zinc-400 font-mono">No Extra Items Found</h3>
                <p className="text-[11px] text-zinc-500">
                  {searchQuery ? `No matches for "${searchQuery}"` : 'LocalStorage has no extra non-API items.'}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {extraStorageItems.map((item) => (
                  <div
                    key={item.key}
                    className="p-3 bg-zinc-900/50 hover:bg-zinc-900/80 rounded-xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-zinc-100">{item.key}</span>
                        <span className="px-2 py-0.2 rounded-full bg-zinc-800 text-[10px] text-zinc-400">
                          {item.description}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {(item.sizeBytes / 1024).toFixed(2)} KB
                        </span>
                      </div>

                      <div className="text-zinc-400 text-[11px] truncate max-w-xl bg-zinc-950/40 p-1.5 rounded-lg select-all">
                        {item.preview}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteExtraItem(item.key)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Delete extra item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SEPARATE MODAL 1: Import APIs (Dedicated for Tab 1)                       */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {isApiImportModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-zinc-900 rounded-2xl p-4 shadow-2xl space-y-3"
              >
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    Import API Configurations
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsApiImportModalOpen(false);
                      setApiImportJson('');
                    }}
                    className="p-1 text-zinc-400 hover:text-white rounded"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Paste JSON or select file:</span>
                  <label className="text-sky-400 hover:text-sky-300 cursor-pointer flex items-center gap-1 font-bold">
                    <FileCode className="w-3 h-3" />
                    <span>Choose file</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleApiFileInputChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <textarea
                  rows={7}
                  value={apiImportJson}
                  onChange={(e) => setApiImportJson(e.target.value)}
                  placeholder="Paste API workflow blueprint JSON here..."
                  className="w-full p-2.5 text-xs bg-zinc-950 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none font-mono"
                />

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsApiImportModalOpen(false);
                      setApiImportJson('');
                    }}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteApiImport}
                    className="px-3.5 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                  >
                    Import APIs
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* SEPARATE MODAL 2: Import Key Values (Dedicated for Tab 2)                 */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {isKeyImportModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-zinc-900 rounded-2xl p-4 shadow-2xl space-y-3"
              >
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    Import Key Values Data
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsKeyImportModalOpen(false);
                      setKeyImportJson('');
                    }}
                    className="p-1 text-zinc-400 hover:text-white rounded"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Paste JSON or select file:</span>
                  <label className="text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1 font-bold">
                    <FileCode className="w-3 h-3" />
                    <span>Choose file</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleKeyFileInputChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <textarea
                  rows={7}
                  value={keyImportJson}
                  onChange={(e) => setKeyImportJson(e.target.value)}
                  placeholder="Paste Key Values JSON here..."
                  className="w-full p-2.5 text-xs bg-zinc-950 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none font-mono"
                />

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsKeyImportModalOpen(false);
                      setKeyImportJson('');
                    }}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteKeyImport}
                    className="px-3.5 py-1 bg-[#FF6C37] hover:bg-[#FF8A5C] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                  >
                    Import Keys
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
