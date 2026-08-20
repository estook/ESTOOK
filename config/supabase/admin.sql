-- ============================================================
-- ESTOOK · alta del administrador
--
-- Deja tu cuenta como GERENTE de un local con el plan más alto (a medida),
-- todas las apps encendidas y sin topes de prueba.
--
-- CÓMO SE USA
--  1. Entra en la web de Estook y crea la cuenta con tu correo desde
--     «Crear mi restaurante». Confirma el correo si Supabase lo pide.
--     (Este script no crea usuarios: los usuarios los crea Auth.)
--  2. Pega este archivo entero en el SQL Editor de Supabase y ejecútalo.
--  3. Vuelve a la app y recarga. Ya entras con tu local.
--
-- Se puede ejecutar las veces que haga falta: no duplica nada.
-- ============================================================

-- Antes de nada: columnas que puede que falten si el esquema se aplicó
-- antes de los últimos cambios. Es inofensivo si ya están.
alter table cuentas    add column if not exists metodo_pago_puesto boolean not null default false;
alter table consumo_ia add column if not exists persona_ref uuid references miembros(id) on delete set null;
alter table pedidos    add column if not exists fecha_entrega date;
alter table pedidos    add column if not exists hora_entrega  time;
alter table pedidos    add column if not exists notas text;

do $$
declare
  v_correo  text := 'belicar1905@gmail.com';   -- ← cambia esto si usas otro correo
  v_nombre  text := 'Richi';
  v_local   text := 'Estook · Local de pruebas';
  v_usuario uuid;
  v_cuenta  uuid;
  v_local_id uuid;
  v_miembro uuid;
  a text;
begin
  -- 1 · Buscar el usuario en Auth
  select id into v_usuario from auth.users where lower(email) = lower(v_correo) limit 1;
  if v_usuario is null then
    raise exception 'No existe ningún usuario con el correo %. Créalo primero desde la app (Crear mi restaurante) o en Authentication › Users › Add user.', v_correo;
  end if;

  -- 2 · Ficha de persona
  insert into personas (id, nombre, correo)
  values (v_usuario, v_nombre, v_correo)
  on conflict (id) do update set nombre = excluded.nombre, correo = excluded.correo;

  -- 3 · Cuenta con el plan más alto y sin prueba
  select c.id into v_cuenta
  from cuentas c
  join locales l on l.cuenta_id = c.id
  join miembros m on m.local_id = l.id
  where m.persona_id = v_usuario
  limit 1;

  if v_cuenta is null then
    insert into cuentas (nombre, plan, prueba_termina_en, estado_pago, metodo_pago_puesto)
    values ('Estook · administración', 'a_medida', null, 'al_dia', true)
    returning id into v_cuenta;
  else
    update cuentas
       set plan = 'a_medida', prueba_termina_en = null,
           estado_pago = 'al_dia', metodo_pago_puesto = true
     where id = v_cuenta;
  end if;

  -- 4 · Local
  select id into v_local_id from locales where cuenta_id = v_cuenta limit 1;
  if v_local_id is null then
    insert into locales (cuenta_id, nombre, tipo_local, direccion, color_secundario, hora_corte)
    values (v_cuenta, v_local, 'restaurante', 'Torrelodones, Madrid', '#FF7A00', '06:00')
    returning id into v_local_id;
  end if;

  -- 5 · Miembro con rol de gerente (lo ve todo)
  select id into v_miembro from miembros where persona_id = v_usuario and local_id = v_local_id;
  if v_miembro is null then
    insert into miembros (persona_id, local_id, rol, activo)
    values (v_usuario, v_local_id, 'gerente', true)
    returning id into v_miembro;
  else
    update miembros set rol = 'gerente', activo = true, acceso_retirado_en = null where id = v_miembro;
  end if;

  -- 6 · Alcance total, casilla por casilla (por encima del predeterminado del rol)
  foreach a in array array[
    'despensa.productos','despensa.precios','despensa.proveedores','despensa.pedidos','despensa.inventario',
    'cocina.fichas','cocina.carta','servicio.jornada','servicio.ventas','servicio.appcc',
    'equipo.personas','equipo.horarios','equipo.fichajes',
    'negocio.resumenes','negocio.costes','negocio.tpv','negocio.auditoria','ajustes.local']
  loop
    insert into permisos (miembro_id, ambito, nivel) values (v_miembro, a, 'editar')
    on conflict (miembro_id, ambito) do update set nivel = 'editar';
  end loop;

  -- 7 · Todas las apps encendidas
  foreach a in array array[
    'despensa','cocina_fichas','cocina_carta','menu_dia','servicio','equipo','equipo_cuadrante',
    'fichajes','negocio','tpv','competencia','resenas','chat']
  loop
    insert into apps_local (local_id, app, activa) values (v_local_id, a, true)
    on conflict (local_id, app) do update set activa = true;
  end loop;

  -- 8 · Objetivos de partida
  insert into objetivos_local (local_id, materia_prima, personal)
  values (v_local_id, 32, 30)
  on conflict (local_id) do nothing;

  -- 9 · Un resumen inicial para que Fogón tenga algo que contar
  insert into contexto_local (local_id, resumen_dia, perfil_negocio)
  values (
    v_local_id,
    'Local recién creado. Todavía no hay ventas, ni productos, ni cierres. Lo primero es dar de alta la despensa y la carta.',
    'Restaurante de pruebas del administrador de Estook. Sin histórico todavía.')
  on conflict (local_id) do nothing;

  raise notice 'Listo: % es gerente del local % con plan a medida.', v_correo, v_local;
end $$;

-- Comprobación
select p.correo, m.rol, l.nombre as local, c.plan
from miembros m
join personas p on p.id = m.persona_id
join locales l on l.id = m.local_id
join cuentas c on c.id = l.cuenta_id
where lower(p.correo) = lower('belicar1905@gmail.com');
