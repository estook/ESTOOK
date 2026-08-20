import { useMemo, useState } from 'react'
import { Boxes, Plus, Search, Truck } from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { Campo, Selector } from '@/componentes/Campo'
import { Hoja } from '@/componentes/Hoja'
import { Tabla, type Columna } from '@/componentes/Tabla'
import { Aviso, Cargando, Insignia, Vacio } from '@/componentes/Estado'
import { Tarjeta } from '@/componentes/Tarjeta'
import { useSesion } from '@/app/sesion'
import {
  costeUnidadUso, euros,
  useAjustarStock, useGuardarProducto, useGuardarProveedor,
  useProductos, useProveedores,
  type Producto, type Proveedor,
} from '@/datos/despensa'
import {
  FORMATOS, GRANDE, MERMAS_HABITUALES, PEQUENA,
  aGrande, aPequena, mostrar, resumenDeCompra,
  type UnidadGrande,
} from '@/datos/unidades'
import { Pedidos } from '@/paginas/apps/Pedidos'

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
        <p className="mt-1 max-w-2xl text-sm text-tinta-suave">
          Lo que hay en cámara, a quién se lo compras y lo que te cuesta de verdad. El resto de la
          app calcula a partir de aquí.
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

const CATEGORIAS = ['Carne', 'Pescado', 'Verdura', 'Fruta', 'Lácteos', 'Congelados',
  'Secos y conservas', 'Panadería', 'Aceites', 'Bebidas', 'Vinos', 'Limpieza', 'Desechables']

interface Formulario {
  nombre: string
  categoria: string
  formato: string
  contenido: string
  unidad: UnidadGrande
  precio: string
  rendimiento: number
  stock: string
  minimo: string
  proveedorId: string
}

const FORM_VACIO: Formulario = {
  nombre: '', categoria: '', formato: 'Caja', contenido: '', unidad: 'kg',
  precio: '', rendimiento: 1, stock: '', minimo: '', proveedorId: '',
}

