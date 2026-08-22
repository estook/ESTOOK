-- ============================================================
-- PARCHE 06 · sin plan activo no se entra
--
-- Hasta ahora una cuenta caducada no podía escribir, pero sí leer. Aquí se
-- cierra del todo: si la cuenta no tiene plan vigente, la base de datos no
-- devuelve ni un dato del negocio. Lo único que sigue accesible es lo mínimo
-- para poder enseñar la pantalla de contratación y para exportar.
--
-- Se ejecuta en el SQL Editor después de los parches anteriores. Idempotente.
-- ============================================================

-- ------------------------------------------------------------
-- 1 · Qué se considera una cuenta con acceso
-- ------------------------------------------------------------
create or replace function cuenta_con_acceso(p_cuenta uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((
    select case
      -- Archivada o en solo lectura: no entra
      when c.estado_pago in ('solo_lectura', 'archivada') then false
      -- Prueba: vale mientras no caduque
      when c.plan = 'prueba' then coalesce(c.prueba_termina_en, now()) > now()
      -- Plan de pago al día
      when c.plan in ('base', 'pro', 'grupo', 'a_medida') then c.estado_pago = 'al_dia'
      else false
    end
    from cuentas c where c.id = p_cuenta
  ), false)
$$;

create or replace function local_con_acceso(p_local uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select cuenta_con_acceso((select cuenta_id from locales where id = p_local))
$$;

grant execute on function cuenta_con_acceso(uuid), local_con_acceso(uuid) to authenticated;

/**
 * Lo que consulta la aplicación nada más entrar. Devuelve el estado sin
 * exponer nada más: si hay acceso, qué plan es y cuándo termina la prueba.
 */
create or replace function mi_estado_de_cuenta()
returns table (
  local_id uuid,
  local text,
  rol rol_estook,
  plan plan_estook,
  estado_pago text,
  prueba_termina_en timestamptz,
  con_acceso boolean
)
language sql stable security definer set search_path = public as $$
  select
    l.id, l.nombre, m.rol, c.plan, c.estado_pago, c.prueba_termina_en,
    cuenta_con_acceso(c.id)
  from miembros m
  join locales l on l.id = m.local_id
  join cuentas c on c.id = l.cuenta_id
  where m.persona_id = auth.uid() and m.activo = true
$$;

grant execute on function mi_estado_de_cuenta() to authenticated;

-- ------------------------------------------------------------
-- 2 · El candado: sin acceso, no se lee ni se escribe
-- ------------------------------------------------------------
-- Las políticas restrictivas se suman a las que ya hay: da igual lo que
-- permita el rol, si la cuenta no está al día no pasa nada.
--
-- No todas las tablas guardan el local directamente (un lote cuelga de su
-- producto, un mensaje de su canal), así que se recorren solo las que tienen
-- la columna y después se atan las hijas por su padre.

do $$
declare t text;
begin
  foreach t in array array[
    'proveedores','productos','movimientos_stock','pedidos','inventarios','mermas',
    'elaboraciones','platos','carta_secciones','menus_dia','jornadas','ventas',
    'appcc_planes','appcc_registros','turnos','fichajes','tpv_conexiones',
    'tpv_articulos','resumenes','contexto_local','avisos','notas','competidores',
    'resenas','documentos','canales'
  ]
  loop
    -- Solo si la tabla existe y tiene columna local_id
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'local_id'
    ) then
      execute format('drop policy if exists acceso_%1$s on %1$s;', t);
      execute format($p$create policy acceso_%1$s on %1$s as restrictive for all
        using (local_con_acceso(local_id))
        with check (local_con_acceso(local_id));$p$, t);
    end if;
  end loop;
end $$;

-- ---- Tablas hijas: se atan por su padre ----

-- Lotes y precios: cuelgan de un producto
drop policy if exists acceso_lotes on lotes;
create policy acceso_lotes on lotes as restrictive for all
  using (exists (select 1 from productos p where p.id = lotes.producto_id and local_con_acceso(p.local_id)))
  with check (exists (select 1 from productos p where p.id = lotes.producto_id and local_con_acceso(p.local_id)));

drop policy if exists acceso_precios_historico on precios_historico;
create policy acceso_precios_historico on precios_historico as restrictive for all
  using (exists (select 1 from productos p where p.id = precios_historico.producto_id and local_con_acceso(p.local_id)))
  with check (exists (select 1 from productos p where p.id = precios_historico.producto_id and local_con_acceso(p.local_id)));

-- Líneas de pedido: cuelgan del pedido
drop policy if exists acceso_pedido_lineas on pedido_lineas;
create policy acceso_pedido_lineas on pedido_lineas as restrictive for all
  using (exists (select 1 from pedidos x where x.id = pedido_lineas.pedido_id and local_con_acceso(x.local_id)))
  with check (exists (select 1 from pedidos x where x.id = pedido_lineas.pedido_id and local_con_acceso(x.local_id)));

-- Líneas de inventario
drop policy if exists acceso_inventario_lineas on inventario_lineas;
create policy acceso_inventario_lineas on inventario_lineas as restrictive for all
  using (exists (select 1 from inventarios x where x.id = inventario_lineas.inventario_id and local_con_acceso(x.local_id)))
  with check (exists (select 1 from inventarios x where x.id = inventario_lineas.inventario_id and local_con_acceso(x.local_id)));

-- Ingredientes y versiones: cuelgan del plato
drop policy if exists acceso_plato_ingredientes on plato_ingredientes;
create policy acceso_plato_ingredientes on plato_ingredientes as restrictive for all
  using (exists (select 1 from platos x where x.id = plato_ingredientes.plato_id and local_con_acceso(x.local_id)))
  with check (exists (select 1 from platos x where x.id = plato_ingredientes.plato_id and local_con_acceso(x.local_id)));

drop policy if exists acceso_plato_versiones on plato_versiones;
create policy acceso_plato_versiones on plato_versiones as restrictive for all
  using (exists (select 1 from platos x where x.id = plato_versiones.plato_id and local_con_acceso(x.local_id)))
  with check (exists (select 1 from platos x where x.id = plato_versiones.plato_id and local_con_acceso(x.local_id)));

-- Platos de la carta: cuelgan de su sección
drop policy if exists acceso_carta_platos on carta_platos;
create policy acceso_carta_platos on carta_platos as restrictive for all
  using (exists (select 1 from carta_secciones x where x.id = carta_platos.seccion_id and local_con_acceso(x.local_id)))
  with check (exists (select 1 from carta_secciones x where x.id = carta_platos.seccion_id and local_con_acceso(x.local_id)));

-- Puntos del plan APPCC
drop policy if exists acceso_appcc_puntos on appcc_puntos;
create policy acceso_appcc_puntos on appcc_puntos as restrictive for all
  using (exists (select 1 from appcc_planes x where x.id = appcc_puntos.plan_id and local_con_acceso(x.local_id)))
  with check (exists (select 1 from appcc_planes x where x.id = appcc_puntos.plan_id and local_con_acceso(x.local_id)));

-- Tramos de turno
drop policy if exists acceso_turno_tramos on turno_tramos;
create policy acceso_turno_tramos on turno_tramos as restrictive for all
  using (exists (select 1 from turnos x where x.id = turno_tramos.turno_id and local_con_acceso(x.local_id)))
  with check (exists (select 1 from turnos x where x.id = turno_tramos.turno_id and local_con_acceso(x.local_id)));

-- Líneas de venta y cierres
drop policy if exists acceso_venta_lineas on venta_lineas;
create policy acceso_venta_lineas on venta_lineas as restrictive for all
  using (exists (select 1 from ventas x where x.id = venta_lineas.venta_id and local_con_acceso(x.local_id)))
  with check (exists (select 1 from ventas x where x.id = venta_lineas.venta_id and local_con_acceso(x.local_id)));

drop policy if exists acceso_cierres_caja on cierres_caja;
create policy acceso_cierres_caja on cierres_caja as restrictive for all
  using (exists (select 1 from jornadas x where x.id = cierres_caja.jornada_id and local_con_acceso(x.local_id)))
  with check (exists (select 1 from jornadas x where x.id = cierres_caja.jornada_id and local_con_acceso(x.local_id)));

-- Mensajes del chat: cuelgan del canal
drop policy if exists acceso_mensajes on mensajes;
create policy acceso_mensajes on mensajes as restrictive for all
  using (exists (select 1 from canales x where x.id = mensajes.canal_id and local_con_acceso(x.local_id)))
  with check (exists (select 1 from canales x where x.id = mensajes.canal_id and local_con_acceso(x.local_id)));

-- Estas siguen accesibles siempre, para poder enseñar la pantalla de
-- contratación y saber quién eres: personas · miembros · locales · cuentas.

-- ------------------------------------------------------------
-- 3 · Comprobación
-- ------------------------------------------------------------
select
  c.nombre as cuenta,
  c.plan,
  c.estado_pago,
  cuenta_con_acceso(c.id) as con_acceso
from cuentas c
order by c.creado_en desc;
