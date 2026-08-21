import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { exigirSupabase } from '@/datos/supabase'

/**
 * Notas del local: lo que no cabe en ningún campo pero no se puede olvidar.
 * Fogón las lee como parte del contexto y también puede escribirlas cuando se
 * le pide («apunta que Gil no reparte los lunes»).
 */
export interface Nota {
  id: string
  local_id: string
  texto: string
  de_fogon: boolean
  creado_en: string
}

export function useNotas(localId?: string) {
  return useQuery({
    queryKey: ['notas', localId],
    enabled: Boolean(localId),
    queryFn: async () => {
      const { data, error } = await exigirSupabase()
        .from('notas').select('*').eq('local_id', localId!)
        .order('creado_en', { ascending: false }).limit(50)
      if (error) throw error
      return (data ?? []) as Nota[]
    },
  })
}

export function useGuardarNota(localId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ texto, deFogon = false }: { texto: string; deFogon?: boolean }) => {
      const { error } = await exigirSupabase()
        .from('notas').insert({ local_id: localId, texto, de_fogon: deFogon })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notas', localId] }),
  })
}

export function useBorrarNota(localId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await exigirSupabase().from('notas').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notas', localId] }),
  })
}
