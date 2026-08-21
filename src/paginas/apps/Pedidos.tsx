import { useEffect, useState } from 'react'
import { ClipboardList, Copy, Plus, Send, Trash2, Truck } from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { Campo, Selector } from '@/componentes/Campo'
import { Hoja } from '@/componentes/Hoja'
import { Aviso, Cargando, Insignia, Vacio } from '@/componentes/Estado'
import { exigirSupabase } from '@/datos/supabase'
import {
  useCrearPedido, useMoverPedido, usePedidos, useProductos, useProveedores,
  type Pedido, type Producto,
} from '@/datos/despensa'
import { GRANDE, aGrande } from '@/datos/unidades'

const ESTADOS = {
  borrador: { texto: 'Borrador', tono: 'neutro' },
  enviado: { texto: 'En camino', tono: 'aviso' },
  recibido: { texto: 'Entregado', tono: 'ok' },
  cancelado: { texto: 'Cancelado', tono: 'alerta' },
} as const

const PESTANAS = [
  { clave: 'borrador', texto: 'Borradores' },
  { clave: 'enviado', texto: 'En camino' },
  { clave: 'recibido', texto: 'Entregados' },
] as const

const UNIDADES_PEDIDO = ['kg', 'l', 'ud', 'cajas', 'sacos', 'garrafas', 'bandejas', 'botellas']

interface Linea {
  texto: string          // lo que se pide, escrito libremente
  cantidad: string
  unidad: string
  productoId: string | null
}

const LINEA_VACIA: Linea = { texto: '', cantidad: '', unidad: 'kg', productoId: null }

/** El texto que se le manda al proveedor. Es lo que ve él, así que va claro y ordenado. */
function textoDelPedido({
  local, proveedor, lineas, fecha, hora, notas,
}: {
  local: string; proveedor: string; lineas: Linea[]
  fecha: string; hora: string; notas: string
}) {
  const cuando = fecha
    ? `Para el ${new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}${hora ? ` sobre las ${hora}` : ''}.`
    : ''
  return [
    `Hola ${proveedor}, pedido de ${local}:`,
    '',
    ...lineas.filter((l) => l.texto.trim()).map((l) => `· ${l.cantidad || ''} ${l.unidad} — ${l.texto.trim()}`),
    '',
    cuando,
    notas.trim(),
    '',
    'Gracias.',
  ].filter((x, i, a) => !(x === '' && a[i - 1] === '')).join('\n')
}

