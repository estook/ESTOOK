import { Link } from 'react-router-dom'
import {
  BarChart3, Boxes, CalendarClock, ChefHat, ClipboardCheck, FileText,
  MessageSquare, Star, Store, Check, ArrowRight, Smartphone, WifiOff,
} from 'lucide-react'
import { Logotipo, Isotipo } from '@/marca/Logo'
import { Boton } from '@/componentes/Boton'

const apps = [
  { icono: Boxes, nombre: 'Despensa', texto: 'Lo que hay en cámara y lo que cuesta de verdad. Entra el albarán por foto y los escandallos se recalculan solos.' },
  { icono: ChefHat, nombre: 'Cocina', texto: 'Fichas técnicas con gramajes y fotos, escandallos, carta y menú del día. El cocinero las ve sin un solo importe.' },
  { icono: ClipboardCheck, nombre: 'Servicio', texto: 'Jornada, ventas, APPCC firmado con PIN y cierre de caja en cuatro pasos y sesenta segundos.' },
  { icono: CalendarClock, nombre: 'Equipo', texto: 'Cuadrante con turnos partidos, fichaje con un botón y el horario de cada uno en su móvil al publicarlo.' },
  { icono: BarChart3, nombre: 'Negocio', texto: 'Prime cost, desviación de género y dónde se te escapa el margen. Con la exportación lista para la gestoría.' },
  { icono: Store, nombre: 'Competencia', texto: 'Qué cobran los de tu calle, cómo están valorados y dónde estás tú. Sin salir a preguntar.' },
  { icono: Star, nombre: 'Reseñas', texto: 'Lo que dicen tus clientes, ordenado por tema, con la respuesta ya escrita para que la mandes tú.' },
  { icono: MessageSquare, nombre: 'Chat', texto: 'La forma oficial de hablar del trabajo, con confirmación de lectura. Se acabó el "a mí nadie me dijo nada".' },
]

const planes = [
  {
    nombre: 'Base', precio: '45 €', nota: 'por local y mes, IVA incluido',
    para: 'Un local que quiere dejar de perder dinero sin enterarse.',
    incluye: ['Todas las apps y todos los documentos', 'Fogón: 30 preguntas al día', '60 albaranes por foto al mes', 'Competencia y reseñas cada semana', 'Acceso para la gestoría', 'Ventas por CSV, foto del Z o total del día'],
  },
  {
    nombre: 'Pro', precio: '69 €', nota: 'por local y mes, IVA incluido', destacado: true,
    para: 'El que quiere que las ventas entren solas y el cierre esté hecho.',
    incluye: ['Todo lo de Base', 'TPV conectado por API', 'Fogón: 60 preguntas al día', 'Albaranes por foto sin límite', 'Alertas de cambios en la competencia', 'Respuesta propuesta a cada reseña', 'Soporte prioritario'],
  },
  {
    nombre: 'Grupo', precio: '55 €', nota: 'por local y mes · de 2 a 3 locales',
    para: 'Dos o tres casas, con los mismos números uno al lado del otro.',
    incluye: ['Todo lo de Pro en cada local', 'Comparativa entre locales', 'Catálogo y recetas compartidos', 'TPV incluido en cada local', 'Soporte prioritario'],
  },
]

