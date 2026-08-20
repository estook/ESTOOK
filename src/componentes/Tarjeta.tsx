import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

export function Tarjeta({
  titulo,
  resumen,
  acciones,
  plegable = false,
  plegadaPorDefecto = false,
  children,
  className = '',
}: {
  titulo?: string
  resumen?: ReactNode
  acciones?: ReactNode
  plegable?: boolean
  plegadaPorDefecto?: boolean
  children: ReactNode
  className?: string
}) {
  const [plegada, setPlegada] = useState(plegadaPorDefecto)
  const abierta = !plegable || !plegada

  return (
    <section className={`min-w-0 rounded-lg border border-borde bg-lienzo shadow-tarjeta ${className}`}>
      {(titulo || acciones) && (
        <header className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
          {plegable ? (
            <button
              type="button"
              onClick={() => setPlegada((v) => !v)}
              aria-expanded={abierta}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              <ChevronDown
                className={`size-4 shrink-0 text-tinta-tenue transition-transform duration-200 ${abierta ? '' : '-rotate-90'}`}
                aria-hidden
              />
              <span className="min-w-0">
                <span className="block font-titulo text-sm font-semibold uppercase tracking-wide">{titulo}</span>
                {!abierta && resumen && <span className="block truncate text-xs text-tinta-tenue">{resumen}</span>}
              </span>
            </button>
          ) : (
            <h2 className="min-w-0 flex-1 truncate font-titulo text-sm font-semibold uppercase tracking-wide">
              {titulo}
            </h2>
          )}
          {acciones && <div className="flex shrink-0 items-center gap-1">{acciones}</div>}
        </header>
      )}
      {abierta && <div className="px-4 pb-4 pt-0">{children}</div>}
    </section>
  )
}

export function Cifra({
  etiqueta,
  valor,
  comparacion,
  origen,
  tendencia,
}: {
  etiqueta: string
  valor: string
  comparacion?: string
  origen?: string
  tendencia?: 'sube' | 'baja' | 'igual'
}) {
  const color = tendencia === 'sube' ? 'text-ok' : tendencia === 'baja' ? 'text-alerta' : 'text-tinta-tenue'
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-borde bg-lienzo p-4 shadow-tarjeta">
      <p className="text-xs font-semibold uppercase leading-tight tracking-wide text-tinta-tenue">{etiqueta}</p>
      <p className="cifras mt-1 whitespace-nowrap font-titulo font-semibold leading-none tracking-tight text-[clamp(1.5rem,7vw,2.25rem)]">
        {valor}
      </p>
      {comparacion && <p className={`cifras mt-1 text-xs font-semibold ${color}`}>{comparacion}</p>}
      {origen && <p className="mt-1 text-[11px] leading-tight text-tinta-tenue">{origen}</p>}
    </div>
  )
}
