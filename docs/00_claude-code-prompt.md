# Claude Code 初期プロンプト - Global Flow Radar

以下をそのままClaude Codeの最初のプロンプトとして貼り付けてください。

---

## プロンプト（ここから）

あなたはフルスタックWebアプリケーション「Global Flow Radar」の開発パートナーです。
世界の投資資金がどこから流出し、どこに流入しているかを検知・可視化するプラットフォームを構築します。

### プロジェクトドキュメント

このプロジェクトの全ドキュメントは `docs/` フォルダにあります。作業を始める前に、必ず以下のファイルを全て読み込んでください：

```
docs/
├── 01_requirements.md        # 要求定義書（ユーザーストーリー、全機能一覧、KPI）
├── 02_architecture.md        # システムアーキテクチャ（技術スタック、DB設計SQL、パイプライン）
├── 03_data-sources.md        # データソース仕様（API一覧、取得対象ティッカー全リスト、収集スケジュール）
├── 04_feature-spec.md        # 機能仕様書（全7画面のレイアウト、インタラクション）
├── 05_phase-plan.md          # 開発フェーズ計画（Phase 0〜3、週次タスク）
├── 06_api-design.md          # API設計書（全エンドポイント、レスポンスJSON例、TypeScript型定義）
└── 07_ui-wireframe.md        # UI/UXワイヤーフレーム（カラーパレット、タイポグラフィ、ASCIIワイヤーフレーム）
```

### 技術スタック（確定済み）

- **フロントエンド**: Next.js 14+ (App Router) + TypeScript + Tailwind CSS
- **可視化**: D3.js（世界地図・サンキー図）、Mapbox GL JS（地図）、Recharts（チャート）
- **状態管理**: Zustand
- **データフェッチ**: TanStack Query
- **多言語**: next-intl（デフォルト日本語 + 英語切替）
- **バックエンド**: Next.js API Routes + Python（データ収集バッチ）
- **データベース**: PostgreSQL + TimescaleDB（Supabase）
- **キャッシュ**: Redis（Upstash）
- **ORM**: Prisma
- **デプロイ**: Vercel（フロント）+ Railway（Pythonバッチ）
- **テーマ**: ダークモードをデフォルト

### 開発ルール

1. **ドキュメント準拠**: docs/ のドキュメントに記載された設計・仕様に忠実に実装してください。不明点があれば確認してください。
2. **Phase 0から順番に**: `05_phase-plan.md` のPhase 0（Week 1）から順に進めてください。
3. **テスト可能な単位で**: 各タスク完了後に動作確認できる状態を維持してください。
4. **型安全**: TypeScriptのstrict modeを有効化し、any型の使用を避けてください。
5. **コンポーネント分割**: `02_architecture.md` のコンポーネント設計方針に従って適切にファイルを分割してください。
6. **コミットメッセージ**: Conventional Commits（feat:, fix:, docs: 等）を使用してください。
7. **環境変数**: APIキー等はすべて `.env.local` で管理し、`.env.example` を用意してください。
8. **エラーハンドリング**: API障害時のフォールバック表示を常に意識してください。
9. **日本語コメント**: コード内のコメントは日本語で書いてください。

### 現在の状況

- プロジェクトフォルダ: `~/Desktop/global-flow-radar/`
- docs/ フォルダに7つの設計ドキュメントが格納済み
- コードはまだ一切書かれていない（ゼロからのスタート）
- 開発者は1名（AI支援あり）
- MVPリリース目標: 2.5ヶ月

### 最初のタスク

Phase 0 / Week 1 のタスク 0-1 から開始してください：

**タスク 0-1: Next.js プロジェクト初期化**
- Next.js 14+ (App Router) + TypeScript + Tailwind CSS + ESLint 設定
- 必要パッケージのインストール（D3.js, Mapbox, Recharts, TanStack Query, Zustand, next-intl, Prisma等）
- ダークモードのTailwind設定
- ディレクトリ構造の作成（`02_architecture.md` の2.3節参照）
- `.env.example` の作成
- `npm run dev` で起動確認できる状態にする

docs/ フォルダを読み込んだ後、まず全体のドキュメント構成を把握したことを報告し、タスク 0-1 に着手してください。

---

## 補足メモ

- TBD項目（AI/ML活用範囲、ユーザー認証のMVP包含可否、ダッシュボードカスタマイズ、SNSシェア、課金モデル）は未確定のため、Phase 2以降で検討
- 無料APIベースで構築（Yahoo Finance, FRED, CFTC COT）
- データ更新頻度は日次（前日終値ベース）、Cronバッチは JST 07:00 実行
- 世界の全主要市場をカバー（米国、日本、欧州、中国、新興国、フロンティア）
