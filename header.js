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
    '.dh-right{position:relative;z-index:1;display:flex;align-items:center;gap:10px;}',
    '.dh-info{font-size:12px;color:rgba(255,255,255,.85);font-weight:600;',
      'background:rgba(255,255,255,.15);padding:5px 12px;border-radius:20px;}',
    '.dh-home{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);',
      'color:#fff;border-radius:7px;padding:5px 12px;font-size:12px;font-weight:600;',
      'cursor:pointer;text-decoration:none;transition:background .2s;}',
    '.dh-home:hover{background:rgba(255,255,255,.28);}',
    '.dh-logout{background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.35);',
      'color:#fff;border-radius:7px;padding:5px 12px;font-size:12px;font-weight:700;',
      'cursor:pointer;transition:background .2s;}',
    '.dh-logout:hover{background:rgba(255,255,255,.35);}',
  ].join('');

  var styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  // ── Build header HTML ─────────────────────────────────────────
  var icon  = '';
  var label = '';
  if (_ses) {
    icon  = _ses.role === 'admin' ? '⚙' : '👤';
    label = icon + ' ' + _ses.email;
  }

  // Show "Inicio" link only when NOT on unidad.html (so content pages get it)
  var _isUnidad = (_file === 'unidad.html');
  var homeBtn = (!_isLogin && !_isUnidad && _ses)
    ? '<a class="dh-home" href="unidad.html">← Inicio</a>'
    : '';

  var right = _ses
    ? '<span class="dh-info">' + label + '</span>' +
      homeBtn +
      '<button class="dh-logout" onclick="cerrarSesion()">Cerrar sesión</button>'
    : '';

  var headerEl = document.createElement('div');
  headerEl.className = 'dh';
  headerEl.innerHTML =
    '<img src="logo_diger-14.png" alt="Gobierno de Honduras — DIGER">' +
    '<div class="dh-right">' + right + '</div>';

  // Prepend to <body>
  var body = document.body;
  if (body.firstChild) {
    body.insertBefore(headerEl, body.firstChild);
  } else {
    body.appendChild(headerEl);
  }

  // ── Global helpers ────────────────────────────────────────────
  window.cerrarSesion = function () {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.replace('index.html');
  };

  // Expose session for pages that need it
  window.DIGER_SESSION = _ses;

})();
