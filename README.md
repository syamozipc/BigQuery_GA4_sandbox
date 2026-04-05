# BigQuery × GA4 サンドボックス

BigQueryとGA4を学習するために作ったリポジトリ。
テストサイトにGA4タグを埋め込み、BigQueryにデータを流し込んで分析・可視化するまでの一連の流れを実践した。

---

## 構成

```
/
├── index.html        # GA4タグ入りのテストサイト
└── dashboard.html    # BigQueryデータを表示するダッシュボード
```

**テストサイト**: https://syamozipc.github.io/BigQuery_GA4_sandbox/
<br />
**ダッシュボード**: https://syamozipc.github.io/BigQuery_GA4_sandbox/dashboard.html
<br />
**Looker Studio**: https://lookerstudio.google.com/reporting/3c89940d-f869-47be-a135-97fee528fcda/page/j5EuF
<br />
Big Query: https://console.cloud.google.com/bigquery?project=big-query-sample-492309

---

## 学んだこと

### 1. BigQueryの基本概念

BigQueryはGoogleのフルマネージド型サーバーレスデータウェアハウス。従来のRDBMSとは根本的に異なる設計思想を持つ。

**列指向ストレージ**: MySQLなどの行指向DBと異なり、列単位でデータを格納する。`SELECT name FROM users` のようなクエリでは `name` 列だけが読み込まれ、他の列は触らない。これが数十億行でも高速に分析できる理由。

**ストレージとコンピュートの分離**: データの保存と処理が独立しているため、データが増えてもクエリ性能は落ちない。

**料金モデル**: クエリが**スキャンしたデータ量**に応じて課金される（$6.25/TB）。毎月1TBまで無料。`SELECT *` は全列をスキャンするのでコストが高くなる。必要な列だけ指定するのが鉄則。

**リソース階層**: `GCPプロジェクト > データセット > テーブル > カラム` の順。テーブルの参照は `` `プロジェクトID.データセット名.テーブル名` `` の形式。

---

### 2. BigQueryの基本操作

#### データ挿入

小規模なら `INSERT INTO` でSQLから直接挿入できる。本番では大量データに向かないため、GCSからのバッチロードやStorage Write APIを使う。

```sql
INSERT INTO `tutorial.employees` (employee_id, name, department, salary)
VALUES (1, '田中太郎', 'エンジニアリング', 6000000);
```

#### クエリ実行

ワイルドカード `events_*` で複数テーブルをまとめてクエリできる。`_TABLE_SUFFIX` で日付範囲を絞るとスキャン量が減ってコスト節約になる。

```sql
SELECT event_name, COUNT(*) AS cnt
FROM `project.dataset.events_*`
WHERE _TABLE_SUFFIX BETWEEN '20260301' AND '20260401'
GROUP BY event_name
ORDER BY cnt DESC;
```

#### エクスポート

- **コンソールから**: クエリ結果の「結果を保存」→ CSVダウンロード（1GB以下）
- **SQLで**: `EXPORT DATA OPTIONS (uri = 'gs://...') AS (SELECT ...)`
- **bqコマンドで**: `bq extract --destination_format CSV dataset.table gs://...`

#### インポート

- **コンソールから**: データセット → 「テーブルを作成」→ アップロード（10MB以下）
- **SQLで**: `LOAD DATA INTO dataset.table FROM FILES (format='CSV', uris=[...])`
- **bqコマンドで**: `bq load --source_format=CSV --autodetect dataset.table ./file.csv`

---

### 3. GA4タグの導入

GA4（Google Analytics 4）のタグをWebサイトに埋め込んで計測を有効にする。

**gtag.js方式**: すべてのページの `<head>` に以下を追加。

```html
<script
  async
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag("js", new Date());
  gtag("config", "G-XXXXXXXXXX");
</script>
```

**カスタムイベントの送信**: `gtag('event', イベント名, パラメータ)` で任意のイベントを送信できる。

