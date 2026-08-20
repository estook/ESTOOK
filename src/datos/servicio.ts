import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { exigirSupabase } from '@/datos/supabase'
import { encolar } from '@/offline/cola'

export interface Jornada {
  id: string
  local_id: string
  fecha: string
  abierta_en: string
  cerrada_en: string | null
  origen: 'tpv_api' | 'csv' | 'foto' | 'total_dia' | null
  fiabilidad: 'alta' | 'media' | 'baja' | null
  ventas_total: number | null
  tickets: number | null
}

export interface PuntoAppcc {
  id: string
  plan_id: string
  nombre: string
  tipo: string
  limite_min: number | null
  limite_max: number | null
  frecuencia: string
  accion_correctiva: string | null
  orden: number
}

export interface RegistroAppcc {
  id: string
  punto_id: string
  valor: number | null
  correcto: boolean | null
  accion_correctiva: string | null
  registrado_en: string
  fecha: string
}

export const FIABILIDAD: Record<string, { texto: string; tono: 'ok' | 'aviso' | 'alerta' }> = {
  tpv_api: { texto: 'Fiabilidad alta', tono: 'ok' },
  csv: { texto: 'Fiabilidad alta', tono: 'ok' },
  foto: { texto: 'Fiabilidad media · estimado', tono: 'aviso' },
  total_dia: { texto: 'Fiabilidad baja · estimado', tono: 'alerta' },
}

/** La fecha operativa: lo cobrado hasta las 06:00 cuenta del día anterior. */
export function fechaOperativa(horaCorte = 6, momento = new Date()) {
  const d = new Date(momento)
  if (d.getHours() < horaCorte) d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function useJornadaDeHoy(localId?: string) {
  const fecha = fechaOperativa()
  return useQuery({
    queryKey: ['jornada', localId, fecha],
    enabled: Boolean(localId),
    queryFn: async () => {
      const { data, error } = await exigirSupabase()
        .from('jornadas').select('*').eq('local_id', localId!).eq('fecha', fecha).maybeSingle()
      if (error) throw error
      return (data ?? null) as Jornada | null
    },
  })
}

export function useAbrirJornada(localId?: string) {
  const qc = useQueryClient()
  const fecha = fechaOperativa()
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await exigirSupabase()
        .from('jornadas').insert({ local_id: localId, fecha }).select().single()
      if (error) throw error
      return data as Jornada
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jornada', localId, fecha] }),
  })
}

