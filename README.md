# Global Flow Radar

**世界の投資資金フロー検知・可視化プラットフォーム**

## プロジェクト概要

世界中の投資資金がどこから流出し、どこに流入しているかをリアルタイムに検知・可視化するWebアプリケーション。国・地域レベルからセクター、資産クラス、個別銘柄レベルまで、多層的な資金フローを追跡し、投資判断を支援する。

## ターゲットユーザー

- 個人トレーダー（自身の投資判断支援）
- 一般投資家（SaaS利用）
- セミナー・教育用途（デモツール）

## 技術スタック

- **フロントエンド**: Next.js (App Router) + TypeScript
- **可視化**: D3.js / Recharts / Mapbox GL JS
- **バックエンド**: Next.js API Routes + Python (データ収集)
- **データベース**: PostgreSQL + TimescaleDB (時系列)
- **デプロイ**: Vercel (フロント) + Railway/Render (バックエンド)

## プロジェクト構造

```
global-flow-radar/
├── README.md
├── docs/
│   ├── 01_requirements.md        # 要求定義書
│   ├── 02_architecture.md        # システムアーキテクチャ
│   ├── 03_data-sources.md        # データソース仕様書
│   ├── 04_feature-spec.md        # 機能仕様書
│   ├── 05_phase-plan.md          # 開発フェーズ計画
│   ├── 06_api-design.md          # API設計書
│   └── 07_ui-wireframe.md        # UI/UXワイヤーフレーム仕様
├── src/                          # (開発時に生成)
├── public/
└── package.json
```

## クイックスタート

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# データ収集バッチ実行
python scripts/collect_data.py
```

## ライセンス

Private - All Rights Reserved
