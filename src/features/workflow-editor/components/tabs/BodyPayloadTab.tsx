'use client';

import React, { useState } from 'react';
import { Sparkles, Check, AlertCircle } from 'lucide-react';

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
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-2 text-neutral-400 font-mono text-[11px]">
          <span>Format: <strong className="text-white">JSON / Raw</strong></span>
          <span className="text-neutral-600">•</span>
          <span>Interpolation: <code className="text-[#FF8A5C] bg-[#FF6C37]/15 px-1 py-0.5 rounded text-[10px]">&#123;&#123;varName&#125;&#125;</code></span>
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

      <div className="flex-1 min-h-[220px] relative rounded-xl overflow-hidden bg-[#0d0d10]">
        <textarea
          value={body || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={`{\n  "email": "test@example.com",\n  "auth_token": "{{accessToken}}"\n}`}
          rows={12}
          className="w-full h-full p-4 bg-transparent placeholder-neutral-600 font-mono text-xs leading-relaxed outline-none resize-none"
          style={{ color: 'var(--editor-code-color, #f8fafc)' }}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
