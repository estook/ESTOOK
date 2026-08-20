import { useCallback, useEffect, useState } from 'react'
import { baseLocal, contarPendientes, limpiarSubidos, sincronizar, type Apunte } from './cola'

/** Estado de la cola para pintarlo en la interfaz: cuántos apuntes esperan y si hay red. */
export function useCola() {
  const [conRed, setConRed] = useState(navigator.onLine)
  const [enCola, setEnCola] = useState(0)
  const [apuntes, setApuntes] = useState<Apunte[]>([])
  const [sincronizando, setSincronizando] = useState(false)

  const refrescar = useCallback(async () => {
    setEnCola(await contarPendientes())
    setApuntes(await baseLocal.apuntes.orderBy('creadoEn').reverse().limit(20).toArray())
  }, [])

  useEffect(() => {
    void refrescar()
    void limpiarSubidos()
    const alCambiar = () => setConRed(navigator.onLine)
    window.addEventListener('online', alCambiar)
    window.addEventListener('offline', alCambiar)
    const reloj = window.setInterval(refrescar, 2000)
    return () => {
      window.removeEventListener('online', alCambiar)
      window.removeEventListener('offline', alCambiar)
      window.clearInterval(reloj)
    }
  }, [refrescar])

  const subirAhora = useCallback(async () => {
    setSincronizando(true)
    try {
      return await sincronizar()
    } finally {
      setSincronizando(false)
      await refrescar()
    }
  }, [refrescar])

  return { conRed, enCola, apuntes, sincronizando, subirAhora, refrescar }
}
