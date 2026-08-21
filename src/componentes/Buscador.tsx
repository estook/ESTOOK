import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, BarChart3, Boxes, CalendarClock, ChefHat, ClipboardCheck,
  FileText, MessageSquare, Search, Settings, Star, Store, X,
} from 'lucide-react'

/**
 * Buscador del Panel.
 *
 * Busca dos cosas a la vez: apartados de la app y acciones concretas. Si
 * escribes «despensa» encuentra Inventario, porque cada entrada lleva sus
 * sinónimos y el nombre viejo; y si escribes «añadir», salen todas las cosas
 * que se pueden añadir. Aguanta erratas y falta de acentos.
 */

interface Entrada {
  clave: string
  titulo: string
  categoria: string
  ruta: string
  icono: typeof Boxes
  palabras: string[]
  roles?: string[]
}

const APARTADOS: Entrada[] = [
  { clave: 'inventario', titulo: 'Inventario', categoria: 'Apartado', ruta: '/app/inventario', icono: Boxes,
    palabras: ['despensa', 'camara', 'almacen', 'stock', 'genero', 'productos', 'existencias'] },
  { clave: 'cocina', titulo: 'Cocina', categoria: 'Apartado', ruta: '/app/cocina', icono: ChefHat,
    palabras: ['fichas', 'recetas', 'escandallo', 'carta', 'platos', 'menu'] },
  { clave: 'servicio', titulo: 'Servicio', categoria: 'Apartado', ruta: '/app/servicio', icono: ClipboardCheck,
    palabras: ['jornada', 'appcc', 'temperaturas', 'cierre', 'caja', 'mermas', 'sanidad'] },
  { clave: 'equipo', titulo: 'Equipo', categoria: 'Apartado', ruta: '/app/equipo', icono: CalendarClock,
    palabras: ['personal', 'cuadrante', 'horario', 'turnos', 'fichajes', 'plantilla'] },
  { clave: 'negocio', titulo: 'Negocio', categoria: 'Apartado', ruta: '/app/negocio', icono: BarChart3,
    palabras: ['numeros', 'ventas', 'margen', 'costes', 'tpv', 'gestoria', 'resumen'] },
  { clave: 'competencia', titulo: 'Competencia', categoria: 'Apartado', ruta: '/app/competencia', icono: Store,
    palabras: ['vecinos', 'zona', 'precios de la calle', 'rivales'] },
  { clave: 'resenas', titulo: 'Reseñas', categoria: 'Apartado', ruta: '/app/resenas', icono: Star,
    palabras: ['opiniones', 'google', 'valoraciones', 'clientes'] },
  { clave: 'chat', titulo: 'Chat', categoria: 'Apartado', ruta: '/app/chat', icono: MessageSquare,
    palabras: ['mensajes', 'equipo', 'avisos'] },
  { clave: 'documentos', titulo: 'Documentos', categoria: 'Apartado', ruta: '/app/documentos', icono: FileText,
    palabras: ['pdf', 'papeles', 'historial', 'imprimir', 'generar', 'informes'] },
  { clave: 'ajustes', titulo: 'Ajustes', categoria: 'Apartado', ruta: '/app/ajustes', icono: Settings,
    palabras: ['configuracion', 'logo', 'color', 'marca', 'plan', 'facturacion', 'perfil', 'notas'] },
]

