'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PutmanLogo from '@/components/PutmanLogo';
import {
  ArrowRight,
  Play,
  Layers,
  Key,
  Cookie,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { getLocalWorkflows } from '@/lib/workflowLocalStorage';

export const PUTMAN_STARTED_KEY = 'putman_has_started';

export default function LandingPage() {
  const router = useRouter();
  const [hasPreviousWork, setHasPreviousWork] = useState(false);
  const [workflowCount, setWorkflowCount] = useState(0);

  useEffect(() => {
    try {
      const hasStarted = localStorage.getItem(PUTMAN_STARTED_KEY) === 'true';
      const savedWorkflows = getLocalWorkflows();
      setWorkflowCount(savedWorkflows.length);
      setHasPreviousWork(hasStarted || savedWorkflows.length > 0);
    } catch {
      // Fallback
    }
  }, []);

  const handleContinueWork = () => {
    try {
      localStorage.setItem(PUTMAN_STARTED_KEY, 'true');
    } catch {
      // Ignore
    }
    router.push('/workflows');
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Putman',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://putman.r8r.in',
    description:
      'The lightweight, local-first API workflow runner. Chain sequential HTTP requests, extract dynamic variables via JSONPath, and validate multi-step backend journeys with zero cloud lock-in.',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any (Web Browser)',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Chained Request Pipeline Execution',
      'Dynamic Variable Extraction via JSONPath',
      'Automatic Session Cookie Jar',
      'Local-First & Private In-Browser Storage',
      'Status Code & Latency Telemetry Assertions',
      'Open Source & Zero Cloud Lock-in',
    ],
    author: {
      '@type': 'Organization',
      name: 'Putman',
      url: process.env.NEXT_PUBLIC_APP_URL || 'https://putman.r8r.in',
    },
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between font-sans selection:bg-[#FF6C37] selection:text-white"
      style={{
        backgroundColor: 'var(--color-canvas, #09090b)',
        color: 'var(--color-text-primary, #f5f0e8)',
      }}
    >
      {/* Search Engine Crawler Structured Data (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top Ambient Light Glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 pointer-events-none -z-0 opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(circle at 50% 0%, #FF6C37 0%, rgba(9, 9, 11, 0) 70%)',
        }}
      />

      {/* Minimal Header */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <PutmanLogo size={32} showText={true} />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleContinueWork}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1a1e] hover:bg-[#242429] text-xs font-semibold text-neutral-200 hover:text-white rounded-xl transition-all cursor-pointer border-none touch-press"
          >
            {hasPreviousWork ? (
              <>
                <Play className="w-3.5 h-3.5 text-[#FF6C37] fill-current" />
                <span>Continue Work</span>
              </>
            ) : (
              <>
                <span>Launch Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 w-full max-w-3xl mx-auto px-6 py-8 sm:py-16 flex flex-col items-center text-center space-y-8 my-auto">
        {/* Minimal Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6C37]/10 text-[#FF8A5C] text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6C37] animate-pulse" />
          <span>Local-First • Zero Login • Open Source</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
          Sequential API Workflows,{' '}
          <span className="text-[#FF6C37]">Simplified.</span>
        </h1>

        {/* Concise Value Proposition */}
        <p className="text-sm sm:text-base md:text-lg text-neutral-400 max-w-xl leading-relaxed">
          Putman is a lightweight, local-first API runner designed to orchestrate chained HTTP requests,
          dynamically capture authentication tokens, and validate multi-step backend journeys without cloud overhead.
        </p>

        {/* Primary Action Button (Continue Work / Start) */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleContinueWork}
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#FF6C37] hover:bg-[#FF8A5C] text-white font-bold text-base sm:text-lg rounded-2xl transition-all shadow-xl shadow-[#FF6C37]/25 hover:shadow-[#FF6C37]/40 cursor-pointer touch-press"
          >
            {hasPreviousWork ? (
              <>
                <Play className="w-4 h-4 fill-current text-white" />
                <span>Continue Work</span>
                {workflowCount > 0 && (
                  <span className="px-2 py-0.5 bg-black/25 text-white/90 text-xs rounded-full font-mono font-medium">
                    {workflowCount} {workflowCount === 1 ? 'workflow' : 'workflows'}
                  </span>
                )}
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </>
            ) : (
              <>
                <span>Start Building Workflows</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <span className="text-xs text-neutral-500 font-mono flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Direct browser execution • No signup required</span>
          </span>
        </div>

        {/* Core Capabilities Section (4 Minimal Borderless Cards) */}
        <div className="w-full pt-10 space-y-4">
          <div className="text-left pb-1">
            <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-bold">
              Core Capabilities
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left">
            {/* 1. Sequential Chaining */}
            <div className="p-5 rounded-2xl bg-[#121214] space-y-2.5 hover:bg-[#151518] transition-colors border-none">
              <div className="w-8 h-8 rounded-xl bg-[#FF6C37]/15 flex items-center justify-center text-[#FF6C37]">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Chained Request Pipeline</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Run multi-step HTTP requests in exact sequence with drag-and-drop reordering, step skipping, and live latency metrics.
              </p>
            </div>

            {/* 2. Token Extraction & Interpolation */}
            <div className="p-5 rounded-2xl bg-[#121214] space-y-2.5 hover:bg-[#151518] transition-colors border-none">
              <div className="w-8 h-8 rounded-xl bg-[#FF6C37]/15 flex items-center justify-center text-[#FF6C37]">
                <Key className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Dynamic Variable Extraction</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Extract values like <code className="text-[#FF8A5C] bg-[#FF6C37]/10 px-1 py-0.5 rounded text-[10px]">data.token</code> via JSONPath and automatically inject them as <code className="text-[#FF8A5C] bg-[#FF6C37]/10 px-1 py-0.5 rounded text-[10px]">&#123;&#123;token&#125;&#125;</code> into downstream requests.
              </p>
            </div>

            {/* 3. Automatic Cookie Jar */}
            <div className="p-5 rounded-2xl bg-[#121214] space-y-2.5 hover:bg-[#151518] transition-colors border-none">
              <div className="w-8 h-8 rounded-xl bg-[#FF6C37]/15 flex items-center justify-center text-[#FF6C37]">
                <Cookie className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Automatic Cookie Jar</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Captures session cookies from <code className="text-neutral-300 text-[10px]">Set-Cookie</code> headers and automatically forwards them across consecutive steps.
              </p>
            </div>

            {/* 4. Local-First & Private Storage */}
            <div className="p-5 rounded-2xl bg-[#121214] space-y-2.5 hover:bg-[#151518] transition-colors border-none">
              <div className="w-8 h-8 rounded-xl bg-[#FF6C37]/15 flex items-center justify-center text-[#FF6C37]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Private & Local Storage</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                No accounts, no external cloud syncing, and zero telemetry tracking. All workflow definitions and run history remain stored in your browser.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-3 border-none">
        <div>Putman • Open Source Local-First API Workflow Runner</div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleContinueWork}
            className="text-neutral-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
          >
            {hasPreviousWork ? 'Continue Work' : 'Workflows'}
          </button>
          <span>•</span>
          <span className="text-neutral-600">Apache 2.0 / MIT</span>
        </div>
      </footer>
    </div>
  );
}
