import { useState, type ReactNode } from 'react'
import { Download, FileText, Printer, Share2 } from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { Hoja } from '@/componentes/Hoja'
import { Aviso } from '@/componentes/Estado'
import { useSesion } from '@/app/sesion'
import { useLocal } from '@/datos/local'
import { compartir, descargar, imprimir, type Documento, type Marca } from '@/documentos/motor'
import { useGuardarDocumento } from '@/documentos/historial'

const COLORES = [
  { nombre: 'Naranja Estook', hex: '#FF7A00' },
  { nombre: 'Charcoal', hex: '#111C1F' },
  { nombre: 'Verde', hex: '#0F8A4F' },
  { nombre: 'Burdeos', hex: '#8C2F39' },
  { nombre: 'Azul noche', hex: '#1D3557' },
  { nombre: 'Tierra', hex: '#8A5A2B' },
]

export interface OpcionDocumento {
  clave: string
  nombre: string
  descripcion: string
  archivo: string
  generar: (marca: Marca, generadoPor?: string) => Promise<Documento>
  /**
   * Copia de los datos con los que se hizo el documento. Es lo que permite
   * volver a sacarlo idéntico dentro de un año. Si no se pasa, el documento se
   * genera igual pero no queda en el historial.
   */
  datos?: () => unknown
  valorLegal?: boolean
  periodo?: { desde?: string; hasta?: string }
}

/**
 * El botón «Generar PDF» que vive en cada apartado. No hay una sección de
 * documentos: cada uno se hace donde están sus datos, con la marca del local
 * o con el color que se elija en el momento.
 */
export function BotonDocumento({
  opciones, etiqueta = 'Generar PDF', tono = 'discreto', pequeno,
}: {
  opciones: OpcionDocumento[]
  etiqueta?: string
  tono?: 'principal' | 'discreto' | 'secundario'
  pequeno?: boolean
}) {
  const [abierta, setAbierta] = useState(false)
  return (
    <>
      <Boton tono={tono} tamano={pequeno ? 'pequeno' : 'normal'} onClick={() => setAbierta(true)}>
        <FileText className="size-4" aria-hidden /> {etiqueta}
      </Boton>
      <HojaDocumento abierta={abierta} onCerrar={() => setAbierta(false)} opciones={opciones} />
    </>
  )
}

