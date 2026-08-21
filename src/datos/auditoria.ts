import { useQuery } from '@tanstack/react-query'
import { exigirSupabase } from '@/datos/supabase'

/**
 * Auditoría. No se escribe desde la app: la escribe la propia base de datos con
 * disparadores, para que no dependa de que un programador se acuerde de anotar.
 * Aquí solo se lee.
 */
export interface RegistroAuditoria {
  id: string
  local_id: string
  persona_id: string | null
  entidad: string
  accion: string
  resumen: string | null
  de_fogon: boolean
  creado_en: string
}

export function useAuditoria(localId?: string, limite = 40) {
  return useQuery({
    queryKey: ['auditoria', localId],
    enabled: Boolean(localId),
    queryFn: async () => {
      const { data, error } = await exigirSupabase()
        .from('auditoria').select('*').eq('local_id', localId!)
        .order('creado_en', { ascending: false }).limit(limite)
      if (error) throw error
      return (data ?? []) as RegistroAuditoria[]
    },
  })
}
