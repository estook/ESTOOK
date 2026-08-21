-- ============================================================
-- PARCHE 04 · notas del local
--
-- Lo que no cabe en ningún campo pero no se puede olvidar: acuerdos con
-- proveedores, manías de la casa, avisos para el equipo. Fogón las lee como
-- contexto y puede apuntarlas cuando se le pide.
--
-- Se ejecuta en el SQL Editor. Es idempotente.
-- ============================================================

create table if not exists notas (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references locales(id) on delete cascade,
  texto text not null,
  de_fogon boolean not null default false,
  creado_por uuid references personas(id) on delete set null,
  creado_en timestamptz not null default now()
);

create index if not exists idx_notas_local on notas(local_id, creado_en desc);

alter table notas enable row level security;
alter table notas force row level security;

drop policy if exists ver_notas on notas;
create policy ver_notas on notas for select
  using (local_id in (select mis_locales()));

drop policy if exists escribir_notas on notas;
create policy escribir_notas on notas for all
  using (local_id in (select mis_locales()))
  with check (local_id in (select mis_locales()));

-- Que una cuenta caducada no escriba (igual que el resto de tablas)
drop policy if exists escribir_notas_activa on notas;
create policy escribir_notas_activa on notas as restrictive for all
  using (mi_cuenta_activa(local_id))
  with check (mi_cuenta_activa(local_id));

select 'Notas listas' as estado;
