import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, Loader2, TriangleAlert } from 'lucide-react'

/** Una pantalla vacía es una invitación a hacer algo, no un cartel de "no hay nada". */
export function Vacio({
  titulo,
  explicacion,
  accion,
  icono,
}: {
  titulo: string
  explicacion: string
  accion?: ReactNode
  icono?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-borde bg-lienzo px-6 py-10 text-center">
      {icono && <div className="mb-3 text-tinta-tenue">{icono}</div>}
      <h3 className="font-titulo text-base font-semibold">{titulo}</h3>
      <p className="mt-1 max-w-sm text-sm text-tinta-tenue">{explicacion}</p>
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  )
}

type NivelAviso = 'informativo' | 'importante' | 'urgente' | 'hecho'

const estilos: Record<NivelAviso, { caja: string; icono: ReactNode }> = {
  informativo: { caja: 'bg-panel border-borde text-tinta', icono: <Info className="size-4" aria-hidden /> },
  importante: { caja: 'bg-aviso-suave border-aviso/30 text-tinta', icono: <TriangleAlert className="size-4 text-aviso" aria-hidden /> },
  urgente: { caja: 'bg-alerta-suave border-alerta/30 text-tinta', icono: <AlertTriangle className="size-4 text-alerta" aria-hidden /> },
  hecho: { caja: 'bg-ok-suave border-ok/30 text-tinta', icono: <CheckCircle2 className="size-4 text-ok" aria-hidden /> },
}

export function Aviso({
  nivel = 'informativo',
  titulo,
  children,
  acciones,
}: {
  nivel?: NivelAviso
  titulo: string
  children?: ReactNode
  acciones?: ReactNode
}) {
  const e = estilos[nivel]
  return (
    <div className={`flex gap-3 rounded-lg border p-3 ${e.caja}`}>
      <span className="mt-0.5 shrink-0">{e.icono}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{titulo}</p>
        {children && <div className="mt-0.5 text-sm text-tinta-suave">{children}</div>}
        {acciones && <div className="mt-2 flex flex-wrap gap-2">{acciones}</div>}
      </div>
    </div>
  )
}

export function Insignia({ tono = 'neutro', children }: { tono?: 'neutro' | 'ok' | 'aviso' | 'alerta' | 'naranja'; children: ReactNode }) {
  const tonos = {
    neutro: 'bg-panel text-tinta-suave border-borde',
    ok: 'bg-ok-suave text-ok border-ok/20',
    aviso: 'bg-aviso-suave text-aviso border-aviso/20',
    alerta: 'bg-alerta-suave text-alerta border-alerta/20',
    naranja: 'bg-naranja-suave text-naranja-oscuro border-naranja/20',
  } as const
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-semibold ${tonos[tono]}`}>
      {children}
    </span>
  )
}

export function Cargando({ texto = 'Cargando' }: { texto?: string }) {
  return (
    <p className="flex items-center gap-2 py-6 text-sm text-tinta-tenue">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {texto}
    </p>
  )
}
