import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

type Tono = 'principal' | 'secundario' | 'discreto' | 'peligro'
type Tamano = 'normal' | 'grande' | 'pequeno'

const tonos: Record<Tono, string> = {
  principal: 'bg-naranja text-white hover:bg-naranja-oscuro active:bg-naranja-oscuro',
  secundario: 'bg-tinta text-white hover:bg-tinta-suave active:bg-tinta-suave',
  discreto: 'bg-lienzo text-tinta border border-borde hover:bg-panel active:bg-panel',
  peligro: 'bg-alerta text-white hover:brightness-95',
}

const tamanos: Record<Tamano, string> = {
  pequeno: 'h-9 px-3 text-sm gap-1.5',
  normal: 'h-11 px-4 text-sm gap-2',
  grande: 'h-[52px] px-5 text-base gap-2',
}

export interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tono?: Tono
  tamano?: Tamano
  cargando?: boolean
  ancho?: boolean
}

export const Boton = forwardRef<HTMLButtonElement, BotonProps>(function Boton(
  { tono = 'principal', tamano = 'normal', cargando, ancho, className = '', children, disabled, ...resto },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || cargando}
      className={[
        'inline-flex items-center justify-center rounded-md font-texto font-semibold',
        'transition-colors duration-150 ease-estook select-none',
        'disabled:opacity-45 disabled:cursor-not-allowed',
        tonos[tono],
        tamanos[tamano],
        ancho ? 'w-full' : '',
        className,
      ].join(' ')}
      {...resto}
    >
      {cargando && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
})
