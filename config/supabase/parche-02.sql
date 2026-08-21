-- ============================================================
-- PARCHE 02 · planes, límite de locales y administración
--
-- Qué arregla:
--  1. El plan «a medida» no decía cuántos locales van contratados: se pagaba
--     por uno y se podían crear diez. Ahora el número se fija a mano y el
--     servidor lo hace cumplir.
--  2. Añade el precio pactado por local, para que la facturación cuadre.
--  3. Marca quién es administrador de Estook (nosotros), para el panel /admin.
--
-- Se ejecuta en el SQL Editor después de schema.sql y policies.sql.
-- Es idempotente: se puede repetir sin miedo.
-- ============================================================

-- ---------- 1 · Columnas nuevas ----------
alter table cuentas add column if not exists metodo_pago_puesto boolean not null default false;
alter table cuentas add column if not exists locales_contratados int;              -- lo pactado a mano
alter table cuentas add column if not exists precio_por_local numeric(10,2);       -- € con IVA
alter table cuentas add column if not exists notas_internas text;                  -- solo lo vemos nosotros

alter table consumo_ia add column if not exists persona_ref uuid references miembros(id) on delete set null;
alter table pedidos    add column if not exists fecha_entrega date;
alter table pedidos    add column if not exists hora_entrega  time;
alter table pedidos    add column if not exists notas text;

create index if not exists idx_consumo_ia_rafaga on consumo_ia(local_id, persona_ref, creado_en desc);
create index if not exists idx_consumo_externo_dia on consumo_externo(cuenta_id, servicio, creado_en desc);

-- ---------- 2 · Cuántos locales permite cada plan ----------
create or replace function locales_permitidos(p_cuenta uuid) returns int
language sql stable security definer set search_path = public as $$
  select case c.plan
           when 'prueba'   then 1
           when 'base'     then 1
           when 'pro'      then 1
           when 'grupo'    then least(coalesce(c.locales_contratados, 3), 3)
           when 'a_medida' then coalesce(c.locales_contratados, 1)   -- sin número pactado, uno
           else 1
         end
  from cuentas c where c.id = p_cuenta
$$;

-- Freno de verdad: en el servidor, no en la pantalla.
create or replace function comprobar_limite_locales() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_actuales int;
  v_permitidos int;
begin
  select count(*) into v_actuales from locales where cuenta_id = new.cuenta_id and activo = true;
  v_permitidos := locales_permitidos(new.cuenta_id);
  if v_actuales >= v_permitidos then
    raise exception 'El plan contratado permite % local(es). Para añadir más, hay que ampliar el plan.', v_permitidos
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

drop trigger if exists tg_limite_locales on locales;
create trigger tg_limite_locales
  before insert on locales
  for each row execute function comprobar_limite_locales();

-- ---------- 3 · Administradores de Estook ----------
create table if not exists administradores (
  persona_id uuid primary key references personas(id) on delete cascade,
  correo text not null,
  puede_invitar boolean not null default false,
  creado_en timestamptz not null default now()
);

alter table administradores enable row level security;
alter table administradores force row level security;

create or replace function soy_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from administradores a where a.persona_id = auth.uid())
$$;

drop policy if exists ver_administradores on administradores;
create policy ver_administradores on administradores for select using (soy_admin());

drop policy if exists tocar_administradores on administradores;
create policy tocar_administradores on administradores for all
  using (exists (select 1 from administradores a where a.persona_id = auth.uid() and a.puede_invitar))
  with check (exists (select 1 from administradores a where a.persona_id = auth.uid() and a.puede_invitar));

-- El primer administrador: el dueño de Estook.
insert into administradores (persona_id, correo, puede_invitar)
select id, email, true from auth.users where lower(email) = lower('belicar1905@gmail.com')
on conflict (persona_id) do update set puede_invitar = true;

-- ---------- 4 · Lo que ve el panel de administración ----------
-- Vistas agregadas: nunca datos personales de los empleados de los clientes.

create or replace view admin_cuentas
with (security_invoker = true) as
  select
    c.id, c.nombre, c.plan, c.estado_pago, c.creado_en,
    c.prueba_termina_en, c.metodo_pago_puesto,
    coalesce(c.locales_contratados, locales_permitidos(c.id)) as locales_contratados,
    c.precio_por_local,
    (select count(*) from locales l where l.cuenta_id = c.id and l.activo) as locales_activos,
    (select count(*) from miembros m join locales l on l.id = m.local_id
      where l.cuenta_id = c.id and m.activo) as personas,
    (select coalesce(sum(ia.coste_eur), 0) from consumo_ia ia
      where ia.cuenta_id = c.id and ia.creado_en >= date_trunc('month', now())) as coste_ia_mes,
    (select coalesce(sum(ex.coste_eur), 0) from consumo_externo ex
      where ex.cuenta_id = c.id and ex.creado_en >= date_trunc('month', now())) as coste_apis_mes
  from cuentas c
  where soy_admin();

create or replace view admin_consumo_diario
with (security_invoker = true) as
  select
    date_trunc('day', creado_en)::date as dia,
    cuenta_id,
    sum(coste_eur) as coste_ia,
    count(*) as llamadas
  from consumo_ia
  where soy_admin() and creado_en >= now() - interval '60 days'
  group by 1, 2;

grant select on admin_cuentas, admin_consumo_diario to authenticated;

-- ---------- 5 · Repaso de seguridad ----------
-- Nadie puede cambiarse el plan desde el navegador: el plan lo mueve Stripe
-- desde el servidor, o nosotros desde el panel de administración.
create or replace function proteger_plan() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if soy_admin() then return new; end if;                    -- nosotros sí
  if new.plan is distinct from old.plan
     or new.locales_contratados is distinct from old.locales_contratados
     or new.precio_por_local is distinct from old.precio_por_local
     or new.estado_pago is distinct from old.estado_pago then
    raise exception 'El plan y la facturación no se cambian desde la aplicación.'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;

drop trigger if exists tg_proteger_plan on cuentas;
create trigger tg_proteger_plan
  before update on cuentas
  for each row execute function proteger_plan();

-- Los administradores ven y ajustan las cuentas de los clientes.
drop policy if exists admin_ve_cuentas on cuentas;
create policy admin_ve_cuentas on cuentas for select using (soy_admin());
drop policy if exists admin_toca_cuentas on cuentas;
create policy admin_toca_cuentas on cuentas for update using (soy_admin()) with check (soy_admin());

-- Comprobación
select 'Administradores' as que, count(*)::text as valor from administradores
union all
select 'Cuentas', count(*)::text from cuentas
union all
select 'Locales activos', count(*)::text from locales where activo;
