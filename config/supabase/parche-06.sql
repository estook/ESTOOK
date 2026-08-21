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
do $$
declare t text;
begin
  foreach t in array array[
    'proveedores','productos','lotes','movimientos_stock','precios_historico',
    'pedidos','inventarios','mermas','elaboraciones','platos','carta_secciones',
    'menus_dia','jornadas','ventas','appcc_planes','appcc_registros','turnos',
    'fichajes','tpv_conexiones','tpv_articulos','cierres_caja','resumenes',
    'contexto_local','avisos','notas','competidores','resenas','documentos','canales','mensajes'
  ]
  loop
    execute format('drop policy if exists acceso_%1$s on %1$s;', t);
    execute format($p$create policy acceso_%1$s on %1$s as restrictive for all
      using (local_con_acceso(local_id))
      with check (local_con_acceso(local_id));$p$, t);
  end loop;
end $$;

-- Estas tres siguen accesibles siempre: son las que permiten enseñar la
-- pantalla de contratación y saber quién eres.
--   personas · miembros · locales · cuentas

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
