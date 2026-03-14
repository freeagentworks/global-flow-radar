/**
 * エラーモニタリングユーティリティ
 * Sentry 導入時はここを差し替える
 */

type ErrorSeverity = "fatal" | "error" | "warning" | "info";

interface ErrorContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: { id: string };
}

export function captureError(
  error: Error,
  severity: ErrorSeverity = "error",
  context?: ErrorContext,
): void {
  // 本番環境では Sentry に送信
  // if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  //   Sentry.captureException(error, { level: severity, ...context });
  // }

  // 開発環境ではコンソールに出力
  const method = severity === "fatal" || severity === "error" ? "error" : "warn";
  console[method](`[${severity.toUpperCase()}]`, error.message, context?.extra);
}

export function captureMessage(
  message: string,
  severity: ErrorSeverity = "info",
): void {
  if (severity === "error" || severity === "fatal") {
    console.error(`[${severity.toUpperCase()}]`, message);
  } else {
    console.log(`[${severity.toUpperCase()}]`, message);
  }
}

export function setUserContext(userId: string): void {
  // Sentry.setUser({ id: userId });
  console.debug("[monitoring] user context set:", userId);
}
