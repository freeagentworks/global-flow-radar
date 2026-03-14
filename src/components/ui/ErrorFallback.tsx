"use client";

// ============================================
// エラーフォールバックコンポーネント
// データ取得失敗時の表示とリトライ機能
// ============================================

interface ErrorFallbackProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorFallback({ message, onRetry }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-outflow/20 bg-outflow/5 p-8">
      {/* エラーアイコン */}
      <svg
        className="h-12 w-12 text-outflow"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      </svg>

      {/* エラーメッセージ */}
      <p className="text-sm text-text-secondary text-center">{message}</p>

      {/* リトライボタン */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-md border border-outflow/30 bg-outflow/10 px-4 py-2 text-sm text-outflow hover:bg-outflow/20 transition-colors"
        >
          再試行
        </button>
      )}
    </div>
  );
}
