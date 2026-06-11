# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the project

No build step. All files are static HTML/CSS/JS deployed to GitHub Pages (`hetchk69/gobdigital`). Serve locally with any static server:

```
npx serve .
# or
python -m http.server 8080
```

Never open HTML files directly via `file://` — Supabase calls and `sessionStorage` routing break without an HTTP origin.

## Architecture

**No framework, no bundler.** Every page is a self-contained HTML file with inline CSS and vanilla JS. External scripts loaded at runtime:
- `@supabase/supabase-js@2` (CDN) — backend, used in most pages
- `jsPDF` + `jspdf-autotable` (CDN) — PDF export in `tramites_estado.html` and `proyectos_especiales.html`
- `qrcode.js` (CDN) — QR generation in `proyectos_especiales.html`
- `emailjs` (CDN) — email sending in `proyectos_especiales.html`

**header.js** is the only shared module. Every authenticated page loads it as the first `<script>` in `<body>`. It:
1. Reads `sessionStorage` key `diger_sol_session`
2. Redirects unauthenticated users to `index.html`
3. Injects the DIGER header bar and optional sub-nav tabs
4. Exposes `window.DIGER_SESSION` and `window.cerrarSesion()`

Pages must NOT render their own header or check auth independently.

## Auth & session model

Login in `index.html`:
- `@diger.gob.hn` emails → role `admin`, direct redirect to `unidad.html` (no Supabase lookup)
- All other emails → lookup in `usuarios_sol` table

Session stored in `sessionStorage` as `diger_sol_session`:
```js
{ email: "...", role: "admin|coordinador|colaborador|lector", institucion: "..." }
```

Role capabilities:
- `admin` — full access; user management; all institutions
- `coordinador` — portal of their own institution; can manage sub-users and edit tramites/notas
- `colaborador` / `lector` — read-only or limited edit within their institution

## Supabase backend

Single project: `gnpvqiyantdtksfvqtqk.supabase.co`. The anon key is hardcoded in every file that uses Supabase — update all occurrences if it rotates.

| Table | Purpose |
|-------|---------|
| `usuarios_sol` | Registered users: `email`, `role`, `institucion` |
| `reuniones` | Events/meetings: `id`, `titulo`, `fecha`, `hora`, `lugar`, `activa`, `tema` (JSON), `creada_por` |
| `asistencias` | QR attendance: `reunion_id`, `nombre`, `correo`, `cargo`, `institucion`, `telefono` |
| `contactos_manuales` | Manually added contacts: `nombre`, `correo`, `cargo`, `institucion`, `telefono`, `notas` |
| `diger_tram` | KV store — `key='tram'`, `value=JSON` — tramite stage patches for `instituciones.html` |
| `diger_notas` | KV store — `key='notas'`, `value=JSON` — follow-up notes per institution |

Real-time subscriptions on `diger_tram` and `diger_notas` are active in `instituciones.html`.

## Data persistence split

**Supabase** (shared across all users/devices):
- User accounts and roles
- Events and attendance (reuniones + asistencias)
- Manual contacts
- Tramite stage progress and follow-up notes

**localStorage** (browser/device-local, not synced):
| Key | Used in | Content |
|-----|---------|---------|
| `diger_estado_hist_v1` | `tramites_estado.html` | Form history |
| `diger_docs_estado_v1` | `tramites_estado.html` | Document attachments |
| `diger_docs_tecnica_v1` | `tramites_tecnica.html` | Technical documents |
| `diger_fichas_tramite_v1` | `ficha_tramite.html` | Saved fichas (JSON array) |
| `diger_cal_{unitKey}` | `unidad.html` | Calendar events per unit |
| `diger_docu_{unitKey}` | `unidad.html` | Documents per unit |
| `diger_repo_{unitKey}` | `unidad.html` | Repository links per unit |
| `diger_insts_custom` | `proyectos_especiales.html` | Custom institution names cache |

## Page map

### `index.html` — Login
Entry point. Email/password form. Admins bypass Supabase lookup; all others are verified against `usuarios_sol`.

