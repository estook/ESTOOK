import Dexie, { type Table } from 'dexie'
import { supabase } from '@/datos/supabase'

export type EstadoApunte = 'pendiente' | 'subiendo' | 'subido' | 'fallido'

/**
 * Un apunte es algo que el usuario ha hecho y que tiene que acabar en el servidor:
 * un fichaje, una merma, un registro de APPCC, un ajuste de stock.
 * Se guarda siempre en el móvil primero. Si hay red, sube al momento; si no, espera.
 */
export interface Apunte {
  id?: number
  clave: string // idempotencia: el servidor rechaza el mismo apunte dos veces
  tabla: string
  operacion: 'insertar' | 'actualizar'
  datos: Record<string, unknown>
  creadoEn: string
  estado: EstadoApunte
  intentos: number
  error?: string
}

class BaseLocal extends Dexie {
  apuntes!: Table<Apunte, number>

  constructor() {
    super('estook')
    this.version(1).stores({
      apuntes: '++id, clave, estado, creadoEn',
    })
  }
}

export const baseLocal = new BaseLocal()

function nuevaClave() {
  return crypto.randomUUID()
}

/** Guarda el apunte en el móvil. Devuelve enseguida: el usuario no espera a la red. */
export async function encolar(
  tabla: string,
  datos: Record<string, unknown>,
  operacion: Apunte['operacion'] = 'insertar',
): Promise<Apunte> {
  const apunte: Apunte = {
    clave: nuevaClave(),
    tabla,
    operacion,
    datos,
    creadoEn: new Date().toISOString(),
    estado: 'pendiente',
    intentos: 0,
  }
  const id = await baseLocal.apuntes.add(apunte)
  void sincronizar()
  return { ...apunte, id }
}

export async function pendientes() {
  return baseLocal.apuntes.where('estado').anyOf('pendiente', 'fallido').sortBy('creadoEn')
}

export async function contarPendientes() {
  return baseLocal.apuntes.where('estado').anyOf('pendiente', 'fallido').count()
}

let sincronizando = false

/** Sube lo que haya pendiente, de uno en uno y en orden. Sin red, no hace nada y no molesta. */
export async function sincronizar(): Promise<{ subidos: number; pendientes: number }> {
  if (sincronizando || !navigator.onLine || !supabase) {
    return { subidos: 0, pendientes: await contarPendientes() }
  }
  sincronizando = true
  let subidos = 0
  try {
    for (const apunte of await pendientes()) {
      if (!apunte.id) continue
      await baseLocal.apuntes.update(apunte.id, { estado: 'subiendo' })
      const fila = { ...apunte.datos, clave_apunte: apunte.clave }
      const consulta =
        apunte.operacion === 'insertar'
          ? supabase.from(apunte.tabla).upsert(fila, { onConflict: 'clave_apunte' })
          : supabase.from(apunte.tabla).update(fila).eq('id', apunte.datos.id as string)
      const { error } = await consulta
      if (error) {
        await baseLocal.apuntes.update(apunte.id, {
          estado: 'fallido',
          intentos: apunte.intentos + 1,
          error: error.message,
        })
      } else {
        await baseLocal.apuntes.update(apunte.id, { estado: 'subido', error: undefined })
        subidos++
      }
    }
  } finally {
    sincronizando = false
  }
  return { subidos, pendientes: await contarPendientes() }
}

/** Limpia lo ya subido para que la base local no crezca sin control. */
export async function limpiarSubidos(diasAGuardar = 3) {
  const corte = new Date(Date.now() - diasAGuardar * 86400000).toISOString()
  await baseLocal.apuntes.where('estado').equals('subido').and((a) => a.creadoEn < corte).delete()
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => void sincronizar())
  window.addEventListener('focus', () => void sincronizar())
}
