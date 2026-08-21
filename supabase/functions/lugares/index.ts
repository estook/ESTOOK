// ============================================================
// LUGARES · Google Places. La clave vive aquí, nunca en el navegador.
// Sin importaciones locales: se pega tal cual en el editor de Supabase.
//
// Dos relojes distintos, y esto es lo que mantiene el coste a raya:
//  · CADA 8 HORAS se recalcula la posición del local y sus avisos con lo
//    que ya está guardado. No se llama a Google. Cuesta cero.
//  · CADA 7 DÍAS se refrescan de verdad los datos de cada competidor.
//  · Si el usuario abre la ficha de un competidor concreto, se refresca ese
//    y solo ese.
//  · Caché compartida por zona: si tres clientes están en la misma calle,
//    esos locales se piden una vez y sirven para los tres.
// ============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ORIGEN = Deno.env.get('APP_URL') ?? ''
const cabeceras = {
  'Access-Control-Allow-Origin': ORIGEN || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
}
const responder = (d: unknown, e = 200) =>
  new Response(JSON.stringify(d), { status: e, headers: { ...cabeceras, 'Content-Type': 'application/json' } })

const clienteDeServicio = () =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('CLAVE_SERVICIO')!)

async function exigirMiembro(req: Request, localId: string) {
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('sin sesion')
  const { data } = await sb.from('miembros').select('id')
    .eq('local_id', localId).eq('persona_id', user.id).eq('activo', true).maybeSingle()
  if (!data) throw new Error('sin acceso')
  return { sb }
}

const COSTE = { buscar: 32 * 0.92 / 1000, detalle: 40 * 0.92 / 1000 }  // € por llamada
const TOPE_LOCAL = 0.10
const TOPE_EMPRESA = 20
const HORAS_PANEL = 8            // recálculo sobre lo guardado
const DIAS_REFRESCO = 7          // llamada real a Google
const MAX_TEXTO = 120

