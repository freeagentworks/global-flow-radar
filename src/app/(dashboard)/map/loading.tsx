// 世界地図ページのローディングスケルトン

export default function MapLoading() {
  return (
    <div className="space-y-6">
      {/* ヘッダー スケルトン */}
      <div className="flex items-center justify-between">
        <div className="skeleton h-8 w-56" />
        <div className="skeleton h-10 w-32 rounded-md" />
      </div>

      {/* 地図エリア スケルトン */}
      <div className="skeleton h-[500px] rounded-lg" />

      {/* 凡例・フィルター スケルトン */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="skeleton h-32 rounded-lg" />
        <div className="skeleton h-32 rounded-lg" />
        <div className="skeleton h-32 rounded-lg" />
      </div>
    </div>
  );
}
