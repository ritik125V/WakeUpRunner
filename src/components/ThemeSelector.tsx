'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, ChevronDown } from 'lucide-react';
import { useTheme } from '@/core/theme/themeContext';

export function ThemeSelector() {
  const { themeId, theme, availableThemes, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#1a1a1e] hover:bg-[#242429] text-neutral-200 hover:text-white transition-all cursor-pointer border-none touch-press shadow-sm"
        title="Switch VS Code-style color theme"
        aria-label="Color Theme"
      >
        <span
          className="w-3 h-3 rounded-full border border-white/20 flex-shrink-0"
          style={{ backgroundColor: theme.accentColor }}
        />
        <span className="hidden sm:inline font-mono text-[11px] font-medium tracking-tight">
          {theme.name}
        </span>
        <ChevronDown className="w-3 h-3 text-neutral-400 opacity-80" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-xl bg-[#161619] shadow-2xl z-50 py-1.5 backdrop-blur-md font-sans text-xs animate-in fade-in zoom-in-95 duration-100 border-none"
          style={{
            backgroundColor: 'var(--color-surface, #161619)',
          }}
        >
          <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-neutral-400 flex items-center gap-1.5 border-none">
            <Palette className="w-3 h-3" />
            <span>Theme Marketplace</span>
          </div>

          <div className="py-1 max-h-72 overflow-y-auto">
            {availableThemes.map((item) => {
              const isSelected = item.id === themeId;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setTheme(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2.5 hover:bg-white/10 transition-colors cursor-pointer border-none ${
                    isSelected ? 'bg-white/15 font-semibold text-white' : 'text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Swatch preview */}
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center border border-white/20 shadow-sm flex-shrink-0"
                      style={{ backgroundColor: item.colors.canvas }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: item.colors.accentHighlight }}
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xs leading-none">{item.name}</span>
                      <span className="text-[10px] text-neutral-500 font-mono capitalize">
                        {item.type}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[#FF6C37] flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
