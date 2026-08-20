-- ============================================================
-- ESTOOK · reglas de acceso (RLS)
-- Los permisos viven aquí, en el servidor. Un rol sin costes no recibe
-- los campos de precio: no es que la app no los pinte.
-- Se ejecuta después de schema.sql y es idempotente.
-- ============================================================

-- ---------- Funciones de ayuda ----------

-- Locales a los que llega la persona que está preguntando
create or replace function mis_locales() returns setof uuid
language sql stable security definer set search_path = public as $$
  select m.local_id from miembros m
  where m.persona_id = auth.uid() and m.activo = true
$$;

create or replace function mi_rol(p_local uuid) returns rol_estook
language sql stable security definer set search_path = public as $$
  select m.rol from miembros m
  where m.persona_id = auth.uid() and m.local_id = p_local and m.activo = true
  limit 1
$$;

create or replace function es_gerente(p_local uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select mi_rol(p_local) = 'gerente'
$$;

-- Alcance predeterminado del rol + ajuste casilla a casilla del gerente.
-- El ajuste manda siempre sobre el valor por defecto.
create or replace function nivel_en(p_local uuid, p_ambito text) returns nivel_acceso
language plpgsql stable security definer set search_path = public as $$
declare
  v_rol rol_estook;
  v_miembro uuid;
  v_ajuste nivel_acceso;
  v_defecto nivel_acceso := 'sin_acceso';
begin
  select m.id, m.rol into v_miembro, v_rol
  from miembros m
  where m.persona_id = auth.uid() and m.local_id = p_local and m.activo = true
  limit 1;

  if v_rol is null then return 'sin_acceso'; end if;

  select p.nivel into v_ajuste from permisos p
  where p.miembro_id = v_miembro and p.ambito = p_ambito;
  if v_ajuste is not null then return v_ajuste; end if;

  v_defecto := case
    when v_rol = 'gerente' then 'editar'
    when v_rol = 'jefe_cocina' then case p_ambito
      when 'equipo.personas' then 'sin_acceso'
      when 'negocio.tpv' then 'sin_acceso'
      when 'ajustes.local' then 'sin_acceso'
      when 'servicio.ventas' then 'ver'
      when 'equipo.horarios' then 'editar'
      when 'negocio.resumenes' then 'ver'
      else 'editar' end
    when v_rol = 'jefe_sala' then case p_ambito
      when 'equipo.personas' then 'sin_acceso'
      when 'negocio.tpv' then 'sin_acceso'
      when 'ajustes.local' then 'sin_acceso'
      when 'despensa.precios' then 'ver'
      when 'cocina.fichas' then 'ver'
      when 'cocina.carta' then 'editar'
      when 'servicio.ventas' then 'editar'
      when 'servicio.appcc' then 'editar'
      when 'equipo.horarios' then 'editar'
      when 'negocio.resumenes' then 'ver'
      else 'ver' end
    when v_rol = 'cocinero' then case p_ambito
      when 'despensa.productos' then 'ver'
      when 'despensa.inventario' then 'editar'
      when 'despensa.pedidos' then 'editar'
      when 'cocina.fichas' then 'ver'
      when 'servicio.appcc' then 'editar'
      when 'equipo.horarios' then 'ver'
      when 'equipo.fichajes' then 'editar'
      else 'sin_acceso' end
    when v_rol = 'sala' then case p_ambito
      when 'despensa.productos' then 'ver'
      when 'despensa.inventario' then 'editar'
      when 'cocina.fichas' then 'ver'
      when 'cocina.carta' then 'ver'
      when 'servicio.ventas' then 'editar'
      when 'servicio.appcc' then 'editar'
      when 'equipo.horarios' then 'ver'
      when 'equipo.fichajes' then 'editar'
      else 'sin_acceso' end
    when v_rol = 'gestoria' then case p_ambito
      when 'despensa.precios' then 'ver'
      when 'servicio.ventas' then 'ver'
      when 'servicio.appcc' then 'ver'
      when 'negocio.resumenes' then 'ver'
      else 'sin_acceso' end
    else 'sin_acceso' end;

  return v_defecto;
end $$;

create or replace function puede_ver(p_local uuid, p_ambito text) returns boolean
language sql stable security definer set search_path = public as $$
  select nivel_en(p_local, p_ambito) in ('ver','editar')
$$;

create or replace function puede_editar(p_local uuid, p_ambito text) returns boolean
language sql stable security definer set search_path = public as $$
  select nivel_en(p_local, p_ambito) = 'editar'
$$;

-- ---------- Encender RLS en todo ----------
do $$
declare t text;
begin
  foreach t in array array[
    'cuentas','locales','apps_local','objetivos_local','personas','miembros','permisos','invitaciones',
    'proveedores','productos','lotes','movimientos_stock','precios_historico','pedidos','pedido_lineas',
    'inventarios','inventario_lineas','mermas','elaboraciones','platos','plato_ingredientes',
    'elaboracion_ingredientes','plato_versiones','fichas_aprendidas','carta_secciones','carta_platos',
    'menus_dia','jornadas','ventas','venta_lineas','appcc_planes','appcc_puntos','appcc_registros',
    'turnos','turno_tramos','fichajes','tpv_conexiones','tpv_articulos','cierres_caja','resumenes',
    'contexto_local','avisos','consumo_ia','consumo_externo','canales','canal_miembros','mensajes',
    'lecturas','notificaciones','preferencias_avisos','competidores','resenas','documentos','auditoria']
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('alter table %I force row level security;', t);
  end loop;
end $$;

-- ---------- Política general por local y ámbito ----------
-- Se genera una pareja de políticas (ver / editar) por tabla que cuelga de un local.
do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('proveedores','despensa.proveedores'),
      ('productos','despensa.productos'),
      ('movimientos_stock','despensa.inventario'),
      ('pedidos','despensa.pedidos'),
      ('inventarios','despensa.inventario'),
      ('mermas','despensa.inventario'),
      ('elaboraciones','cocina.fichas'),
      ('platos','cocina.fichas'),
      ('carta_secciones','cocina.carta'),
      ('menus_dia','cocina.carta'),
      ('jornadas','servicio.ventas'),
      ('ventas','servicio.ventas'),
      ('appcc_planes','servicio.appcc'),
      ('appcc_registros','servicio.appcc'),
      ('tpv_conexiones','negocio.tpv'),
      ('tpv_articulos','negocio.tpv'),
      ('resumenes','negocio.resumenes'),
      ('competidores','negocio.resumenes'),
      ('resenas','negocio.resumenes'),
      ('documentos','negocio.resumenes'),
      ('avisos','negocio.resumenes'),
      ('notificaciones','negocio.resumenes')
    ) as t(tabla, ambito)
  loop
    execute format('drop policy if exists ver_%1$s on %1$s;', r.tabla);
    execute format($p$create policy ver_%1$s on %1$s for select
      using (local_id in (select mis_locales()) and puede_ver(local_id, %2$L));$p$, r.tabla, r.ambito);

    execute format('drop policy if exists escribir_%1$s on %1$s;', r.tabla);
    execute format($p$create policy escribir_%1$s on %1$s for all
      using (local_id in (select mis_locales()) and puede_editar(local_id, %2$L))
      with check (local_id in (select mis_locales()) and puede_editar(local_id, %2$L));$p$, r.tabla, r.ambito);
  end loop;
