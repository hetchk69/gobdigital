-- ═══════════════════════════════════════════════════════════════
-- DIGER SOL — Esquema Supabase
-- Ejecutar en el editor SQL de Supabase
-- ═══════════════════════════════════════════════════════════════

-- ── EXTENSIONES ─────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── TABLAS ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS unidades (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug        text UNIQUE NOT NULL,
  nombre      text NOT NULL,
  descripcion text,
  icono       text DEFAULT '🏢',
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS unidad_miembros (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  unidad_id  uuid REFERENCES unidades(id) ON DELETE CASCADE,
  email      text NOT NULL,
  rol        text CHECK (rol IN ('admin','coordinador','colaborador','lector')) DEFAULT 'lector',
  permisos   jsonb DEFAULT '{"calendario":true,"repositorio":true,"tramites":true,"documentos":true,"miembros":false}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(unidad_id, email)
);

CREATE TABLE IF NOT EXISTS calendario_eventos (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  unidad_id   uuid REFERENCES unidades(id) ON DELETE CASCADE,
  tipo        text CHECK (tipo IN ('evento','compromiso','ausencia')) NOT NULL,
  subtipo     text CHECK (subtipo IN ('vacaciones','falta_justificada') OR subtipo IS NULL),
  titulo      text NOT NULL,
  descripcion text,
  fecha_inicio date NOT NULL,
  fecha_fin    date,
  todo_el_dia  boolean DEFAULT true,
  color        text DEFAULT '#1455a4',
  creado_por   text NOT NULL,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calendario_asignados (
  id        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id uuid REFERENCES calendario_eventos(id) ON DELETE CASCADE,
  email     text NOT NULL,
  UNIQUE(evento_id, email)
);

CREATE TABLE IF NOT EXISTS documentos (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  unidad_id    uuid REFERENCES unidades(id) ON DELETE CASCADE,
  nombre       text NOT NULL,
  tipo         text,
  tema         text,
  descripcion  text,
  archivo_path text,
  tipo_archivo text,
  tamano_bytes bigint,
  creado_por   text NOT NULL,
  updated_at   timestamptz DEFAULT now(),
  created_at   timestamptz DEFAULT now()
);

-- ── TRIGGER: actualizar updated_at en documentos ────────────────
CREATE OR REPLACE FUNCTION fn_documentos_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_documentos_updated_at ON documentos;
CREATE TRIGGER trg_documentos_updated_at
  BEFORE UPDATE ON documentos
  FOR EACH ROW EXECUTE FUNCTION fn_documentos_updated_at();

-- ── HABILITAR RLS ────────────────────────────────────────────────
ALTER TABLE unidades           ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidad_miembros    ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendario_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendario_asignados ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos         ENABLE ROW LEVEL SECURITY;

-- ── FUNCIÓN AUXILIAR: verificar membresía ───────────────────────
-- Retorna true si el email dado pertenece a la unidad dada
CREATE OR REPLACE FUNCTION es_miembro_unidad(p_unidad_id uuid, p_email text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM unidad_miembros
    WHERE unidad_id = p_unidad_id AND email = p_email
  );
$$;

-- ── FUNCIÓN AUXILIAR: es admin DIGER ────────────────────────────
CREATE OR REPLACE FUNCTION es_admin_diger(p_email text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT p_email ILIKE '%@diger.gob.hn';
$$;

-- ── POLÍTICAS RLS — unidades ─────────────────────────────────────
-- Lectura: miembros de la unidad o admins DIGER
CREATE POLICY "unidades_select" ON unidades
  FOR SELECT USING (
    es_admin_diger(current_setting('request.jwt.claims', true)::json->>'email')
    OR EXISTS (
      SELECT 1 FROM unidad_miembros um
      WHERE um.unidad_id = unidades.id
        AND um.email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- Insertar/actualizar/eliminar: solo admins DIGER
CREATE POLICY "unidades_insert" ON unidades
  FOR INSERT WITH CHECK (
    es_admin_diger(current_setting('request.jwt.claims', true)::json->>'email')
  );

CREATE POLICY "unidades_update" ON unidades
  FOR UPDATE USING (
    es_admin_diger(current_setting('request.jwt.claims', true)::json->>'email')
  );

CREATE POLICY "unidades_delete" ON unidades
  FOR DELETE USING (
    es_admin_diger(current_setting('request.jwt.claims', true)::json->>'email')
  );

-- ── POLÍTICAS RLS — unidad_miembros ─────────────────────────────
CREATE POLICY "miembros_select" ON unidad_miembros
  FOR SELECT USING (
    es_admin_diger(current_setting('request.jwt.claims', true)::json->>'email')
    OR email = current_setting('request.jwt.claims', true)::json->>'email'
    OR EXISTS (
      SELECT 1 FROM unidad_miembros um2
      WHERE um2.unidad_id = unidad_miembros.unidad_id
        AND um2.email = current_setting('request.jwt.claims', true)::json->>'email'
        AND (um2.rol = 'admin' OR um2.rol = 'coordinador')
    )
  );

CREATE POLICY "miembros_insert" ON unidad_miembros
  FOR INSERT WITH CHECK (
    es_admin_diger(current_setting('request.jwt.claims', true)::json->>'email')
    OR EXISTS (
      SELECT 1 FROM unidad_miembros um
      WHERE um.unidad_id = unidad_miembros.unidad_id
        AND um.email = current_setting('request.jwt.claims', true)::json->>'email'
        AND (um.rol = 'admin' OR um.rol = 'coordinador')
    )
  );

CREATE POLICY "miembros_update" ON unidad_miembros
  FOR UPDATE USING (
    es_admin_diger(current_setting('request.jwt.claims', true)::json->>'email')
    OR EXISTS (
      SELECT 1 FROM unidad_miembros um
      WHERE um.unidad_id = unidad_miembros.unidad_id
        AND um.email = current_setting('request.jwt.claims', true)::json->>'email'
        AND (um.rol = 'admin' OR um.rol = 'coordinador')
    )
  );

CREATE POLICY "miembros_delete" ON unidad_miembros
  FOR DELETE USING (
    es_admin_diger(current_setting('request.jwt.claims', true)::json->>'email')
    OR EXISTS (
      SELECT 1 FROM unidad_miembros um
      WHERE um.unidad_id = unidad_miembros.unidad_id
        AND um.email = current_setting('request.jwt.claims', true)::json->>'email'
        AND (um.rol = 'admin' OR um.rol = 'coordinador')
    )
  );

-- ── POLÍTICAS RLS — calendario_eventos ──────────────────────────
CREATE POLICY "cal_eventos_select" ON calendario_eventos
  FOR SELECT USING (
    es_admin_diger(current_setting('request.jwt.claims', true)::json->>'email')
    OR es_miembro_unidad(unidad_id, current_setting('request.jwt.claims', true)::json->>'email')
  );

CREATE POLICY "cal_eventos_insert" ON calendario_eventos
  FOR INSERT WITH CHECK (
    es_admin_diger(current_setting('request.jwt.claims', true)::json->>'email')
    OR es_miembro_unidad(unidad_id, current_setting('request.jwt.claims', true)::json->>'email')
  );

CREATE POLICY "cal_eventos_update" ON calendario_eventos
  FOR UPDATE USING (
    es_admin_diger(current_setting('request.jwt.claims', true)::json->>'email')
    OR es_miembro_unidad(unidad_id, current_setting('request.jwt.claims', true)::json->>'email')
  );

CREATE POLICY "cal_eventos_delete" ON calendario_eventos
  FOR DELETE USING (
    es_admin_diger(current_setting('request.jwt.claims', true)::json->>'email')
    OR creado_por = current_setting('request.jwt.claims', true)::json->>'email'
  );

-- ── POLÍTICAS RLS — calendario_asignados ────────────────────────
CREATE POLICY "cal_asig_select" ON calendario_asignados
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM calendario_eventos ce
      WHERE ce.id = evento_id
        AND (
          es_admin_diger(current_setting('request.jwt.claims', true)::json->>'email')
          OR es_miembro_unidad(ce.unidad_id, current_setting('request.jwt.claims', true)::json->>'email')
        )
    )
  );

CREATE POLICY "cal_asig_insert" ON calendario_asignados
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM calendario_eventos ce
      WHERE ce.id = evento_id
        AND es_miembro_unidad(ce.unidad_id, current_setting('request.jwt.claims', true)::json->>'email')
    )
  );

CREATE POLICY "cal_asig_delete" ON calendario_asignados
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM calendario_eventos ce
      WHERE ce.id = evento_id
        AND (
          es_admin_diger(current_setting('request.jwt.claims', true)::json->>'email')
          OR es_miembro_unidad(ce.unidad_id, current_setting('request.jwt.claims', true)::json->>'email')
        )
    )
  );

