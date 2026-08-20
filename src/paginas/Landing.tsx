import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BarChart3, Boxes, CalendarClock, Check, ChefHat, ClipboardCheck,
  FileText, MessageSquare, Smartphone, Star, Store, WifiOff,
} from 'lucide-react'
import { Isotipo, Logotipo } from '@/marca/Logo'
import { Boton } from '@/componentes/Boton'
import { PANTALLAS } from '@/paginas/Mockups'

/** Aparece al entrar en pantalla. Si el sistema pide menos animación, no hace nada. */
function Aparece({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const nodo = ref.current
    if (!nodo) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setVisible(true); return }
    const ob = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.15 })
    ob.observe(nodo)
    return () => ob.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-estook ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} ${className}`}
    >
      {children}
    </div>
  )
}

const apps = [
  { icono: Boxes, nombre: 'Despensa', texto: 'Lo que hay en cámara y lo que cuesta de verdad. Entra el albarán y los escandallos se recalculan solos.' },
  { icono: ChefHat, nombre: 'Cocina', texto: 'Fichas técnicas con gramajes y fotos, escandallos, carta y menú del día.' },
  { icono: ClipboardCheck, nombre: 'Servicio', texto: 'Jornada, ventas, APPCC firmado con PIN y cierre de caja en sesenta segundos.' },
  { icono: CalendarClock, nombre: 'Equipo', texto: 'Cuadrante con turnos partidos, fichaje con un botón y el horario de cada uno en su móvil.' },
  { icono: BarChart3, nombre: 'Negocio', texto: 'Prime cost, desviación de género y dónde se te escapa el margen, listo para la gestoría.' },
  { icono: Store, nombre: 'Competencia', texto: 'Qué cobran los de tu calle, cómo están valorados y dónde estás tú.' },
  { icono: Star, nombre: 'Reseñas', texto: 'Lo que dicen tus clientes, ordenado por tema, con la respuesta ya escrita.' },
  { icono: MessageSquare, nombre: 'Chat', texto: 'La forma oficial de hablar del trabajo, con confirmación de lectura.' },
]

const pasos = [
  ['Dices cómo se llama tu bar', 'Estook lo busca en Google y ya sabe tu dirección, tus horarios, tu valoración y qué locales tienes al lado. Tres minutos y está configurado.'],
  ['Metes lo que compras y lo que vendes', 'Los albaranes entran por foto y la carta se monta arrastrando. Con el formato y el rendimiento, el coste real de cada plato sale solo.'],
  ['Estook te avisa antes de que duela', 'Cuando un proveedor sube el pescado, cuando un plato se queda al 2 % de margen o cuando te caducan dos kilos de merluza el jueves.'],
]

const planes = [
  { nombre: 'Base', precio: '45 €', nota: 'por local y mes, IVA incluido',
    para: 'Un local que quiere dejar de perder dinero sin enterarse.',
    incluye: ['Todas las apps y todos los documentos', 'Fogón: 30 preguntas al día', '60 albaranes por foto al mes', 'Competencia y reseñas cada semana', 'Acceso para la gestoría', 'Ventas por CSV, foto del Z o total del día'] },
  { nombre: 'Pro', precio: '69 €', nota: 'por local y mes, IVA incluido', destacado: true,
    para: 'El que quiere que las ventas entren solas y el cierre esté hecho.',
    incluye: ['Todo lo de Base', 'TPV conectado por API', 'Fogón: 60 preguntas al día', 'Albaranes por foto sin límite', 'Alertas de cambios en la competencia', 'Respuesta propuesta a cada reseña', 'Soporte prioritario'] },
  { nombre: 'Grupo', precio: '55 €', nota: 'por local y mes · de 2 a 3 locales',
    para: 'Dos o tres casas, con los mismos números uno al lado del otro.',
    incluye: ['Todo lo de Pro en cada local', 'Comparativa entre locales', 'Catálogo y recetas compartidos', 'TPV incluido en cada local', 'Soporte prioritario'] },
]

export const PREGUNTAS: [string, string][] = [
  ['¿Qué es Estook?', 'Estook es una aplicación de gestión para bares y restaurantes. Controla el inventario de la cámara, calcula el escandallo y el margen real de cada plato, monta la carta y el menú del día, lleva el cuadrante y los fichajes del equipo, guarda los registros de APPCC y analiza las ventas. Incluye a Fogón, un asistente que vigila el negocio y avisa de lo que va a costar dinero.'],
  ['¿Cuánto cuesta?', 'Hay tres planes por local y mes, con IVA incluido: Base 45 €, Pro 69 € y Grupo 55 € por local para dos o tres locales. Todos llevan todas las apps, todos los documentos y a Fogón; lo que cambia es el volumen y si el TPV entra conectado. Pagando el año por adelantado son dos meses gratis. A partir de cuatro locales, precio a medida.'],
  ['¿Hay prueba gratis?', 'Sí, catorce días. Se pide la forma de pago al empezar y, si no cancelas antes del día quince, se cobra el plan que hayas elegido. Durante la prueba funciona todo, con algún límite de volumen.'],
  ['¿Se conecta con mi TPV?', 'Sí, en los planes Pro y Grupo, mediante una API unificada que soporta las marcas más habituales en España: Ágora, Hosteltáctil, Last.app, Revo, Lightspeed o Square, entre otras. Las ventas entran solas cada quince minutos. En el plan Base las ventas se meten por CSV, por foto del Z o con el total del día.'],
  ['¿Sirve para el APPCC?', 'Sí. Se monta el plan con sus puntos de control, límites y frecuencias, y el equipo lo rellena en dos toques firmando con su PIN. Fuera de rango no se puede seguir sin registrar la acción correctiva. De ahí sale la carpeta de inspección del periodo en PDF.'],
  ['¿Funciona sin cobertura?', 'Sí. Se instala en el móvil como una app y lo que se apunta sin señal (fichajes, mermas, registros de APPCC) se guarda en el teléfono y sube solo al recuperar la conexión, en orden y sin duplicar.'],
  ['¿Qué hace Fogón exactamente?', 'Lee un resumen vivo del negocio (precios, cámara, ventas, cuadrante, reseñas) y avisa por su cuenta en el Panel: qué plato se ha quedado sin margen, qué producto caduca, qué día te sobra personal. Propone y rellena, pero nunca guarda nada solo: la última palabra es tuya.'],
  ['¿Puede verlo todo mi equipo?', 'No, y esa es la idea. Cada rol ve lo suyo: el cocinero ve los gramajes y los pasos sin un solo importe, sala ve el menú y los alérgenos, la gestoría ve los periodos cerrados. Los permisos se ajustan casilla a casilla y se aplican en el servidor, no escondiendo cosas en la pantalla.'],
]

export function Landing() {
  const [pantalla, setPantalla] = useState(0)
  const actual = PANTALLAS[pantalla]
  const Mock = actual.mock

  return (
    <div className="min-h-full bg-lienzo">
      <header className="sticky top-0 z-40 border-b border-borde bg-lienzo/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:px-8">
          <Logotipo conClaim={false} />
          <nav className="hidden items-center gap-6 text-sm font-semibold text-tinta-suave md:flex">
            <a href="#como-funciona" className="hover:text-tinta">Cómo funciona</a>
            <a href="#por-dentro" className="hover:text-tinta">Por dentro</a>
            <a href="#fogon" className="hover:text-tinta">Fogón</a>
            <a href="#precios" className="hover:text-tinta">Precios</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/entrar"><Boton tono="discreto" tamano="pequeno">Entrar</Boton></Link>
            <Link to="/entrar?alta=1" className="hidden md:block"><Boton tamano="pequeno">Probar 14 días</Boton></Link>
          </div>
        </div>
      </header>

      <main>
        {/* 1 · Qué es */}
        <section className="bg-tinta text-white">
          <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-24">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-naranja">
              Software de gestión para bares y restaurantes
            </p>
            <h1 className="mt-4 max-w-3xl font-titulo text-4xl font-semibold leading-[1.1] md:text-6xl">
              Tu cocina, bajo control.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/75">
              Estook sabe lo que tienes en cámara, lo que te cuesta de verdad cada plato y por dónde
              se te está escapando el margen. Y te avisa antes de que el mes se cierre en rojo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/entrar?alta=1"><Boton tamano="grande">Empezar la prueba de 14 días <ArrowRight className="size-4" /></Boton></Link>
              <a href="#por-dentro"><Boton tono="discreto" tamano="grande" className="border-white/20 bg-white/10 text-white hover:bg-white/20">Verla por dentro</Boton></a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/60">
              <span className="flex items-center gap-2"><Smartphone className="size-4 text-naranja" /> Se instala en el móvil</span>
              <span className="flex items-center gap-2"><WifiOff className="size-4 text-naranja" /> Funciona sin cobertura</span>
              <span className="flex items-center gap-2"><FileText className="size-4 text-naranja" /> Documentos con tu logo</span>
            </div>
          </div>
        </section>

        {/* 2 · En qué ayuda */}
        <section className="border-b border-borde bg-panel">
          <div className="mx-auto max-w-[1200px] px-4 py-14 md:px-8">
            <Aparece>
              <h2 className="font-titulo text-2xl font-semibold">Esto pasa en tu bar ahora mismo</h2>
            </Aparece>
            <div className="mt-8 grid gap-8 md:grid-cols-3">
              {[
                ['El pescado subió un 18 %', 'y tú sigues cobrando lo mismo desde marzo. Nadie te avisó, porque nadie lo estaba mirando.'],
                ['Se van dos kilos de merluza', 'y no sabes si fue merma, ración de más o se caducó en la cámara de abajo.'],
                ['El cierre te lleva media hora', 'y aun así, a fin de mes, el inventario no cuadra y no sabes por dónde empezar a buscar.'],
              ].map(([t, s], i) => (
                <Aparece key={t} className={`[transition-delay:${i * 80}ms]`}>
                  <p className="font-titulo text-lg font-semibold">{t}</p>
                  <p className="mt-1 text-tinta-suave">{s}</p>
                </Aparece>
              ))}
            </div>
          </div>
        </section>

        {/* 3 · Cómo funciona */}
        <section id="como-funciona" className="mx-auto max-w-[1200px] px-4 py-16 md:px-8">
          <Aparece>
            <h2 className="font-titulo text-3xl font-semibold">Cómo funciona</h2>
            <p className="mt-3 max-w-2xl text-tinta-suave">
              Tres pasos. El primero tarda tres minutos; los otros dos los hace la app sola mientras
              trabajas.
            </p>
          </Aparece>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {pasos.map(([t, s], i) => (
              <Aparece key={t}>
                <li className="rounded-xl border border-borde bg-lienzo p-6 shadow-tarjeta">
                  <span className="grid size-9 place-items-center rounded-full bg-naranja font-titulo font-bold text-white">{i + 1}</span>
                  <h3 className="mt-4 font-titulo text-lg font-semibold">{t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-tinta-suave">{s}</p>
                </li>
              </Aparece>
            ))}
          </ol>
        </section>

        {/* 4 · Por dentro (recorrido con mockups) */}
        <section id="por-dentro" className="border-y border-borde bg-panel">
          <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-20">
            <Aparece>
              <h2 className="font-titulo text-3xl font-semibold">La app por dentro</h2>
              <p className="mt-3 max-w-2xl text-tinta-suave">
                Toca cada apartado y verás qué hace y cómo se ve en el móvil.
              </p>
            </Aparece>

            <div className="mt-8 flex flex-wrap gap-2">
              {PANTALLAS.map((p, i) => (
                <button
                  key={p.clave}
                  onClick={() => setPantalla(i)}
                  aria-pressed={pantalla === i}
                  className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
                    pantalla === i
                      ? 'border-naranja bg-naranja text-white'
                      : 'border-borde bg-lienzo text-tinta-suave hover:bg-naranja-suave'}`}
                >
                  {p.nombre}
                </button>
              ))}
            </div>

            <div className="mt-8 grid items-center gap-10 md:grid-cols-2">
              <div>
                <h3 className="font-titulo text-2xl font-semibold">{actual.titulo}</h3>
                <p className="mt-3 leading-relaxed text-tinta-suave">{actual.texto}</p>
                <Link to="/entrar?alta=1" className="mt-6 inline-block">
                  <Boton>Probarlo con mis números <ArrowRight className="size-4" /></Boton>
                </Link>
              </div>
              <div key={actual.clave} className="animate-subirCorto">
                <Mock />
              </div>
            </div>
          </div>
        </section>

        {/* 5 · Las apps */}
        <section className="mx-auto max-w-[1200px] px-4 py-16 md:px-8">
          <Aparece>
            <h2 className="font-titulo text-3xl font-semibold">Ocho apps, los mismos datos</h2>
            <p className="mt-3 max-w-2xl text-tinta-suave">
              Cada una controla su parcela. Lo que pasa en una lo saben todas: entra un precio nuevo
              y el margen de tus platos cambia solo, sin que toques nada.
            </p>
          </Aparece>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {apps.map(({ icono: Icono, nombre, texto }) => (
              <Aparece key={nombre}>
                <article className="h-full rounded-lg border border-borde bg-lienzo p-5 shadow-tarjeta">
                  <Icono className="size-6 text-naranja" aria-hidden />
                  <h3 className="mt-3 font-titulo text-base font-semibold uppercase tracking-wide">{nombre}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-tinta-suave">{texto}</p>
                </article>
              </Aparece>
            ))}
          </div>
        </section>

        {/* 6 · Fogón */}
        <section id="fogon" className="border-y border-borde bg-tinta text-white">
          <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-16 md:grid-cols-2 md:px-8">
            <Aparece>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-naranja">Fogón</p>
              <h2 className="mt-3 font-titulo text-3xl font-semibold">El asistente de tu cocina</h2>
              <p className="mt-4 leading-relaxed text-white/70">
                No es un chat pegado al lado. Fogón mira el negocio entero — precios, cámara, ventas,
                cuadrante, reseñas — y avisa por su cuenta de lo que va a doler. Propone, rellena y te
                deja a ti la última palabra: nunca guarda nada solo.
              </p>
              <p className="mt-4 leading-relaxed text-white/70">
                Y habla distinto según con quién: al cocinero le cuenta sus tareas y sus caducidades,
                sin un solo importe; a ti te cuenta el dinero.
              </p>
            </Aparece>
            <div className="flex flex-col gap-3">
              {[
                ['El rabo de toro te deja un 2 % de margen', 'Sus ingredientes han subido un 14 % desde marzo y el precio sigue igual.'],
                ['Quedan 2,1 kg de merluza que caducan el 19', 'Y hoy no está en el menú. ¿La meto de segundo?'],
                ['El martes es tu día más flojo desde junio', 'Te sobran dos horas de sala en el cuadrante.'],
              ].map(([t, s]) => (
                <Aparece key={t}>
                  <div className="rounded-lg bg-white p-4 text-tinta">
                    <div className="flex items-start gap-3">
                      <Isotipo className="size-5 shrink-0 text-tinta" />
                      <div>
                        <p className="text-sm font-semibold">{t}</p>
                        <p className="mt-0.5 text-sm text-tinta-suave">{s}</p>
                      </div>
                    </div>
                  </div>
                </Aparece>
              ))}
            </div>
          </div>
        </section>

        {/* 7 · Documentos */}
        <section className="mx-auto max-w-[1200px] px-4 py-16 md:px-8">
          <Aparece>
            <h2 className="font-titulo text-3xl font-semibold">Los papeles, hechos</h2>
            <p className="mt-3 max-w-2xl text-tinta-suave">
              Se generan donde están los datos, con tu logo y tu color, y se mandan por WhatsApp o
              correo desde el móvil. Cada uno queda guardado con su fecha: vuelves al de marzo y sale
              idéntico aunque los precios hayan cambiado tres veces.
            </p>
          </Aparece>
          <div className="mt-8 flex flex-wrap gap-2">
            {['Carta completa', 'Menú del día', 'Ficha técnica', 'Escandallo', 'Horario semanal', 'Parte de APPCC',
              'Carpeta de inspección', 'Inventario valorado', 'Hoja de recuento', 'Pedido al proveedor',
              'Cierre de caja', 'Resumen del mes', 'Informe para la gestoría', 'Listado de alérgenos'].map((d) => (
              <span key={d} className="rounded border border-borde bg-panel px-3 py-1.5 text-sm font-medium text-tinta-suave">{d}</span>
            ))}
          </div>
        </section>

        {/* 8 · Precios */}
        <section id="precios" className="border-t border-borde bg-panel">
          <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-20">
            <Aparece>
              <h2 className="font-titulo text-3xl font-semibold">Precios claros</h2>
              <p className="mt-3 text-tinta-suave">
                Por local y mes, IVA incluido, con dispositivos ilimitados. Todos los planes llevan
                todas las apps, todos los documentos y a Fogón. Lo que cambia es el volumen.
              </p>
            </Aparece>
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {planes.map((p) => (
                <Aparece key={p.nombre}>
                  <article className={`flex h-full flex-col rounded-xl border bg-lienzo p-6 shadow-tarjeta ${p.destacado ? 'border-naranja ring-1 ring-naranja' : 'border-borde'}`}>
                    {p.destacado && (
                      <span className="mb-3 w-fit rounded bg-naranja-suave px-2 py-1 text-xs font-bold uppercase tracking-wide text-naranja-oscuro">
                        El más elegido
                      </span>
                    )}
                    <h3 className="font-titulo text-xl font-semibold uppercase tracking-wide">{p.nombre}</h3>
                    <p className="cifras mt-3 font-titulo text-4xl font-semibold">{p.precio}</p>
                    <p className="mt-1 text-xs text-tinta-tenue">{p.nota}</p>
                    <p className="mt-4 text-sm text-tinta-suave">{p.para}</p>
                    <ul className="mt-5 flex flex-1 flex-col gap-2">
                      {p.incluye.map((i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <Check className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden /><span>{i}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to="/entrar?alta=1" className="mt-6">
                      <Boton ancho tono={p.destacado ? 'principal' : 'secundario'}>Probar 14 días</Boton>
                    </Link>
                  </article>
                </Aparece>
              ))}
            </div>
            <p className="mt-6 text-sm text-tinta-suave">
              Pagando el año por adelantado, dos meses gratis. Más de tres locales, lo hablamos:
              integración con tu ERP, informes propios y responsable asignado.
            </p>
          </div>
        </section>

        {/* 9 · Preguntas (y comida para buscadores e IA) */}
        <section id="preguntas" className="mx-auto max-w-[820px] px-4 py-16 md:px-8">
          <Aparece>
            <h2 className="font-titulo text-3xl font-semibold">Preguntas frecuentes</h2>
          </Aparece>
          <div className="mt-8 flex flex-col gap-3">
            {PREGUNTAS.map(([p, r]) => (
              <details key={p} className="group rounded-lg border border-borde bg-lienzo p-4 open:shadow-tarjeta">
                <summary className="cursor-pointer list-none font-titulo font-semibold marker:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {p}
                    <span className="text-naranja transition-transform group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-tinta-suave">{r}</p>
              </details>
            ))}
          </div>
        </section>

        {/* 10 · Cierre */}
        <section className="bg-tinta text-white">
          <div className="mx-auto max-w-[1200px] px-4 py-16 text-center md:px-8">
            <h2 className="font-titulo text-3xl font-semibold">Catorce días para verlo con tus números</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/70">
              Se configura en tres minutos: dices cómo se llama tu bar y Estook ya sabe qué cocinas,
              qué dicen tus clientes y quién tienes al lado.
            </p>
            <Link to="/entrar?alta=1" className="mt-8 inline-block">
              <Boton tamano="grande">Empezar ahora <ArrowRight className="size-4" /></Boton>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-borde bg-lienzo">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-8 text-sm text-tinta-tenue md:flex-row md:items-center md:justify-between md:px-8">
          <Logotipo />
          <p>Estook · gestión para bares y restaurantes · hecho para quien está de pie doce horas al día.</p>
        </div>
      </footer>
    </div>
  )
}
