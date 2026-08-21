import { useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { Campo, Selector } from '@/componentes/Campo'
import { Hoja } from '@/componentes/Hoja'
import { aPequena, PEQUENA, type UnidadGrande } from '@/datos/unidades'
import type { Producto, Proveedor } from '@/datos/despensa'

/**
 * Alta de producto, una pregunta por pantalla.
 *
 * La idea: nadie tiene que entender qué es un «factor» ni un «rendimiento».
 * Se pregunta cómo se lo sirve el proveedor y, según lo que conteste, cambian
 * las preguntas siguientes y hasta las palabras que se usan.
 */

type Forma = 'peso' | 'volumen' | 'unidades' | 'formato'

const FORMAS: { clave: Forma; titulo: string; ejemplo: string }[] = [
  { clave: 'peso', titulo: 'Por peso', ejemplo: 'Carne, pescado, verdura a granel' },
  { clave: 'volumen', titulo: 'Por volumen', ejemplo: 'Aceite, vino, leche' },
  { clave: 'unidades', titulo: 'Por unidades', ejemplo: 'Huevos, panes, botellas sueltas' },
  { clave: 'formato', titulo: 'En caja, saco o garrafa', ejemplo: 'Te llega cerrado y luego lo abres' },
]

const ENVASES = ['Caja', 'Saco', 'Garrafa', 'Bandeja', 'Bolsa', 'Palé']

const CATEGORIAS = ['Carne', 'Pescado', 'Verdura', 'Fruta', 'Lácteos', 'Congelados',
  'Secos y conservas', 'Panadería', 'Aceites', 'Bebidas', 'Vinos', 'Limpieza', 'Desechables']

export interface DatosProducto {
  nombre: string
  categoria: string | null
  unidad_compra: string | null
  unidad_uso: 'g' | 'ml' | 'ud'
  factor: number
  rendimiento: number
  stock_actual: number
  minimo: number | null
  precio_ultimo: number | null
  proveedor_id: string | null
}

const num = (t: string) => Number((t || '0').replace(',', '.')) || 0

export function AsistenteProducto({
  abierto, onCerrar, onGuardar, proveedores, guardando,
}: {
  abierto: boolean
  onCerrar: () => void
  onGuardar: (d: DatosProducto) => Promise<void>
  proveedores: Proveedor[]
  guardando: boolean
}) {
  const [paso, setPaso] = useState(0)
  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState('')
  const [forma, setForma] = useState<Forma | null>(null)
  const [envase, setEnvase] = useState('Caja')
  const [piezasPorEnvase, setPiezasPorEnvase] = useState('')
  const [contenido, setContenido] = useState('')
  const [unidad, setUnidad] = useState<UnidadGrande>('kg')
  const [modoPrecio, setModoPrecio] = useState<'unidad' | 'total'>('total')
  const [precio, setPrecio] = useState('')
  const [merma, setMerma] = useState('')
  const [mermaDespues, setMermaDespues] = useState(false)
  const [stock, setStock] = useState('')
  const [minimo, setMinimo] = useState('')
  const [proveedorId, setProveedorId] = useState('')

  function reiniciar() {
    setPaso(0); setNombre(''); setCategoria(''); setForma(null); setEnvase('Caja')
    setPiezasPorEnvase(''); setContenido(''); setUnidad('kg'); setModoPrecio('total')
    setPrecio(''); setMerma(''); setMermaDespues(false); setStock(''); setMinimo(''); setProveedorId('')
  }

  // Cómo se llama la cantidad, según lo que haya elegido
  const unidadFinal: UnidadGrande = forma === 'volumen' ? 'l' : forma === 'unidades' ? 'ud' : unidad
  const palabra = unidadFinal === 'kg' ? 'kilo' : unidadFinal === 'l' ? 'litro' : 'unidad'
  const plural = unidadFinal === 'kg' ? 'kilos' : unidadFinal === 'l' ? 'litros' : 'unidades'
  const esFormato = forma === 'formato'

  /** Cuánto contiene lo que se compra de una vez, en la unidad grande. */
  const contenidoTotal = esFormato ? num(contenido) : num(contenido) || 1
  const precioTotal = modoPrecio === 'total' ? num(precio) : num(precio) * contenidoTotal
  const precioPorUnidad = contenidoTotal > 0 ? precioTotal / contenidoTotal : 0
  const rendimiento = mermaDespues || merma === '' ? 1 : Math.max(0.05, 1 - num(merma) / 100)
  const costeUtil = rendimiento > 0 ? precioPorUnidad / rendimiento : precioPorUnidad

  const pasos = [
    // 0 · Qué es
    {
      titulo: '¿Qué producto vas a dar de alta?',
      ayuda: 'Con el nombre que uses tú en la cocina.',
      valido: nombre.trim().length > 1,
      contenido: (
        <div className="flex flex-col gap-4">
          <Campo etiqueta="Nombre" obligatorio placeholder="Atún" autoFocus
            value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-tinta-suave">Categoría</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIAS.map((c) => (
                <Chip key={c} activo={categoria === c} onClick={() => setCategoria(categoria === c ? '' : c)}>
                  {c}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    // 1 · Cómo se compra
    {
      titulo: `¿Cómo te sirve el proveedor el ${nombre.trim().toLowerCase() || 'producto'}?`,
      ayuda: 'De esto depende todo lo demás. Elige lo que se parezca más.',
      valido: forma !== null,
      contenido: (
        <div className="flex flex-col gap-2">
          {FORMAS.map((f) => (
            <Opcion
              key={f.clave}
              activo={forma === f.clave}
              titulo={f.titulo}
              texto={f.ejemplo}
              onClick={() => {
                setForma(f.clave)
                setUnidad(f.clave === 'volumen' ? 'l' : f.clave === 'unidades' ? 'ud' : 'kg')
              }}
            />
          ))}
        </div>
      ),
    },
    // 2 · Cuánto entra de una vez
    {
      titulo: esFormato ? `¿Qué trae cada ${envase.toLowerCase()}?` : `¿De cuánto es lo que te traen?`,
      ayuda: esFormato
        ? 'Lo que viene dentro del envase cerrado. Si no vienen piezas contadas, deja ese campo vacío.'
        : forma === 'unidades'
          ? 'Cuántas unidades te sirven de una vez, por ejemplo una docena.'
          : `Cuántos ${plural} te sirven de una vez. Si te lo traen suelto y varía, pon 1.`,
      valido: contenido.trim() !== '' || forma === 'unidades',
      contenido: (
        <div className="flex flex-col gap-4">
          {esFormato && (
            <>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-tinta-suave">Tipo de envase</p>
                <div className="flex flex-wrap gap-1.5">
                  {ENVASES.map((e) => (
                    <Chip key={e} activo={envase === e} onClick={() => setEnvase(e)}>{e}</Chip>
                  ))}
                </div>
              </div>
              <Campo
                etiqueta={`¿Cuántas piezas trae cada ${envase.toLowerCase()}?`}
                inputMode="numeric" placeholder="12"
                ayuda="Solo si vienen contadas. Si no, déjalo vacío."
                value={piezasPorEnvase} onChange={(e) => setPiezasPorEnvase(e.target.value)}
              />
            </>
          )}

          <div className="grid grid-cols-[1fr,120px] gap-3">
            <Campo
              etiqueta={esFormato ? `¿Cuánto pesa o contiene el ${envase.toLowerCase()}?` : `Cantidad`}
              obligatorio inputMode="decimal" placeholder="5" autoFocus
              value={contenido} onChange={(e) => setContenido(e.target.value)}
            />
            <Selector etiqueta="En" value={unidadFinal}
              onChange={(e) => setUnidad(e.target.value as UnidadGrande)}
              disabled={forma === 'unidades' || forma === 'volumen'}>
              <option value="kg">kilos</option>
              <option value="l">litros</option>
              <option value="ud">unidades</option>
            </Selector>
          </div>

          {contenido && (
            <p className="rounded-lg bg-panel p-3 text-sm text-tinta-suave">
              {esFormato
                ? `1 ${envase.toLowerCase()} = ${contenido} ${plural}${piezasPorEnvase ? ` (${piezasPorEnvase} piezas)` : ''}.`
                : `Cada vez que pides, entran ${contenido} ${plural}.`}
            </p>
          )}
        </div>
      ),
    },
    // 3 · Precio
    {
      titulo: '¿Cuánto te cuesta?',
      ayuda: 'Como venga en el albarán, sin IVA. Si aún no lo sabes, sáltalo.',
      valido: true,
      contenido: (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <Opcion
              activo={modoPrecio === 'total'}
              titulo={esFormato ? `Precio del ${envase.toLowerCase()}` : 'Precio de todo'}
              texto={esFormato ? 'Lo que cuesta el envase entero' : 'Lo que te cobran por lo que entra'}
              onClick={() => setModoPrecio('total')}
              compacto
            />
            <Opcion
              activo={modoPrecio === 'unidad'}
              titulo={`Precio por ${palabra}`}
              texto={`Lo que cuesta cada ${palabra}`}
              onClick={() => setModoPrecio('unidad')}
              compacto
            />
          </div>

          <Campo
            etiqueta={modoPrecio === 'total'
              ? (esFormato ? `Precio de 1 ${envase.toLowerCase()} (€)` : 'Precio total (€)')
              : `Precio por ${palabra} (€)`}
            inputMode="decimal" placeholder="42,00" autoFocus
            value={precio} onChange={(e) => setPrecio(e.target.value)}
          />

          {precio && contenidoTotal > 0 && (
            <p className="rounded-lg bg-panel p-3 text-sm text-tinta-suave">
              Sale a <strong>{precioPorUnidad.toFixed(2).replace('.', ',')} €/{unidadFinal}</strong> comprado
              {modoPrecio === 'unidad' && ` · ${precioTotal.toFixed(2).replace('.', ',')} € en total`}.
            </p>
          )}
        </div>
      ),
    },
    // 4 · Merma
    {
      titulo: '¿Se tira parte al limpiarlo?',
      ayuda: 'Espinas, piel, recortes, hojas. Es lo que hace que el kilo que llega a la mesa cueste más que el que compras.',
      valido: true,
      contenido: (
        <div className="flex flex-col gap-4">
          <Campo
            etiqueta="Porcentaje que se tira"
            inputMode="decimal" placeholder="Ej. 30"
            ayuda="Déjalo vacío si entra tal cual y no se limpia."
            disabled={mermaDespues}
            value={merma} onChange={(e) => setMerma(e.target.value)}
          />
          <label className="flex items-start gap-3 rounded-lg border border-borde bg-lienzo p-3">
            <input type="checkbox" className="mt-1 size-4 accent-[#FF7A00]"
              checked={mermaDespues} onChange={(e) => { setMermaDespues(e.target.checked); if (e.target.checked) setMerma('') }} />
            <span>
              <span className="block text-sm font-semibold">Pregúntamelo cuando lo reciba</span>
              <span className="block text-xs text-tinta-suave">
                Ahora entra sin merma y, la primera vez que lo limpies, lo apuntas y se recalcula.
              </span>
            </span>
          </label>

          {merma && !mermaDespues && precio && (
            <p className="rounded-lg bg-naranja-suave p-3 text-sm">
              Compras a {precioPorUnidad.toFixed(2).replace('.', ',')} €/{unidadFinal}, pero el {palabra} que
              realmente usas te cuesta <strong>{costeUtil.toFixed(2).replace('.', ',')} €</strong>.
            </p>
          )}
        </div>
      ),
    },
    // 5 · Cámara
    {
      titulo: '¿Cuánto tienes ahora y cuándo hay que pedir?',
      ayuda: `En ${plural}, como lo cuentas en la cámara. Puedes dejarlo para después.`,
      valido: true,
      contenido: (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta={`Hay ahora (${unidadFinal})`} inputMode="decimal"
              value={stock} onChange={(e) => setStock(e.target.value)} />
            <Campo etiqueta={`Avisar por debajo de (${unidadFinal})`} inputMode="decimal"
              value={minimo} onChange={(e) => setMinimo(e.target.value)} />
          </div>
          <Selector etiqueta="¿Quién te lo sirve?" value={proveedorId}
            onChange={(e) => setProveedorId(e.target.value)}>
            <option value="">Lo pongo después</option>
            {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </Selector>
        </div>
      ),
    },
  ]

  const total = pasos.length
  const actual = pasos[paso]
  const ultimo = paso === total - 1

  async function guardar() {
    const unidadUso = PEQUENA[unidadFinal]
    await onGuardar({
      nombre: nombre.trim(),
      categoria: categoria || null,
      unidad_compra: esFormato
        ? `${envase} de ${contenido} ${unidadFinal}${piezasPorEnvase ? ` · ${piezasPorEnvase} piezas` : ''}`
        : `${contenidoTotal} ${unidadFinal}`,
      unidad_uso: unidadUso,
      factor: aPequena(contenidoTotal, unidadUso),
      rendimiento,
      stock_actual: stock ? aPequena(num(stock), unidadUso) : 0,
      minimo: minimo ? aPequena(num(minimo), unidadUso) : null,
      precio_ultimo: precio ? precioTotal : null,
      proveedor_id: proveedorId || null,
    })
    reiniciar()
  }

  return (
    <Hoja
      abierta={abierto}
      titulo={nombre.trim() || 'Nuevo producto'}
      descripcion={`Paso ${paso + 1} de ${total}`}
      onCerrar={() => { reiniciar(); onCerrar() }}
      pie={
        <div className="flex w-full items-center gap-2">
          {paso > 0 && (
            <Boton tono="discreto" onClick={() => setPaso(paso - 1)} aria-label="Atrás">
              <ArrowLeft className="size-4" aria-hidden />
            </Boton>
          )}
          <div className="flex-1" />
          {!ultimo ? (
            <Boton disabled={!actual.valido} onClick={() => setPaso(paso + 1)}>Siguiente</Boton>
          ) : (
            <Boton cargando={guardando} onClick={() => void guardar()}>
              <Check className="size-4" aria-hidden /> Dar de alta
            </Boton>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-5 pt-1">
        {/* Progreso */}
        <div className="flex gap-1">
          {pasos.map((_, i) => (
            <span key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i <= paso ? 'bg-naranja' : 'bg-borde'}`} />
          ))}
        </div>

        <div>
          <h3 className="font-titulo text-lg font-semibold leading-tight">{actual.titulo}</h3>
          <p className="mt-1 text-sm leading-relaxed text-tinta-suave">{actual.ayuda}</p>
        </div>

        {actual.contenido}

        {ultimo && (
          <div className="rounded-lg border border-naranja/30 bg-naranja-suave p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-naranja-oscuro">Resumen</p>
            <p className="mt-1 text-sm">
              {nombre || 'Producto'}
              {esFormato ? ` · ${envase.toLowerCase()} de ${contenido} ${unidadFinal}` : ` · ${contenidoTotal} ${unidadFinal}`}
              {precio && ` · ${precioTotal.toFixed(2).replace('.', ',')} €`}
              {precio && ` → ${costeUtil.toFixed(2).replace('.', ',')} €/${unidadFinal} útil`}
            </p>
          </div>
        )}
      </div>
    </Hoja>
  )
}

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
        activo ? 'border-naranja bg-naranja text-white' : 'border-borde bg-lienzo text-tinta-suave hover:bg-panel'}`}>
      {children}
    </button>
  )
}

function Opcion({ activo, titulo, texto, onClick, compacto }: {
  activo: boolean; titulo: string; texto: string; onClick: () => void; compacto?: boolean
}) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-xl border p-3 text-left transition-colors ${
        activo ? 'border-naranja bg-naranja-suave' : 'border-borde bg-lienzo hover:bg-panel'}`}>
      <span className={`block font-semibold ${compacto ? 'text-sm' : ''}`}>{titulo}</span>
      <span className="mt-0.5 block text-xs leading-tight text-tinta-suave">{texto}</span>
    </button>
  )
}

export type { Producto }
