import { Link } from 'react-router-dom'
import {
  ArrowRight, ArrowUpRight, BarChart3, Boxes, CalendarClock, ChefHat,
  ClipboardCheck, FileText, MessageSquare, Sparkles, Star, Store,
} from 'lucide-react'
import { CaraFogon } from '@/marca/Logo'
import { Boton } from '@/componentes/Boton'
import { MockPanel } from '@/paginas/Mockups'
import { Aparece, Contador, useParalaje } from '@/paginas/efectos'
import { MarcoWeb } from '@/paginas/web/MarcoWeb'

const LO_QUE_HACE = [
  {
    icono: Sparkles,
    titulo: 'Trabaja por ti',
    texto: 'Calcula costes, actualiza márgenes, prepara pedidos y avisa de lo que hay que resolver. Sin hojas de cálculo.',
  },
  {
    icono: FileText,
    titulo: 'Genera la documentación',
    texto: 'Carta, menú, escandallos, cuadrantes y carpeta de inspección, con tu marca y listos para enviar.',
  },
  {
    icono: CalendarClock,
    titulo: 'Organiza al equipo',
    texto: 'Turnos, fichajes, horas y permisos por puesto. Cada persona recibe lo suyo en su móvil.',
  },
  {
    icono: BarChart3,
    titulo: 'Anticipa problemas',
    texto: 'Analiza tu negocio y el de tu entorno para avisarte antes de que el coste se convierta en pérdida.',
  },
]

const AREAS = [
  { icono: Boxes, nombre: 'Inventario', texto: 'Existencias, proveedores y pedidos, con el coste real de cada kilo.' },
  { icono: ChefHat, nombre: 'Cocina', texto: 'Fichas técnicas, escandallos, carta y menú del día.' },
  { icono: ClipboardCheck, nombre: 'Servicio', texto: 'Jornada, ventas, control sanitario y cierre de caja.' },
  { icono: CalendarClock, nombre: 'Equipo', texto: 'Cuadrantes con turnos partidos, fichajes y horas.' },
  { icono: BarChart3, nombre: 'Negocio', texto: 'Prime cost, desviaciones y exportación para la gestoría.' },
  { icono: Store, nombre: 'Competencia', texto: 'Precios y valoraciones de tu zona, con tu posición.' },
  { icono: Star, nombre: 'Reseñas', texto: 'Opiniones por tema, caídas de nota y respuesta propuesta.' },
  { icono: MessageSquare, nombre: 'Equipo y avisos', texto: 'Comunicación del turno con constancia de lectura.' },
]

