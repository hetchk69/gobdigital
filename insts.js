/**
 * insts.js — Fuente única de instituciones (DIGER Portal)
 * Incluir DESPUÉS de @supabase/supabase-js en cada página con lista de instituciones.
 *
 * Fusiona, deduplica (case-insensitive) y ordena:
 *   1. BASE  — lista maestra hardcodeada (respaldo offline)
 *   2. KV    — instituciones agregadas manualmente (diger_tram, key='instituciones')
 *   3. asistencias + contactos_manuales — instituciones ya presentes en datos reales
 *
 * API global (window.DIGER_INSTS):
 *   await load()            -> Promise<string[]>  carga y cachea la lista completa
 *   list()                  -> string[]           lista cacheada (o BASE si aún no carga)
 *   await add(nombre)       -> Promise<string[]>  guarda una institución nueva en el KV y recarga
 *   fill(selectEl, opts)    -> void               puebla un <select> con la lista
 *        opts = { selected, placeholder, otro:bool, otroValue, otroLabel }
 */
(function () {
  'use strict';

  var SB_URL   = 'https://gnpvqiyantdtksfvqtqk.supabase.co';
  var SB_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducHZxaXlhbnRkdGtzZnZxdHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1ODE5NDIsImV4cCI6MjA5NjE1Nzk0Mn0.u7GxYKoQ_G3gokOg2VarZ707GEGc0dnjjYJNl5n5lDw';
  var KV_TABLE = 'diger_tram';
  var KV_KEY   = 'instituciones';

  var BASE = [
    'DIGER',
    'BANHPROVI','CANATURH / IHT','CNBS','CONATEL','CONSUCOOP','CONVIVIENDA',
    'COPECO','IHADFA','IHCINE','IHTT','INPREMA','INPREUNAH','IP','SAG',
    'SECAPPH','SEN','SERNA','SGJD','SIT','SRECI'
  ];

  var _sb = null, _list = null, _loaded = false, _loading = null;

  function sb() {
    if (_sb) return _sb;
    if (window.supabase && window.supabase.createClient) {
      _sb = window.supabase.createClient(SB_URL, SB_KEY);
    }
    return _sb;
  }

  function up(s) { return (s || '').trim().toUpperCase(); }

  // Fusiona BASE + extra, deduplica case-insensitive (conserva la 1ª grafía), ordena es
  function merge(extra) {
    var seen = {}, out = [];
    BASE.concat(extra || []).forEach(function (s) {
      var n = (s || '').trim();
      if (!n) return;
      var k = n.toUpperCase();
      if (k === '—' || k === '(SIN INSTITUCIÓN)') return;
      if (seen[k]) return;
      seen[k] = 1; out.push(n);
    });
    out.sort(function (a, b) { return a.localeCompare(b, 'es'); });
    return out;
  }

  async function fetchStored() {
    var c = sb();
    if (!c) return [];
    try {
      var r = await c.from(KV_TABLE).select('value').eq('key', KV_KEY).maybeSingle();
      if (r && r.data && Array.isArray(r.data.value)) return r.data.value;
    } catch (e) {}
    return [];
  }

  async function fetchFromData() {
    var c = sb();
    if (!c) return [];
    var out = [];
    try {
      var a = await c.from('asistencias').select('institucion');
      if (a && a.data) a.data.forEach(function (x) { if (x.institucion) out.push(x.institucion); });
    } catch (e) {}
    try {
      var cm = await c.from('contactos_manuales').select('institucion');
      if (cm && cm.data) cm.data.forEach(function (x) { if (x.institucion) out.push(x.institucion); });
    } catch (e) {}
    return out;
  }

  function load() {
    if (_loading) return _loading;
    _loading = Promise.all([fetchStored(), fetchFromData()]).then(function (res) {
      _list = merge(res[0].concat(res[1]));
      _loaded = true;
      _loading = null;
      return _list;
    }).catch(function () {
      _list = merge([]); _loaded = true; _loading = null;
      return _list;
    });
    return _loading;
  }

  function list() { return _list ? _list.slice() : BASE.slice(); }

  // Guarda una institución nueva en el KV (si no existe) y recarga la lista
  async function add(nombre) {
    nombre = (nombre || '').trim();
    if (!nombre) return list();
    var c = sb();
    var stored = await fetchStored();
    var exists = stored.map(up).indexOf(up(nombre)) !== -1 || BASE.map(up).indexOf(up(nombre)) !== -1;
    if (!exists && c) {
      stored.push(nombre);
      try {
        await c.from(KV_TABLE).upsert({ key: KV_KEY, value: stored, updated_at: new Date().toISOString() });
      } catch (e) {}
    }
    return load();
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Puebla un <select> conservando (o fijando) el valor seleccionado
  function fill(sel, opts) {
    if (!sel) return;
    opts = opts || {};
    var selected = (opts.selected != null) ? opts.selected : sel.value;
    var ph = (opts.placeholder != null) ? opts.placeholder : '— Seleccione —';
    var html = '<option value="">' + esc(ph) + '</option>';
    list().forEach(function (i) {
      html += '<option value="' + esc(i) + '">' + esc(i) + '</option>';
    });
    if (opts.otro) {
      html += '<option value="' + esc(opts.otroValue || 'Otro') + '">' + esc(opts.otroLabel || 'Otro') + '</option>';
    }
    sel.innerHTML = html;
    if (selected != null) sel.value = selected;
  }

  window.DIGER_INSTS = { load: load, list: list, add: add, fill: fill, BASE: BASE };
})();