function Productos({ localId }: { localId?: string }) {
  const { data: productos, isLoading, error } = useProductos(localId)
  const { data: proveedores } = useProveedores(localId)
  const guardar = useGuardarProducto(localId)
  const ajustar = useAjustarStock(localId)

  const [busca, setBusca] = useState('')
  const [ficha, setFicha] = useState<Producto | null>(null)
  const [nuevo, setNuevo] = useState(false)
  const [f, setF] = useState<Formulario>(FORM_VACIO)
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
      <span className="flex flex-wrap items-center gap-2">
        {p.nombre}
        {p.precio_ultimo == null && <Insignia tono="aviso">sin precio</Insignia>}
        {p.minimo != null && p.stock_actual < p.minimo && <Insignia tono="alerta">hay que pedir</Insignia>}
      </span>
    ) },
    { clave: 'categoria', titulo: 'Categoría', principal: false, celda: (p) => p.categoria ?? '—' },
    { clave: 'stock', titulo: 'En cámara', alineada: 'derecha',
      celda: (p) => mostrar(p.stock_actual, p.unidad_uso as 'g' | 'ml' | 'ud') },
    { clave: 'coste', titulo: 'Coste útil', alineada: 'derecha', celda: (p) => {
      const c = costeUnidadUso(p)
      if (c == null) return '—'
      const grande = GRANDE[p.unidad_uso as 'g' | 'ml' | 'ud']
      return `${euros(aPequena(c, p.unidad_uso as 'g' | 'ml' | 'ud'))}/${grande}`
    } },
  ]

  const resumen = resumenDeCompra({
    formato: f.formato,
    contenido: Number(f.contenido.replace(',', '.')) || 0,
    unidad: f.unidad,
    precio: f.precio ? Number(f.precio.replace(',', '.')) : null,
    rendimiento: f.rendimiento,
  })

  async function crear() {
    if (!f.nombre.trim() || !f.contenido) return
    const unidadUso = PEQUENA[f.unidad]
    const contenido = Number(f.contenido.replace(',', '.'))
    await guardar.mutateAsync({
      nombre: f.nombre.trim(),
      categoria: f.categoria || null,
      unidad_compra: `${f.formato} de ${f.contenido} ${f.unidad}`,
      unidad_uso: unidadUso,
      factor: aPequena(contenido, unidadUso),          // cuántos g/ml/ud trae el formato
      rendimiento: f.rendimiento,
      stock_actual: f.stock ? aPequena(Number(f.stock.replace(',', '.')), unidadUso) : 0,
      minimo: f.minimo ? aPequena(Number(f.minimo.replace(',', '.')), unidadUso) : null,
      precio_ultimo: f.precio ? Number(f.precio.replace(',', '.')) : null,
      proveedor_id: f.proveedorId || null,
    })
    setNuevo(false)
    setF(FORM_VACIO)
  }

  async function corregirStock() {
    if (!ficha || stockNuevo === '') return
    const unidad = ficha.unidad_uso as 'g' | 'ml' | 'ud'
    await ajustar.mutateAsync({
      producto: ficha,
      nuevo: aPequena(Number(stockNuevo.replace(',', '.')), unidad),
      motivo: motivo.trim() || 'Recuento a mano',
    })
    setFicha(null); setStockNuevo(''); setMotivo('')
  }

  if (isLoading) return <Cargando texto="Abriendo la cámara" />
  if (error) return <Aviso nivel="urgente" titulo="No se han podido leer los productos">Comprueba la conexión.</Aviso>

  return (
    <div className="flex flex-col gap-4">
      {(bajoMinimo.length > 0 || sinPrecio.length > 0) && (
        <div className="grid gap-2 md:grid-cols-2">
          {bajoMinimo.length > 0 && (
            <Aviso nivel="importante" titulo={`${bajoMinimo.length} producto(s) por debajo del mínimo`}>
              {bajoMinimo.slice(0, 3).map((p) => p.nombre).join(', ')}
              {bajoMinimo.length > 3 && ` y ${bajoMinimo.length - 3} más`}.
            </Aviso>
          )}
          {sinPrecio.length > 0 && (
            <Aviso nivel="informativo" titulo={`${sinPrecio.length} producto(s) sin precio`}>
              Se pueden usar igual, pero cuentan cero al calcular el coste de los platos.
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
        columnas={columnas} filas={lista} claveFila={(p) => p.id}
        onAbrir={(p) => {
          setFicha(p)
          setStockNuevo(String(aGrande(p.stock_actual, p.unidad_uso as 'g' | 'ml' | 'ud')))
        }}
        vacio={
          <Vacio
            icono={<Boxes className="size-8" aria-hidden />}
            titulo="Aún no hay nada en la cámara"
            explicacion="Empieza por lo que más compras. Se indica cómo lo compras (caja, saco, garrafa) y cuánto trae, y Estook calcula solo lo que te cuesta el kilo útil."
            accion={<Boton onClick={() => setNuevo(true)}>Dar de alta el primero</Boton>}
          />
        }
      />

      {/* ---------- Ficha del producto ---------- */}
      <Hoja
        abierta={Boolean(ficha)}
        titulo={ficha?.nombre ?? ''}
        descripcion={ficha ? `${ficha.categoria ?? 'Sin categoría'} · se compra en ${ficha.unidad_compra ?? 'formato sin definir'}` : ''}
        onCerrar={() => setFicha(null)}
        pie={<>
          <Boton tono="discreto" onClick={() => setFicha(null)}>Cerrar</Boton>
          <Boton onClick={() => void corregirStock()} cargando={ajustar.isPending}>Guardar cantidad</Boton>
        </>}
      >
        {ficha && (() => {
          const unidad = ficha.unidad_uso as 'g' | 'ml' | 'ud'
          const grande = GRANDE[unidad]
          const coste = costeUnidadUso(ficha)
          return (
            <div className="flex flex-col gap-4 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <Dato etiqueta="Hay en cámara" valor={mostrar(ficha.stock_actual, unidad)} />
                <Dato etiqueta="Mínimo" valor={ficha.minimo != null ? mostrar(ficha.minimo, unidad) : 'sin fijar'} />
                <Dato etiqueta="Precio del formato" valor={euros(ficha.precio_ultimo)} />
                <Dato etiqueta={`Coste por ${grande} útil`}
                  valor={coste == null ? '—' : euros(aPequena(coste, unidad))} />
              </div>

              {ficha.rendimiento < 1 && (
                <p className="text-sm text-tinta-suave">
                  De cada {grande} que compras aprovechas{' '}
                  <strong>{Math.round(ficha.rendimiento * 100)} %</strong>: por eso el coste útil es
                  más alto que el de compra.
                </p>
              )}

              <Tarjeta titulo="Corregir lo que hay">
                <p className="text-sm text-tinta-suave">
                  Si has contado y no cuadra, escribe la cantidad real. Manda lo que tú digas; el
                  ajuste queda registrado con tu nombre y la fecha.
                </p>
                <div className="mt-3 flex flex-col gap-3">
                  <Campo etiqueta={`Cantidad real en ${grande}`} obligatorio inputMode="decimal"
                    value={stockNuevo} onChange={(e) => setStockNuevo(e.target.value)} />
                  <Campo etiqueta="Motivo" placeholder="Recuento del lunes"
                    value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                </div>
              </Tarjeta>
            </div>
          )
        })()}
      </Hoja>

      {/* ---------- Alta de producto, guiada ---------- */}
      <Hoja
        abierta={nuevo}
        titulo="Nuevo producto"
        descripcion="Cuatro preguntas. Con eso Estook sabe lo que te cuesta cada kilo de verdad."
        onCerrar={() => setNuevo(false)}
        pie={<>
          <Boton tono="discreto" onClick={() => setNuevo(false)}>Cancelar</Boton>
          <Boton onClick={() => void crear()} cargando={guardar.isPending}
            disabled={!f.nombre.trim() || !f.contenido}>Dar de alta</Boton>
        </>}
      >
        <div className="flex flex-col gap-6 pt-1">
          <Bloque numero={1} titulo="¿Qué producto es?">
            <Campo etiqueta="Nombre" obligatorio placeholder="Atún"
              value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} />
            <Selector etiqueta="Categoría" value={f.categoria}
              onChange={(e) => setF({ ...f, categoria: e.target.value })}>
              <option value="">Sin categoría</option>
              {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
            </Selector>
          </Bloque>

          <Bloque numero={2} titulo="¿Cómo lo compras?"
            explicacion="El formato en el que te llega del proveedor y lo que trae dentro.">
            <Selector etiqueta="Te llega en" obligatorio value={f.formato}
              onChange={(e) => setF({ ...f, formato: e.target.value })}>
              {FORMATOS.map((x) => <option key={x.clave} value={x.nombre}>{x.nombre}</option>)}
            </Selector>
            <div className="grid grid-cols-[1fr,110px] gap-3">
              <Campo etiqueta="Cada uno trae" obligatorio inputMode="decimal" placeholder="3"
                value={f.contenido} onChange={(e) => setF({ ...f, contenido: e.target.value })} />
              <Selector etiqueta="Unidad" value={f.unidad}
                onChange={(e) => setF({ ...f, unidad: e.target.value as UnidadGrande })}>
                <option value="kg">kilos</option>
                <option value="l">litros</option>
                <option value="ud">unidades</option>
              </Selector>
            </div>
            <Campo etiqueta={`Precio de 1 ${f.formato.toLowerCase()}`} inputMode="decimal" placeholder="42,00"
              ayuda="Sin IVA, como viene en el albarán. Si aún no lo sabes, déjalo vacío."
              value={f.precio} onChange={(e) => setF({ ...f, precio: e.target.value })} />
          </Bloque>

          <Bloque numero={3} titulo="¿Se limpia antes de usarlo?"
            explicacion="Lo que se va en espinas, piel o recortes. Es lo que hace que el kilo útil cueste más que el comprado.">
            <div className="flex flex-wrap gap-2">
              {MERMAS_HABITUALES.map((m) => (
                <button key={m.texto} type="button"
                  onClick={() => setF({ ...f, rendimiento: m.rendimiento })}
                  className={`rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                    f.rendimiento === m.rendimiento
                      ? 'border-naranja bg-naranja text-white'
                      : 'border-borde bg-lienzo text-tinta-suave hover:bg-panel'}`}>
                  {m.texto}
                </button>
              ))}
            </div>
          </Bloque>

          <Bloque numero={4} titulo="¿Cuánto tienes y cuándo hay que pedir?"
            explicacion={`En ${f.unidad === 'ud' ? 'unidades' : f.unidad === 'l' ? 'litros' : 'kilos'}, como lo cuentas en la cámara.`}>
            <div className="grid grid-cols-2 gap-3">
              <Campo etiqueta={`Hay ahora (${f.unidad})`} inputMode="decimal"
                value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} />
              <Campo etiqueta={`Avisar por debajo de (${f.unidad})`} inputMode="decimal"
                value={f.minimo} onChange={(e) => setF({ ...f, minimo: e.target.value })} />
            </div>
            <Selector etiqueta="Proveedor habitual" value={f.proveedorId}
              onChange={(e) => setF({ ...f, proveedorId: e.target.value })}>
              <option value="">Sin asignar</option>
              {(proveedores ?? []).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </Selector>
          </Bloque>

          {resumen && (
            <div className="rounded-lg border border-naranja/30 bg-naranja-suave p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-naranja-oscuro">Así queda</p>
              <p className="mt-1 text-sm font-medium">{resumen}</p>
            </div>
          )}
        </div>
      </Hoja>
    </div>
  )
}

function Bloque({ numero, titulo, explicacion, children }: {
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

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-lg border border-borde bg-panel p-3">
      <p className="text-xs font-semibold uppercase leading-tight tracking-wide text-tinta-tenue">{etiqueta}</p>
      <p className="cifras mt-0.5 font-semibold">{valor}</p>
    </div>
  )
}

// ============================ PROVEEDORES ============================

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function Proveedores({ localId }: { localId?: string }) {
  const { data, isLoading } = useProveedores(localId)
  const guardar = useGuardarProveedor(localId)
  const [nuevo, setNuevo] = useState(false)
  const [form, setForm] = useState<Partial<Proveedor> & { dias?: string[] }>({ dias: [] })

  if (isLoading) return <Cargando />

  const columnas: Columna<Proveedor>[] = [
    { clave: 'nombre', titulo: 'Proveedor', celda: (p) => p.nombre },
    { clave: 'tel', titulo: 'Teléfono', celda: (p) => p.telefono ?? '—' },
    { clave: 'dias', titulo: 'Reparto', principal: false,
      celda: (p) => (p.dias_reparto ?? []).join(', ') || '—' },
    { clave: 'min', titulo: 'Pedido mínimo', alineada: 'derecha', celda: (p) => euros(p.pedido_minimo) },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-tinta-suave">
          Con el teléfono guardado, los pedidos salen por WhatsApp desde el móvil.
        </p>
        <Boton onClick={() => setNuevo(true)}><Plus className="size-4" aria-hidden /> Nuevo proveedor</Boton>
      </div>

      <Tabla
        columnas={columnas} filas={data ?? []} claveFila={(p) => p.id}
        vacio={
          <Vacio
            icono={<Truck className="size-8" aria-hidden />}
            titulo="Todavía no hay proveedores"
            explicacion="Da de alta a quien te sirve habitualmente: su teléfono, sus días de reparto y su pedido mínimo."
            accion={<Boton onClick={() => setNuevo(true)}>Añadir el primero</Boton>}
          />
        }
      />

      <Hoja abierta={nuevo} titulo="Nuevo proveedor" onCerrar={() => setNuevo(false)}
        pie={<>
          <Boton tono="discreto" onClick={() => setNuevo(false)}>Cancelar</Boton>
          <Boton cargando={guardar.isPending} disabled={!form.nombre?.trim()}
            onClick={async () => {
              if (!form.nombre?.trim()) return
              await guardar.mutateAsync({
                nombre: form.nombre.trim(),
                telefono: form.telefono ?? null,
                correo: form.correo ?? null,
                web: form.web ?? null,
                dias_reparto: form.dias?.length ? form.dias : null,
                pedido_minimo: form.pedido_minimo != null ? Number(form.pedido_minimo) : null,
                notas: form.notas ?? null,
              })
              setNuevo(false); setForm({ dias: [] })
            }}>Guardar</Boton>
        </>}>
        <div className="flex flex-col gap-6 pt-1">
          <Bloque numero={1} titulo="Quién es">
            <Campo etiqueta="Nombre" obligatorio placeholder="Pescados Gil"
              value={form.nombre ?? ''} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            <Campo etiqueta="Teléfono" inputMode="tel" ayuda="Con este número se abre el WhatsApp del pedido."
              value={form.telefono ?? ''} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            <Campo etiqueta="Correo" type="email"
              value={form.correo ?? ''} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
          </Bloque>

          <Bloque numero={2} titulo="Cómo trabaja" explicacion="Para avisarte a tiempo de cuándo hay que hacer el pedido.">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-tinta-suave">Días de reparto</p>
              <div className="flex flex-wrap gap-1.5">
                {DIAS.map((d) => {
                  const puesto = form.dias?.includes(d)
                  return (
                    <button key={d} type="button"
                      onClick={() => setForm({
                        ...form,
                        dias: puesto ? form.dias!.filter((x) => x !== d) : [...(form.dias ?? []), d],
                      })}
                      className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${
                        puesto ? 'border-naranja bg-naranja text-white' : 'border-borde bg-lienzo text-tinta-suave'}`}>
                      {d.slice(0, 3)}
                    </button>
                  )
                })}
              </div>
            </div>
            <Campo etiqueta="Pedido mínimo (€)" inputMode="decimal"
              value={String(form.pedido_minimo ?? '')}
              onChange={(e) => setForm({ ...form, pedido_minimo: Number(e.target.value) })} />
            <Campo etiqueta="Notas" placeholder="Pedir antes de las 18:00 del día anterior"
              value={form.notas ?? ''} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          </Bloque>
        </div>
      </Hoja>
    </div>
  )
}
