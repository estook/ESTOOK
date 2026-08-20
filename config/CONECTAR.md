# Conectar Estook · guía exacta

Todo lo que hay que hacer, en orden, sin saltarse nada. Cada paso dice dónde se hace, qué se
pega y cómo se comprueba que ha salido bien.

> **Antes de empezar, dos cosas de seguridad.**
> 1. Las claves que me has pasado están ahora en un chat. Antes de vender a un cliente real,
>    entra en Google Cloud y **regenera** la de Maps y la de Gemini. Cambiarlas después es
>    cambiar dos líneas.
> 2. Tu contraseña de Postgres **no me la pases nunca** y no hace falta: todo el esquema se
>    aplica desde el editor SQL de Supabase, que ya va autenticado con tu sesión.

---

## 1 · Supabase · la base de datos

Proyecto: `dqdmutauhgowqknwpwcm` · https://supabase.com/dashboard/project/dqdmutauhgowqknwpwcm

### 1.1 Aplicar el esquema

En el panel: **SQL Editor** › **New query**. Se pegan y ejecutan **en este orden**, uno por uno,
esperando a que cada uno diga *Success*:

| Orden | Archivo del repositorio | Qué crea |
|---|---|---|
| 1 | `config/supabase/schema.sql` | 9 tipos, 55 tablas, índices, la función de coste por unidad de uso y los sellos de tiempo |
| 2 | `config/supabase/policies.sql` | Las reglas de acceso: quién ve qué, rol por rol, y las vistas sin costes |
| 3 | `config/supabase/storage.sql` | Los tres cubos de ficheros y sus permisos |
| 4 | `config/supabase/alta.sql` | El alta automática: al registrarse, se le crea cuenta, local y rol de gerente |
| 5 | `config/supabase/parche-01.sql` | Columnas nuevas (freno de ráfaga y método de pago) |
| 6 | `config/supabase/admin.sql` | Deja tu correo como gerente con el plan más alto. **Antes hay que crear la cuenta desde la web** |
| 7 | `config/supabase/seed.sql` | *Opcional.* Un local de pruebas con cuatro productos. En producción, no |

**Comprobación:** en **Table Editor** tienen que aparecer `cuentas`, `locales`, `productos`,
`platos`, `documentos`… y en **Database › Roles/Policies** cada tabla con el candado de RLS
activo. Si alguna sale sin candado, algo falló en el paso 2 y hay que repetirlo.

Para borrar el local de pruebas después:

```sql
delete from cuentas where id = '11111111-1111-4111-8111-111111111111';
```

### 1.2 Autenticación

**Authentication › Sign In / Providers**:

- **Email**: activado. Es el único que usamos: correo con contraseña para quien gestiona, y
  correo con PIN para el resto (el PIN lo valida la app contra `miembros.pin_hash`).
- **Confirm email**: activado. La invitación ya lleva su enlace.
- Teléfono, Google, Apple y demás: apagados. No los necesitamos y son superficie de ataque.

**Authentication › URL Configuration**:

| Campo | Valor |
|---|---|
| Site URL | `https://estook.com` (mientras tanto, la URL de GitHub Pages) |
| Redirect URLs | `http://localhost:5173/**`, `https://estook.com/**` y la de Pages con `/**` |

**Authentication › Sessions**: caducidad de sesión larga (una semana o más). Es una app de
cocina: nadie quiere volver a entrar cada mañana con las manos mojadas.

### 1.3 Las claves de la API

**Project Settings › API Keys**:

| Clave | Dónde va | Ya la tengo |
|---|---|---|
| Project URL | `VITE_SUPABASE_URL` | sí |
| Publishable key (`sb_publishable_…`) | `VITE_SUPABASE_ANON_KEY` | sí |
| **Secret key** (`sb_secret_…` o `service_role`) | secreto de las funciones, **nunca** en el navegador | **falta** |

La secreta hay que copiarla del panel y guardarla como secreto (paso 1.5). No la pegues en
ningún archivo del repositorio.

### 1.4 Instalar el CLI y enlazar el proyecto

En tu ordenador, dentro de la carpeta del proyecto:

