import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

/**
 * La ficha: hoja deslizante en móvil (92 % de alto) y panel lateral derecho en ordenador,
 * sin tapar la lista, para poder ir saltando de una ficha a otra.
 */
export function Hoja({
  abierta,
  titulo,
  descripcion,
  pie,
  onCerrar,
  children,
}: {
  abierta: boolean
  titulo: string
  descripcion?: string
  pie?: ReactNode
  onCerrar: () => void
  children: ReactNode
}) {
  useEffect(() => {
    if (!abierta) return
    const alPulsar = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    document.addEventListener('keydown', alPulsar)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', alPulsar)
      document.body.style.overflow = ''
    }
  }, [abierta, onCerrar])

  if (!abierta) return null

  return (
    <div className="fixed inset-0 z-50 flex md:justify-end" role="dialog" aria-modal="true" aria-label={titulo}>
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onCerrar}
        className="absolute inset-0 animate-aparecer bg-tinta/40 backdrop-blur-[2px] md:bg-tinta/20"
      />
      <div
        className={[
          'relative z-10 flex w-full flex-col bg-lienzo shadow-hoja',
          'mt-auto h-[92dvh] animate-entrarAbajo rounded-t-xl',
          'md:mt-0 md:h-full md:w-[440px] md:rounded-none md:border-l md:border-borde md:animate-subirCorto',
        ].join(' ')}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-borde md:hidden" />
        <header className="flex items-start gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-titulo text-base font-semibold">{titulo}</h2>
            {descripcion && <p className="mt-0.5 text-xs text-tinta-tenue">{descripcion}</p>}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="grid size-toque place-items-center rounded-md text-tinta-tenue hover:bg-panel"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>
        {pie && (
          <footer className="flex items-center justify-end gap-2 border-t border-borde px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {pie}
          </footer>
        )}
      </div>
    </div>
  )
}
