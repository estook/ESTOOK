import { useMemo, useState } from 'react'
import { Download, FileText, Search, ShieldCheck } from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { Aviso, Cargando, Insignia, Vacio } from '@/componentes/Estado'
import { useSesion } from '@/app/sesion'
import { useLocal } from '@/datos/local'
import { descargar, type Marca } from '@/documentos/motor'
import { TIPOS_DOCUMENTO, useDocumentos, type DocumentoGuardado } from '@/documentos/historial'
import {
  cartaCompleta, fichaTecnica, hojaDeRecuento, horarioSemanal,
  inventarioValorado, parteAppcc, pedidoAProveedor, resumenDelDia,
} from '@/documentos/plantillas'

/**
 * Historial de documentos.
 *
 * Cada ficha guarda una copia de los datos con los que se hizo, así que
 * «regenerar» no vuelve a mirar la base de datos: rehace el PDF con lo que
 * había aquel día. Un inventario de marzo sale con los precios de marzo.
 */
export function Documentos() {
  const { actual, sesion } = useSesion()
  const { data: local } = useLocal(actual?.local_id)
  const { data: documentos, isLoading } = useDocumentos(actual?.local_id)

  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState<string>('')
  const [rehaciendo, setRehaciendo] = useState<string | null>(null)
  const [fallo, setFallo] = useState<string | null>(null)

  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase()
    return (documentos ?? []).filter((d) =>
      (!tipo || d.tipo === tipo) &&
      (!t || d.titulo.toLowerCase().includes(t) || (TIPOS_DOCUMENTO[d.tipo] ?? '').toLowerCase().includes(t)),
    )
  }, [documentos, busca, tipo])

  const tipos = useMemo(
    () => [...new Set((documentos ?? []).map((d) => d.tipo))],
    [documentos],
  )

  async function regenerar(d: DocumentoGuardado) {
    setRehaciendo(d.id); setFallo(null)
    try {
      const marca: Marca = {
        local: local?.nombre ?? actual?.local ?? 'Mi local',
        direccion: local?.direccion, cif: local?.cif, telefono: local?.telefono,
        logoUrl: local?.logo_url,
        color: d.color ?? local?.color_secundario ?? '#FF7A00',
      }
      const quien = (sesion?.user.user_metadata?.nombre as string | undefined) ?? undefined
      const datos = d.datos as Record<string, unknown>
      const ctx = { generadoPor: quien }
      let doc

      switch (d.tipo) {
        case 'inventario_valorado':
          doc = await inventarioValorado(marca, datos.productos as never, ctx); break
        case 'hoja_recuento':
          doc = await hojaDeRecuento(marca, datos.productos as never, ctx); break
        case 'ficha_tecnica':
        case 'ficha_cocina':
          doc = await fichaTecnica(
            marca, datos.plato as never, datos.ingredientes as never, datos.productos as never,
            { conCostes: d.tipo === 'ficha_tecnica' }, ctx); break
        case 'carta':
          doc = await cartaCompleta(marca, datos.secciones as never, ctx); break
        case 'pedido':
          doc = await pedidoAProveedor(
            marca, datos.proveedor as never, datos.lineas as never, datos.extra as never, ctx); break
        case 'appcc':
          doc = await parteAppcc(
            marca, datos.dia as string, datos.puntos as never, datos.registros as never, ctx); break
        case 'resumen_dia':
          doc = await resumenDelDia(marca, datos as never, ctx); break
        case 'horario_semanal':
          doc = await horarioSemanal(marca, datos.semana as never, datos.turnos as never, ctx); break
        default:
          throw new Error('tipo desconocido')
      }
      descargar(doc, d.nombre_archivo ?? d.titulo)
    } catch (e) {
      console.error(e)
      setFallo('No se ha podido rehacer este documento.')
    } finally {
      setRehaciendo(null)
    }
  }

  if (isLoading) return <Cargando texto="Abriendo el historial" />

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="flex items-center gap-2 font-titulo text-2xl font-semibold">
          <FileText className="size-6 text-naranja" aria-hidden /> Documentos
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-tinta-suave">
          Todo lo que has generado, con su fecha. Cada uno guarda los datos que usó: si lo rehaces,
          sale igual que aquel día aunque los precios hayan cambiado.
        </p>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-3 size-5 text-tinta-tenue" aria-hidden />
          <input
            className="h-11 w-full rounded-md border border-borde bg-lienzo pl-10 pr-3 text-sm"
            placeholder="Buscar documento"
            value={busca} onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        {tipos.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto">
            <Chip activo={tipo === ''} onClick={() => setTipo('')}>Todos</Chip>
            {tipos.map((t) => (
              <Chip key={t} activo={tipo === t} onClick={() => setTipo(t)}>
                {TIPOS_DOCUMENTO[t] ?? t}
              </Chip>
            ))}
          </div>
        )}
      </div>

      {fallo && <Aviso nivel="urgente" titulo={fallo} />}

      {lista.length === 0 ? (
        <Vacio
          icono={<FileText className="size-8" aria-hidden />}
          titulo="Todavía no has generado ningún documento"
          explicacion="Los PDF se generan dentro de cada apartado, con el botón «Generar PDF». Aquí se guardan todos, con su fecha, para poder repetirlos."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {lista.map((d) => (
            <li key={d.id} className="flex items-center gap-3 rounded-xl border border-borde bg-lienzo p-3.5 shadow-tarjeta">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg"
                style={{ background: `${d.color ?? '#FF7A00'}1A`, color: d.color ?? '#FF7A00' }}>
                <FileText className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{TIPOS_DOCUMENTO[d.tipo] ?? d.titulo}</span>
                  {d.valor_legal && (
                    <Insignia tono="ok"><ShieldCheck className="size-3.5" aria-hidden /> valor legal</Insignia>
                  )}
                </span>
                <span className="block text-xs text-tinta-tenue">
                  {new Date(d.generado_en).toLocaleString('es-ES', {
                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })} · huella {d.huella}
                </span>
              </span>
              <Boton tamano="pequeno" tono="discreto" cargando={rehaciendo === d.id}
                onClick={() => void regenerar(d)}>
                <Download className="size-4" aria-hidden /> Rehacer
              </Boton>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-tinta-tenue">
        Los documentos con valor legal (partes de APPCC y carpetas de inspección) se conservan cinco
        años. El resto se puede rehacer siempre que su ficha siga aquí.
      </p>
    </div>
  )
}

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`shrink-0 rounded-md border px-3 py-2 text-sm font-semibold ${
        activo ? 'border-naranja bg-naranja text-white' : 'border-borde bg-lienzo text-tinta-suave'}`}>
      {children}
    </button>
  )
}
