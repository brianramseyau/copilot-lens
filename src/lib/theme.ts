import { writable, get } from 'svelte/store';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'copilot-report-theme';

function getInitialTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  const attr = document.documentElement.dataset.theme;
  if (attr === 'light' || attr === 'dark') return attr;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const theme = writable<Theme>(getInitialTheme());

if (typeof document !== 'undefined') {
  theme.subscribe((value) => {
    document.documentElement.dataset.theme = value;
    window.localStorage.setItem(STORAGE_KEY, value);
  });

  // Printing always renders in light mode (see print CSS); flip back after.
  let themeBeforePrint: Theme | null = null;
  window.addEventListener('beforeprint', () => {
    themeBeforePrint = get(theme);
    if (themeBeforePrint === 'dark') theme.set('light');
  });
  window.addEventListener('afterprint', () => {
    if (themeBeforePrint === 'dark') theme.set('dark');
    themeBeforePrint = null;
  });
}

export function toggleTheme(): void {
  theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
}
