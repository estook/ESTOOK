import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { exigirSupabase } from '@/datos/supabase'

export interface Producto {
  id: string
  local_id: string
  nombre: string
  categoria: string | null
  unidad_compra: string | null
  unidad_uso: string
  factor: number
  rendimiento: number
  stock_actual: number
  minimo: number | null
  alergenos: string[] | null
  proveedor_id: string | null
  precio_ultimo: number | null
  activo: boolean
}

export interface Proveedor {
  id: string
  local_id: string
  nombre: string
  telefono: string | null
  correo: string | null
  web: string | null
  dias_reparto: string[] | null
  pedido_minimo: number | null
  notas: string | null
  activo: boolean
}

export interface Pedido {
  id: string
  local_id: string
  proveedor_id: string
  estado: 'borrador' | 'enviado' | 'recibido' | 'cancelado'
  numero_albaran: string | null
  incidencia: string | null
  creado_en: string
  enviado_en: string | null
  recibido_en: string | null
}

export interface LineaPedido {
  id: string
  pedido_id: string
  producto_id: string | null
  nombre_libre: string | null
  cantidad_pedida: number
  cantidad_recibida: number | null
  precio: number | null
  falto: boolean
}

/** Coste real por unidad de uso = precio ÷ (factor × rendimiento). No el precio del formato. */
export function costeUnidadUso(p: Pick<Producto, 'precio_ultimo' | 'factor' | 'rendimiento'>) {
  if (p.precio_ultimo == null || !p.factor || !p.rendimiento) return null
  return p.precio_ultimo / (p.factor * p.rendimiento)
}

export function diasDeCobertura(p: Producto, consumoSemanal = 0) {
  if (!consumoSemanal) return null
  return Math.round((p.stock_actual / consumoSemanal) * 7)
}

export const euros = (n: number | null | undefined, decimales = 2) =>
  n == null ? '—' : `${n.toFixed(decimales).replace('.', ',')} €`

export const cantidad = (n: number, unidad: string) =>
  `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(n)} ${unidad}`

// ---------- Productos ----------

export function useProductos(localId?: string) {
  return useQuery({
    queryKey: ['productos', localId],
    enabled: Boolean(localId),
    queryFn: async () => {
      const { data, error } = await exigirSupabase()
        .from('productos').select('*').eq('local_id', localId!).eq('activo', true).order('nombre')
      if (error) throw error
      return (data ?? []) as Producto[]
    },
  })
}

export function useGuardarProducto(localId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: Partial<Producto> & { nombre: string }) => {
      const sb = exigirSupabase()
      const fila = { ...p, local_id: localId }
      const { data, error } = p.id
        ? await sb.from('productos').update(fila).eq('id', p.id).select().single()
        : await sb.from('productos').insert(fila).select().single()
      if (error) throw error
      return data as Producto
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['productos', localId] }),
  })
}

/**
 * La cifra manda, el historial explica: el stock se corrige a mano cuando haga falta
 * y el ajuste queda apuntado con quién y cuándo. Nunca se bloquea a nadie por cuadrar.
 */
export function useAjustarStock(localId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ producto, nuevo, motivo }: { producto: Producto; nuevo: number; motivo: string }) => {
      const sb = exigirSupabase()
      const diferencia = nuevo - producto.stock_actual
      const { error: e1 } = await sb.from('productos').update({ stock_actual: nuevo }).eq('id', producto.id)
      if (e1) throw e1
      const { error: e2 } = await sb.from('movimientos_stock').insert({
        local_id: localId, producto_id: producto.id, tipo: 'ajuste',
        cantidad: diferencia, motivo,
      })
      if (e2) throw e2
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['productos', localId] }),
  })
}

