import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { exigirSupabase } from '@/datos/supabase'
import { costeUnidadUso, type Producto } from '@/datos/despensa'

export interface Plato {
  id: string
  local_id: string
  nombre: string
  descripcion: string | null
  foto_url: string | null
  precio_venta: number | null
  iva: number
  familia: string | null
  version: number
  dificultad: string | null
  mise_en_place: string | null
  conservacion: string | null
  truco: string | null
  pasos: Paso[] | null
  alergenos: string[] | null
  agotado: boolean
  activo: boolean
}

export interface Paso {
  orden: number
  texto: string
  minutos?: number
  temperatura?: number
  utensilio?: string
}

export interface Ingrediente {
  id: string
  plato_id: string
  producto_id: string | null
  elaboracion_id: string | null
  cantidad: number
}

export interface Seccion {
  id: string
  local_id: string
  nombre: string
  orden: number
}

export interface PlatoDeCarta {
  id: string
  seccion_id: string
  plato_id: string | null
  nombre: string | null
  precio: number | null
  descripcion: string | null
  orden: number
  categoria: 'estrella' | 'caballo' | 'puzzle' | 'perro' | 'sin_datos'
}

/** Escandallo: siempre por unidad de venta y sobre base sin IVA. */
export function escandallo(
  ingredientes: Ingrediente[],
  productos: Producto[],
  plato: Pick<Plato, 'precio_venta' | 'iva'>,
) {
  const lineas = ingredientes.map((i) => {
    const p = productos.find((x) => x.id === i.producto_id)
    const coste = p ? costeUnidadUso(p) : null
    return {
      ingrediente: i,
      producto: p,
      costeLinea: coste != null ? coste * i.cantidad : null,
      sinPrecio: Boolean(p) && coste == null,
    }
  })
  const costeTotal = lineas.reduce((s, l) => s + (l.costeLinea ?? 0), 0)
  const base = plato.precio_venta != null ? plato.precio_venta / (1 + (plato.iva ?? 10) / 100) : null
  const margen = base && base > 0 ? ((base - costeTotal) / base) * 100 : null
  const hayIncompletos = lineas.some((l) => l.sinPrecio)
  return { lineas, costeTotal, base, margen, hayIncompletos }
}

/** Precio de venta con IVA que hace falta para llegar a un margen objetivo. */
export function precioRecomendado(costeTotal: number, margenObjetivo: number, iva = 10) {
  if (margenObjetivo >= 100) return null
  const base = costeTotal / (1 - margenObjetivo / 100)
  return base * (1 + iva / 100)
}

/** Menú de ingeniería: se vende mucho o poco, deja mucho o poco. */
export function clasificar(margen: number | null, ventas: number, margenMedio: number, ventasMedias: number) {
  if (margen == null) return 'sin_datos' as const
  const dejaMucho = margen >= margenMedio
  const vendeMucho = ventas >= ventasMedias
  if (vendeMucho && dejaMucho) return 'estrella' as const
  if (vendeMucho && !dejaMucho) return 'caballo' as const
  if (!vendeMucho && dejaMucho) return 'puzzle' as const
  return 'perro' as const
}

export const ETIQUETA_CATEGORIA = {
  estrella: { texto: 'Estrella', consejo: 'Mantenlo y dale sitio en la carta.', tono: 'ok' },
  caballo: { texto: 'Caballo', consejo: 'Se vende mucho y deja poco: baja coste o sube precio con cuidado.', tono: 'aviso' },
  puzzle: { texto: 'Puzzle', consejo: 'Deja mucho y se vende poco: sugiérelo y muévelo de sitio.', tono: 'naranja' },
  perro: { texto: 'Perro', consejo: 'Ni se vende ni deja. Fuera de la carta.', tono: 'alerta' },
  sin_datos: { texto: 'Sin datos', consejo: 'Le falta precio o escandallo.', tono: 'neutro' },
} as const

// ---------- Platos ----------

export function usePlatos(localId?: string) {
  return useQuery({
    queryKey: ['platos', localId],
    enabled: Boolean(localId),
    queryFn: async () => {
      const { data, error } = await exigirSupabase()
        .from('platos').select('*').eq('local_id', localId!).eq('activo', true).order('nombre')
      if (error) throw error
      return (data ?? []) as Plato[]
    },
  })
}

export function useIngredientes(platoId?: string) {
  return useQuery({
    queryKey: ['ingredientes', platoId],
    enabled: Boolean(platoId),
    queryFn: async () => {
      const { data, error } = await exigirSupabase()
        .from('plato_ingredientes').select('*').eq('plato_id', platoId!)
      if (error) throw error
      return (data ?? []) as Ingrediente[]
    },
  })
}

export function useGuardarPlato(localId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: Partial<Plato> & { nombre: string }) => {
      const sb = exigirSupabase()
      const fila = { ...p, local_id: localId }
      const { data, error } = p.id
        ? await sb.from('platos').update(fila).eq('id', p.id).select().single()
        : await sb.from('platos').insert(fila).select().single()
      if (error) throw error
      return data as Plato
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platos', localId] }),
  })
}

export function useGuardarIngrediente(platoId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ productoId, cantidad, id }: { productoId: string; cantidad: number; id?: string }) => {
      const sb = exigirSupabase()
      const { error } = id
        ? await sb.from('plato_ingredientes').update({ producto_id: productoId, cantidad }).eq('id', id)
        : await sb.from('plato_ingredientes').insert({ plato_id: platoId, producto_id: productoId, cantidad })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredientes', platoId] }),
  })
}

export function useBorrarIngrediente(platoId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await exigirSupabase().from('plato_ingredientes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredientes', platoId] }),
  })
}

// ---------- Carta ----------

export function useCarta(localId?: string) {
  return useQuery({
    queryKey: ['carta', localId],
    enabled: Boolean(localId),
    queryFn: async () => {
      const sb = exigirSupabase()
      const { data: secciones, error } = await sb
        .from('carta_secciones').select('*, carta_platos(*)').eq('local_id', localId!).order('orden')
      if (error) throw error
      return (secciones ?? []) as (Seccion & { carta_platos: PlatoDeCarta[] })[]
    },
  })
}

export function useGuardarSeccion(localId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ nombre, orden }: { nombre: string; orden: number }) => {
      const { error } = await exigirSupabase()
        .from('carta_secciones').insert({ local_id: localId, nombre, orden })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['carta', localId] }),
  })
}

export function useGuardarPlatoDeCarta(localId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: Partial<PlatoDeCarta> & { seccion_id: string }) => {
      const sb = exigirSupabase()
      const { error } = p.id
        ? await sb.from('carta_platos').update(p).eq('id', p.id)
        : await sb.from('carta_platos').insert(p)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['carta', localId] }),
  })
}
