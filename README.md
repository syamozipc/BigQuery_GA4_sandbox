# GA4・GTM・BigQuery サンドボックス

GA4・GTM・BigQuery を包括的に学ぶためのリポジトリ。
テストサイトに計測を仕込み、GA4 の画面で見て、GTM で計測を管理し、BigQuery に流し込んで SQL で分析・可視化するまでを、手を動かしながら一通り学べるようにしている。

## 📚 学習ガイド

学習ガイド（HTML）: https://syamozipc.github.io/GA4_GTM_BigQuery_sandbox/docs/
<br />
ローカルで読む場合は [docs/index.html](docs/index.html) を開く（`python3 -m http.server 8000` → http://localhost:8000/docs/）。

上から順に進めるのがおすすめ。**基礎** は仕組みの理解、**ハンズオン** はテストサイトと各管理画面を実際に操作する章。

| 章 | 種類 | 内容 |
| --- | --- | --- |
| [00 全体像とロードマップ](docs/index.html) | — | データの流れの全体図、リポジトリ構成、GCP/GA4 のリソース情報、用語集 |
| [01 GA4の基礎](docs/ga4-basics.html) | 基礎 | イベント・パラメータ・ユーザープロパティ、スコープ、user_id / user_properties、gtag.js の導入、画面の見取り図、上限値 |
| [02 カスタムディメンションを画面で見る](docs/ga4-custom-dimensions.html) | ハンズオン | 実装したパラメータをカスタム定義に登録し、リアルタイム・探索・標準レポートで見る。キーイベント |
| [03 GTMの基礎](docs/gtm-basics.html) | 基礎 | タグ・トリガー・変数、dataLayer の仕組み、「dataLayer.push 方式」と「クラス名・data属性で拾う方式」の違い |
| [04 GTMを実際に使う](docs/gtm-tutorial.html) | ハンズオン | [gtm.html](gtm.html) で両方式を設定し、クラス名変更で壊れ方を比べ、公開まで行う |
| [05 BigQueryの基礎](docs/bigquery-basics.html) | 基礎 | 列指向・料金・リソース階層、基本操作（挿入・クエリ・インポート/エクスポート）、BigQuery 特有の SQL |
| [06 GA4データをBigQueryへ](docs/bigquery-export.html) | ハンズオン | エクスポート設定、テーブル構造、UNNEST、SQL レシピ集（パラメータ・ユーザー・セッション・ファネル・GTM比較） |
| [07 可視化とAPI](docs/visualize.html) | ハンズオン | Looker Studio、dashboard.html（BigQuery API）、realtime.html（GA4 Data API）の仕組みと使い分け |

ハンズオンの章にはチェック項目があり、進捗はブラウザに保存されて 00 章のカードに表示される。

---

## サイトの構成

学習ガイドと4つの練習用ページでできている。練習用ページは、GA4 にデータを **送る** 2ページと、届いたデータを **見る** 2ページに分かれる。どのページも上部の共通メニューで行き来できる。

