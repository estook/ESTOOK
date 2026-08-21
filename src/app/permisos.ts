import { useQuery } from '@tanstack/react-query'
import { exigirSupabase } from '@/datos/supabase'
import { useSesion } from '@/app/sesion'

/**
 * Permisos en la pantalla.
 *
 * Quien manda sigue siendo el servidor: aunque alguien manipule la app, las
 * reglas de acceso rechazan la operación. Esto es para que la interfaz no
 * enseñe botones que luego van a fallar, que es lo que hace que una app
 * parezca rota.
 */

export type Ambito =
  | 'inventario.productos' | 'inventario.precios' | 'inventario.proveedores'
  | 'inventario.pedidos' | 'inventario.recuentos'
  | 'cocina.fichas' | 'cocina.carta'
  | 'servicio.jornada' | 'servicio.ventas' | 'servicio.appcc'
  | 'equipo.personas' | 'equipo.horarios' | 'equipo.fichajes'
  | 'negocio.resumenes' | 'negocio.costes' | 'negocio.tpv' | 'negocio.auditoria'
  | 'ajustes.local'

export type Nivel = 'sin_acceso' | 'ver' | 'editar'

/** Lo que el rol puede hacer mientras el servidor no diga otra cosa. */
const POR_DEFECTO: Record<string, Partial<Record<Ambito, Nivel>>> = {
  gerente: {},   // todo en «editar»
  jefe_cocina: {
    'equipo.personas': 'sin_acceso', 'negocio.tpv': 'sin_acceso', 'ajustes.local': 'sin_acceso',
    'servicio.ventas': 'ver', 'negocio.resumenes': 'ver', 'negocio.auditoria': 'ver',
  },
  jefe_sala: {
    'equipo.personas': 'sin_acceso', 'negocio.tpv': 'sin_acceso', 'ajustes.local': 'sin_acceso',
    'inventario.precios': 'ver', 'cocina.fichas': 'ver', 'negocio.resumenes': 'ver',
    'negocio.costes': 'sin_acceso', 'negocio.auditoria': 'sin_acceso',
  },
  cocinero: {
    'inventario.productos': 'ver', 'inventario.precios': 'sin_acceso',
    'inventario.proveedores': 'sin_acceso', 'inventario.pedidos': 'editar',
    'inventario.recuentos': 'editar', 'cocina.fichas': 'ver', 'cocina.carta': 'sin_acceso',
    'servicio.jornada': 'sin_acceso', 'servicio.ventas': 'sin_acceso', 'servicio.appcc': 'editar',
    'equipo.personas': 'sin_acceso', 'equipo.horarios': 'ver', 'equipo.fichajes': 'editar',
    'negocio.resumenes': 'sin_acceso', 'negocio.costes': 'sin_acceso',
    'negocio.tpv': 'sin_acceso', 'negocio.auditoria': 'sin_acceso', 'ajustes.local': 'sin_acceso',
  },
  sala: {
    'inventario.productos': 'ver', 'inventario.precios': 'sin_acceso',
    'inventario.proveedores': 'sin_acceso', 'inventario.pedidos': 'sin_acceso',
    'inventario.recuentos': 'editar', 'cocina.fichas': 'ver', 'cocina.carta': 'ver',
    'servicio.jornada': 'ver', 'servicio.ventas': 'editar', 'servicio.appcc': 'editar',
    'equipo.personas': 'sin_acceso', 'equipo.horarios': 'ver', 'equipo.fichajes': 'editar',
    'negocio.resumenes': 'sin_acceso', 'negocio.costes': 'sin_acceso',
    'negocio.tpv': 'sin_acceso', 'negocio.auditoria': 'sin_acceso', 'ajustes.local': 'sin_acceso',
  },
  gestoria: {
    'inventario.productos': 'sin_acceso', 'inventario.precios': 'ver',
    'inventario.proveedores': 'sin_acceso', 'inventario.pedidos': 'sin_acceso',
    'inventario.recuentos': 'sin_acceso', 'cocina.fichas': 'sin_acceso', 'cocina.carta': 'sin_acceso',
    'servicio.jornada': 'ver', 'servicio.ventas': 'ver', 'servicio.appcc': 'ver',
    'equipo.personas': 'sin_acceso', 'equipo.horarios': 'sin_acceso', 'equipo.fichajes': 'sin_acceso',
    'negocio.resumenes': 'ver', 'negocio.costes': 'ver', 'negocio.tpv': 'sin_acceso',
    'negocio.auditoria': 'sin_acceso', 'ajustes.local': 'sin_acceso',
  },
}

export function usePermisos() {
  const { actual } = useSesion()
  const rol = actual?.rol ?? 'cocinero'

  const consulta = useQuery({
    queryKey: ['permisos', actual?.local_id],
    enabled: Boolean(actual?.local_id),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await exigirSupabase().rpc('mis_permisos', { p_local: actual!.local_id })
      if (error) throw error
      const mapa: Partial<Record<Ambito, Nivel>> = {}
      for (const f of (data ?? []) as { ambito: Ambito; nivel: Nivel }[]) mapa[f.ambito] = f.nivel
      return mapa
    },
  })

  /** Mientras llega la respuesta del servidor, se usa el valor del rol. */
  function nivel(ambito: Ambito): Nivel {
    const delServidor = consulta.data?.[ambito]
    if (delServidor) return delServidor
    return POR_DEFECTO[rol]?.[ambito] ?? (rol === 'gerente' ? 'editar' : 'ver')
  }

  return {
    cargando: consulta.isLoading,
    nivel,
    puedeVer: (a: Ambito) => nivel(a) !== 'sin_acceso',
    puedeEditar: (a: Ambito) => nivel(a) === 'editar',
    rol,
  }
}