const ACCIONES: Entrada[] = [
  { clave: 'add-producto', titulo: 'Añadir producto al inventario', categoria: 'Inventario', ruta: '/app/inventario?accion=producto', icono: Boxes,
    palabras: ['añadir', 'agregar', 'nuevo', 'alta', 'meter', 'dar de alta', 'ingrediente', 'genero', 'despensa'] },
  { clave: 'quitar-producto', titulo: 'Corregir o quitar género del inventario', categoria: 'Inventario', ruta: '/app/inventario', icono: Boxes,
    palabras: ['quitar', 'restar', 'sacar', 'descontar', 'corregir', 'ajustar', 'stock', 'despensa'] },
  { clave: 'add-proveedor', titulo: 'Añadir proveedor', categoria: 'Inventario', ruta: '/app/inventario?tab=proveedores', icono: Boxes,
    palabras: ['añadir', 'nuevo', 'proveedor', 'distribuidor', 'alta'] },
  { clave: 'pedido', titulo: 'Crear un pedido', categoria: 'Inventario', ruta: '/app/inventario?tab=pedidos&accion=pedido', icono: Boxes,
    palabras: ['pedir', 'comprar', 'pedido', 'encargo', 'añadir'] },
  { clave: 'merma', titulo: 'Registrar una merma', categoria: 'Servicio', ruta: '/app/servicio?tab=mermas', icono: ClipboardCheck,
    palabras: ['tirar', 'perdida', 'roto', 'caducado', 'merma', 'registrar', 'añadir'] },
  { clave: 'temperatura', titulo: 'Registrar temperatura (APPCC)', categoria: 'Servicio', ruta: '/app/servicio?tab=appcc', icono: ClipboardCheck,
    palabras: ['temperatura', 'camara', 'appcc', 'sanidad', 'control', 'registrar', 'añadir', 'nevera'] },
  { clave: 'cerrar', titulo: 'Cerrar la caja del día', categoria: 'Servicio', ruta: '/app/servicio', icono: ClipboardCheck,
    palabras: ['cerrar', 'caja', 'cierre', 'z', 'arqueo'] },
  { clave: 'ficha', titulo: 'Crear una ficha técnica', categoria: 'Cocina', ruta: '/app/cocina?accion=ficha', icono: ChefHat,
    palabras: ['añadir', 'nueva', 'receta', 'ficha', 'plato', 'escandallo'] },
  { clave: 'carta', titulo: 'Montar la carta', categoria: 'Cocina', ruta: '/app/cocina?tab=carta', icono: ChefHat,
    palabras: ['carta', 'menu', 'secciones', 'precios', 'añadir'] },
  { clave: 'pdf-inventario', titulo: 'Generar el inventario valorado en PDF', categoria: 'Documentos', ruta: '/app/inventario', icono: Boxes,
    palabras: ['pdf', 'documento', 'imprimir', 'inventario', 'valorado', 'generar'] },
  { clave: 'pdf-appcc', titulo: 'Generar el parte de APPCC en PDF', categoria: 'Documentos', ruta: '/app/servicio?tab=appcc', icono: ClipboardCheck,
    palabras: ['pdf', 'documento', 'imprimir', 'appcc', 'inspeccion', 'generar'] },
  { clave: 'pdf-carta', titulo: 'Generar la carta en PDF', categoria: 'Documentos', ruta: '/app/cocina?tab=carta', icono: ChefHat,
    palabras: ['pdf', 'documento', 'imprimir', 'carta', 'generar'] },
]

const TODO = [...APARTADOS, ...ACCIONES]

const limpiar = (t: string) =>
  t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

/** Distancia de edición corta: para que «invenatrio» encuentre «inventario». */
function parecido(a: string, b: string) {
  if (a === b) return 0
  if (b.includes(a)) return 0.5
  const m = a.length, n = b.length
  if (Math.abs(m - n) > 3) return 99
  const fila = Array.from({ length: n + 1 }, (_, i) => i)
  for (let i = 1; i <= m; i++) {
    let anterior = fila[0]
    fila[0] = i
    for (let j = 1; j <= n; j++) {
      const tmp = fila[j]
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, anterior + (a[i - 1] === b[j - 1] ? 0 : 1))
      anterior = tmp
    }
  }
  return fila[n]
}