-- ── POLÍTICAS RLS — documentos ───────────────────────────────────
CREATE POLICY "docs_select" ON documentos
  FOR SELECT USING (
    es_admin_diger(current_setting('request.jwt.claims', true)::json->>'email')
    OR es_miembro_unidad(unidad_id, current_setting('request.jwt.claims', true)::json->>'email')
  );

CREATE POLICY "docs_insert" ON documentos
  FOR INSERT WITH CHECK (
    es_admin_diger(current_setting('request.jwt.claims', true)::json->>'email')
    OR es_miembro_unidad(unidad_id, current_setting('request.jwt.claims', true)::json->>'email')
  );

CREATE POLICY "docs_update" ON documentos
  FOR UPDATE USING (
    es_admin_diger(current_setting('request.jwt.claims', true)::json->>'email')
    OR es_miembro_unidad(unidad_id, current_setting('request.jwt.claims', true)::json->>'email')
  );

CREATE POLICY "docs_delete" ON documentos
  FOR DELETE USING (
    es_admin_diger(current_setting('request.jwt.claims', true)::json->>'email')
    OR creado_por = current_setting('request.jwt.claims', true)::json->>'email'
  );

-- ── BUCKET DE ALMACENAMIENTO ─────────────────────────────────────
-- Crear manualmente en Supabase Dashboard > Storage > New bucket:
--   Nombre: documentos
--   Privado: sí (RLS activado)
-- O ejecutar via API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', false);

-- ── DATOS INICIALES ──────────────────────────────────────────────
INSERT INTO unidades (slug, nombre, descripcion, icono) VALUES
  ('proyectos-especiales', 'Proyectos Especiales',       'Unidad de gestión de proyectos especiales de DIGER.', '🚀'),
  ('digitalizacion',       'Digitalización de Trámites', 'Unidad de digitalización y modernización de trámites gubernamentales.', '📋')
ON CONFLICT (slug) DO NOTHING;
