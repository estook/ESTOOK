import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Building2, Check, ChevronDown, CreditCard, History, ImagePlus, KeyRound,
  LogOut, Palette, StickyNote, Target, Trash2,
} from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { Campo, Selector } from '@/componentes/Campo'
import { Aviso, Cargando, Insignia } from '@/componentes/Estado'
import { useSesion } from '@/app/sesion'
import { leerLogoComoBase64, useGuardarLocal, useLocal, type Local } from '@/datos/local'
import { useGuardarNota, useNotas, useBorrarNota } from '@/datos/notas'
import { useAuditoria } from '@/datos/auditoria'
import { usePermisos } from '@/app/permisos'

const COLORES = [
  { nombre: 'Naranja Estook', hex: '#FF7A00' },
  { nombre: 'Charcoal', hex: '#111C1F' },
  { nombre: 'Verde', hex: '#0F8A4F' },
  { nombre: 'Burdeos', hex: '#8C2F39' },
  { nombre: 'Azul noche', hex: '#1D3557' },
  { nombre: 'Tierra', hex: '#8A5A2B' },
]

const TIPOS = [
  ['bar_tapas', 'Bar de tapas'], ['restaurante', 'Restaurante de carta'],
  ['cafeteria', 'Cafetería'], ['obrador', 'Obrador'],
  ['food_truck', 'Food truck'], ['otro', 'Otro'],
] as const

const NOMBRE_PLAN: Record<string, string> = {
  prueba: 'Prueba de 14 días', base: 'Base', pro: 'Pro', grupo: 'Grupo', a_medida: 'A medida',
}

