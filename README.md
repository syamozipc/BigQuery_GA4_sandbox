# BigQuery × GA4 サンドボックス

GA4・GTM・BigQuery を包括的に学ぶためのリポジトリ。
テストサイトに計測を仕込み、GA4 の画面で見て、GTM で計測を管理し、BigQuery に流し込んで SQL で分析・可視化するまでを、手を動かしながら一通り学べるようにしている。

## 📚 学習ガイド

学習ガイド（HTML）: https://syamozipc.github.io/BigQuery_GA4_sandbox/docs/
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

## 構成

```
/
├── index.html        # テストサイト（gtag.js 直書き。仮ユーザーIDの切り替え付き）
├── gtm.html          # GTM 練習用ページ（gtag.js なし。GTM コンテナIDを画面で設定）
├── dashboard.html    # BigQuery のデータを表示するダッシュボード（翌日以降）
├── realtime.html     # GA4 Data API で過去30分をユーザー単位で表示
└── docs/             # 学習ガイド（00〜07章）
    └── assets/       # ガイド共通の CSS / JS
```

| ページ | URL |
| --- | --- |
| テストサイト | https://syamozipc.github.io/BigQuery_GA4_sandbox/ |
| GTM 練習ページ | https://syamozipc.github.io/BigQuery_GA4_sandbox/gtm.html |
| ダッシュボード | https://syamozipc.github.io/BigQuery_GA4_sandbox/dashboard.html |
| リアルタイムダッシュボード | https://syamozipc.github.io/BigQuery_GA4_sandbox/realtime.html |
| Looker Studio | https://lookerstudio.google.com/reporting/3c89940d-f869-47be-a135-97fee528fcda/page/j5EuF |
| BigQuery | https://console.cloud.google.com/bigquery?project=big-query-sample-492309 |
| Google Analytics | https://analytics.google.com/analytics/web/#/a235761773p324810718/reports/intelligenthome?params=_u..nav%3Dmaui |

### gtm.html の使い方

GTM のコンテナIDは次のどれかで指定する（上から優先）。

1. URL に `?gtm=GTM-XXXXXXX` を付ける
2. 画面の「GTM コンテナ」欄に入れて保存する（ブラウザの localStorage に保存）
3. `gtm.html` 内の `DEFAULT_GTM_ID` に書く

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
| リージョン       | `asia-northeast1`（東京） |

---

## クリーンアップメモ

継続して使わない場合は以下を対応する。

- [ ] ストリーミングエクスポートをオフにする（有料のため）
- [ ] GCP プロジェクトの課金を確認する

GitHub Pages・BigQuery 日次エクスポート・Looker Studio は無料なのでそのままで OK。
