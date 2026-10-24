'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  HardDrive,
  Trash2,
  Save,
  Check,
  Download,
  Upload,
  ArrowLeft,
  ChevronRight,
  Palette,
  Code,
  Database,
} from 'lucide-react';
import { useTheme } from '@/core/theme/themeContext';
import {
  clearEntireLocalStorage,
  exportLocalWorkflowsJSON,
  importLocalWorkflowsJSON,
  getLocalUsername,
  setLocalUsername,
  getStorageUsageStats,
} from '@/lib/workflowLocalStorage';

export default function ProfilePage() {
  const router = useRouter();
  const { themeId, setTheme, availableThemes, editorTextColor, setEditorTextColor } = useTheme();

  // Username State
  const [username, setUsernameState] = useState<string>('Local Developer');
  const [isSavingName, setIsSavingName] = useState<boolean>(false);
  const [nameSaveMsg, setNameSaveMsg] = useState<string | null>(null);

  // Storage Metrics & Status
  const [stats, setStats] = useState({
    workflowsCount: 0,
    stepsCount: 0,
    dataItemsCount: 0,
    runsCount: 0,
    variablesCount: 0,
    cookiesCount: 0,
    bytesUsed: 0,
  });

  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedExport, setCopiedExport] = useState<boolean>(false);

  const loadData = () => {
    const currentName = getLocalUsername();
    setUsernameState(currentName);
    const usage = getStorageUsageStats();
    setStats(usage);
  };

  useEffect(() => {
    loadData();
    const handleStorageChange = () => loadData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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

  // Master wipe of local storage
  const handleClearAllData = () => {
    if (
      confirm(
        'Are you sure you want to clear ALL LocalStorage data? This permanently removes all workflows, decoupled carried data, variables, cookies, and telemetry logs.'
      )
    ) {
      clearEntireLocalStorage();
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

  return (
    <div
      className="min-h-screen px-4 sm:px-8 py-6 font-sans transition-colors duration-200"
      style={{
        backgroundColor: 'var(--color-canvas, #09090b)',
        color: 'var(--color-text-primary, #f5f0e8)',
      }}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-none">
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
                Manage your browser-saved workflows, decoupled carried data, and telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/workflows"
              className="px-3.5 py-1.5 bg-[#1a1a1e] hover:bg-[#242429] text-xs font-semibold text-neutral-200 hover:text-white rounded-lg transition-colors"
            >
              Workflows
            </Link>
          </div>
        </div>

        {/* Section 1: Username & Identity Settings */}
        <div className="p-5 bg-[#121214] rounded-xl space-y-3 border-none shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#1a1a1e] flex items-center justify-center text-neutral-200">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Local Display Name</h3>
                <p className="text-[11px] text-neutral-400">Custom name displayed across your local workspace</p>
              </div>
            </div>

            {nameSaveMsg && (
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> {nameSaveMsg}
              </span>
            )}
          </div>

          <form onSubmit={handleSaveUsername} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-0.5">
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

        {/* Section 2: Workspace Color Themes */}
        <div className="p-5 bg-[#121214] rounded-xl space-y-3 border-none shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#1a1a1e] flex items-center justify-center text-[#FF6C37]">
              <Palette className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Color Themes</h3>
              <p className="text-[11px] text-neutral-400">Choose your workspace theme (inspired by VS Code editors)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-0.5">
            {availableThemes.map((t) => {
              const isSelected = t.id === themeId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`p-3 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between gap-3 border ${
                    isSelected
                      ? 'border-[#FF6C37] bg-[#1e1e24] shadow-md ring-1 ring-[#FF6C37]/40'
                      : 'border-transparent bg-[#161619] hover:bg-[#1a1a1e]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: t.colors.canvas }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full"
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

        {/* Section 3: Request & Response Text Color */}
        <div className="p-5 bg-[#121214] rounded-xl space-y-3 border-none shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#1a1a1e] flex items-center justify-center text-amber-300">
                <Code className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Editor & Response Code Text Color</h3>
                <p className="text-[11px] text-neutral-400">Customize the font color used in request payload editors and API response bodies</p>
              </div>
            </div>

            {/* Live Preview Pill */}
            <div
              className="px-3 py-1 rounded-lg text-xs font-mono font-semibold border border-neutral-800 bg-[#09090b] self-start sm:self-auto"
              style={{ color: editorTextColor }}
            >
              preview: &#123; &quot;status&quot;: &quot;ok&quot; &#125;
            </div>
          </div>

          {/* Color Presets */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-0.5">
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
                  className={`p-2 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 border ${
                    isSelected
                      ? 'border-[#FF6C37] bg-[#1e1e24] shadow-md ring-1 ring-[#FF6C37]/40'
                      : 'border-transparent bg-[#161619] hover:bg-[#1a1a1e]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/20 inline-block shadow-sm"
                      style={{ backgroundColor: preset.hex }}
                    />
                    {isSelected && <Check className="w-3 h-3 text-[#FF6C37]" />}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-white truncate">{preset.name}</div>
                    <div className="text-[9px] font-mono text-neutral-400">{preset.hex}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: EXPLORE YOUR DATA (Local Storage) */}
        <div className="p-5 bg-[#121214] rounded-xl space-y-4 border border-neutral-850 shadow-md">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-850">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#1a1a1e] flex items-center justify-center text-[#FF8A5C]">
                <HardDrive className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-2 font-mono">
                  <span>Explore Your Data</span>
                  <span className="px-2 py-0.2 rounded text-[9px] font-mono bg-amber-950/60 text-amber-300 font-bold border border-amber-800/40">
                    LOCAL STORAGE
                  </span>
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Manage your browser-saved workflows, carried key-values, and cross-device sync
                </p>
              </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/storage"
                className="px-3 py-1 bg-[#FF6C37] hover:bg-[#FF8A5C] text-white text-[11px] font-bold rounded-md transition-all flex items-center gap-1.5 shadow-sm border-none shrink-0"
                title="Click to explore your data in your local storage"
              >
                <HardDrive className="w-3 h-3" />
                <span>Explore Your Data →</span>
              </Link>

              <button
                type="button"
                onClick={handleExportJSON}
                className="px-2.5 py-1 bg-[#1a1a1e] hover:bg-[#242429] text-[11px] font-semibold text-neutral-200 hover:text-white rounded-md transition-colors flex items-center gap-1 cursor-pointer touch-press"
                title="Download JSON backup of all workflows"
              >
                <Download className="w-3 h-3" />
                <span>{copiedExport ? 'Downloaded' : 'Backup'}</span>
              </button>

              <label className="px-2.5 py-1 bg-[#1a1a1e] hover:bg-[#242429] text-[11px] font-semibold text-neutral-200 hover:text-white rounded-md transition-colors flex items-center gap-1 cursor-pointer touch-press">
                <Upload className="w-3 h-3" />
                <span>Restore</span>
                <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
              </label>

              <button
                type="button"
                onClick={handleClearAllData}
                className="px-2.5 py-1 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 text-[11px] font-bold rounded-md transition-colors flex items-center gap-1 cursor-pointer border border-rose-900/40"
                title="Clear all browser local storage"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>Clear All Storage</span>
              </button>
            </div>
          </div>

          {importStatus && (
            <div
              className={`p-2.5 rounded-lg text-xs font-mono ${
                importStatus.type === 'success'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/40'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-900/40'
              }`}
            >
              {importStatus.text}
            </div>
          )}

          {/* Interactive "Explore Your Data" Card */}
          <Link
            href="/storage"
            className="group block p-4 bg-gradient-to-r from-[#17171d] via-[#141418] to-[#121215] hover:from-[#1c1c24] hover:to-[#16161b] rounded-xl border border-neutral-800 hover:border-amber-500/40 transition-all shadow-sm cursor-pointer select-none"
            title="Click to explore your data in your local storage"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 group-hover:bg-amber-500/20 group-hover:border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 transition-colors">
                  <Database className="w-5 h-5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors font-mono">
                      Explore Your Data in Local Storage
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[9px] bg-sky-950/60 text-sky-300 font-bold border border-sky-800/40">
                      DEDICATED EXPLORER
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 group-hover:text-neutral-300 transition-colors leading-relaxed">
                    Analyze registered API blueprints, inspect decoupled headers and parameters, search key-values, and sync between devices.
                  </p>
                </div>
              </div>

              <div className="px-4 py-2 bg-[#FF6C37] group-hover:bg-[#FF8A5C] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm shrink-0 border-none self-start sm:self-auto">
                <HardDrive className="w-3.5 h-3.5" />
                <span>Open Explorer →</span>
              </div>
            </div>
          </Link>

          {/* Quick Storage Metrics Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono pt-1">
            <div className="bg-[#18181c] p-2.5 rounded-lg border border-neutral-850">
              <div className="text-[10px] text-neutral-400 uppercase font-semibold">Registered Workflows</div>
              <div className="text-sm font-bold text-white mt-0.5">{stats.workflowsCount}</div>
            </div>
            <div className="bg-[#18181c] p-2.5 rounded-lg border border-neutral-850">
              <div className="text-[10px] text-neutral-400 uppercase font-semibold">Total Endpoints</div>
              <div className="text-sm font-bold text-white mt-0.5">{stats.stepsCount}</div>
            </div>
            <div className="bg-[#18181c] p-2.5 rounded-lg border border-neutral-850">
              <div className="text-[10px] text-neutral-400 uppercase font-semibold">Carried Keys & Payloads</div>
              <div className="text-sm font-bold text-sky-400 mt-0.5">{stats.dataItemsCount}</div>
            </div>
            <div className="bg-[#18181c] p-2.5 rounded-lg border border-neutral-850">
              <div className="text-[10px] text-neutral-400 uppercase font-semibold">Storage Used</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                {(stats.bytesUsed / 1024).toFixed(1)} KB
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
