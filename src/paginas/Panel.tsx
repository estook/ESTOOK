import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { LogOut, Send, Sparkles } from 'lucide-react'
import { Isotipo } from '@/marca/Logo'
import { Boton } from '@/componentes/Boton'
import { Cifra, Tarjeta } from '@/componentes/Tarjeta'
import { Aviso, Cargando, Insignia } from '@/componentes/Estado'
import { useSesion } from '@/app/sesion'
import { preguntarAFogon } from '@/datos/funciones'
import { useCola } from '@/offline/useCola'

const NOMBRE_PLAN: Record<string, string> = {
  prueba: 'Prueba', base: 'Base', pro: 'Pro', grupo: 'Grupo', a_medida: 'A medida',
}

const modulos = [
  ['Cimientos', 'listo'], ['Identidad y accesos', 'en curso'], ['Navegación', 'pendiente'],
  ['Despensa', 'pendiente'], ['Proveedores y pedidos', 'pendiente'], ['Cocina · fichas', 'pendiente'],
  ['Carta y menú', 'pendiente'], ['Documentos', 'pendiente'], ['Equipo', 'pendiente'],
  ['Servicio y APPCC', 'pendiente'], ['Ventas y TPV', 'pendiente'], ['Negocio', 'pendiente'],
  ['Fogón', 'en curso'], ['Chat', 'pendiente'], ['Competencia y reseñas', 'pendiente'],
] as const

export function Panel() {
  const { cargando, sesion, actual, accesos, elegirLocal, salir } = useSesion()
  const { conRed, enCola } = useCola()
  const [pregunta, setPregunta] = useState('')
  const [respuesta, setRespuesta] = useState<string | null>(null)
  const [pensando, setPensando] = useState(false)
  const [fallo, setFallo] = useState<string | null>(null)

  if (cargando) return <div className="p-8"><Cargando texto="Abriendo tu local" /></div>
  if (!sesion) return <Navigate to="/entrar" replace />

  async function preguntar() {
    if (!pregunta.trim() || !actual) return
    setPensando(true); setFallo(null); setRespuesta(null)
    try {
      const r = await preguntarAFogon(actual.local_id, pregunta.trim(), 'Panel')
      setRespuesta(r.respuesta)
      setPregunta('')
    } catch {
      setFallo('Fogón no ha contestado. Comprueba que las funciones están publicadas y que los secretos están puestos.')
    } finally {
      setPensando(false)
    }
  }

  return (
    <div className="min-h-full bg-panel">
      <header className="sticky top-0 z-30 border-b border-borde bg-lienzo">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4 md:px-8">
          <Link to="/"><Isotipo className="size-7 text-tinta" /></Link>
          {accesos.length > 1 ? (
            <select
              className="h-9 rounded-md border border-borde bg-lienzo px-2 text-sm font-semibold"
              value={actual?.local_id ?? ''}
              onChange={(e) => elegirLocal(e.target.value)}
            >
              {accesos.map((a) => <option key={a.local_id} value={a.local_id}>{a.local}</option>)}
            </select>
          ) : (
            <span className="font-titulo text-sm font-semibold uppercase tracking-wide">{actual?.local ?? 'Sin local'}</span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {actual && <Insignia tono="naranja">{NOMBRE_PLAN[actual.plan] ?? actual.plan}</Insignia>}
            {actual && <Insignia>{actual.rol.replace('_', ' ')}</Insignia>}
            <Boton tono="discreto" tamano="pequeno" onClick={() => void salir()} aria-label="Salir">
              <LogOut className="size-4" aria-hidden />
            </Boton>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-5 md:px-8 md:py-8">
        {!actual && (
          <Aviso nivel="importante" titulo="Tu cuenta todavía no tiene local">
            Alguien tiene que invitarte, o hay que crear el local en la base de datos. Si eres tú
            el dueño, ejecuta <code>config/supabase/admin.sql</code> en el editor SQL de Supabase.
          </Aviso>
        )}

        <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
          <Cifra etiqueta="Cobertura" valor={conRed ? 'Sí' : 'No'} origen="Red del dispositivo" tendencia={conRed ? 'sube' : 'baja'} />
          <Cifra etiqueta="En cola" valor={String(enCola)} origen="Apuntes guardados en el móvil" />
          <Cifra etiqueta="Plan" valor={NOMBRE_PLAN[actual?.plan ?? ''] ?? '—'} origen="De la cuenta" />
          <Cifra etiqueta="Tu rol" valor={(actual?.rol ?? '—').replace('_', ' ')} origen="En este local" />
        </div>

        <Tarjeta titulo="Preguntar a Fogón">
          <p className="text-sm text-tinta-suave">
            Fogón mira el resumen vivo de tu negocio y responde en cuatro frases. Aquí sirve para
            comprobar que la conexión con el modelo está bien puesta.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              className="h-11 min-w-0 flex-1 rounded-md border border-borde px-3 text-sm"
              placeholder="¿Qué me estás vigilando hoy?"
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void preguntar()}
            />
            <Boton onClick={() => void preguntar()} cargando={pensando} disabled={!actual}>
              <Send className="size-4" aria-hidden />
            </Boton>
          </div>
          {respuesta && (
            <div className="mt-3 rounded-lg border border-borde bg-panel p-3">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-naranja-oscuro">
                <Sparkles className="size-3.5" aria-hidden /> Fogón
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{respuesta}</p>
            </div>
          )}
          {fallo && <div className="mt-3"><Aviso nivel="urgente" titulo={fallo} /></div>}
        </Tarjeta>

        <Tarjeta titulo="Por dónde va la construcción" plegable plegadaPorDefecto resumen="M0 listo · M1 y M12 en curso">
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {modulos.map(([nombre, estado], i) => (
              <li key={nombre} className="flex items-center justify-between gap-3 rounded border border-borde px-3 py-2 text-sm">
                <span><span className="text-tinta-tenue">M{i}</span> · {nombre}</span>
                <Insignia tono={estado === 'listo' ? 'ok' : estado === 'en curso' ? 'aviso' : 'neutro'}>{estado}</Insignia>
              </li>
            ))}
          </ul>
        </Tarjeta>

        <p className="text-xs text-tinta-tenue">
          <Link to="/diagnostico" className="underline">Diagnóstico técnico</Link> · comprobación de la cola offline y de la conexión.
        </p>
      </main>
    </div>
  )
}
