-- ============================================================
-- PARCHE 05 · los cuatro cimientos
--
--  1. Permisos consultables desde la app (para que la pantalla no enseñe
--     botones que luego el servidor va a rechazar).
--  2. Auditoría que se escribe sola en lo que toca dinero o registros legales.
--  3. Historial de documentos: se guarda una copia de los datos usados.
--  4. Avisos: la tabla ya existía; aquí se le añade lo que faltaba para que
--     Fogón y la app escriban en ella y el Panel los lea.
--
-- Se ejecuta en el SQL Editor, después de los parches anteriores. Idempotente.
-- ============================================================

-- ------------------------------------------------------------
-- 1 · PERMISOS CONSULTABLES
-- ------------------------------------------------------------
-- Devuelve el nivel de la persona que pregunta en cada ámbito de un local.
create or replace function mis_permisos(p_local uuid)
returns table (ambito text, nivel nivel_acceso)
language plpgsql stable security definer set search_path = public as $$
declare a text;
begin
  foreach a in array array[
    'inventario.productos','inventario.precios','inventario.proveedores','inventario.pedidos',
    'inventario.recuentos','cocina.fichas','cocina.carta','servicio.jornada','servicio.ventas',
    'servicio.appcc','equipo.personas','equipo.horarios','equipo.fichajes',
    'negocio.resumenes','negocio.costes','negocio.tpv','negocio.auditoria','ajustes.local']
  loop
    ambito := a;
    -- Se mantiene la compatibilidad con los ámbitos antiguos («despensa.*»)
    nivel := nivel_en(p_local, replace(a, 'inventario.', 'despensa.'));
    return next;
  end loop;
end $$;

grant execute on function mis_permisos(uuid) to authenticated;

-- ------------------------------------------------------------
-- 2 · AUDITORÍA QUE SE ESCRIBE SOLA
-- ------------------------------------------------------------
alter table auditoria add column if not exists resumen text;

create or replace function anotar_auditoria() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_local uuid;
  v_resumen text;
  v_entidad text := TG_TABLE_NAME;
begin
  v_local := case
    when TG_OP = 'DELETE' then (to_jsonb(old) ->> 'local_id')::uuid
    else (to_jsonb(new) ->> 'local_id')::uuid
  end;
  if v_local is null then return coalesce(new, old); end if;

  v_resumen := case v_entidad
    when 'productos' then
      case TG_OP
        when 'INSERT' then format('Alta de producto: %s', new.nombre)
        when 'DELETE' then format('Baja de producto: %s', old.nombre)
        else case
          when new.precio_ultimo is distinct from old.precio_ultimo
            then format('Precio de %s: %s → %s €', new.nombre,
                        coalesce(old.precio_ultimo::text, 'sin precio'),
                        coalesce(new.precio_ultimo::text, 'sin precio'))
          when new.stock_actual is distinct from old.stock_actual
            then format('Existencias de %s: %s → %s', new.nombre, old.stock_actual, new.stock_actual)
          else format('Cambio en %s', new.nombre)
        end
      end
    when 'platos' then
      case TG_OP
        when 'INSERT' then format('Nueva ficha: %s', new.nombre)
        when 'DELETE' then format('Ficha borrada: %s', old.nombre)
        else case
          when new.precio_venta is distinct from old.precio_venta
            then format('Precio de %s: %s → %s €', new.nombre,
                        coalesce(old.precio_venta::text, '—'), coalesce(new.precio_venta::text, '—'))
          else format('Cambio en la ficha de %s', new.nombre)
        end
      end
    when 'jornadas' then
      case
        when TG_OP = 'INSERT' then format('Jornada abierta (%s)', new.fecha)
        when new.cerrada_en is not null and old.cerrada_en is null
          then format('Caja cerrada (%s): %s €', new.fecha, coalesce(new.ventas_total::text, '0'))
        else format('Cambio en la jornada del %s', new.fecha)
      end
    when 'pedidos' then
      case
        when TG_OP = 'INSERT' then 'Pedido creado'
        when new.estado is distinct from old.estado then format('Pedido %s', new.estado)
        else 'Cambio en un pedido'
      end
    when 'miembros' then
      case TG_OP
        when 'INSERT' then 'Persona añadida al equipo'
        when 'DELETE' then 'Persona retirada del equipo'
        else case when new.activo is distinct from old.activo
                  then case when new.activo then 'Acceso devuelto' else 'Acceso retirado' end
                  else 'Cambio de permisos' end
      end
    when 'locales' then 'Datos o marca del local modificados'
    when 'appcc_registros' then
      case when TG_OP = 'INSERT'
           then format('Registro de APPCC%s', case when new.correcto = false then ' FUERA DE RANGO' else '' end)
           else 'Registro de APPCC modificado' end
    else format('%s · %s', v_entidad, lower(TG_OP))
  end;

  insert into auditoria (local_id, persona_id, entidad, entidad_id, accion, resumen, antes, despues)
  values (
    v_local, auth.uid(), v_entidad,
    case when TG_OP = 'DELETE' then old.id else new.id end,
    lower(TG_OP), v_resumen,
    case when TG_OP = 'INSERT' then null else to_jsonb(old) end,
    case when TG_OP = 'DELETE' then null else to_jsonb(new) end
  );

  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['productos','platos','jornadas','pedidos','miembros','locales','appcc_registros']
  loop
    execute format('drop trigger if exists tg_auditoria_%1$s on %1$s;', t);
    execute format(
      'create trigger tg_auditoria_%1$s after insert or update or delete on %1$s
       for each row execute function anotar_auditoria();', t);
  end loop;
end $$;

-- El gerente y el jefe de cocina pueden leerla; nadie puede tocarla.
drop policy if exists ver_auditoria on auditoria;
create policy ver_auditoria on auditoria for select
  using (local_id in (select mis_locales()) and mi_rol(local_id) in ('gerente','jefe_cocina'));

drop policy if exists nadie_edita_auditoria on auditoria;
create policy nadie_edita_auditoria on auditoria as restrictive for update using (false);
drop policy if exists nadie_borra_auditoria on auditoria;
create policy nadie_borra_auditoria on auditoria as restrictive for delete using (false);

-- ------------------------------------------------------------
-- 3 · HISTORIAL DE DOCUMENTOS
-- ------------------------------------------------------------
alter table documentos add column if not exists color text;
alter table documentos add column if not exists nombre_archivo text;

create index if not exists idx_documentos_tipo on documentos(local_id, tipo, generado_en desc);

-- ------------------------------------------------------------
-- 4 · AVISOS
-- ------------------------------------------------------------
alter table avisos add column if not exists clave text;   -- para no duplicar el mismo aviso

create unique index if not exists idx_avisos_unicos
  on avisos(local_id, clave) where estado = 'abierto';

create index if not exists idx_avisos_panel on avisos(local_id, estado, creado_en desc);

select 'Parche 05 aplicado' as estado;
