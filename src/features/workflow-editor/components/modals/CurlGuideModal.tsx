'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Code } from 'lucide-react';
import { IWorkflowStepData } from '@/lib/api';

interface CurlGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  step?: IWorkflowStepData;
  baseUrl?: string;
  workflowName?: string;
}

export function CurlGuideModal({
  isOpen,
  onClose,
  step,
  baseUrl = '',
  workflowName = 'Workflow',
}: CurlGuideModalProps) {
  const [activeLang, setActiveLang] = useState<'curl' | 'js' | 'python'>('curl');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const method = step?.method || 'GET';
  let targetUrl = step?.url || 'https://api.example.com/v1/resource';
  if (targetUrl.startsWith('/') && baseUrl) {
    targetUrl = `${baseUrl.replace(/\/$/, '')}${targetUrl}`;
  }

  const headers = step?.headers || {};
  const body = step?.bodyPayload || '';

  // Generate Snippets
  const getCurl = () => {
    let cmd = `curl -X ${method} "${targetUrl}"`;
    for (const [k, v] of Object.entries(headers)) {
      cmd += ` \\\n  -H "${k}: ${v}"`;
    }
    if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
      cmd += ` \\\n  -d '${body}'`;
    }
    return cmd;
  };

  const getJs = () => {
    return `// JavaScript / TypeScript (fetch)
const response = await fetch("${targetUrl}", {
  method: "${method}",
  headers: ${JSON.stringify(headers, null, 2)},
  ${['POST', 'PUT', 'PATCH'].includes(method) && body ? `body: JSON.stringify(${body}),` : ''}
});

const data = await response.json();
console.log(data);`;
  };

  const getPython = () => {
    return `# Python (requests)
import requests

url = "${targetUrl}"
headers = ${JSON.stringify(headers, null, 2)}
${['POST', 'PUT', 'PATCH'].includes(method) && body ? `payload = ${body}\n\nresponse = requests.${method.toLowerCase()}(url, headers=headers, json=payload)` : `response = requests.${method.toLowerCase()}(url, headers=headers)`}

print(response.status_code)
print(response.json())`;
  };

  const currentCode =
    activeLang === 'curl' ? getCurl() : activeLang === 'js' ? getJs() : getPython();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl bg-[#141417] border border-neutral-800 shadow-2xl p-5 space-y-4 font-sans text-neutral-200">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">cURL & SDK Code Generator</h3>
              <p className="text-[11px] text-neutral-400">
                Executable snippets for {step?.stepName || workflowName}
              </p>
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

        {/* Language Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-[#0d0d10] p-1 rounded-xl border border-neutral-800/80 text-xs">
            <button
              type="button"
              onClick={() => setActiveLang('curl')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer border-none ${
                activeLang === 'curl' ? 'bg-[#1e1e24] text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              cURL
            </button>
            <button
              type="button"
              onClick={() => setActiveLang('js')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer border-none ${
                activeLang === 'js' ? 'bg-[#1e1e24] text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              JavaScript / Fetch
            </button>
            <button
              type="button"
              onClick={() => setActiveLang('python')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer border-none ${
                activeLang === 'python' ? 'bg-[#1e1e24] text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Python Requests
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition-colors cursor-pointer border-none shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Snippet</span>
              </>
            )}
          </button>
        </div>

        {/* Code Box */}
        <div className="rounded-xl overflow-hidden border border-neutral-800 bg-[#0a0a0c] p-4">
          <pre className="font-mono text-xs text-neutral-300 leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-72">
            {currentCode}
          </pre>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl cursor-pointer border-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
