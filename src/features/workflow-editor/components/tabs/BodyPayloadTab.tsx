'use client';

import React, { useState } from 'react';
import { Sparkles, Check, AlertCircle } from 'lucide-react';
import { JsonCodeEditor } from '@/components/JsonCodeEditor';

interface BodyPayloadTabProps {
  body: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function BodyPayloadTab({ body, onChange, disabled }: BodyPayloadTabProps) {
  const [formatStatus, setFormatStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleBeautify = () => {
    if (!body || !body.trim()) return;
    try {
      const parsed = JSON.parse(body);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
      setFormatStatus('success');
      setTimeout(() => setFormatStatus('idle'), 1500);
    } catch {
      setFormatStatus('error');
      setTimeout(() => setFormatStatus('idle'), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-2">
      <div className="flex items-center justify-between text-xs px-1 flex-wrap gap-2">
        <div className="flex items-center gap-2 text-neutral-400 font-mono text-[11px]">
          <span>Format: <strong className="text-white">JSON (application/json)</strong></span>
          <span className="text-neutral-600 hidden sm:inline">•</span>
          <span className="hidden sm:inline">Interpolation: <code className="text-[#FF8A5C] bg-[#FF6C37]/15 px-1 py-0.5 rounded text-[10px]">&#123;&#123;varName&#125;&#125;</code></span>
        </div>

        <button
          type="button"
          onClick={handleBeautify}
          disabled={disabled || !body}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg transition-colors cursor-pointer border-none disabled:opacity-40"
        >
          {formatStatus === 'success' ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-bold">Beautified</span>
            </>
          ) : formatStatus === 'error' ? (
            <>
              <AlertCircle className="w-3 h-3 text-red-400" />
              <span className="text-red-400">Invalid JSON</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 text-[#FF6C37]" />
              <span>Format JSON</span>
            </>
          )}
        </button>
      </div>

      <div className="flex-1 min-h-[220px] relative rounded-xl overflow-hidden bg-[#0d0d10] flex flex-col request-body-container">
        <JsonCodeEditor
          value={body || ''}
          onChange={onChange}
          minHeight="220px"
          className="w-full h-full flex-1"
          placeholder={`{\n  "email": "test@example.com",\n  "auth_token": "{{accessToken}}"\n}`}
        />
      </div>
    </div>
  );
}
