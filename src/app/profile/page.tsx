'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User as UserIcon,
  HardDrive,
  Layers,
  Trash2,
  Save,
  Check,
  Download,
  Upload,
  Play,
  ArrowLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  Clock,
  Sparkles,
  AlertTriangle,
  Palette,
  Code,
} from 'lucide-react';
import { useTheme } from '@/core/theme/themeContext';
import {
  getLocalWorkflows,
  deleteLocalWorkflow,
  clearAllLocalWorkflows,
  exportLocalWorkflowsJSON,
  importLocalWorkflowsJSON,
  getLocalUsername,
  setLocalUsername,
  getStorageUsageStats,
} from '@/lib/workflowLocalStorage';
import { WorkflowData } from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const { themeId, setTheme, availableThemes, editorTextColor, setEditorTextColor } = useTheme();

  // Username State
  const [username, setUsernameState] = useState<string>('Local Developer');
  const [isSavingName, setIsSavingName] = useState<boolean>(false);
  const [nameSaveMsg, setNameSaveMsg] = useState<string | null>(null);

  // Storage & Workflows State
  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
  const [stats, setStats] = useState({
    workflowsCount: 0,
    stepsCount: 0,
    runsCount: 0,
    bytesUsed: 0,
  });
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedExport, setCopiedExport] = useState<boolean>(false);

  const loadData = () => {
    const currentName = getLocalUsername();
    setUsernameState(currentName);

    const wfs = getLocalWorkflows();
    setWorkflows(wfs);

    const usage = getStorageUsageStats();
    setStats(usage);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsSavingName(true);
    setLocalUsername(username.trim());
    window.dispatchEvent(new Event('storage'));

    setNameSaveMsg('Username updated!');
    setTimeout(() => {
      setNameSaveMsg(null);
      setIsSavingName(false);
    }, 2500);
  };

  const handleDeleteWorkflow = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete workflow "${name}"?`)) {
      deleteLocalWorkflow(id);
      loadData();
    }
  };

  const handleClearAllData = () => {
    if (
      confirm(
        'Are you sure you want to clear all data? This will permanently delete all registered workflows and execution run histories from your browser.'
      )
    ) {
      clearAllLocalWorkflows();
      localStorage.removeItem('putman_has_started');
      loadData();
    }
  };

  const handleExportJSON = () => {
    const jsonStr = exportLocalWorkflowsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `putman_workflows_backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 3000);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const count = importLocalWorkflowsJSON(text);
        setImportStatus({
          type: 'success',
          text: `Successfully imported ${count} workflow(s) to local storage.`,
        });
        loadData();
        setTimeout(() => setImportStatus(null), 4000);
      } catch (err: any) {
        setImportStatus({
          type: 'error',
          text: err.message || 'Invalid JSON backup format.',
        });
        setTimeout(() => setImportStatus(null), 5000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

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
      className="min-h-screen px-4 sm:px-8 py-6 font-sans transition-colors duration-200"
      style={{
        backgroundColor: 'var(--color-canvas, #09090b)',
        color: 'var(--color-text-primary, #f5f0e8)',
      }}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-none">
          <div className="flex items-center gap-3">
            <Link
              href="/workflows"
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#1a1a1e] rounded-lg transition-colors"
              title="Back to Workflows"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Developer Profile</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1a1a1e] text-emerald-400 font-bold">
                  LOCAL ONLY
                </span>
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                Manage your browser-saved workflows and local storage telemetry
              </p>
            </div>
          </div>

          <Link
            href="/workflows"
            className="px-3.5 py-1.5 bg-[#1a1a1e] hover:bg-[#242429] text-xs font-semibold text-neutral-200 hover:text-white rounded-md transition-colors"
          >
            Open Workflows →
          </Link>
        </div>

        {/* Section 1: Username & Identity Settings */}
        <div className="p-6 bg-[#121214] rounded-xl space-y-4 border-none shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#1a1a1e] flex items-center justify-center text-neutral-200">
                <UserIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Local Display Name</h3>
                <p className="text-xs text-neutral-400">Custom name displayed across your local workspace</p>
              </div>
            </div>

            {nameSaveMsg && (
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> {nameSaveMsg}
              </span>
            )}
          </div>

          <form onSubmit={handleSaveUsername} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsernameState(e.target.value)}
              placeholder="Enter your username"
              className="flex-1 bg-[#18181c] text-white text-xs font-semibold px-3.5 py-2 rounded-lg outline-none border border-neutral-800 focus:border-neutral-600"
            />
            <button
              type="submit"
              disabled={isSavingName}
              className="px-4 py-2 bg-[#FF6C37] hover:bg-[#FF8A5C] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 touch-press shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Name</span>
            </button>
          </form>
        </div>

        {/* Section: Workspace Color Themes */}
        <div className="p-6 bg-[#121214] rounded-xl space-y-4 border-none shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#1a1a1e] flex items-center justify-center text-[#FF6C37]">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Color Themes</h3>
              <p className="text-xs text-neutral-400">Choose your workspace theme (inspired by VS Code editors)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {availableThemes.map((t) => {
              const isSelected = t.id === themeId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`p-3.5 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between gap-3 border ${
                    isSelected
                      ? 'border-[#FF6C37] bg-[#1e1e24] shadow-md ring-1 ring-[#FF6C37]/40'
                      : 'border-transparent bg-[#161619] hover:bg-[#1a1a1e]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: t.colors.canvas }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: t.colors.accentHighlight }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{t.name}</div>
                      <div className="text-[10px] text-neutral-400 font-mono capitalize">{t.type}</div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-[#FF6C37]/20 text-[#FF6C37] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-[#FF6C37]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section: Request & Response Text Color */}
        <div className="p-6 bg-[#121214] rounded-xl space-y-4 border-none shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#1a1a1e] flex items-center justify-center text-amber-300">
                <Code className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Editor & Response Code Text Color</h3>
                <p className="text-xs text-neutral-400">Customize the font color used in request payload editors and API response bodies</p>
              </div>
            </div>

            {/* Live Preview Pill */}
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border border-neutral-800 bg-[#09090b] self-start sm:self-auto"
              style={{ color: editorTextColor }}
            >
              preview: &#123; &quot;status&quot;: &quot;ok&quot; &#125;
            </div>
          </div>

          {/* Color Presets */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1">
            {[
              { name: 'Crisp White', hex: '#f8fafc' },
              { name: 'Matrix Green', hex: '#4ade80' },
              { name: 'Cyber Cyan', hex: '#38bdf8' },
              { name: 'Amber Glow', hex: '#fbbf24' },
              { name: 'Neon Pink', hex: '#f472b6' },
              { name: 'Lavender Soft', hex: '#c084fc' },
            ].map((preset) => {
              const isSelected = editorTextColor.toLowerCase() === preset.hex.toLowerCase();
              return (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => setEditorTextColor(preset.hex)}
                  className={`p-2.5 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between gap-2 border ${
                    isSelected
                      ? 'border-[#FF6C37] bg-[#1e1e24] shadow-md ring-1 ring-[#FF6C37]/40'
                      : 'border-transparent bg-[#161619] hover:bg-[#1a1a1e]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className="w-4 h-4 rounded-full border border-white/20 inline-block shadow-sm"
                      style={{ backgroundColor: preset.hex }}
                    />
                    {isSelected && <Check className="w-3 h-3 text-[#FF6C37]" />}
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-white truncate">{preset.name}</div>
                    <div className="text-[9px] font-mono text-neutral-400">{preset.hex}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Hex / Color Picker */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="text-xs text-neutral-400 font-medium">Custom color:</span>
            <div className="flex items-center gap-2 bg-[#161619] px-3 py-1.5 rounded-lg border border-neutral-800">
              <input
                type="color"
                value={editorTextColor}
                onChange={(e) => setEditorTextColor(e.target.value)}
                className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                title="Choose custom color"
              />
              <input
                type="text"
                value={editorTextColor}
                onChange={(e) => setEditorTextColor(e.target.value)}
                placeholder="#f8fafc"
                className="bg-transparent text-xs font-mono text-white outline-none w-20"
              />
            </div>
            <button
              type="button"
              onClick={() => setEditorTextColor('#f8fafc')}
              className="text-xs text-neutral-400 hover:text-white underline cursor-pointer bg-transparent border-none"
            >
              Reset to Crisp White
            </button>
          </div>
        </div>

        {/* Section 2: Browser Storage Telemetry */}
        <div className="p-6 bg-[#121214] rounded-xl space-y-5 border-none shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#1a1a1e] flex items-center justify-center text-[#FF8A5C]">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Data Saved in Browser</h3>
                <p className="text-xs text-neutral-400">Private & local-first. Stored securely in your browser's LocalStorage</p>
              </div>
            </div>

            {/* Backup / Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportJSON}
                className="px-3 py-1.5 bg-[#1a1a1e] hover:bg-[#242429] text-xs font-semibold text-neutral-200 hover:text-white rounded-md transition-colors flex items-center gap-1.5 cursor-pointer touch-press"
                title="Download JSON backup"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{copiedExport ? 'Downloaded!' : 'Export JSON'}</span>
              </button>

              <label className="px-3 py-1.5 bg-[#1a1a1e] hover:bg-[#242429] text-xs font-semibold text-neutral-200 hover:text-white rounded-md transition-colors flex items-center gap-1.5 cursor-pointer touch-press">
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON</span>
                <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
              </label>
            </div>
          </div>

          {importStatus && (
            <div
              className={`p-3 rounded-lg text-xs font-mono ${
                importStatus.type === 'success'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/40'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-900/40'
              }`}
            >
              {importStatus.text}
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#18181c] p-3.5 rounded-lg">
              <div className="text-[10px] text-neutral-400 font-mono uppercase font-semibold">Registered Workflows</div>
              <div className="text-xl font-bold text-white mt-1">{stats.workflowsCount}</div>
            </div>

            <div className="bg-[#18181c] p-3.5 rounded-lg">
              <div className="text-[10px] text-neutral-400 font-mono uppercase font-semibold">Total API Steps</div>
              <div className="text-xl font-bold text-white mt-1">{stats.stepsCount}</div>
            </div>

            <div className="bg-[#18181c] p-3.5 rounded-lg">
              <div className="text-[10px] text-neutral-400 font-mono uppercase font-semibold">Saved Run Logs</div>
              <div className="text-xl font-bold text-white mt-1">{stats.runsCount}</div>
            </div>

            <div className="bg-[#18181c] p-3.5 rounded-lg">
              <div className="text-[10px] text-neutral-400 font-mono uppercase font-semibold">Storage Used</div>
              <div className="text-xl font-bold text-white mt-1">{(stats.bytesUsed / 1024).toFixed(1)} KB</div>
            </div>
          </div>
        </div>

        {/* Section 3: Registered Workflows Management (Delete Option for anything in the datas) */}
        <div className="p-6 bg-[#121214] rounded-xl space-y-4 border-none shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-850">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#1a1a1e] flex items-center justify-center text-sky-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Registered Workflows ({workflows.length})</h3>
                <p className="text-xs text-neutral-400">View or delete individual workflows saved in your browser</p>
              </div>
            </div>

            <Link
              href="/workflows"
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Create New
            </Link>
          </div>

          {workflows.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              No registered workflows in browser storage.
            </div>
          ) : (
            <div className="divide-y divide-neutral-900 overflow-hidden">
              {workflows.map((wf) => (
                <div
                  key={wf._id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#161619] px-2 rounded-lg transition-colors group"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/workflows/${wf._id}`}
                        className="text-xs font-semibold text-white hover:text-[#FF8A5C] transition-colors truncate max-w-sm"
                      >
                        {wf.name}
                      </Link>
                      <span className="text-[10px] font-mono text-neutral-500">
                        ({wf.steps?.length || 0} steps)
                      </span>
                    </div>

                    {wf.description && (
                      <p className="text-[11px] text-neutral-400 truncate max-w-md">{wf.description}</p>
                    )}

                    {/* Step Pipeline Preview */}
                    {wf.steps && wf.steps.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                        {wf.steps.slice(0, 4).map((s, idx) => (
                          <span
                            key={idx}
                            className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold ${getMethodBadgeClass(
                              s.method
                            )}`}
                          >
                            {s.method}
                          </span>
                        ))}
                        {wf.steps.length > 4 && (
                          <span className="text-[9px] text-neutral-500 font-mono">
                            +{wf.steps.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/workflows/${wf._id}/report`}
                      className="px-2.5 py-1 bg-[#FF6C37] hover:bg-[#FF8A5C] text-white text-xs font-bold rounded-md transition-colors flex items-center gap-1 touch-press shadow-sm"
                    >
                      <Play className="w-3 h-3 fill-current text-white" /> Run
                    </Link>

                    <Link
                      href={`/workflows/${wf._id}`}
                      className="px-2.5 py-1 bg-[#1a1a1e] hover:bg-[#242429] text-neutral-300 hover:text-white text-xs font-semibold rounded-md transition-colors"
                    >
                      Edit
                    </Link>

                    <button
                      onClick={() => handleDeleteWorkflow(wf._id, wf.name)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-[#242429] rounded transition-colors cursor-pointer"
                      title="Delete this workflow from browser data"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Clear All Data / Reset Storage */}
        <div className="p-6 bg-[#161214] rounded-xl border border-rose-950/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-rose-950/60 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Reset Local Data</h3>
                <p className="text-xs text-neutral-400">Permanently wipe all workflows and execution logs from your browser</p>
              </div>
            </div>

            <button
              onClick={handleClearAllData}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm touch-press"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Data</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
