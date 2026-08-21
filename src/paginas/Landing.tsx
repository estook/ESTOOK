import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, ArrowUpRight, Check, ChevronDown, Clock, FileText,
  Minus, ShieldCheck, Smartphone, TrendingDown, WifiOff,
} from 'lucide-react'
import { CaraFogon, Logotipo } from '@/marca/Logo'
import { Boton } from '@/componentes/Boton'
import { PANTALLAS, MockPanel } from '@/paginas/Mockups'
import { MenuMovil } from '@/paginas/MenuMovil'
import { Aparece, Contador, ProgresoDeLectura, TextoQueSeEnciende, useParalaje } from '@/paginas/efectos'

const PROBLEMAS = [
  { icono: TrendingDown, titulo: 'Costes que no se repercuten',
    texto: 'Los precios de compra cambian cada semana; los de la carta, una vez al año. La diferencia se la come el margen.' },
  { icono: Minus, titulo: 'Desviaciones sin explicar',
    texto: 'Sin registrar mermas ni controlar el consumo teórico, la diferencia de inventario aparece a fin de mes y ya no se puede reconstruir.' },
  { icono: Clock, titulo: 'Tiempo en tareas administrativas',
    texto: 'Cierres, cuadrantes, escandallos y registros sanitarios consumen horas que no están en la sala ni en la cocina.' },
]

const GARANTIAS = [
  { icono: Smartphone, titulo: 'Se instala en el móvil',
    texto: 'Funciona como una aplicación, no como una web. Se abre desde la pantalla de inicio y se actualiza sola.' },
  { icono: WifiOff, titulo: 'Funciona sin cobertura',
    texto: 'Fichajes, mermas y registros sanitarios se guardan en el dispositivo y se sincronizan al recuperar la señal.' },
  { icono: ShieldCheck, titulo: 'Permisos por puesto',
    texto: 'Cada persona accede únicamente a su parte. Las restricciones se aplican en el servidor, no ocultando botones.' },
]

const planes = [
  {
    nombre: 'Base', precio: 45, nota: 'por local y mes, IVA incluido',
    para: 'Un establecimiento que quiere controlar costes y cumplir con los registros.',
    incluye: [
      'Todas las áreas y todos los documentos',
      'Asistente con 30 consultas al día',
      '60 albaranes por fotografía al mes',
      'Competencia y reseñas con revisión semanal',
      'Acceso para la gestoría',
      'Ventas por CSV, fotografía del Z o total diario',
    ],
  },
  {
    nombre: 'Pro', precio: 69, nota: 'por local y mes, IVA incluido', destacado: true,
    para: 'Quien quiere que las ventas entren solas y el cierre esté hecho al terminar el servicio.',
    incluye: [
      'Todo lo del plan Base',
      'TPV conectado por API',
      'Asistente con 60 consultas al día',
      'Albaranes por fotografía sin límite',
      'Alertas de cambios en la competencia',
      'Respuesta propuesta a cada reseña',
      'Soporte prioritario',
    ],
  },
  {
    nombre: 'Grupo', precio: 55, nota: 'por local y mes · de 2 a 3 locales',
    para: 'Varios establecimientos con los mismos indicadores en una sola vista.',
    incluye: [
      'Todo lo del plan Pro en cada local',
      'Comparativa entre establecimientos',
      'Catálogo y recetas compartidos',
      'TPV incluido en cada local',
      'Soporte prioritario',
    ],
  },
]

