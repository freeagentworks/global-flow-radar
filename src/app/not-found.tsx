import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 p-8">
      <div className="text-6xl font-bold text-text-muted">404</div>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          ページが見つかりません
        </h2>
        <p className="text-sm text-text-secondary">
          お探しのページは存在しないか、移動された可能性があります。
        </p>
      </div>
      <Link
        href="/"
        className="rounded-md bg-neutral px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral/90 transition-colors"
      >
        ダッシュボードに戻る
      </Link>
    </div>
  );
}
