-- ============================================================
-- ESTOOK · Storage
-- Tres cubos privados. Nada es público: los ficheros se sirven con URL
-- firmadas y caducas desde la app.
-- Se ejecuta después de policies.sql.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('logos',     'logos',     false, 2097152,  array['image/png','image/jpeg','image/webp','image/svg+xml']),
  ('fotos',     'fotos',     false, 5242880,  array['image/png','image/jpeg','image/webp']),
  ('albaranes', 'albaranes', false, 10485760, array['image/png','image/jpeg','image/webp','application/pdf'])
on conflict (id) do nothing;

-- Convención de rutas: <cubo>/<local_id>/<lo que sea>.jpg
-- Así el permiso se resuelve mirando la primera carpeta del nombre.

create or replace function local_de_ruta(nombre text) returns uuid
language sql immutable as $$
  select nullif(split_part(nombre, '/', 1), '')::uuid
$$;

do $$
declare c text;
begin
  foreach c in array array['logos','fotos','albaranes']
  loop
    execute format('drop policy if exists ver_%1$s on storage.objects;', c);
    execute format($p$create policy ver_%1$s on storage.objects for select
      using (bucket_id = %1$L and local_de_ruta(name) in (select mis_locales()));$p$, c);

    execute format('drop policy if exists subir_%1$s on storage.objects;', c);
    execute format($p$create policy subir_%1$s on storage.objects for insert
      with check (bucket_id = %1$L and local_de_ruta(name) in (select mis_locales()));$p$, c);

    execute format('drop policy if exists borrar_%1$s on storage.objects;', c);
    execute format($p$create policy borrar_%1$s on storage.objects for delete
      using (bucket_id = %1$L and es_gerente(local_de_ruta(name)));$p$, c);
  end loop;
end $$;
