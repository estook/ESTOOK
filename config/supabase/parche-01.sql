-- ============================================================
-- PARCHE 01 · para bases que ya tienen el esquema aplicado.
-- Añade la columna que usa el freno de ráfaga de Fogón
-- (12 preguntas cada 10 minutos por persona).
-- Se ejecuta en el SQL Editor. Es idempotente: se puede repetir.
-- ============================================================

alter table consumo_ia
  add column if not exists persona_ref uuid references miembros(id) on delete set null;

create index if not exists idx_consumo_ia_rafaga
  on consumo_ia(local_id, persona_ref, creado_en desc);

create index if not exists idx_consumo_externo_dia
  on consumo_externo(cuenta_id, servicio, creado_en desc);