function HojaDocumento({
  abierta, onCerrar, opciones,
}: {
  abierta: boolean
  onCerrar: () => void
  opciones: OpcionDocumento[]
}) {
  const { actual, sesion } = useSesion()
  const { data: local } = useLocal(actual?.local_id)
  const guardarEnHistorial = useGuardarDocumento(actual?.local_id)

  const [elegido, setElegido] = useState(0)
  const [modoColor, setModoColor] = useState<'marca' | 'otro'>('marca')
  const [colorLibre, setColorLibre] = useState('#111C1F')
  const [trabajando, setTrabajando] = useState(false)
  const [fallo, setFallo] = useState<string | null>(null)

  const opcion = opciones[Math.min(elegido, opciones.length - 1)]
  const colorMarca = local?.color_secundario ?? '#FF7A00'
  const color = modoColor === 'marca' ? colorMarca : colorLibre

  const marca: Marca = {
    local: local?.nombre ?? actual?.local ?? 'Mi local',
    direccion: local?.direccion,
    cif: local?.cif,
    telefono: local?.telefono,
    logoUrl: local?.logo_url,
    color,
  }

  const quien = (sesion?.user.user_metadata?.nombre as string | undefined) ?? sesion?.user.email ?? undefined

  async function hacer(que: 'descargar' | 'imprimir' | 'compartir') {
    setTrabajando(true); setFallo(null)
    try {
      const doc = await opcion.generar(marca, quien)
      if (que === 'descargar') descargar(doc, opcion.archivo)
      else if (que === 'imprimir') imprimir(doc)
      else await compartir(doc, opcion.archivo)

      // Queda en el historial con copia de sus datos, para poder repetirlo tal cual
      if (opcion.datos) {
        try {
          await guardarEnHistorial.mutateAsync({
            tipo: opcion.clave,
            titulo: opcion.nombre,
            plantilla: opcion.clave,
            datos: opcion.datos(),
            color,
            archivo: opcion.archivo,
            valorLegal: opcion.valorLegal,
            periodo: opcion.periodo,
          })
        } catch { /* que no se pierda el PDF por un fallo al guardar la ficha */ }
      }

      if (que !== 'imprimir') onCerrar()
    } catch (e) {
      console.error(e)
      setFallo('No se ha podido generar el documento. Inténtalo otra vez.')
    } finally {
      setTrabajando(false)
    }
  }

  return (
    <Hoja
      abierta={abierta}
      titulo="Generar documento"
      descripcion="Sale con el logo y los colores de tu casa."
      onCerrar={onCerrar}
      pie={
        <div className="flex w-full flex-wrap gap-2">
          <Boton tono="discreto" onClick={() => void hacer('imprimir')} cargando={trabajando}>
            <Printer className="size-4" aria-hidden /> Imprimir
          </Boton>
          <Boton tono="discreto" onClick={() => void hacer('compartir')} cargando={trabajando}>
            <Share2 className="size-4" aria-hidden /> Enviar
          </Boton>
          <div className="flex-1" />
          <Boton onClick={() => void hacer('descargar')} cargando={trabajando}>
            <Download className="size-4" aria-hidden /> Descargar
          </Boton>
        </div>
      }
    >
      <div className="flex flex-col gap-5 pt-1">
        {opciones.length > 1 && (
          <section>
            <h3 className="mb-2 font-titulo text-sm font-semibold uppercase tracking-wide">Qué documento</h3>
            <div className="flex flex-col gap-2">
              {opciones.map((o, i) => (
                <button key={o.clave} type="button" onClick={() => setElegido(i)}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    elegido === i ? 'border-naranja bg-naranja-suave' : 'border-borde bg-lienzo hover:bg-panel'}`}>
                  <span className="block font-semibold">{o.nombre}</span>
                  <span className="mt-0.5 block text-xs leading-tight text-tinta-suave">{o.descripcion}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section>
          <h3 className="mb-2 font-titulo text-sm font-semibold uppercase tracking-wide">Color</h3>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setModoColor('marca')}
              className={`flex items-center gap-2 rounded-xl border p-3 text-left ${
                modoColor === 'marca' ? 'border-naranja bg-naranja-suave' : 'border-borde bg-lienzo'}`}>
              <span className="size-6 shrink-0 rounded-md border border-borde" style={{ background: colorMarca }} />
              <span>
                <span className="block text-sm font-semibold">El de mi marca</span>
                <span className="block text-xs text-tinta-tenue">{colorMarca}</span>
              </span>
            </button>
            <button type="button" onClick={() => setModoColor('otro')}
              className={`flex items-center gap-2 rounded-xl border p-3 text-left ${
                modoColor === 'otro' ? 'border-naranja bg-naranja-suave' : 'border-borde bg-lienzo'}`}>
              <span className="size-6 shrink-0 rounded-md border border-borde" style={{ background: colorLibre }} />
              <span>
                <span className="block text-sm font-semibold">Otro color</span>
                <span className="block text-xs text-tinta-tenue">Solo para este documento</span>
              </span>
            </button>
          </div>

          {modoColor === 'otro' && (
            <div className="mt-3 flex flex-col gap-3 rounded-xl border border-borde bg-panel p-3">
              <div className="flex flex-wrap gap-1.5">
                {COLORES.map((c) => (
                  <button key={c.hex} type="button" title={c.nombre}
                    onClick={() => setColorLibre(c.hex)}
                    className={`size-9 rounded-md border-2 transition-transform ${
                      colorLibre.toUpperCase() === c.hex ? 'scale-110 border-tinta' : 'border-borde'}`}
                    style={{ background: c.hex }} />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="color" aria-label="Elegir color"
                  className="size-11 cursor-pointer rounded-md border border-borde bg-lienzo p-1"
                  value={colorLibre} onChange={(e) => setColorLibre(e.target.value)} />
                <input
                  aria-label="Color en hexadecimal"
                  className="h-11 flex-1 rounded-md border border-borde px-3 font-mono text-sm uppercase"
                  value={colorLibre}
                  onChange={(e) => {
                    const v = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`
                    if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setColorLibre(v)
                  }}
                />
              </div>
            </div>
          )}
        </section>

        <Vista color={color} marca={marca} titulo={opcion.nombre} />

        {!local?.logo_url && (
          <Aviso nivel="informativo" titulo="Todavía no has subido el logo del local">
            Se puede subir en Ajustes. Sin logo, el documento sale igual con el nombre del local.
          </Aviso>
        )}

        {fallo && <Aviso nivel="urgente" titulo={fallo} />}
      </div>
    </Hoja>
  )
}

/** Miniatura de cómo va a quedar la cabecera del documento. */
function Vista({ color, marca, titulo }: { color: string; marca: Marca; titulo: string }): ReactNode {
  return (
    <section>
      <h3 className="mb-2 font-titulo text-sm font-semibold uppercase tracking-wide">Así queda</h3>
      <div className="overflow-hidden rounded-lg border border-borde bg-white">
        <div style={{ background: color }} className="h-1.5" />
        <div className="flex items-start justify-between gap-3 p-3">
          <div className="flex items-center gap-2">
            {marca.logoUrl && <img src={marca.logoUrl} alt="" className="h-7 w-auto object-contain" />}
            <div>
              <p className="text-sm font-bold text-tinta">{marca.local}</p>
              {marca.direccion && <p className="text-[9px] text-tinta-tenue">{marca.direccion}</p>}
            </div>
          </div>
          <p className="text-right text-[11px] font-bold uppercase tracking-wide" style={{ color }}>
            {titulo}
          </p>
        </div>
        <div className="px-3 pb-3">
          <div className="h-3 rounded-t" style={{ background: color }} />
          <div className="h-2.5 bg-panel" />
          <div className="h-2.5 bg-white" />
          <div className="h-2.5 bg-panel" />
        </div>
      </div>
    </section>
  )
}
