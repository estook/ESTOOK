import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * La app arranca aunque todavía no haya claves: M0 se construye antes de conectar nada.
 * `hayConexion` es lo que miran las pantallas para saber si pueden hablar con el servidor.
 */
export const hayConexion = Boolean(url && anon)

export const supabase: SupabaseClient | null = hayConexion
  ? createClient(url as string, anon as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      global: { headers: { 'x-estook-cliente': 'web' } },
    })
  : null

/** Uso interno: falla claro en vez de reventar con "null" por dentro. */
export function exigirSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Falta la conexión con el servidor. Rellena VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en /config/.env.local',
    )
  }
  return supabase
}
