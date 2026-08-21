import { useState } from 'react'
import { Send } from 'lucide-react'
import { Hoja } from '@/componentes/Hoja'
import { CaraFogon } from '@/marca/Logo'
import { Boton } from '@/componentes/Boton'
import { Aviso } from '@/componentes/Estado'
import { useSesion } from '@/app/sesion'
import { preguntarAFogon } from '@/datos/funciones'

interface Turno { de: 'yo' | 'fogon'; texto: string }

const SUGERENCIAS = [
  '¿Qué me está costando dinero hoy?',
  '¿Qué platos van flojos de margen?',
  '¿Qué meto en el menú de mañana?',
]

/**
 * Fogón está en todas las pantallas: sabe dónde estás, pero ve todo el negocio.
 * Máximo cuatro frases, y nunca guarda nada por su cuenta.
 */
export function Fogon({ abierto, onCerrar, pantalla }: { abierto: boolean; onCerrar: () => void; pantalla?: string }) {
  const { actual } = useSesion()
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [texto, setTexto] = useState('')
  const [pensando, setPensando] = useState(false)
  const [fallo, setFallo] = useState<string | null>(null)

  async function mandar(pregunta = texto) {
    if (!pregunta.trim() || !actual) return
    setTurnos((t) => [...t, { de: 'yo', texto: pregunta.trim() }])
    setTexto(''); setPensando(true); setFallo(null)
    try {
      const r = await preguntarAFogon(actual.local_id, pregunta.trim(), pantalla)
      if (r.error) {
        setFallo(`${r.error}${r.detalle ? ` (${r.detalle})` : ''}`)
      } else {
        setTurnos((t) => [...t, { de: 'fogon', texto: r.respuesta || 'No he podido contestar a eso.' }])
      }
    } catch (e) {
      const bruto = e as { message?: string; estado?: number; context?: { status?: number } }
      const codigo = bruto?.estado ?? bruto?.context?.status
      setFallo(
        codigo === 401 || codigo === 403
          ? 'Fogón no reconoce tu sesión. Cierra sesión y vuelve a entrar.'
          : codigo === 503
            ? 'Falta la clave del modelo en los secretos de Supabase (AI_API_KEY).'
            : codigo === 404
              ? 'La función «fogon» no está publicada en Supabase.'
              : bruto?.message
                ? `Fogón: ${bruto.message}`
                : 'Fogón no ha contestado.',
      )
    } finally {
      setPensando(false)
    }
  }

  return (
    <Hoja
      abierta={abierto}
      titulo="Fogón"
      descripcion="El asistente de tu cocina. Ve todo el negocio, y responde corto."
      onCerrar={onCerrar}
      pie={
        <div className="flex w-full gap-2">
          <input
            className="h-11 min-w-0 flex-1 rounded-md border border-borde px-3 text-sm"
            placeholder="Pregúntale lo que quieras"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void mandar()}
          />
          <Boton onClick={() => void mandar()} cargando={pensando} aria-label="Enviar">
            <Send className="size-4" aria-hidden />
          </Boton>
        </div>
      }
    >
      <div className="flex flex-col gap-3 pt-1">
        {turnos.length === 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-tinta-suave">Prueba con esto:</p>
            {SUGERENCIAS.map((s) => (
              <button key={s} onClick={() => void mandar(s)}
                className="rounded-lg border border-borde bg-panel px-3 py-2 text-left text-sm hover:bg-naranja-suave">
                {s}
              </button>
            ))}
          </div>
        )}

        {turnos.map((t, i) => (
          <div key={i} className={t.de === 'yo' ? 'self-end max-w-[85%]' : 'max-w-[95%]'}>
            {t.de === 'fogon' && (
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-naranja-oscuro">
                <CaraFogon className="size-5" /> Fogón
              </p>
            )}
            <div className={`rounded-lg px-3 py-2 text-sm ${t.de === 'yo' ? 'bg-tinta text-white' : 'border border-borde bg-panel'}`}>
              <p className="whitespace-pre-wrap">{t.texto}</p>
            </div>
          </div>
        ))}

        {pensando && <p className="text-sm text-tinta-tenue">Fogón está mirando tus números…</p>}
        {fallo && <Aviso nivel="urgente" titulo={fallo} />}
      </div>
    </Hoja>
  )
}
