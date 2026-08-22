import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { hayConexion, supabase } from '@/datos/supabase'

export interface Acceso {
  local_id: string
  local: string
  rol: string
  plan: string
  cuenta_id: string
  /** Lo decide el servidor, no la app: sin esto no se entra. */
  conAcceso: boolean
  estadoPago: string
  pruebaTerminaEn: string | null
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
      /**
       * El estado de la cuenta lo calcula el servidor con una función propia:
       * así la app no puede «decidir» que tiene acceso, solo obedecer.
       *
       * Si esa función todavía no existe en la base (parche sin aplicar), se
       * cae a la consulta de siempre. Nunca se deja a nadie fuera por un
       * parche pendiente: quien decide de verdad son las reglas de acceso.
       */
      const { data: estados, error: fallo } = await supabase!.rpc('mi_estado_de_cuenta')
      if (!vivo) return

      let lista: Acceso[] = []

      if (!fallo && Array.isArray(estados)) {
        lista = (estados as {
          local_id: string; local: string; rol: string; plan: string
          estado_pago: string; prueba_termina_en: string | null; con_acceso: boolean
        }[]).map((e) => ({
          local_id: e.local_id,
          local: e.local ?? 'Mi local',
          rol: e.rol,
          plan: e.plan ?? 'prueba',
          cuenta_id: '',
          conAcceso: Boolean(e.con_acceso),
          estadoPago: e.estado_pago ?? 'al_dia',
          pruebaTerminaEn: e.prueba_termina_en,
        }))
      } else {
        const { data } = await supabase!
          .from('miembros')
          .select('local_id, rol, locales(nombre, cuenta_id, cuentas(plan, estado_pago, prueba_termina_en))')
          .eq('persona_id', sesion.user.id)
          .eq('activo', true)
        if (!vivo) return
        lista = (data ?? []).map((m) => {
          const l = m.locales as unknown as {
            nombre: string; cuenta_id: string
            cuentas: { plan: string; estado_pago: string; prueba_termina_en: string | null } | null
          }
          const c = l?.cuentas
          const enPrueba = c?.plan === 'prueba'
          const pruebaViva = !c?.prueba_termina_en || new Date(c.prueba_termina_en) > new Date()
          return {
            local_id: m.local_id as string,
            rol: m.rol as string,
            local: l?.nombre ?? 'Mi local',
            cuenta_id: l?.cuenta_id ?? '',
            plan: c?.plan ?? 'prueba',
            estadoPago: c?.estado_pago ?? 'al_dia',
            pruebaTerminaEn: c?.prueba_termina_en ?? null,
            conAcceso: (c?.estado_pago ?? 'al_dia') === 'al_dia' && (!enPrueba || pruebaViva),
          }
        })
      }
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
