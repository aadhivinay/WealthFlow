import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ThemeMode } from '@/types';

interface ThemeStore {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'wealthflow-theme',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = mode === 'dark' || (mode === 'system' && systemDark);
  if (isDark) root.classList.add('dark');
  else root.classList.remove('dark');
}

export function initTheme() {
  const mode = useThemeStore.getState().mode;
  applyTheme(mode);
  if (mode === 'system') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme('system'));
  }
}