```bash
npm install -g supabase
supabase login
supabase link --project-ref dqdmutauhgowqknwpwcm
```

`supabase init` **no hace falta**: el repositorio ya trae `supabase/config.toml` con tu
`project_id` puesto.

### 1.5 Los secretos de las funciones de servidor

Aquí es donde viven las claves que no pueden pisar el navegador:

```bash
supabase secrets set \
  SUPABASE_SERVICE_KEY="la_clave_secreta_del_paso_1.3" \
  GOOGLE_MAPS_KEY="TU_CLAVE_DE_GOOGLE_MAPS" \
  AI_API_KEY="TU_CLAVE_DE_GEMINI" \
  AI_MODELO_RAPIDO="gemini-2.5-flash-lite" \
  AI_MODELO_ANALISIS="gemini-2.5-flash" \
  APP_URL="https://estook.com"
```

`SUPABASE_URL` y `SUPABASE_ANON_KEY` ya las pone Supabase sola dentro de las funciones.

**Comprobación:** `supabase secrets list` tiene que devolver esos seis nombres.

### 1.6 Publicar las funciones

```bash
supabase functions deploy fogon
supabase functions deploy lugares
```

**Comprobación:** en **Edge Functions** aparecen las dos en verde. Si llamas a `fogon` sin
sesión, tiene que responder 401: eso significa que la puerta está cerrada, que es lo que
queremos.

### 1.7 Copias de seguridad

**Database › Backups**: copia diaria con 30 días de retención. En el plan gratuito hay 7 días;
al pasar a Pro (unos 23 €/mes para toda la plataforma, 0,23 € por local con 100 locales) se
sube a 30. No es urgente hoy, pero sí antes del primer cliente que pague.

---

## 2 · Google Cloud · Maps y Gemini

Proyecto: `Estook app` · número `215527125745`.

### 2.1 Activar las APIs

En **APIs y servicios › Biblioteca**, activar:

- **Places API (New)** — la nueva, no la antigua. La función `lugares` llama a
  `places.googleapis.com/v1`, que solo responde con esta.
- **Generative Language API** — es la que atiende a Gemini.

### 2.2 Restringir la clave de Maps

**Credenciales › la clave › Restricciones de API**: solo *Places API (New)*.
**Restricciones de aplicación**: como la llamamos desde el servidor (Supabase), déjala en
*Ninguna* pero con la restricción de API puesta. Si algún día se llamara desde el navegador,
habría que restringirla por dominio; no es el caso y no debe serlo.

### 2.3 Frenos de gasto

**Facturación › Presupuestos y alertas**: presupuesto mensual de **600 €** con avisos al 50 %
(300 €) y al 75 % (450 €). Son las alertas de Google, además de los topes que ya lleva el
código: 0,10 €/día por local y 20 €/día en toda la empresa, con corte duro.

> **Ojo con esto**, que es lo que más cuesta de todo el sistema: si alguien pusiera el refresco
> de competidores cada seis horas de verdad, serían 44 € al mes **por local**. Por eso el
> refresco real es semanal y el Panel se recalcula sobre lo guardado.

### 2.4 Gemini en vez de Claude

El manifiesto calculaba el coste con Haiku y Sonnet. Con Gemini sale parecido o algo más
barato, así que los planes aguantan igual. El reparto queda:

| Tarea | Modelo |
|---|---|
| Preguntas del día a día, propuestas de menú, redacción de mensajes | `gemini-2.5-flash-lite` |
| Análisis del cierre y resumen semanal | `gemini-2.5-flash` |

Se cambian sin tocar código: son dos secretos. Cada llamada queda registrada en `consumo_ia`
con tokens, coste y milisegundos, que es la cifra que dirá si un plan está bien puesto.

---

## 3 · GitHub · el despliegue

Sí se puede, y no rompe nada. La app es estática y todo lo que necesita servidor ya vive en
las funciones de Supabase, así que **GitHub Pages vale perfectamente** y es gratis.

### 3.1 Subir el repositorio

```bash
cd estook
git init
git add .
git commit -m "Estook · M0 cimientos"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/estook.git
git push -u origin main
```

