import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { exigirSupabase } from '@/datos/supabase'

/** Los objetivos del negocio: lo que pone en verde o en rojo los semáforos. */
export interface Objetivos {
  local_id: string
  materia_prima: number
  personal: number
  margen_por_familia: Record<string, number> | null
}

export function useObjetivos(localId?: string) {
  return useQuery({
    queryKey: ['objetivos', localId],
    enabled: Boolean(localId),
    queryFn: async () => {
      const { data, error } = await exigirSupabase()
        .from('objetivos_local').select('*').eq('local_id', localId!).maybeSingle()
      if (error) throw error
      return (data ?? null) as Objetivos | null
    },
  })
}

export function useGuardarObjetivos(localId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (o: { materia_prima: number; personal: number }) => {
      const { error } = await exigirSupabase()
        .from('objetivos_local').upsert({ local_id: localId, ...o }, { onConflict: 'local_id' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['objetivos', localId] }),
  })
}
