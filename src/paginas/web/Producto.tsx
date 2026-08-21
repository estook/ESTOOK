import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ChevronDown, FileText, ShieldCheck, Smartphone, WifiOff } from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { PANTALLAS } from '@/paginas/Mockups'
import { Aparece } from '@/paginas/efectos'
import { CabeceraPagina, MarcoWeb } from '@/paginas/web/MarcoWeb'

const GARANTIAS = [
  { icono: Smartphone, titulo: 'Se instala en el móvil',
    texto: 'Funciona como aplicación, no como web. Se abre desde la pantalla de inicio y se actualiza sola.' },
  { icono: WifiOff, titulo: 'Funciona sin cobertura',
    texto: 'Fichajes, mermas y registros se guardan en el dispositivo y se sincronizan al recuperar señal.' },
  { icono: ShieldCheck, titulo: 'Permisos por puesto',
    texto: 'Cada persona accede solo a su parte. La restricción se aplica en el servidor, no ocultando botones.' },
]

const DOCUMENTOS = [
  'Carta completa', 'Menú del día', 'Ficha técnica', 'Escandallo',
  'Cuadrante semanal', 'Horario individual', 'Parte de control sanitario',
  'Carpeta de inspección', 'Inventario valorado', 'Hoja de recuento',
  'Pedido a proveedor', 'Cierre de caja', 'Resumen del mes', 'Informe para la gestoría',
]

export function Producto() {
  const [pantalla, setPantalla] = useState(0)
  const [detalle, setDetalle] = useState<number | null>(null)
  const actual = PANTALLAS[pantalla]
  const Mock = actual.mock

  return (
    <MarcoWeb>
      <CabeceraPagina
        seccion="La aplicación"
        titulo="Ocho áreas que comparten la misma información"
        entrada="Nada se apunta dos veces. Un precio nuevo en un albarán recorre el escandallo, el margen del plato y el análisis de la carta sin que nadie intervenga."
      />

      {/* ---------- Recorrido por áreas ---------- */}
      <section className="bg-panel">
        <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-20">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {PANTALLAS.map((p, i) => (
              <button
                key={p.clave}
                onClick={() => { setPantalla(i); setDetalle(null) }}
                aria-pressed={pantalla === i}
                className={`shrink-0 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                  pantalla === i
                    ? 'border-tinta bg-tinta text-white shadow-tarjeta'
                    : 'border-borde bg-lienzo text-tinta-suave hover:border-naranja hover:text-tinta'
                }`}
              >
                {p.nombre}
              </button>
            ))}
          </div>

          <div className="mt-10 grid items-start gap-10 md:grid-cols-[1fr_auto]">
            <div key={actual.clave} className="animate-subirCorto">
              <h2 className="font-titulo text-2xl font-semibold leading-tight md:text-[2rem]">
                {actual.titulo}
              </h2>
              <p className="mt-4 max-w-xl leading-relaxed text-tinta-suave">{actual.texto}</p>

              <ul className="mt-8 flex flex-col divide-y divide-borde border-y border-borde">
                {actual.detalles.map(([t, s], i) => (
                  <li key={t}>
                    <button
                      onClick={() => setDetalle(detalle === i ? null : i)}
                      aria-expanded={detalle === i}
                      className="flex w-full items-center gap-3 py-4 text-left"
                    >
                      <span className="font-titulo text-sm font-semibold uppercase tracking-wide">{t}</span>
                      <ChevronDown
                        className={`ml-auto size-4 shrink-0 text-tinta-tenue transition-transform duration-300 ${
                          detalle === i ? 'rotate-180 text-naranja' : ''}`}
                        aria-hidden
                      />
                    </button>
                    <div className={`grid transition-all duration-300 ease-estook ${
                      detalle === i ? 'grid-rows-[1fr] pb-4 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                      <p className="overflow-hidden text-sm leading-relaxed text-tinta-suave">{s}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <Link to="/entrar?alta=1" className="mt-8 inline-flex">
                <Boton>Probarlo con mis datos <ArrowUpRight className="size-4" /></Boton>
              </Link>
            </div>

            <div key={`m-${actual.clave}`} className="mx-auto animate-subirCorto md:sticky md:top-24">
              <Mock />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Documentación ---------- */}
      <section className="border-y border-borde bg-lienzo">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 py-16 md:grid-cols-2 md:px-8 md:py-20">
          <Aparece desde="izquierda">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-naranja">Documentación</p>
            <h2 className="mt-4 font-titulo text-3xl font-semibold leading-tight md:text-[2.2rem]">
              Se acabó el Excel
            </h2>
            <p className="mt-5 leading-relaxed text-tinta-suave">
              Los documentos se generan desde la pantalla donde están los datos, con el nombre, el
              logotipo y los colores de tu establecimiento. Se envían por WhatsApp o correo desde el
              propio móvil.
            </p>
            <p className="mt-4 leading-relaxed text-tinta-suave">
              Cada uno queda archivado con una copia de la información que utilizó: se puede volver a
              emitir meses después y sale idéntico. Los de valor legal se conservan cinco años.
            </p>
          </Aparece>

          <Aparece desde="derecha">
            <div className="grid grid-cols-2 gap-2.5">
              {DOCUMENTOS.map((d) => (
                <div key={d}
                  className="flex items-center gap-2 rounded-lg border border-borde bg-panel px-3 py-2.5 text-sm font-medium text-tinta-suave transition-colors hover:border-naranja hover:text-tinta">
                  <FileText className="size-4 shrink-0 text-naranja" aria-hidden />
                  <span className="truncate">{d}</span>
                </div>
              ))}
            </div>
          </Aparece>
        </div>
      </section>

      {/* ---------- Garantías ---------- */}
      <section className="bg-panel">
        <div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-16 md:grid-cols-3 md:px-8">
          {GARANTIAS.map(({ icono: Icono, titulo, texto }, i) => (
            <Aparece key={titulo} retraso={i * 80}>
              <div className="flex gap-4">
                <Icono className="size-6 shrink-0 text-naranja" aria-hidden />
                <div>
                  <h3 className="font-titulo text-base font-semibold">{titulo}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-tinta-suave">{texto}</p>
                </div>
              </div>
            </Aparece>
          ))}
        </div>
      </section>
    </MarcoWeb>
  )
}
