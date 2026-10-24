'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  User as UserIcon,
  Menu,
  X,
  Globe,
  Sparkles,
  Code,
  Key,
  Download,
  GitBranch,
  History,
  FileText,
  Layers,
  Palette,
  Save,
  Check,
  RefreshCw,
  Play,
  Database,
} from 'lucide-react';
import Image from 'next/image';
import { UserData } from '@/lib/api';
import { exportLocalWorkflowsJSON } from '@/lib/workflowLocalStorage';
import { useWorkflowHeader } from '@/core/workflowHeaderContext';
import PutmanLogo from '@/components/PutmanLogo';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { headerState } = useWorkflowHeader();
  const [localUser, setLocalUser] = useState<UserData | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isWorkflowEditor = pathname.startsWith('/workflows/') && pathname !== '/workflows' && !pathname.endsWith('/report');

  useEffect(() => {
    const syncUser = () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('putman_user') || localStorage.getItem('wakeup_user');
        if (stored) {
          try {
            setLocalUser(JSON.parse(stored));
          } catch {
            setLocalUser(null);
          }
        } else {
          setLocalUser({
            id: 'guest-local-user',
            email: 'dev@putman.local',
            name: 'dev',
            provider: 'credentials',
          });
        }
      }
    };

    syncUser();
    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const activeUser = localUser;

  const triggerWorkflowEvent = (eventName: string) => {
    setIsMenuOpen(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventName));
    }
  };

  const handleExportBackup = () => {
    setIsMenuOpen(false);
    if (typeof window !== 'undefined') {
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
    }
  };

  if (pathname === '/') {
    return null;
  }

  return (
    <header
      className="w-full border-none sticky top-0 z-50 font-sans transition-colors duration-200"
      style={{
        backgroundColor: 'var(--color-surface, #121214)',
      }}
    >
      <div className="w-full px-3 sm:px-4 py-1.5 flex items-center justify-between gap-3">
        {/* Left Side: [ ☰ Hamburger Icon ] -> [ Website Icon ] -> Putman -> / -> [ Workflow Name ] */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Hamburger Menu in Header */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 text-neutral-300 hover:text-white bg-[#1a1a1e] hover:bg-[#25252a] rounded-lg transition-all cursor-pointer border-none flex items-center justify-center shrink-0"
              title="Workflow Tools, Configs & Integrations"
              aria-label="Open Tools Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Hamburger Dropdown Popover */}
            <AnimatePresence>
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                    className="absolute left-0 mt-2 w-80 rounded-xl p-2.5 shadow-2xl z-40 font-mono text-xs space-y-2 border-none select-none max-h-[85vh] overflow-y-auto"
                    style={{
                      backgroundColor: 'var(--color-surface, #121214)',
                    }}
                  >
                    {/* Popover Header */}
                    <div className="flex items-center justify-between px-2 py-1 border-none">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Putman Menu & Tools
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsMenuOpen(false)}
                        className="text-neutral-500 hover:text-white p-0.5 rounded cursor-pointer border-none bg-transparent"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Section 1: Workflow Active Helpers (When inside a workflow editor) */}
                    {isWorkflowEditor ? (
                      <>
                        <div className="space-y-0.5">
                          <div className="px-2 pt-1 pb-0.5 text-[9px] font-bold text-[#FF8A5C] uppercase tracking-wider">
                            Workflow Helpers & Configs
                          </div>

                          {/* Auth Helpers (Moved here as requested) */}
                          <button
                            type="button"
                            onClick={() => triggerWorkflowEvent('putman:open-auth-presets')}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-900 text-neutral-300 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer border-none group"
                          >
                            <Key className="w-3.5 h-3.5 text-[#FF6C37] group-hover:text-[#FF8A5C] shrink-0 transition-colors" />
                            <div>
                              <div className="text-xs text-white font-bold group-hover:text-[#FF8A5C] transition-colors">Auth Step Helpers</div>
                              <div className="text-[10px] text-neutral-400 font-normal">Insert Google / Supabase / GitHub OAuth steps</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => triggerWorkflowEvent('putman:open-base-url')}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-900 text-neutral-300 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer border-none group"
                          >
                            <Globe className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#FF8A5C] shrink-0 transition-colors" />
                            <div>
                              <div className="text-xs text-white font-bold group-hover:text-[#FF8A5C] transition-colors">Bulk Base URL Override</div>
                              <div className="text-[10px] text-neutral-400 font-normal">Change target host/port across all steps</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => triggerWorkflowEvent('putman:open-ai-spec')}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-900 text-neutral-300 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer border-none group"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#FF8A5C] shrink-0 transition-colors" />
                            <div>
                              <div className="text-xs text-white font-bold group-hover:text-[#FF8A5C] transition-colors">Import via AI Agent (.md)</div>
                              <div className="text-[10px] text-neutral-400 font-normal">Generate steps from markdown spec file</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => triggerWorkflowEvent('putman:open-scanner')}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-900 text-neutral-300 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer border-none group"
                          >
                            <Code className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#FF8A5C] shrink-0 transition-colors" />
                            <div>
                              <div className="text-xs text-white font-bold group-hover:text-[#FF8A5C] transition-colors">Scan Code Endpoints</div>
                              <div className="text-[10px] text-neutral-400 font-normal">Extract routes from GitHub or local files</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => triggerWorkflowEvent('putman:export-json')}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-900 text-neutral-300 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer border-none group"
                          >
                            <Download className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#FF8A5C] shrink-0 transition-colors" />
                            <div>
                              <div className="text-xs text-white font-bold group-hover:text-[#FF8A5C] transition-colors">Export Workflow JSON</div>
                              <div className="text-[10px] text-neutral-400 font-normal">Download current workflow backup</div>
                            </div>
                          </button>
                        </div>

                        {/* Section 2: Integrations & Reports */}
                        <div className="space-y-0.5 pt-1 border-none">
                          <div className="px-2 pt-1 pb-0.5 text-[9px] font-bold text-neutral-500 uppercase tracking-wider">
                            Integrations & Reports
                          </div>

                          <button
                            type="button"
                            onClick={() => triggerWorkflowEvent('putman:open-github')}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-900 text-neutral-300 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer border-none group"
                          >
                            <GitBranch className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#FF8A5C] shrink-0 transition-colors" />
                            <div>
                              <div className="text-xs text-white font-bold group-hover:text-[#FF8A5C] transition-colors">GitHub Integration Center</div>
                              <div className="text-[10px] text-neutral-400 font-normal">Repo binding, webhooks, push tests</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => triggerWorkflowEvent('putman:open-history')}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-900 text-neutral-300 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer border-none group"
                          >
                            <History className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#FF8A5C] shrink-0 transition-colors" />
                            <div>
                              <div className="text-xs text-white font-bold group-hover:text-[#FF8A5C] transition-colors">Run Execution History</div>
                              <div className="text-[10px] text-neutral-400 font-normal">Past execution logs & triggers</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              router.push(`${pathname}/report`);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-900 text-neutral-300 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer border-none group"
                          >
                            <FileText className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#FF8A5C] shrink-0 transition-colors" />
                            <div>
                              <div className="text-xs text-white font-bold group-hover:text-[#FF8A5C] transition-colors">Execution Telemetry Report</div>
                              <div className="text-[10px] text-neutral-400 font-normal">Step timing, latency & breakdown</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => triggerWorkflowEvent('putman:open-guide')}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-900 text-neutral-300 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer border-none group"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#FF8A5C] shrink-0 transition-colors" />
                            <div>
                              <div className="text-xs text-white font-bold group-hover:text-[#FF8A5C] transition-colors">cURL & SDK Guide</div>
                              <div className="text-[10px] text-neutral-400 font-normal">cURL, Fetch & Python SDK snippets</div>
                            </div>
                          </button>
                        </div>
                      </>
                    ) : (
                      /* Global View Helpers (When on /workflows or /profile) */
                      <div className="space-y-0.5">
                        <div className="px-2 pt-1 pb-0.5 text-[9px] font-bold text-neutral-500 uppercase tracking-wider">
                          Quick Actions
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            router.push('/workflows');
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-900 text-neutral-300 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer border-none group"
                        >
                          <Layers className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#FF8A5C] shrink-0 transition-colors" />
                          <div>
                            <div className="text-xs text-white font-bold group-hover:text-[#FF8A5C] transition-colors">All Workflows</div>
                            <div className="text-[10px] text-neutral-400 font-normal">Browse and manage saved API flows</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={handleExportBackup}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-900 text-neutral-300 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer border-none group"
                        >
                          <Download className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#FF8A5C] shrink-0 transition-colors" />
                          <div>
                            <div className="text-xs text-white font-bold group-hover:text-[#FF8A5C] transition-colors">Export All Workflows JSON</div>
                            <div className="text-[10px] text-neutral-400 font-normal">Download full browser backup file</div>
                          </div>
                        </button>
                      </div>
                    )}

                    {/* Section 3: Navigation Links */}
                    <div className="space-y-0.5 pt-1 border-none">
                      <div className="px-2 pt-1 pb-0.5 text-[9px] font-bold text-neutral-500 uppercase tracking-wider">
                        Workspace
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          router.push('/workflows');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-900 text-neutral-300 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer border-none group"
                      >
                        <Layers className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#FF8A5C] shrink-0 transition-colors" />
                        <span className="text-xs font-medium">Workflows Home</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          router.push('/profile');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-900 text-neutral-300 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer border-none group"
                      >
                        <Palette className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#FF8A5C] shrink-0 transition-colors" />
                        <span className="text-xs font-medium">Themes & Settings</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Website Icon */}
          <Link href="/workflows" className="flex items-center shrink-0 group">
            <PutmanLogo
              size={24}
              showText={false}
              className="transition-transform group-hover:scale-105 shrink-0"
            />
          </Link>

          {/* Website Brand Name */}
          <Link href="/workflows" className="shrink-0 hover:opacity-90 transition-opacity">
            <span
              className="text-sm font-bold tracking-tight leading-none"
              style={{ color: 'var(--color-text-primary, #f5f0e8)' }}
            >
              Putman
            </span>
          </Link>

          {/* If on an active workflow page: / and workflow title (No icon, No step count text) */}
          {isWorkflowEditor && headerState && (
            <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
              <span className="text-neutral-500 font-mono text-xs select-none shrink-0">/</span>
              <input
                type="text"
                value={headerState.workflowName || ''}
                onChange={(e) => headerState.setWorkflowName(e.target.value)}
                placeholder="Workflow Title"
                className="bg-transparent text-xs sm:text-sm font-bold text-white tracking-wide hover:bg-neutral-900/50 focus:bg-neutral-900/80 focus:outline-none px-2 py-0.5 rounded transition-colors border-none max-w-[200px] sm:max-w-xs md:max-w-md truncate"
                title="Click to rename workflow"
              />
            </div>
          )}
        </div>

        {/* Right Side: Save (icon-only), Run Workflow, and User Profile Pill */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Workflow Actions (Save icon-only & Run Workflow in Header) */}
          {isWorkflowEditor && headerState && (
            <div className="flex items-center gap-1.5">
              {/* Save Button (Icon-only, no text) */}
              <button
                type="button"
                onClick={headerState.onSave}
                disabled={headerState.saving || headerState.syncState === 'autosaving'}
                className="p-1.5 rounded-lg border-none transition-all cursor-pointer bg-[#161619] hover:bg-[#222228] flex items-center justify-center shrink-0"
                title={
                  headerState.syncState === 'autosaving'
                    ? 'Auto-saving...'
                    : headerState.syncState === 'saved'
                    ? 'Saved'
                    : 'Save Workflow (Auto-saves 5s after editing)'
                }
                aria-label="Save Workflow"
              >
                {headerState.syncState === 'autosaving' ? (
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                ) : headerState.syncState === 'saved' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-[#FF6C37] shrink-0" />
                )}
              </button>

              {/* Run Workflow Button */}
              <button
                type="button"
                onClick={headerState.onRunWorkflow}
                disabled={headerState.isRunning}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FF6C37] hover:bg-[#FF8A5C] text-white font-bold text-xs rounded-lg border-none transition-all shadow-sm cursor-pointer shrink-0"
                title="Run all workflow steps sequentially"
              >
                {headerState.isRunning ? (
                  <RefreshCw className="w-3 h-3 animate-spin shrink-0 text-white" />
                ) : (
                  <Play className="w-3 h-3 fill-current shrink-0 text-white" />
                )}
                <span>{headerState.isRunning ? 'Running...' : 'Run Workflow'}</span>
              </button>
            </div>
          )}

          {/* User Profile Pill */}
          {activeUser && (
            <Link
              href="/profile"
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg hover:opacity-90 transition-all border-none shrink-0"
              style={{ backgroundColor: 'var(--color-input, #161619)' }}
              title="Open Profile & Settings"
            >
              {activeUser.avatar ? (
                <Image
                  src={activeUser.avatar}
                  alt={activeUser.name || 'User Avatar'}
                  width={18}
                  height={18}
                  className="rounded-full flex-shrink-0"
                />
              ) : (
                <div className="w-4.5 h-4.5 bg-neutral-800 flex items-center justify-center text-neutral-300 rounded-full flex-shrink-0">
                  <UserIcon className="w-3 h-3 text-neutral-300" />
                </div>
              )}
              <span
                className="text-xs font-semibold max-w-[100px] truncate"
                style={{ color: 'var(--color-text-primary, #f5f0e8)' }}
              >
                {activeUser.name || activeUser.email.split('@')[0]}
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
