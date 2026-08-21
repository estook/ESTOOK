import { useMemo, useState } from 'react'
import { ChefHat, Plus, Trash2, UtensilsCrossed, Eye, EyeOff } from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { Campo, Selector } from '@/componentes/Campo'
import { Hoja } from '@/componentes/Hoja'
import { Tabla, type Columna } from '@/componentes/Tabla'
import { Aviso, Cargando, Insignia, Vacio } from '@/componentes/Estado'
import { Tarjeta } from '@/componentes/Tarjeta'
import { useSesion } from '@/app/sesion'
import { euros, useProductos, type Producto } from '@/datos/despensa'
import { BotonDocumento } from '@/documentos/BotonDocumento'
import { cartaCompleta, fichaTecnica } from '@/documentos/plantillas'
import {
  ETIQUETA_CATEGORIA, clasificar, escandallo, precioRecomendado,
  useBorrarIngrediente, useCarta, useGuardarIngrediente, useGuardarPlato,
  useGuardarPlatoDeCarta, useGuardarSeccion, useIngredientes, usePlatos,
  type Plato,
} from '@/datos/cocina'

const MARGEN_OBJETIVO = 70

export function Cocina() {
  const { actual } = useSesion()
  const [pestana, setPestana] = useState<'fichas' | 'carta'>('fichas')

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="flex items-center gap-2 font-titulo text-2xl font-semibold">
          <ChefHat className="size-6 text-naranja" aria-hidden /> Cocina
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-tinta-suave">
          Las fichas mandan: de ahí sale el coste de cada plato y de ahí sale el margen de la carta.
        </p>
      </header>

      <nav className="flex gap-1 border-b border-borde">
        {([['fichas', 'Fichas técnicas'], ['carta', 'Carta']] as const).map(([k, n]) => (
          <button key={k} onClick={() => setPestana(k)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold ${
              pestana === k ? 'border-naranja text-naranja-oscuro' : 'border-transparent text-tinta-suave hover:text-tinta'}`}>
            {n}
          </button>
        ))}
      </nav>

      {pestana === 'fichas' ? <Fichas localId={actual?.local_id} rol={actual?.rol} /> : <Carta localId={actual?.local_id} />}
    </div>
  )
}

// ============================ FICHAS ============================

const SIN_IMPORTES = ['cocinero', 'sala']

function Fichas({ localId, rol }: { localId?: string; rol?: string }) {
  const { data: platos, isLoading } = usePlatos(localId)
  const { data: productos } = useProductos(localId)
  const guardar = useGuardarPlato(localId)

  const [abierta, setAbierta] = useState<Plato | null>(null)
  const [nueva, setNueva] = useState(false)
  const [form, setForm] = useState<Partial<Plato>>({ iva: 10 })
  const [verImportes, setVerImportes] = useState(true)

  const ocultarSiempre = SIN_IMPORTES.includes(rol ?? '')
  const conImportes = !ocultarSiempre && verImportes

  const columnas: Columna<Plato>[] = [
    { clave: 'nombre', titulo: 'Plato', celda: (p) => (
      <span className="flex items-center gap-2">{p.nombre}{p.agotado && <Insignia tono="alerta">agotado</Insignia>}</span>
    ) },
    { clave: 'familia', titulo: 'Familia', principal: false, celda: (p) => p.familia ?? '—' },
    ...(conImportes ? [{ clave: 'precio', titulo: 'Precio', alineada: 'derecha' as const, celda: (p: Plato) => euros(p.precio_venta) }] : []),
  ]

  if (isLoading) return <Cargando texto="Abriendo el recetario" />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-tinta-suave">
          {ocultarSiempre
            ? 'Ves los gramajes, los pasos y los alérgenos. Los importes no son cosa tuya.'
            : 'Gramajes, coste por línea, margen y precio recomendado.'}
        </p>
        <div className="flex gap-2">
          {!ocultarSiempre && (
            <Boton tono="discreto" tamano="pequeno" onClick={() => setVerImportes(!verImportes)}>
              {verImportes ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
              {verImportes ? 'Ver como cocinero' : 'Ver costes'}
            </Boton>
          )}
          <Boton onClick={() => setNueva(true)}><Plus className="size-4" aria-hidden /> Nueva ficha</Boton>
        </div>
      </div>

      <Tabla
        columnas={columnas} filas={platos ?? []} claveFila={(p) => p.id} onAbrir={setAbierta}
        vacio={
          <Vacio
            icono={<UtensilsCrossed className="size-8" aria-hidden />}
            titulo="Todavía no hay fichas"
            explicacion="Una ficha por plato: sus ingredientes con gramajes, sus pasos y su precio. Con eso, Estook calcula el margen real de tu carta."
            accion={<Boton onClick={() => setNueva(true)}>Crear la primera</Boton>}
          />
        }
      />

      <FichaAbierta
        plato={abierta} onCerrar={() => setAbierta(null)}
        productos={productos ?? []} conImportes={conImportes} localId={localId}
      />

      <Hoja abierta={nueva} titulo="Nueva ficha técnica" descripcion="El nombre basta para empezar; los ingredientes se añaden dentro."
        onCerrar={() => setNueva(false)}
        pie={<>
          <Boton tono="discreto" onClick={() => setNueva(false)}>Cancelar</Boton>
          <Boton cargando={guardar.isPending} onClick={async () => {
            if (!form.nombre?.trim()) return
            const creado = await guardar.mutateAsync({
              nombre: form.nombre.trim(),
              familia: form.familia ?? null,
              precio_venta: form.precio_venta != null ? Number(form.precio_venta) : null,
              iva: Number(form.iva) || 10,
              descripcion: form.descripcion ?? null,
            })
            setNueva(false); setForm({ iva: 10 }); setAbierta(creado)
          }}>Crear</Boton>
        </>}>
        <div className="flex flex-col gap-4 pt-1">
          <Campo etiqueta="Nombre del plato" obligatorio placeholder="Pulpo a la brasa"
            value={form.nombre ?? ''} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <Campo etiqueta="Familia" placeholder="Pescados"
            value={form.familia ?? ''} onChange={(e) => setForm({ ...form, familia: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Precio de venta" inputMode="decimal" ayuda="Con IVA, como aparece en la carta."
              value={String(form.precio_venta ?? '')} onChange={(e) => setForm({ ...form, precio_venta: Number(e.target.value) })} />
            <Selector etiqueta="IVA" value={String(form.iva ?? 10)} onChange={(e) => setForm({ ...form, iva: Number(e.target.value) })}>
              <option value="10">10 %</option>
              <option value="21">21 %</option>
              <option value="4">4 %</option>
            </Selector>
          </div>
        </div>
      </Hoja>
    </div>
  )
}

function FichaAbierta({
  plato, onCerrar, productos, conImportes, localId,
}: {
  plato: Plato | null
  onCerrar: () => void
  productos: Producto[]
  conImportes: boolean
  localId?: string
}) {
  const { data: ingredientes } = useIngredientes(plato?.id)
  const anadir = useGuardarIngrediente(plato?.id)
  const borrar = useBorrarIngrediente(plato?.id)
  const guardar = useGuardarPlato(localId)

  const [productoId, setProductoId] = useState('')
  const [gramos, setGramos] = useState('')
  const [editando, setEditando] = useState(false)
  const [datos, setDatos] = useState({ nombre: '', familia: '', precio: '', iva: '10' })

  const cuentas = useMemo(
    () => plato ? escandallo(ingredientes ?? [], productos, plato) : null,
    [ingredientes, productos, plato],
  )

  if (!plato) return null

  const recomendado = cuentas ? precioRecomendado(cuentas.costeTotal, MARGEN_OBJETIVO, plato.iva) : null

  return (
    <Hoja
      abierta
      titulo={plato.nombre}
      descripcion={`${plato.familia ?? 'Sin familia'} · versión ${plato.version}`}
      onCerrar={onCerrar}
      pie={
        <div className="flex w-full items-center gap-2">
          <BotonDocumento
            pequeno
            etiqueta="PDF"
            opciones={[
              {
                clave: 'con', nombre: 'Ficha con costes',
                descripcion: 'Ingredientes, coste por línea, margen y precio. Para jefatura.',
                archivo: `ficha-${plato.nombre}`,
                generar: (marca, quien) =>
                  fichaTecnica(marca, plato, ingredientes ?? [], productos, { conCostes: true }, { generadoPor: quien }),
              },
              {
                clave: 'sin', nombre: 'Ficha para cocina',
                descripcion: 'Gramajes y pasos, sin un solo importe. Para colgar en el pase.',
                archivo: `ficha-cocina-${plato.nombre}`,
                generar: (marca, quien) =>
                  fichaTecnica(marca, plato, ingredientes ?? [], productos, { conCostes: false }, { generadoPor: quien }),
              },
            ]}
          />
          <div className="flex-1" />
          <Boton tono="discreto" onClick={onCerrar}>Cerrar</Boton>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pt-1">
        {conImportes && cuentas && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Dato etiqueta="Coste del plato" valor={euros(cuentas.costeTotal, 3)} />
              <Dato etiqueta="Precio (con IVA)" valor={euros(plato.precio_venta)} />
              <Dato etiqueta="Base sin IVA" valor={euros(cuentas.base)} />
              <Dato
                etiqueta="Margen"
                valor={cuentas.margen == null ? '—' : `${cuentas.margen.toFixed(1).replace('.', ',')} %`}
                tono={cuentas.margen == null ? undefined : cuentas.margen >= MARGEN_OBJETIVO ? 'ok' : 'alerta'}
              />
            </div>

            {cuentas.hayIncompletos && (
              <Aviso nivel="importante" titulo="Hay ingredientes sin precio">
                Cuentan como cero, así que el margen que ves es mejor que el real. En cuanto entre
                el albarán, se recalcula solo.
              </Aviso>
            )}

            {cuentas.margen != null && cuentas.margen < MARGEN_OBJETIVO && recomendado && (
              <Aviso
                nivel="urgente"
                titulo={`Este plato se te queda en el ${cuentas.margen.toFixed(0)} % de margen`}
                acciones={
                  <Boton tamano="pequeno" onClick={() => void guardar.mutateAsync({ id: plato.id, nombre: plato.nombre, precio_venta: Number(recomendado.toFixed(2)) })}>
                    Subirlo a {euros(recomendado)}
                  </Boton>
                }
              >
                Para tu objetivo del {MARGEN_OBJETIVO} % tendría que costar {euros(recomendado)}.
              </Aviso>
            )}
          </>
        )}

        <Tarjeta titulo="Ingredientes">
          {(ingredientes ?? []).length === 0 ? (
            <p className="text-sm text-tinta-suave">Todavía no lleva nada. Añade el primero abajo.</p>
          ) : (
            <ul className="flex flex-col">
              {(cuentas?.lineas ?? []).map((l) => (
                <li key={l.ingrediente.id} className="flex items-center justify-between gap-3 border-b border-borde py-2 last:border-0">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{l.producto?.nombre ?? 'Producto borrado'}</span>
                    <span className="text-xs text-tinta-tenue">
                      {l.ingrediente.cantidad} {l.producto?.unidad_uso ?? 'g'}
                      {l.sinPrecio && ' · sin precio'}
                    </span>
                  </span>
                  {conImportes && <span className="cifras text-sm">{euros(l.costeLinea, 3)}</span>}
                  <button
                    aria-label="Quitar"
                    onClick={() => void borrar.mutateAsync(l.ingrediente.id)}
                    className="grid size-9 place-items-center rounded-md text-tinta-tenue hover:bg-panel"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 grid grid-cols-[1fr,90px,auto] items-end gap-2">
            <Selector etiqueta="Añadir" value={productoId} onChange={(e) => setProductoId(e.target.value)}>
              <option value="">Elige producto</option>
              {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </Selector>
            <Campo etiqueta="Cantidad" inputMode="decimal" value={gramos} onChange={(e) => setGramos(e.target.value)} />
            <Boton
              cargando={anadir.isPending}
              onClick={async () => {
                if (!productoId || !gramos) return
                await anadir.mutateAsync({ productoId, cantidad: Number(gramos.replace(',', '.')) })
                setProductoId(''); setGramos('')
              }}
            >
              <Plus className="size-4" aria-hidden />
            </Boton>
          </div>
          <p className="mt-2 text-xs text-tinta-tenue">
            La cantidad va en la unidad de uso del producto (gramos, mililitros o unidades).
          </p>
        </Tarjeta>

        {conImportes && (
          <Tarjeta
            titulo={editando ? 'Editar el plato' : 'Datos del plato'}
            acciones={
              <Boton tamano="pequeno" tono="discreto"
                onClick={() => {
                  setDatos({
                    nombre: plato.nombre,
                    familia: plato.familia ?? '',
                    precio: plato.precio_venta != null ? String(plato.precio_venta) : '',
                    iva: String(plato.iva ?? 10),
                  })
                  setEditando(!editando)
                }}>
                {editando ? 'Dejarlo' : 'Editar'}
              </Boton>
            }
          >
            {editando ? (
              <div className="flex flex-col gap-3">
                <Campo etiqueta="Nombre" obligatorio value={datos.nombre}
                  onChange={(e) => setDatos({ ...datos, nombre: e.target.value })} />
                <Campo etiqueta="Familia" value={datos.familia}
                  onChange={(e) => setDatos({ ...datos, familia: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Campo etiqueta="Precio con IVA" inputMode="decimal" value={datos.precio}
                    onChange={(e) => setDatos({ ...datos, precio: e.target.value })} />
                  <Selector etiqueta="IVA" value={datos.iva}
                    onChange={(e) => setDatos({ ...datos, iva: e.target.value })}>
                    <option value="10">10 %</option>
                    <option value="21">21 %</option>
                    <option value="4">4 %</option>
                  </Selector>
                </div>
                <Boton
                  cargando={guardar.isPending}
                  onClick={async () => {
                    if (!datos.nombre.trim()) return
                    await guardar.mutateAsync({
                      id: plato.id,
                      nombre: datos.nombre.trim(),
                      familia: datos.familia || null,
                      precio_venta: datos.precio ? Number(datos.precio.replace(',', '.')) : null,
                      iva: Number(datos.iva),
                    })
                    setEditando(false); onCerrar()
                  }}
                >Guardar cambios</Boton>
              </div>
            ) : (
              <p className="text-sm text-tinta-suave">
                {plato.familia ?? 'Sin familia'} · {euros(plato.precio_venta)} con IVA del {plato.iva} %.
              </p>
            )}
          </Tarjeta>
        )}
      </div>
    </Hoja>
  )
}

function Dato({ etiqueta, valor, tono }: { etiqueta: string; valor: string; tono?: 'ok' | 'alerta' }) {
  return (
    <div className="rounded-lg border border-borde bg-panel p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-tinta-tenue">{etiqueta}</p>
      <p className={`cifras mt-0.5 font-semibold ${tono === 'ok' ? 'text-ok' : tono === 'alerta' ? 'text-alerta' : ''}`}>{valor}</p>
    </div>
  )
}

// ============================ CARTA ============================

function Carta({ localId }: { localId?: string }) {
  const { data: secciones, isLoading } = useCarta(localId)
  const { data: platos } = usePlatos(localId)
  const { data: productos } = useProductos(localId)
  const crearSeccion = useGuardarSeccion(localId)
  const guardarPlatoCarta = useGuardarPlatoDeCarta(localId)

  const [nombreSeccion, setNombreSeccion] = useState('')
  const [enSeccion, setEnSeccion] = useState<string | null>(null)
  const [platoId, setPlatoId] = useState('')

  // Análisis de rentabilidad: se necesita coste y precio; las ventas llegarán con el TPV.
  const analisis = useMemo(() => {
    const lista = (platos ?? []).map((p) => {
      const c = escandallo([], productos ?? [], p)
      return { plato: p, margen: c.margen }
    })
    const conMargen = lista.filter((x) => x.margen != null) as { plato: Plato; margen: number }[]
    const margenMedio = conMargen.length ? conMargen.reduce((s, x) => s + x.margen, 0) / conMargen.length : 0
    return { lista, margenMedio }
  }, [platos, productos])

  if (isLoading) return <Cargando texto="Montando la carta" />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[200px] flex-1">
          <Campo etiqueta="Nueva sección" placeholder="Entrantes, Arroces, Postres…"
            value={nombreSeccion} onChange={(e) => setNombreSeccion(e.target.value)} />
        </div>
        <Boton
          cargando={crearSeccion.isPending}
          onClick={async () => {
            if (!nombreSeccion.trim()) return
            await crearSeccion.mutateAsync({ nombre: nombreSeccion.trim(), orden: (secciones?.length ?? 0) + 1 })
            setNombreSeccion('')
          }}
        ><Plus className="size-4" aria-hidden /> Añadir sección</Boton>
        <BotonDocumento
          opciones={[{
            clave: 'carta', nombre: 'Carta completa',
            descripcion: 'A dos columnas, con secciones y precios. Lista para imprimir.',
            archivo: 'carta',
            generar: (marca, quien) => cartaCompleta(
              marca,
              (secciones ?? []).map((s) => ({
                nombre: s.nombre,
                platos: s.carta_platos
                  .slice().sort((a, b) => a.orden - b.orden)
                  .map((cp) => {
                    const ficha = (platos ?? []).find((p) => p.id === cp.plato_id)
                    return {
                      nombre: ficha?.nombre ?? cp.nombre ?? 'Plato',
                      descripcion: cp.descripcion ?? ficha?.descripcion ?? null,
                      precio: cp.precio ?? ficha?.precio_venta ?? null,
                    }
                  }),
              })),
              { generadoPor: quien },
            ),
          }]}
        />
      </div>

      {(secciones ?? []).length === 0 ? (
        <Vacio
          icono={<UtensilsCrossed className="size-8" aria-hidden />}
          titulo="La carta está vacía"
          explicacion="Empieza por las secciones (entrantes, arroces, postres) y dentro coloca los platos que ya tienen ficha."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {(secciones ?? []).map((s) => (
            <Tarjeta key={s.id} titulo={s.nombre}
              acciones={
                <Boton tamano="pequeno" tono="discreto" onClick={() => setEnSeccion(enSeccion === s.id ? null : s.id)}>
                  <Plus className="size-4" aria-hidden /> Plato
                </Boton>
              }>
              {s.carta_platos.length === 0 ? (
                <p className="text-sm text-tinta-suave">Sección vacía.</p>
              ) : (
                <ul className="flex flex-col">
                  {s.carta_platos.sort((a, b) => a.orden - b.orden).map((cp) => {
                    const ficha = (platos ?? []).find((p) => p.id === cp.plato_id)
                    const dato = analisis.lista.find((x) => x.plato.id === cp.plato_id)
                    const cat = clasificar(dato?.margen ?? null, 0, analisis.margenMedio, 0)
                    const e = ETIQUETA_CATEGORIA[cat]
                    return (
                      <li key={cp.id} className="flex items-center justify-between gap-3 border-b border-borde py-2 last:border-0">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{ficha?.nombre ?? cp.nombre}</span>
                          <span className="text-xs text-tinta-tenue">{e.consejo}</span>
                        </span>
                        <Insignia tono={e.tono}>{e.texto}</Insignia>
                        <span className="cifras text-sm font-semibold">{euros(cp.precio ?? ficha?.precio_venta ?? null)}</span>
                      </li>
                    )
                  })}
                </ul>
              )}

              {enSeccion === s.id && (
                <div className="mt-3 flex items-end gap-2">
                  <div className="flex-1">
                    <Selector etiqueta="Plato con ficha" value={platoId} onChange={(e) => setPlatoId(e.target.value)}>
                      <option value="">Elige</option>
                      {(platos ?? []).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </Selector>
                  </div>
                  <Boton
                    cargando={guardarPlatoCarta.isPending}
                    onClick={async () => {
                      if (!platoId) return
                      const ficha = (platos ?? []).find((p) => p.id === platoId)
                      await guardarPlatoCarta.mutateAsync({
                        seccion_id: s.id, plato_id: platoId,
                        nombre: ficha?.nombre ?? null, precio: ficha?.precio_venta ?? null,
                        orden: s.carta_platos.length + 1,
                      })
                      setPlatoId(''); setEnSeccion(null)
                    }}
                  >Añadir</Boton>
                </div>
              )}
            </Tarjeta>
          ))}
        </div>
      )}

      <Aviso nivel="informativo" titulo="El análisis se afina cuando entren las ventas">
        Ahora mismo clasifica por margen. Con el TPV conectado (o con el CSV del día) entra
        también cuánto se vende cada plato, y ahí salen de verdad las estrellas y los perros.
      </Aviso>
    </div>
  )
}