Comprueba antes de subir que `config/.env.local` **no** aparece en `git status`. Está en
`.gitignore` desde el primer commit, pero míralo igual.

### 3.2 Encender Pages

**Settings › Pages › Source: GitHub Actions**. El repositorio ya trae el flujo de trabajo en
`.github/workflows/desplegar.yml`: cada empujón a `main` compila y publica solo.

### 3.3 Las variables del despliegue

**Settings › Secrets and variables › Actions › pestaña Variables** (son públicas, van dentro
del JavaScript de todas formas):

| Nombre | Valor |
|---|---|
| `VITE_SUPABASE_URL` | `https://dqdmutauhgowqknwpwcm.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `TU_PUBLISHABLE_KEY` |
| `VITE_APP_URL` | La dirección donde quede la app |

**`VITE_BASE` ya no existe.** La app usa rutas relativas y enrutado por almohadilla
(`/#/panel`), así que funciona igual colgando de `usuario.github.io/LO_QUE_SEA/` que en la
raíz de un dominio propio, sin acertar con ninguna variable.

### 3.4 Dominio propio

**Settings › Pages › Custom domain**: `estook.com`, y marcar *Enforce HTTPS*. En tu proveedor
de dominio:

| Tipo | Nombre | Valor |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | TU_USUARIO.github.io |

Con dominio propio no hay que cambiar nada en el proyecto: las rutas ya son relativas.

### 3.5 Lo que Pages no puede hacer

Nada de esto nos afecta hoy, pero conviene saberlo:

- No ejecuta código de servidor. Por eso Fogón, Google, los PDF, el TPV y los webhooks de
  Stripe van en funciones de Supabase. Si algún día una de ellas necesitara algo que Supabase
  no dé, se mueve solo esa pieza.
- No hay redirecciones de servidor. Por eso las rutas van con almohadilla
  (`/#/panel`): así ningún enlace directo da 404. Además se genera un `404.html` de respaldo.

### Si la pantalla sale en blanco

1. Mira **Actions**: si el último despliegue está en rojo, el fallo está ahí.
2. Abre la página en el ordenador, botón derecho › ver código fuente. Los archivos tienen que
   pedirse como `./assets/…`. Si aparece una ruta absoluta que no corresponde, hay una
   variable `VITE_BASE` vieja puesta en el repositorio: bórrala y vuelve a desplegar.
3. En el móvil, cierra la pestaña y vuelve a abrir: el service worker guarda la versión
   anterior. En el ordenador, recarga forzada (Ctrl+F5).
4. Si sigue en blanco, la app ahora enseña el error en pantalla en vez de quedarse muda.

---

## 4 · Lo que todavía no está y qué se pierde mientras tanto

| Falta | Efecto |
|---|---|
| **Stripe** | No se puede cobrar. Todo lo demás funciona. Ver `config/stripe/productos.md` |
| **TPV** | Las ventas entran por CSV, foto del Z o total del día. Hay que cerrar precio con la API unificada antes de vender el plan Pro |
| **Correo** (Resend) | No salen invitaciones, ni horarios en PDF, ni el resumen semanal |
| **Google Business Profile** | Las reseñas propias se quedan con las cinco que da Places en vez del histórico completo |
| **Clave secreta de Supabase** | Las funciones no pueden registrar consumo ni escribir caché: hay que ponerla en el paso 1.5 |

---

## 5 · Comprobación final

Con esto en verde, la base está conectada de verdad:

- [ ] Las cuatro consultas SQL pasan sin error y las tablas salen con RLS.
- [ ] `supabase secrets list` devuelve los seis secretos.
- [ ] `supabase functions deploy` deja `fogon` y `lugares` en verde.
- [ ] `npm run dev` arranca y la pantalla `/cimientos` dice **Servidor conectado**.
- [ ] Apuntas una merma en modo avión, vuelves a tener cobertura y sube sola.
- [ ] En el bundle compilado no aparece ninguna clave de servidor:
      `grep -rE "AIzaSy|AQ\." dist/` no devuelve nada.
- [ ] El push a `main` publica en Pages y la app abre desde el móvil.
