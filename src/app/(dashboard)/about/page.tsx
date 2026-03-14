import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "概要・免責事項",
};

// プロジェクト概要・免責事項・使い方ページ（タスク 2-11, 2-12）
export default function AboutPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold text-text-primary">
        Global Flow Radar について
      </h1>

      {/* 概要 */}
      <section className="rounded-lg border border-border bg-bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">概要</h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          Global Flow Radar は、世界の投資資金がどこから流出し、どこに流入しているかを
          検知・可視化するプラットフォームです。個人投資家やトレーダーが、
          グローバルな資金の流れを直感的に把握できることを目指しています。
        </p>
        <p className="text-sm text-text-secondary leading-relaxed">
          ETFの資金フロー、為替動向、国債利回り、先物市場のポジションデータなど
          複数の指標を組み合わせて、地域間・セクター間・資産クラス間の資金移動を推計しています。
        </p>
      </section>

      {/* 使い方 */}
      <section className="rounded-lg border border-border bg-bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">使い方</h2>
        <div className="space-y-3 text-sm text-text-secondary">
          <div className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-neutral/20 text-neutral flex items-center justify-center text-xs font-bold">1</span>
            <div>
              <p className="font-medium text-text-primary">ダッシュボード</p>
              <p>本日の資金フロー概況、マーケットサマリー、ETFランキングを一目で確認</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-neutral/20 text-neutral flex items-center justify-center text-xs font-bold">2</span>
            <div>
              <p className="font-medium text-text-primary">フローマップ</p>
              <p>世界地図上で地域間の資金移動を矢印・バブル・ヒートマップで可視化</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-neutral/20 text-neutral flex items-center justify-center text-xs font-bold">3</span>
            <div>
              <p className="font-medium text-text-primary">セクター・資産クラス</p>
              <p>GICS 11セクターのヒートマップ、資産クラス間のサンキー図、リスクオン/オフメーターで市場の温度感を把握</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-neutral/20 text-neutral flex items-center justify-center text-xs font-bold">4</span>
            <div>
              <p className="font-medium text-text-primary">ETFトラッカー</p>
              <p>個別ETFの資金フロー・価格チャートを確認。流入/流出ランキングで注目銘柄を発見</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-neutral/20 text-neutral flex items-center justify-center text-xs font-bold">5</span>
            <div>
              <p className="font-medium text-text-primary">アラート</p>
              <p>異常な資金フローを自動検知。カスタムルールで閾値を設定可能</p>
            </div>
          </div>
        </div>
      </section>

      {/* フロースコアについて */}
      <section className="rounded-lg border border-border bg-bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">フロースコアについて</h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          フロースコアは -100 〜 +100 の範囲で表示されます。
          正の値は資金流入（Inflow）、負の値は資金流出（Outflow）を示します。
        </p>
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div className="rounded-md bg-outflow/20 p-3">
            <p className="text-outflow font-semibold">-100 〜 -30</p>
            <p className="text-text-secondary mt-1">強い流出</p>
          </div>
          <div className="rounded-md bg-neutral/20 p-3">
            <p className="text-neutral font-semibold">-30 〜 +30</p>
            <p className="text-text-secondary mt-1">中立</p>
          </div>
          <div className="rounded-md bg-inflow/20 p-3">
            <p className="text-inflow font-semibold">+30 〜 +100</p>
            <p className="text-text-secondary mt-1">強い流入</p>
          </div>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          スコアは以下の指標を加重平均して算出しています：
        </p>
        <ul className="text-sm text-text-secondary space-y-1 list-disc pl-5">
          <li>ETF資金フロー（推計）: 40%</li>
          <li>為替フロー信号: 25%</li>
          <li>国債利回りスプレッド: 20%</li>
          <li>CFTC先物ポジション: 15%</li>
        </ul>
      </section>

      {/* データソース */}
      <section className="rounded-lg border border-border bg-bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">データソース</h2>
        <div className="space-y-3 text-sm text-text-secondary">
          <div>
            <p className="font-medium text-text-primary">Yahoo Finance</p>
            <p>ETF価格・出来高・AUMデータ（日次更新）</p>
          </div>
          <div>
            <p className="font-medium text-text-primary">FRED (Federal Reserve Economic Data)</p>
            <p>金利・為替・マクロ経済指標（日次〜月次）</p>
          </div>
          <div>
            <p className="font-medium text-text-primary">CFTC COT Reports</p>
            <p>先物市場の投機筋・実需筋ポジションデータ（週次）</p>
          </div>
        </div>
        <p className="text-xs text-text-muted mt-2">
          データは毎日 JST 07:00 に更新されます。
        </p>
      </section>

      {/* 免責事項 */}
      <section className="rounded-lg border border-warning/30 bg-warning/5 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">免責事項</h2>
        <div className="text-sm text-text-secondary leading-relaxed space-y-3">
          <p>
            本サイトで提供される情報は、投資助言、推奨、または勧誘を目的としたものではありません。
          </p>
          <p>
            掲載されているデータや分析結果は、公開情報に基づく推計値であり、
            正確性や完全性を保証するものではありません。
            特に「フロースコア」は複数のプロキシ指標を組み合わせた推計値であり、
            実際の資金フローとは異なる場合があります。
          </p>
          <p>
            投資判断はご自身の責任において行ってください。
            本サイトの利用により生じた損害について、運営者は一切の責任を負いません。
          </p>
          <p className="text-xs text-text-muted">
            本サイトは金融商品取引法に基づく投資助言業の登録を受けておらず、
            有価証券の売買の勧誘を行うものではありません。
          </p>
        </div>
      </section>

      {/* 技術情報 */}
      <section className="rounded-lg border border-border bg-bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">技術情報</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-text-muted">フロントエンド</p>
            <p className="text-text-secondary">Next.js + TypeScript + Tailwind CSS</p>
          </div>
          <div>
            <p className="text-text-muted">可視化</p>
            <p className="text-text-secondary">D3.js + Recharts</p>
          </div>
          <div>
            <p className="text-text-muted">データ収集</p>
            <p className="text-text-secondary">Python + yfinance + fredapi</p>
          </div>
          <div>
            <p className="text-text-muted">データベース</p>
            <p className="text-text-secondary">PostgreSQL + TimescaleDB</p>
          </div>
        </div>
      </section>
    </div>
  );
}