### `unidad.html` — Main hub
Post-login landing page. Reads `?u=` and `?tab=` params:
- No params → unit selector (admin) or institution portal (non-admin)
- `?u=digitalizacion` → module list for digitalización unit
- `?u=digitalizacion&tab=calendario` → calendar view
- `?u=digitalizacion&tab=documentos` → unit documents
- `?u=digitalizacion&tab=repositorio` → links repository

Admin panel: full user management (CRUD on `usuarios_sol`). Coordinador panel: manage sub-users of their institution.

### `instituciones.html` — Tramite progress tracker
Shows digitalization progress for the 20 institutions across 12 tramite stages. Data is stored in Supabase as JSON patches on top of `DEFAULT_DATA`. Supports real-time collaborative editing. Accessed via `?inst=` from the institutional portal.

### `tramites_estado.html` — Estado levantamiento form
Multi-step wizard capturing the current state of tramite digitalization for an institution: SOL platform status, infrastructure, staff, equipment. Generates PDF report. History stored locally in `localStorage`.

### `tramites_tecnica.html` — Technical tramite form
Technical specification form for a digitalized tramite. Similar multi-step structure to `tramites_estado.html`.

### `ficha_tramite.html` — Ficha de trámite 2026
Comprehensive form covering a single tramite. Structured as:
1. Tramite data (requirements, steps, laws, technical contact)
2. Infrastructure evaluation (profiles, data center, hardware/software requirements)

All data stored in `localStorage` under `diger_fichas_tramite_v1`. Accepts `?inst=` to pre-select institution.

### `proyectos_especiales.html` — Events and QR attendance
**Dual-mode page** — behavior depends on URL:
- `?reg={id}` → **public mode**: unauthenticated QR registration form for event attendees
- No `?reg=` → **admin mode**: event management (CRUD), live attendance list, capacitación form, PDF/Excel export

Key features: real-time attendance via Supabase subscription, QR code generation, email notifications (emailjs), photo evidence, agreements table.

**Institution select**: populated dynamically from `INSTS_BASE` (20 hardcoded) + distinct institutions from `asistencias` table. Custom institutions are cached in `localStorage` and normalized to uppercase. Both `g-inst` (admin) and `pub-inst` (public form) are built entirely by JS and sorted alphabetically.

### `contactos.html` — Contact directory
Aggregates contacts from two sources: `asistencias` (QR attendees) and `contactos_manuales` (manually added). Deduplicates by email. Grouped by institution with search/filter. Normalizes institution names via `INST_NORM` map. Accepts `?inst=` to lock to a single institution.

## Institution list

20 base institutions are hardcoded as `INSTS_BASE` in `proyectos_especiales.html` and as `<option>` lists in other files. When adding or renaming an institution, update **all** of these locations:
- `INST_LIST` array in `unidad.html`
- `INSTS_BASE` array in `proyectos_especiales.html`
- `<option>` lists in `tramites_estado.html` (Step 1 `#inst` select)
- `<option>` lists in `instituciones.html` (`#tf-inst` in tram-form-modal)
- `DB` object keys in `tramites_estado.html`
- `DEFAULT_DATA` `inst` values in `instituciones.html`
- `INST_NORM` map in `contactos.html`

## CSS conventions

CSS custom properties are defined in `:root` in each file (no shared stylesheet). The same variables are duplicated as a JS string inside `header.js` — color changes must be updated in both places.

| Variable | Meaning |
|----------|---------|
| `--azul` | Dark navy (primary brand color) |
| `--azul-m` | Medium blue |
| `--azul-c` | Light blue tint (backgrounds) |
| `--gris` | Page background |
| `--borde` | Border color |
| `--muted` | Secondary/muted text |

## Pushing changes to GitHub

The working directory (`C:\Users\henry\Documents\portal_interno`) is OneDrive-managed and blocks `.git` creation. Always use a temp clone outside OneDrive:

```powershell
git clone https://github.com/hetchk69/gobdigital.git C:\Users\henry\gobdigital_push
# copy changed files, then:
cd C:\Users\henry\gobdigital_push
git config user.email "henryalejandro12@outlook.com"
git config user.name "hetchk69"
git add <files>
git commit -m "message"
git push origin main
cd C:\Users\henry\Documents\portal_interno
Remove-Item -Recurse -Force C:\Users\henry\gobdigital_push
```
