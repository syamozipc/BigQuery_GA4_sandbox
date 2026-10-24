// 学習ガイド共通スクリプト: 現在の章のハイライト / コードのコピー / チェックリストの進捗保存
(function () {
  var root = document.querySelector("[data-page-id]");
  var page = root ? root.getAttribute("data-page-id") : "";
  var KEY = "ga4guide:";

  function load(k) { try { return JSON.parse(localStorage.getItem(KEY + k) || "null"); } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) { /* 保存できない環境は無視 */ } }

  // 章ナビの現在地
  document.querySelectorAll(".chapters a[data-page]").forEach(function (a) {
    if (a.getAttribute("data-page") === page) a.setAttribute("aria-current", "page");
  });

  // コードブロックにコピーボタン
  document.querySelectorAll("pre").forEach(function (pre) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.textContent = "コピー";
    btn.addEventListener("click", function () {
      var text = pre.querySelector("code") ? pre.querySelector("code").innerText : pre.innerText;
      var done = function () { btn.textContent = "コピーしました"; setTimeout(function () { btn.textContent = "コピー"; }, 1500); };
      try {
        navigator.clipboard.writeText(text).then(done, function () { selectText(pre); });
      } catch (e) { selectText(pre); }
    });
    pre.appendChild(btn);
  });
  function selectText(el) {
    var r = document.createRange(); r.selectNodeContents(el.querySelector("code") || el);
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  }

  // チェックリスト（このブラウザにだけ保存）
  var boxes = document.querySelectorAll(".check input[type=checkbox]");
  if (page && boxes.length) {
    var state = load("checks:" + page) || {};
    var summarize = function () {
      var done = 0;
      boxes.forEach(function (b) { if (b.checked) done++; });
      save("summary:" + page, { done: done, total: boxes.length });
    };
    boxes.forEach(function (b) {
      if (state[b.id]) b.checked = true;
      b.addEventListener("change", function () { state[b.id] = b.checked; save("checks:" + page, state); summarize(); });
    });
    summarize();
  }

  // 進捗表示（ナビと目次カード）
  document.querySelectorAll("[data-progress]").forEach(function (el) {
    var s = load("summary:" + el.getAttribute("data-progress"));
    if (s && s.total) el.textContent = "チェック " + s.done + " / " + s.total;
  });
})();
