"use client";

import { useEffect } from "react";
import { useAppSettings } from "@/lib/stores/theme-store";

/**
 * ページロード時にlocalStorageから保存されたテーマを
 * <html>のクラスに同期するコンポーネント
 */
export function ThemeInitializer() {
  const theme = useAppSettings((s) => s.theme);

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, [theme]);

  return null;
}
