import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Camera, ChevronRight, ClipboardCheck, DoorClosed, DoorOpen,
  Package, Plus, Receipt, ShoppingCart, Timer, Trash2, X,
} from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { Aviso, Cargando, Insignia } from '@/componentes/Estado'
import { CaraFogon } from '@/marca/Logo'
import { Buscador } from '@/componentes/Buscador'
import { WidgetsDelPanel } from '@/paginas/apps/Widgets'
import { useSesion } from '@/app/sesion'
import { euros, usePedidos, useProductos } from '@/datos/despensa'
import { usePlatos } from '@/datos/cocina'
import {
  useAbrirJornada, useCerrarJornada, useJornadaDeHoy, usePlanAppcc, useRegistrosDeHoy,
} from '@/datos/servicio'
import { useCola } from '@/offline/useCola'
import { usePermisos } from '@/app/permisos'
import {
  calcularAvisos, useAvisos, useResponderAviso, useSincronizarAvisos,
} from '@/datos/avisos'

const MANDA = ['gerente', 'jefe_cocina', 'jefe_sala']

function saludo() {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches'
}

/** Las acciones rápidas dependen del puesto: cada uno ve lo suyo y nada más. */
function accionesDeRol(rol: string) {
  const todas = [
    { clave: 'producto', texto: 'Añadir producto', icono: Package, ruta: '/app/inventario', roles: ['gerente', 'jefe_cocina', 'jefe_sala'] },
    { clave: 'pedido', texto: 'Crear pedido', icono: ShoppingCart, ruta: '/app/inventario', roles: ['gerente', 'jefe_cocina', 'jefe_sala', 'cocinero'] },
    { clave: 'merma', texto: 'Registrar merma', icono: Trash2, ruta: '/app/servicio', roles: ['gerente', 'jefe_cocina', 'jefe_sala', 'cocinero', 'sala'] },
    { clave: 'appcc', texto: 'Registrar temperatura', icono: ClipboardCheck, ruta: '/app/servicio', roles: ['gerente', 'jefe_cocina', 'jefe_sala', 'cocinero', 'sala'] },
    { clave: 'albaran', texto: 'Escanear albarán', icono: Camera, ruta: '/app/inventario', roles: ['gerente', 'jefe_cocina'], pronto: true },
    { clave: 'factura', texto: 'Escanear factura', icono: Receipt, ruta: '/app/negocio', roles: ['gerente'], pronto: true },
  ]
  return todas.filter((a) => a.roles.includes(rol))
}

