-- Datos de ejemplo para probar la app sin un local real. No ejecutar en producción.
-- Para borrarlos: delete from cuentas where id = '11111111-1111-4111-8111-111111111111';

insert into cuentas (id, nombre, plan) values
  ('11111111-1111-4111-8111-111111111111', 'Cuenta de pruebas', 'pro')
on conflict (id) do nothing;

insert into locales (id, cuenta_id, nombre, tipo_local, direccion, color_secundario) values
  ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111',
   'Bar Centro', 'bar_tapas', 'Calle Mayor 1, Madrid', '#FF7A00')
on conflict (id) do nothing;

insert into objetivos_local (local_id, materia_prima, personal) values
  ('22222222-2222-4222-8222-222222222222', 32, 30)
on conflict (local_id) do nothing;

insert into productos (local_id, nombre, categoria, unidad_compra, unidad_uso, factor, rendimiento, stock_actual, minimo, precio_ultimo)
values
  ('22222222-2222-4222-8222-222222222222', 'Pulpo cocido', 'Pescado', 'caja 3 kg', 'g', 3000, 0.92, 4200, 2000, 68.40),
  ('22222222-2222-4222-8222-222222222222', 'Merluza',      'Pescado', 'caja 5 kg', 'g', 5000, 0.68, 2100, 3000, 42.00),
  ('22222222-2222-4222-8222-222222222222', 'Patata',       'Verdura', 'saco 20 kg','g', 20000, 0.85, 15000, 5000, 12.80),
  ('22222222-2222-4222-8222-222222222222', 'Aceite oliva', 'Aceites', 'garrafa 5 l','ml', 5000, 1.00, 3200, 2000, 41.50)
on conflict do nothing;
