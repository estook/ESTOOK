import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Boxes, CalendarClock, ChefHat, ClipboardCheck, MessageSquare, Star, Store } from 'lucide-react'

export interface AppEstook {
  clave: string
  nombre: string
  dentro: string
  ruta: string
  icono: typeof Boxes
}

export const APPS: AppEstook[] = [
  { clave: 'despensa', nombre: 'Despensa', dentro: 'Productos · Proveedores · Pedidos · Inventario · Mermas', ruta: '/app/despensa', icono: Boxes },
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

  const radio = 120
  const centro = 160

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Apps de Estook">
      <button
        type="button" aria-label="Cerrar"
        onClick={onCerrar}
        className="absolute inset-0 animate-aparecer bg-tinta/60 backdrop-blur-sm"
      />

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center pb-24">
        <p className="mb-4 font-titulo text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
          Apps de Estook
        </p>

        {menosAnimacion ? (
          <div className="grid w-full max-w-md grid-cols-2 gap-2 px-4">
            {apps.map((a) => (
              <button key={a.clave} onClick={() => entrar(a)}
                className="flex items-center gap-2 rounded-lg bg-lienzo p-3 text-left">
                <a.icono className="size-5 text-naranja" aria-hidden />
                <span className="font-semibold">{a.nombre}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="relative" style={{ width: centro * 2, height: centro * 2 }}>
            {apps.map((a, i) => {
              const angulo = (i / apps.length) * Math.PI * 2 - Math.PI / 2
              const x = centro + Math.cos(angulo) * radio - 36
              const y = centro + Math.sin(angulo) * radio - 36
              const activa = enfocada === i
              return (
                <button
                  key={a.clave}
                  onClick={() => entrar(a)}
                  onMouseEnter={() => setEnfocada(i)}
                  onFocus={() => setEnfocada(i)}
                  onTouchStart={() => setEnfocada(i)}
                  style={{ left: x, top: y, animationDelay: `${i * 30}ms` }}
                  className={[
                    'absolute grid size-[72px] animate-subirCorto place-items-center rounded-xl',
                    'transition-transform duration-150 ease-estook',
                    activa ? 'scale-[1.08] bg-naranja text-white' : 'bg-lienzo text-tinta',
                  ].join(' ')}
                >
                  <a.icono className="size-6" aria-hidden />
                  <span className="mt-1 text-[10px] font-bold uppercase tracking-wide">{a.nombre}</span>
                </button>
              )
            })}
            <div className="pointer-events-none absolute inset-0 grid place-items-center px-16 text-center">
              <div>
                <p className="font-titulo text-sm font-semibold uppercase tracking-wide text-white">
                  {enfocada != null ? apps[enfocada].nombre : 'Elige'}
                </p>
                <p className="mt-1 text-[11px] leading-tight text-white/60">
                  {enfocada != null ? apps[enfocada].dentro : 'Pulsa una app'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
