'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Zap,
  RefreshCw,
  Lock,
  ChevronDown,
  Sparkles,
  Cookie,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { IWorkflowStepData } from '@/lib/api';

interface StepHeaderBarProps {
  step: IWorkflowStepData;
  stepIndex: number;
  onUpdateStep: (updates: Partial<IWorkflowStepData>) => void;
  onTestStep: () => void;
  isTesting: boolean;
  onOpenAuthPresets: () => void;
  baseUrl?: string;
  cookieJarCount?: number;
  onClearCookieJar?: () => void;
  disabled?: boolean;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as const;

export function StepHeaderBar({
  step,
  stepIndex,
  onUpdateStep,
  onTestStep,
  isTesting,
  onOpenAuthPresets,
  baseUrl,
  cookieJarCount = 0,
  onClearCookieJar,
  disabled,
}: StepHeaderBarProps) {
  const [methodDropdownOpen, setMethodDropdownOpen] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const methodDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (methodDropdownRef.current && !methodDropdownRef.current.contains(e.target as Node)) {
        setMethodDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getMethodBadgeClass = (method: string) => {
    switch (method.toUpperCase()) {
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

  const handleCopyCurl = () => {
    const method = step.method || 'GET';
    let url = step.url || '';
    if (url.startsWith('/') && baseUrl) {
      url = `${baseUrl.replace(/\/$/, '')}${url}`;
    }
    let curl = `curl -X ${method} "${url}"`;
    if (step.headers && Object.keys(step.headers).length > 0) {
      for (const [k, v] of Object.entries(step.headers)) {
        curl += ` \\\n  -H "${k}: ${v}"`;
      }
    }
    if (['POST', 'PUT', 'PATCH'].includes(method) && step.bodyPayload) {
      curl += ` \\\n  -d '${step.bodyPayload}'`;
    }
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="space-y-2.5">
      {/* Step Title Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-mono font-bold text-neutral-500 shrink-0">
            #{stepIndex + 1}
          </span>
          <input
            type="text"
            value={step.stepName || ''}
            onChange={(e) => onUpdateStep({ stepName: e.target.value })}
            placeholder="Step Name (e.g. Authenticate User)"
            className="text-base font-bold bg-transparent text-white placeholder-neutral-600 outline-none w-full border-b border-transparent focus:border-neutral-700 pb-0.5 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenAuthPresets}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg transition-colors cursor-pointer border-none"
            title="Configure Auth Headers (Bearer Token, Basic Auth, API Key)"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Auth Presets</span>
          </button>

          <button
            type="button"
            onClick={handleCopyCurl}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg transition-colors cursor-pointer border-none"
            title="Copy as cURL command"
          >
            {copiedCurl ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                <span className="hidden sm:inline">cURL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Postman Style URL & Method Bar */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        {/* Method Selector */}
        <div className="relative shrink-0" ref={methodDropdownRef}>
          <button
            type="button"
            onClick={() => setMethodDropdownOpen(!methodDropdownOpen)}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold tracking-wider cursor-pointer border-none transition-all ${getMethodBadgeClass(
              step.method || 'GET'
            )}`}
          >
            <span>{step.method || 'GET'}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>

          {methodDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-32 rounded-xl bg-[#161619] border border-neutral-800 shadow-2xl z-50 py-1 font-mono text-xs overflow-hidden">
              {HTTP_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    onUpdateStep({ method: m });
                    setMethodDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 font-bold transition-colors cursor-pointer border-none ${getMethodBadgeClass(
                    m
                  )} hover:brightness-125`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* URL Input Box */}
        <div className="api-url-bar flex-1 flex items-center bg-[#0d0d10] rounded-xl px-3 py-2 transition-colors min-w-[200px]">
          {baseUrl && (
            <span
              className="text-neutral-500 text-xs font-mono pr-1 select-none truncate max-w-[150px]"
              title={`Workflow Base URL: ${baseUrl}`}
            >
              {baseUrl.replace(/\/$/, '')}
            </span>
          )}
          <input
            type="text"
            value={step.url || ''}
            onChange={(e) => onUpdateStep({ url: e.target.value })}
            disabled={disabled}
            placeholder={baseUrl ? '/api/v1/resource or {{baseUrl}}/resource' : 'https://api.example.com/v1/resource'}
            className="w-full bg-transparent text-white placeholder-neutral-600 outline-none font-mono text-xs"
          />
        </div>

        {/* Cookie Jar Pill */}
        {cookieJarCount > 0 && onClearCookieJar && (
          <button
            type="button"
            onClick={onClearCookieJar}
            className="flex items-center gap-1.5 px-2.5 py-2 bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 text-xs font-mono font-bold rounded-xl border border-amber-800/40 transition-colors cursor-pointer shrink-0"
            title="Clear stored test cookies for this interactive session"
          >
            <Cookie className="w-3.5 h-3.5 text-amber-400" />
            <span>Jar ({cookieJarCount})</span>
            <span className="text-[10px] opacity-70">✕</span>
          </button>
        )}

        {/* Single Step Test Button */}
        <button
          type="button"
          onClick={onTestStep}
          disabled={isTesting || disabled}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-xl border-none transition-all shadow-md cursor-pointer shrink-0 disabled:opacity-50"
        >
          {isTesting ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
          ) : (
            <Zap className="w-3.5 h-3.5 text-white fill-current" />
          )}
          <span>{isTesting ? 'Testing...' : 'Test Step'}</span>
        </button>
      </div>
    </div>
  );
}
