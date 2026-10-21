'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { THEME_CATALOG, DEFAULT_THEME_ID, ThemeDefinition } from './themes';

interface ThemeContextType {
  themeId: string;
  theme: ThemeDefinition;
  availableThemes: ThemeDefinition[];
  setTheme: (themeId: string) => void;
  editorTextColor: string;
  setEditorTextColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeId: DEFAULT_THEME_ID,
  theme: THEME_CATALOG[DEFAULT_THEME_ID],
  availableThemes: Object.values(THEME_CATALOG),
  setTheme: () => {},
  editorTextColor: '#f8fafc',
  setEditorTextColor: () => {},
});

const THEME_STORAGE_KEY = 'putman_active_theme';
const EDITOR_TEXT_COLOR_STORAGE_KEY = 'putman_editor_text_color';

export const DEFAULT_EDITOR_TEXT_COLOR = '#f8fafc'; // Crisp, clean off-white

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME_ID);
  const [editorTextColor, setEditorTextColorState] = useState<string>(DEFAULT_EDITOR_TEXT_COLOR);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && THEME_CATALOG[savedTheme]) {
        setThemeId(savedTheme);
      }
      const savedColor = localStorage.getItem(EDITOR_TEXT_COLOR_STORAGE_KEY);
      if (savedColor) {
        setEditorTextColorState(savedColor);
      }
    } catch {
      // Ignore localStorage access issues
    }
    setMounted(true);
  }, []);

  const activeTheme = useMemo(() => {
    return THEME_CATALOG[themeId] || THEME_CATALOG[DEFAULT_THEME_ID];
  }, [themeId]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
      localStorage.setItem(EDITOR_TEXT_COLOR_STORAGE_KEY, editorTextColor);
    } catch {
      // Ignore
    }

    const root = document.documentElement;
    root.setAttribute('data-theme', themeId);
    root.setAttribute('data-theme-type', activeTheme.type);

    // Apply semantic CSS variables to :root
    const { colors } = activeTheme;
    root.style.setProperty('--color-canvas', colors.canvas);
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-surface-hover', colors.surfaceHover);
    root.style.setProperty('--color-surface-active', colors.surfaceActive);
    root.style.setProperty('--color-input', colors.input);
    root.style.setProperty('--color-text-primary', colors.textPrimary);
    root.style.setProperty('--color-text-secondary', colors.textSecondary);
    root.style.setProperty('--color-text-muted', colors.textMuted);
    root.style.setProperty('--color-border-subtle', colors.borderSubtle);
    root.style.setProperty('--color-border-prominent', colors.borderProminent);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-accent-contrast', colors.accentContrast);
    root.style.setProperty('--color-accent-highlight', colors.accentHighlight);
    root.style.setProperty('--color-badge-bg', colors.badgeBg);
    root.style.setProperty('--color-badge-text', colors.badgeText);
    root.style.setProperty('--color-method-get', colors.methodGet);
    root.style.setProperty('--color-method-post', colors.methodPost);
    root.style.setProperty('--color-method-put', colors.methodPut);
    root.style.setProperty('--color-method-delete', colors.methodDelete);
    root.style.setProperty('--color-method-patch', colors.methodPatch);

    // Apply Request & Response Editor Code text color
    root.style.setProperty('--editor-code-color', editorTextColor);
  }, [themeId, activeTheme, editorTextColor, mounted]);

  const handleSetTheme = (newId: string) => {
    if (THEME_CATALOG[newId]) {
      setThemeId(newId);
    }
  };

  const handleSetEditorTextColor = (newColor: string) => {
    setEditorTextColorState(newColor);
  };

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        theme: activeTheme,
        availableThemes: Object.values(THEME_CATALOG),
        setTheme: handleSetTheme,
        editorTextColor,
        setEditorTextColor: handleSetEditorTextColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
