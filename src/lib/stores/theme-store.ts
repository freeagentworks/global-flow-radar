import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Theme, Locale } from "@/types";

// アプリケーション設定ストア
interface AppSettingsState {
  theme: Theme;
  locale: Locale;
  sidebarCollapsed: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setLocale: (locale: Locale) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppSettings = create<AppSettingsState>()(
  persist(
    (set) => ({
      theme: "dark",
      locale: "ja",
      sidebarCollapsed: false,

      setTheme: (theme) => {
        // HTMLクラスを更新してCSSカスタムプロパティを切替
        if (theme === "light") {
          document.documentElement.classList.add("light");
        } else {
          document.documentElement.classList.remove("light");
        }
        set({ theme });
      },

      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === "dark" ? "light" : "dark";
          if (newTheme === "light") {
            document.documentElement.classList.add("light");
          } else {
            document.documentElement.classList.remove("light");
          }
          return { theme: newTheme };
        });
      },

      setLocale: (locale) => set({ locale }),

      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: "gfr-app-settings",
    }
  )
);
