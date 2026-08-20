import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Logotipo } from '@/marca/Logo'
import { Boton } from '@/componentes/Boton'
import { Campo } from '@/componentes/Campo'
import { Aviso } from '@/componentes/Estado'
import { hayConexion, supabase } from '@/datos/supabase'

export function Entrar() {
  const [params] = useSearchParams()
  const navegar = useNavigate()
  const [modo, setModo] = useState<'entrar' | 'alta'>(params.get('alta') ? 'alta' : 'entrar')
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [nombre, setNombre] = useState('')
  const [local, setLocal] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  async function enviar() {
    setError(null); setAviso(null)
    if (!supabase) { setError('El servidor no está conectado todavía.'); return }
    if (!correo.trim() || clave.length < 4) { setError('Escribe tu correo y tu contraseña.'); return }
    setCargando(true)
    try {
      if (modo === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({ email: correo.trim(), password: clave })
        if (error) throw error
        navegar('/app')
      } else {
        if (!nombre.trim() || !local.trim()) { setError('Falta tu nombre o el del local.'); return }
        const { data, error } = await supabase.auth.signUp({
          email: correo.trim(),
          password: clave,
          options: { data: { nombre: nombre.trim(), local: local.trim() } },
        })
        if (error) throw error
        if (data.session) navegar('/app')
        else setAviso('Te hemos mandado un correo para confirmar la cuenta. Ábrelo y entra desde ahí.')
      }
    } catch (e) {
      const m = e instanceof Error ? e.message : ''
      setError(
        m.includes('Invalid login') ? 'El correo o la contraseña no son correctos.'
        : m.includes('already registered') ? 'Ese correo ya tiene cuenta. Entra en vez de crearla.'
        : m.includes('Email not confirmed') ? 'Confirma el correo que te hemos mandado y vuelve a entrar.'
        : 'No se ha podido completar. Inténtalo otra vez.',
      )
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-panel">
      <header className="flex h-16 items-center px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-tinta-suave hover:text-tinta">
          <ArrowLeft className="size-4" aria-hidden /> Volver
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-4 pb-16">
        <div className="mb-8 flex justify-center"><Logotipo /></div>

        <div className="rounded-xl border border-borde bg-lienzo p-6 shadow-tarjeta">
          <h1 className="font-titulo text-xl font-semibold">
            {modo === 'entrar' ? 'Entrar en tu cocina' : 'Crear tu restaurante'}
          </h1>
          <p className="mt-1 text-sm text-tinta-suave">
            {modo === 'entrar'
              ? 'Con tu correo y tu contraseña. Si trabajas aquí y tienes un PIN, úsalo en el campo de la contraseña.'
              : 'Catorce días de prueba. Se configura en tres minutos.'}
          </p>

          <div className="mt-5 flex flex-col gap-4">
            {modo === 'alta' && (
              <>
                <Campo etiqueta="Tu nombre" obligatorio autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                <Campo etiqueta="Nombre del local" obligatorio placeholder="Bar Centro" value={local} onChange={(e) => setLocal(e.target.value)} />
              </>
            )}
            <Campo etiqueta="Correo" obligatorio type="email" inputMode="email" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
            <Campo
              etiqueta={modo === 'entrar' ? 'Contraseña o PIN' : 'Contraseña'}
              obligatorio type="password"
              autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
              ayuda={modo === 'alta' ? 'Mínimo seis caracteres.' : undefined}
              value={clave} onChange={(e) => setClave(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void enviar()}
            />

            {error && <Aviso nivel="urgente" titulo={error} />}
            {aviso && <Aviso nivel="hecho" titulo={aviso} />}
            {!hayConexion && !error && (
              <Aviso nivel="importante" titulo="El servidor no está conectado en esta versión." />
            )}

            <Boton ancho tamano="grande" cargando={cargando} onClick={() => void enviar()}>
              {modo === 'entrar' ? 'Entrar' : 'Crear mi restaurante'}
            </Boton>
          </div>

          <p className="mt-5 text-center text-sm text-tinta-suave">
            {modo === 'entrar' ? '¿Todavía no tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <button
              type="button"
              className="font-semibold text-naranja-oscuro underline"
              onClick={() => { setModo(modo === 'entrar' ? 'alta' : 'entrar'); setError(null); setAviso(null) }}
            >
              {modo === 'entrar' ? 'Crear mi restaurante' : 'Entrar'}
            </button>
          </p>
        </div>
      </main>
    </div>
  )
}