function puntuar(entrada: Entrada, consulta: string): number {
  const q = limpiar(consulta)
  if (!q) return 0
  const titulo = limpiar(entrada.titulo)
  if (titulo.startsWith(q)) return 100
  if (titulo.includes(q)) return 80
  let mejor = 0
  for (const p of entrada.palabras) {
    const w = limpiar(p)
    if (w === q) mejor = Math.max(mejor, 90)
    else if (w.startsWith(q) || q.startsWith(w)) mejor = Math.max(mejor, 70)
    else if (w.includes(q)) mejor = Math.max(mejor, 55)
    else {
      const d = parecido(q, w)
      if (d <= 2) mejor = Math.max(mejor, 45 - d * 5)
    }
  }
  if (mejor === 0 && parecido(q, titulo) <= 2) mejor = 40
  return mejor
}

export function Buscador({ rol }: { rol: string }) {
  const navegar = useNavigate()
  const [consulta, setConsulta] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [marcado, setMarcado] = useState(0)
  const caja = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [])

  const resultados = useMemo(() => {
    if (!consulta.trim()) return []
    const puntuados = TODO
      .filter((e) => !e.roles || e.roles.includes(rol))
      .map((e) => ({ e, p: puntuar(e, consulta) }))
      .filter((x) => x.p > 0)
      .sort((a, b) => b.p - a.p)
      .slice(0, 8)
    return puntuados.map((x) => x.e)
  }, [consulta, rol])

  const agrupados = useMemo(() => {
    const mapa = new Map<string, Entrada[]>()
    for (const r of resultados) mapa.set(r.categoria, [...(mapa.get(r.categoria) ?? []), r])
    return [...mapa]
  }, [resultados])

  function ir(e: Entrada) {
    setAbierto(false); setConsulta('')
    navegar(e.ruta)
  }

  return (
    <div ref={caja} className="relative">
      <Search className="pointer-events-none absolute left-3 top-3.5 size-5 text-tinta-tenue" aria-hidden />
      <input
        className="h-12 w-full rounded-xl border border-borde bg-lienzo pl-10 pr-10 text-sm shadow-tarjeta placeholder:text-tinta-tenue"
        placeholder="Buscar o hacer algo: «añadir», «temperatura», «carta»…"
        value={consulta}
        onFocus={() => setAbierto(true)}
        onChange={(e) => { setConsulta(e.target.value); setAbierto(true); setMarcado(0) }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setMarcado((m) => Math.min(m + 1, resultados.length - 1)) }
          if (e.key === 'ArrowUp') { e.preventDefault(); setMarcado((m) => Math.max(m - 1, 0)) }
          if (e.key === 'Enter' && resultados[marcado]) ir(resultados[marcado])
          if (e.key === 'Escape') setAbierto(false)
        }}
      />
      {consulta && (
        <button aria-label="Limpiar" onClick={() => { setConsulta(''); setAbierto(false) }}
          className="absolute right-2 top-2 grid size-8 place-items-center rounded-md text-tinta-tenue hover:bg-panel">
          <X className="size-4" aria-hidden />
        </button>
      )}

      {abierto && consulta.trim() !== '' && (
        <div className="absolute inset-x-0 top-14 z-40 overflow-hidden rounded-xl border border-borde bg-lienzo shadow-hoja">
          {resultados.length === 0 ? (
            <p className="p-4 text-sm text-tinta-suave">
              No encuentro nada con «{consulta}». Prueba con «inventario», «temperatura», «carta» o «pedido».
            </p>
          ) : (
            agrupados.map(([categoria, lista]) => (
              <div key={categoria}>
                <p className="border-b border-borde bg-panel px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-tinta-tenue">
                  {categoria}
                </p>
                <ul>
                  {lista.map((e) => {
                    const indice = resultados.indexOf(e)
                    return (
                      <li key={e.clave}>
                        <button
                          onClick={() => ir(e)}
                          onMouseEnter={() => setMarcado(indice)}
                          className={`flex w-full items-center gap-3 px-3 py-2.5 text-left ${
                            marcado === indice ? 'bg-naranja-suave' : ''}`}
                        >
                          <e.icono className="size-4 shrink-0 text-naranja" aria-hidden />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">{e.titulo}</span>
                          <ArrowRight className="size-4 shrink-0 text-tinta-tenue" aria-hidden />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
