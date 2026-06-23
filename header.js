/**
 * header.js — DIGER Portal SOL
 * Global header component. Include in every page BEFORE other scripts.
 * Reads sessionStorage, guards unauthenticated access, and exposes cerrarSesion().
 */
(function () {
  'use strict';

  var SESSION_KEY = 'diger_sol_session';

  // ── Read session ──────────────────────────────────────────────
  var _ses = null;
  try { _ses = JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch (_) {}

  // ── Guard: redirect to login on any page except index.html ───
  var _path = window.location.pathname;
  var _file = _path.split('/').pop();
  var _isLogin = (_file === 'index.html' || _file === '' || _path === '/');
  if (!_ses && !_isLogin) {
    window.location.replace('index.html');
    return;
  }

  // ── Shared CSS vars (keep in sync with index.html :root) ─────
  var CSS = [
    ':root{',
      '--azul:#0a2d6e;--azul-m:#1455a4;--azul-c:#e8f0ff;',
      '--gris:#eef1f7;--borde:#dde4f0;--texto:#1c2333;--muted:#64748b;',
      '--verde:#16a34a;--rojo:#dc2626;--blanco:#fff;',
    '}',
    '.dh{',
      'background:var(--blanco);padding:14px 2rem;',
      'display:flex;align-items:center;justify-content:space-between;',
      'box-shadow:0 2px 12px rgba(0,0,0,.08);',
      'position:relative;overflow:hidden;',
    '}',
    '.dh::before{content:"";position:absolute;right:0;top:0;bottom:0;',
      'width:200px;background:linear-gradient(135deg,transparent 30px,#1455a4 30px);}',
    '.dh::after{content:"";position:absolute;right:0;top:0;bottom:0;',
      'width:130px;background:linear-gradient(135deg,transparent 30px,#0a2d6e 30px);}',
    '.dh img{height:60px;width:auto;position:relative;z-index:1;}',
    '.dh-right{position:relative;z-index:2;display:flex;align-items:center;gap:9px;}',
    '.dh-info{display:inline-flex;align-items:center;gap:6px;font-size:12px;',
      'color:#fff;font-weight:600;background:rgba(10,45,110,.78);',
      'border:1px solid rgba(255,255,255,.25);padding:6px 13px;border-radius:20px;',
      'max-width:230px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.dh-info .dh-ico{flex-shrink:0;}',
    '.dh-info .dh-mail{overflow:hidden;text-overflow:ellipsis;}',
    '.dh-home{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.35);',
      'color:#fff;border-radius:7px;padding:6px 13px;font-size:12px;font-weight:600;',
      'cursor:pointer;text-decoration:none;transition:background .2s;white-space:nowrap;}',
    '.dh-home:hover{background:rgba(255,255,255,.28);}',
    '.dh-logout{background:rgba(255,255,255,.22);border:1px solid rgba(255,255,255,.4);',
      'color:#fff;border-radius:7px;padding:6px 13px;font-size:12px;font-weight:700;',
      'cursor:pointer;transition:background .2s;white-space:nowrap;}',
    '.dh-logout:hover{background:rgba(255,255,255,.38);}',
    // Sub-nav tabs (unit pages)
    '.dh-subnav{background:linear-gradient(90deg,var(--azul),var(--azul-m));',
      'display:flex;align-items:center;gap:2px;padding:0 2rem;overflow-x:auto;',
      'box-shadow:0 2px 10px rgba(10,45,110,.18);position:relative;z-index:3;}',
    '.dh-tab{display:inline-flex;align-items:center;gap:7px;padding:12px 18px;',
      'color:rgba(255,255,255,.72);font-size:13px;font-weight:600;text-decoration:none;',
      'border-bottom:3px solid transparent;white-space:nowrap;transition:all .18s;}',
    '.dh-tab:hover{color:#fff;background:rgba(255,255,255,.08);}',
    '.dh-tab.active{color:#fff;border-bottom-color:#fff;}',
    '.dh-tab svg{width:16px;height:16px;flex-shrink:0;}',
    '@media(max-width:600px){.dh-subnav{padding:0 .5rem;}.dh-tab{padding:11px 13px;font-size:12px;}.dh-info{max-width:130px;}}',
  ].join('');

  var styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  // ── Build header HTML ─────────────────────────────────────────
  function escAttr(v) {
    return String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var ADMIN_SVG = '<svg class="dh-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
  var USER_SVG  = '<svg class="dh-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

  var userIcon = '';
  var mail = '';
  if (_ses) {
    userIcon = (_ses.role === 'admin') ? ADMIN_SVG : USER_SVG;
    mail = _ses.email || '';
  }

  // Show "Inicio" link only when NOT on unidad.html (so content pages get it)
  var _isUnidad = (_file === 'unidad.html');
  var homeBtn = (!_isLogin && !_isUnidad && _ses)
    ? '<a class="dh-home" href="unidad.html">← Inicio</a>'
    : '';

  var right = _ses
    ? '<span class="dh-info" title="' + escAttr(mail) + '">' + userIcon + '</span>' +
      homeBtn +
      '<button class="dh-logout" onclick="cerrarSesion()">Cerrar sesión</button>'
    : '';

  var headerEl = document.createElement('div');
  headerEl.className = 'dh';
  headerEl.innerHTML =
    '<img src="logo_diger-14.png" alt="Gobierno de Honduras DIGER">' +
    '<div class="dh-right">' + right + '</div>';

  // Prepend to <body>
  var body = document.body;
  if (body.firstChild) {
    body.insertBefore(headerEl, body.firstChild);
  } else {
    body.appendChild(headerEl);
  }

  // ── Sub-nav tabs (only on a unit page: unidad.html?u=...) ─────
  var _u = null, _tab = 'inicio';
  try {
    var _qp = new URLSearchParams(window.location.search);
    _u = _qp.get('u');
    _tab = _qp.get('tab') || 'inicio';
  } catch (_) {}

  if (_isUnidad && _u && _ses) {
    var TABS_ALL = [
      { key: 'inicio',      label: 'Inicio',           units: ['digitalizacion'], svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>' },
      { key: 'documentos',  label: 'Documentos',       units: null, svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>' },
      { key: 'calendario',  label: 'Calendario',       units: null, svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
      { key: 'repositorio', label: 'Repositorio',      units: null, svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>' }
    ];
    var TABS = TABS_ALL.filter(function(t){ return !t.units || t.units.indexOf(_u) !== -1; });
    var subHtml = TABS.map(function (t) {
      var active = (t.key === _tab) ? ' active' : '';
      return '<a class="dh-tab' + active + '" href="unidad.html?u=' +
        encodeURIComponent(_u) + '&tab=' + t.key + '">' + t.svg + t.label + '</a>';
    }).join('');
    var subEl = document.createElement('nav');
    subEl.className = 'dh-subnav';
    subEl.innerHTML = subHtml;
    headerEl.parentNode.insertBefore(subEl, headerEl.nextSibling);
  }

  // ── Global helpers ────────────────────────────────────────────
  window.cerrarSesion = function () {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.replace('index.html');
  };

  // Expose session for pages that need it
  window.DIGER_SESSION = _ses;

})();
