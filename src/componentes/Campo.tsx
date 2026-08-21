import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'

const base =
  'h-11 w-full rounded-md border border-borde bg-lienzo px-3 text-sm text-tinta placeholder:text-tinta-tenue ' +
  'transition-colors focus:border-naranja disabled:bg-panel disabled:text-tinta-tenue'

function Envoltura({
  etiqueta,
  ayuda,
  error,
  obligatorio,
  children,
}: {
  etiqueta: string
  ayuda?: string
  error?: string
  obligatorio?: boolean
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex flex-wrap items-baseline gap-x-1.5 text-xs font-semibold uppercase leading-tight tracking-wide text-tinta-suave">
        <span className="min-w-0">{etiqueta}</span>
        {!obligatorio && (
          <span className="shrink-0 text-[10px] font-normal normal-case tracking-normal text-tinta-tenue">
            opcional
          </span>
        )}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-semibold text-alerta">{error}</span>
      ) : (
        ayuda && <span className="mt-1 block text-xs text-tinta-tenue">{ayuda}</span>
      )}
    </label>
  )
}

export interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string
  ayuda?: string
  error?: string
  obligatorio?: boolean
}

export const Campo = forwardRef<HTMLInputElement, CampoProps>(function Campo(
  { etiqueta, ayuda, error, obligatorio, className = '', ...resto },
  ref,
) {
  return (
    <Envoltura etiqueta={etiqueta} ayuda={ayuda} error={error} obligatorio={obligatorio}>
      <input
        ref={ref}
        aria-invalid={Boolean(error)}
        className={`${base} ${error ? 'border-alerta' : ''} ${className}`}
        {...resto}
      />
    </Envoltura>
  )
})

export interface SelectorProps extends SelectHTMLAttributes<HTMLSelectElement> {
  etiqueta: string
  ayuda?: string
  error?: string
  obligatorio?: boolean
}

export const Selector = forwardRef<HTMLSelectElement, SelectorProps>(function Selector(
  { etiqueta, ayuda, error, obligatorio, className = '', children, ...resto },
  ref,
) {
  return (
    <Envoltura etiqueta={etiqueta} ayuda={ayuda} error={error} obligatorio={obligatorio}>
      <select ref={ref} className={`${base} pr-8 ${className}`} {...resto}>
        {children}
      </select>
    </Envoltura>
  )
})
