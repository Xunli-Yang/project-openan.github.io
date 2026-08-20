/* ============================================================
   Navbar Component — 统一导航注入器
   配合 components/navbar.html（模板）与 components/navbar.css（样式）。

   页面接入方式：
     <div id="navbar" data-active="index|best-practices|governance">
       …<noscript> 兜底导航（无 JS 环境）…
     </div>
     <script src="components/navbar.js" defer></script>

   行为（详见 docs/adr/ADR-002-unified-navbar-component.md）：
   1. fetch 模板并注入占位符；
   2. 依占位符 data-active 为 .nav a[data-nav=…] 添加 .active
      （值为 index 即首页，不标记任何链接）；
   3. 非首页时把 .logo 的 "#" 改为 "index.html"，其余 a[href^="#"]
      改写为 "index.html#…" 跨页格式；首页保持同页锚点平滑滚动。

   注：fetch 在 file:// 协议下不可用，本地预览请使用 HTTP 服务
   （如 python -m http.server）；JS 禁用时由 <noscript> 提供基础导航。
   ============================================================ */
(function () {
  'use strict';

  var host = document.getElementById('navbar');
  if (!host) return;

  function isHomePage() {
    var path = window.location.pathname;
    return /(^|\/)index\.html$/i.test(path) || /\/$/.test(path);
  }

  fetch('components/navbar.html')
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    })
    .then(function (html) {
      host.innerHTML = html;

      // 1. Active state：依据占位符 data-active 标记当前页链接
      var active = host.getAttribute('data-active');
      if (active && active !== 'index') {
        var current = host.querySelector('.nav a[data-nav="' + active + '"]');
        if (current) current.classList.add('active');
      }

      // 2. 跨页锚点改写：子页面跳回首页时使用跨页格式
      if (!isHomePage()) {
        var logo = host.querySelector('.logo');
        if (logo) logo.setAttribute('href', 'index.html');

        host.querySelectorAll('a[href^="#"]').forEach(function (a) {
          if (a.classList.contains('logo')) return;
          a.setAttribute('href', 'index.html' + a.getAttribute('href'));
        });
      }
    })
    .catch(function (err) {
      // fetch 失败（典型场景：file:// 直接打开）：占位符内 <noscript>
      // 在 JS 启用时不渲染，这里给出可见提示，避免页面顶部空白。
      console.error('[navbar] 组件注入失败，请通过 HTTP 服务访问：', err);
      var note = document.createElement('p');
      note.textContent = '导航加载失败：请通过 HTTP 服务访问本站。';
      note.style.cssText =
        'margin:0;padding:12px 24px;font-family:ui-monospace,monospace;' +
        'font-size:0.8rem;color:#e06c75;background:rgba(224,108,117,0.08);' +
        'border-bottom:1px solid rgba(224,108,117,0.3);';
      host.appendChild(note);
    });
})();