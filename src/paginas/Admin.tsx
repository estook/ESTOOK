import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Building2, ChevronLeft, LineChart, MessageSquare, ShieldCheck, Users } from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { Campo } from '@/componentes/Campo'
import { Aviso, Cargando, Insignia } from '@/componentes/Estado'
import { Logotipo } from '@/marca/Logo'
import { useSesion } from '@/app/sesion'
import { exigirSupabase } from '@/datos/supabase'
import { euros } from '@/datos/despensa'

interface CuentaAdmin {
  id: string
  nombre: string
  plan: string
  estado_pago: string
  creado_en: string
  prueba_termina_en: string | null
  metodo_pago_puesto: boolean
  locales_contratados: number
  precio_por_local: number | null
  locales_activos: number
  personas: number
  coste_ia_mes: number
  coste_apis_mes: number
}

const PRECIOS: Record<string, number> = { prueba: 0, base: 45, pro: 69, grupo: 55, a_medida: 50 }

function useSoyAdmin() {
  return useQuery({
    queryKey: ['soy-admin'],
    queryFn: async () => {
      const { data, error } = await exigirSupabase().rpc('soy_admin')
      if (error) return false
      return Boolean(data)
    },
  })
}

function useCuentas() {
  return useQuery({
    queryKey: ['admin-cuentas'],
    queryFn: async () => {
      const { data, error } = await exigirSupabase()
        .from('admin_cuentas').select('*').order('creado_en', { ascending: false })
      if (error) throw error
      return (data ?? []) as CuentaAdmin[]
    },
  })
}

function useConsumoDiario() {
  return useQuery({
    queryKey: ['admin-consumo'],
    queryFn: async () => {
      const { data, error } = await exigirSupabase()
        .from('admin_consumo_diario').select('*').order('dia')
      if (error) throw error
      return (data ?? []) as { dia: string; cuenta_id: string; coste_ia: number; llamadas: number }[]
    },
  })
}

