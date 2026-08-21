import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { exigirSupabase } from '@/datos/supabase'

export interface Local {
  id: string
  cuenta_id: string
  nombre: string
  tipo_local: string | null
  direccion: string | null
  cif: string | null
  telefono: string | null
  logo_url: string | null
  color_secundario: string
  hora_corte: string
}

export function useLocal(localId?: string) {
  return useQuery({
    queryKey: ['local', localId],
    enabled: Boolean(localId),
    queryFn: async () => {
      const { data, error } = await exigirSupabase()
        .from('locales').select('*').eq('id', localId!).single()
      if (error) throw error
      return data as Local
    },
  })
}

export function useGuardarLocal(localId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (cambios: Partial<Local>) => {
      const { error } = await exigirSupabase().from('locales').update(cambios).eq('id', localId!)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['local', localId] }),
  })
}

/**
 * El logo del cliente se guarda como base64 dentro de su ficha: es pequeño,
 * viaja con los documentos y no depende de que un fichero externo siga vivo.
 */
export async function leerLogoComoBase64(archivo: File): Promise<string> {
  if (archivo.size > 400_000) {
    // Se reduce antes de guardarlo: un logo no necesita más de 400 px de alto.
    return reducir(archivo, 400)
  }
  return new Promise((res, rej) => {
    const lector = new FileReader()
    lector.onload = () => res(lector.result as string)
    lector.onerror = rej
    lector.readAsDataURL(archivo)
  })
}

function reducir(archivo: File, altoMaximo: number): Promise<string> {
  return new Promise((res, rej) => {
    const lector = new FileReader()
    lector.onload = () => {
      const img = new Image()
      img.onload = () => {
        const escala = Math.min(1, altoMaximo / img.height)
        const lienzo = document.createElement('canvas')
        lienzo.width = Math.round(img.width * escala)
        lienzo.height = Math.round(img.height * escala)
        lienzo.getContext('2d')?.drawImage(img, 0, 0, lienzo.width, lienzo.height)
        res(lienzo.toDataURL('image/png'))
      }
      img.onerror = rej
      img.src = lector.result as string
    }
    lector.onerror = rej
    lector.readAsDataURL(archivo)
  })
}
