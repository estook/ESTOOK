import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { exigirSupabase } from '@/datos/supabase'
import { costeUnidadUso, type Pedido, type Producto } from '@/datos/despensa'
import { GRANDE, aGrande } from '@/datos/unidades'
import { escandallo, type Plato } from '@/datos/cocina'
import type { PuntoAppcc, RegistroAppcc } from '@/datos/servicio'

/**
 * Los avisos de Fogón.
 *
 * Regla del manifiesto: 18 de cada 22 avisos salen de mirar la base de datos,
 * no del modelo. Cuestan cero. Aquí están esos: se calculan con lo que ya
 * sabemos y se guardan para que no se repitan y para poder ver después si el
 * consejo se siguió y qué pasó.
 *
 * Ciclo de una tarjeta: abierta → cerrada (se archiva y no vuelve hasta que el
 * dato cambie) · aplicada (se hizo caso) · «ahora no» (vuelve en siete días).
 */

export type NivelAviso = 'informativa' | 'importante' | 'urgente'
export type EstadoAviso = 'abierto' | 'cerrado' | 'aplicado' | 'ahora_no'

export interface Aviso {
  id: string
  local_id: string
  clave: string
  titulo: string
  cuerpo: string | null
  nivel: NivelAviso
  origen: string
  app: string | null
  accion_texto: string | null
  accion_ruta: string | null
  dirigido_a: string[] | null
  estado: EstadoAviso
  vuelve_en: string | null
  creado_en: string
}

/** Un aviso recién calculado, todavía sin guardar. */
export interface AvisoCalculado {
  clave: string
  titulo: string
  cuerpo: string
  nivel: NivelAviso
  app: string
  accion_texto: string
  accion_ruta: string
  dirigido_a: string[]
}

const MARGEN_OBJETIVO = 70
const numero = (n: number, d = 1) =>
  new Intl.NumberFormat('es-ES', { maximumFractionDigits: d }).format(n)

/**
 * Calcula todo lo que hay que decir hoy. Es una función pura: entra el estado
 * del negocio, salen las tarjetas. Así se puede probar y no depende de la red.
 */
