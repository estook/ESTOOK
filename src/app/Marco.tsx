import { useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Bell, ChevronDown, Grid2x2, LayoutDashboard, LogOut, MessageSquare, Settings, Sparkles } from 'lucide-react'
import { Isotipo } from '@/marca/Logo'
import { Cargando, Insignia } from '@/componentes/Estado'
import { APPS, Rueda } from '@/componentes/Rueda'
import { useSesion } from '@/app/sesion'
import { Fogon } from '@/componentes/Fogon'

const NOMBRE_PLAN: Record<string, string> = {
  prueba: 'Prueba', base: 'Base', pro: 'Pro', grupo: 'Grupo', a_medida: 'A medida',
}

export function Marco() {
  const { cargando, sesion, actual, accesos, elegirLocal, salir } = useSesion()
  const [rueda, setRueda] = useState(false)
  const [fogon, setFogon] = useState(false)
  const { pathname } = useLocation()

  if (cargando) return <div className="grid min-h-full place-items-center"><Cargando texto="Abriendo tu local" /></div>
  if (!sesion) return <Navigate to="/entrar" replace />

  return (
    <div className="flex min-h-full flex-col bg-panel">
      {/* ---------- Ordenador: barra superior con todo a la vista ---------- */}
      <header className="sticky top-0 z-30 border-b border-borde bg-lienzo">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-4 px-4 md:px-6">
          <Link to="/app" className="flex items-center gap-2">
            <Isotipo className="size-7 text-tinta" />
          </Link>

          {accesos.length > 1 ? (
            <div className="relative">
              <select
                aria-label="Cambiar de local"
                className="h-9 appearance-none rounded-md border border-borde bg-lienzo pl-2 pr-7 text-sm font-semibold"
                value={actual?.local_id ?? ''}
                onChange={(e) => elegirLocal(e.target.value)}
              >
                {accesos.map((a) => <option key={a.local_id} value={a.local_id}>{a.local}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2.5 size-4 text-tinta-tenue" aria-hidden />
            </div>
          ) : (
            <span className="truncate font-titulo text-sm font-semibold uppercase tracking-wide">
              {actual?.local ?? 'Sin local'}
            </span>
          )}

          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            <NavLink to="/app" end className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-semibold ${isActive ? 'bg-naranja-suave text-naranja-oscuro' : 'text-tinta-suave hover:bg-panel'}`}>
              Panel
            </NavLink>
            {APPS.map((a) => (
              <NavLink key={a.clave} to={a.ruta} className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-semibold ${isActive ? 'bg-naranja-suave text-naranja-oscuro' : 'text-tinta-suave hover:bg-panel'}`}>
                {a.nombre}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {actual && <Insignia tono="naranja">{NOMBRE_PLAN[actual.plan] ?? actual.plan}</Insignia>}
            <button aria-label="Notificaciones" className="grid size-9 place-items-center rounded-md text-tinta-suave hover:bg-panel">
              <Bell className="size-5" aria-hidden />
            </button>
            <button
              onClick={() => setFogon(true)}
              className="hidden h-9 items-center gap-2 rounded-md bg-tinta px-3 text-sm font-semibold text-white md:flex"
            >
              <Sparkles className="size-4" aria-hidden /> Fogón
            </button>
            <button onClick={() => void salir()} aria-label="Salir"
              className="grid size-9 place-items-center rounded-md text-tinta-suave hover:bg-panel">
              <LogOut className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-24 pt-4 md:px-6 md:pb-10">
        <Outlet />
      </main>

      {/* ---------- Móvil: tres sitios y la rueda ---------- */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-borde bg-lienzo pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="mx-auto flex h-16 max-w-md items-center justify-around px-4">
          <Link to="/app" className={`flex flex-col items-center gap-0.5 text-[11px] font-semibold ${pathname === '/app' ? 'text-naranja' : 'text-tinta-tenue'}`}>
            <LayoutDashboard className="size-5" aria-hidden /> Panel
          </Link>

          <button
            onClick={() => setRueda(true)}
            aria-label="Apps de Estook"
            className="-mt-8 grid size-16 place-items-center rounded-full bg-naranja text-white shadow-flotante"
          >
            <Grid2x2 className="size-7" aria-hidden />
          </button>

          <Link to="/app/ajustes" className={`flex flex-col items-center gap-0.5 text-[11px] font-semibold ${pathname.includes('ajustes') ? 'text-naranja' : 'text-tinta-tenue'}`}>
            <Settings className="size-5" aria-hidden /> Ajustes
          </Link>
        </div>
      </nav>

      {/* Fogón, en todas las pantallas */}
      <button
        onClick={() => setFogon(true)}
        aria-label="Preguntar a Fogón"
        className="fixed bottom-24 right-4 z-40 grid size-12 place-items-center rounded-full bg-tinta text-white shadow-tarjeta lg:hidden"
      >
        <MessageSquare className="size-5" aria-hidden />
      </button>

      <Rueda abierta={rueda} apps={APPS} onCerrar={() => setRueda(false)} />
      <Fogon abierto={fogon} onCerrar={() => setFogon(false)} pantalla={pathname} />
    </div>
  )
}
