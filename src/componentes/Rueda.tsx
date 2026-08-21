import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Boxes, CalendarClock, ChefHat, ClipboardCheck, MessageSquare, Star, Store, X } from 'lucide-react'

export interface AppEstook {
  clave: string
  nombre: string
  dentro: string
  ruta: string
  icono: typeof Boxes
}

export const APPS: AppEstook[] = [
  { clave: 'inventario', nombre: 'Inventario', dentro: 'Productos · Proveedores · Pedidos · Recuentos · Mermas', ruta: '/app/inventario', icono: Boxes },
  { clave: 'cocina', nombre: 'Cocina', dentro: 'Fichas · Elaboraciones · Carta · Menú del día', ruta: '/app/cocina', icono: ChefHat },
  { clave: 'servicio', nombre: 'Servicio', dentro: 'Jornada · Ventas · APPCC · Cierre', ruta: '/app/servicio', icono: ClipboardCheck },
  { clave: 'equipo', nombre: 'Equipo', dentro: 'Personas · Horarios · Fichajes', ruta: '/app/equipo', icono: CalendarClock },
  { clave: 'negocio', nombre: 'Negocio', dentro: 'Resúmenes · Costes · TPV · Auditoría', ruta: '/app/negocio', icono: BarChart3 },
  { clave: 'competencia', nombre: 'Competencia', dentro: 'Quién tienes al lado y a cuánto cobra', ruta: '/app/competencia', icono: Store },
  { clave: 'resenas', nombre: 'Reseñas', dentro: 'Lo que dicen tus clientes, ordenado', ruta: '/app/resenas', icono: Star },
  { clave: 'chat', nombre: 'Chat', dentro: 'El equipo, con constancia de quién lo ha leído', ruta: '/app/chat', icono: MessageSquare },
]

/**
 * La rueda: se pulsa un sector o se mantiene el dedo y se arrastra hacia él.
 * Si el sistema pide menos animación, se convierte en una rejilla de tarjetas
 * con la misma información y sin efectos.
 */
export function Rueda({ abierta, apps, onCerrar }: { abierta: boolean; apps: AppEstook[]; onCerrar: () => void }) {
  const navegar = useNavigate()
  const [enfocada, setEnfocada] = useState<number | null>(null)
  const menosAnimacion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (!abierta) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    document.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = '' }
  }, [abierta, onCerrar])

  if (!abierta) return null

  function entrar(a: AppEstook) {
    onCerrar()
    navegar(a.ruta)
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Apps de Estook">
      <button
        type="button" aria-label="Cerrar"
        onClick={onCerrar}
        className="absolute inset-0 animate-aparecer bg-tinta/70 backdrop-blur-sm"
      />

      <div className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-md px-4 pb-24">
        <p className="mb-3 text-center font-titulo text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
          Apps de Estook
        </p>

        <div className="grid grid-cols-2 gap-2">
          {apps.map((a, i) => (
            <button
              key={a.clave}
              onClick={() => entrar(a)}
              onMouseEnter={() => setEnfocada(i)}
              onFocus={() => setEnfocada(i)}
              style={{ animationDelay: menosAnimacion ? undefined : `${i * 35}ms` }}
              className={[
                'flex items-center gap-3 rounded-xl p-3.5 text-left transition-colors',
                menosAnimacion ? '' : 'animate-subirCorto',
                enfocada === i ? 'bg-naranja text-white' : 'bg-lienzo text-tinta',
              ].join(' ')}
            >
              <a.icono className={`size-5 shrink-0 ${enfocada === i ? 'text-white' : 'text-naranja'}`} aria-hidden />
              <span className="min-w-0">
                <span className="block truncate font-titulo text-sm font-semibold uppercase tracking-wide">
                  {a.nombre}
                </span>
              </span>
            </button>
          ))}
        </div>

        <p className="mt-3 min-h-[2.5rem] text-center text-sm leading-tight text-white/70">
          {enfocada != null ? apps[enfocada].dentro : 'Elige dónde quieres trabajar'}
        </p>

        <button
          onClick={onCerrar}
          aria-label="Cerrar el menú"
          className="mx-auto mt-2 grid size-14 place-items-center rounded-full bg-lienzo text-tinta shadow-flotante"
        >
          <X className="size-6" aria-hidden />
        </button>
      </div>
    </div>
  )
}