export function calcularAvisos(estado: {
  productos: Producto[]
  platos: Plato[]
  pedidos: Pedido[]
  puntosAppcc: PuntoAppcc[]
  registrosAppcc: RegistroAppcc[]
  jornadaAbierta: boolean
  jornadaCerrada: boolean
}): AvisoCalculado[] {
  const avisos: AvisoCalculado[] = []

  // ---- Inventario ----
  const bajoMinimo = estado.productos.filter((p) => p.minimo != null && p.stock_actual < p.minimo)
  if (bajoMinimo.length) {
    const detalle = bajoMinimo.slice(0, 4).map((p) => {
      const u = p.unidad_uso as 'g' | 'ml' | 'ud'
      return `${p.nombre} (${numero(aGrande(p.stock_actual, u))} ${GRANDE[u]})`
    }).join(', ')
    avisos.push({
      clave: `bajo-minimo:${bajoMinimo.map((p) => p.id).sort().join(',').slice(0, 80)}`,
      titulo: bajoMinimo.length === 1
        ? `Te queda poco ${bajoMinimo[0].nombre.toLowerCase()}`
        : `${bajoMinimo.length} productos por debajo del mínimo`,
      cuerpo: `${detalle}${bajoMinimo.length > 4 ? ` y ${bajoMinimo.length - 4} más` : ''}.`,
      nivel: 'importante', app: 'inventario',
      accion_texto: 'Montar el pedido', accion_ruta: '/app/inventario',
      dirigido_a: ['gerente', 'jefe_cocina', 'jefe_sala'],
    })
  }

  const sinPrecio = estado.productos.filter((p) => p.precio_ultimo == null)
  if (sinPrecio.length) {
    avisos.push({
      clave: `sin-precio:${sinPrecio.length}`,
      titulo: `${sinPrecio.length} producto(s) sin precio`,
      cuerpo: 'Cuentan como cero al calcular el coste de los platos, así que el margen que ves es mejor que el real.',
      nivel: 'informativa', app: 'inventario',
      accion_texto: 'Poner precios', accion_ruta: '/app/inventario',
      dirigido_a: ['gerente', 'jefe_cocina'],
    })
  }

  // ---- Cocina: platos por debajo del objetivo ----
  for (const plato of estado.platos) {
    if (plato.precio_venta == null) continue
    const cuentas = escandallo([], estado.productos, plato)
    if (cuentas.margen == null || cuentas.costeTotal === 0) continue
    if (cuentas.margen < MARGEN_OBJETIVO) {
      avisos.push({
        clave: `margen:${plato.id}:${Math.round(cuentas.margen)}`,
        titulo: `${plato.nombre} se queda en el ${numero(cuentas.margen, 0)} % de margen`,
        cuerpo: `Tu objetivo es el ${MARGEN_OBJETIVO} %. Revisa el escandallo o el precio de venta.`,
        nivel: cuentas.margen < 40 ? 'urgente' : 'importante', app: 'cocina',
        accion_texto: 'Ver la ficha', accion_ruta: '/app/cocina',
        dirigido_a: ['gerente', 'jefe_cocina'],
      })
    }
  }

  const sinPrecioVenta = estado.platos.filter((p) => p.precio_venta == null)
  if (sinPrecioVenta.length) {
    avisos.push({
      clave: `plato-sin-precio:${sinPrecioVenta.length}`,
      titulo: `${sinPrecioVenta.length} plato(s) sin precio de venta`,
      cuerpo: 'Sin precio no se puede saber lo que ganas con ellos.',
      nivel: 'informativa', app: 'cocina',
      accion_texto: 'Abrir cocina', accion_ruta: '/app/cocina',
      dirigido_a: ['gerente', 'jefe_cocina'],
    })
  }

  // ---- Servicio ----
  const pendientes = estado.puntosAppcc.filter(
    (p) => !estado.registrosAppcc.some((r) => r.punto_id === p.id),
  )
  if (pendientes.length) {
    avisos.push({
      clave: `appcc-pendiente:${new Date().toISOString().slice(0, 10)}`,
      titulo: `Faltan ${pendientes.length} controles de APPCC`,
      cuerpo: `${pendientes.slice(0, 3).map((p) => p.nombre).join(', ')}. Sin registrar salen en rojo en la carpeta del inspector.`,
      nivel: 'importante', app: 'servicio',
      accion_texto: 'Registrar ahora', accion_ruta: '/app/servicio',
      dirigido_a: ['gerente', 'jefe_cocina', 'jefe_sala', 'cocinero', 'sala'],
    })
  }

  const fueraDeRango = estado.registrosAppcc.filter((r) => r.correcto === false)
  if (fueraDeRango.length) {
    avisos.push({
      clave: `appcc-fuera:${new Date().toISOString().slice(0, 10)}:${fueraDeRango.length}`,
      titulo: `${fueraDeRango.length} registro(s) fuera de rango hoy`,
      cuerpo: 'Comprueba que la acción correctiva está anotada y que el equipo está avisado.',
      nivel: 'urgente', app: 'servicio',
      accion_texto: 'Ver registros', accion_ruta: '/app/servicio',
      dirigido_a: ['gerente', 'jefe_cocina'],
    })
  }

  if (estado.jornadaAbierta && !estado.jornadaCerrada && new Date().getHours() >= 23) {
    avisos.push({
      clave: `jornada-sin-cerrar:${new Date().toISOString().slice(0, 10)}`,
      titulo: 'La jornada de hoy sigue abierta',
      cuerpo: 'Si ya has terminado, cierra la caja para que cuadren los números del día.',
      nivel: 'importante', app: 'servicio',
      accion_texto: 'Cerrar caja', accion_ruta: '/app/servicio',
      dirigido_a: ['gerente', 'jefe_cocina', 'jefe_sala'],
    })
  }

  // ---- Pedidos ----
  const enviados = estado.pedidos.filter((p) => p.estado === 'enviado')
  const viejos = enviados.filter(
    (p) => p.enviado_en && Date.now() - new Date(p.enviado_en).getTime() > 3 * 86400000,
  )
  if (viejos.length) {
    avisos.push({
      clave: `pedido-sin-recibir:${viejos.map((p) => p.id).join(',').slice(0, 60)}`,
      titulo: `${viejos.length} pedido(s) enviados hace más de tres días`,
      cuerpo: 'Si ya llegaron, recíbelos para que el género entre en el inventario.',
      nivel: 'importante', app: 'inventario',
      accion_texto: 'Ver pedidos', accion_ruta: '/app/inventario',
      dirigido_a: ['gerente', 'jefe_cocina'],
    })
  }

  const borradores = estado.pedidos.filter((p) => p.estado === 'borrador')
  if (borradores.length) {
    avisos.push({
      clave: `pedido-borrador:${borradores.length}`,
      titulo: `Tienes ${borradores.length} pedido(s) sin enviar`,
      cuerpo: 'Están guardados como borrador, esperando a que los mandes.',
      nivel: 'informativa', app: 'inventario',
      accion_texto: 'Enviarlos', accion_ruta: '/app/inventario',
      dirigido_a: ['gerente', 'jefe_cocina'],
    })
  }

  // ---- Dinero parado ----
  const valorCamara = estado.productos.reduce((s, p) => {
    const c = costeUnidadUso(p)
    return s + (c != null ? c * p.stock_actual : 0)
  }, 0)
  if (valorCamara > 3000) {
    avisos.push({
      clave: `camara-cargada:${Math.round(valorCamara / 500)}`,
      titulo: `Tienes ${numero(valorCamara, 0)} € parados en cámara`,
      cuerpo: 'Es dinero que no está trabajando. Mira si hay género que puedas dar salida antes de volver a pedir.',
      nivel: 'informativa', app: 'inventario',
      accion_texto: 'Ver inventario', accion_ruta: '/app/inventario',
      dirigido_a: ['gerente'],
    })
  }

  return avisos
}