```javascript
gtag("event", "button_click", { button_name: "購入ボタン" });
```

GA4が自動計測するイベント: `page_view` / `session_start` / `first_visit` / `scroll` など。

---

### 4. GitHub Pagesへのデプロイ

GitHubリポジトリに `index.html` を置き、Settings → Pages → Deploy from a branch（main / root）を設定するだけで `https://ユーザー名.github.io/リポジトリ名/` として公開できる。
<br />
コードをpushするたびに自動デプロイされる。

---

### 5. GA4とBigQueryの連携

GA4管理画面 → 管理 → プロダクトのリンク設定 → BigQueryのリンク から設定する。

GCPプロジェクトを指定するとGA4が自動で `analytics_<プロパティID>` データセットを作成し、以下のテーブルを生成する。

| テーブル                   | 内容                                        |
| -------------------------- | ------------------------------------------- |
| `events_YYYYMMDD`          | 日次エクスポート（前日分が翌日届く・無料）  |
| `events_intraday_YYYYMMDD` | ストリーミング（数分で届く・有料 $0.05/GB） |

**GA4データの特徴的な構造**: `event_params` がネスト型（ARRAY of STRUCT）なので、値を取り出すには `UNNEST` が必要。

```sql
SELECT
  ep.value.string_value AS page_location,
  COUNT(*) AS pageviews
FROM `project.analytics_xxx.events_*`,
  UNNEST(event_params) AS ep
WHERE event_name = 'page_view'
  AND ep.key = 'page_location'
GROUP BY page_location;
```

**セッション数のカウント**: `user_pseudo_id` と `ga_session_id` の組み合わせが1セッション。

```sql
COUNT(DISTINCT CONCAT(user_pseudo_id,
  CAST((SELECT ep.value.int_value FROM UNNEST(event_params) ep WHERE ep.key = 'ga_session_id') AS STRING)
)) AS sessions
```

---

### 6. JSダッシュボード（dashboard.html）

Google Identity Services（GIS）でOAuth2認証を行い、BigQuery REST APIに直接クエリを投げてデータを取得・グラフ表示する。

**認証フロー**: Google Sign-Inでログイン → IDトークン取得 → アクセストークンをBigQuery API呼び出しに使用。

**BigQuery REST API**:

```javascript
const res = await fetch(
  `https://bigquery.googleapis.com/bigquery/v2/projects/${PROJECT_ID}/queries`,
  {
    method: "POST",
    headers: { Authorization: "Bearer " + accessToken },
    body: JSON.stringify({ query: sql, useLegacySql: false }),
  },
);
```

---

### 7. Looker Studio

Googleが提供する無料のBIツール。BigQueryと直接繋がり、SQLの知識がなくてもグラフや表を作れる。

**接続方法**: Looker Studio → 作成 → レポート → データソースに「BigQuery」を選択 → プロジェクト・データセット・テーブルを指定。

**特徴**:

- ドラッグ＆ドロップでグラフを追加できる
- BigQueryのデータが更新されるとレポートにも反映される
- URLで共有でき、Googleアカウントでアクセス制御が可能
- 社内ダッシュボードとして使うには十分な機能を無料で使える

---

## GCPリソース情報

| 項目             | 値                        |
| ---------------- | ------------------------- |
| プロジェクトID   | `big-query-sample-492309` |
| データセット     | `analytics_324810718`     |
| GA4 測定ID       | `G-FEHSK6QJLE`            |
| GA4 プロパティID | `324810718`               |
| リージョン       | `asia-northeast1`（東京） |

---

## クリーンアップメモ

継続して使わない場合は以下を対応する。

- [ ] ストリーミングエクスポートをオフにする（有料のため）
- [ ] GCPプロジェクトの課金を確認する

GitHub Pages・BigQuery日次エクスポート・Looker Studioは無料なのでそのままでOK。
