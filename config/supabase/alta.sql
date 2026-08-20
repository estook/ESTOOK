-- ============================================================
-- ESTOOK · alta automática al crear cuenta
--
-- Cuando alguien se registra desde «Crear mi restaurante», esto le monta
-- en un solo golpe: su ficha de persona, su cuenta en prueba de 14 días,
-- su local, su rol de gerente, las apps encendidas y los objetivos.
--
-- Va con SECURITY DEFINER porque corre por debajo de las reglas de acceso:
-- en ese instante el usuario todavía no es miembro de ningún local, así que
-- no podría crearse nada a sí mismo.
--
-- Se ejecuta después de policies.sql. Es idempotente.
-- ============================================================

create or replace function alta_de_restaurante()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nombre text := coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1));
  v_local  text := coalesce(new.raw_user_meta_data ->> 'local', 'Mi local');
  v_cuenta uuid;
  v_local_id uuid;
  v_miembro uuid;
  a text;
begin
  insert into personas (id, nombre, correo)
  values (new.id, v_nombre, new.email)
  on conflict (id) do nothing;

  insert into cuentas (nombre, plan, prueba_termina_en)
  values (v_local, 'prueba', now() + interval '14 days')
  returning id into v_cuenta;

  insert into locales (cuenta_id, nombre, color_secundario)
  values (v_cuenta, v_local, '#FF7A00')
  returning id into v_local_id;

  insert into miembros (persona_id, local_id, rol, activo)
  values (new.id, v_local_id, 'gerente', true)
  returning id into v_miembro;

  foreach a in array array[
    'despensa','cocina_fichas','cocina_carta','menu_dia','servicio','equipo',
    'equipo_cuadrante','fichajes','negocio','competencia','resenas','chat']
  loop
    insert into apps_local (local_id, app, activa) values (v_local_id, a, true)
    on conflict (local_id, app) do nothing;
  end loop;

  insert into objetivos_local (local_id) values (v_local_id) on conflict do nothing;

  insert into contexto_local (local_id, resumen_dia)
  values (v_local_id, 'Local recién creado. Todavía no hay productos ni ventas.')
  on conflict (local_id) do nothing;

  return new;
end $$;

drop trigger if exists tg_alta_de_restaurante on auth.users;
create trigger tg_alta_de_restaurante
  after insert on auth.users
  for each row execute function alta_de_restaurante();

-- Cada uno puede escribir su propia ficha de persona (por si el trigger no llegó a tiempo)
drop policy if exists crear_mi_persona on personas;
create policy crear_mi_persona on personas for insert with check (id = auth.uid());
drop policy if exists editar_mi_persona on personas;
create policy editar_mi_persona on personas for update using (id = auth.uid()) with check (id = auth.uid());

-- El gerente puede editar su cuenta (nombre, plan lo mueve Stripe desde el servidor)
drop policy if exists tocar_mi_cuenta on cuentas;
create policy tocar_mi_cuenta on cuentas for update using (
  exists (select 1 from locales l where l.cuenta_id = cuentas.id and es_gerente(l.id))
);
