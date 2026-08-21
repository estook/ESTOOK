import { useEffect, useState } from 'react'
import { History, Plus, StickyNote, Target, Trash2, X } from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { Campo } from '@/componentes/Campo'
import { Insignia } from '@/componentes/Estado'
import { useSesion } from '@/app/sesion'
import { usePermisos } from '@/app/permisos'
import { useBorrarNota, useGuardarNota, useNotas } from '@/datos/notas'
import { useAuditoria } from '@/datos/auditoria'
import { useGuardarObjetivos, useObjetivos } from '@/datos/objetivos'

/**
 * Los widgets del Panel.
 *
 * Cuadrados, pequeños y con lo justo a la vista. Se tocan y se abren en una
 * ventana con el detalle: ni listas infinitas en el inicio, ni cosas de trabajo
 * escondidas en Ajustes.
 */

function Widget({
  icono, titulo, valor, pie, onAbrir,
}: {
  icono: React.ReactNode; titulo: string; valor: string; pie: string; onAbrir: () => void
}) {
  return (
    <button
      onClick={onAbrir}
      className="flex min-w-0 flex-col items-start rounded-xl border border-borde bg-lienzo p-4 text-left shadow-tarjeta transition-colors hover:border-naranja"
    >
      <span className="grid size-9 place-items-center rounded-lg bg-naranja-suave text-naranja-oscuro">
        {icono}
      </span>
      <span className="mt-3 text-xs font-semibold uppercase leading-tight tracking-wide text-tinta-tenue">
        {titulo}
      </span>
      <span className="cifras mt-0.5 font-titulo text-xl font-semibold">{valor}</span>
      <span className="mt-0.5 text-[11px] leading-tight text-tinta-tenue">{pie}</span>
    </button>
  )
}

function Ventana({
  abierta, titulo, descripcion, onCerrar, children,
}: {
  abierta: boolean; titulo: string; descripcion?: string; onCerrar: () => void; children: React.ReactNode
}) {
  useEffect(() => {
    if (!abierta) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [abierta, onCerrar])

  if (!abierta) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center" role="dialog" aria-modal="true">
      <button aria-label="Cerrar" onClick={onCerrar}
        className="absolute inset-0 animate-aparecer bg-tinta/50 backdrop-blur-sm" />
      <div className="relative z-10 max-h-[85dvh] w-full max-w-md animate-entrarAbajo overflow-y-auto rounded-t-xl bg-lienzo p-5 shadow-hoja sm:animate-subirCorto sm:rounded-xl">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-titulo text-lg font-semibold">{titulo}</h2>
            {descripcion && <p className="mt-0.5 text-sm text-tinta-suave">{descripcion}</p>}
          </div>
          <button aria-label="Cerrar" onClick={onCerrar}
            className="grid size-9 shrink-0 place-items-center rounded-md text-tinta-tenue hover:bg-panel">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

export function WidgetsDelPanel() {
  const { actual } = useSesion()
  const { puedeVer, puedeEditar } = usePermisos()
  const localId = actual?.local_id

  const { data: notas } = useNotas(localId)
  const { data: objetivos } = useObjetivos(localId)
  const { data: actividad } = useAuditoria(localId, 20)

  const [abierto, setAbierto] = useState<'notas' | 'objetivos' | 'actividad' | null>(null)
  const verObjetivos = puedeVer('negocio.resumenes')
  const verActividad = puedeVer('negocio.auditoria')

  return (
    <>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Widget
          icono={<StickyNote className="size-5" aria-hidden />}
          titulo="Notas del local"
          valor={String(notas?.length ?? 0)}
          pie={notas?.length ? 'Fogón las tiene en cuenta' : 'Apunta lo que no se puede olvidar'}
          onAbrir={() => setAbierto('notas')}
        />

        {verObjetivos && (
          <Widget
            icono={<Target className="size-5" aria-hidden />}
            titulo="Objetivos"
            valor={`${objetivos?.materia_prima ?? 32} / ${objetivos?.personal ?? 30} %`}
            pie="Materia prima y personal"
            onAbrir={() => setAbierto('objetivos')}
          />
        )}

        {verActividad && (
          <Widget
            icono={<History className="size-5" aria-hidden />}
            titulo="Actividad"
            valor={String(actividad?.length ?? 0)}
            pie="Últimos movimientos del local"
            onAbrir={() => setAbierto('actividad')}
          />
        )}
      </section>

      <Ventana
        abierta={abierto === 'notas'}
        titulo="Notas del local"
        descripcion="Acuerdos con proveedores, manías de la casa, avisos. Fogón las lee al aconsejar."
        onCerrar={() => setAbierto(null)}
      >
        <Notas localId={localId} />
      </Ventana>

      <Ventana
        abierta={abierto === 'objetivos'}
        titulo="Objetivos del negocio"
        descripcion="Son los que ponen en verde o en rojo los semáforos de toda la app."
        onCerrar={() => setAbierto(null)}
      >
        <Objetivos localId={localId} puedeEditar={puedeEditar('ajustes.local')} />
      </Ventana>

      <Ventana
        abierta={abierto === 'actividad'}
        titulo="Actividad del local"
        descripcion="Todo lo que toca dinero, permisos o registros legales. No se puede editar ni borrar."
        onCerrar={() => setAbierto(null)}
      >
        <ul className="flex flex-col gap-1.5">
          {(actividad ?? []).map((r) => (
            <li key={r.id} className="rounded-lg border border-borde bg-panel px-3 py-2">
              <span className="block text-sm">{r.resumen ?? `${r.entidad} · ${r.accion}`}</span>
              <span className="block text-[11px] text-tinta-tenue">
                {new Date(r.creado_en).toLocaleString('es-ES', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
                {r.de_fogon && ' · Fogón'}
              </span>
            </li>
          ))}
          {(actividad ?? []).length === 0 && (
            <li className="rounded-lg border border-dashed border-borde p-4 text-center text-sm text-tinta-tenue">
              Todavía no hay actividad registrada.
            </li>
          )}
        </ul>
      </Ventana>
    </>
  )
}

function Notas({ localId }: { localId?: string }) {
  const { data: notas } = useNotas(localId)
  const guardar = useGuardarNota(localId)
  const borrar = useBorrarNota(localId)
  const [texto, setTexto] = useState('')

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          className="h-11 min-w-0 flex-1 rounded-md border border-borde px-3 text-sm"
          placeholder="Pescados Gil no reparte los lunes"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && texto.trim()) {
              void guardar.mutateAsync({ texto: texto.trim() }); setTexto('')
            }
          }}
        />
        <Boton cargando={guardar.isPending} disabled={!texto.trim()}
          onClick={() => { void guardar.mutateAsync({ texto: texto.trim() }); setTexto('') }}>
          <Plus className="size-4" aria-hidden />
        </Boton>
      </div>

      <ul className="flex flex-col gap-2">
        {(notas ?? []).map((n) => (
          <li key={n.id} className="flex items-start gap-2 rounded-lg border border-borde bg-panel p-3">
            <span className="min-w-0 flex-1">
              <span className="block text-sm">{n.texto}</span>
              <span className="mt-0.5 block text-[11px] text-tinta-tenue">
                {new Date(n.creado_en).toLocaleDateString('es-ES')}
              </span>
            </span>
            {n.de_fogon && <Insignia tono="naranja">Fogón</Insignia>}
            <button aria-label="Borrar nota" onClick={() => void borrar.mutateAsync(n.id)}
              className="grid size-9 shrink-0 place-items-center rounded-md text-tinta-tenue hover:bg-lienzo">
              <Trash2 className="size-4" aria-hidden />
            </button>
          </li>
        ))}
        {(notas ?? []).length === 0 && (
          <li className="rounded-lg border border-dashed border-borde p-4 text-center text-sm text-tinta-tenue">
            Todavía no hay ninguna nota.
          </li>
        )}
      </ul>
    </div>
  )
}