export function Admin() {
  const { sesion, cargando } = useSesion()
  const { data: esAdmin, isLoading } = useSoyAdmin()
  const [pestana, setPestana] = useState<'panel' | 'clientes' | 'asistencia'>('panel')

  if (cargando || isLoading) return <div className="grid min-h-full place-items-center"><Cargando /></div>
  if (!sesion) return <Navigate to="/entrar" replace />

  if (!esAdmin) {
    return (
      <div className="mx-auto max-w-md p-8">
        <Aviso nivel="urgente" titulo="Esta zona es solo para administradores de Estook">
          Si deberías tener acceso, hay que darte de alta en la tabla de administradores.
        </Aviso>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-panel">
      <header className="border-b border-borde bg-lienzo">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-4 px-4 md:px-8">
          <Logotipo conClaim={false} />
          <Insignia tono="naranja"><ShieldCheck className="size-3.5" aria-hidden /> Administración</Insignia>
          <a href="#/app" className="ml-auto flex items-center gap-1 text-sm font-semibold text-tinta-suave hover:text-tinta">
            <ChevronLeft className="size-4" aria-hidden /> Volver a la app
          </a>
        </div>
        <nav className="mx-auto flex max-w-[1200px] gap-1 px-4 md:px-8">
          {([['panel', 'Panel', LineChart], ['clientes', 'Clientes', Users], ['asistencia', 'Asistencia', MessageSquare]] as const)
            .map(([k, n, I]) => (
              <button key={k} onClick={() => setPestana(k)}
                className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold ${
                  pestana === k ? 'border-naranja text-naranja-oscuro' : 'border-transparent text-tinta-suave hover:text-tinta'}`}>
                <I className="size-4" aria-hidden /> {n}
              </button>
            ))}
        </nav>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-6 md:px-8">
        {pestana === 'panel' && <PanelAdmin />}
        {pestana === 'clientes' && <Clientes />}
        {pestana === 'asistencia' && <Asistencia />}
      </main>
    </div>
  )
}

function PanelAdmin() {
  const { data: cuentas, isLoading } = useCuentas()
  const { data: consumo } = useConsumoDiario()

  const cifras = useMemo(() => {
    const lista = cuentas ?? []
    const pagando = lista.filter((c) => c.plan !== 'prueba' && c.estado_pago === 'al_dia')
    const ingresos = pagando.reduce((s, c) => {
      const precio = c.precio_por_local ?? PRECIOS[c.plan] ?? 0
      return s + precio * Math.max(1, c.locales_activos)
    }, 0)
    const costeIa = lista.reduce((s, c) => s + Number(c.coste_ia_mes ?? 0), 0)
    const costeApis = lista.reduce((s, c) => s + Number(c.coste_apis_mes ?? 0), 0)
    return {
      clientes: lista.length,
      pagando: pagando.length,
      pruebas: lista.filter((c) => c.plan === 'prueba').length,
      locales: lista.reduce((s, c) => s + c.locales_activos, 0),
      ingresos, costeIa, costeApis,
      margen: ingresos - costeIa - costeApis,
    }
  }, [cuentas])

  const porDia = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const f of consumo ?? []) mapa.set(f.dia, (mapa.get(f.dia) ?? 0) + Number(f.coste_ia))
    return [...mapa.entries()].sort().slice(-30)
  }, [consumo])

  const maximo = Math.max(0.001, ...porDia.map(([, v]) => v))

  if (isLoading) return <Cargando texto="Leyendo el negocio" />

  return (
    <div className="flex flex-col gap-5">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Ingresos del mes', euros(cifras.ingresos), `${cifras.pagando} cuentas pagando`],
          ['Coste de IA', euros(cifras.costeIa, 3), 'Lo que va del mes'],
          ['Coste de APIs', euros(cifras.costeApis, 3), 'Google, correo y demás'],
          ['Margen', euros(cifras.margen), 'Antes de fijos y Stripe'],
        ].map(([t, v, o]) => (
          <div key={t} className="rounded-xl border border-borde bg-lienzo p-4">
            <p className="text-xs font-semibold uppercase leading-tight tracking-wide text-tinta-tenue">{t}</p>
            <p className="cifras mt-1 font-titulo text-2xl font-semibold">{v}</p>
            <p className="mt-0.5 text-[11px] leading-tight text-tinta-tenue">{o}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-borde bg-lienzo p-4">
        <h2 className="font-titulo text-sm font-semibold uppercase tracking-wide">Gasto de IA por día</h2>
        <p className="text-xs text-tinta-tenue">Últimos 30 días, todas las cuentas. Tope diario: 35 €.</p>
        {porDia.length === 0 ? (
          <p className="mt-4 text-sm text-tinta-suave">Todavía no hay consumo registrado.</p>
        ) : (
          <div className="mt-4 flex h-40 items-end gap-1">
            {porDia.map(([dia, valor]) => (
              <div key={dia} className="group flex-1" title={`${dia}: ${valor.toFixed(4)} €`}>
                <div
                  className="w-full rounded-t bg-naranja transition-colors group-hover:bg-naranja-oscuro"
                  style={{ height: `${Math.max(3, (valor / maximo) * 100)}%` }}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ['Clientes', String(cifras.clientes)],
          ['En prueba', String(cifras.pruebas)],
          ['Locales activos', String(cifras.locales)],
        ].map(([t, v]) => (
          <div key={t} className="rounded-xl border border-borde bg-lienzo p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-tinta-tenue">{t}</p>
            <p className="cifras mt-1 font-titulo text-xl font-semibold">{v}</p>
          </div>
        ))}
      </section>
    </div>
  )
}

function Clientes() {
  const { data: cuentas, isLoading, refetch } = useCuentas()
  const [abierta, setAbierta] = useState<CuentaAdmin | null>(null)
  const [locales, setLocales] = useState('')
  const [precio, setPrecio] = useState('')
  const [guardando, setGuardando] = useState(false)

  if (isLoading) return <Cargando />

  async function guardar() {
    if (!abierta) return
    setGuardando(true)
    await exigirSupabase().from('cuentas').update({
      locales_contratados: locales ? Number(locales) : null,
      precio_por_local: precio ? Number(precio.replace(',', '.')) : null,
    }).eq('id', abierta.id)
    setGuardando(false)
    setAbierta(null)
    void refetch()
  }

  return (
    <div className="flex flex-col gap-3">
      {(cuentas ?? []).length === 0 && (
        <Aviso nivel="informativo" titulo="Todavía no hay clientes dados de alta." />
      )}

      {(cuentas ?? []).map((c) => (
        <article key={c.id} className="rounded-xl border border-borde bg-lienzo p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Building2 className="size-4 text-tinta-tenue" aria-hidden />
            <span className="font-semibold">{c.nombre}</span>
            <Insignia tono={c.plan === 'prueba' ? 'aviso' : 'ok'}>{c.plan.replace('_', ' ')}</Insignia>
            {c.estado_pago !== 'al_dia' && <Insignia tono="alerta">{c.estado_pago}</Insignia>}
            <span className="ml-auto text-xs text-tinta-tenue">
              desde {new Date(c.creado_en).toLocaleDateString('es-ES')}
            </span>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ['Locales', `${c.locales_activos} de ${c.locales_contratados}`],
              ['Personas', String(c.personas)],
              ['IA este mes', euros(Number(c.coste_ia_mes), 3)],
              ['APIs este mes', euros(Number(c.coste_apis_mes), 3)],
            ].map(([t, v]) => (
              <div key={t} className="rounded-lg border border-borde bg-panel p-2.5">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-tinta-tenue">{t}</dt>
                <dd className="cifras mt-0.5 text-sm font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-tinta-suave">
              {c.precio_por_local != null
                ? `${c.precio_por_local} € por local y mes`
                : `Tarifa de catálogo (${PRECIOS[c.plan] ?? 0} €)`}
            </span>
            <Boton tamano="pequeno" tono="discreto"
              onClick={() => {
                setAbierta(c)
                setLocales(String(c.locales_contratados ?? ''))
                setPrecio(c.precio_por_local != null ? String(c.precio_por_local) : '')
              }}>
              Ajustar plan
            </Boton>
          </div>

          {c.locales_activos > c.locales_contratados && (
            <p className="mt-2 text-sm font-semibold text-alerta">
              Tiene más locales que los contratados. Revisar.
            </p>
          )}
        </article>
      ))}

      {abierta && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <button aria-label="Cerrar" onClick={() => setAbierta(null)}
            className="absolute inset-0 bg-tinta/60 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-lienzo p-5 shadow-hoja">
            <h2 className="font-titulo text-lg font-semibold">{abierta.nombre}</h2>
            <p className="mt-1 text-sm text-tinta-suave">
              Lo que se pacte aquí manda: el servidor no deja crear más locales de los contratados.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <Campo etiqueta="Locales contratados" inputMode="numeric"
                value={locales} onChange={(e) => setLocales(e.target.value)} />
              <Campo etiqueta="Precio por local (€ con IVA)" inputMode="decimal"
                ayuda="Déjalo vacío para usar la tarifa del plan."
                value={precio} onChange={(e) => setPrecio(e.target.value)} />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Boton tono="discreto" onClick={() => setAbierta(null)}>Cancelar</Boton>
              <Boton cargando={guardando} onClick={() => void guardar()}>Guardar</Boton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Asistencia() {
  return (
    <div className="flex flex-col gap-3">
      <Aviso nivel="informativo" titulo="Asistencia 24/7">
        Cuando esté el chat del equipo, cada local tendrá un botón de asistencia y los mensajes
        aterrizarán aquí, con el nombre del local y quién escribe, para responder desde este panel.
      </Aviso>
      <div className="rounded-xl border border-dashed border-borde bg-lienzo p-8 text-center">
        <MessageSquare className="mx-auto size-8 text-tinta-tenue" aria-hidden />
        <p className="mt-2 font-semibold">Sin conversaciones todavía</p>
        <p className="mt-1 text-sm text-tinta-suave">Llega con el módulo de chat.</p>
      </div>
    </div>
  )
}