export function Pedidos({ localId, abrirAlta, alConsumir }: {
  localId?: string; abrirAlta?: boolean; alConsumir?: () => void
}) {
  const { data: pedidos, isLoading } = usePedidos(localId)
  const { data: proveedores } = useProveedores(localId)
  const { data: productos } = useProductos(localId)
  const crear = useCrearPedido(localId)
  const mover = useMoverPedido(localId)
  const [local] = useState(() => document.title.includes('Estook') ? 'nuestro local' : 'nuestro local')

  const [nuevo, setNuevo] = useState(false)
  const [proveedorId, setProveedorId] = useState('')
  const [lineas, setLineas] = useState<Linea[]>([{ ...LINEA_VACIA }])
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [notas, setNotas] = useState('')
  const [recibiendo, setRecibiendo] = useState<string | null>(null)
  const [albaran, setAlbaran] = useState('')
  const [copiado, setCopiado] = useState(false)
  useEffect(() => { if (abrirAlta) { setNuevo(true); alConsumir?.() } }, [abrirAlta, alConsumir])
  const [pestana, setPestana] = useState<'borrador' | 'enviado' | 'recibido'>('borrador')
  const [borradorId, setBorradorId] = useState<string | null>(null)

  if (isLoading) return <Cargando />

  const proveedor = (proveedores ?? []).find((p) => p.id === proveedorId)
  const nombreProveedor = (id: string) => (proveedores ?? []).find((p) => p.id === id)?.nombre ?? 'Proveedor'
  const bajoMinimo = (productos ?? []).filter((p) => p.minimo != null && p.stock_actual < p.minimo)

  const mensaje = textoDelPedido({
    local, proveedor: proveedor?.nombre ?? 'proveedor', lineas, fecha, hora, notas,
  })

  function abrirNuevo(desdeBajoMinimo = false) {
    if (desdeBajoMinimo && bajoMinimo.length) {
      setLineas(bajoMinimo.slice(0, 10).map((p) => {
        const unidad = GRANDE[p.unidad_uso as 'g' | 'ml' | 'ud']
        const faltan = Math.max(1, Math.ceil(aGrande((p.minimo ?? 0) * 2 - p.stock_actual, p.unidad_uso as 'g' | 'ml' | 'ud')))
        return { texto: p.nombre, cantidad: String(faltan), unidad, productoId: p.id }
      }))
      const prov = bajoMinimo.find((p) => p.proveedor_id)?.proveedor_id
      if (prov) setProveedorId(prov)
    } else {
      setLineas([{ ...LINEA_VACIA }])
    }
    setNuevo(true)
  }

  /** Guarda el pedido y devuelve su id, para poder mandarlo después. */
  async function guardar(estado: Pedido['estado'] = 'borrador') {
    if (!proveedorId) return null
    const utiles = lineas.filter((l) => l.texto.trim())
    const creado = await crear.mutateAsync({
      proveedorId,
      lineas: utiles.map((l) => ({
        producto_id: l.productoId,
        nombre_libre: l.productoId ? null : `${l.texto.trim()} (${l.cantidad} ${l.unidad})`,
        cantidad_pedida: Number(l.cantidad.replace(',', '.')) || 1,
      })),
    })
    // Datos de entrega y notas: van en el pedido, no en las líneas
    if (creado && (fecha || hora || notas)) {
      await exigirSupabase().from('pedidos').update({
        fecha_entrega: fecha || null,
        hora_entrega: hora || null,
        notas: notas.trim() || null,
      }).eq('id', creado.id)
    }
    if (creado && estado === 'enviado') {
      await mover.mutateAsync({ pedido: creado, estado: 'enviado' })
    }
    if (creado) setBorradorId(creado.id)
    return creado
  }

  function limpiar() {
    setNuevo(false); setLineas([{ ...LINEA_VACIA }]); setProveedorId('')
    setFecha(''); setHora(''); setNotas(''); setBorradorId(null)
  }

  /**
   * Nada se pierde: si cierras la hoja a medias, lo que llevabas escrito se
   * guarda como borrador y lo retomas en su pestaña.
   */
  async function cerrarGuardando() {
    const hayAlgo = proveedorId && lineas.some((l) => l.texto.trim())
    if (hayAlgo && !borradorId) {
      try { await guardar('borrador') } catch { /* si falla, no se pierde la pantalla */ }
    }
    limpiar()
  }

  return (
    <div className="flex flex-col gap-4">
      {bajoMinimo.length > 0 && (
        <Aviso
          nivel="importante"
          titulo="Hay género por debajo del mínimo"
          acciones={<Boton tamano="pequeno" onClick={() => abrirNuevo(true)}>Montar el pedido con esto</Boton>}
        >
          {bajoMinimo.slice(0, 5).map((p) => p.nombre).join(', ')}
          {bajoMinimo.length > 5 && ` y ${bajoMinimo.length - 5} más`}.
        </Aviso>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-tinta-suave">
          Escribe lo que necesites, aunque no esté dado de alta. Al enviarlo se guarda el texto y la
          fecha; al recibirlo, el stock sube solo.
        </p>
        <Boton onClick={() => abrirNuevo()}><Plus className="size-4" aria-hidden /> Nuevo pedido</Boton>
      </div>

      <nav className="flex gap-1 border-b border-borde">
        {PESTANAS.map((p) => {
          const cuantos = (pedidos ?? []).filter((x) => x.estado === p.clave).length
          return (
            <button key={p.clave} onClick={() => setPestana(p.clave)}
              className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold ${
                pestana === p.clave ? 'border-naranja text-naranja-oscuro' : 'border-transparent text-tinta-suave'}`}>
              {p.texto}
              {cuantos > 0 && (
                <span className={`rounded px-1.5 text-xs ${pestana === p.clave ? 'bg-naranja text-white' : 'bg-panel text-tinta-tenue'}`}>
                  {cuantos}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {(pedidos ?? []).filter((p) => p.estado === pestana).length === 0 ? (
        <Vacio
          icono={<ClipboardList className="size-8" aria-hidden />}
          titulo={
            pestana === 'borrador' ? 'No tienes borradores'
            : pestana === 'enviado' ? 'No hay pedidos en camino'
            : 'Todavía no has recibido ningún pedido'
          }
          explicacion={
            pestana === 'borrador'
              ? 'Lo que empieces y no envíes se guarda aquí, aunque cierres la ventana.'
              : pestana === 'enviado'
                ? 'Los pedidos que mandes al proveedor aparecen aquí hasta que llegan.'
                : 'Al recibir un pedido, el género entra en el inventario y el pedido pasa aquí.'
          }
          accion={pestana === 'borrador' ? <Boton onClick={() => abrirNuevo()}>Crear el primero</Boton> : undefined}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {(pedidos ?? []).filter((x) => x.estado === pestana).map((p) => {
            const e = ESTADOS[p.estado]
            const conFecha = p as Pedido & { fecha_entrega?: string | null; hora_entrega?: string | null; notas?: string | null }
            return (
              <li key={p.id} className="rounded-lg border border-borde bg-lienzo p-4 shadow-tarjeta">
                <div className="flex flex-wrap items-center gap-2">
                  <Truck className="size-4 text-tinta-tenue" aria-hidden />
                  <span className="font-semibold">{nombreProveedor(p.proveedor_id)}</span>
                  <Insignia tono={e.tono}>{e.texto}</Insignia>
                  <span className="text-xs text-tinta-tenue">
                    {p.pedido_lineas?.length ?? 0} líneas
                    {conFecha.fecha_entrega && ` · para el ${new Date(conFecha.fecha_entrega).toLocaleDateString('es-ES')}`}
                    {conFecha.hora_entrega && ` a las ${String(conFecha.hora_entrega).slice(0, 5)}`}
                  </span>
                  <div className="ml-auto flex gap-2">
                    {p.estado === 'borrador' && (
                      <Boton tamano="pequeno" tono="secundario"
                        onClick={() => void mover.mutateAsync({ pedido: p, estado: 'enviado' })}>
                        Marcar enviado
                      </Boton>
                    )}
                    {p.estado === 'enviado' && (
                      <Boton tamano="pequeno" onClick={() => { setRecibiendo(p.id); setAlbaran('') }}>Recibir</Boton>
                    )}
                  </div>
                </div>

                {(p.pedido_lineas ?? []).length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {p.pedido_lineas.map((l) => {
                      const prod = (productos ?? []).find((x) => x.id === l.producto_id)
                      return (
                        <li key={l.id} className="rounded border border-borde bg-panel px-2 py-1 text-xs">
                          {l.nombre_libre ?? `${l.cantidad_pedida} × ${prod?.nombre ?? 'producto'}`}
                        </li>
                      )
                    })}
                  </ul>
                )}

                {recibiendo === p.id && (
                  <div className="mt-3 rounded-lg border border-borde bg-panel p-3">
                    <p className="text-sm font-semibold">¿Ha llegado todo?</p>
                    <p className="mt-1 text-sm text-tinta-suave">
                      Si ha venido completo, entra todo y sube el stock. Si faltó algo, corrige
                      después las cantidades desde el producto.
                    </p>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="flex-1">
                        <Campo etiqueta="Nº de albarán" value={albaran} onChange={(ev) => setAlbaran(ev.target.value)} />
                      </div>
                      <div className="flex gap-2">
                        <Boton tono="discreto" onClick={() => setRecibiendo(null)}>Cancelar</Boton>
                        <Boton cargando={mover.isPending}
                          onClick={async () => {
                            await mover.mutateAsync({ pedido: p, estado: 'recibido', albaran })
                            setRecibiendo(null)
                          }}>Ha llegado entero</Boton>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* ---------- Nuevo pedido ---------- */}
      <Hoja
        abierta={nuevo}
        titulo="Nuevo pedido"
        descripcion="Escribe lo que necesitas. El precio no se pide aquí: se apunta al recibirlo."
        onCerrar={() => void cerrarGuardando()}
        pie={<>
          <Boton tono="discreto" onClick={() => void cerrarGuardando()}>Guardar y salir</Boton>
          <Boton cargando={crear.isPending} disabled={!proveedorId || !lineas.some((l) => l.texto.trim())}
            onClick={async () => { await guardar('borrador'); limpiar() }}>Guardar</Boton>
        </>}
      >
        <div className="flex flex-col gap-6 pt-1">
          {(proveedores ?? []).length === 0 && (
            <Aviso nivel="importante" titulo="Antes hace falta un proveedor">
              Date de alta uno en la pestaña de al lado y vuelve aquí.
            </Aviso>
          )}

          <Paso numero={1} titulo="¿A quién se lo pides?">
            <Selector etiqueta="Proveedor" obligatorio value={proveedorId}
              onChange={(e) => setProveedorId(e.target.value)}>
              <option value="">Elige</option>
              {(proveedores ?? []).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </Selector>
            {proveedor?.dias_reparto?.length ? (
              <p className="text-xs text-tinta-tenue">Reparte: {proveedor.dias_reparto.join(', ')}.</p>
            ) : null}
            {proveedor?.pedido_minimo ? (
              <p className="text-xs text-tinta-tenue">Pedido mínimo: {proveedor.pedido_minimo} €.</p>
            ) : null}
          </Paso>

          <Paso numero={2} titulo="¿Qué necesitas?"
            explicacion="Escribe lo que quieras, esté o no en tu inventario. Si escribes algo que ya tienes dado de alta, se enlaza solo y el stock subirá al recibirlo.">
            <div className="flex flex-col gap-3">
              {lineas.map((l, i) => (
                <div key={i} className="rounded-lg border border-borde bg-panel p-3">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <LineaProducto
                        valor={l.texto}
                        productos={productos ?? []}
                        onCambio={(texto, prod) =>
                          setLineas(lineas.map((x, j) => j === i
                            ? {
                                ...x, texto,
                                productoId: prod?.id ?? null,
                                unidad: prod ? GRANDE[prod.unidad_uso as 'g' | 'ml' | 'ud'] : x.unidad,
                              }
                            : x))
                        }
                      />
                    </div>
                    {lineas.length > 1 && (
                      <button aria-label="Quitar línea"
                        onClick={() => setLineas(lineas.filter((_, j) => j !== i))}
                        className="mt-6 grid size-11 shrink-0 place-items-center rounded-md text-tinta-tenue hover:bg-lienzo">
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    )}
                  </div>

                  <div className="mt-2 grid grid-cols-[1fr,120px] gap-2">
                    <Campo etiqueta="Cantidad" obligatorio inputMode="decimal" placeholder="5"
                      value={l.cantidad}
                      onChange={(e) => setLineas(lineas.map((x, j) => j === i ? { ...x, cantidad: e.target.value } : x))} />
                    <Selector etiqueta="Unidad" obligatorio value={l.unidad}
                      onChange={(e) => setLineas(lineas.map((x, j) => j === i ? { ...x, unidad: e.target.value } : x))}>
                      {UNIDADES_PEDIDO.map((u) => <option key={u}>{u}</option>)}
                    </Selector>
                  </div>

                  {l.productoId && (
                    <p className="mt-1.5 text-xs font-semibold text-ok">Enlazado con tu inventario</p>
                  )}
                </div>
              ))}

              <Boton tono="discreto" onClick={() => setLineas([...lineas, { ...LINEA_VACIA }])}>
                <Plus className="size-4" aria-hidden /> Añadir otra línea
              </Boton>

              {bajoMinimo.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-tinta-suave">
                    Te está faltando
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {bajoMinimo.slice(0, 8).map((p) => (
                      <button key={p.id} type="button"
                        onClick={() => setLineas([
                          ...lineas.filter((x) => x.texto.trim()),
                          { texto: p.nombre, cantidad: '', unidad: GRANDE[p.unidad_uso as 'g' | 'ml' | 'ud'], productoId: p.id },
                        ])}
                        className="rounded-md border border-borde bg-lienzo px-2.5 py-1.5 text-xs font-semibold hover:bg-naranja-suave">
                        + {p.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Paso>

          <Paso numero={3} titulo="¿Para cuándo?">
            <div className="grid grid-cols-2 gap-3">
              <Campo etiqueta="Día de entrega" type="date"
                value={fecha} onChange={(e) => setFecha(e.target.value)} />
              <Campo etiqueta="Hora" type="time"
                value={hora} onChange={(e) => setHora(e.target.value)} />
            </div>
            <Campo etiqueta="Nota para el proveedor" placeholder="Dejarlo en la puerta de atrás."
              value={notas} onChange={(e) => setNotas(e.target.value)} />
          </Paso>

          <Paso numero={4} titulo="Cómo se lo mandas"
            explicacion="Esto es exactamente lo que va a leer el proveedor.">
            <pre className="whitespace-pre-wrap rounded-lg border border-borde bg-panel p-3 text-sm">{mensaje}</pre>
            <div className="flex flex-wrap gap-2">
              <Boton
                disabled={!proveedorId || !lineas.some((l) => l.texto.trim())}
                cargando={crear.isPending}
                onClick={async () => {
                  await guardar('enviado')
                  const tel = (proveedor?.telefono ?? '').replace(/[^0-9]/g, '')
                  const url = tel
                    ? `https://wa.me/${tel.startsWith('34') ? tel : `34${tel}`}?text=${encodeURIComponent(mensaje)}`
                    : `https://wa.me/?text=${encodeURIComponent(mensaje)}`
                  window.open(url, '_blank')
                  limpiar()
                }}
              ><Send className="size-4" aria-hidden /> Enviar por WhatsApp</Boton>

              <Boton tono="discreto"
                onClick={async () => {
                  await navigator.clipboard.writeText(mensaje)
                  setCopiado(true)
                  window.setTimeout(() => setCopiado(false), 2000)
                }}
              ><Copy className="size-4" aria-hidden /> {copiado ? 'Copiado' : 'Copiar el texto'}</Boton>
            </div>
            <p className="text-xs text-tinta-tenue">
              Al enviarlo se guarda como enviado, con la fecha. El PDF con el logo del local llegará
              con el motor de documentos.
            </p>
          </Paso>
        </div>
      </Hoja>
    </div>
  )
}

function Paso({ numero, titulo, explicacion, children }: {
  numero: number; titulo: string; explicacion?: string; children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-tinta text-xs font-bold text-white">
          {numero}
        </span>
        <div>
          <h3 className="font-titulo text-sm font-semibold uppercase tracking-wide">{titulo}</h3>
          {explicacion && <p className="mt-0.5 text-xs leading-relaxed text-tinta-suave">{explicacion}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-3 pl-8">{children}</div>
    </section>
  )
}

/**
 * Campo de producto con sugerencias del inventario: escribes «at» y te propone
 * «Atún rojo — 5 kg en cámara», para no dar de alta dos veces lo mismo.
 */
function LineaProducto({
  valor, productos, onCambio,
}: {
  valor: string
  productos: Producto[]
  onCambio: (texto: string, producto: Producto | null) => void
}) {
  const [abierto, setAbierto] = useState(false)
  const limpio = valor.trim().toLowerCase()

  const sugerencias = limpio.length >= 1
    ? productos
        .filter((p) => p.nombre.toLowerCase().includes(limpio))
        .slice(0, 5)
    : []

  return (
    <div className="relative">
      <Campo
        etiqueta="Qué necesitas"
        obligatorio
        placeholder="Atún rojo"
        autoComplete="off"
        value={valor}
        onFocus={() => setAbierto(true)}
        onBlur={() => window.setTimeout(() => setAbierto(false), 150)}
        onChange={(e) => {
          const texto = e.target.value
          const exacto = productos.find((p) => p.nombre.toLowerCase() === texto.trim().toLowerCase())
          onCambio(texto, exacto ?? null)
          setAbierto(true)
        }}
      />
      {abierto && sugerencias.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-borde bg-lienzo shadow-hoja">
          {sugerencias.map((p) => {
            const unidad = GRANDE[p.unidad_uso as 'g' | 'ml' | 'ud']
            const hay = aGrande(p.stock_actual, p.unidad_uso as 'g' | 'ml' | 'ud')
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onCambio(p.nombre, p); setAbierto(false) }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-naranja-suave"
                >
                  <span className="min-w-0 truncate text-sm font-medium">{p.nombre}</span>
                  <span className="shrink-0 text-xs text-tinta-tenue">
                    {hay > 0 ? `${hay.toFixed(1).replace('.', ',')} ${unidad} en cámara` : 'sin existencias'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
