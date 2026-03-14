"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 p-8">
      <svg
        className="h-16 w-16 text-outflow"
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
      <div className="text-center">
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          予期しないエラーが発生しました
        </h2>
        <p className="text-sm text-text-secondary max-w-md">
          {error.message || "アプリケーションでエラーが発生しました。再試行してください。"}
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-text-muted font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>
      <button
        onClick={reset}
        className="rounded-md border border-outflow/30 bg-outflow/10 px-6 py-2.5 text-sm font-medium text-outflow hover:bg-outflow/20 transition-colors"
      >
        再試行
      </button>
    </div>
  );
}
