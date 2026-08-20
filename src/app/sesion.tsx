import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { hayConexion, supabase } from '@/datos/supabase'

export interface Acceso {
  local_id: string
  local: string
  rol: string
  plan: string
  cuenta_id: string
}

interface Estado {
  cargando: boolean
  sesion: Session | null
  accesos: Acceso[]
  actual: Acceso | null
  elegirLocal: (localId: string) => void
  salir: () => Promise<void>
}

const Contexto = createContext<Estado | null>(null)

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Session | null>(null)
  const [accesos, setAccesos] = useState<Acceso[]>([])
  const [actual, setActual] = useState<Acceso | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!supabase) { setCargando(false); return }
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session)
      if (!data.session) setCargando(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSesion(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !sesion) { setAccesos([]); setActual(null); return }
    let vivo = true
    ;(async () => {
      const { data } = await supabase!
        .from('miembros')
        .select('local_id, rol, locales(nombre, cuenta_id, cuentas(plan))')
        .eq('persona_id', sesion.user.id)
        .eq('activo', true)
      if (!vivo) return
      const lista: Acceso[] = (data ?? []).map((m) => {
        const l = m.locales as unknown as { nombre: string; cuenta_id: string; cuentas: { plan: string } | null }
        return {
          local_id: m.local_id as string,
          rol: m.rol as string,
          local: l?.nombre ?? 'Mi local',
          cuenta_id: l?.cuenta_id ?? '',
          plan: l?.cuentas?.plan ?? 'prueba',
        }
      })
      setAccesos(lista)
      const guardado = localStorage.getItem('estook.local')
      setActual(lista.find((a) => a.local_id === guardado) ?? lista[0] ?? null)
      setCargando(false)
    })()
    return () => { vivo = false }
  }, [sesion])

  const valor: Estado = {
    cargando,
    sesion,
    accesos,
    actual,
    elegirLocal: (id) => {
      const a = accesos.find((x) => x.local_id === id)
      if (a) { setActual(a); localStorage.setItem('estook.local', id) }
    },
    salir: async () => {
      await supabase?.auth.signOut()
      localStorage.removeItem('estook.local')
      setSesion(null)
    },
  }

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useSesion() {
  const c = useContext(Contexto)
  if (!c) throw new Error('useSesion fuera del proveedor')
  return c
}

export { hayConexion }
