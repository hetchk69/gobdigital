/**
 * header.js — Componente de encabezado compartido para DIGER SOL
 * Uso: <div id="app-header"></div> + <script src="header.js"></script>
 * Llamar: initHeader({ page, unitSlug, activeSection })
 *   page: 'index' | 'unidad' | 'module'
 *   unitSlug: string (slug de la unidad activa)
 *   activeSection: 'calendario' | 'repositorio' | 'tramites' | 'documentos' | 'miembros'
 */

(function() {
  const SESSION_KEY = 'diger_sol_session';

  const NAV_ITEMS = [
    { key: 'calendario',  label: 'Calendario',  hash: '#calendario' },
    { key: 'repositorio', label: 'Repositorio', hash: '#repositorio' },
    { key: 'tramites',    label: 'Trámites',    hash: '#tramites' },
    { key: 'documentos',  label: 'Documentos',  hash: '#documentos' },
    { key: 'miembros',    label: 'Miembros',    hash: '#miembros', adminOnly: true },
  ];

  function getSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
  }

  function cerrarSesion() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = 'index.html';
  }

  function buildHeader(opts) {
    opts = opts || {};
    const page = opts.page || 'index';
    const unitSlug = opts.unitSlug || '';
    const activeSection = opts.activeSection || '';
    const session = getSession();

    // Inject CSS
    if (!document.getElementById('diger-header-css')) {
      const style = document.createElement('style');
      style.id = 'diger-header-css';
      style.textContent = `
        :root{
          --azul:#0a2d6e;--azul-m:#1455a4;--azul-c:#e8f0ff;
          --gris:#eef1f7;--borde:#dde4f0;--texto:#1c2333;--muted:#64748b;
          --verde:#16a34a;--rojo:#dc2626;--blanco:#fff;
        }
        #app-header .diger-header{
          background:var(--blanco);padding:14px 2rem;
          display:flex;align-items:center;justify-content:space-between;
          box-shadow:0 2px 12px rgba(0,0,0,.08);
          position:relative;overflow:hidden;
        }
        #app-header .diger-header::before{content:'';position:absolute;right:0;top:0;bottom:0;width:200px;background:linear-gradient(135deg,transparent 30px,#1455a4 30px)}
        #app-header .diger-header::after{content:'';position:absolute;right:0;top:0;bottom:0;width:130px;background:linear-gradient(135deg,transparent 30px,#0a2d6e 30px)}
        #app-header .diger-header-logos{display:flex;align-items:center;gap:12px;position:relative;z-index:1}
        #app-header .diger-header-logos img{height:60px;width:auto}
        #app-header .diger-header-nav{position:relative;z-index:1;display:flex;align-items:center;gap:4px}
        #app-header .diger-nav-link{
          padding:7px 14px;border-radius:8px;text-decoration:none;
          font-size:13px;font-weight:600;color:var(--azul);
          transition:background .18s,color .18s;white-space:nowrap;
        }
        #app-header .diger-nav-link:hover{background:var(--azul-c)}
        #app-header .diger-nav-link.active{background:var(--azul);color:#fff}
        #app-header .diger-header-right{position:relative;z-index:1;display:flex;align-items:center;gap:10px}
        #app-header .diger-session-chip{
          font-size:12px;color:rgba(255,255,255,.85);font-weight:600;
          background:rgba(255,255,255,.15);padding:5px 12px;
          border-radius:20px;border:1px solid rgba(255,255,255,.25);
        }
        #app-header .diger-logout-btn{
          background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.35);
          color:#fff;border-radius:7px;padding:5px 12px;
          font-size:12px;font-weight:700;cursor:pointer;transition:background .2s;
        }
        #app-header .diger-logout-btn:hover{background:rgba(255,255,255,.35)}
        /* Hamburger */
        #app-header .diger-hamburger{
          display:none;background:none;border:none;cursor:pointer;
          flex-direction:column;gap:5px;padding:4px;position:relative;z-index:2;
        }
        #app-header .diger-hamburger span{
          display:block;width:22px;height:2px;background:var(--azul);border-radius:2px;transition:.25s;
        }
        #app-header .diger-mobile-nav{
          display:none;flex-direction:column;gap:4px;
          padding:12px 1rem;background:var(--blanco);
          border-bottom:1px solid var(--borde);
          box-shadow:0 4px 12px rgba(0,0,0,.08);
        }
        #app-header .diger-mobile-nav.open{display:flex}
        #app-header .diger-mobile-nav .diger-nav-link{display:block;padding:10px 14px}
        @media(max-width:600px){
          #app-header .diger-header{padding:12px 1rem}
          #app-header .diger-header-logos img{height:46px}
          #app-header .diger-header-nav{display:none}
          #app-header .diger-hamburger{display:flex}
          #app-header .diger-session-chip{display:none !important}
        }
      `;
      document.head.appendChild(style);
    }

    // Determine which nav items to show
    let navItems = [];
    if (page !== 'index' && session) {
      const activeUnit = session.unidades && session.unidades.find(u => u.slug === unitSlug);
      const permisos = activeUnit ? activeUnit.permisos : {};
      const isPrivileged = session.role === 'admin' || session.role === 'coordinador';

      NAV_ITEMS.forEach(item => {
        if (item.adminOnly && !isPrivileged) return;
        if (activeUnit && permisos[item.key] === false) return;
        navItems.push(item);
      });
    }

    // Build nav HTML
    const buildNavLink = (item) => {
      let href;
      if (page === 'unidad') {
        href = item.hash;
      } else {
        href = unitSlug ? `unidad.html?u=${unitSlug}${item.hash}` : `unidad.html${item.hash}`;
      }
      const isActive = activeSection === item.key;
      return `<a class="diger-nav-link${isActive ? ' active' : ''}" href="${href}">${item.label}</a>`;
    };

    const navHTML = navItems.map(buildNavLink).join('');

    // Session chip
    let rightHTML = '';
    if (session) {
      rightHTML = `
        <span class="diger-session-chip">${escHtml(session.email)}</span>
        <button class="diger-logout-btn" id="diger-logout-btn">Cerrar sesión</button>
      `;
    }

    // Render
    const container = document.getElementById('app-header');
    if (!container) return;

    container.innerHTML = `
      <div class="diger-header">
        <div class="diger-header-logos">
          <img src="logo_diger-09.png" alt="Escudo Honduras">
          <img src="logo_diger-14.png" alt="DIGER">
        </div>
        ${navItems.length > 0 ? `
          <nav class="diger-header-nav">${navHTML}</nav>
          <button class="diger-hamburger" id="diger-hamburger" aria-label="Menú">
            <span></span><span></span><span></span>
          </button>
        ` : ''}
        <div class="diger-header-right">${rightHTML}</div>
      </div>
      ${navItems.length > 0 ? `<div class="diger-mobile-nav" id="diger-mobile-nav">${navHTML}</div>` : ''}
    `;

    // Events
    const logoutBtn = document.getElementById('diger-logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', cerrarSesion);

    const hamburger = document.getElementById('diger-hamburger');
    const mobileNav = document.getElementById('diger-mobile-nav');
    if (hamburger && mobileNav) {
      hamburger.addEventListener('click', () => {
        mobileNav.classList.toggle('open');
      });
    }
  }

  function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // Expose global
  window.initHeader = function(opts) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => buildHeader(opts));
    } else {
      buildHeader(opts);
    }
  };
})();
