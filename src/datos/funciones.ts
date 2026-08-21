import { exigirSupabase } from '@/datos/supabase'

/**
 * Puente con las funciones de servidor. Todo lo que necesita una clave secreta
 * (Fogón, Google, PDF, TPV, Stripe) pasa por aquí y nunca por el navegador.
 */
async function llamar<T>(funcion: string, cuerpo: Record<string, unknown>): Promise<T> {
  const { data, error } = await exigirSupabase().functions.invoke<T>(funcion, { body: cuerpo })

  /**
   * Cuando la función responde con un código de error, la librería solo dice
   * «non-2xx status code» y esconde el cuerpo. Aquí se abre ese cuerpo para
   * poder enseñar el motivo real, que es lo único que sirve para arreglarlo.
   */
  if (error) {
    const contexto = (error as { context?: Response }).context
    if (contexto && typeof contexto.json === 'function') {
      try {
        const detalle = await contexto.clone().json() as { error?: string; detalle?: string }
        const texto = [detalle?.error, detalle?.detalle].filter(Boolean).join(' · ')
        if (texto) {
          const e = new Error(texto) as Error & { estado?: number }
          e.estado = contexto.status
          throw e
        }
      } catch (e) {
        if (e instanceof Error && e.message && !e.message.includes('JSON')) throw e
      }
      const e = new Error(`El servidor ha respondido ${contexto.status}.`) as Error & { estado?: number }
      e.estado = contexto.status
      throw e
    }
    throw error
  }

  return data as T
}

export interface RespuestaFogon {
  respuesta: string
  modelo?: string
  restantes?: number
  agotado?: boolean
  /** Si algo falla, la función devuelve el motivo aquí en vez de un genérico. */
  error?: string
  detalle?: string
}

/** Una pregunta a Fogón. `pantalla` es dónde está el usuario: da contexto, no limita lo que sabe. */
export function preguntarAFogon(localId: string, pregunta: string, pantalla?: string) {
  return llamar<RespuestaFogon>('fogon', { local_id: localId, pregunta, pantalla, tarea: 'chat' })
}

/** Busca un restaurante por su nombre en Google, para el alta y para la competencia. */
export function buscarLugar(localId: string, texto: string) {
  return llamar<{ resultados: unknown[] }>('lugares', { local_id: localId, accion: 'buscar', texto })
}

/** Ficha de un local. Con caché de una semana salvo que se pida refrescar. */
export function fichaDeLugar(localId: string, placeId: string, refrescar = false) {
  return llamar<{ desde_cache: boolean; ficha: unknown }>('lugares', {
    local_id: localId,
    accion: 'detalle',
    place_id: placeId,
    refrescar,
  })
}
