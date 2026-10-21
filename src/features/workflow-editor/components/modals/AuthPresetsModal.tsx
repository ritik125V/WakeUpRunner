'use client';

import React, { useState } from 'react';
import { Lock, X, Check, Key, ShieldCheck } from 'lucide-react';

interface AuthPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyAuth: (headerKey: string, headerValue: string) => void;
}

export function AuthPresetsModal({ isOpen, onClose, onApplyAuth }: AuthPresetsModalProps) {
  const [authType, setAuthType] = useState<'bearer' | 'basic' | 'apikey'>('bearer');
  const [bearerToken, setBearerToken] = useState('{{accessToken}}');
  const [basicUser, setBasicUser] = useState('');
  const [basicPass, setBasicPass] = useState('');
  const [apiKeyName, setApiKeyName] = useState('X-API-Key');
  const [apiKeyValue, setApiKeyValue] = useState('{{apiKey}}');

  if (!isOpen) return null;

  const handleApply = () => {
    if (authType === 'bearer') {
      onApplyAuth('Authorization', `Bearer ${bearerToken.trim()}`);
    } else if (authType === 'basic') {
      try {
        const encoded = btoa(`${basicUser}:${basicPass}`);
        onApplyAuth('Authorization', `Basic ${encoded}`);
      } catch {
        onApplyAuth('Authorization', `Basic ${basicUser}:${basicPass}`);
      }
    } else if (authType === 'apikey') {
      onApplyAuth(apiKeyName.trim(), apiKeyValue.trim());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-[#141417] border border-neutral-800 shadow-2xl p-5 space-y-4 font-sans text-neutral-200">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Auth Header Presets</h3>
              <p className="text-[11px] text-neutral-400">Configure authentication for this request</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer border-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-3 gap-1 bg-[#0d0d10] p-1 rounded-xl border border-neutral-800/80 text-xs">
          <button
            type="button"
            onClick={() => setAuthType('bearer')}
            className={`py-1.5 rounded-lg font-semibold transition-colors cursor-pointer border-none ${
              authType === 'bearer' ? 'bg-[#1e1e24] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Bearer Token
          </button>
          <button
            type="button"
            onClick={() => setAuthType('basic')}
            className={`py-1.5 rounded-lg font-semibold transition-colors cursor-pointer border-none ${
              authType === 'basic' ? 'bg-[#1e1e24] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Basic Auth
          </button>
          <button
            type="button"
            onClick={() => setAuthType('apikey')}
            className={`py-1.5 rounded-lg font-semibold transition-colors cursor-pointer border-none ${
              authType === 'apikey' ? 'bg-[#1e1e24] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            API Key
          </button>
        </div>

        {/* Auth Forms */}
        <div className="space-y-3 font-mono text-xs">
          {authType === 'bearer' && (
            <div className="space-y-1.5">
              <label className="text-[11px] text-neutral-400 font-sans">Bearer Token or Variable:</label>
              <input
                type="text"
                value={bearerToken}
                onChange={(e) => setBearerToken(e.target.value)}
                placeholder="e.g. {{accessToken}} or eyJhbGci..."
                className="w-full bg-[#0d0d10] border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-neutral-600"
              />
              <p className="text-[10px] text-neutral-500 font-sans">
                Generates: <code className="text-amber-300">Authorization: Bearer {bearerToken || '...'}</code>
              </p>
            </div>
          )}

          {authType === 'basic' && (
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400 font-sans">Username:</label>
                <input
                  type="text"
                  value={basicUser}
                  onChange={(e) => setBasicUser(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-[#0d0d10] border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-neutral-600"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400 font-sans">Password:</label>
                <input
                  type="password"
                  value={basicPass}
                  onChange={(e) => setBasicPass(e.target.value)}
                  placeholder="secret"
                  className="w-full bg-[#0d0d10] border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-neutral-600"
                />
              </div>
              <p className="text-[10px] text-neutral-500 font-sans">
                Generates Base64 encoded Basic Authorization header.
              </p>
            </div>
          )}

          {authType === 'apikey' && (
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400 font-sans">Header Key Name:</label>
                <input
                  type="text"
                  value={apiKeyName}
                  onChange={(e) => setApiKeyName(e.target.value)}
                  placeholder="X-API-Key"
                  className="w-full bg-[#0d0d10] border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-neutral-600"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400 font-sans">API Key Value:</label>
                <input
                  type="text"
                  value={apiKeyValue}
                  onChange={(e) => setApiKeyValue(e.target.value)}
                  placeholder="{{apiKey}} or pk_live_..."
                  className="w-full bg-[#0d0d10] border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-neutral-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 cursor-pointer border-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl border-none transition-all cursor-pointer shadow-md"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply to Step</span>
          </button>
        </div>
      </div>
    </div>
  );
}
