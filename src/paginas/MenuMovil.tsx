import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CaraFogon } from '@/marca/Logo'
import { Euro, LayoutGrid, Menu, Smartphone, X } from 'lucide-react'

function CaraFogonIcono({ className }: { className?: string }) {
  return <CaraFogon className={className ?? 'size-5'} />
}

const ENLACES = [
  { texto: 'Inicio', ruta: '/', icono: LayoutGrid },
  { texto: 'La aplicación', ruta: '/producto', icono: Smartphone },
  { texto: 'Tu asistente', ruta: '/fogon', icono: CaraFogonIcono },
  { texto: 'Precios', ruta: '/precios', icono: Euro },
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
      {/* Barra inferior fija: no tapa el texto y siempre está a mano */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-borde bg-lienzo/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-2.5">
          <button
            onClick={() => setAbierto(true)}
            aria-label="Abrir el menú"
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-borde bg-lienzo font-semibold text-tinta active:bg-panel"
          >
            <Menu className="size-5" aria-hidden /> Menú
          </button>
          <Link
            to="/entrar?alta=1"
            className="flex h-11 flex-1 items-center justify-center rounded-lg bg-naranja font-semibold text-white active:bg-naranja-oscuro"
          >
            Probar 14 días
          </Link>
        </div>
      </div>

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
              <Link
                key={e.ruta}
                to={e.ruta}
                onClick={() => setAbierto(false)}
                style={{ animationDelay: `${i * 45}ms` }}
                className="flex w-[240px] animate-subirCorto items-center gap-3 rounded-xl bg-lienzo px-4 py-3 font-semibold shadow-tarjeta active:bg-panel"
              >
                <e.icono className="size-5 text-naranja" aria-hidden />
                {e.texto}
              </Link>
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
            className="absolute bottom-5 left-1/2 z-20 grid size-14 -translate-x-1/2 place-items-center rounded-full bg-lienzo text-tinta shadow-flotante"
          >
            <X className="size-6" aria-hidden />
          </button>
        </div>
      )}
    </>
  )
}
