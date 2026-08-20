/** Isotipo de Estook: las tres barras y la flecha. La del medio, en naranja. */
export function Isotipo({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Estook">
      <rect x="8" y="8" width="48" height="10" rx="3.5" fill="currentColor" />
      <rect x="8" y="8" width="11" height="24" rx="3.5" fill="currentColor" />
      <rect x="8" y="22" width="48" height="10" rx="3.5" fill="currentColor" />
      <rect x="8" y="36" width="48" height="9" rx="3.5" fill="#FF7A00" />
      <path d="M11.5 49h41a3.5 3.5 0 0 1 3.5 3.5v2A3.5 3.5 0 0 1 52.5 58H38l-6 6-6-6H11.5A3.5 3.5 0 0 1 8 54.5v-2A3.5 3.5 0 0 1 11.5 49Z" fill="currentColor" />
    </svg>
  )
}

export function Logotipo({ conClaim = true }: { conClaim?: boolean }) {
  return (
    <div className="flex items-center gap-3 text-tinta">
      <Isotipo className="size-9" />
      <div className="leading-none">
        <p className="font-titulo text-xl font-semibold uppercase tracking-[0.14em]">Estook</p>
        {conClaim && (
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-naranja">
            Tu cocina, bajo control.
          </p>
        )}
      </div>
    </div>
  )
}
