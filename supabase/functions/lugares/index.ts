// ============================================================
// LUGARES · Google Places. La clave vive aquí, nunca en el navegador.
//
// Es lo más caro del sistema, así que:
//  · Caché compartida por zona: los locales de una misma calle se piden una vez.
//  · Refresco real semanal; el Panel se recalcula sobre lo guardado.
//  · Tope de gasto diario por local y de toda la empresa, con corte duro.
// ============================================================
import { cabeceras, clienteDeServicio, exigirMiembro, gastoDeHoy, responder, TOPES } from '../_compartido/comun.ts'

const COSTE = { buscar: 32 * 0.92 / 1000, detalle: 40 * 0.92 / 1000 } // € por llamada
const DIAS_CACHE = 7

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cabeceras })
  try {
    const { local_id, accion, texto, place_id, refrescar = false } = await req.json()
    const { sb } = await exigirMiembro(req, local_id)
    const servicio = clienteDeServicio()

    const { data: local } = await sb.from('locales').select('cuenta_id').eq('id', local_id).single()
    const cuentaId = local!.cuenta_id as string

    const gastoLocal = await gastoDeHoy('google', cuentaId, local_id)
    const gastoEmpresa = await gastoDeHoy('google', cuentaId)
    if (gastoLocal >= TOPES.google_dia_local || gastoEmpresa >= TOPES.google_dia_empresa) {
      return responder({ desde_cache: true, aviso: 'Hoy ya no se consulta a Google. Se usa lo guardado.', resultados: [] })
    }

    const clave = Deno.env.get('GOOGLE_MAPS_KEY')
    if (!clave) return responder({ error: 'Google no está conectado todavía.' }, 503)

    // ---- Buscar un local por su nombre (alta y competencia) ----
    if (accion === 'buscar') {
      const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': clave,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.primaryTypeDisplayName,places.regularOpeningHours',
        },
        body: JSON.stringify({ textQuery: texto, languageCode: 'es', regionCode: 'ES', maxResultCount: 8 }),
      })
      const datos = await r.json()
      await servicio.from('consumo_externo').insert({
        cuenta_id: cuentaId, local_id, servicio: 'google_places', llamadas: 1, coste_eur: COSTE.buscar,
      })
      return responder({ resultados: datos.places ?? [] })
    }

    // ---- Ficha de un local, con caché de una semana ----
    if (accion === 'detalle') {
      const { data: guardado } = await servicio.from('competidores')
        .select('*').eq('google_place_id', place_id).order('consultado_en', { ascending: false }).limit(1).maybeSingle()

      const fresco = guardado &&
        Date.now() - new Date(guardado.consultado_en).getTime() < DIAS_CACHE * 86400000
      if (fresco && !refrescar) return responder({ desde_cache: true, ficha: guardado })

      const r = await fetch(`https://places.googleapis.com/v1/places/${place_id}?languageCode=es`, {
        headers: {
          'X-Goog-Api-Key': clave,
          'X-Goog-FieldMask':
            'id,displayName,formattedAddress,location,rating,userRatingCount,priceLevel,primaryTypeDisplayName,regularOpeningHours,reviews,websiteUri,nationalPhoneNumber',
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
    }

    return responder({ error: 'Acción desconocida.' }, 400)
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : 'error'
    return responder({ error: mensaje }, mensaje.includes('acceso') ? 403 : 500)
  }
})
