# BigQuery × GA4 サンドボックス

BigQueryとGA4を学習するために作ったリポジトリ。
テストサイトにGA4タグを埋め込み、BigQueryにデータを流し込んで分析・可視化するまでの一連の流れを実践した。

---

## 構成

```
/
├── index.html        # GA4タグ入りのテストサイト（仮ユーザーIDの切り替え付き）
├── dashboard.html    # BigQueryデータを表示するダッシュボード（翌日以降）
└── realtime.html     # GA4 Data APIで過去30分をユーザー単位で表示
```

**テストサイト**: https://syamozipc.github.io/BigQuery_GA4_sandbox/
<br />
**ダッシュボード**: https://syamozipc.github.io/BigQuery_GA4_sandbox/dashboard.html
<br />
**リアルタイムダッシュボード**: https://syamozipc.github.io/BigQuery_GA4_sandbox/realtime.html
<br />
**Looker Studio**: https://lookerstudio.google.com/reporting/3c89940d-f869-47be-a135-97fee528fcda/page/j5EuF
<br />
Big Query: https://console.cloud.google.com/bigquery?project=big-query-sample-492309
<br />
Google Analytics: https://analytics.google.com/analytics/web/#/a235761773p324810718/reports/intelligenthome?params=_u..nav%3Dmaui

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

### 8. ユーザー単位の計測（User-ID / user_properties）

ユーザーごとにデータを見たい場合、UUIDなどの自前IDを2通りの形でGA4に送る。値は同じでも役割と使える場所が違う。

| | `user_id` | `user_properties` |
|---|---|---|
| 正体 | GA4の予約識別子 | 自作のユーザースコープ属性 |
| 設定作業 | 管理 → レポートID で有効化 | 管理 → カスタム定義 に登録 |
| レポートで絞り込み | **できない** | できる（比較・セグメント） |
| ユーザーエクスプローラ | **できる**（行がUser-IDになる） | — |
| BigQuery | `user_id` 列 | `user_properties` 列（ARRAY of STRUCT） |

```javascript
// user_properties は値が36文字までなのでUUIDがちょうど収まる
gtag("set", "user_properties", {
  app_user_id: uuid,
  plan: "pro",
  user_type: "returning",
});
gtag("config", "G-XXXXXXXXXX", { user_id: uuid });
```

**IDを途中で切り替える場合**: `gtag('config')` を再実行するが、そのままだと `page_view` が重複送信されるので `send_page_view: false` を付ける。

**debug_mode の注意**: 公式ドキュメントには `gtag('config', ID, {debug_mode: true})` で DebugView に出ると書かれているが、実測すると現在の gtag.js は `_dbg=1` ではなく `ep.debug_mode=true`（ただのイベントパラメータ）として送るだけで、DebugViewには現れなかった。DebugViewを使いたい場合は [Tag Assistant](https://tagassistant.google.com) で接続するか、Chrome拡張の Google Analytics Debugger を使う。

---

### 9. GA4管理画面でのユーザー別絞り込み

**準備**: 管理 → データの表示 → **カスタム定義** → カスタムディメンションを作成（範囲=ユーザー、ユーザープロパティ名を指定）。あわせて 管理 → **レポート ID**（旧「レポート用識別子」）で User-ID を優先させる。

| 見たいもの | 場所 | 反映 |
|---|---|---|
| ユーザープロパティ別の即時集計 | リアルタイムの概要 → 「アクティブユーザー: **ユーザープロパティ別**」カード | 数秒 |
| 絞り込んだ数値 | リアルタイム → 「比較を追加」 → 新規作成 | 数秒 |
| ユーザー個別のイベント履歴 | 探索 → **ユーザーエクスプローラ** | 数時間 |
| 通常レポートでの集計 | レポート → エンゲージメント → イベント | 最大24〜48時間 |

カスタムディメンションは登録後に収集されたデータのみが対象。ただし**リアルタイムには即反映**され、「最大48時間」がかかるのは通常レポートと探索の方。

GA4 UIのリアルタイムは過去30分固定・カード固定で、任意のディメンション×指標の組み合わせやセグメントは使えない。

---

### 10. GA4 Data APIでリアルタイム分析（realtime.html）

GA4 UIの制約を超えて自由に分析したい場合、Data APIの `runRealtimeReport` を直接叩けば過去30分のデータを任意のディメンション×指標で取得できる。無料。

**準備**: GCPで Google Analytics Data API を有効化し、OAuth同意画面に `analytics.readonly` スコープを追加する。

```javascript
// ユーザースコープのカスタムディメンションは customUser: プレフィックスで参照する
const res = await fetch(
  `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runRealtimeReport`,
  {
    method: "POST",
    headers: { Authorization: "Bearer " + accessToken },
    body: JSON.stringify({
      dimensions: [{ name: "customUser:app_user_id" }],
      metrics: [{ name: "activeUsers" }, { name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName: "customUser:app_user_id",
          stringFilter: { matchType: "EXACT", value: uuid },
        },
      },
    }),
  },
);
```

`minutesAgo` ディメンション（"0"〜"29"）を使うと分単位の推移が取れる。

**ユーザー単位で使う場合の制約**:

- **しきい値**: Googleシグナル有効時、少人数のデータはプライバシー保護で非表示になる
- **(other) 丸め**: UUIDのようなカーディナリティの高いディメンションは行数上限を超えると `(other)` に集約される
- **クォータ**: 標準プロパティは1日あたりのトークン上限あり。短間隔ポーリングは要注意
- **認証**: ブラウザ直叩きはログインした人の権限になる。誰でも見る画面ならサーバー側でサービスアカウントを使う

集計・傾向を見るならAPIで十分だが、特定ユーザーの行動履歴を業務画面に正確に出したいなら、しきい値と `(other)` 丸めで欠損するので BigQueryエクスポートか自社DBの方が確実。

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