const PREGUNTAS: [string, string][] = [
  ['¿Qué es Estook?', 'Una aplicación de gestión para bares y restaurantes. Controla el inventario, calcula el coste y el margen real de cada plato, permite montar la carta y el menú del día, gestiona cuadrantes y fichajes, mantiene los registros de control sanitario y analiza las ventas. Incorpora un asistente, Fogón, que revisa el negocio y avisa de lo que compromete el margen.'],
  ['¿Cuánto cuesta?', 'Tres planes por local y mes, con IVA incluido: Base 45 €, Pro 69 € y Grupo 55 € por local para dos o tres establecimientos. Con pago anual se aplican dos meses de descuento. A partir de cuatro locales, el precio se acuerda según volumen.'],
  ['¿Hay periodo de prueba?', 'Catorce días. Se solicita el método de pago al comenzar y, si no se cancela antes del día quince, se activa el plan seleccionado. Durante la prueba está disponible todo, con algún límite de volumen.'],
  ['¿Se integra con mi TPV?', 'Sí, en los planes Pro y Grupo, mediante una API unificada compatible con las marcas más habituales en España. Las ventas se sincronizan cada quince minutos. En el plan Base se incorporan por CSV, por fotografía del Z o con el total del día.'],
  ['¿Sirve para el control sanitario?', 'Sí. Se define el plan con sus puntos de control, límites y frecuencias, y el equipo lo cumplimenta firmando con su PIN. Un valor fuera de rango exige registrar la acción correctiva. De ahí se obtiene la carpeta de inspección del periodo.'],
  ['¿Funciona sin conexión?', 'Sí. Se instala como aplicación en el móvil y lo que se registra sin cobertura queda guardado en el dispositivo y se sincroniza al recuperar la señal, en orden y sin duplicados.'],
  ['¿Cada empleado ve todo?', 'No. Los permisos se definen por puesto y se ajustan uno a uno. El personal de cocina consulta gramajes y elaboraciones sin ningún importe; la información económica queda restringida a quien corresponde. Las restricciones se aplican en el servidor.'],
  ['¿Qué pasa con mis datos si me doy de baja?', 'Se exportan íntegramente en un clic y la cuenta permanece en modo lectura durante sesenta días. No se elimina información.'],
]

