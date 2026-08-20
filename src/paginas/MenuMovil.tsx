import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Euro, LayoutGrid, Sparkles, Smartphone, X } from 'lucide-react'

const ENLACES = [
  { texto: 'Cómo funciona', ancla: '#como-funciona', icono: LayoutGrid },
  { texto: 'Por dentro', ancla: '#por-dentro', icono: Smartphone },
  { texto: 'Fogón', ancla: '#fogon', icono: Sparkles },
  { texto: 'Precios', ancla: '#precios', icono: Euro },
]

/**
 * En el móvil, el menú de la landing se abre igual que la rueda de la app:
 * burbuja naranja con la estrella, fondo desenfocado y los sectores entrando
 * escalonados. Si el sistema pide menos animación, entran de golpe.
 */
export function MenuMovil() {
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    if (!abierto) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false)
    document.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = '' }
  }, [abierto])

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        aria-label="Abrir el menú"
        className="fixed bottom-6 left-1/2 z-40 grid size-16 -translate-x-1/2 place-items-center rounded-full bg-naranja text-white shadow-flotante transition-transform active:scale-95 md:hidden"
      >
        <span className="text-2xl leading-none">✦</span>
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <button
            aria-label="Cerrar"
            onClick={() => setAbierto(false)}
            className="absolute inset-0 animate-aparecer bg-tinta/70 backdrop-blur-sm"
          />

          <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3 pb-28">
            <p className="mb-1 font-titulo text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
              Estook
            </p>

            {ENLACES.map((e, i) => (
              <a
                key={e.ancla}
                href={e.ancla}
                onClick={() => setAbierto(false)}
                style={{ animationDelay: `${i * 45}ms` }}
                className="flex w-[240px] animate-subirCorto items-center gap-3 rounded-xl bg-lienzo px-4 py-3 font-semibold shadow-tarjeta active:bg-panel"
              >
                <e.icono className="size-5 text-naranja" aria-hidden />
                {e.texto}
              </a>
            ))}

            <Link
              to="/entrar?alta=1"
              onClick={() => setAbierto(false)}
              style={{ animationDelay: `${ENLACES.length * 45}ms` }}
              className="flex w-[240px] animate-subirCorto items-center justify-center rounded-xl bg-naranja px-4 py-3 font-semibold text-white"
            >
              Probar 14 días
            </Link>
            <Link
              to="/entrar"
              onClick={() => setAbierto(false)}
              style={{ animationDelay: `${(ENLACES.length + 1) * 45}ms` }}
              className="flex w-[240px] animate-subirCorto items-center justify-center rounded-xl border border-white/25 px-4 py-3 font-semibold text-white"
            >
              Entrar
            </Link>
          </div>

          <button
            onClick={() => setAbierto(false)}
            aria-label="Cerrar el menú"
            className="absolute bottom-6 left-1/2 z-20 grid size-16 -translate-x-1/2 place-items-center rounded-full bg-lienzo text-tinta shadow-flotante"
          >
            <X className="size-6" aria-hidden />
          </button>
        </div>
      )}
    </>
  )
}