export function PanelInicio() {
  const { actual, sesion } = useSesion()
  const rol = actual?.rol ?? 'cocinero'
  const manda = MANDA.includes(rol)

  const { data: productos, isLoading } = useProductos(actual?.local_id)
  const { data: pedidos } = usePedidos(actual?.local_id)
  const { data: platos } = usePlatos(actual?.local_id)
  const { data: jornada } = useJornadaDeHoy(actual?.local_id)
  const { data: plan } = usePlanAppcc(actual?.local_id)
  const { data: registros } = useRegistrosDeHoy(actual?.local_id)
  const abrir = useAbrirJornada(actual?.local_id)
  const cerrar = useCerrarJornada(actual?.local_id)
  const { conRed, enCola } = useCola()

  const { puedeVer } = usePermisos()
  const { data: avisos } = useAvisos(actual?.local_id, rol)
  const sincronizar = useSincronizarAvisos(actual?.local_id)
  const responder = useResponderAviso(actual?.local_id)

  const [acciones, setAcciones] = useState(false)
  const [confirmar, setConfirmar] = useState<'abrir' | 'cerrar' | null>(null)
  const [totalCierre, setTotalCierre] = useState('')

  useEffect(() => {
    if (!actual?.local_id || isLoading) return
    const calculados = calcularAvisos({
      productos: productos ?? [],
      platos: platos ?? [],
      pedidos: pedidos ?? [],
      puntosAppcc: plan?.puntos ?? [],
      registrosAppcc: registros ?? [],
      jornadaAbierta: Boolean(jornada),
      jornadaCerrada: Boolean(jornada?.cerrada_en),
    })
    sincronizar.mutate(calculados)
    // Se recalcula cuando cambian los datos, no en cada pintado
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actual?.local_id, isLoading, productos, platos, pedidos, plan, registros, jornada])

  if (!actual) {
    return (
      <Aviso nivel="importante" titulo="Tu cuenta todavía no tiene local">
        Si eres el dueño, ejecuta <code>alta.sql</code> y <code>admin.sql</code> en el editor SQL de
        Supabase. Si trabajas aquí, pide que te inviten.
      </Aviso>
    )
  }

  const lista = productos ?? []
  const appccPendiente = (plan?.puntos ?? []).filter((p) => !(registros ?? []).some((r) => r.punto_id === p.id))

  const tarjetas = (avisos ?? []).filter((a) => !a.app || puedeVer(
    a.app === 'inventario' ? 'inventario.productos'
    : a.app === 'cocina' ? 'cocina.fichas'
    : a.app === 'servicio' ? 'servicio.appcc'
    : 'inventario.productos',
  ))

  const valorCamara = lista.reduce((s, p) => {
    const coste = p.precio_ultimo != null && p.factor && p.rendimiento
      ? p.precio_ultimo / (p.factor * p.rendimiento) : 0
    return s + coste * p.stock_actual
  }, 0)

  const nombre = ((sesion?.user.user_metadata?.nombre as string | undefined) ?? sesion?.user.email?.split('@')[0] ?? '').split(' ')[0]

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-titulo text-2xl font-semibold">
            {saludo()}{nombre ? `, ${nombre}` : ''}
          </h1>
          <p className="text-sm capitalize text-tinta-suave">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} · {actual.local}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!conRed && <Insignia tono="alerta">Sin cobertura</Insignia>}
          {enCola > 0 && <Insignia tono="aviso">{enCola} sin subir</Insignia>}
        </div>
      </header>

      <Buscador rol={rol} />

      {manda ? (
        <button
          onClick={() => setConfirmar(jornada && !jornada.cerrada_en ? 'cerrar' : 'abrir')}
          disabled={Boolean(jornada?.cerrada_en)}
          className={[
            'flex w-full items-center justify-between gap-3 rounded-xl px-5 py-4 text-left font-semibold text-white shadow-tarjeta transition-transform active:scale-[0.99]',
            jornada?.cerrada_en ? 'bg-tinta-tenue' : jornada ? 'bg-alerta' : 'bg-ok',
          ].join(' ')}
        >
          <span className="flex items-center gap-3">
            {jornada && !jornada.cerrada_en
              ? <DoorClosed className="size-6" aria-hidden />
              : <DoorOpen className="size-6" aria-hidden />}
            <span>
              <span className="block text-base">
                {jornada?.cerrada_en ? 'Día cerrado' : jornada ? 'Cerrar la caja' : 'Abrir el restaurante'}
              </span>
              <span className="block text-xs font-medium opacity-80">
                {jornada?.cerrada_en
                  ? `${euros(jornada.ventas_total)} · ${jornada.tickets ?? 0} tickets`
                  : jornada
                    ? `Abierto desde las ${new Date(jornada.abierta_en).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                    : 'Empieza la jornada y comienza a contar el día'}
              </span>
            </span>
          </span>
          {!jornada?.cerrada_en && <ChevronRight className="size-5" aria-hidden />}
        </button>
      ) : (
        <Link to="/app/equipo"
          className="flex w-full items-center justify-between gap-3 rounded-xl bg-tinta px-5 py-4 font-semibold text-white shadow-tarjeta">
          <span className="flex items-center gap-3">
            <Timer className="size-6" aria-hidden />
            <span>
              <span className="block text-base">Fichar</span>
              <span className="block text-xs font-medium opacity-80">Entrada y salida del turno</span>
            </span>
          </span>
          <ChevronRight className="size-5" aria-hidden />
        </Link>
      )}

      {isLoading ? <Cargando texto="Mirando cómo va el día" /> : (
        <>
          <section>
            <h2 className="mb-2 flex items-center gap-2 font-titulo text-sm font-semibold uppercase tracking-wide">
              {tarjetas.length > 0 && <span className="size-2 rounded-full bg-alerta" />}
              {tarjetas.length === 0
                ? 'Todo en orden'
                : `${tarjetas.length} ${tarjetas.length === 1 ? 'cosa necesita' : 'cosas necesitan'} atención`}
            </h2>

            {tarjetas.length === 0 ? (
              <p className="rounded-xl border border-borde bg-lienzo p-4 text-sm text-tinta-suave">
                No hay nada pendiente ahora mismo. Cuando algo se salga de lo normal, aparecerá aquí.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {tarjetas.map((a) => (
                  <li key={a.id}
                    className="rounded-xl border border-borde bg-lienzo p-4 shadow-tarjeta">
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg ${
                        a.nivel === 'urgente' ? 'bg-alerta-suave text-alerta'
                        : a.nivel === 'importante' ? 'bg-aviso-suave text-aviso'
                        : 'bg-panel text-tinta-tenue'}`}>
                        <CaraFogon className="size-6" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-tight">{a.titulo}</p>
                        {a.cuerpo && <p className="mt-1 text-sm text-tinta-suave">{a.cuerpo}</p>}
                      </div>
                      <button
                        aria-label="Cerrar aviso"
                        onClick={() => responder.mutate({ id: a.id, respuesta: 'cerrado' })}
                        className="grid size-8 shrink-0 place-items-center rounded-md text-tinta-tenue hover:bg-panel"
                      >
                        <X className="size-4" aria-hidden />
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {a.accion_ruta && a.accion_texto && (
                        <Link to={a.accion_ruta}
                          onClick={() => responder.mutate({ id: a.id, respuesta: 'aplicado' })}>
                          <Boton tamano="pequeno">{a.accion_texto}</Boton>
                        </Link>
                      )}
                      <Boton tamano="pequeno" tono="discreto"
                        onClick={() => responder.mutate({ id: a.id, respuesta: 'ahora_no' })}>
                        Ahora no
                      </Boton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {manda && (
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                ['Ventas de hoy', euros(jornada?.ventas_total ?? 0), 'Jornada en curso'],
                ['Valor en cámara', euros(valorCamara), 'Al coste real de lo que hay'],
                ['Referencias', String(lista.length), 'Productos dados de alta'],
                ['Platos con ficha', String((platos ?? []).length), 'En el recetario'],
              ].map(([t, v, o]) => (
                <div key={t} className="rounded-xl border border-borde bg-lienzo p-4">
                  <p className="text-xs font-semibold uppercase leading-tight tracking-wide text-tinta-tenue">{t}</p>
                  <p className="cifras mt-1 font-titulo text-2xl font-semibold">{v}</p>
                  <p className="mt-0.5 text-[11px] leading-tight text-tinta-tenue">{o}</p>
                </div>
              ))}
            </section>
          )}

          <WidgetsDelPanel />

          <section className="rounded-xl border border-borde bg-tinta p-4 text-white">
            <div className="flex items-center gap-3">
              <CaraFogon className="size-10" />
              <div className="min-w-0 flex-1">
                <p className="font-titulo text-sm font-semibold uppercase tracking-wide">¿Qué quieres hacer?</p>
                <p className="text-sm text-white/60">Pregúntale a Fogón lo que necesites del negocio.</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(manda
                ? ['¿Qué me está costando dinero?', '¿Qué platos van flojos?', '¿Qué pido hoy?']
                : ['¿Qué tengo que sacar hoy?', '¿Qué caduca esta semana?']
              ).map((s) => (
                <span key={s} className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm">{s}</span>
              ))}
            </div>
          </section>
        </>
      )}

      <button
        onClick={() => setAcciones(true)}
        aria-label="Acción rápida"
        className="fixed bottom-24 right-4 z-30 flex items-center gap-2 rounded-full bg-naranja px-5 py-3.5 font-semibold text-white shadow-flotante lg:bottom-8"
      >
        <Plus className="size-5" aria-hidden /> Acción rápida
      </button>

      {acciones && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Acción rápida">
          <button aria-label="Cerrar" onClick={() => setAcciones(false)}
            className="absolute inset-0 animate-aparecer bg-tinta/60 backdrop-blur-sm" />
          <div className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-md p-4 pb-24">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              Acción rápida
            </p>
            <ul className="flex flex-col gap-2">
              {accionesDeRol(rol).map((a, i) => (
                <li key={a.clave} style={{ animationDelay: `${i * 40}ms` }} className="animate-subirCorto">
                  <Link to={a.ruta} onClick={() => setAcciones(false)}
                    className="flex items-center gap-3 rounded-xl bg-lienzo p-3.5 font-semibold shadow-tarjeta active:bg-panel">
                    <a.icono className="size-5 text-naranja" aria-hidden />
                    <span className="flex-1">{a.texto}</span>
                    {a.pronto && <Insignia>pronto</Insignia>}
                  </Link>
                </li>
              ))}
            </ul>
            <button onClick={() => setAcciones(false)}
              className="mx-auto mt-4 grid size-14 place-items-center rounded-full bg-lienzo shadow-flotante">
              <X className="size-6" aria-hidden />
            </button>
          </div>
        </div>
      )}

      {confirmar && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true">
          <button aria-label="Cerrar" onClick={() => setConfirmar(null)}
            className="absolute inset-0 bg-tinta/60 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-sm animate-subirCorto rounded-xl bg-lienzo p-5 shadow-hoja">
            <h2 className="font-titulo text-lg font-semibold">
              {confirmar === 'abrir' ? '¿Abrimos el restaurante?' : '¿Cerramos la caja?'}
            </h2>
            <p className="mt-1 text-sm text-tinta-suave">
              {confirmar === 'abrir'
                ? 'Empieza la jornada de hoy. A partir de ahora se registran ventas, mermas y controles.'
                : 'Se guarda la jornada con su fecha y ya no se registran más ventas de hoy.'}
            </p>

            {confirmar === 'cerrar' && (
              <div className="mt-4">
                <label className="block text-xs font-semibold uppercase tracking-wide text-tinta-suave">
                  Total del día (€)
                </label>
                <input
                  className="mt-1.5 h-11 w-full rounded-md border border-borde px-3 text-sm"
                  inputMode="decimal" placeholder="1284,50"
                  value={totalCierre} onChange={(e) => setTotalCierre(e.target.value)}
                />
                {appccPendiente.length > 0 && (
                  <p className="mt-2 text-xs font-semibold text-aviso">
                    Quedan {appccPendiente.length} controles de APPCC sin registrar.
                  </p>
                )}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Boton tono="discreto" onClick={() => setConfirmar(null)}>Cancelar</Boton>
              <Boton
                cargando={abrir.isPending || cerrar.isPending}
                onClick={async () => {
                  if (confirmar === 'abrir') await abrir.mutateAsync()
                  else if (jornada) {
                    await cerrar.mutateAsync({
                      jornada,
                      total: Number((totalCierre || '0').replace(',', '.')),
                      tickets: null,
                      origen: 'total_dia',
                    })
                  }
                  setConfirmar(null); setTotalCierre('')
                }}
              >{confirmar === 'abrir' ? 'Abrir' : 'Cerrar caja'}</Boton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
