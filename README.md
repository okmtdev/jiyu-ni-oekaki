# じゆうに おえかき！

子供向けのお絵描きゲームです。自由に絵を描いて保存し、びじゅつかんで自分やみんなの絵を見ることができます。

## 機能

- **おえかき**: ふで・マーカー・ぶらし・けしごむ・スタンプで自由に絵が描ける
- **ほぞん**: 描いた絵を Cloud Storage に保存
- **びじゅつかん**: 自分の絵・みんなの絵（最新30件）を閲覧
- **シェア**: LINE で絵をシェア可能
- **ダウンロード**: 描いた絵を PNG でダウンロード
- **レスポンシブ**: PC・タブレット・スマホ対応

## 技術スタック

- **フロントエンド**: TypeScript + Vite（フレームワークなし）
- **バックエンド**: Google Cloud Functions（Node.js）
- **ストレージ**: Google Cloud Storage
- **ホスティング**: Google Cloud Storage（静的サイト）

## 開発方法

### 必要なもの

- Node.js 18 以上
- npm
- Google Cloud SDK（デプロイ時のみ）

### ローカル開発

```bash
# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで `http://localhost:5173` を開くとゲームが表示されます。

> **ローカルモード**: `VITE_API_URL` を設定しない場合、描いた絵は localStorage に保存されます。Cloud Storage への保存・びじゅつかんの「みんなのえ」機能を使うにはバックエンドのデプロイが必要です。

### ビルド

```bash
npm run build
```

`dist/` ディレクトリにビルド結果が出力されます。

## デプロイ手順（Google Cloud）

### 前提条件

- Google Cloud プロジェクトが作成済み
- `gcloud` CLI がインストール・認証済み
- 課金が有効化済み

```bash
# プロジェクトの設定
gcloud config set project YOUR_PROJECT_ID
```

### 1. Cloud Storage バケットの作成

```bash
# バケット作成（リージョンは東京）
gcloud storage buckets create gs://jiyu-ni-oekaki \
  --location=asia-northeast1 \
  --uniform-bucket-level-access

# バケットを公開設定に
gcloud storage buckets add-iam-policy-binding gs://jiyu-ni-oekaki \
  --member=allUsers \
  --role=roles/storage.objectViewer

# 静的ウェブサイトとして設定
gcloud storage buckets update gs://jiyu-ni-oekaki \
  --web-main-page-suffix=index.html \
  --web-not-found-page=index.html
```

### 2. Cloud Functions のデプロイ

```bash
cd functions

# 依存パッケージのインストール
npm install

# Cloud Function をデプロイ
gcloud functions deploy oekaki-api \
  --gen2 \
  --runtime=nodejs22 \
  --region=asia-northeast1 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point=api \
  --set-env-vars=BUCKET_NAME=jiyu-ni-oekaki \
  --source=.

cd ..
```

デプロイ完了後、表示される URL を控えてください。
例: `https://asia-northeast1-learings.cloudfunctions.net/oekaki-api

### 3. フロントエンドのビルドとデプロイ

```bash
# .env ファイルを作成して API URL を設定
echo "VITE_API_URL=https://asia-northeast1-learings.cloudfunctions.net/oekaki-api" > .env

# ビルド
npm run build

# Cloud Storage にアップロード
gcloud storage cp -r dist/* gs://jiyu-ni-oekaki/
```

### 4. 動作確認

以下の URL でゲームにアクセスできます：

```
https://storage.googleapis.com/jiyu-ni-oekaki/index.html
```

または、カスタムドメインを設定している場合はそのドメインでアクセスします。

### カスタムドメイン（任意）

Cloud Storage のカスタムドメイン設定については、[Google Cloud のドキュメント](https://cloud.google.com/storage/docs/hosting-static-website)を参照してください。

## プロジェクト構成

```
├── index.html              # エントリ HTML
├── src/
│   ├── main.ts             # アプリケーションエントリ・画面遷移
│   ├── style.css            # 全スタイル（レスポンシブ対応）
│   ├── api.ts               # API クライアント（Cloud Function 通信）
│   ├── storage.ts           # localStorage ヘルパー
│   ├── drawing/
│   │   └── engine.ts        # Canvas 描画エンジン
│   └── screens/
│       ├── title.ts         # タイトル画面
│       ├── drawing.ts       # お絵描き画面
│       ├── result.ts        # 保存完了画面
│       └── gallery.ts       # びじゅつかん画面
├── functions/
│   ├── package.json         # Cloud Function 依存パッケージ
│   └── index.js             # Cloud Function 本体
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.example             # 環境変数のサンプル
```

## ライセンス

MIT