export function useMovimientos(productoId?: string) {
  return useQuery({
    queryKey: ['movimientos', productoId],
    enabled: Boolean(productoId),
    queryFn: async () => {
      const { data, error } = await exigirSupabase()
        .from('movimientos_stock').select('*').eq('producto_id', productoId!)
        .order('creado_en', { ascending: false }).limit(30)
      if (error) throw error
      return data ?? []
    },
  })
}

// ---------- Proveedores ----------

export function useProveedores(localId?: string) {
  return useQuery({
    queryKey: ['proveedores', localId],
    enabled: Boolean(localId),
    queryFn: async () => {
      const { data, error } = await exigirSupabase()
        .from('proveedores').select('*').eq('local_id', localId!).eq('activo', true).order('nombre')
      if (error) throw error
      return (data ?? []) as Proveedor[]
    },
  })
}

export function useGuardarProveedor(localId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: Partial<Proveedor> & { nombre: string }) => {
      const sb = exigirSupabase()
      const fila = { ...p, local_id: localId }
      const { data, error } = p.id
        ? await sb.from('proveedores').update(fila).eq('id', p.id).select().single()
        : await sb.from('proveedores').insert(fila).select().single()
      if (error) throw error
      return data as Proveedor
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proveedores', localId] }),
  })
}

// ---------- Pedidos ----------

export function usePedidos(localId?: string) {
  return useQuery({
    queryKey: ['pedidos', localId],
    enabled: Boolean(localId),
    queryFn: async () => {
      const { data, error } = await exigirSupabase()
        .from('pedidos').select('*, pedido_lineas(*)').eq('local_id', localId!)
        .order('creado_en', { ascending: false })
      if (error) throw error
      return (data ?? []) as (Pedido & { pedido_lineas: LineaPedido[] })[]
    },
  })
}

export function useCrearPedido(localId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ proveedorId, lineas }: { proveedorId: string; lineas: { producto_id: string | null; nombre_libre: string | null; cantidad_pedida: number }[] }) => {
      const sb = exigirSupabase()
      const { data, error } = await sb.from('pedidos')
        .insert({ local_id: localId, proveedor_id: proveedorId, estado: 'borrador' }).select().single()
      if (error) throw error
      if (lineas.length) {
        const { error: e2 } = await sb.from('pedido_lineas')
          .insert(lineas.map((l) => ({ ...l, pedido_id: data.id })))
        if (e2) throw e2
      }
      return data as Pedido
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pedidos', localId] }),
  })
}

export function useMoverPedido(localId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ pedido, estado, albaran }: { pedido: Pedido; estado: Pedido['estado']; albaran?: string }) => {
      const sb = exigirSupabase()
      const parche: Record<string, unknown> = { estado }
      if (estado === 'enviado') parche.enviado_en = new Date().toISOString()
      if (estado === 'recibido') { parche.recibido_en = new Date().toISOString(); if (albaran) parche.numero_albaran = albaran }
      const { error } = await sb.from('pedidos').update(parche).eq('id', pedido.id)
      if (error) throw error

      // Recibido entero: entra todo lo pedido y sube el stock.
      if (estado === 'recibido') {
        const { data: lineas } = await sb.from('pedido_lineas').select('*').eq('pedido_id', pedido.id)
        for (const l of (lineas ?? []) as LineaPedido[]) {
          if (!l.producto_id) continue
          const recibida = l.cantidad_recibida ?? l.cantidad_pedida
          const { data: prod } = await sb.from('productos').select('stock_actual, factor').eq('id', l.producto_id).single()
          if (!prod) continue
          await sb.from('productos')
            .update({ stock_actual: Number(prod.stock_actual) + recibida * Number(prod.factor) })
            .eq('id', l.producto_id)
          await sb.from('movimientos_stock').insert({
            local_id: localId, producto_id: l.producto_id, tipo: 'entrada',
            cantidad: recibida * Number(prod.factor), referencia_tipo: 'pedido', referencia_id: pedido.id,
          })
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pedidos', localId] })
      qc.invalidateQueries({ queryKey: ['productos', localId] })
    },
  })
}