async function gastoDeHoy(cuentaId: string, localId?: string) {
  const sb = clienteDeServicio()
  const desde = new Date(); desde.setHours(0, 0, 0, 0)
  let q = sb.from('consumo_externo').select('coste_eur')
    .eq('cuenta_id', cuentaId).eq('servicio', 'google_places').gte('creado_en', desde.toISOString())
  if (localId) q = q.eq('local_id', localId)
  const { data } = await q
  return (data ?? []).reduce((s: number, f: { coste_eur: number }) => s + Number(f.coste_eur ?? 0), 0)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cabeceras })
  if (req.method !== 'POST') return responder({ error: 'Método no permitido.' }, 405)

  try {
    const { local_id, accion, texto, place_id, refrescar = false } = await req.json()
    if (typeof local_id !== 'string' || !['buscar', 'detalle', 'panel'].includes(accion)) {
      return responder({ error: 'Petición incorrecta.' }, 400)
    }

    const { sb } = await exigirMiembro(req, local_id)
    const servicio = clienteDeServicio()

    const { data: local } = await sb.from('locales').select('cuenta_id').eq('id', local_id).single()
    if (!local) return responder({ error: 'Local no encontrado.' }, 404)
    const cuentaId = local.cuenta_id as string

    // ---- El Panel: cada 8 horas, sobre lo guardado. Nunca llama a Google. ----
    if (accion === 'panel') {
      const { data: vecinos } = await servicio.from('competidores')
        .select('nombre, distancia_m, tipo_cocina, precio_menu, valoracion, num_resenas, consultado_en')
        .eq('local_id', local_id).order('distancia_m')
      const lista = vecinos ?? []
      const precios = lista.map((v) => Number(v.precio_menu)).filter((n) => n > 0)
      const media = precios.length ? precios.reduce((a, b) => a + b, 0) / precios.length : null
      const masViejo = lista.reduce((t, v) => Math.min(t, new Date(v.consultado_en).getTime()), Date.now())
      return responder({
        vecinos: lista,
        precio_medio_zona: media,
        recalculado_en: new Date().toISOString(),
        proximo_recalculo_horas: HORAS_PANEL,
        datos_de: new Date(masViejo).toISOString(),
        toca_refrescar: Date.now() - masViejo > DIAS_REFRESCO * 86400000,
      })
    }

    // A partir de aquí sí se gasta dinero: los topes van antes que nada.
    if (await gastoDeHoy(cuentaId, local_id) >= TOPE_LOCAL || await gastoDeHoy(cuentaId) >= TOPE_EMPRESA) {
      return responder({ desde_cache: true, aviso: 'Hoy ya no se consulta a Google. Se usa lo guardado.', resultados: [] })
    }

    const clave = Deno.env.get('GOOGLE_MAPS_KEY')
    if (!clave) return responder({ error: 'Google no está conectado todavía.' }, 503)

    // ---- Buscar un local por su nombre (alta y competencia) ----
    if (accion === 'buscar') {
      if (typeof texto !== 'string' || texto.trim().length < 3) {
        return responder({ error: 'Escribe algo más para buscar.' }, 400)
      }
      const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': clave,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.primaryTypeDisplayName,places.regularOpeningHours',
        },
        body: JSON.stringify({ textQuery: texto.slice(0, MAX_TEXTO), languageCode: 'es', regionCode: 'ES', maxResultCount: 8 }),
      })
      const datos = await r.json()
      await servicio.from('consumo_externo').insert({
        cuenta_id: cuentaId, local_id, servicio: 'google_places', llamadas: 1, coste_eur: COSTE.buscar,
      })
      return responder({ resultados: datos.places ?? [] })
    }

    // ---- Ficha de un competidor, con caché de una semana ----
    if (typeof place_id !== 'string' || !/^[A-Za-z0-9_-]{10,200}$/.test(place_id)) {
      return responder({ error: 'Identificador de local no válido.' }, 400)
    }

    // Caché compartida: si otro cliente de la zona ya lo pidió esta semana, se reutiliza.
    const { data: guardado } = await servicio.from('competidores').select('*')
      .eq('google_place_id', place_id).order('consultado_en', { ascending: false }).limit(1).maybeSingle()
    const fresco = guardado && Date.now() - new Date(guardado.consultado_en).getTime() < DIAS_REFRESCO * 86400000
    if (fresco && !refrescar) return responder({ desde_cache: true, ficha: guardado })

    const r = await fetch(`https://places.googleapis.com/v1/places/${place_id}?languageCode=es`, {
      headers: {
        'X-Goog-Api-Key': clave,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,rating,userRatingCount,priceLevel,primaryTypeDisplayName,regularOpeningHours,reviews,websiteUri,nationalPhoneNumber',
      },
    })
    const p = await r.json()
    await servicio.from('consumo_externo').insert({
      cuenta_id: cuentaId, local_id, servicio: 'google_places', llamadas: 1, coste_eur: COSTE.detalle,
    })

    // Solo lo público y agregado, con la fecha de la consulta. Nada personal de terceros.
    const ficha = {
      local_id,
      google_place_id: p.id,
      nombre: p.displayName?.text ?? '',
      tipo_cocina: p.primaryTypeDisplayName?.text ?? null,
      valoracion: p.rating ?? null,
      num_resenas: p.userRatingCount ?? null,
      horarios: p.regularOpeningHours ?? null,
      datos: {
        direccion: p.formattedAddress,
        web: p.websiteUri,
        telefono: p.nationalPhoneNumber,
        nivel_precio: p.priceLevel,
        // Google devuelve como mucho cinco reseñas por local: es lo que hay.
        resenas_destacadas: (p.reviews ?? []).map((x: { rating: number; text?: { text: string }; publishTime: string }) => ({
          nota: x.rating, texto: x.text?.text ?? '', fecha: x.publishTime,
        })),
      },
      consultado_en: new Date().toISOString(),
    }
    await servicio.from('competidores').upsert(ficha, { onConflict: 'local_id,google_place_id' })
    return responder({ desde_cache: false, ficha })
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : ''
    if (mensaje === 'sin sesion' || mensaje === 'sin acceso') return responder({ error: 'Sin acceso.' }, 403)
    console.error('lugares:', mensaje)
    return responder({ error: 'Algo ha fallado. Inténtalo otra vez.' }, 500)
  }
})
