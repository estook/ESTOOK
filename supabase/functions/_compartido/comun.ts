// Utilidades compartidas por las funciones de servidor.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const cabeceras = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_URL') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function responder(datos: unknown, estado = 200) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: { ...cabeceras, 'Content-Type': 'application/json' },
  })
}

/** Cliente con la sesión de quien llama: la RLS sigue mandando dentro de la función. */
export function clienteDeUsuario(req: Request) {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
}

/** Cliente de servicio: solo para escribir consumo y cachés. Nunca para leer datos de un local. */
export function clienteDeServicio() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_KEY')!)
}

/** Comprueba que quien llama pertenece al local. Sin esto, no se hace nada. */
export async function exigirMiembro(req: Request, localId: string) {
  const sb = clienteDeUsuario(req)
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('sin sesion')
  const { data } = await sb.from('miembros').select('id, rol').eq('local_id', localId).eq('persona_id', user.id).eq('activo', true).maybeSingle()
  if (!data) throw new Error('sin acceso a este local')
  return { sb, usuario: user, miembro: data }
}

/** Topes de gasto. Están en el código, no en una hoja de cálculo. */
export const TOPES = {
  ia_dia_local: { prueba: 0.08, base: 0.15, pro: 0.25, grupo: 0.25, a_medida: 0.5 },
  ia_dia_empresa: 35,
  google_dia_local: 0.10,
  google_dia_empresa: 20,
} as const

export async function gastoDeHoy(servicio: 'ia' | 'google', cuentaId: string, localId?: string) {
  const sb = clienteDeServicio()
  const desde = new Date(); desde.setHours(0, 0, 0, 0)
  const tabla = servicio === 'ia' ? 'consumo_ia' : 'consumo_externo'
  let q = sb.from(tabla).select('coste_eur').eq('cuenta_id', cuentaId).gte('creado_en', desde.toISOString())
  if (localId) q = q.eq('local_id', localId)
  const { data } = await q
  const total = (data ?? []).reduce((s: number, f: { coste_eur: number }) => s + Number(f.coste_eur ?? 0), 0)
  return total
}
