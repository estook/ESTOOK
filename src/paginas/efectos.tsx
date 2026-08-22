import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Efectos de scroll de la landing, sin librerías: todo con el observador de
 * intersección y transformaciones CSS. Si el sistema pide menos animación, se
 * apaga entero y el contenido aparece de golpe.
 */

const menosAnimacion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Aparece desde abajo al entrar en pantalla. */
export function Aparece({
  children, retraso = 0, className = '', desde = 'abajo',
}: {
  children: ReactNode
  retraso?: number
  className?: string
  desde?: 'abajo' | 'izquierda' | 'derecha' | 'escala'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const nodo = ref.current
    if (!nodo) return
    if (menosAnimacion()) { setVisible(true); return }
    const ob = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); ob.disconnect() } },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
    )
    ob.observe(nodo)
    return () => ob.disconnect()
  }, [])

  const oculto = {
    abajo: 'translate-y-8',
    izquierda: '-translate-x-8',
    derecha: 'translate-x-8',
    escala: 'scale-95',
  }[desde]

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${retraso}ms` }}
      className={`transition-all duration-700 ease-estook ${
        visible ? 'translate-x-0 translate-y-0 scale-100 opacity-100' : `${oculto} opacity-0`
      } ${className}`}
    >
      {children}
    </div>
  )
}

/** Movimiento suave con el scroll, para dar profundidad sin marear. */
export function useParalaje(fuerza = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const nodo = ref.current
    if (!nodo || menosAnimacion()) return
    let animando = false
    const mover = () => {
      if (animando) return
      animando = true
      requestAnimationFrame(() => {
        const caja = nodo.getBoundingClientRect()
        const centro = caja.top + caja.height / 2 - window.innerHeight / 2
        nodo.style.transform = `translate3d(0, ${-centro * fuerza}px, 0)`
        animando = false
      })
    }
    mover()
    window.addEventListener('scroll', mover, { passive: true })
    window.addEventListener('resize', mover)
    return () => {
      window.removeEventListener('scroll', mover)
      window.removeEventListener('resize', mover)
    }
  }, [fuerza])
  return ref
}

/** Un número que sube hasta su valor cuando se ve. */
export function Contador({
  hasta, sufijo = '', decimales = 0, duracion = 1200,
}: {
  hasta: number; sufijo?: string; decimales?: number; duracion?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [valor, setValor] = useState(0)

  useEffect(() => {
    const nodo = ref.current
    if (!nodo) return
    if (menosAnimacion()) { setValor(hasta); return }
    const ob = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      ob.disconnect()
      const inicio = performance.now()
      const paso = (ahora: number) => {
        const t = Math.min(1, (ahora - inicio) / duracion)
        // Frena al final, como un cuentakilómetros
        setValor(hasta * (1 - Math.pow(1 - t, 3)))
        if (t < 1) requestAnimationFrame(paso)
      }
      requestAnimationFrame(paso)
    }, { threshold: 0.5 })
    ob.observe(nodo)
    return () => ob.disconnect()
  }, [hasta, duracion])

  return (
    <span ref={ref} className="cifras">
      {new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: decimales, maximumFractionDigits: decimales,
      }).format(valor)}
      {sufijo}
    </span>
  )
}

/** Barra de progreso de lectura, arriba del todo. */
export function ProgresoDeLectura() {
  const [ancho, setAncho] = useState(0)
  useEffect(() => {
    const mover = () => {
      const alto = document.documentElement.scrollHeight - window.innerHeight
      setAncho(alto > 0 ? (window.scrollY / alto) * 100 : 0)
    }
    mover()
    window.addEventListener('scroll', mover, { passive: true })
    return () => window.removeEventListener('scroll', mover)
  }, [])
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent">
      <div className="h-full bg-naranja transition-[width] duration-150" style={{ width: `${ancho}%` }} />
    </div>
  )
}

/** Texto que se ilumina palabra a palabra mientras se lee. */
export function TextoQueSeEnciende({ texto, className = '' }: { texto: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [avance, setAvance] = useState(0)

  useEffect(() => {
    const nodo = ref.current
    if (!nodo) return
    if (menosAnimacion()) { setAvance(1); return }
    const mover = () => {
      const caja = nodo.getBoundingClientRect()
      const total = caja.height + window.innerHeight * 0.5
      const recorrido = window.innerHeight * 0.85 - caja.top
      setAvance(Math.max(0, Math.min(1, recorrido / total)))
    }
    mover()
    window.addEventListener('scroll', mover, { passive: true })
    return () => window.removeEventListener('scroll', mover)
  }, [])

  const palabras = texto.split(' ')
  const encendidas = Math.round(palabras.length * avance * 1.15)

  return (
    <p ref={ref} className={className}>
      {palabras.map((p, i) => (
        <span key={i} className={`transition-colors duration-300 ${i < encendidas ? 'text-tinta' : 'text-tinta-tenue/40'}`}>
          {p}{' '}
        </span>
      ))}
    </p>
  )
}

/**
 * Cinta que se desplaza sola. Se puede parar con el dedo o el ratón, y
 * arrastrar para moverla más rápido. Si el sistema pide menos animación, se
 * queda quieta y se desplaza a mano.
 */
export function Cinta({
  elementos, velocidad = 40,
}: {
  elementos: string[]
  /** Segundos que tarda en dar una vuelta completa. */
  velocidad?: number
}) {
  const [parada, setParada] = useState(false)
  const pista = useRef<HTMLDivElement>(null)
  const arrastre = useRef<{ activo: boolean; x: number; inicio: number }>({ activo: false, x: 0, inicio: 0 })

  const quieta = menosAnimacion()

  return (
    <div
      className="group relative overflow-hidden"
      onMouseEnter={() => setParada(true)}
      onMouseLeave={() => setParada(false)}
      onTouchStart={() => setParada(true)}
      onTouchEnd={() => window.setTimeout(() => setParada(false), 1500)}
    >
      <div
        ref={pista}
        className={`flex w-max gap-8 ${quieta ? 'overflow-x-auto' : ''}`}
        style={quieta ? undefined : {
          animation: `cinta ${velocidad}s linear infinite`,
          animationPlayState: parada ? 'paused' : 'running',
        }}
        onPointerDown={(e) => {
          arrastre.current = { activo: true, x: e.clientX, inicio: pista.current?.scrollLeft ?? 0 }
          setParada(true)
        }}
        onPointerUp={() => { arrastre.current.activo = false }}
      >
        {[...elementos, ...elementos].map((t, i) => (
          <span key={`${t}-${i}`} className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
            {t}
          </span>
        ))}
      </div>

      {/* Difuminado en los bordes para que no se corte de golpe */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-tinta to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-tinta to-transparent" />
    </div>
  )
}
