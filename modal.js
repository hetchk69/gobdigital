/**
 * modal.js — Sistema de modales reutilizable para DIGER SOL
 * Uso: Modal.show({ title, content, onSave, saveLabel, cancelLabel })
 *      Modal.close()
 */

(function() {
  // Inject CSS once
  function ensureCSS() {
    if (document.getElementById('diger-modal-css')) return;
    const style = document.createElement('style');
    style.id = 'diger-modal-css';
    style.textContent = `
      #diger-modal-overlay{
        position:fixed;inset:0;background:rgba(10,45,110,.45);
        display:flex;align-items:center;justify-content:center;
        z-index:10000;padding:1rem;
        animation:diger-modal-fadein .18s ease;
      }
      @keyframes diger-modal-fadein{from{opacity:0}to{opacity:1}}
      #diger-modal-card{
        background:#fff;border-radius:14px;
        box-shadow:0 24px 64px rgba(10,45,110,.22);
        width:100%;max-width:560px;
        max-height:90vh;display:flex;flex-direction:column;
        animation:diger-modal-slidein .2s ease;
      }
      @keyframes diger-modal-slidein{from{transform:translateY(20px);opacity:0}to{transform:none;opacity:1}}
      #diger-modal-header{
        display:flex;align-items:center;justify-content:space-between;
        padding:18px 20px 14px;
        border-bottom:1px solid #dde4f0;
        flex-shrink:0;
      }
      #diger-modal-title{font-size:16px;font-weight:800;color:#0a2d6e;margin:0}
      #diger-modal-close{
        background:none;border:none;cursor:pointer;
        font-size:20px;color:#64748b;line-height:1;
        padding:4px 8px;border-radius:6px;transition:background .15s;
      }
      #diger-modal-close:hover{background:#eef1f7}
      #diger-modal-body{
        padding:18px 20px;overflow-y:auto;flex:1;
      }
      #diger-modal-error{
        font-size:12px;color:#dc2626;background:#fff5f5;
        border:1px solid #fecaca;border-radius:8px;
        padding:8px 12px;margin-bottom:12px;display:none;
      }
      #diger-modal-footer{
        display:flex;justify-content:flex-end;gap:10px;
        padding:14px 20px 18px;border-top:1px solid #dde4f0;flex-shrink:0;
      }
      #diger-modal-cancel{
        padding:9px 20px;border:1.5px solid #dde4f0;background:#fff;
        color:#64748b;border-radius:9px;font-size:13px;font-weight:600;
        cursor:pointer;transition:all .18s;font-family:inherit;
      }
      #diger-modal-cancel:hover{border-color:#1455a4;color:#1455a4}
      #diger-modal-save{
        padding:9px 22px;
        background:linear-gradient(135deg,#1455a4,#0a2d6e);
        color:#fff;border:none;border-radius:9px;
        font-size:13px;font-weight:700;cursor:pointer;
        transition:opacity .18s;font-family:inherit;
      }
      #diger-modal-save:hover{opacity:.88}
      #diger-modal-save:disabled{opacity:.55;cursor:not-allowed}
      @media(max-width:600px){
        #diger-modal-card{max-width:100%;border-radius:14px 14px 0 0;position:fixed;bottom:0;left:0;right:0;max-height:92vh}
        #diger-modal-overlay{align-items:flex-end;padding:0}
      }
    `;
    document.head.appendChild(style);
  }

  let _onSave = null;

  function show(opts) {
    opts = opts || {};
    ensureCSS();
    close(); // remove previous if any

    _onSave = opts.onSave || null;

    const overlay = document.createElement('div');
    overlay.id = 'diger-modal-overlay';

    const content = typeof opts.content === 'string'
      ? opts.content
      : (opts.content instanceof Node ? opts.content.outerHTML : '');

    overlay.innerHTML = `
      <div id="diger-modal-card" role="dialog" aria-modal="true">
        <div id="diger-modal-header">
          <h2 id="diger-modal-title">${opts.title || 'Formulario'}</h2>
          <button id="diger-modal-close" aria-label="Cerrar">✕</button>
        </div>
        <div id="diger-modal-body">
          <div id="diger-modal-error"></div>
          ${typeof opts.content === 'string' ? opts.content : ''}
        </div>
        <div id="diger-modal-footer">
          <button id="diger-modal-cancel">${opts.cancelLabel || 'Cancelar'}</button>
          <button id="diger-modal-save">${opts.saveLabel || 'Guardar'}</button>
        </div>
      </div>
    `;

    // If content is a DOM node, append it into body
    if (opts.content instanceof Node) {
      overlay.querySelector('#diger-modal-body').appendChild(opts.content.cloneNode(true));
    }

    document.body.appendChild(overlay);

    // Events
    overlay.querySelector('#diger-modal-close').addEventListener('click', close);
    overlay.querySelector('#diger-modal-cancel').addEventListener('click', close);
    overlay.querySelector('#diger-modal-save').addEventListener('click', handleSave);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) close();
    });

    // Focus first input
    setTimeout(() => {
      const first = overlay.querySelector('input,select,textarea');
      if (first) first.focus();
    }, 50);
  }

  function handleSave() {
    const overlay = document.getElementById('diger-modal-overlay');
    if (!overlay) return;
    const errEl = document.getElementById('diger-modal-error');

    // Validate required fields
    const required = overlay.querySelectorAll('[required]');
    let invalid = false;
    required.forEach(el => {
      if (!el.value || !el.value.trim()) {
        el.style.borderColor = '#dc2626';
        invalid = true;
        el.addEventListener('input', function fix() {
          el.style.borderColor = '';
          el.removeEventListener('input', fix);
        });
      } else {
        el.style.borderColor = '';
      }
    });

    if (invalid) {
      errEl.textContent = 'Por favor complete todos los campos obligatorios.';
      errEl.style.display = 'block';
      return;
    }

    errEl.style.display = 'none';

    if (_onSave) {
      const saveBtn = document.getElementById('diger-modal-save');
      saveBtn.disabled = true;
      Promise.resolve(_onSave()).then(result => {
        if (result !== false) close();
        else saveBtn.disabled = false;
      }).catch(err => {
        saveBtn.disabled = false;
        errEl.textContent = err && err.message ? err.message : 'Ocurrió un error. Intente de nuevo.';
        errEl.style.display = 'block';
      });
    } else {
      close();
    }
  }

  function close() {
    const overlay = document.getElementById('diger-modal-overlay');
    if (overlay) overlay.remove();
    _onSave = null;
  }

  function showError(msg) {
    const errEl = document.getElementById('diger-modal-error');
    if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
  }

  window.Modal = { show, close, showError };
})();
