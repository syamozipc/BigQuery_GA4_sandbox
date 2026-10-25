// 分析ページ用の Google ログイン
//
// 方式: Google Identity Services の「トークンモデル」（認可コードフローではない）
//   1. 「Google でログイン」ボタンで ID トークンを受け取り、名前を表示する（API には使わない）
//   2. 続けて、BigQuery と GA4 の読み取り権限をまとめたアクセストークンを要求する
//      → Google がブラウザに直接アクセストークンを渡す。コードもトークンエンドポイントも使わない
//
// アクセストークンはこのファイルの中の変数にだけ持つ。
//   - sessionStorage / localStorage には保存しない
//   - ページを移動・再読み込み・閉じると消える（そのたびにログインし直す）
//   - ログアウトでは Google 側でもトークンを取り消す
const SandboxAuth = (() => {
  const CLIENT_ID = "973636857836-8j3p9s89jknl45nsu7459np3gnsudev7.apps.googleusercontent.com";
  const SCOPES = [
    "https://www.googleapis.com/auth/bigquery.readonly",
    "https://www.googleapis.com/auth/analytics.readonly",
  ];
  let current = null; // { token, exp, name }

  // 期限が1分以上残っていれば返す
  function get() {
    return current && current.exp > Date.now() + 60 * 1000 ? current : null;
  }

  // ログアウト: Google 側でトークンを取り消し、変数からも消す
  function clear() {
    if (current && window.google?.accounts?.oauth2) google.accounts.oauth2.revoke(current.token, () => {});
    current = null;
    if (window.google?.accounts?.id) google.accounts.id.disableAutoSelect();
  }

  // 期限切れなどで使えなくなったトークンを捨てる（取り消しはしない）
  function forget() {
    current = null;
  }

  // ID トークン（JWT）の中身を読む。日本語の名前も崩れないように UTF-8 として解釈する
  function decodeJwt(jwt) {
    const b64 = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  // GIS のボタンから呼ばれる。成功したら onDone() を呼ぶ
  function handleCredential(credential, onDone, onError) {
    const name = decodeJwt(credential.credential).name || "";
    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES.join(" "),
      callback: (resp) => {
        if (resp.error) return onError("認証エラー: " + resp.error);
        if (!google.accounts.oauth2.hasGrantedAllScopes(resp, ...SCOPES)) {
          return onError("BigQuery と Google アナリティクスの両方の閲覧を許可してください。");
        }
        current = { token: resp.access_token, exp: Date.now() + Number(resp.expires_in || 3600) * 1000, name };
        onDone();
      },
    });
    client.requestAccessToken();
  }

  return { get, clear, forget, handleCredential };
})();
