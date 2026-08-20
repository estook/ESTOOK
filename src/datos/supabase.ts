import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Estos dos valores son públicos por diseño: viajan dentro del JavaScript de
 * cualquier app de Supabase y no dan acceso a nada por sí solos — quien manda
 * son las reglas de acceso (RLS) del servidor.
 *
 * Van aquí como valor por defecto a propósito: si un día falta la variable de
 * entorno en el despliegue, la app sigue conectada en vez de quedarse muerta
 * diciendo «servidor no conectado». Las variables VITE_ los sobrescriben.
 */
const URL_POR_DEFECTO = 'https://dqdmutauhgowqknwpwcm.supabase.co'
const CLAVE_POR_DEFECTO = 'sb_publishable_gq6CaUadW8EsuYP8Atbllg_TnaM3a-t'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || URL_POR_DEFECTO
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || CLAVE_POR_DEFECTO

export const hayConexion = Boolean(url && anon)

/** De dónde salió la configuración. Se enseña en el diagnóstico, no en la app normal. */
export const origenConfiguracion =
  import.meta.env.VITE_SUPABASE_URL ? 'variables del despliegue' : 'valores por defecto del código'

export const supabase: SupabaseClient | null = hayConexion
  ? createClient(url, anon, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      global: { headers: { 'x-estook-cliente': 'web' } },
    })
  : null

export function exigirSupabase(): SupabaseClient {
  if (!supabase) throw new Error('Falta la conexión con el servidor.')
  return supabase
}