end $$;

-- ---------- Reglas propias ----------

-- La cuenta y el local: los ve quien es miembro; los toca el gerente.
drop policy if exists ver_locales on locales;
create policy ver_locales on locales for select using (id in (select mis_locales()));
drop policy if exists tocar_locales on locales;
create policy tocar_locales on locales for update using (es_gerente(id)) with check (es_gerente(id));

drop policy if exists ver_cuentas on cuentas;
create policy ver_cuentas on cuentas for select
  using (exists (select 1 from locales l where l.cuenta_id = cuentas.id and l.id in (select mis_locales())));

-- Cada uno se ve a sí mismo; el gerente ve a su gente.
drop policy if exists ver_personas on personas;
create policy ver_personas on personas for select using (
  id = auth.uid() or exists (
    select 1 from miembros m where m.persona_id = personas.id and es_gerente(m.local_id))
);

drop policy if exists ver_miembros on miembros;
create policy ver_miembros on miembros for select
  using (persona_id = auth.uid() or local_id in (select mis_locales()));
drop policy if exists tocar_miembros on miembros;
create policy tocar_miembros on miembros for all
  using (es_gerente(local_id)) with check (es_gerente(local_id));

-- Fichajes: cada uno los suyos. El responsable, los de su gente.
drop policy if exists ver_fichajes on fichajes;
create policy ver_fichajes on fichajes for select using (
  local_id in (select mis_locales()) and (
    miembro_id in (select id from miembros where persona_id = auth.uid())
    or mi_rol(local_id) in ('gerente','jefe_cocina','jefe_sala'))
);
drop policy if exists fichar on fichajes;
create policy fichar on fichajes for insert with check (
  miembro_id in (select id from miembros where persona_id = auth.uid() and local_id = fichajes.local_id)
);
drop policy if exists corregir_fichajes on fichajes;
create policy corregir_fichajes on fichajes for update using (
  miembro_id in (select id from miembros where persona_id = auth.uid())
  or mi_rol(local_id) in ('gerente','jefe_cocina','jefe_sala')
);

