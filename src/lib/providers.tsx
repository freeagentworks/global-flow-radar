"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ToastContainer } from "@/components/ui/Toast";
import { ThemeInitializer } from "@/components/layout/ThemeInitializer";

// TanStack Query + 各種プロバイダーの統合ラッパー
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // データは1時間キャッシュ（Redisキャッシュと同期）
            staleTime: 60 * 60 * 1000,
            // エラー時は3回リトライ
            retry: 3,
            // バックグラウンドでの再検証を有効化
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeInitializer />
      {children}
      <ToastContainer />
    </QueryClientProvider>
  );
}
