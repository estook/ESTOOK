import { useState } from 'react'
import { ClipboardCheck, Play, Thermometer, Trash2, Lock } from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { Campo, Selector } from '@/componentes/Campo'
import { Hoja } from '@/componentes/Hoja'
import { Tarjeta } from '@/componentes/Tarjeta'
import { Aviso, Cargando, Insignia, Vacio } from '@/componentes/Estado'
import { useSesion } from '@/app/sesion'
import { euros, useProductos } from '@/datos/despensa'
import {
  FIABILIDAD, fechaOperativa,
  useAbrirJornada, useApuntarMerma, useCerrarJornada, useCrearPlanAppcc,
  useJornadaDeHoy, useMermasDeHoy, usePlanAppcc, useRegistrarAppcc,
  useRegistrosDeHoy, useUltimasJornadas,
  type PuntoAppcc,
} from '@/datos/servicio'

const MOTIVOS = [
  ['caducidad', 'Caducidad'], ['rotura', 'Rotura'], ['error_cocina', 'Error de cocina'],
  ['devolucion', 'Devolución'], ['personal', 'Personal'],
] as const

export function Servicio() {
  const { actual } = useSesion()
  const [pestana, setPestana] = useState<'jornada' | 'appcc' | 'mermas'>('jornada')
  const local = actual?.local_id

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="flex items-center gap-2 font-titulo text-2xl font-semibold">
          <ClipboardCheck className="size-6 text-naranja" aria-hidden /> Servicio
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-tinta-suave">
          La jornada de hoy, los registros sanitarios y el cierre. Fecha operativa:{' '}
          {new Date(fechaOperativa()).toLocaleDateString('es-ES')} — lo cobrado hasta las 06:00
          cuenta del día anterior.
        </p>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-borde">
        {([['jornada', 'Jornada y cierre'], ['appcc', 'APPCC'], ['mermas', 'Mermas']] as const).map(([k, n]) => (
          <button key={k} onClick={() => setPestana(k)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold ${
              pestana === k ? 'border-naranja text-naranja-oscuro' : 'border-transparent text-tinta-suave hover:text-tinta'}`}>
            {n}
          </button>
        ))}
      </nav>

      {pestana === 'jornada' && <Jornada localId={local} />}
      {pestana === 'appcc' && <Appcc localId={local} />}
      {pestana === 'mermas' && <Mermas localId={local} />}
    </div>
  )
}

// ============================ JORNADA Y CIERRE ============================

function Jornada({ localId }: { localId?: string }) {
  const { data: jornada, isLoading } = useJornadaDeHoy(localId)
  const { data: historico } = useUltimasJornadas(localId)
  const abrir = useAbrirJornada(localId)
  const cerrar = useCerrarJornada(localId)
  const { data: registros } = useRegistrosDeHoy(localId)
  const { data: plan } = usePlanAppcc(localId)

  const [cerrando, setCerrando] = useState(false)
  const [total, setTotal] = useState('')
  const [tickets, setTickets] = useState('')
  const [origen, setOrigen] = useState<'csv' | 'foto' | 'total_dia'>('total_dia')

  if (isLoading) return <Cargando texto="Mirando la jornada" />

  const pendientesAppcc = (plan?.puntos ?? []).filter(
    (p) => !(registros ?? []).some((r) => r.punto_id === p.id),
  )

  return (
    <div className="flex flex-col gap-4">
      {!jornada ? (
        <Vacio
          icono={<Play className="size-8" aria-hidden />}
          titulo="La jornada de hoy no está abierta"
          explicacion="Se abre sola con el primer fichaje o la primera venta, pero puedes abrirla ahora para empezar a registrar."
          accion={<Boton cargando={abrir.isPending} onClick={() => void abrir.mutateAsync()}>Abrir la jornada</Boton>}
        />
      ) : (
        <>
          <Tarjeta
            titulo="Hoy"
            acciones={
              jornada.cerrada_en
                ? <Insignia tono="ok">Cerrada</Insignia>
                : <Boton tamano="pequeno" onClick={() => setCerrando(true)}><Lock className="size-4" aria-hidden /> Cerrar caja</Boton>
            }
          >
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Dato etiqueta="Abierta desde" valor={new Date(jornada.abierta_en).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} />
              <Dato etiqueta="Ventas" valor={euros(jornada.ventas_total)} />
              <Dato etiqueta="Tickets" valor={jornada.tickets != null ? String(jornada.tickets) : '—'} />
              <Dato etiqueta="Ticket medio"
                valor={jornada.ventas_total && jornada.tickets ? euros(jornada.ventas_total / jornada.tickets) : '—'} />
            </div>
            {jornada.origen && (
              <p className="mt-3">
                <Insignia tono={FIABILIDAD[jornada.origen].tono}>{FIABILIDAD[jornada.origen].texto}</Insignia>
              </p>
            )}
          </Tarjeta>

          {pendientesAppcc.length > 0 && !jornada.cerrada_en && (
            <Aviso nivel="importante" titulo={`Quedan ${pendientesAppcc.length} registros de APPCC por hacer`}>
              {pendientesAppcc.map((p) => p.nombre).join(', ')}.
            </Aviso>
          )}
        </>
      )}

      {(historico ?? []).length > 0 && (
        <Tarjeta titulo="Últimos días" plegable plegadaPorDefecto resumen={`${historico?.length} jornadas`}>
          <ul className="flex flex-col">
            {(historico ?? []).map((j) => (
              <li key={j.id} className="flex items-center justify-between gap-3 border-b border-borde py-2 last:border-0">
                <span className="text-sm">{new Date(j.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                <span className="flex items-center gap-2">
                  {j.origen && <Insignia tono={FIABILIDAD[j.origen].tono}>{FIABILIDAD[j.origen].texto.split(' · ')[0]}</Insignia>}
                  <span className="cifras text-sm font-semibold">{euros(j.ventas_total)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}

      {/* Cierre en cuatro pasos */}
      <Hoja
        abierta={cerrando}
        titulo="Cerrar la caja"
        descripcion="Cuatro datos y firmado. Al cerrar se calcula el consumo y se guarda la jornada."
        onCerrar={() => setCerrando(false)}
        pie={<>
          <Boton tono="discreto" onClick={() => setCerrando(false)}>Cancelar</Boton>
          <Boton
            cargando={cerrar.isPending}
            onClick={async () => {
              if (!jornada || !total) return
              await cerrar.mutateAsync({
                jornada,
                total: Number(total.replace(',', '.')),
                tickets: tickets ? Number(tickets) : null,
                origen,
              })
              setCerrando(false); setTotal(''); setTickets('')
            }}
          >Cerrar y firmar</Boton>
        </>}
      >
        <div className="flex flex-col gap-4 pt-1">
          <Selector etiqueta="De dónde salen las ventas" obligatorio value={origen}
            onChange={(e) => setOrigen(e.target.value as typeof origen)}>
            <option value="total_dia">Total del día a mano — fiabilidad baja</option>
            <option value="foto">Foto del Z — fiabilidad media</option>
            <option value="csv">CSV del TPV — fiabilidad alta</option>
          </Selector>

          <Campo etiqueta="Total del día" obligatorio inputMode="decimal" placeholder="1284,50"
            value={total} onChange={(e) => setTotal(e.target.value)} />
          <Campo etiqueta="Número de tickets" inputMode="numeric"
            value={tickets} onChange={(e) => setTickets(e.target.value)} />

          {pendientesAppcc.length > 0 && (
            <Aviso nivel="importante" titulo="Hay registros de APPCC sin hacer">
              Puedes cerrar igual, pero esos puntos saldrán como NO REGISTRADO en la carpeta de
              inspección. Están en la pestaña de APPCC.
            </Aviso>
          )}

          <Aviso nivel="informativo" titulo="Con el TPV conectado esto no hará falta">
            Las ventas entrarán solas cada quince minutos y el cierre saldrá hecho, con el consumo
            de género descontado plato a plato.
          </Aviso>
        </div>
      </Hoja>
    </div>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-lg border border-borde bg-panel p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-tinta-tenue">{etiqueta}</p>
      <p className="cifras mt-0.5 font-semibold">{valor}</p>
    </div>
  )
}

// ============================ APPCC ============================

function Appcc({ localId }: { localId?: string }) {
  const { data, isLoading } = usePlanAppcc(localId)
  const { data: registros } = useRegistrosDeHoy(localId)
  const crearPlan = useCrearPlanAppcc(localId)
  const registrar = useRegistrarAppcc(localId)

  const [punto, setPunto] = useState<PuntoAppcc | null>(null)
  const [valor, setValor] = useState('')
  const [accion, setAccion] = useState('')

  if (isLoading) return <Cargando />

  if (!data?.planId) {
    return (
      <Vacio
        icono={<Thermometer className="size-8" aria-hidden />}
        titulo="Todavía no hay plan de APPCC"
        explicacion="Se crea con seis puntos de control habituales en hostelería (cámaras, congelador, freidora, limpieza y recepción). Después se ajusta cada uno a tu casa."
        accion={<Boton cargando={crearPlan.isPending} onClick={() => void crearPlan.mutateAsync()}>Crear el plan</Boton>}
      />
    )
  }

  const registroDe = (p: PuntoAppcc) => (registros ?? []).find((r) => r.punto_id === p.id)
  const fueraDeRango = (p: PuntoAppcc, v: number) =>
    (p.limite_min != null && v < p.limite_min) || (p.limite_max != null && v > p.limite_max)

  const valorNumero = valor === '' ? null : Number(valor.replace(',', '.'))
  const exigeAccion = punto && valorNumero != null && fueraDeRango(punto, valorNumero)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-tinta-suave">
        Dos toques por punto. Fuera de rango no se puede seguir sin escribir la acción correctiva, y
        el registro se guarda aunque no haya cobertura en la cámara.
      </p>

      <ul className="flex flex-col gap-2">
        {data.puntos.map((p) => {
          const r = registroDe(p)
          return (
            <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-borde bg-lienzo p-3 shadow-tarjeta">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{p.nombre}</span>
                <span className="text-xs text-tinta-tenue">
                  {p.limite_min != null || p.limite_max != null
                    ? `Entre ${p.limite_min ?? '−∞'} y ${p.limite_max ?? '∞'} °C`
                    : 'Comprobación visual'}
                </span>
              </span>
              {r ? (
                <Insignia tono={r.correcto ? 'ok' : 'alerta'}>
                  {r.valor != null ? `${r.valor} °C` : 'Hecho'}
                </Insignia>
              ) : (
                <Boton tamano="pequeno" onClick={() => { setPunto(p); setValor(''); setAccion('') }}>Registrar</Boton>
              )}
            </li>
          )
        })}
      </ul>

      <Hoja
        abierta={Boolean(punto)}
        titulo={punto?.nombre ?? ''}
        descripcion={punto?.limite_max != null ? `Límite: entre ${punto.limite_min ?? '−∞'} y ${punto.limite_max} °C` : 'Comprobación'}
        onCerrar={() => setPunto(null)}
        pie={<>
          <Boton tono="discreto" onClick={() => setPunto(null)}>Cancelar</Boton>
          <Boton
            cargando={registrar.isPending}
            disabled={Boolean(exigeAccion && !accion.trim())}
            onClick={async () => {
              if (!punto) return
              await registrar.mutateAsync({ punto, valor: valorNumero, accion })
              setPunto(null); setValor(''); setAccion('')
            }}
          >Firmar registro</Boton>
        </>}
      >
        {punto && (
          <div className="flex flex-col gap-4 pt-1">
            {punto.tipo === 'temperatura' || punto.limite_max != null ? (
              <Campo etiqueta="Temperatura (°C)" obligatorio inputMode="decimal"
                value={valor} onChange={(e) => setValor(e.target.value)} />
            ) : (
              <Aviso nivel="informativo" titulo="Comprobación visual">
                Firma el registro cuando lo hayas comprobado.
              </Aviso>
            )}

            {exigeAccion && (
              <>
                <Aviso nivel="urgente" titulo="El valor está fuera de rango">
                  {punto.accion_correctiva ?? 'Registra qué has hecho para corregirlo.'}
                </Aviso>
                <Campo etiqueta="Acción correctiva" obligatorio
                  placeholder="Se ha trasladado el género y avisado al responsable."
                  value={accion} onChange={(e) => setAccion(e.target.value)} />
              </>
            )}
          </div>
        )}
      </Hoja>
    </div>
  )
}

// ============================ MERMAS ============================

function Mermas({ localId }: { localId?: string }) {
  const { data: mermas, isLoading } = useMermasDeHoy(localId)
  const { data: productos } = useProductos(localId)
  const apuntar = useApuntarMerma(localId)

  const [abierta, setAbierta] = useState(false)
  const [productoId, setProductoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState<string>('caducidad')

  if (isLoading) return <Cargando />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-tinta-suave">
          Producto, cantidad y motivo. Sin motivo no hay análisis que valga.
        </p>
        <Boton onClick={() => setAbierta(true)}><Trash2 className="size-4" aria-hidden /> Apuntar merma</Boton>
      </div>

      {(mermas ?? []).length === 0 ? (
        <Vacio
          icono={<Trash2 className="size-8" aria-hidden />}
          titulo="Hoy no se ha apuntado ninguna merma"
          explicacion="Lo que se tira sin apuntar aparece luego como desviación de inventario sin explicación."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {(mermas ?? []).map((m: Record<string, unknown>) => {
            const prod = m.productos as { nombre: string; unidad_uso: string } | null
            return (
              <li key={String(m.id)} className="flex items-center justify-between gap-3 rounded-lg border border-borde bg-lienzo p-3">
                <span>
                  <span className="block font-semibold">{prod?.nombre ?? String(m.producto ?? '')}</span>
                  <span className="text-xs text-tinta-tenue">{String(m.motivo).replace('_', ' ')}</span>
                </span>
                <span className="cifras text-sm font-semibold">
                  {String(m.cantidad)} {prod?.unidad_uso ?? ''}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      <Hoja abierta={abierta} titulo="Apuntar merma" descripcion="Se guarda aunque no haya cobertura."
        onCerrar={() => setAbierta(false)}
        pie={<>
          <Boton tono="discreto" onClick={() => setAbierta(false)}>Cancelar</Boton>
          <Boton
            cargando={apuntar.isPending}
            onClick={async () => {
              if (!cantidad) return
              const p = (productos ?? []).find((x) => x.id === productoId)
              await apuntar.mutateAsync({
                productoId: productoId || null,
                nombre: p?.nombre ?? '',
                cantidad: Number(cantidad.replace(',', '.')),
                motivo,
              })
              setAbierta(false); setCantidad(''); setProductoId('')
            }}
          >Apuntar</Boton>
        </>}>
        <div className="flex flex-col gap-4 pt-1">
          <Selector etiqueta="Producto" obligatorio value={productoId} onChange={(e) => setProductoId(e.target.value)}>
            <option value="">Elige</option>
            {(productos ?? []).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </Selector>
          <Campo etiqueta="Cantidad" obligatorio inputMode="decimal"
            ayuda="En la unidad de uso del producto."
            value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          <Selector etiqueta="Motivo" obligatorio value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            {MOTIVOS.map(([k, n]) => <option key={k} value={k}>{n}</option>)}
          </Selector>
        </div>
      </Hoja>
    </div>
  )
}
