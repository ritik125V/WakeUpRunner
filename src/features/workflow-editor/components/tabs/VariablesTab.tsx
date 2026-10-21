'use client';

import React from 'react';
import { Plus, Trash2, Key, Sparkles } from 'lucide-react';

interface VariableRule {
  varName: string;
  jsonPath: string;
}

interface VariablesTabProps {
  extractVariables: VariableRule[];
  onChange: (rules: VariableRule[]) => void;
  disabled?: boolean;
}

export function VariablesTab({ extractVariables = [], onChange, disabled }: VariablesTabProps) {
  const handleAddRule = () => {
    onChange([...extractVariables, { varName: 'extractedToken', jsonPath: 'data.token' }]);
  };

  const handleUpdate = (index: number, field: 'varName' | 'jsonPath', value: string) => {
    const list = [...extractVariables];
    list[index] = { ...list[index], [field]: value };
    onChange(list);
  };

  const handleDelete = (index: number) => {
    onChange(extractVariables.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between text-neutral-400 text-[11px] px-1">
        <span>Extract JSON Values from Response into Variables</span>
        <button
          type="button"
          onClick={handleAddRule}
          disabled={disabled}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FF6C37]/15 hover:bg-[#FF6C37]/25 text-[#FF8A5C] rounded-lg font-sans font-semibold text-[11px] transition-colors cursor-pointer border-none"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Variable Rule</span>
        </button>
      </div>

      {extractVariables.length === 0 ? (
        <div className="p-8 rounded-xl border border-dashed border-neutral-800 text-center text-neutral-500 text-xs bg-[#0c0c0e]">
          <Key className="w-5 h-5 mx-auto mb-2 text-neutral-600" />
          <p className="font-semibold text-neutral-400">No variable rules defined for this step</p>
          <p className="text-[11px] text-neutral-600 mt-1">
            Extract values like <code>token</code>, <code>data.id</code>, or <code>user.email</code> to pass into future steps as <code>&#123;&#123;varName&#125;&#125;</code>.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {extractVariables.map((rule, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-2 rounded-xl bg-[#0d0d10] border-none"
            >
              <div className="flex-1 flex items-center gap-2 bg-[#161619] px-2.5 py-1.5 rounded-lg border-none">
                <span className="text-purple-400 font-bold text-[11px] select-none">&#123;&#123;</span>
                <input
                  type="text"
                  value={rule.varName}
                  onChange={(e) => handleUpdate(idx, 'varName', e.target.value)}
                  disabled={disabled}
                  placeholder="variableName"
                  className="w-full bg-transparent text-purple-300 font-bold outline-none text-xs"
                />
                <span className="text-purple-400 font-bold text-[11px] select-none">&#125;&#125;</span>
              </div>

              <div className="text-neutral-500 font-sans text-xs select-none">←</div>

              <div className="flex-[1.5] bg-[#161619] px-2.5 py-1.5 rounded-lg border-none">
                <input
                  type="text"
                  value={rule.jsonPath}
                  onChange={(e) => handleUpdate(idx, 'jsonPath', e.target.value)}
                  disabled={disabled}
                  placeholder="JSONPath (e.g. token or data.user.id)"
                  className="w-full bg-transparent text-white outline-none text-xs"
                />
              </div>

              <button
                type="button"
                onClick={() => handleDelete(idx)}
                disabled={disabled}
                className="p-2 text-neutral-500 hover:text-red-400 transition-colors cursor-pointer border-none rounded-lg"
                title="Delete rule"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
