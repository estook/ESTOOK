# Configuración de Estook

Aquí van todas las claves. Nada de esto hace falta para trabajar en la app: se construye
primero y se conecta al final. Cuando toque conectar, se hace en este orden.

## 1 · Copia la plantilla

    cp config/.env.example config/.env.local

`.env.local` está en `.gitignore` desde el primer commit. No lo subas nunca ni lo pegues en un chat.

## 2 · Supabase — base de datos, usuarios y ficheros

En supabase.com › New project. Después, en el proyecto:

| Clave | Dónde está | Para qué |
|---|---|---|
| `VITE_SUPABASE_URL` | Project Settings › API › Project URL | La dirección de tu base |
| `VITE_SUPABASE_ANON_KEY` | Project Settings › API › anon public | La que usa la app en el móvil |
| `SUPABASE_SERVICE_KEY` | Project Settings › API › service_role | Solo servidor. Nunca en el navegador |
| `DATABASE_URL` | Project Settings › Database › Connection string | Para aplicar el esquema |

Luego se aplican, en este orden:

Lo más cómodo es pegarlos en el editor SQL de Supabase, en este orden: `schema.sql`,
`policies.sql`, `storage.sql` y, si quieres datos de ejemplo, `seed.sql`. Así no hace falta
la contraseña de Postgres. Los pasos exactos están en **CONECTAR.md**.

Los tres cubos de ficheros (`logos`, `fotos`, `albaranes`) los crea `storage.sql`. Son privados
y se sirven con URL firmadas y caducas, nunca públicos.

## 3 · Stripe — cobros

Ver `stripe/productos.md` (cómo crear los planes) y `stripe/webhooks.md` (qué eventos escuchar).

## 4 · Fogón — IA

`AI_API_KEY` del panel del proveedor. Dos modelos: uno rápido para el día a día y uno de
análisis para el cierre y el resumen semanal.

## 5 · TPV, Google y correo

Ver `integraciones/tpv.md`, `integraciones/google.md` e `integraciones/correo.md`.

## 6 · Qué se puede hacer sin cada cosa

| Si falta | La app | Lo que se pierde |
|---|---|---|
| TPV | funciona | las ventas entran por CSV, foto del Z o total del día |
| Google | funciona | Competencia y Reseñas quedan apagadas |
| Stripe | funciona | no se puede cobrar ni cambiar de plan |
| Correo | funciona | no salen invitaciones ni horarios por correo |
| Supabase | no | es la base: sin esto no hay app |

## 7 · Seguridad, sin excepciones

- Las claves de servidor (`SUPABASE_SERVICE_KEY`, `STRIPE_SECRET_KEY`, `AI_API_KEY`,
  `POS_API_KEY`) no aparecen nunca en el navegador. Todo lo que las use va en funciones de servidor.
- Claves distintas para pruebas y para producción.
- Copia de seguridad diaria de la base, con 30 días de retención.