export function useCerrarJornada(localId?: string) {
  const qc = useQueryClient()
  const fecha = fechaOperativa()
  return useMutation({
    mutationFn: async ({ jornada, total, tickets, origen }: {
      jornada: Jornada; total: number; tickets: number | null; origen: Jornada['origen']
    }) => {
      const fiabilidad = origen === 'tpv_api' || origen === 'csv' ? 'alta' : origen === 'foto' ? 'media' : 'baja'
      const { error } = await exigirSupabase().from('jornadas').update({
        cerrada_en: new Date().toISOString(),
        ventas_total: total, tickets, origen, fiabilidad,
      }).eq('id', jornada.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jornada', localId, fecha] }),
  })
}

export function useUltimasJornadas(localId?: string) {
  return useQuery({
    queryKey: ['jornadas', localId],
    enabled: Boolean(localId),
    queryFn: async () => {
      const { data, error } = await exigirSupabase()
        .from('jornadas').select('*').eq('local_id', localId!)
        .order('fecha', { ascending: false }).limit(14)
      if (error) throw error
      return (data ?? []) as Jornada[]
    },
  })
}

// ---------- APPCC ----------

export function usePlanAppcc(localId?: string) {
  return useQuery({
    queryKey: ['appcc', localId],
    enabled: Boolean(localId),
    queryFn: async () => {
      const sb = exigirSupabase()
      const { data: plan } = await sb.from('appcc_planes')
        .select('id').eq('local_id', localId!).eq('vigente', true).maybeSingle()
      if (!plan) return { planId: null, puntos: [] as PuntoAppcc[] }
      const { data: puntos } = await sb.from('appcc_puntos')
        .select('*').eq('plan_id', plan.id).order('orden')
      return { planId: plan.id as string, puntos: (puntos ?? []) as PuntoAppcc[] }
    },
  })
}

/** Plantilla de partida por tipo de local. Se ajusta después punto a punto. */
export function useCrearPlanAppcc(localId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const sb = exigirSupabase()
      const { data: plan, error } = await sb.from('appcc_planes')
        .insert({ local_id: localId, vigente: true }).select().single()
      if (error) throw error
      const puntos = [
        { nombre: 'Cámara de pescado', tipo: 'temperatura', limite_min: 0, limite_max: 4, frecuencia: 'diaria', accion_correctiva: 'Avisar al responsable y trasladar el género a otra cámara.', orden: 1 },
        { nombre: 'Cámara de carne', tipo: 'temperatura', limite_min: 0, limite_max: 4, frecuencia: 'diaria', accion_correctiva: 'Avisar al responsable y revisar el cierre de la puerta.', orden: 2 },
        { nombre: 'Congelador', tipo: 'temperatura', limite_min: -25, limite_max: -18, frecuencia: 'diaria', accion_correctiva: 'Avisar al responsable. No recongelar género descongelado.', orden: 3 },
        { nombre: 'Aceite de freidora', tipo: 'temperatura', limite_min: null, limite_max: 180, frecuencia: 'diaria', accion_correctiva: 'Cambiar el aceite y anotar el cambio.', orden: 4 },
        { nombre: 'Limpieza de cocina', tipo: 'limpieza', limite_min: null, limite_max: null, frecuencia: 'diaria', accion_correctiva: 'Repetir la limpieza antes del siguiente servicio.', orden: 5 },
        { nombre: 'Recepción de mercancía', tipo: 'recepcion', limite_min: null, limite_max: 4, frecuencia: 'diaria', accion_correctiva: 'Rechazar el género y avisar al proveedor.', orden: 6 },
      ]
      const { error: e2 } = await sb.from('appcc_puntos')
        .insert(puntos.map((p) => ({ ...p, plan_id: plan.id })))
      if (e2) throw e2
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appcc', localId] }),
  })
}

export function useRegistrosDeHoy(localId?: string) {
  const fecha = fechaOperativa()
  return useQuery({
    queryKey: ['appcc-registros', localId, fecha],
    enabled: Boolean(localId),
    queryFn: async () => {
      const { data, error } = await exigirSupabase()
        .from('appcc_registros').select('*').eq('local_id', localId!).eq('fecha', fecha)
      if (error) throw error
      return (data ?? []) as RegistroAppcc[]
    },
  })
}

/**
 * Registrar pasa por la cola: en una cámara sin cobertura el registro se guarda
 * igual en el móvil y sube al salir. Fuera de rango exige acción correctiva.
 */
export function useRegistrarAppcc(localId?: string) {
  const qc = useQueryClient()
  const fecha = fechaOperativa()
  return useMutation({
    mutationFn: async ({ punto, valor, accion }: { punto: PuntoAppcc; valor: number | null; accion?: string }) => {
      const dentro =
        valor == null ||
        ((punto.limite_min == null || valor >= punto.limite_min) &&
         (punto.limite_max == null || valor <= punto.limite_max))
      await encolar('appcc_registros', {
        local_id: localId,
        punto_id: punto.id,
        valor,
        correcto: dentro,
        accion_correctiva: dentro ? null : (accion ?? null),
        registrado_en: new Date().toISOString(),
        fecha,
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appcc-registros', localId, fecha] }),
  })
}

// ---------- Mermas ----------

export function useMermasDeHoy(localId?: string) {
  const fecha = fechaOperativa()
  return useQuery({
    queryKey: ['mermas', localId, fecha],
    enabled: Boolean(localId),
    queryFn: async () => {
      const { data, error } = await exigirSupabase()
        .from('mermas').select('*, productos(nombre, unidad_uso)')
        .eq('local_id', localId!).gte('registrado_en', `${fecha}T00:00:00`)
        .order('registrado_en', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useApuntarMerma(localId?: string) {
  const qc = useQueryClient()
  const fecha = fechaOperativa()
  return useMutation({
    mutationFn: async ({ productoId, nombre, cantidad, motivo }: {
      productoId: string | null; nombre: string; cantidad: number; motivo: string
    }) => {
      await encolar('mermas', {
        local_id: localId, producto_id: productoId, producto: nombre,
        cantidad, motivo, registrado_en: new Date().toISOString(),
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mermas', localId, fecha] }),
  })
}
