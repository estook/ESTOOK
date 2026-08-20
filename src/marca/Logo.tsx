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
      src={`${RUTA}marca/estook-logo${conClaim ? '' : '-compacto'}.png`}
      alt="Estook · Tu cocina, bajo control."
      className={`${conClaim ? 'h-10' : 'h-6'} w-auto object-contain object-left ${className}`}
    />
  )
}

/**
 * La cara de Fogón. Va siempre sobre su círculo charcoal: el robot es blanco y
 * sobre fondo claro desaparecería. Con `suelto` se pinta sin círculo, para
 * cuando ya está encima de un fondo oscuro.
 */
export function CaraFogon({ className = 'size-8', suelto = false }: { className?: string; suelto?: boolean }) {
  const cara = (
    <img
      src={`${RUTA}marca/fogon.png`}
      alt="Fogón"
      className="size-full object-contain"
      width={512}
      height={512}
    />
  )
  if (suelto) return <span className={`${className} inline-block`}>{cara}</span>
  return (
    <span className={`${className} inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-tinta p-[12%]`}>
      {cara}
    </span>
  )
}
