-- ============================================================
-- PARCHE 03 · el plan se activa y se desactiva solo
--
-- Sin esto, una prueba de 14 días se queda abierta para siempre y un impago
-- no corta nada. Aquí está la máquina que lo cierra sola, todos los días.
--
-- Estados de una cuenta:
--   al_dia        → todo funciona
--   fallido       → el cobro ha fallado; sigue funcionando 7 días con aviso
--   solo_lectura  → se puede ver y exportar, pero no crear ni modificar
--   archivada     → a los 60 días; los datos se conservan, el acceso no
--
-- Se ejecuta en el SQL Editor. Es idempotente.
-- ============================================================

alter table cuentas add column if not exists solo_lectura_desde date;
alter table cuentas add column if not exists archivada_desde date;
alter table cuentas add column if not exists avisada_fin_prueba boolean not null default false;

-- ---------- 1 · Qué puede hacer una cuenta ahora mismo ----------
create or replace function cuenta_activa(p_cuenta uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((
    select case
      when c.estado_pago in ('solo_lectura', 'archivada') then false
      when c.plan = 'prueba' and c.prueba_termina_en is not null
           and c.prueba_termina_en < now() then false
      else true
    end
    from cuentas c where c.id = p_cuenta
  ), false)
$$;

create or replace function mi_cuenta_activa(p_local uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select cuenta_activa((select cuenta_id from locales where id = p_local))
$$;

-- ---------- 2 · El barrido diario ----------
create or replace function revisar_planes() returns table (accion text, cuantas int)
language plpgsql security definer set search_path = public as $$
begin
  -- Prueba terminada y sin tarjeta: a solo lectura
  update cuentas
     set estado_pago = 'solo_lectura', solo_lectura_desde = current_date
   where plan = 'prueba'
     and prueba_termina_en < now()
     and metodo_pago_puesto = false
     and estado_pago = 'al_dia';
  accion := 'pruebas caducadas a solo lectura'; get diagnostics cuantas = row_count; return next;

  -- Impago: a los 7 días, solo lectura
  update cuentas
     set estado_pago = 'solo_lectura', solo_lectura_desde = current_date
   where estado_pago = 'fallido'
     and actualizado_en < now() - interval '7 days';
  accion := 'impagos a solo lectura'; get diagnostics cuantas = row_count; return next;

  -- A los 60 días en solo lectura, se archiva. Nunca se borran datos.
  update cuentas
     set estado_pago = 'archivada', archivada_desde = current_date
   where estado_pago = 'solo_lectura'
     and solo_lectura_desde < current_date - 60;
  accion := 'cuentas archivadas'; get diagnostics cuantas = row_count; return next;

  -- Aviso de fin de prueba (lo recoge la función de correo)
  update cuentas
     set avisada_fin_prueba = true
   where plan = 'prueba'
     and avisada_fin_prueba = false
     and prueba_termina_en between now() and now() + interval '3 days';
  accion := 'avisos de fin de prueba'; get diagnostics cuantas = row_count; return next;
end $$;

-- ---------- 3 · Programarlo todos los días ----------
-- En Supabase: Database › Extensions › activar «pg_cron». Después:
--   select cron.schedule('revisar-planes', '0 4 * * *', $$select revisar_planes()$$);
-- Si pg_cron no está disponible en el plan contratado, se llama a la función
-- desde una tarea programada del despliegue (GitHub Actions, por ejemplo).

-- ---------- 4 · Que la restricción sea real ----------
-- Una cuenta en solo lectura o archivada no escribe nada, aunque la app lo intente.
do $$
declare r record;
begin
  for r in
    select unnest(array[
      'proveedores','productos','movimientos_stock','pedidos','inventarios','mermas',
      'elaboraciones','platos','carta_secciones','menus_dia','jornadas','ventas',
      'appcc_planes','appcc_registros','turnos','fichajes','documentos'
    ]) as tabla
  loop
    execute format('drop policy if exists escribir_%1$s_activa on %1$s;', r.tabla);
    execute format($p$create policy escribir_%1$s_activa on %1$s as restrictive for all
      using (mi_cuenta_activa(local_id))
      with check (mi_cuenta_activa(local_id));$p$, r.tabla);
  end loop;
end $$;

-- Comprobación
select * from revisar_planes();