-- Turnos: todo el mundo ve los publicados de su local (para saber quién entra),
-- pero solo quien gestiona los crea y los cambia.
drop policy if exists ver_turnos on turnos;
create policy ver_turnos on turnos for select using (
  local_id in (select mis_locales())
  and (publicado or mi_rol(local_id) in ('gerente','jefe_cocina','jefe_sala'))
);
drop policy if exists tocar_turnos on turnos;
create policy tocar_turnos on turnos for all
  using (puede_editar(local_id, 'equipo.horarios'))
  with check (puede_editar(local_id, 'equipo.horarios'));

-- Chat: cada uno sus canales. El gerente ve los del local, no los directos entre dos empleados.
drop policy if exists ver_canales on canales;
create policy ver_canales on canales for select using (
  local_id in (select mis_locales()) and (
    tipo <> 'directo'
    or exists (select 1 from canal_miembros cm join miembros m on m.id = cm.miembro_id
               where cm.canal_id = canales.id and m.persona_id = auth.uid()))
);
drop policy if exists ver_mensajes on mensajes;
create policy ver_mensajes on mensajes for select using (
  exists (select 1 from canales c where c.id = mensajes.canal_id)
);
drop policy if exists escribir_mensajes on mensajes;
create policy escribir_mensajes on mensajes for insert with check (
  autor_miembro_id in (select id from miembros where persona_id = auth.uid())
);

-- Auditoría: solo altas, nadie la edita ni la borra.
drop policy if exists ver_auditoria on auditoria;
create policy ver_auditoria on auditoria for select using (es_gerente(local_id));
drop policy if exists anotar_auditoria on auditoria;
create policy anotar_auditoria on auditoria for insert with check (local_id in (select mis_locales()));

-- ---------- Costes: no se envían, no se ocultan ----------
-- Quien no tiene 'despensa.precios' consulta estas vistas, que no traen la columna.
create or replace view productos_sin_costes
with (security_invoker = true) as
  select id, local_id, nombre, categoria, foto_url, unidad_compra, unidad_uso, factor,
         rendimiento, peso_variable, stock_actual, minimo, alergenos, proveedor_id, activo
  from productos;

create or replace view platos_sin_costes
with (security_invoker = true) as
  select id, local_id, nombre, descripcion, foto_url, familia, version, dificultad,
         mise_en_place, conservacion, truco, pasos, alergenos, agotado, activo
  from platos;

create or replace view plato_ingredientes_sin_costes
with (security_invoker = true) as
  select id, plato_id, producto_id, elaboracion_id, cantidad
  from plato_ingredientes;

revoke all on productos, platos, plato_ingredientes from anon;
grant select on productos_sin_costes, platos_sin_costes, plato_ingredientes_sin_costes to authenticated;

-- Además, a nivel de columna: el precio solo viaja si el rol lo tiene.
-- (Supabase entrega la API con el rol `authenticated`; el filtro fino lo hace
--  la capa de datos eligiendo tabla o vista según `nivel_en(local,'despensa.precios')`.)
