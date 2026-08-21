import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { exigirSupabase } from '@/datos/supabase'

/**
 * Historial de documentos.
 *
 * Cada PDF que se genera deja aquí su ficha con **una copia de los datos que
 * usó**. Por eso el de marzo se puede volver a sacar idéntico en noviembre,
 * aunque los precios hayan cambiado tres veces por medio. Sin esa copia, el
 * mismo botón daría otro documento, que es justo lo que no queremos en algo
 * que puede acabar delante de un inspector o de la gestoría.
 */

export interface DocumentoGuardado {
  id: string
  local_id: string
  tipo: string
  titulo: string
  plantilla: string
  parametros: Record<string, unknown>
  datos: unknown
  color: string | null
  nombre_archivo: string | null
  periodo_desde: string | null
  periodo_hasta: string | null
  huella: string
  valor_legal: boolean
  generado_en: string
}

/** Huella corta y estable de lo que contiene el documento. */
export async function huellaDe(datos: unknown): Promise<string> {
  const texto = JSON.stringify(datos)
  const bytes = new TextEncoder().encode(texto)
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hash)).slice(0, 6)
    .map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()
}

export function useDocumentos(localId?: string, tipo?: string) {
  return useQuery({
    queryKey: ['documentos', localId, tipo ?? 'todos'],
    enabled: Boolean(localId),
    queryFn: async () => {
      let q = exigirSupabase().from('documentos').select('*')
        .eq('local_id', localId!).order('generado_en', { ascending: false }).limit(100)
      if (tipo) q = q.eq('tipo', tipo)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as DocumentoGuardado[]
    },
  })
}

export function useGuardarDocumento(localId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (d: {
      tipo: string
      titulo: string
      plantilla: string
      datos: unknown
      color: string
      archivo: string
      valorLegal?: boolean
      periodo?: { desde?: string; hasta?: string }
    }) => {
      const { error } = await exigirSupabase().from('documentos').insert({
        local_id: localId,
        tipo: d.tipo,
        titulo: d.titulo,
        plantilla: d.plantilla,
        parametros: { color: d.color },
        datos: d.datos as never,
        color: d.color,
        nombre_archivo: d.archivo,
        periodo_desde: d.periodo?.desde ?? null,
        periodo_hasta: d.periodo?.hasta ?? null,
        huella: await huellaDe(d.datos),
        valor_legal: d.valorLegal ?? false,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documentos', localId] }),
  })
}

export const TIPOS_DOCUMENTO: Record<string, string> = {
  inventario_valorado: 'Inventario valorado',
  hoja_recuento: 'Hoja de recuento',
  ficha_tecnica: 'Ficha técnica',
  ficha_cocina: 'Ficha para cocina',
  carta: 'Carta',
  pedido: 'Pedido a proveedor',
  appcc: 'Parte de APPCC',
  resumen_dia: 'Resumen del día',
  horario_semanal: 'Horario semanal',
  horario_individual: 'Horario individual',
}