| 役割 | ページ | 何をするか | 使う章 |
| --- | --- | --- | --- |
| 送る | [テストサイト（gtag.js）](https://syamozipc.github.io/GA4_GTM_BigQuery_sandbox/) `index.html` | gtag.js 直書きでイベントを送る。仮ユーザーの切り替え付き | 01・02 |
| 送る | [GTM 練習ページ](https://syamozipc.github.io/GA4_GTM_BigQuery_sandbox/gtm.html) `gtm.html` | GTM 経由でイベントを送る。dataLayer の中身を表示 | 03・04 |
| 見る | [BigQuery ダッシュボード](https://syamozipc.github.io/GA4_GTM_BigQuery_sandbox/dashboard.html) `dashboard.html` | BigQuery の生データを SQL で集計。実行した SQL と処理量も表示 | 05〜07 |
| 見る | [リアルタイム ダッシュボード](https://syamozipc.github.io/GA4_GTM_BigQuery_sandbox/realtime.html) `realtime.html` | GA4 Data API で過去30分を集計。送ったリクエストも表示 | 07 |

```
/
├── index.html        # 送る: テストサイト（gtag.js）
├── gtm.html          # 送る: GTM 練習ページ（GTM-KXV4CBBD）
├── dashboard.html    # 見る: BigQuery ダッシュボード
├── realtime.html     # 見る: リアルタイム ダッシュボード
└── docs/             # 学習ガイド（00〜07章）
    └── assets/       # ガイド共通の CSS / JS
```

| 外部の管理画面 | URL |
| --- | --- |
| Google Analytics | https://analytics.google.com/analytics/web/#/a235761773p324810718/reports/intelligenthome |
| Google タグマネージャー | https://tagmanager.google.com/ （コンテナ GTM-KXV4CBBD） |
| BigQuery | https://console.cloud.google.com/bigquery?project=big-query-sample-492309 |
| Looker Studio | https://lookerstudio.google.com/reporting/3da2a9b6-1aa5-4c50-b2c1-fafaf4a64cdc/page/zB4BG |

### gtm.html の使い方

GTM コンテナ `GTM-KXV4CBBD` を読み込む。別のコンテナで試すときは、`gtm.html` の `window.GTM_ID` と、`<body>` 直後の noscript の `id=` の2か所を書き換える。

右側に dataLayer の中身がリアルタイムで表示されるので、ボタンを押したときに何が積まれるかを見ながら GTM を設定できる。

---

## これまでの学びの要点

詳しくは各章に書いてある。旧 README の各節は次の章に移した。

| 旧 README の節 | 移動先 |
| --- | --- |
| 1. BigQuery の基本概念 / 2. 基本操作 | [05 BigQueryの基礎](docs/bigquery-basics.html) |
| 3. GA4 タグの導入 | [01 GA4の基礎](docs/ga4-basics.html#implement) |
| 4. GitHub Pages へのデプロイ | [00 全体像](docs/index.html#repo) |
| 5. GA4 と BigQuery の連携 | [06 GA4データをBigQueryへ](docs/bigquery-export.html) |
| 6. JS ダッシュボード / 7. Looker Studio / 10. GA4 Data API | [07 可視化とAPI](docs/visualize.html) |
| 8. ユーザー単位の計測（User-ID / user_properties） | [01 GA4の基礎](docs/ga4-basics.html#userid) |
| 9. GA4 管理画面でのユーザー別絞り込み | [02 カスタムディメンションを画面で見る](docs/ga4-custom-dimensions.html#realtime) |

- **送ることと登録することは別作業**。送ったパラメータは GA4 に届くが、画面で使うにはカスタム定義への登録が必要。ただし `method` など既定ディメンションと同じ名前のパラメータは登録なしで見える。BigQuery には登録なしで全部入る。
- **user_id と user_properties は役割が違う**。user_id はユーザーエクスプローラ用、絞り込みには user_properties をユーザースコープで登録して使う。
- **ID を途中で切り替えるとき**は `gtag('config')` に `send_page_view: false` を付けて重複 PV を防ぐ。
- **debug_mode は実測では DebugView に出なかった**。DebugView は Tag Assistant で接続して使う。
- **GTM は成果系を dataLayer、UI クリックを data属性** で計測すると壊れにくい。クラス名で拾う方式はデザイン改修で黙って止まる。
- **BigQuery は UNNEST が肝**。`(SELECT value.string_value FROM UNNEST(event_params) WHERE key = '…')` の形で列にする。
- **GA4 画面と BigQuery の数字は完全には合わない**（推定値・しきい値・タイムゾーン）。正確なユーザー単位の履歴は BigQuery が正。

---

## GCP リソース情報

| 項目             | 値                        |
| ---------------- | ------------------------- |
| プロジェクトID   | `big-query-sample-492309` |
| データセット     | `analytics_324810718`     |
| GA4 測定ID       | `G-FEHSK6QJLE`            |
| GA4 プロパティID | `324810718`               |
| GTM コンテナID   | `GTM-KXV4CBBD`            |
| リージョン       | `asia-northeast1`（東京） |

---

## クリーンアップメモ

継続して使わない場合は以下を対応する。

- [ ] ストリーミングエクスポートをオフにする（有料のため）
- [ ] GCP プロジェクトの課金を確認する

GitHub Pages・BigQuery 日次エクスポート・Looker Studio は無料なのでそのままで OK。
