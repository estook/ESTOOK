import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Logotipo } from '@/marca/Logo'
import { Boton } from '@/componentes/Boton'
import { MenuMovil } from '@/paginas/MenuMovil'
import { ProgresoDeLectura } from '@/paginas/efectos'

export const PAGINAS = [
  { ruta: '/producto', texto: 'La aplicación' },
  { ruta: '/fogon', texto: 'Tu asistente' },
  { ruta: '/precios', texto: 'Precios' },
]

/** Cabecera, pie y navegación de la web pública. */
export function MarcoWeb({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col overflow-x-hidden bg-lienzo">
      <ProgresoDeLectura />

      <header className="sticky top-0 z-40 border-b border-borde/70 bg-lienzo/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:px-8">
          <Link to="/" aria-label="Estook"><Logotipo conClaim={false} /></Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-tinta-suave md:flex">
            {PAGINAS.map((p) => (
              <NavLink key={p.ruta} to={p.ruta}
                className={({ isActive }) =>
                  `group relative py-1 transition-colors hover:text-tinta ${isActive ? 'text-tinta' : ''}`}>
                {({ isActive }) => (
                  <>
                    {p.texto}
                    <span className={`absolute inset-x-0 -bottom-0.5 h-0.5 origin-left rounded-full bg-naranja transition-transform duration-300 ease-estook ${
                      isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
                  </>
                )}
              </NavLink>
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

      <main className="flex-1">{children}</main>

      <CierreWeb />
      <MenuMovil />

      <footer className="border-t border-borde bg-lienzo pb-24 md:pb-0">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-12 md:grid-cols-[1.2fr_1fr_1fr] md:px-8">
          <div>
            <Logotipo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-tinta-tenue">
              Plataforma de gestión para bares y restaurantes. Inventario, costes, equipo,
              documentación y control sanitario en una sola aplicación.
            </p>
          </div>
          <nav className="flex flex-col gap-2 text-sm">
            <p className="mb-1 font-titulo text-xs font-semibold uppercase tracking-wide text-tinta-tenue">
              Producto
            </p>
            {PAGINAS.map((p) => (
              <Link key={p.ruta} to={p.ruta} className="text-tinta-suave hover:text-tinta">{p.texto}</Link>
            ))}
          </nav>
          <nav className="flex flex-col gap-2 text-sm">
            <p className="mb-1 font-titulo text-xs font-semibold uppercase tracking-wide text-tinta-tenue">
              Acceso
            </p>
            <Link to="/entrar" className="text-tinta-suave hover:text-tinta">Entrar</Link>
            <Link to="/entrar?alta=1" className="text-tinta-suave hover:text-tinta">Crear cuenta</Link>
          </nav>
        </div>
        <div className="border-t border-borde">
          <p className="mx-auto max-w-[1200px] px-4 py-5 text-xs text-tinta-tenue md:px-8">
            © {new Date().getFullYear()} Estook · Tu cocina, bajo control.
          </p>
        </div>
      </footer>
    </div>
  )
}

/** La llamada final, igual en todas las páginas. */
function CierreWeb() {
  return (
    <section className="relative overflow-hidden bg-tinta text-white">
      <div className="pointer-events-none absolute left-1/2 top-0 size-[460px] -translate-x-1/2 rounded-full bg-naranja/20 blur-[130px]" />
      <div className="relative mx-auto max-w-[860px] px-4 py-20 text-center md:px-8">
        <h2 className="font-titulo text-3xl font-semibold leading-tight md:text-[2.6rem]">
          Pruébalo catorce días con tus propios números
        </h2>
        <p className="mx-auto mt-4 max-w-lg leading-relaxed text-white/70">
          La puesta en marcha lleva tres minutos. A partir de ahí, la aplicación trabaja con los datos
          reales de tu establecimiento.
        </p>
        <Link to="/entrar?alta=1" className="mt-8 inline-flex">
          <Boton tamano="grande">Empezar ahora <ArrowRight className="size-4" /></Boton>
        </Link>
        <p className="mt-4 text-xs text-white/40">
          Se solicita método de pago. Cancelable durante la prueba.
        </p>
      </div>
    </section>
  )
}

/** Cabecera de página interior. */
export function CabeceraPagina({
  seccion, titulo, entrada,
}: { seccion: string; titulo: string; entrada: string }) {
  return (
    <section className="relative overflow-hidden bg-tinta text-white">
      <div className="pointer-events-none absolute -left-32 -top-32 size-[420px] rounded-full bg-naranja/20 blur-[120px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse at 20% 0%, black, transparent 70%)',
        }}
      />
      <div className="relative mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-naranja">{seccion}</p>
        <h1 className="mt-4 max-w-3xl font-titulo text-[2.2rem] font-semibold leading-[1.1] md:text-[3.2rem]">
          {titulo}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/70">{entrada}</p>
      </div>
    </section>
  )
}
