// Tokens tomados de la versión web (global.css / auth.css / HomeScreen.css).
export const colors = {
  primary: '#6c4dff',
  primarySoft: '#ede9fe',
  navy: '#232357',
  bg: '#f9fafb',
  surface: '#ffffff',
  text: '#111827',
  muted: '#6b7280',
  border: '#e5e7eb',
  danger: '#b91c1c',
  status: {
    lost: { bg: '#fee2e2', fg: '#b91c1c' },
    seen: { bg: '#e0f2fe', fg: '#1d4ed8' },
    found: { bg: '#dcfce7', fg: '#166534' },
  },
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;
export const radius = { sm: 8, md: 14, lg: 20, pill: 999 } as const;
