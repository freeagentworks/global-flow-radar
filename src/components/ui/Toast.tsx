"use client";

import { create } from "zustand";
import { useEffect } from "react";

// ============================================
// トースト通知コンポーネント
// アプリ全体で使用するトースト通知のストアとUI
// ============================================

/** トースト型 */
export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  timestamp: number;
}

/** トーストストアの型 */
interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type: Toast["type"]) => void;
  removeToast: (id: string) => void;
}

// Zustandストア: トースト通知の状態管理
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const toast: Toast = { id, message, type, timestamp: Date.now() };
    set((state) => ({ toasts: [...state.toasts, toast] }));
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

// トーストの色設定マップ
const TYPE_STYLES: Record<Toast["type"], string> = {
  success: "border-green-500/40 bg-green-500/10 text-green-400",
  error: "border-red-500/40 bg-red-500/10 text-red-400",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  info: "border-blue-500/40 bg-blue-500/10 text-blue-400",
};

// トーストアイコンマップ
const TYPE_ICONS: Record<Toast["type"], string> = {
  success: "\u2713",
  error: "\u2717",
  warning: "\u26A0",
  info: "\u2139",
};

/** 個別トーストアイテム */
function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast);

  // 5秒後に自動消去
  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, removeToast]);

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm animate-slide-in ${TYPE_STYLES[toast.type]}`}
      role="alert"
    >
      <span className="text-lg shrink-0">{TYPE_ICONS[toast.type]}</span>
      <p className="text-sm flex-1">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 text-text-secondary hover:text-text-primary transition-colors"
        aria-label="閉じる"
      >
        &times;
      </button>
    </div>
  );
}

/** トーストコンテナ - 画面右下に固定表示 */
export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