export function Inicio() {
  const heroRef = useParalaje(0.05)

  return (
    <MarcoWeb>
      {/* ---------- Portada ---------- */}
      <section className="relative overflow-hidden bg-tinta text-white">
        <div className="pointer-events-none absolute -left-40 -top-40 size-[520px] rounded-full bg-naranja/25 blur-[130px]" />
        <div className="pointer-events-none absolute -bottom-52 right-0 size-[460px] rounded-full bg-naranja/10 blur-[120px]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse at 30% 0%, black, transparent 70%)',
          }}
        />

        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-4 pb-20 pt-14 md:grid-cols-[1.05fr_.95fr] md:px-8 md:pb-24 md:pt-20">
          <div>
            <Aparece>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-naranja opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-naranja" />
                </span>
                Gestión para bares y restaurantes
              </span>
            </Aparece>

            <Aparece retraso={80}>
              <h1 className="mt-6 max-w-2xl font-titulo text-[2.6rem] font-semibold leading-[1.05] md:text-[4rem]">
                Tu cocina,<br />
                <span className="relative inline-block">
                  <span className="relative z-10">bajo control.</span>
                  <span className="absolute inset-x-0 bottom-1 -z-0 h-2.5 rounded-sm bg-naranja/60 md:bottom-2 md:h-3.5" />
                </span>
              </h1>
            </Aparece>

            <Aparece retraso={160}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
                La aplicación que lleva tu negocio al completo: género, costes, carta, equipo,
                documentación y control sanitario. Con una inteligencia artificial que analiza tu
                establecimiento y el de tu entorno, y te avisa antes de que algo cueste dinero.
              </p>
            </Aparece>

            <Aparece retraso={240}>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link to="/entrar?alta=1">
                  <Boton tamano="grande">Empezar la prueba de 14 días <ArrowRight className="size-4" /></Boton>
                </Link>
                <Link to="/producto">
                  <Boton tono="discreto" tamano="grande"
                    className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                    Ver la aplicación
                  </Boton>
                </Link>
              </div>
            </Aparece>

            <Aparece retraso={320}>
              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-6">
                {[
                  ['Puesta en marcha', <Contador key="c" hasta={3} sufijo=" min" />],
                  ['Áreas de gestión', <Contador key="a" hasta={8} />],
                  ['Desde', <Contador key="p" hasta={45} sufijo=" €" />],
                ].map(([t, v]) => (
                  <div key={String(t)}>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-white/45">{t}</dt>
                    <dd className="mt-1 font-titulo text-2xl font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
            </Aparece>
          </div>

          <Aparece desde="escala" retraso={200}>
            <div ref={heroRef} className="relative">
              <div className="absolute inset-x-8 top-10 -z-10 h-72 rounded-[40px] bg-naranja/25 blur-3xl" />
              <MockPanel mitad />
            </div>
          </Aparece>
        </div>

        <div className="relative border-t border-white/10 bg-tinta/60 py-4">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
            {['Inventario', 'Escandallos', 'Carta', 'Cuadrantes', 'Fichajes', 'Control sanitario', 'Ventas', 'Competencia'].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Qué hace ---------- */}
      <section className="border-b border-borde bg-lienzo">
        <div className="mx-auto max-w-[1200px] px-4 py-20 md:px-8 md:py-24">
          <Aparece>
            <h2 className="max-w-2xl font-titulo text-3xl font-semibold leading-tight md:text-[2.5rem]">
              Menos administración, más control
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-tinta-suave">
              Estook automatiza el trabajo de oficina de un restaurante y te devuelve las horas que
              hoy se van en cuadrar números.
            </p>
          </Aparece>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {LO_QUE_HACE.map(({ icono: Icono, titulo, texto }, i) => (
              <Aparece key={titulo} retraso={i * 80}>
                <article className="h-full rounded-2xl border border-borde bg-lienzo p-6 transition-all duration-300 hover:-translate-y-1 hover:border-naranja hover:shadow-tarjeta">
                  <span className="grid size-10 place-items-center rounded-xl bg-naranja-suave text-naranja-oscuro">
                    <Icono className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-titulo text-lg font-semibold leading-tight">{titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-tinta-suave">{texto}</p>
                </article>
              </Aparece>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Las ocho áreas ---------- */}
      <section className="bg-panel">
        <div className="mx-auto max-w-[1200px] px-4 py-20 md:px-8 md:py-24">
          <Aparece>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-naranja">La aplicación</p>
                <h2 className="mt-3 max-w-2xl font-titulo text-3xl font-semibold leading-tight md:text-[2.5rem]">
                  Ocho áreas, una sola información
                </h2>
              </div>
              <Link to="/producto" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-naranja-oscuro">
                Verlas por dentro
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
              </Link>
            </div>
            <p className="mt-4 max-w-2xl leading-relaxed text-tinta-suave">
              Nada se apunta dos veces. Un precio nuevo en un albarán recorre el escandallo, el margen
              del plato y el análisis de la carta sin que nadie intervenga.
            </p>
          </Aparece>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {AREAS.map(({ icono: Icono, nombre, texto }, i) => (
              <Aparece key={nombre} retraso={i * 60}>
                <Link to="/producto"
                  className="flex h-full flex-col rounded-xl border border-borde bg-lienzo p-5 transition-all duration-300 hover:-translate-y-1 hover:border-naranja hover:shadow-tarjeta">
                  <Icono className="size-5 text-naranja" aria-hidden />
                  <h3 className="mt-3 font-titulo text-sm font-semibold uppercase tracking-wide">{nombre}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-tinta-suave">{texto}</p>
                </Link>
              </Aparece>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Fogón ---------- */}
      <section className="relative overflow-hidden bg-tinta text-white">
        <div className="pointer-events-none absolute right-0 top-0 size-[420px] rounded-full bg-naranja/20 blur-[120px]" />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-4 py-20 md:grid-cols-2 md:px-8 md:py-24">
          <Aparece desde="izquierda">
            <div className="flex items-center gap-3">
              <CaraFogon className="size-12" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-naranja">Fogón</p>
                <p className="font-titulo text-sm font-semibold uppercase tracking-wide text-white/70">
                  Inteligencia artificial
                </p>
              </div>
            </div>
            <h2 className="mt-7 font-titulo text-3xl font-semibold leading-tight md:text-[2.5rem]">
              Analiza miles de variables y te dice qué hacer
            </h2>
            <p className="mt-5 leading-relaxed text-white/70">
              Cruza precios de compra, existencias, ventas, cuadrante, registros sanitarios, reseñas y
              los establecimientos de tu zona. Detecta lo que está costando dinero hoy y lo que lo
              costará dentro de un mes.
            </p>
            <Link to="/fogon" className="mt-8 inline-flex">
              <Boton tono="discreto" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                Qué resuelve Fogón <ArrowUpRight className="size-4" />
              </Boton>
            </Link>
          </Aparece>

          <Aparece desde="derecha">
            <ul className="flex flex-col gap-3">
              {[
                ['El rabo de toro está al 2 % de margen', 'Sus ingredientes han subido un 14 % desde marzo y el precio no se ha revisado.'],
                ['Quedan 2,1 kg de merluza con caducidad el día 19', 'No está en el menú de hoy. Se recomienda darle salida.'],
                ['El martes es el día de menor facturación desde junio', 'El cuadrante mantiene dos horas de sala por encima de lo necesario.'],
              ].map(([t, s]) => (
                <li key={t} className="rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur transition-colors hover:border-naranja/50">
                  <p className="text-sm font-semibold leading-tight">{t}</p>
                  <p className="mt-1 text-sm text-white/60">{s}</p>
                </li>
              ))}
            </ul>
          </Aparece>
        </div>
      </section>

      {/* ---------- Precios, en corto ---------- */}
      <section className="border-b border-borde bg-lienzo">
        <div className="mx-auto max-w-[1200px] px-4 py-20 md:px-8 md:py-24">
          <Aparece>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-naranja">Precios</p>
                <h2 className="mt-3 font-titulo text-3xl font-semibold leading-tight md:text-[2.5rem]">
                  Desde 45 € al mes por local
                </h2>
              </div>
              <Link to="/precios" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-naranja-oscuro">
                Ver los tres planes
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
              </Link>
            </div>
          </Aparece>

          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {[
              ['Base', 45, 'Todas las áreas y documentos, con el asistente incluido.'],
              ['Pro', 69, 'Añade TPV conectado, más volumen y soporte prioritario.'],
              ['Grupo', 55, 'De dos a tres locales, con comparativa entre establecimientos.'],
            ].map(([n, p, t], i) => (
              <Aparece key={String(n)} retraso={i * 80}>
                <Link to="/precios"
                  className="flex h-full flex-col rounded-2xl border border-borde bg-lienzo p-6 transition-all duration-300 hover:-translate-y-1 hover:border-naranja hover:shadow-tarjeta">
                  <h3 className="font-titulo text-base font-semibold uppercase tracking-wide">{n}</h3>
                  <p className="mt-3 font-titulo text-3xl font-semibold">
                    <Contador hasta={p as number} sufijo=" €" />
                  </p>
                  <p className="mt-1 text-xs text-tinta-tenue">por local y mes, IVA incluido</p>
                  <p className="mt-4 text-sm leading-relaxed text-tinta-suave">{t}</p>
                </Link>
              </Aparece>
            ))}
          </div>
        </div>
      </section>
    </MarcoWeb>
  )
}
