'use client';

import React from 'react';
import { Cookie, CheckSquare, Square, Info } from 'lucide-react';

interface CookiesTabProps {
  captureCookies: boolean;
  useCookies: boolean;
  onUpdate: (field: 'captureCookies' | 'useCookies', val: boolean) => void;
  disabled?: boolean;
}

export function CookiesTab({ captureCookies, useCookies, onUpdate, disabled }: CookiesTabProps) {
  return (
    <div className="flex flex-col space-y-4 text-xs font-sans">
      <div className="p-3 bg-neutral-900/60 rounded-xl border-none flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#FF8A5C] mt-0.5 shrink-0" />
        <div className="text-neutral-400 text-[11px] leading-relaxed">
          Putman manages an automatic <strong className="text-white">Workflow Cookie Jar</strong> across all sequential requests.
          Cookies received via <code>Set-Cookie</code> are stored and automatically carried forward to subsequent steps.
        </div>
      </div>

      <div className="space-y-3">
        <label
          className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors cursor-pointer ${
            useCookies
              ? 'bg-neutral-900 border-[#FF6C37]/40 text-white'
              : 'bg-[#0d0d10] border-transparent text-neutral-400'
          }`}
        >
          <button
            type="button"
            onClick={() => onUpdate('useCookies', !useCookies)}
            disabled={disabled}
            className="mt-0.5 text-neutral-400 cursor-pointer border-none"
          >
            {useCookies ? (
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            ) : (
              <Square className="w-4 h-4 text-neutral-600" />
            )}
          </button>
          <div className="flex-1" onClick={() => onUpdate('useCookies', !useCookies)}>
            <div className="font-semibold text-xs text-white">Carry Forward Active Cookie Jar</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Automatically send all cookies captured from previous steps in this request&apos;s <code>Cookie</code> header.
            </div>
          </div>
        </label>

        <label
          className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors cursor-pointer ${
            captureCookies
              ? 'bg-neutral-900 border-[#FF6C37]/40 text-white'
              : 'bg-[#0d0d10] border-transparent text-neutral-400'
          }`}
        >
          <button
            type="button"
            onClick={() => onUpdate('captureCookies', !captureCookies)}
            disabled={disabled}
            className="mt-0.5 text-neutral-400 cursor-pointer border-none"
          >
            {captureCookies ? (
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            ) : (
              <Square className="w-4 h-4 text-neutral-600" />
            )}
          </button>
          <div className="flex-1" onClick={() => onUpdate('captureCookies', !captureCookies)}>
            <div className="font-semibold text-xs text-white">Capture Cookies from Response</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Inspect response <code>Set-Cookie</code> headers and save them into the jar for future steps in this workflow.
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
