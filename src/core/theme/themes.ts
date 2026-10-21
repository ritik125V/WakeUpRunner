export interface ThemeColors {
  canvas: string;
  surface: string;
  surfaceHover: string;
  surfaceActive: string;
  input: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderSubtle: string;
  borderProminent: string;
  accent: string;
  accentContrast: string;
  accentHighlight: string;
  badgeBg: string;
  badgeText: string;
  methodGet: string;
  methodPost: string;
  methodPut: string;
  methodDelete: string;
  methodPatch: string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  label: string;
  type: 'dark' | 'light';
  previewColor: string;
  accentColor: string;
  colors: ThemeColors;
}

export const THEME_CATALOG: Record<string, ThemeDefinition> = {
  'putman-dark': {
    id: 'putman-dark',
    name: 'Putman Dark',
    label: 'Putman Dark (Default)',
    type: 'dark',
    previewColor: '#121214',
    accentColor: '#FF6C37',
    colors: {
      canvas: '#09090b',
      surface: '#121214',
      surfaceHover: '#18181c',
      surfaceActive: '#222228',
      input: '#161619',
      textPrimary: '#f5f0e8',
      textSecondary: '#a3a3a3',
      textMuted: '#52525b',
      borderSubtle: 'transparent',
      borderProminent: 'transparent',
      accent: '#FF6C37',
      accentContrast: '#ffffff',
      accentHighlight: '#FF6C37',
      badgeBg: '#27272a',
      badgeText: '#f5f0e8',
      methodGet: '#10b981',
      methodPost: '#f59e0b',
      methodPut: '#0ea5e9',
      methodDelete: '#ef4444',
      methodPatch: '#a855f7',
    },
  },

  dracula: {
    id: 'dracula',
    name: 'Dracula',
    label: 'Dracula Official',
    type: 'dark',
    previewColor: '#282a36',
    accentColor: '#FF6C37',
    colors: {
      canvas: '#1e1f29',
      surface: '#282a36',
      surfaceHover: '#343746',
      surfaceActive: '#44475a',
      input: '#21222c',
      textPrimary: '#f8f8f2',
      textSecondary: '#bd93f9',
      textMuted: '#6272a4',
      borderSubtle: 'transparent',
      borderProminent: 'transparent',
      accent: '#FF6C37',
      accentContrast: '#ffffff',
      accentHighlight: '#FF6C37',
      badgeBg: '#44475a',
      badgeText: '#f8f8f2',
      methodGet: '#50fa7b',
      methodPost: '#ffb86c',
      methodPut: '#8be9fd',
      methodDelete: '#ff5555',
      methodPatch: '#bd93f9',
    },
  },

  panda: {
    id: 'panda',
    name: 'Panda Syntax',
    label: 'Panda Syntax',
    type: 'dark',
    previewColor: '#292a2b',
    accentColor: '#FF6C37',
    colors: {
      canvas: '#1f2021',
      surface: '#292a2b',
      surfaceHover: '#303133',
      surfaceActive: '#3b3d40',
      input: '#242526',
      textPrimary: '#e6e6e6',
      textSecondary: '#ff75b5',
      textMuted: '#676b79',
      borderSubtle: 'transparent',
      borderProminent: 'transparent',
      accent: '#FF6C37',
      accentContrast: '#ffffff',
      accentHighlight: '#FF6C37',
      badgeBg: '#3b3d40',
      badgeText: '#e6e6e6',
      methodGet: '#19f9d8',
      methodPost: '#ffb86c',
      methodPut: '#6fc1ff',
      methodDelete: '#ff2c6d',
      methodPatch: '#b084eb',
    },
  },

  'tokyo-night': {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    label: 'Tokyo Night Storm',
    type: 'dark',
    previewColor: '#24283b',
    accentColor: '#FF6C37',
    colors: {
      canvas: '#16161e',
      surface: '#1f2335',
      surfaceHover: '#292e42',
      surfaceActive: '#3b4261',
      input: '#1a1b26',
      textPrimary: '#c0caf5',
      textSecondary: '#7aa2f7',
      textMuted: '#565f89',
      borderSubtle: 'transparent',
      borderProminent: 'transparent',
      accent: '#FF6C37',
      accentContrast: '#ffffff',
      accentHighlight: '#FF6C37',
      badgeBg: '#292e42',
      badgeText: '#c0caf5',
      methodGet: '#9ece6a',
      methodPost: '#e0af68',
      methodPut: '#7dcfff',
      methodDelete: '#f7768e',
      methodPatch: '#bb9af7',
    },
  },

  'monokai-pro': {
    id: 'monokai-pro',
    name: 'Monokai Pro',
    label: 'Monokai Pro Filter',
    type: 'dark',
    previewColor: '#2d2a2e',
    accentColor: '#FF6C37',
    colors: {
      canvas: '#19181a',
      surface: '#221f22',
      surfaceHover: '#2d2a2e',
      surfaceActive: '#403e41',
      input: '#221f22',
      textPrimary: '#fcfcfa',
      textSecondary: '#ffd866',
      textMuted: '#727072',
      borderSubtle: 'transparent',
      borderProminent: 'transparent',
      accent: '#FF6C37',
      accentContrast: '#ffffff',
      accentHighlight: '#FF6C37',
      badgeBg: '#3a373a',
      badgeText: '#fcfcfa',
      methodGet: '#a9dc76',
      methodPost: '#fc9867',
      methodPut: '#78dce8',
      methodDelete: '#ff6188',
      methodPatch: '#ab9df2',
    },
  },

  'clean-light': {
    id: 'clean-light',
    name: 'Clean Light',
    label: 'Modern Clean Light',
    type: 'light',
    previewColor: '#ffffff',
    accentColor: '#FF6C37',
    colors: {
      canvas: '#f4f5f7',
      surface: '#ffffff',
      surfaceHover: '#f1f5f9',
      surfaceActive: '#e2e8f0',
      input: '#ffffff',
      textPrimary: '#0f172a',
      textSecondary: '#334155',
      textMuted: '#64748b',
      borderSubtle: 'transparent',
      borderProminent: 'transparent',
      accent: '#FF6C37',
      accentContrast: '#ffffff',
      accentHighlight: '#FF6C37',
      badgeBg: '#e2e8f0',
      badgeText: '#0f172a',
      methodGet: '#059669',
      methodPost: '#d97706',
      methodPut: '#0284c7',
      methodDelete: '#dc2626',
      methodPatch: '#7c3aed',
    },
  },
};

export const DEFAULT_THEME_ID = 'putman-dark';