export function Landing() {
  const [pantalla, setPantalla] = useState(0)
  const [detalle, setDetalle] = useState<number | null>(null)
  const heroRef = useParalaje(0.05)
  const actual = PANTALLAS[pantalla]
  const Mock = actual.mock

  return (
    <div className="min-h-full overflow-x-hidden bg-lienzo">
      <ProgresoDeLectura />

      {/* ---------- Cabecera ---------- */}
      <header className="sticky top-0 z-40 border-b border-borde/70 bg-lienzo/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:px-8">
          <Logotipo conClaim={false} />
          <nav className="hidden items-center gap-7 text-sm font-semibold text-tinta-suave md:flex">
            {[['#problema', 'Por qué'], ['#por-dentro', 'La aplicación'],
              ['#fogon', 'Fogón'], ['#precios', 'Precios']].map(([ancla, texto]) => (
              <a key={ancla} href={ancla} className="group relative py-1 transition-colors hover:text-tinta">
                {texto}
                <span className="absolute inset-x-0 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-naranja transition-transform duration-300 ease-estook group-hover:scale-x-100" />
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/entrar"><Boton tono="discreto" tamano="pequeno">Entrar</Boton></Link>
            <Link to="/entrar?alta=1" className="hidden md:block">
              <Boton tamano="pequeno">Probar 14 días</Boton>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ---------- Portada ---------- */}
        <section className="relative overflow-hidden bg-tinta text-white">
          {/* Halos de color, muy suaves */}
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

          <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-4 pb-20 pt-16 md:grid-cols-[1.05fr_.95fr] md:px-8 md:pb-28 md:pt-24">
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
                <h1 className="mt-6 max-w-2xl font-titulo text-[2.6rem] font-semibold leading-[1.05] md:text-[4.2rem]">
                  Tu cocina,<br />
                  <span className="relative inline-block">
                    <span className="relative z-10">bajo control.</span>
                    <span className="absolute inset-x-0 bottom-1 -z-0 h-2.5 rounded-sm bg-naranja/60 md:bottom-2 md:h-3.5" />
                  </span>
                </h1>
              </Aparece>

              <Aparece retraso={160}>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
                  Controla el género, calcula el coste real de cada plato, organiza turnos y registros
                  sanitarios, y genera tu documentación. Con avisos automáticos cuando algo compromete
                  tu margen.
                </p>
              </Aparece>

              <Aparece retraso={240}>
                <div className="mt-9 flex flex-wrap gap-3">
                  <Link to="/entrar?alta=1">
                    <Boton tamano="grande">Empezar la prueba de 14 días <ArrowRight className="size-4" /></Boton>
                  </Link>
                  <a href="#por-dentro">
                    <Boton tono="discreto" tamano="grande"
                      className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                      Ver la aplicación
                    </Boton>
                  </a>
                </div>
              </Aparece>

              <Aparece retraso={320}>
                <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-6">
                  {[
                    ['Configuración', <Contador key="c" hasta={3} sufijo=" min" />],
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
                <MockPanel />
              </div>
            </Aparece>
          </div>

          {/* Cinta de áreas */}
          <div className="relative border-t border-white/10 bg-tinta/60 py-4">
            <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
              {['Inventario', 'Escandallos', 'Carta', 'Cuadrantes', 'Fichajes', 'Control sanitario', 'Ventas', 'Competencia'].map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- El problema ---------- */}
        <section id="problema" className="border-b border-borde bg-lienzo">
          <div className="mx-auto max-w-[1000px] px-4 py-20 md:px-8 md:py-28">
            <Aparece>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-naranja">El problema</p>
            </Aparece>
            <Aparece retraso={60}>
              <TextoQueSeEnciende
                className="mt-6 font-titulo text-2xl font-semibold leading-snug md:text-[2.1rem]"
                texto="En hostelería el margen no se pierde de golpe: se escapa en decisiones pequeñas que nadie está midiendo. Un proveedor sube el pescado y el plato sigue al mismo precio. Desaparecen dos kilos y no hay forma de saber si fue merma, ración de más o caducidad. El inventario no cuadra y no hay por dónde empezar a buscar."
              />
            </Aparece>

            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {PROBLEMAS.map(({ icono: Icono, titulo, texto }, i) => (
                <Aparece key={titulo} retraso={i * 90}>
                  <article className="group h-full rounded-2xl border border-borde bg-lienzo p-6 transition-all duration-300 hover:-translate-y-1 hover:border-naranja hover:shadow-tarjeta">
                    <Icono className="size-5 text-naranja" aria-hidden />
                    <h3 className="mt-4 font-titulo text-lg font-semibold leading-tight">{titulo}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-tinta-suave">{texto}</p>
                  </article>
                </Aparece>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- La aplicación por dentro ---------- */}
        <section id="por-dentro" className="bg-panel">
          <div className="mx-auto max-w-[1200px] px-4 py-20 md:px-8 md:py-28">
            <Aparece>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-naranja">La aplicación</p>
              <h2 className="mt-4 max-w-2xl font-titulo text-3xl font-semibold leading-tight md:text-[2.6rem]">
                Ocho áreas que comparten la misma información
              </h2>
              <p className="mt-4 max-w-2xl leading-relaxed text-tinta-suave">
                Nada se apunta dos veces. Un precio nuevo en un albarán recorre el escandallo, el
                margen del plato y el análisis de la carta sin que nadie intervenga. Selecciona un
                área para ver cómo funciona.
              </p>
            </Aparece>

            {/* Selector */}
            <div className="mt-10 flex gap-2 overflow-x-auto pb-2">
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
                <h3 className="font-titulo text-2xl font-semibold leading-tight md:text-3xl">
                  {actual.titulo}
                </h3>
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

        {/* ---------- Fogón ---------- */}
        <section id="fogon" className="relative overflow-hidden bg-tinta text-white">
          <div className="pointer-events-none absolute right-0 top-0 size-[420px] rounded-full bg-naranja/20 blur-[120px]" />
          <div className="relative mx-auto max-w-[1200px] px-4 py-20 md:px-8 md:py-28">
            <Aparece>
              <div className="flex items-center gap-3">
                <CaraFogon className="size-12" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-naranja">Fogón</p>
                  <p className="font-titulo text-sm font-semibold uppercase tracking-wide text-white/70">
                    El asistente de tu cocina
                  </p>
                </div>
              </div>
            </Aparece>

            <Aparece retraso={80}>
              <h2 className="mt-8 max-w-3xl font-titulo text-3xl font-semibold leading-tight md:text-[2.6rem]">
                No espera a que preguntes. Revisa el negocio y avisa.
              </h2>
              <p className="mt-5 max-w-2xl leading-relaxed text-white/70">
                Fogón trabaja sobre un resumen permanente del establecimiento: precios de compra,
                existencias, ventas, cuadrante, registros sanitarios y reseñas. Los números no los
                estima: los recibe calculados. Propone y rellena, pero no guarda nada por su cuenta.
              </p>
            </Aparece>

            <div className="mt-14 grid gap-10 lg:grid-cols-2">
              <Aparece desde="izquierda">
                <h3 className="font-titulo text-sm font-semibold uppercase tracking-[0.18em] text-white/50">
                  Durante el servicio
                </h3>
                <ul className="mt-5 flex flex-col gap-3">
                  {[
                    ['Quedan 2,1 kg de merluza con caducidad el día 19', 'No está en el menú de hoy. Se recomienda darle salida.'],
                    ['Tres días seguidos con la cámara de pescado por encima de 4 °C', 'Revisar el cierre de la puerta y registrar la acción correctiva.'],
                    ['El pedido a Pescados Gil se envió hace cuatro días', 'Si ya ha llegado, recíbelo para que el género entre en el inventario.'],
                  ].map(([t, s], i) => (
                    <li key={t} style={{ transitionDelay: `${i * 90}ms` }}
                      className="rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur transition-colors hover:border-naranja/50">
                      <p className="text-sm font-semibold leading-tight">{t}</p>
                      <p className="mt-1 text-sm text-white/60">{s}</p>
                    </li>
                  ))}
                </ul>
              </Aparece>

              <Aparece desde="derecha">
                <h3 className="font-titulo text-sm font-semibold uppercase tracking-[0.18em] text-white/50">
                  A medio plazo
                </h3>
                <ul className="mt-5 flex flex-col gap-3">
                  {[
                    ['El rabo de toro está al 2 % de margen', 'Sus ingredientes han subido un 14 % desde marzo y el precio de venta no se ha revisado.'],
                    ['El martes es el día de menor facturación desde junio', 'El cuadrante mantiene dos horas de sala por encima de lo necesario.'],
                    ['Tu menú está 1,50 € por debajo de la media de la zona', 'Con una valoración superior a la de los establecimientos cercanos.'],
                  ].map(([t, s], i) => (
                    <li key={t} style={{ transitionDelay: `${i * 90}ms` }}
                      className="rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur transition-colors hover:border-naranja/50">
                      <p className="text-sm font-semibold leading-tight">{t}</p>
                      <p className="mt-1 text-sm text-white/60">{s}</p>
                    </li>
                  ))}
                </ul>
              </Aparece>
            </div>

            <Aparece retraso={100}>
              <div className="mt-14 grid gap-4 border-t border-white/10 pt-10 md:grid-cols-3">
                {[
                  ['Habla según el puesto', 'Al personal de cocina le informa de tareas y caducidades, sin ningún importe. La información económica queda para quien corresponde.'],
                  ['Cifras verificables', 'Cada dato que da procede de una consulta a tu base de datos. No estima ni redondea por su cuenta.'],
                  ['Decisión del responsable', 'Propone la acción y deja el cambio preparado, pero la confirmación es siempre de una persona.'],
                ].map(([t, s]) => (
                  <div key={t}>
                    <p className="font-titulo text-sm font-semibold uppercase tracking-wide">{t}</p>
                    <p className="mt-2 text-sm leading-relaxed text-white/60">{s}</p>
                  </div>
                ))}
              </div>
            </Aparece>
          </div>
        </section>

        {/* ---------- Documentos ---------- */}
        <section className="border-b border-borde bg-lienzo">
          <div className="mx-auto max-w-[1200px] px-4 py-20 md:px-8 md:py-24">
            <div className="grid items-center gap-12 md:grid-cols-2">
              <Aparece desde="izquierda">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-naranja">Documentación</p>
                <h2 className="mt-4 font-titulo text-3xl font-semibold leading-tight md:text-[2.4rem]">
                  Los documentos se generan solos, con tu marca
                </h2>
                <p className="mt-5 leading-relaxed text-tinta-suave">
                  La carta, el menú del día, el cuadrante semanal o la carpeta de inspección se generan
                  desde la pantalla donde están los datos, con el nombre, el logotipo y los colores de tu
                  establecimiento. Se envían por WhatsApp o correo desde el propio móvil.
                </p>
                <p className="mt-4 leading-relaxed text-tinta-suave">
                  Cada documento queda archivado con una copia de la información que utilizó: se puede
                  volver a emitir meses después y sale exactamente igual, aunque los precios hayan
                  cambiado. Los de valor legal se conservan cinco años.
                </p>
              </Aparece>

              <Aparece desde="derecha">
                <div className="grid grid-cols-2 gap-3">
                  {['Carta completa', 'Menú del día', 'Ficha técnica', 'Escandallo', 'Cuadrante semanal',
                    'Parte de control sanitario', 'Carpeta de inspección', 'Inventario valorado',
                    'Hoja de recuento', 'Pedido a proveedor', 'Cierre de caja', 'Informe para la gestoría',
                  ].map((d, i) => (
                    <div key={d} style={{ transitionDelay: `${i * 40}ms` }}
                      className="flex items-center gap-2 rounded-lg border border-borde bg-panel px-3 py-2.5 text-sm font-medium text-tinta-suave transition-colors hover:border-naranja hover:text-tinta">
                      <FileText className="size-4 shrink-0 text-naranja" aria-hidden />
                      <span className="truncate">{d}</span>
                    </div>
                  ))}
                </div>
              </Aparece>
            </div>
          </div>
        </section>

        {/* ---------- Garantías ---------- */}
        <section className="border-b border-borde bg-panel">
          <div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-16 md:grid-cols-3 md:px-8">
            {GARANTIAS.map(({ icono: Icono, titulo, texto }, i) => (
              <Aparece key={titulo} retraso={i * 90}>
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

        {/* ---------- Precios ---------- */}
        <section id="precios" className="bg-lienzo">
          <div className="mx-auto max-w-[1200px] px-4 py-20 md:px-8 md:py-28">
            <Aparece>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-naranja">Precios</p>
              <h2 className="mt-4 font-titulo text-3xl font-semibold leading-tight md:text-[2.6rem]">
                Por local y mes, sin permanencia
              </h2>
              <p className="mt-4 max-w-2xl leading-relaxed text-tinta-suave">
                Todos los planes incluyen las ocho áreas, todos los documentos y el asistente. Lo que
                varía es el volumen de uso y si el TPV entra conectado. Dispositivos ilimitados.
              </p>
            </Aparece>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {planes.map((p, i) => (
                <Aparece key={p.nombre} retraso={i * 90}>
                  <article className={`flex h-full flex-col rounded-2xl border p-7 transition-all duration-300 hover:-translate-y-1 ${
                    p.destacado
                      ? 'border-tinta bg-tinta text-white shadow-[0_20px_50px_-25px_rgba(17,28,31,.6)]'
                      : 'border-borde bg-lienzo hover:border-naranja hover:shadow-tarjeta'
                  }`}>
                    {p.destacado && (
                      <span className="mb-4 w-fit rounded-full bg-naranja px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                        Más contratado
                      </span>
                    )}
                    <h3 className="font-titulo text-lg font-semibold uppercase tracking-wide">{p.nombre}</h3>
                    <p className="mt-4 font-titulo text-[2.75rem] font-semibold leading-none">
                      <Contador hasta={p.precio} sufijo=" €" />
                    </p>
                    <p className={`mt-1.5 text-xs ${p.destacado ? 'text-white/50' : 'text-tinta-tenue'}`}>{p.nota}</p>
                    <p className={`mt-5 text-sm leading-relaxed ${p.destacado ? 'text-white/70' : 'text-tinta-suave'}`}>
                      {p.para}
                    </p>
                    <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                      {p.incluye.map((x) => (
                        <li key={x} className="flex gap-2.5 text-sm">
                          <Check className={`mt-0.5 size-4 shrink-0 ${p.destacado ? 'text-naranja' : 'text-ok'}`} aria-hidden />
                          <span className={p.destacado ? 'text-white/85' : ''}>{x}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to="/entrar?alta=1" className="mt-7">
                      <Boton ancho tono={p.destacado ? 'principal' : 'secundario'}>Probar 14 días</Boton>
                    </Link>
                  </article>
                </Aparece>
              ))}
            </div>

            <Aparece retraso={120}>
              <p className="mt-8 text-sm text-tinta-suave">
                Con pago anual, dos meses de descuento. A partir de cuatro establecimientos el precio se
                acuerda según volumen, con integración con tu ERP, informes propios y responsable asignado.
              </p>
            </Aparece>
          </div>
        </section>

        {/* ---------- Preguntas ---------- */}
        <section id="preguntas" className="border-t border-borde bg-panel">
          <div className="mx-auto max-w-[860px] px-4 py-20 md:px-8">
            <Aparece>
              <h2 className="font-titulo text-3xl font-semibold">Preguntas frecuentes</h2>
            </Aparece>
            <div className="mt-10 divide-y divide-borde border-y border-borde">
              {PREGUNTAS.map(([p, r]) => (
                <details key={p} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center gap-4 py-4 font-titulo font-semibold marker:hidden">
                    <span className="flex-1">{p}</span>
                    <span className="grid size-7 shrink-0 place-items-center rounded-full border border-borde text-naranja transition-transform duration-300 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="pb-5 pr-11 leading-relaxed text-tinta-suave">{r}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Cierre ---------- */}
        <section className="relative overflow-hidden bg-tinta text-white">
          <div className="pointer-events-none absolute left-1/2 top-0 size-[500px] -translate-x-1/2 rounded-full bg-naranja/20 blur-[130px]" />
          <div className="relative mx-auto max-w-[860px] px-4 py-24 text-center md:px-8">
            <Aparece>
              <h2 className="font-titulo text-3xl font-semibold leading-tight md:text-[2.8rem]">
                Catorce días para comprobarlo con tus propios números
              </h2>
              <p className="mx-auto mt-5 max-w-xl leading-relaxed text-white/70">
                La configuración inicial lleva tres minutos. Desde la primera pantalla, Estook trabaja
                con los datos reales de tu establecimiento.
              </p>
              <Link to="/entrar?alta=1" className="mt-10 inline-flex">
                <Boton tamano="grande">Empezar ahora <ArrowRight className="size-4" /></Boton>
              </Link>
              <p className="mt-4 text-xs text-white/40">
                Se solicita método de pago. Cancelable en cualquier momento durante la prueba.
              </p>
            </Aparece>
          </div>
        </section>
      </main>

      <MenuMovil />

      <footer className="border-t border-borde bg-lienzo pb-24 md:pb-0">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-8">
          <Logotipo />
          <p className="max-w-md text-sm text-tinta-tenue">
            Estook · software de gestión para bares y restaurantes · diseñado para el ritmo de una cocina.
          </p>
        </div>
      </footer>
    </div>
  )
}