function Objetivos({ localId, puedeEditar }: { localId?: string; puedeEditar: boolean }) {
  const { data } = useObjetivos(localId)
  const guardar = useGuardarObjetivos(localId)
  const [materia, setMateria] = useState('')
  const [personal, setPersonal] = useState('')

  useEffect(() => {
    setMateria(String(data?.materia_prima ?? 32))
    setPersonal(String(data?.personal ?? 30))
  }, [data])

  const primeCost = (Number(materia) || 0) + (Number(personal) || 0)

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Materia prima (%)" inputMode="decimal" disabled={!puedeEditar}
          ayuda="Lo que quieres gastar en género sobre las ventas."
          value={materia} onChange={(e) => setMateria(e.target.value)} />
        <Campo etiqueta="Personal (%)" inputMode="decimal" disabled={!puedeEditar}
          ayuda="Lo que quieres gastar en sueldos sobre las ventas."
          value={personal} onChange={(e) => setPersonal(e.target.value)} />
      </div>

      <div className={`rounded-lg border p-3 ${primeCost > 65 ? 'border-alerta/30 bg-alerta-suave' : 'border-ok/30 bg-ok-suave'}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-tinta-tenue">Prime cost objetivo</p>
        <p className="cifras mt-0.5 font-titulo text-xl font-semibold">{primeCost} %</p>
        <p className="mt-1 text-xs text-tinta-suave">
          {primeCost > 65
            ? 'Por encima del 65 % es difícil que el mes salga bien.'
            : 'Entre género y personal, es el número que decide si el mes sale.'}
        </p>
      </div>

      {puedeEditar && (
        <Boton
          cargando={guardar.isPending}
          onClick={() => void guardar.mutateAsync({
            materia_prima: Number(materia) || 32,
            personal: Number(personal) || 30,
          })}
        >Guardar objetivos</Boton>
      )}
    </div>
  )
}
