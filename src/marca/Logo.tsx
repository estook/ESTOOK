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

/** La cara de Fogón, el asistente. */
export function CaraFogon({ className = 'size-8' }: { className?: string }) {
  return (
    <img
      src={`${RUTA}marca/fogon.png`}
      alt="Fogón"
      className={`${className} rounded-full object-cover`}
      width={512}
      height={512}
    />
  )
}