// ---------- Base de datos ----------

export function useAvisos(localId?: string, rol?: string) {
  return useQuery({
    queryKey: ['avisos', localId, rol],
    enabled: Boolean(localId),
    queryFn: async () => {
      const { data, error } = await exigirSupabase()
        .from('avisos').select('*').eq('local_id', localId!)
        .eq('estado', 'abierto').order('creado_en', { ascending: false }).limit(20)
      if (error) throw error
      const lista = (data ?? []) as Aviso[]
      const ahora = Date.now()
      return lista.filter((a) =>
        (!a.dirigido_a || !rol || a.dirigido_a.includes(rol)) &&
        (!a.vuelve_en || new Date(a.vuelve_en).getTime() <= ahora),
      )
    },
  })
}

/** Guarda los avisos nuevos y retira los que ya no aplican. */
export function useSincronizarAvisos(localId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (calculados: AvisoCalculado[]) => {
      const sb = exigirSupabase()
      const { data: abiertos } = await sb.from('avisos')
        .select('id, clave, estado').eq('local_id', localId!).in('estado', ['abierto', 'ahora_no'])
      const existentes = new Map((abiertos ?? []).map((a) => [a.clave as string, a as { id: string }]))

      const nuevos = calculados.filter((c) => !existentes.has(c.clave))
      if (nuevos.length) {
        await sb.from('avisos').insert(nuevos.map((c) => ({
          local_id: localId, clave: c.clave, titulo: c.titulo, cuerpo: c.cuerpo,
          nivel: c.nivel, origen: 'consulta', app: c.app,
          accion_texto: c.accion_texto, accion_ruta: c.accion_ruta,
          dirigido_a: c.dirigido_a, estado: 'abierto',
        })))
      }

      // Lo que ya no se cumple deja de molestar
      const vigentes = new Set(calculados.map((c) => c.clave))
      const caducados = (abiertos ?? []).filter((a) => !vigentes.has(a.clave as string))
      if (caducados.length) {
        await sb.from('avisos')
          .update({ estado: 'cerrado', cerrado_en: new Date().toISOString() })
          .in('id', caducados.map((a) => a.id))
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['avisos', localId] }),
  })
}

export function useResponderAviso(localId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, respuesta }: { id: string; respuesta: 'cerrado' | 'aplicado' | 'ahora_no' }) => {
      const parche: Record<string, unknown> = { estado: respuesta }
      if (respuesta === 'ahora_no') {
        const vuelve = new Date(); vuelve.setDate(vuelve.getDate() + 7)
        parche.estado = 'abierto'
        parche.vuelve_en = vuelve.toISOString()
      } else {
        parche.cerrado_en = new Date().toISOString()
      }
      const { error } = await exigirSupabase().from('avisos').update(parche).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['avisos', localId] }),
  })
}

/** Lo que se ha dicho antes y qué se hizo con ello. */
export function useHistorialAvisos(localId?: string) {
  return useQuery({
    queryKey: ['avisos-historial', localId],
    enabled: Boolean(localId),
    queryFn: async () => {
      const { data, error } = await exigirSupabase()
        .from('avisos').select('*').eq('local_id', localId!)
        .neq('estado', 'abierto').order('cerrado_en', { ascending: false }).limit(50)
      if (error) throw error
      return (data ?? []) as Aviso[]
    },
  })
}
