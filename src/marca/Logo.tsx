const RUTA = import.meta.env.BASE_URL

/** El isotipo oficial: las barras con la naranja en medio y la flecha. */
export function Isotipo({ className = 'size-8' }: { className?: string }) {
  return (
    <img
      src={`${RUTA}marca/estook-isotipo.png`}
      alt="Estook"
      className={`${className} object-contain`}
      width={336}
      height={415}
    />
  )
}

/** El logotipo completo, con su claim. Es el oficial: no se sustituye por texto. */
export function Logotipo({ conClaim = true, className = '' }: { conClaim?: boolean; className?: string }) {
  return (
    <img
      src={`${RUTA}marca/estook-logo.png`}
      alt="Estook · Tu cocina, bajo control."
      className={`${conClaim ? 'h-12 md:h-14' : 'h-[38px] md:h-11'} w-auto object-contain object-left ${className}`}
    />
  )
}

/**
 * La cara de Fogón. Va siempre sobre su círculo charcoal: el robot es blanco y
 * sobre fondo claro desaparecería. Con `suelto` se pinta sin círculo, para
 * cuando ya está encima de un fondo oscuro.
 */
export function CaraFogon({ className = 'size-8' }: { className?: string; suelto?: boolean }) {
  return (
    <img
      src={`${RUTA}marca/fogon.png`}
      alt="Fogón"
      className={`${className} shrink-0 rounded-lg object-contain`}
    />
  )
}
