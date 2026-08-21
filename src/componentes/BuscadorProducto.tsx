import { useMemo, useRef, useState } from 'react'
import { Check, Search, X } from 'lucide-react'
import { GRANDE, aGrande } from '@/datos/unidades'
import type { Producto } from '@/datos/despensa'

/**
 * Elegir un producto escribiendo, no desplegando.
 *
 * Con veinte referencias una lista desplegable vale; con seiscientas es
 * inservible. Aquí se escribe, se ve lo que hay en cámara de cada resultado y
 * se elige. Aguanta erratas y falta de acentos.
 */

const limpiar = (t: string) =>
  t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

export function BuscadorProducto({
  productos,
  elegido,
  onElegir,
  etiqueta = 'Producto',
  obligatorio = true,
  permitirLibre = false,
  textoLibre,
  onTextoLibre,
  autoFocus,
}: {
  productos: Producto[]
  elegido: Producto | null
  onElegir: (p: Producto | null) => void
  etiqueta?: string
  obligatorio?: boolean
  /** En pedidos se puede pedir algo que no está dado de alta. */
  permitirLibre?: boolean
  textoLibre?: string
  onTextoLibre?: (t: string) => void
  autoFocus?: boolean
}) {
  const [texto, setTexto] = useState(textoLibre ?? '')
  const [abierto, setAbierto] = useState(false)
  const [marcado, setMarcado] = useState(0)
  const caja = useRef<HTMLDivElement>(null)

  const resultados = useMemo(() => {
    const q = limpiar(texto)
    if (!q) return productos.slice(0, 6)
    return productos
      .map((p) => {
        const n = limpiar(p.nombre)
        const puntos = n.startsWith(q) ? 100 : n.includes(q) ? 70 : 0
        return { p, puntos }
      })
      .filter((x) => x.puntos > 0)
      .sort((a, b) => b.puntos - a.puntos)
      .slice(0, 8)
      .map((x) => x.p)
  }, [productos, texto])

  function elegir(p: Producto) {
    onElegir(p)
    onTextoLibre?.(p.nombre)
    setTexto(p.nombre)
    setAbierto(false)
  }

  function limpiarTodo() {
    onElegir(null)
    onTextoLibre?.('')
    setTexto('')
    setAbierto(true)
  }

  return (
    <div ref={caja} className="relative">
      <span className="mb-1.5 flex flex-wrap items-baseline gap-x-1.5 text-xs font-semibold uppercase leading-tight tracking-wide text-tinta-suave">
        <span className="min-w-0">{etiqueta}</span>
        {!obligatorio && (
          <span className="shrink-0 text-[10px] font-normal normal-case tracking-normal text-tinta-tenue">
            opcional
          </span>
        )}
      </span>

      {elegido ? (
        <div className="flex h-11 items-center gap-2 rounded-md border border-ok/40 bg-ok-suave px-3">
          <Check className="size-4 shrink-0 text-ok" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{elegido.nombre}</span>
          <span className="shrink-0 text-xs text-tinta-tenue">
            {enCamara(elegido)}
          </span>
          <button type="button" aria-label="Cambiar producto" onClick={limpiarTodo}
            className="grid size-7 shrink-0 place-items-center rounded text-tinta-tenue hover:bg-lienzo">
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 size-5 text-tinta-tenue" aria-hidden />
          <input
            autoFocus={autoFocus}
            autoComplete="off"
            className="h-11 w-full rounded-md border border-borde bg-lienzo pl-10 pr-3 text-sm"
            placeholder="Escribe para buscar"
            value={texto}
            onFocus={() => setAbierto(true)}
            onBlur={() => window.setTimeout(() => setAbierto(false), 150)}
            onChange={(e) => {
              setTexto(e.target.value)
              onTextoLibre?.(e.target.value)
              setAbierto(true)
              setMarcado(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setMarcado((m) => Math.min(m + 1, resultados.length - 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setMarcado((m) => Math.max(m - 1, 0)) }
              if (e.key === 'Enter' && resultados[marcado]) { e.preventDefault(); elegir(resultados[marcado]) }
              if (e.key === 'Escape') setAbierto(false)
            }}
          />
        </div>
      )}

      {abierto && !elegido && (
        <ul className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-lg border border-borde bg-lienzo shadow-hoja">
          {resultados.length === 0 ? (
            <li className="px-3 py-3 text-sm text-tinta-suave">
              {permitirLibre
                ? `No lo tienes dado de alta. Se pedirá como «${texto}».`
                : 'No hay nada con ese nombre en tu inventario.'}
            </li>
          ) : (
            resultados.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setMarcado(i)}
                  onClick={() => elegir(p)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left ${
                    marcado === i ? 'bg-naranja-suave' : ''}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{p.nombre}</span>
                    {p.categoria && <span className="block text-[11px] text-tinta-tenue">{p.categoria}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-tinta-tenue">{enCamara(p)}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

function enCamara(p: Producto) {
  const u = p.unidad_uso as 'g' | 'ml' | 'ud'
  const hay = aGrande(p.stock_actual, u)
  return hay > 0
    ? `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(hay)} ${GRANDE[u]}`
    : 'sin existencias'
}
