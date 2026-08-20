import { useMemo, useState } from 'react'
import { Boxes, Plus, Search, Truck, ClipboardList, AlertTriangle } from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { Campo, Selector } from '@/componentes/Campo'
import { Hoja } from '@/componentes/Hoja'
import { Tabla, type Columna } from '@/componentes/Tabla'
import { Aviso, Cargando, Insignia, Vacio } from '@/componentes/Estado'
import { Tarjeta } from '@/componentes/Tarjeta'
import { useSesion } from '@/app/sesion'
import {
  cantidad, costeUnidadUso, euros,
  useAjustarStock, useCrearPedido, useGuardarProducto, useGuardarProveedor,
  useMoverPedido, usePedidos, useProductos, useProveedores,
  type Producto, type Proveedor,
} from '@/datos/despensa'

type Pestana = 'productos' | 'proveedores' | 'pedidos'

export function Despensa() {
  const { actual } = useSesion()
  const [pestana, setPestana] = useState<Pestana>('productos')
  const local = actual?.local_id

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="flex items-center gap-2 font-titulo text-2xl font-semibold">
          <Boxes className="size-6 text-naranja" aria-hidden /> Despensa
        </h1>
        <p className="mt-1 text-sm text-tinta-suave">
          Lo que hay en cámara y lo que cuesta de verdad. Todas las demás apps leen de aquí.
        </p>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-borde">
        {([['productos', 'Productos'], ['proveedores', 'Proveedores'], ['pedidos', 'Pedidos']] as const).map(([k, n]) => (
          <button key={k} onClick={() => setPestana(k)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold ${
              pestana === k ? 'border-naranja text-naranja-oscuro' : 'border-transparent text-tinta-suave hover:text-tinta'}`}>
            {n}
          </button>
        ))}
      </nav>

      {pestana === 'productos' && <Productos localId={local} />}
      {pestana === 'proveedores' && <Proveedores localId={local} />}
      {pestana === 'pedidos' && <Pedidos localId={local} />}
    </div>
  )
}

// ============================ PRODUCTOS ============================

const UNIDADES = ['g', 'ml', 'ud']

function Productos({ localId }: { localId?: string }) {
  const { data: productos, isLoading, error } = useProductos(localId)
  const { data: proveedores } = useProveedores(localId)
  const guardar = useGuardarProducto(localId)
  const ajustar = useAjustarStock(localId)

  const [busca, setBusca] = useState('')
  const [ficha, setFicha] = useState<Producto | null>(null)
  const [nuevo, setNuevo] = useState(false)
  const [form, setForm] = useState<Partial<Producto>>({ unidad_uso: 'g', factor: 1000, rendimiento: 1 })
  const [stockNuevo, setStockNuevo] = useState('')
  const [motivo, setMotivo] = useState('')

  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase()
    return (productos ?? []).filter((p) => !t || p.nombre.toLowerCase().includes(t))
  }, [productos, busca])

  const bajoMinimo = (productos ?? []).filter((p) => p.minimo != null && p.stock_actual < p.minimo)
  const sinPrecio = (productos ?? []).filter((p) => p.precio_ultimo == null)

  const columnas: Columna<Producto>[] = [
    { clave: 'nombre', titulo: 'Producto', celda: (p) => (
      <span className="flex items-center gap-2">
        {p.nombre}
        {p.precio_ultimo == null && <Insignia tono="aviso">sin precio</Insignia>}
        {p.minimo != null && p.stock_actual < p.minimo && <Insignia tono="alerta">bajo mínimo</Insignia>}
      </span>
    ) },
    { clave: 'categoria', titulo: 'Categoría', principal: false, celda: (p) => p.categoria ?? '—' },
    { clave: 'stock', titulo: 'En cámara', alineada: 'derecha', celda: (p) => cantidad(p.stock_actual, p.unidad_uso) },
    { clave: 'coste', titulo: `Coste`, alineada: 'derecha', celda: (p) => {
      const c = costeUnidadUso(p)
      return c == null ? '—' : `${euros(c, 4)}/${p.unidad_uso}`
    } },
  ]

  async function crear() {
    if (!form.nombre?.trim()) return
    await guardar.mutateAsync({
      nombre: form.nombre.trim(),
      categoria: form.categoria ?? null,
      unidad_compra: form.unidad_compra ?? null,
      unidad_uso: form.unidad_uso ?? 'g',
      factor: Number(form.factor) || 1,
      rendimiento: Number(form.rendimiento) || 1,
      stock_actual: Number(form.stock_actual) || 0,
      minimo: form.minimo != null ? Number(form.minimo) : null,
      precio_ultimo: form.precio_ultimo != null ? Number(form.precio_ultimo) : null,
      proveedor_id: form.proveedor_id || null,
    })
    setNuevo(false)
    setForm({ unidad_uso: 'g', factor: 1000, rendimiento: 1 })
  }

  async function corregirStock() {
    if (!ficha || stockNuevo === '') return
    await ajustar.mutateAsync({
      producto: ficha,
      nuevo: Number(stockNuevo.replace(',', '.')),
      motivo: motivo.trim() || 'Ajuste a mano',
    })
    setFicha(null); setStockNuevo(''); setMotivo('')
  }

  if (isLoading) return <Cargando texto="Abriendo la cámara" />
  if (error) return <Aviso nivel="urgente" titulo="No se han podido leer los productos">Comprueba la conexión con el servidor.</Aviso>

  return (
    <div className="flex flex-col gap-4">
      {(bajoMinimo.length > 0 || sinPrecio.length > 0) && (
        <div className="grid gap-2 md:grid-cols-2">
          {bajoMinimo.length > 0 && (
            <Aviso nivel="importante" titulo={`${bajoMinimo.length} producto(s) bajo mínimo`}>
              {bajoMinimo.slice(0, 3).map((p) => p.nombre).join(', ')}
              {bajoMinimo.length > 3 && ` y ${bajoMinimo.length - 3} más`}.
            </Aviso>
          )}
          {sinPrecio.length > 0 && (
            <Aviso nivel="informativo" titulo={`${sinPrecio.length} producto(s) sin precio`}>
              Cuentan cero en los escandallos hasta el primer albarán donde aparezcan.
            </Aviso>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-3 size-5 text-tinta-tenue" aria-hidden />
          <input
            className="h-11 w-full rounded-md border border-borde bg-lienzo pl-10 pr-3 text-sm"
            placeholder="Buscar producto"
            value={busca} onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Boton onClick={() => setNuevo(true)}><Plus className="size-4" aria-hidden /> Nuevo producto</Boton>
      </div>

      <Tabla
        columnas={columnas}
        filas={lista}
        claveFila={(p) => p.id}
        onAbrir={(p) => { setFicha(p); setStockNuevo(String(p.stock_actual)); }}
        vacio={
          <Vacio
            icono={<Boxes className="size-8" aria-hidden />}
            titulo="La cámara está vacía"
            explicacion="Da de alta lo que compras habitualmente. Con el formato y el rendimiento, Estook calcula el coste real de cada gramo."
            accion={<Boton onClick={() => setNuevo(true)}>Dar de alta el primero</Boton>}
          />
        }
      />

      {/* Ficha del producto */}
      <Hoja
        abierta={Boolean(ficha)}
        titulo={ficha?.nombre ?? ''}
        descripcion={ficha ? `${ficha.categoria ?? 'Sin categoría'} · ${ficha.unidad_compra ?? 'sin formato'}` : ''}
        onCerrar={() => setFicha(null)}
        pie={<>
          <Boton tono="discreto" onClick={() => setFicha(null)}>Cerrar</Boton>
          <Boton onClick={() => void corregirStock()} cargando={ajustar.isPending}>Guardar cifra</Boton>
        </>}
      >
        {ficha && (
          <div className="flex flex-col gap-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <Dato etiqueta="En cámara" valor={cantidad(ficha.stock_actual, ficha.unidad_uso)} />
              <Dato etiqueta="Mínimo" valor={ficha.minimo != null ? cantidad(ficha.minimo, ficha.unidad_uso) : '—'} />
              <Dato etiqueta="Precio del formato" valor={euros(ficha.precio_ultimo)} />
              <Dato etiqueta="Coste por unidad de uso"
                valor={costeUnidadUso(ficha) == null ? '—' : `${euros(costeUnidadUso(ficha), 4)}/${ficha.unidad_uso}`} />
            </div>

            <Tarjeta titulo="Corregir lo que hay">
              <p className="text-sm text-tinta-suave">
                La cifra manda. Si dices que hay otra cantidad, hay otra cantidad: se apunta el
                ajuste con quién y cuándo, y a seguir.
              </p>
              <div className="mt-3 flex flex-col gap-3">
                <Campo etiqueta={`Cantidad real (${ficha.unidad_uso})`} obligatorio inputMode="decimal"
                  value={stockNuevo} onChange={(e) => setStockNuevo(e.target.value)} />
                <Campo etiqueta="Motivo" placeholder="Recuento de la cámara"
                  value={motivo} onChange={(e) => setMotivo(e.target.value)} />
              </div>
            </Tarjeta>
          </div>
        )}
      </Hoja>

      {/* Alta de producto */}
      <Hoja
        abierta={nuevo}
        titulo="Nuevo producto"
        descripcion="Solo el nombre es obligatorio. El resto afina el coste."
        onCerrar={() => setNuevo(false)}
        pie={<>
          <Boton tono="discreto" onClick={() => setNuevo(false)}>Cancelar</Boton>
          <Boton onClick={() => void crear()} cargando={guardar.isPending}>Dar de alta</Boton>
        </>}
      >
        <div className="flex flex-col gap-4 pt-1">
          <Campo etiqueta="Nombre" obligatorio placeholder="Pulpo cocido"
            value={form.nombre ?? ''} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <Campo etiqueta="Categoría" placeholder="Pescado"
            value={form.categoria ?? ''} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
          <Campo etiqueta="Formato de compra" placeholder="caja 3 kg"
            value={form.unidad_compra ?? ''} onChange={(e) => setForm({ ...form, unidad_compra: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Selector etiqueta="Unidad de uso" obligatorio value={form.unidad_uso ?? 'g'}
              onChange={(e) => setForm({ ...form, unidad_uso: e.target.value })}>
              {UNIDADES.map((u) => <option key={u}>{u}</option>)}
            </Selector>
            <Campo etiqueta="Unidades por formato" obligatorio inputMode="decimal"
              ayuda="Una caja de 3 kg son 3000 g."
              value={String(form.factor ?? '')} onChange={(e) => setForm({ ...form, factor: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Rendimiento" inputMode="decimal" ayuda="1 = no se limpia. 0,68 = se pierde el 32 %."
              value={String(form.rendimiento ?? '')} onChange={(e) => setForm({ ...form, rendimiento: Number(e.target.value) })} />
            <Campo etiqueta="Precio del formato" inputMode="decimal"
              value={String(form.precio_ultimo ?? '')} onChange={(e) => setForm({ ...form, precio_ultimo: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Hay ahora" inputMode="decimal"
              value={String(form.stock_actual ?? '')} onChange={(e) => setForm({ ...form, stock_actual: Number(e.target.value) })} />
            <Campo etiqueta="Mínimo en cámara" inputMode="decimal"
              value={String(form.minimo ?? '')} onChange={(e) => setForm({ ...form, minimo: Number(e.target.value) })} />
          </div>
          <Selector etiqueta="Proveedor" value={form.proveedor_id ?? ''}
            onChange={(e) => setForm({ ...form, proveedor_id: e.target.value })}>
            <option value="">Sin asignar</option>
            {(proveedores ?? []).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </Selector>
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

// ============================ PROVEEDORES ============================

function Proveedores({ localId }: { localId?: string }) {
  const { data, isLoading } = useProveedores(localId)
  const guardar = useGuardarProveedor(localId)
  const [nuevo, setNuevo] = useState(false)
  const [form, setForm] = useState<Partial<Proveedor>>({})

  if (isLoading) return <Cargando />

  const columnas: Columna<Proveedor>[] = [
    { clave: 'nombre', titulo: 'Proveedor', celda: (p) => p.nombre },
    { clave: 'tel', titulo: 'Teléfono', celda: (p) => p.telefono ?? '—' },
    { clave: 'min', titulo: 'Pedido mínimo', alineada: 'derecha', celda: (p) => euros(p.pedido_minimo) },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Boton onClick={() => setNuevo(true)}><Plus className="size-4" aria-hidden /> Nuevo proveedor</Boton>
      </div>

      <Tabla
        columnas={columnas} filas={data ?? []} claveFila={(p) => p.id}
        vacio={
          <Vacio
            icono={<Truck className="size-8" aria-hidden />}
            titulo="Todavía no hay proveedores"
            explicacion="Con su teléfono y su correo, los pedidos salen por WhatsApp con un toque."
            accion={<Boton onClick={() => setNuevo(true)}>Añadir el primero</Boton>}
          />
        }
      />

      <Hoja abierta={nuevo} titulo="Nuevo proveedor" onCerrar={() => setNuevo(false)}
        pie={<>
          <Boton tono="discreto" onClick={() => setNuevo(false)}>Cancelar</Boton>
          <Boton cargando={guardar.isPending}
            onClick={async () => {
              if (!form.nombre?.trim()) return
              await guardar.mutateAsync({
                nombre: form.nombre.trim(),
                telefono: form.telefono ?? null, correo: form.correo ?? null, web: form.web ?? null,
                pedido_minimo: form.pedido_minimo != null ? Number(form.pedido_minimo) : null,
                notas: form.notas ?? null,
              })
              setNuevo(false); setForm({})
            }}>Guardar</Boton>
        </>}>
        <div className="flex flex-col gap-4 pt-1">
          <Campo etiqueta="Nombre" obligatorio value={form.nombre ?? ''} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <Campo etiqueta="Teléfono" inputMode="tel" value={form.telefono ?? ''} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          <Campo etiqueta="Correo" type="email" value={form.correo ?? ''} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
          <Campo etiqueta="Web" value={form.web ?? ''} onChange={(e) => setForm({ ...form, web: e.target.value })} />
          <Campo etiqueta="Pedido mínimo" inputMode="decimal" value={String(form.pedido_minimo ?? '')}
            onChange={(e) => setForm({ ...form, pedido_minimo: Number(e.target.value) })} />
        </div>
      </Hoja>
    </div>
  )
}

// ============================ PEDIDOS ============================

const ESTADOS = {
  borrador: { texto: 'Borrador', tono: 'neutro' },
  enviado: { texto: 'Enviado', tono: 'aviso' },
  recibido: { texto: 'Recibido', tono: 'ok' },
  cancelado: { texto: 'Cancelado', tono: 'alerta' },
} as const

function Pedidos({ localId }: { localId?: string }) {
  const { data: pedidos, isLoading } = usePedidos(localId)
  const { data: proveedores } = useProveedores(localId)
  const { data: productos } = useProductos(localId)
  const crear = useCrearPedido(localId)
  const mover = useMoverPedido(localId)

  const [nuevo, setNuevo] = useState(false)
  const [proveedorId, setProveedorId] = useState('')
  const [lineas, setLineas] = useState<{ producto_id: string; cantidad: string }[]>([{ producto_id: '', cantidad: '' }])
  const [recibiendo, setRecibiendo] = useState<string | null>(null)
  const [albaran, setAlbaran] = useState('')

  if (isLoading) return <Cargando />

  const nombreProveedor = (id: string) => (proveedores ?? []).find((p) => p.id === id)?.nombre ?? 'Proveedor'
  const bajoMinimo = (productos ?? []).filter((p) => p.minimo != null && p.stock_actual < p.minimo)

  return (
    <div className="flex flex-col gap-4">
      {bajoMinimo.length > 0 && (
        <Aviso
          nivel="importante"
          titulo="Hay género bajo mínimo"
          acciones={
            <Boton tamano="pequeno" onClick={() => {
              setLineas(bajoMinimo.slice(0, 8).map((p) => ({
                producto_id: p.id,
                cantidad: String(Math.max(1, Math.ceil(((p.minimo ?? 0) * 2 - p.stock_actual) / (p.factor || 1)))),
              })))
              setNuevo(true)
            }}>
              Montar el pedido
            </Boton>
          }
        >
          {bajoMinimo.map((p) => p.nombre).slice(0, 4).join(', ')}.
        </Aviso>
      )}

      <div className="flex justify-end">
        <Boton onClick={() => setNuevo(true)}><Plus className="size-4" aria-hidden /> Nuevo pedido</Boton>
      </div>

      {(pedidos ?? []).length === 0 ? (
        <Vacio
          icono={<ClipboardList className="size-8" aria-hidden />}
          titulo="Ningún pedido todavía"
          explicacion="Un pedido recorre tres estados: borrador, enviado y recibido. Al recibirlo, el stock sube solo."
          accion={<Boton onClick={() => setNuevo(true)}>Crear el primero</Boton>}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {(pedidos ?? []).map((p) => {
            const e = ESTADOS[p.estado]
            return (
              <li key={p.id} className="rounded-lg border border-borde bg-lienzo p-4 shadow-tarjeta">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{nombreProveedor(p.proveedor_id)}</span>
                  <Insignia tono={e.tono}>{e.texto}</Insignia>
                  <span className="text-xs text-tinta-tenue">
                    {new Date(p.creado_en).toLocaleDateString('es-ES')} · {p.pedido_lineas?.length ?? 0} líneas
                  </span>
                  <div className="ml-auto flex gap-2">
                    {p.estado === 'borrador' && (
                      <Boton tamano="pequeno" tono="secundario"
                        onClick={() => void mover.mutateAsync({ pedido: p, estado: 'enviado' })}>Marcar enviado</Boton>
                    )}
                    {p.estado === 'enviado' && (
                      <Boton tamano="pequeno" onClick={() => { setRecibiendo(p.id); setAlbaran('') }}>Recibir</Boton>
                    )}
                  </div>
                </div>
                {recibiendo === p.id && (
                  <div className="mt-3 rounded-lg border border-borde bg-panel p-3">
                    <p className="text-sm font-semibold">¿Ha llegado entero o con cambios?</p>
                    <p className="mt-1 text-sm text-tinta-suave">
                      Entero entra todo y sube el stock. Con cambios se edita línea a línea.
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

      <Hoja abierta={nuevo} titulo="Nuevo pedido" descripcion="El precio no se pide aquí: se apunta al recibirlo."
        onCerrar={() => setNuevo(false)}
        pie={<>
          <Boton tono="discreto" onClick={() => setNuevo(false)}>Cancelar</Boton>
          <Boton cargando={crear.isPending}
            onClick={async () => {
              if (!proveedorId) return
              await crear.mutateAsync({
                proveedorId,
                lineas: lineas.filter((l) => l.producto_id && Number(l.cantidad) > 0).map((l) => ({
                  producto_id: l.producto_id, nombre_libre: null, cantidad_pedida: Number(l.cantidad),
                })),
              })
              setNuevo(false); setLineas([{ producto_id: '', cantidad: '' }]); setProveedorId('')
            }}>Guardar borrador</Boton>
        </>}>
        <div className="flex flex-col gap-4 pt-1">
          {(proveedores ?? []).length === 0 && (
            <Aviso nivel="importante" titulo="Primero hace falta un proveedor">
              Date de alta uno en la pestaña de al lado.
            </Aviso>
          )}
          <Selector etiqueta="Proveedor" obligatorio value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
            <option value="">Elige</option>
            {(proveedores ?? []).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </Selector>

          <div className="flex flex-col gap-3">
            {lineas.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr,100px] gap-2">
                <Selector etiqueta={i === 0 ? 'Producto' : ''} value={l.producto_id}
                  onChange={(e) => setLineas(lineas.map((x, j) => j === i ? { ...x, producto_id: e.target.value } : x))}>
                  <option value="">Elige</option>
                  {(productos ?? []).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </Selector>
                <Campo etiqueta={i === 0 ? 'Formatos' : ''} inputMode="decimal" value={l.cantidad}
                  onChange={(e) => setLineas(lineas.map((x, j) => j === i ? { ...x, cantidad: e.target.value } : x))} />
              </div>
            ))}
            <Boton tono="discreto" onClick={() => setLineas([...lineas, { producto_id: '', cantidad: '' }])}>
              <Plus className="size-4" aria-hidden /> Otra línea
            </Boton>
          </div>

          <p className="flex items-start gap-2 text-xs text-tinta-tenue">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Las cantidades van en formatos de compra (cajas, sacos), no en gramos.
          </p>
        </div>
      </Hoja>
    </div>
  )
}