/** Bloque plegable: nada queda suelto y la pantalla no se alarga sin control. */
function Bloque({
  icono, titulo, resumen, abiertoPorDefecto = false, children,
}: {
  icono: ReactNode; titulo: string; resumen?: string; abiertoPorDefecto?: boolean; children: ReactNode
}) {
  const [abierto, setAbierto] = useState(abiertoPorDefecto)
  return (
    <section className="overflow-hidden rounded-xl border border-borde bg-lienzo shadow-tarjeta">
      <button
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-naranja-suave text-naranja-oscuro">
          {icono}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-titulo text-sm font-semibold uppercase tracking-wide">{titulo}</span>
          {resumen && <span className="block truncate text-xs text-tinta-tenue">{resumen}</span>}
        </span>
        <ChevronDown className={`size-5 shrink-0 text-tinta-tenue transition-transform ${abierto ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {abierto && <div className="border-t border-borde px-4 py-4">{children}</div>}
    </section>
  )
}

export function Ajustes() {
  const { actual, salir } = useSesion()
  const { data: local, isLoading } = useLocal(actual?.local_id)

  if (isLoading) return <Cargando texto="Abriendo los ajustes" />
  if (!actual || !local) {
    return <Aviso nivel="importante" titulo="Todavía no hay local para configurar." />
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-titulo text-2xl font-semibold">Ajustes</h1>
        <p className="mt-1 text-sm text-tinta-suave">
          Los datos de tu casa, tu marca y tu acceso. Se guarda cuando pulses guardar, no antes.
        </p>
      </header>

      <DatosDelLocal local={local} />
      <MarcaDelLocal local={local} />
      <Objetivos local={local} />
      <Notas localId={local.id} />

      <Actividad localId={local.id} />

      <Bloque icono={<CreditCard className="size-5" aria-hidden />} titulo="Plan y facturación"
        resumen={NOMBRE_PLAN[actual.plan] ?? actual.plan}>
        <dl className="grid gap-2 sm:grid-cols-2">
          {[['Plan contratado', NOMBRE_PLAN[actual.plan] ?? actual.plan],
            ['Tu rol en este local', actual.rol.replace('_', ' ')]].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-borde bg-panel p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-tinta-tenue">{k}</dt>
              <dd className="mt-0.5 font-semibold capitalize">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm text-tinta-suave">
          Las facturas y el cambio de plan llegarán con el cobro por Stripe.
        </p>
      </Bloque>

      <Bloque icono={<KeyRound className="size-5" aria-hidden />} titulo="Mi acceso"
        resumen="Contraseña, PIN y cerrar sesión">
        <p className="text-sm text-tinta-suave">
          El cambio de contraseña y de PIN llega con el módulo de Equipo.
        </p>
        <div className="mt-3">
          <Boton tono="discreto" onClick={() => void salir()}>
            <LogOut className="size-4" aria-hidden /> Cerrar sesión
          </Boton>
        </div>
      </Bloque>
    </div>
  )
}

// ---------- Datos del local ----------

function DatosDelLocal({ local }: { local: Local }) {
  const guardar = useGuardarLocal(local.id)
  const [editando, setEditando] = useState(false)
  const [f, setF] = useState({
    nombre: local.nombre,
    tipo_local: local.tipo_local ?? 'restaurante',
    direccion: local.direccion ?? '',
    cif: local.cif ?? '',
    telefono: local.telefono ?? '',
    hora_corte: (local.hora_corte ?? '06:00').slice(0, 5),
  })
  const [hecho, setHecho] = useState(false)

  useEffect(() => {
    setF({
      nombre: local.nombre,
      tipo_local: local.tipo_local ?? 'restaurante',
      direccion: local.direccion ?? '',
      cif: local.cif ?? '',
      telefono: local.telefono ?? '',
      hora_corte: (local.hora_corte ?? '06:00').slice(0, 5),
    })
  }, [local])

  return (
    <Bloque
      icono={<Building2 className="size-5" aria-hidden />}
      titulo="Datos del local"
      resumen={[local.nombre, local.direccion].filter(Boolean).join(' · ')}
      abiertoPorDefecto
    >
      {!editando ? (
        <>
          <dl className="grid gap-2 sm:grid-cols-2">
            {[
              ['Nombre', local.nombre],
              ['Tipo', TIPOS.find((t) => t[0] === local.tipo_local)?.[1] ?? '—'],
              ['Dirección', local.direccion || '—'],
              ['CIF', local.cif || '—'],
              ['Teléfono', local.telefono || '—'],
              ['Cierre de caja', `${(local.hora_corte ?? '06:00').slice(0, 5)} h`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-borde bg-panel p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-tinta-tenue">{k}</dt>
                <dd className="mt-0.5 truncate font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-tinta-tenue">
            Estos datos salen en todos los documentos que generes.
          </p>
          <div className="mt-3">
            <Boton tono="discreto" onClick={() => setEditando(true)}>Editar</Boton>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <Campo etiqueta="Nombre del local" obligatorio value={f.nombre}
            onChange={(e) => setF({ ...f, nombre: e.target.value })} />
          <Selector etiqueta="Tipo de local" value={f.tipo_local}
            onChange={(e) => setF({ ...f, tipo_local: e.target.value })}>
            {TIPOS.map(([k, n]) => <option key={k} value={k}>{n}</option>)}
          </Selector>
          <Campo etiqueta="Dirección" value={f.direccion}
            onChange={(e) => setF({ ...f, direccion: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="CIF" value={f.cif} onChange={(e) => setF({ ...f, cif: e.target.value })} />
            <Campo etiqueta="Teléfono" inputMode="tel" value={f.telefono}
              onChange={(e) => setF({ ...f, telefono: e.target.value })} />
          </div>
          <Campo etiqueta="Hora de cierre de caja" type="time"
            ayuda="Lo cobrado antes de esa hora cuenta del día anterior."
            value={f.hora_corte} onChange={(e) => setF({ ...f, hora_corte: e.target.value })} />

          <div className="flex justify-end gap-2 pt-1">
            <Boton tono="discreto" onClick={() => setEditando(false)}>Cancelar</Boton>
            <Boton cargando={guardar.isPending}
              onClick={async () => {
                if (!f.nombre.trim()) return
                await guardar.mutateAsync({
                  nombre: f.nombre.trim(),
                  tipo_local: f.tipo_local,
                  direccion: f.direccion || null,
                  cif: f.cif || null,
                  telefono: f.telefono || null,
                  hora_corte: f.hora_corte,
                })
                setEditando(false); setHecho(true)
                window.setTimeout(() => setHecho(false), 2500)
              }}>
              <Check className="size-4" aria-hidden /> Guardar
            </Boton>
          </div>
        </div>
      )}

      {hecho && <p className="mt-2 text-sm font-semibold text-ok">Guardado.</p>}
    </Bloque>
  )
}

// ---------- Marca: logo y color ----------

function MarcaDelLocal({ local }: { local: Local }) {
  const guardar = useGuardarLocal(local.id)
  const [color, setColor] = useState(local.color_secundario ?? '#FF7A00')
  const [logo, setLogo] = useState<string | null>(local.logo_url)
  const [subiendo, setSubiendo] = useState(false)
  const entrada = useRef<HTMLInputElement>(null)

  const cambiado = color !== local.color_secundario || logo !== local.logo_url

  async function elegirLogo(archivo?: File | null) {
    if (!archivo) return
    setSubiendo(true)
    try {
      setLogo(await leerLogoComoBase64(archivo))
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <Bloque
      icono={<Palette className="size-5" aria-hidden />}
      titulo="Tu marca"
      resumen="Logo y color de los documentos"
    >
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-tinta-suave">Logo del local</p>
          <div className="flex items-center gap-3">
            <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-borde bg-panel">
              {logo
                ? <img src={logo} alt="Logo del local" className="size-full object-contain p-1.5" />
                : <ImagePlus className="size-7 text-tinta-tenue" aria-hidden />}
            </div>
            <div className="flex flex-col gap-2">
              <input ref={entrada} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                onChange={(e) => void elegirLogo(e.target.files?.[0])} />
              <Boton tono="discreto" tamano="pequeno" cargando={subiendo}
                onClick={() => entrada.current?.click()}>
                {logo ? 'Cambiar logo' : 'Subir logo'}
              </Boton>
              {logo && (
                <Boton tono="discreto" tamano="pequeno" onClick={() => setLogo(null)}>
                  <Trash2 className="size-4" aria-hidden /> Quitar
                </Boton>
              )}
              <p className="text-xs text-tinta-tenue">PNG o JPG. Se reduce solo para que no pese.</p>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-tinta-suave">Color de la marca</p>
          <div className="flex flex-wrap gap-2">
            {COLORES.map((c) => (
              <button key={c.hex} type="button" title={c.nombre} onClick={() => setColor(c.hex)}
                className={`size-10 rounded-lg border-2 transition-transform ${
                  color.toUpperCase() === c.hex ? 'scale-110 border-tinta' : 'border-borde'}`}
                style={{ background: c.hex }} />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input type="color" aria-label="Elegir color"
              className="size-11 cursor-pointer rounded-md border border-borde bg-lienzo p-1"
              value={color} onChange={(e) => setColor(e.target.value)} />
            <input aria-label="Color en hexadecimal"
              className="h-11 flex-1 rounded-md border border-borde px-3 font-mono text-sm uppercase"
              value={color}
              onChange={(e) => {
                const v = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setColor(v)
              }} />
          </div>
        </div>

        {/* Cómo va a quedar */}
        <div className="overflow-hidden rounded-lg border border-borde">
          <div style={{ background: color }} className="h-1.5" />
          <div className="flex items-center gap-2 p-3">
            {logo && <img src={logo} alt="" className="h-7 w-auto object-contain" />}
            <p className="text-sm font-bold">{local.nombre}</p>
            <p className="ml-auto text-[11px] font-bold uppercase tracking-wide" style={{ color }}>
              Documento
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Boton tono="discreto" disabled={!cambiado}
            onClick={() => { setColor(local.color_secundario); setLogo(local.logo_url) }}>
            Deshacer
          </Boton>
          <Boton disabled={!cambiado} cargando={guardar.isPending}
            onClick={() => void guardar.mutateAsync({ color_secundario: color, logo_url: logo })}>
            <Check className="size-4" aria-hidden /> Guardar
          </Boton>
        </div>
      </div>
    </Bloque>
  )
}

// ---------- Objetivos ----------

function Objetivos({ local }: { local: Local }) {
  return (
    <Bloque icono={<Target className="size-5" aria-hidden />} titulo="Objetivos"
      resumen="Materia prima, personal y margen">
      <p className="text-sm text-tinta-suave">
        Son los que ponen en verde o en rojo los semáforos de toda la app. Llegan con el módulo de
        Negocio, junto con el prime cost y la desviación.
      </p>
      <p className="mt-2 text-xs text-tinta-tenue">Local: {local.nombre}</p>
    </Bloque>
  )
}

// ---------- Notas del local ----------

function Notas({ localId }: { localId: string }) {
  const { data: notas, isLoading } = useNotas(localId)
  const guardar = useGuardarNota(localId)
  const borrar = useBorrarNota(localId)
  const [texto, setTexto] = useState('')

  return (
    <Bloque
      icono={<StickyNote className="size-5" aria-hidden />}
      titulo="Notas del local"
      resumen={`${notas?.length ?? 0} nota(s) · Fogón las lee`}
    >
      <p className="text-sm text-tinta-suave">
        Lo que quieras que no se olvide: acuerdos con proveedores, manías de la casa, avisos para el
        equipo. Fogón las tiene en cuenta al aconsejar, y puede apuntar aquí lo que le digas.
      </p>

      <div className="mt-3 flex gap-2">
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
        <Boton cargando={guardar.isPending}
          onClick={() => { if (texto.trim()) { void guardar.mutateAsync({ texto: texto.trim() }); setTexto('') } }}>
          Apuntar
        </Boton>
      </div>

      {isLoading ? <Cargando /> : (
        <ul className="mt-3 flex flex-col gap-2">
          {(notas ?? []).map((n) => (
            <li key={n.id} className="flex items-start gap-2 rounded-lg border border-borde bg-panel p-3">
              <span className="min-w-0 flex-1">
                <span className="block text-sm">{n.texto}</span>
                <span className="mt-0.5 block text-[11px] text-tinta-tenue">
                  {new Date(n.creado_en).toLocaleDateString('es-ES')}
                  {n.de_fogon && ' · apuntada por Fogón'}
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
      )}
    </Bloque>
  )
}

// ---------- Actividad (auditoría) ----------

function Actividad({ localId }: { localId: string }) {
  const { puedeVer } = usePermisos()
  const { data: registros, isLoading } = useAuditoria(localId)
  if (!puedeVer('negocio.auditoria')) return null

  return (
    <Bloque icono={<History className="size-5" aria-hidden />} titulo="Actividad del local"
      resumen="Quién ha tocado qué y cuándo">
      <p className="text-sm text-tinta-suave">
        Todo lo que toca dinero, permisos o registros legales queda aquí. No se puede editar ni
        borrar: es el respaldo cuando algo no cuadra.
      </p>
      {isLoading ? <Cargando /> : (
        <ul className="mt-3 flex flex-col gap-1.5">
          {(registros ?? []).map((r) => (
            <li key={r.id} className="flex items-start gap-2 rounded-lg border border-borde bg-panel px-3 py-2">
              <span className="min-w-0 flex-1">
                <span className="block text-sm">{r.resumen ?? `${r.entidad} · ${r.accion}`}</span>
                <span className="block text-[11px] text-tinta-tenue">
                  {new Date(r.creado_en).toLocaleString('es-ES', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                  {r.de_fogon && ' · Fogón'}
                </span>
              </span>
            </li>
          ))}
          {(registros ?? []).length === 0 && (
            <li className="rounded-lg border border-dashed border-borde p-4 text-center text-sm text-tinta-tenue">
              Todavía no hay actividad registrada.
            </li>
          )}
        </ul>
      )}
    </Bloque>
  )
}
