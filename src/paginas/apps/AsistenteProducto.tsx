import { useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { Campo, Selector } from '@/componentes/Campo'
import { Hoja } from '@/componentes/Hoja'
import { aPequena, PEQUENA, type UnidadGrande } from '@/datos/unidades'
import type { Proveedor } from '@/datos/despensa'

/**
 * Alta de producto, una pregunta por pantalla.
 *
 * Lógica: si estás dando de alta algo es porque aún no lo tenías, así que el
 * stock se pregunta UNA vez y al final. No se pregunta cada cuánto te lo traen
 * — eso varía y no sirve para nada — sino en qué formato te lo sirven, que es
 * lo único que hace falta para calcular el coste real.
 */

type Forma = 'granel' | 'formato' | 'unidades'

const FORMAS: { clave: Forma; titulo: string; ejemplo: string }[] = [
  { clave: 'granel', titulo: 'A peso o a volumen', ejemplo: 'Te lo cobran por kilo o por litro: carne, pescado, aceite a granel' },
  { clave: 'formato', titulo: 'En envase cerrado', ejemplo: 'Caja, saco, garrafa o bandeja con una cantidad fija dentro' },
  { clave: 'unidades', titulo: 'Por unidades', ejemplo: 'Huevos, panes, botellas, piezas sueltas' },
]

const ENVASES = ['Caja', 'Saco', 'Garrafa', 'Bandeja', 'Bolsa', 'Lata', 'Palé']

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
const dinero = (n: number) => `${n.toFixed(2).replace('.', ',')} €`

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
  const [unidad, setUnidad] = useState<UnidadGrande>('kg')
  const [envase, setEnvase] = useState('Caja')
  const [contenido, setContenido] = useState('')     // cuánto lleva el envase
  const [precio, setPrecio] = useState('')           // según la forma, por kilo o por envase
  const [merma, setMerma] = useState('')
  const [mermaDespues, setMermaDespues] = useState(false)
  const [stock, setStock] = useState('')
  const [minimo, setMinimo] = useState('')
  const [proveedorId, setProveedorId] = useState('')

  function reiniciar() {
    setPaso(0); setNombre(''); setCategoria(''); setForma(null); setUnidad('kg')
    setEnvase('Caja'); setContenido(''); setPrecio(''); setMerma(''); setMermaDespues(false)
    setStock(''); setMinimo(''); setProveedorId('')
  }

  const unidadFinal: UnidadGrande = forma === 'unidades' ? 'ud' : unidad
  const palabra = unidadFinal === 'kg' ? 'kilo' : unidadFinal === 'l' ? 'litro' : 'unidad'
  const plural = unidadFinal === 'kg' ? 'kilos' : unidadFinal === 'l' ? 'litros' : 'unidades'
  const esFormato = forma === 'formato'

  // Cuánto trae lo que se compra de una vez, y a cuánto sale la unidad
  const contenidoDelFormato = esFormato ? num(contenido) : 1
  const precioPorUnidad = esFormato
    ? (contenidoDelFormato > 0 ? num(precio) / contenidoDelFormato : 0)
    : num(precio)
  const rendimiento = mermaDespues || merma === '' ? 1 : Math.max(0.05, 1 - num(merma) / 100)
  const costeUtil = precioPorUnidad / rendimiento

  const pasos = [
    {
      titulo: '¿Qué producto vas a dar de alta?',
      ayuda: 'Con el nombre que usáis en la cocina.',
      valido: nombre.trim().length > 1,
      contenido: (
        <div className="flex flex-col gap-4">
          <Campo etiqueta="Nombre del producto" obligatorio placeholder="Atún rojo" autoFocus
            value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-tinta-suave">
              Categoría <span className="text-[10px] font-normal normal-case text-tinta-tenue">opcional</span>
            </p>
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
    {
      titulo: `¿Cómo te lo cobra el proveedor?`,
      ayuda: 'Es lo único que hace falta para saber lo que te cuesta de verdad.',
      valido: forma !== null,
      contenido: (
        <div className="flex flex-col gap-2">
          {FORMAS.map((f) => (
            <Opcion key={f.clave} activo={forma === f.clave} titulo={f.titulo} texto={f.ejemplo}
              onClick={() => { setForma(f.clave); if (f.clave === 'unidades') setUnidad('ud') }} />
          ))}

          {forma === 'granel' && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Opcion compacto activo={unidad === 'kg'} titulo="Por kilos" texto="Carne, pescado, verdura"
                onClick={() => setUnidad('kg')} />
              <Opcion compacto activo={unidad === 'l'} titulo="Por litros" texto="Aceite, vino, leche"
                onClick={() => setUnidad('l')} />
            </div>
          )}
        </div>
      ),
    },
    {
      // Este paso solo aparece si viene en envase cerrado
      salta: !esFormato,
      titulo: `¿Qué lleva dentro cada ${envase.toLowerCase()}?`,
      ayuda: 'El contenido del envase cerrado, tal y como te lo sirven.',
      valido: !esFormato || contenido.trim() !== '',
      contenido: (
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-tinta-suave">Tipo de envase</p>
            <div className="flex flex-wrap gap-1.5">
              {ENVASES.map((e) => <Chip key={e} activo={envase === e} onClick={() => setEnvase(e)}>{e}</Chip>)}
            </div>
          </div>
          <div className="grid grid-cols-[1fr,116px] gap-3">
            <Campo etiqueta="Contenido" obligatorio inputMode="decimal" placeholder="5" autoFocus
              value={contenido} onChange={(e) => setContenido(e.target.value)} />
            <Selector etiqueta="En" obligatorio value={unidadFinal}
              onChange={(e) => setUnidad(e.target.value as UnidadGrande)}>
              <option value="kg">kilos</option>
              <option value="l">litros</option>
              <option value="ud">unidades</option>
            </Selector>
          </div>
          {contenido && (
            <p className="rounded-lg bg-panel p-3 text-sm text-tinta-suave">
              1 {envase.toLowerCase()} = {contenido} {plural}.
            </p>
          )}
        </div>
      ),
    },
    {
      titulo: esFormato ? `¿Cuánto cuesta un ${envase.toLowerCase()}?` : `¿Cuánto cuesta el ${palabra}?`,
      ayuda: 'Sin IVA, como viene en el albarán. Si aún no lo sabes, sáltalo y lo pones al recibirlo.',
      valido: true,
      contenido: (
        <div className="flex flex-col gap-4">
          <Campo
            etiqueta={esFormato ? `Precio de 1 ${envase.toLowerCase()} (€)` : `Precio por ${palabra} (€)`}
            inputMode="decimal" placeholder="25,00" autoFocus
            value={precio} onChange={(e) => setPrecio(e.target.value)}
          />
          {precio && (
            <p className="rounded-lg bg-panel p-3 text-sm text-tinta-suave">
              Te sale a <strong>{dinero(precioPorUnidad)}/{unidadFinal}</strong> comprado.
            </p>
          )}
        </div>
      ),
    },
    {
      titulo: '¿Se tira parte al limpiarlo?',
      ayuda: 'Espinas, piel, recortes, hojas. Es lo que hace que el kilo que sale a la mesa cueste más que el que compras.',
      valido: true,
      contenido: (
        <div className="flex flex-col gap-4">
          <Campo
            etiqueta="Porcentaje que se tira (%)"
            inputMode="decimal" placeholder="30"
            ayuda="Déjalo vacío si entra tal cual y no se limpia."
            disabled={mermaDespues}
            value={merma} onChange={(e) => setMerma(e.target.value)}
          />
          <label className="flex items-start gap-3 rounded-lg border border-borde bg-lienzo p-3">
            <input type="checkbox" className="mt-1 size-4 accent-[#FF7A00]"
              checked={mermaDespues}
              onChange={(e) => { setMermaDespues(e.target.checked); if (e.target.checked) setMerma('') }} />
            <span>
              <span className="block text-sm font-semibold">Pregúntamelo cuando lo reciba</span>
              <span className="block text-xs text-tinta-suave">
                Entra sin merma y lo apuntas la primera vez que lo limpies.
              </span>
            </span>
          </label>
          {merma && !mermaDespues && precio && (
            <p className="rounded-lg bg-naranja-suave p-3 text-sm">
              Lo compras a {dinero(precioPorUnidad)}/{unidadFinal}, pero el {palabra} que usas te cuesta{' '}
              <strong>{dinero(costeUtil)}</strong>.
            </p>
          )}
        </div>
      ),
    },
    {
      titulo: '¿Tienes algo en cámara ahora mismo?',
      ayuda: 'Solo se pregunta al darlo de alta. A partir de aquí, el stock sube con los pedidos y baja con las ventas y las mermas.',
      valido: true,
      contenido: (
        <div className="flex flex-col gap-4">
          <Campo etiqueta={`Cantidad en cámara (${unidadFinal})`} inputMode="decimal" placeholder="0"
            ayuda="Si no tienes nada todavía, déjalo en blanco."
            value={stock} onChange={(e) => setStock(e.target.value)} />
          <Campo etiqueta={`Avisarme cuando baje de (${unidadFinal})`} inputMode="decimal" placeholder="5"
            ayuda="Con esto aparece solo en «hay que pedir»."
            value={minimo} onChange={(e) => setMinimo(e.target.value)} />
          <Selector etiqueta="Proveedor habitual" value={proveedorId}
            onChange={(e) => setProveedorId(e.target.value)}>
            <option value="">Lo pongo después</option>
            {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </Selector>
        </div>
      ),
    },
  ].filter((p) => !('salta' in p) || !p.salta)

  const total = pasos.length
  const actual = pasos[Math.min(paso, total - 1)]
  const ultimo = paso >= total - 1

  async function guardar() {
    const unidadUso = PEQUENA[unidadFinal]
    await onGuardar({
      nombre: nombre.trim(),
      categoria: categoria || null,
      unidad_compra: esFormato ? `${envase} de ${contenido} ${unidadFinal}` : `Por ${unidadFinal}`,
      unidad_uso: unidadUso,
      factor: aPequena(contenidoDelFormato, unidadUso),
      rendimiento,
      stock_actual: stock ? aPequena(num(stock), unidadUso) : 0,
      minimo: minimo ? aPequena(num(minimo), unidadUso) : null,
      precio_ultimo: precio ? (esFormato ? num(precio) : num(precio)) : null,
      proveedor_id: proveedorId || null,
    })
    reiniciar()
  }

  return (
    <Hoja
      abierta={abierto}
      titulo={nombre.trim() || 'Nuevo producto'}
      descripcion={`Paso ${Math.min(paso + 1, total)} de ${total}`}
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
        <div className="flex gap-1">
          {pasos.map((_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= paso ? 'bg-naranja' : 'bg-borde'}`} />
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
              {esFormato
                ? ` · ${envase.toLowerCase()} de ${contenido} ${unidadFinal}`
                : ` · a ${unidadFinal}`}
              {precio && ` · ${dinero(precioPorUnidad)}/${unidadFinal}`}
              {precio && rendimiento < 1 && ` → ${dinero(costeUtil)}/${unidadFinal} útil`}
              {stock && ` · ${stock} ${unidadFinal} en cámara`}
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