export function Landing() {
  return (
    <div className="min-h-full bg-lienzo">
      {/* Cabecera */}
      <header className="sticky top-0 z-40 border-b border-borde bg-lienzo/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:px-8">
          <Logotipo conClaim={false} />
          <nav className="hidden items-center gap-6 text-sm font-semibold text-tinta-suave md:flex">
            <a href="#apps" className="hover:text-tinta">Qué hace</a>
            <a href="#fogon" className="hover:text-tinta">Fogón</a>
            <a href="#planes" className="hover:text-tinta">Precios</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/entrar"><Boton tono="discreto" tamano="pequeno">Entrar</Boton></Link>
            <Link to="/entrar?alta=1" className="hidden md:block">
              <Boton tamano="pequeno">Probar 14 días</Boton>
            </Link>
          </div>
        </div>
      </header>

      {/* Portada */}
      <section className="bg-tinta text-white">
        <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-naranja">Para bares y restaurantes</p>
          <h1 className="mt-4 max-w-3xl font-titulo text-4xl font-semibold leading-[1.1] md:text-6xl">
            Tu cocina, bajo control.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/70">
            Estook sabe lo que tienes en cámara, lo que te cuesta cada plato y lo que se te está
            escapando por el desagüe. Y te avisa antes de que el mes se cierre en rojo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/entrar?alta=1"><Boton tamano="grande">Empezar la prueba de 14 días <ArrowRight className="size-4" /></Boton></Link>
            <a href="#apps"><Boton tono="discreto" tamano="grande" className="border-white/20 bg-white/10 text-white hover:bg-white/20">Ver qué hace</Boton></a>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/60">
            <span className="flex items-center gap-2"><Smartphone className="size-4 text-naranja" /> Se instala en el móvil</span>
            <span className="flex items-center gap-2"><WifiOff className="size-4 text-naranja" /> Funciona sin cobertura</span>
            <span className="flex items-center gap-2"><FileText className="size-4 text-naranja" /> Documentos con tu logo</span>
          </div>
        </div>
      </section>

      {/* El problema */}
      <section className="border-b border-borde bg-panel">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-14 md:grid-cols-3 md:px-8">
          {[
            ['El pescado subió un 18 %', 'y tú sigues cobrando lo mismo desde marzo.'],
            ['Se van 2 kg de merluza', 'y nadie sabe si fue merma, ración de más o se caducó.'],
            ['El cierre te lleva media hora', 'y aún así el inventario no cuadra a fin de mes.'],
          ].map(([t, s]) => (
            <div key={t}>
              <p className="font-titulo text-lg font-semibold">{t}</p>
              <p className="mt-1 text-tinta-suave">{s}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Las apps */}
      <section id="apps" className="mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-20">
        <h2 className="font-titulo text-3xl font-semibold">Ocho apps, los mismos datos</h2>
        <p className="mt-3 max-w-2xl text-tinta-suave">
          Cada una controla su parcela y enseña hasta el último detalle de lo suyo. Lo que pasa en
          una, lo saben todas: entra un precio nuevo y el margen de tus platos cambia solo.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {apps.map(({ icono: Icono, nombre, texto }) => (
            <article key={nombre} className="rounded-lg border border-borde bg-lienzo p-5 shadow-tarjeta">
              <Icono className="size-6 text-naranja" aria-hidden />
              <h3 className="mt-3 font-titulo text-base font-semibold uppercase tracking-wide">{nombre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-tinta-suave">{texto}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Fogón */}
      <section id="fogon" className="border-y border-borde bg-panel">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-16 md:grid-cols-2 md:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-naranja">Fogón</p>
            <h2 className="mt-3 font-titulo text-3xl font-semibold">El asistente de tu cocina</h2>
            <p className="mt-4 leading-relaxed text-tinta-suave">
              No es un chat pegado al lado. Fogón mira tu negocio entero — precios, cámara,
              ventas, cuadrante, reseñas — y te avisa por su cuenta de lo que va a doler. Propone,
              rellena y te deja a ti la última palabra: nunca guarda nada solo.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {[
              ['El rabo de toro te deja un 2 % de margen', 'Sus ingredientes han subido un 14 % desde marzo y el precio sigue igual.'],
              ['Quedan 2,1 kg de merluza que caducan el 19', 'Y hoy no está en el menú. ¿La meto de segundo?'],
              ['El martes es tu día más flojo desde junio', 'Te sobran dos horas de sala en el cuadrante.'],
            ].map(([t, s]) => (
              <div key={t} className="rounded-lg border border-borde bg-lienzo p-4 shadow-tarjeta">
                <div className="flex items-start gap-3">
                  <Isotipo className="size-5 shrink-0 text-tinta" />
                  <div>
                    <p className="text-sm font-semibold">{t}</p>
                    <p className="mt-0.5 text-sm text-tinta-suave">{s}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Documentos */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 md:px-8">
        <h2 className="font-titulo text-3xl font-semibold">Los papeles, hechos</h2>
        <p className="mt-3 max-w-2xl text-tinta-suave">
          Se generan donde están los datos, con tu logo y tu color, y se mandan por WhatsApp o
          correo desde el móvil. Cada uno queda guardado con su fecha: vuelves al de marzo y sale
          idéntico aunque los precios hayan cambiado tres veces.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          {['Carta completa', 'Menú del día', 'Ficha técnica', 'Escandallo', 'Horario semanal', 'Parte de APPCC', 'Carpeta de inspección', 'Inventario valorado', 'Pedido al proveedor', 'Cierre de caja', 'Resumen del mes', 'Informe para la gestoría'].map((d) => (
            <span key={d} className="rounded border border-borde bg-panel px-3 py-1.5 text-sm font-medium text-tinta-suave">{d}</span>
          ))}
        </div>
      </section>

      {/* Planes */}
      <section id="planes" className="border-t border-borde bg-panel">
        <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-20">
          <h2 className="font-titulo text-3xl font-semibold">Precios claros</h2>
          <p className="mt-3 text-tinta-suave">
            Por local y mes, con dispositivos ilimitados. Todos los planes llevan todas las apps,
            todos los documentos y a Fogón. Lo que cambia es el volumen.
          </p>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {planes.map((p) => (
              <article
                key={p.nombre}
                className={`flex flex-col rounded-xl border bg-lienzo p-6 ${p.destacado ? 'border-naranja shadow-tarjeta ring-1 ring-naranja' : 'border-borde shadow-tarjeta'}`}
              >
                {p.destacado && (
                  <span className="mb-3 w-fit rounded bg-naranja-suave px-2 py-1 text-xs font-bold uppercase tracking-wide text-naranja-oscuro">
                    El más elegido
                  </span>
                )}
                <h3 className="font-titulo text-xl font-semibold uppercase tracking-wide">{p.nombre}</h3>
                <p className="mt-3 flex items-baseline gap-2">
                  <span className="cifras font-titulo text-4xl font-semibold">{p.precio}</span>
                </p>
                <p className="mt-1 text-xs text-tinta-tenue">{p.nota}</p>
                <p className="mt-4 text-sm text-tinta-suave">{p.para}</p>
                <ul className="mt-5 flex flex-1 flex-col gap-2">
                  {p.incluye.map((i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/entrar?alta=1" className="mt-6">
                  <Boton ancho tono={p.destacado ? 'principal' : 'secundario'}>Probar 14 días</Boton>
                </Link>
              </article>
            ))}
          </div>
          <p className="mt-6 text-sm text-tinta-suave">
            Pagando el año por adelantado, dos meses gratis. Más de tres locales, lo hablamos:
            integración con tu ERP, informes propios y responsable asignado.
          </p>
        </div>
      </section>

      {/* Cierre */}
      <section className="bg-tinta text-white">
        <div className="mx-auto max-w-[1200px] px-4 py-16 text-center md:px-8">
          <h2 className="font-titulo text-3xl font-semibold">Catorce días para verlo con tus números</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Se configura en tres minutos: dices cómo se llama tu bar y Estook ya sabe qué cocinas,
            qué te dicen tus clientes y quién tienes al lado.
          </p>
          <Link to="/entrar?alta=1" className="mt-8 inline-block">
            <Boton tamano="grande">Empezar ahora <ArrowRight className="size-4" /></Boton>
          </Link>
        </div>
      </section>

      <footer className="border-t border-borde bg-lienzo">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-8 text-sm text-tinta-tenue md:flex-row md:items-center md:justify-between md:px-8">
          <Logotipo />
          <p>Estook · Hecho para quien está de pie doce horas al día.</p>
        </div>
      </footer>
    </div>
  )
}
