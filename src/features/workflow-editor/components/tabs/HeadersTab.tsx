'use client';

import React, { useMemo } from 'react';
import { Plus, Trash2, CheckSquare, Square, Sparkles } from 'lucide-react';
import { KeyValuePair } from '../../types';

interface HeadersTabProps {
  headers: Record<string, string> | KeyValuePair[];
  onChange: (headers: Record<string, string>) => void;
  disabled?: boolean;
}

export function HeadersTab({ headers, onChange, disabled }: HeadersTabProps) {
  const rows: KeyValuePair[] = useMemo(() => {
    if (Array.isArray(headers)) {
      return headers.length > 0 ? headers : [{ key: '', value: '', enabled: true }];
    }
    if (headers && typeof headers === 'object') {
      const keys = Object.keys(headers);
      if (keys.length === 0) return [{ key: '', value: '', enabled: true }];
      return keys.map((k) => ({
        key: k,
        value: String(headers[k] || ''),
        enabled: true,
      }));
    }
    return [{ key: '', value: '', enabled: true }];
  }, [headers]);

  const emitChange = (newRows: KeyValuePair[]) => {
    const record: Record<string, string> = {};
    for (const r of newRows) {
      if (r.enabled !== false && r.key.trim()) {
        record[r.key.trim()] = r.value;
      }
    }
    onChange(record);
  };

  const handleUpdateRow = (index: number, field: 'key' | 'value' | 'enabled', val: any) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: val };
    emitChange(updated);
  };

  const handleAddRow = (presetKey?: string, presetValue?: string) => {
    emitChange([
      ...rows.filter((r) => r.key.trim() !== '' || r.value.trim() !== ''),
      { key: presetKey || '', value: presetValue || '', enabled: true },
    ]);
  };

  const handleDeleteRow = (index: number) => {
    const updated = rows.filter((_, i) => i !== index);
    emitChange(updated.length ? updated : [{ key: '', value: '', enabled: true }]);
  };

  return (
    <div className="flex flex-col space-y-2 font-mono text-xs">
      <div className="flex items-center justify-between text-neutral-400 text-[11px] px-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>Quick Presets:</span>
          <button
            type="button"
            onClick={() => handleAddRow('Content-Type', 'application/json')}
            className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-[10px] cursor-pointer border-none transition-colors"
          >
            + Content-Type: JSON
          </button>
          <button
            type="button"
            onClick={() => handleAddRow('Authorization', 'Bearer {{accessToken}}')}
            className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-[#FF8A5C] text-[10px] cursor-pointer border-none transition-colors"
          >
            + Bearer Token
          </button>
          <button
            type="button"
            onClick={() => handleAddRow('Accept', 'application/json')}
            className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-[10px] cursor-pointer border-none transition-colors"
          >
            + Accept: JSON
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleAddRow()}
          disabled={disabled}
          className="flex items-center gap-1 text-[#FF6C37] hover:text-[#FF8A5C] transition-colors font-sans font-semibold cursor-pointer border-none shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Header</span>
        </button>
      </div>

      <div className="rounded-xl overflow-hidden bg-[#0d0d10]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-900/60 text-[11px] text-neutral-400 uppercase font-sans tracking-wider">
              <th className="py-2 px-3 w-10 text-center">Active</th>
              <th className="py-2 px-3 w-1/3">Header Name</th>
              <th className="py-2 px-3">Header Value</th>
              <th className="py-2 px-3 w-10 text-center"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="group hover:bg-neutral-900/40 transition-colors">
                <td className="py-1.5 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleUpdateRow(idx, 'enabled', row.enabled === false)}
                    disabled={disabled}
                    className="text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer border-none"
                  >
                    {row.enabled !== false ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-600" />
                    )}
                  </button>
                </td>
                <td className="py-1.5 px-3">
                  <input
                    type="text"
                    value={row.key}
                    onChange={(e) => handleUpdateRow(idx, 'key', e.target.value)}
                    disabled={disabled}
                    placeholder="e.g. Authorization"
                    className="w-full bg-transparent text-neutral-200 placeholder-neutral-700 outline-none font-mono text-xs"
                  />
                </td>
                <td className="py-1.5 px-3">
                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) => handleUpdateRow(idx, 'value', e.target.value)}
                    disabled={disabled}
                    placeholder="e.g. Bearer {{token}}"
                    className="w-full bg-transparent text-neutral-200 placeholder-neutral-700 outline-none font-mono text-xs"
                  />
                </td>
                <td className="py-1.5 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleDeleteRow(idx)}
                    disabled={disabled}
                    className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition-all cursor-pointer border-none"
                    title="Delete header"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
