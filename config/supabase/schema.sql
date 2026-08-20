-- ============================================================
-- ESTOOK · esquema de base de datos
-- Postgres / Supabase. Se ejecuta entero y es idempotente.
-- Orden: tipos → cuenta y locales → personas y permisos → despensa →
--        cocina → servicio → equipo → negocio → asistente → chat →
--        competencia y reseñas → documentos → auditoría.
-- ============================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ---------- Tipos ----------
do $$ begin
  create type rol_estook as enum ('gerente','jefe_cocina','jefe_sala','cocinero','sala','gestoria');
exception when duplicate_object then null; end $$;

do $$ begin
  create type nivel_acceso as enum ('sin_acceso','ver','editar');
exception when duplicate_object then null; end $$;

do $$ begin
  create type plan_estook as enum ('prueba','base','pro','grupo','a_medida');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_pedido as enum ('borrador','enviado','recibido','cancelado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type origen_ventas as enum ('tpv_api','csv','foto','total_dia');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fiabilidad as enum ('alta','media','baja');
exception when duplicate_object then null; end $$;

do $$ begin
  create type motivo_merma as enum ('caducidad','rotura','error_cocina','devolucion','personal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_movimiento as enum ('entrada','consumo','merma','ajuste','produccion','inventario');
exception when duplicate_object then null; end $$;

do $$ begin
  create type categoria_carta as enum ('estrella','caballo','puzzle','perro','sin_datos');
exception when duplicate_object then null; end $$;

do $$ begin
  create type nivel_aviso as enum ('informativa','importante','urgente');
exception when duplicate_object then null; end $$;

-- Función de sello de tiempo
create or replace function tocar_actualizado() returns trigger language plpgsql as $$
begin
  new.actualizado_en = now();
  return new;
end $$;

-- ============================================================
-- 1 · CUENTA Y LOCALES
-- ============================================================
create table if not exists cuentas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  plan plan_estook not null default 'prueba',
  prueba_termina_en timestamptz default (now() + interval '14 days'),
  stripe_cliente_id text,
  stripe_suscripcion_id text,
  estado_pago text not null default 'al_dia',           -- al_dia | fallido | solo_lectura | archivada
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists locales (
  id uuid primary key default gen_random_uuid(),
  cuenta_id uuid not null references cuentas(id) on delete cascade,
  nombre text not null,
  tipo_local text,                                       -- bar_tapas | restaurante | cafeteria | obrador | food_truck | cadena | otro
  direccion text,
  cif text,
  telefono text,
  horarios jsonb default '{}'::jsonb,
  logo_url text,
  color_secundario text not null default '#FF7A00',
  hora_corte time not null default '06:00',
  google_place_id text,
  moneda text not null default 'EUR',
  zona_horaria text not null default 'Europe/Madrid',
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index if not exists idx_locales_cuenta on locales(cuenta_id);

-- Apps encendidas o apagadas por local (nunca borra datos, solo oculta)
create table if not exists apps_local (
  local_id uuid not null references locales(id) on delete cascade,
  app text not null,                                     -- despensa | cocina_fichas | cocina_carta | menu_dia | servicio | equipo | equipo_cuadrante | fichajes | negocio | tpv | competencia | resenas | chat
  activa boolean not null default true,
  actualizado_en timestamptz not null default now(),
  primary key (local_id, app)
);

-- Objetivos que ponen en verde o en rojo los semáforos
create table if not exists objetivos_local (
  local_id uuid primary key references locales(id) on delete cascade,
  materia_prima numeric(5,2) default 32,
  personal numeric(5,2) default 30,
  margen_por_familia jsonb default '{}'::jsonb,
  actualizado_en timestamptz not null default now()
);

-- ============================================================
-- 2 · PERSONAS Y PERMISOS
-- ============================================================
create table if not exists personas (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  correo text not null,
  telefono text,
  creado_en timestamptz not null default now()
);

create table if not exists miembros (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references personas(id) on delete cascade,
  local_id uuid not null references locales(id) on delete cascade,
  rol rol_estook not null,
  pin_hash text,                                         -- PIN de 4 dígitos, siempre cifrado
  activo boolean not null default true,
  invitado_en timestamptz not null default now(),
  acceso_retirado_en timestamptz,
  unique (persona_id, local_id)
);
create index if not exists idx_miembros_local on miembros(local_id);

-- Ajuste casilla a casilla sobre el alcance predeterminado del rol
create table if not exists permisos (
  miembro_id uuid not null references miembros(id) on delete cascade,
  ambito text not null,                                  -- despensa.productos | despensa.precios | cocina.fichas | ...
  nivel nivel_acceso not null,
  primary key (miembro_id, ambito)
);

create table if not exists invitaciones (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references locales(id) on delete cascade,
  correo text not null,
  rol rol_estook not null,
  pin_hash text not null,
  aceptada_en timestamptz,
  caduca_en timestamptz not null default (now() + interval '14 days'),
  creado_en timestamptz not null default now()
);

-- ============================================================
-- 3 · DESPENSA
-- ============================================================
create table if not exists proveedores (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references locales(id) on delete cascade,
  nombre text not null,
  cif text, telefono text, correo text, web text, contacto text,
  dias_reparto text[],
  pedido_minimo numeric(10,2),
  forma_pago text,
  notas text,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index if not exists idx_proveedores_local on proveedores(local_id);

create table if not exists productos (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references locales(id) on delete cascade,
  nombre text not null,
  categoria text,
  foto_url text,
  unidad_compra text,                                    -- "caja 3 kg"
  unidad_uso text not null default 'g',                  -- g | ml | ud
  factor numeric(12,4) not null default 1,               -- unidades de uso por formato
  rendimiento numeric(5,4) not null default 1,           -- lo que queda tras limpiar
  peso_variable boolean not null default false,
  stock_actual numeric(12,3) not null default 0,         -- la cifra manda
  minimo numeric(12,3),
  alergenos text[] default '{}',
  proveedor_id uuid references proveedores(id) on delete set null,
  precio_ultimo numeric(12,4),                           -- por formato
  sin_precio boolean generated always as (precio_ultimo is null) stored,
  factor_calibracion numeric(6,4) not null default 1,    -- lo que se sirve de más
  recuentos_calibrados int not null default 0,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index if not exists idx_productos_local on productos(local_id);
create index if not exists idx_productos_nombre on productos using gin (nombre gin_trgm_ops);

-- Coste real por unidad de uso = precio / (factor * rendimiento)
create or replace function coste_unidad_uso(p productos) returns numeric language sql immutable as $$
  select case when p.precio_ultimo is null or p.factor = 0 or p.rendimiento = 0
              then null
              else p.precio_ultimo / (p.factor * p.rendimiento) end
$$;

create table if not exists lotes (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references productos(id) on delete cascade,
  cantidad numeric(12,3) not null,
  caducidad date,
  recibido_en timestamptz not null default now(),
  agotado boolean not null default false
);
create index if not exists idx_lotes_caducidad on lotes(caducidad) where agotado = false;

create table if not exists movimientos_stock (
  id uuid primary key default gen_random_uuid(),
  clave_apunte uuid unique,                              -- idempotencia de la cola offline
  local_id uuid not null references locales(id) on delete cascade,
  producto_id uuid not null references productos(id) on delete cascade,
  tipo tipo_movimiento not null,
  cantidad numeric(12,3) not null,                       -- en unidad de uso, con signo
  motivo text,
  referencia_tipo text,                                  -- pedido | jornada | inventario | merma | ajuste
  referencia_id uuid,
  hecho_por uuid references personas(id),
  creado_en timestamptz not null default now()
);
create index if not exists idx_movimientos_producto on movimientos_stock(producto_id, creado_en desc);

create table if not exists precios_historico (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references productos(id) on delete cascade,
  proveedor_id uuid references proveedores(id) on delete set null,
  precio numeric(12,4) not null,
  unidad text,
  fecha date not null default current_date,
  origen text                                            -- albaran | manual | pedido | csv
);
create index if not exists idx_precios_producto on precios_historico(producto_id, fecha desc);

create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references locales(id) on delete cascade,
  proveedor_id uuid not null references proveedores(id) on delete restrict,
  estado estado_pedido not null default 'borrador',
  enviado_por text,                                      -- whatsapp | correo | pdf
  enviado_en timestamptz,
  recibido_en timestamptz,
  numero_albaran text,
  incidencia text,
  creado_por uuid references personas(id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index if not exists idx_pedidos_local on pedidos(local_id, estado);

create table if not exists pedido_lineas (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos(id) on delete cascade,
  producto_id uuid references productos(id) on delete set null,
  nombre_libre text,                                     -- lo que vino sin estar dado de alta
  cantidad_pedida numeric(12,3) not null,
  cantidad_recibida numeric(12,3),
  precio numeric(12,4),
  falto boolean not null default false
);

create table if not exists inventarios (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references locales(id) on delete cascade,
  tipo text not null default 'ciclico',                  -- ciclico | completo
  abierto_en timestamptz not null default now(),
  cerrado_en timestamptz,
  cerrado_por uuid references personas(id),
  desviacion numeric(6,3)
);

create table if not exists inventario_lineas (
  id uuid primary key default gen_random_uuid(),
  inventario_id uuid not null references inventarios(id) on delete cascade,
  producto_id uuid not null references productos(id) on delete cascade,
  teorico numeric(12,3),
  esperado numeric(12,3),                                -- teórico corregido con la calibración
  contado numeric(12,3),
  valor numeric(12,2)
);

create table if not exists mermas (
  id uuid primary key default gen_random_uuid(),
  clave_apunte uuid unique,
  local_id uuid not null references locales(id) on delete cascade,
  producto_id uuid references productos(id) on delete set null,
  producto text,                                         -- por si se apunta antes de existir la ficha
  cantidad numeric(12,3) not null,
  motivo motivo_merma not null,
  registrado_por uuid references personas(id),
  registrado_en timestamptz not null default now()
);
create index if not exists idx_mermas_local on mermas(local_id, registrado_en desc);

-- ============================================================
-- 4 · COCINA
-- ============================================================
create table if not exists elaboraciones (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references locales(id) on delete cascade,
  nombre text not null,
  rendimiento numeric(12,3) not null default 1,
  unidad text not null default 'g',
  stock_actual numeric(12,3) not null default 0,
  coste_unitario numeric(12,4),
  pasos jsonb default '[]'::jsonb,
  activa boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists platos (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references locales(id) on delete cascade,
  nombre text not null,
  descripcion text,
  foto_url text,
  precio_venta numeric(10,2),
  iva numeric(5,2) not null default 10,
  familia text,
  version int not null default 1,
  dificultad text,
  mise_en_place text,
  conservacion text,
  truco text,
  pasos jsonb default '[]'::jsonb,                       -- [{orden, texto, foto_url, minutos, temperatura, utensilio}]
  alergenos text[] default '{}',
  agotado boolean not null default false,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index if not exists idx_platos_local on platos(local_id);

create table if not exists plato_ingredientes (
  id uuid primary key default gen_random_uuid(),
  plato_id uuid not null references platos(id) on delete cascade,
  producto_id uuid references productos(id) on delete restrict,
  elaboracion_id uuid references elaboraciones(id) on delete restrict,
  cantidad numeric(12,3) not null,                       -- en unidad de uso
  check (producto_id is not null or elaboracion_id is not null)
);

create table if not exists elaboracion_ingredientes (
  id uuid primary key default gen_random_uuid(),
  elaboracion_id uuid not null references elaboraciones(id) on delete cascade,
  producto_id uuid references productos(id) on delete restrict,
  sub_elaboracion_id uuid references elaboraciones(id) on delete restrict,
  cantidad numeric(12,3) not null
);

-- Versiones de la ficha: los costes históricos no se tocan al cambiar un gramaje
create table if not exists plato_versiones (
  id uuid primary key default gen_random_uuid(),
  plato_id uuid not null references platos(id) on delete cascade,
  version int not null,
  datos jsonb not null,
  coste numeric(12,4),
  creado_por uuid references personas(id),
  creado_en timestamptz not null default now(),
  unique (plato_id, version)
);

-- Modo aprendizaje del cocinero
create table if not exists fichas_aprendidas (
  miembro_id uuid not null references miembros(id) on delete cascade,
  plato_id uuid not null references platos(id) on delete cascade,
  version int not null,
  marcado_en timestamptz not null default now(),
  primary key (miembro_id, plato_id)
);

create table if not exists carta_secciones (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references locales(id) on delete cascade,
  nombre text not null,
  orden int not null default 0
);

create table if not exists carta_platos (
  id uuid primary key default gen_random_uuid(),
  seccion_id uuid not null references carta_secciones(id) on delete cascade,
  plato_id uuid references platos(id) on delete set null,
  nombre text,
  precio numeric(10,2),
  descripcion text,
  orden int not null default 0,
  categoria categoria_carta not null default 'sin_datos'
);

create table if not exists menus_dia (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references locales(id) on delete cascade,
  fecha date not null,
  precio numeric(10,2),
  incluye text,
  suplementos jsonb default '[]'::jsonb,
  bloques jsonb not null default '[]'::jsonb,            -- [{titulo, platos:[{plato_id|nombre}]}]
  margen_estimado numeric(6,2),
  publicado boolean not null default false,
  creado_en timestamptz not null default now(),
  unique (local_id, fecha)
);

-- ============================================================
-- 5 · SERVICIO
-- ============================================================
create table if not exists jornadas (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references locales(id) on delete cascade,
  fecha date not null,
  abierta_en timestamptz not null default now(),
  cerrada_en timestamptz,
  cerrada_por uuid references personas(id),
  origen origen_ventas,
  fiabilidad fiabilidad,
  ventas_total numeric(12,2),
  tickets int,
  reabierta_motivo text,
  unique (local_id, fecha)
);

create table if not exists ventas (
  id uuid primary key default gen_random_uuid(),
  jornada_id uuid not null references jornadas(id) on delete cascade,
  local_id uuid not null references locales(id) on delete cascade,
  identificador_externo text,                            -- id del pedido en el TPV
  fecha_servicio date not null,
  total numeric(12,2) not null,
  metodo_pago text,
  canal text,
  mesa text,
  propina numeric(10,2),
  descuento numeric(10,2),
  creado_en timestamptz not null default now(),
  unique (local_id, identificador_externo)
);

create table if not exists venta_lineas (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references ventas(id) on delete cascade,
  plato_id uuid references platos(id) on delete set null,
  articulo_externo text,
  nombre text not null,
  unidades numeric(10,3) not null default 1,
  importe numeric(12,2) not null,
  modificadores jsonb default '[]'::jsonb
);

create table if not exists appcc_planes (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references locales(id) on delete cascade,
  version int not null default 1,
  vigente boolean not null default true,
  creado_en timestamptz not null default now()
);

create table if not exists appcc_puntos (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references appcc_planes(id) on delete cascade,
  nombre text not null,
  tipo text not null,                                    -- temperatura | limpieza | recepcion | trazabilidad
  limite_min numeric(8,2),
  limite_max numeric(8,2),
  frecuencia text not null default 'diaria',
  accion_correctiva text,
  orden int not null default 0
);

create table if not exists appcc_registros (
  id uuid primary key default gen_random_uuid(),
  clave_apunte uuid unique,
  local_id uuid not null references locales(id) on delete cascade,
  punto_id uuid not null references appcc_puntos(id) on delete cascade,
  valor numeric(8,2),
  correcto boolean,
  accion_correctiva text,
  firmado_por uuid references personas(id),
  registrado_en timestamptz not null default now(),
  fecha date not null default current_date
);
create index if not exists idx_appcc_registros on appcc_registros(local_id, fecha);

-- ============================================================
-- 6 · EQUIPO
-- ============================================================
create table if not exists turnos (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references locales(id) on delete cascade,
  miembro_id uuid not null references miembros(id) on delete cascade,
  fecha date not null,
  publicado boolean not null default false,
  notas text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index if not exists idx_turnos_local_fecha on turnos(local_id, fecha);

create table if not exists turno_tramos (
  id uuid primary key default gen_random_uuid(),
  turno_id uuid not null references turnos(id) on delete cascade,
  entrada time not null,
  salida time not null,
  orden int not null default 1
);

create table if not exists fichajes (
  id uuid primary key default gen_random_uuid(),
  clave_apunte uuid unique,
  local_id uuid not null references locales(id) on delete cascade,
  miembro_id uuid not null references miembros(id) on delete cascade,
  entrada timestamptz not null,
  salida timestamptz,
  sin_cerrar boolean not null default false,
  corregido_por uuid references personas(id),
  corregido_en timestamptz,
  nota_correccion text
);
create index if not exists idx_fichajes_miembro on fichajes(miembro_id, entrada desc);

-- ============================================================
-- 7 · NEGOCIO Y TPV
-- ============================================================
create table if not exists tpv_conexiones (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references locales(id) on delete cascade,
  proveedor text not null,                               -- agora | hosteltactil | lastapp | revo | lightspeed | square
  estado text not null default 'sin_conectar',           -- sin_conectar | conectado | error
  ultima_sincronizacion timestamptz,
  mensaje_error text,
  trae_inventario boolean not null default false,        -- si su API lo permite, puede actualizar la despensa
  creado_en timestamptz not null default now()
);

create table if not exists tpv_articulos (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references locales(id) on delete cascade,
  articulo_externo text not null,
  nombre_externo text not null,
  plato_id uuid references platos(id) on delete set null,
  confirmado boolean not null default false,
  unique (local_id, articulo_externo)
);

create table if not exists cierres_caja (
  id uuid primary key default gen_random_uuid(),
  jornada_id uuid not null references jornadas(id) on delete cascade,
  efectivo numeric(12,2),
  tarjeta numeric(12,2),
  otros numeric(12,2),
  descuadre numeric(12,2),
  firmado_por uuid references personas(id),
  creado_en timestamptz not null default now()
);

create table if not exists resumenes (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references locales(id) on delete cascade,
  periodo text not null,                                 -- dia | semana | mes
  desde date not null,
  hasta date not null,
  datos jsonb not null,
  creado_en timestamptz not null default now(),
  unique (local_id, periodo, desde)
);

-- ============================================================
-- 8 · FOGÓN
-- ============================================================
create table if not exists contexto_local (
  local_id uuid primary key references locales(id) on delete cascade,
  resumen_dia text,                                      -- máx. ~1.500 tokens
  perfil_negocio text,                                   -- máx. ~1.000 tokens
  regenerado_en timestamptz not null default now()
);

create table if not exists avisos (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references locales(id) on delete cascade,
  dirigido_a rol_estook[],
  miembro_id uuid references miembros(id) on delete cascade,
  titulo text not null,
  cuerpo text,
  nivel nivel_aviso not null default 'importante',
  origen text not null,                                  -- consulta | modelo
  app text,
  accion_texto text,
  accion_ruta text,
  huella text,                                           -- para no repetir el mismo aviso
  estado text not null default 'abierto',                -- abierto | cerrado | aplicado | ahora_no
  vuelve_en timestamptz,
  creado_en timestamptz not null default now(),
  cerrado_en timestamptz
);
create index if not exists idx_avisos_local on avisos(local_id, estado, creado_en desc);

create table if not exists consumo_ia (
  id uuid primary key default gen_random_uuid(),
  cuenta_id uuid not null references cuentas(id) on delete cascade,
  local_id uuid references locales(id) on delete set null,
  persona_ref uuid references miembros(id) on delete set null,   -- para el freno de ráfaga
  tarea text not null,
  modelo text,
  tokens_entrada int default 0,
  tokens_salida int default 0,
  con_cache boolean default false,
  coste_eur numeric(10,5) default 0,
  milisegundos int,
  creado_en timestamptz not null default now()
);
create index if not exists idx_consumo_ia_dia on consumo_ia(cuenta_id, creado_en desc);

create table if not exists consumo_externo (
  id uuid primary key default gen_random_uuid(),
  cuenta_id uuid references cuentas(id) on delete cascade,
  local_id uuid references locales(id) on delete set null,
  servicio text not null,                                -- google_places | correo | sms
  llamadas int not null default 1,
  coste_eur numeric(10,5) default 0,
  creado_en timestamptz not null default now()
);

-- ============================================================
-- 9 · CHAT
-- ============================================================
create table if not exists canales (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references locales(id) on delete cascade,
  nombre text not null,
  tipo text not null default 'area',                     -- general | area | directo
  roles rol_estook[],
  creado_en timestamptz not null default now()
);

create table if not exists canal_miembros (
  canal_id uuid not null references canales(id) on delete cascade,
  miembro_id uuid not null references miembros(id) on delete cascade,
  primary key (canal_id, miembro_id)
);

create table if not exists mensajes (
  id uuid primary key default gen_random_uuid(),
  canal_id uuid not null references canales(id) on delete cascade,
  autor_miembro_id uuid references miembros(id) on delete set null,
  de_fogon boolean not null default false,
  texto text,
  adjunto_url text,
  contexto jsonb,                                        -- tarjeta enlazada: {tipo, id, titulo}
  importante boolean not null default false,
  archivado boolean not null default false,
  creado_en timestamptz not null default now()
);
create index if not exists idx_mensajes_canal on mensajes(canal_id, creado_en desc);

create table if not exists lecturas (
  mensaje_id uuid not null references mensajes(id) on delete cascade,
  miembro_id uuid not null references miembros(id) on delete cascade,
  leido_en timestamptz not null default now(),
  primary key (mensaje_id, miembro_id)
);

create table if not exists notificaciones (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references locales(id) on delete cascade,
  miembro_id uuid references miembros(id) on delete cascade,
  tipo text not null,
  nivel nivel_aviso not null default 'informativa',
  titulo text not null,
  cuerpo text,
  ruta text,
  leida_en timestamptz,
  entregada_en timestamptz,
  canal_envio text[],                                    -- app | push | correo | sms
  creado_en timestamptz not null default now()
);
create index if not exists idx_notificaciones_miembro on notificaciones(miembro_id, leida_en, creado_en desc);

create table if not exists preferencias_avisos (
  miembro_id uuid not null references miembros(id) on delete cascade,
  tipo text not null,
  en_app boolean not null default true,
  push boolean not null default true,
  correo boolean not null default false,
  primary key (miembro_id, tipo)
);

-- ============================================================
-- 10 · COMPETENCIA Y RESEÑAS
-- ============================================================
create table if not exists competidores (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references locales(id) on delete cascade,
  google_place_id text,
  nombre text not null,
  distancia_m int,
  tipo_cocina text,
  precio_menu numeric(10,2),
  valoracion numeric(3,2),
  num_resenas int,
  horarios jsonb,
  datos jsonb,
  consultado_en timestamptz not null default now(),
  unique (local_id, google_place_id)
);

create table if not exists resenas (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references locales(id) on delete cascade,
  fuente text not null default 'google',
  identificador_externo text,
  autor text,
  nota numeric(2,1),
  texto text,
  temas text[],
  publicada_en timestamptz,
  respondida boolean not null default false,
  respuesta_propuesta text,
  creado_en timestamptz not null default now(),
  unique (local_id, fuente, identificador_externo)
);

-- ============================================================
-- 11 · DOCUMENTOS
-- Historial con fecha y con los datos usados: se puede volver y regenerar el PDF de ese día.
-- ============================================================
create table if not exists documentos (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references locales(id) on delete cascade,
  tipo text not null,                                    -- horario_semanal | menu_dia | carta | ficha_plato | appcc_parte | ...
  titulo text not null,
  plantilla text not null,
  parametros jsonb not null default '{}'::jsonb,
  datos jsonb not null,                                  -- copia de los datos usados: el PDF sale igual dentro de un año
  periodo_desde date,
  periodo_hasta date,
  huella text not null,
  valor_legal boolean not null default false,            -- estos sí se guardan como fichero, cinco años
  fichero_url text,
  generado_por uuid references personas(id),
  generado_en timestamptz not null default now()
);
create index if not exists idx_documentos_local on documentos(local_id, tipo, generado_en desc);
create index if not exists idx_documentos_busqueda on documentos using gin (titulo gin_trgm_ops);

-- ============================================================
-- 12 · AUDITORÍA (solo altas)
-- ============================================================
create table if not exists auditoria (
  id uuid primary key default gen_random_uuid(),
  local_id uuid references locales(id) on delete cascade,
  persona_id uuid references personas(id) on delete set null,
  entidad text not null,
  entidad_id uuid,
  accion text not null,
  antes jsonb,
  despues jsonb,
  de_fogon boolean not null default false,
  creado_en timestamptz not null default now()
);
create index if not exists idx_auditoria_local on auditoria(local_id, creado_en desc);

-- ---------- Sellos de tiempo ----------
do $$
declare t text;
begin
  foreach t in array array['cuentas','locales','proveedores','productos','pedidos','elaboraciones','platos','turnos']
  loop
    execute format(
      'drop trigger if exists tg_%1$s_actualizado on %1$s;
       create trigger tg_%1$s_actualizado before update on %1$s
       for each row execute function tocar_actualizado();', t);
  end loop;
end $$;
