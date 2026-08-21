import { Link } from 'react-router-dom'
import { Check, Download, LogOut } from 'lucide-react'
import { Logotipo } from '@/marca/Logo'
import { Boton } from '@/componentes/Boton'
import { useSesion } from '@/app/sesion'

const PLANES = [
  { nombre: 'Base', precio: '45 €', texto: 'Todas las áreas, documentos y Fogón.' },
  { nombre: 'Pro', precio: '69 €', texto: 'Añade TPV conectado y más volumen.', destacado: true },
  { nombre: 'Grupo', precio: '55 €', texto: 'De dos a tres locales, con comparativa.' },
]

/**
 * Muro de contratación.
 *
 * Aparece cuando el servidor dice que la cuenta no tiene plan vigente. No es
 * solo una pantalla: la base de datos tampoco devuelve ningún dato del negocio
 * en ese estado, así que no hay forma de saltárselo desde el navegador.
 */
export function SinPlan() {
  const { accesos, salir } = useSesion()
  const cuenta = accesos[0]
  const caducada = cuenta?.plan === 'prueba'
  const impago = cuenta?.estadoPago === 'fallido' || cuenta?.estadoPago === 'solo_lectura'

  return (
    <div className="flex min-h-full flex-col bg-panel">
      <header className="flex h-16 items-center justify-between px-4 md:px-8">
        <Logotipo conClaim={false} />
        <Boton tono="discreto" tamano="pequeno" onClick={() => void salir()}>
          <LogOut className="size-4" aria-hidden /> Salir
        </Boton>
      </header>

      <main className="mx-auto flex w-full max-w-[880px] flex-1 flex-col justify-center px-4 py-10">
        <div className="rounded-2xl border border-borde bg-lienzo p-7 shadow-tarjeta md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-naranja">
            {impago ? 'Cuenta suspendida' : caducada ? 'Prueba finalizada' : 'Sin plan activo'}
          </p>
          <h1 className="mt-4 font-titulo text-2xl font-semibold leading-tight md:text-3xl">
            Contrata un plan para acceder a Estook
          </h1>
          <p className="mt-4 max-w-xl leading-relaxed text-tinta-suave">
            {impago
              ? 'Hay un pago pendiente. En cuanto se regularice, la cuenta vuelve a estar operativa con toda tu información intacta.'
              : caducada
                ? 'El periodo de prueba ha terminado. Tus datos siguen guardados: al contratar un plan, todo vuelve a estar donde lo dejaste.'
                : 'Esta cuenta no tiene ningún plan vigente. Elige uno para entrar en la aplicación.'}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {PLANES.map((p) => (
              <div key={p.nombre}
                className={`rounded-xl border p-4 ${p.destacado ? 'border-naranja bg-naranja-suave' : 'border-borde bg-panel'}`}>
                <p className="font-titulo text-sm font-semibold uppercase tracking-wide">{p.nombre}</p>
                <p className="cifras mt-1 font-titulo text-2xl font-semibold">{p.precio}</p>
                <p className="text-[11px] text-tinta-tenue">por local y mes, IVA incluido</p>
                <p className="mt-2 text-sm leading-relaxed text-tinta-suave">{p.texto}</p>
              </div>
            ))}
          </div>

          <ul className="mt-6 flex flex-col gap-2">
            {[
              'Tus datos se conservan íntegros mientras la cuenta esté suspendida.',
              'Puedes exportarlos en cualquier momento, sin contratar nada.',
              'Al contratar, el acceso se restablece al instante.',
            ].map((t) => (
              <li key={t} className="flex gap-2 text-sm text-tinta-suave">
                <Check className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden /> {t}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/precios"><Boton tamano="grande">Ver los planes</Boton></Link>
            <Boton tono="discreto" tamano="grande" onClick={() => window.print()}>
              <Download className="size-4" aria-hidden /> Exportar mis datos
            </Boton>
          </div>

          <p className="mt-6 text-xs text-tinta-tenue">
            ¿Crees que esto es un error? Escríbenos y lo revisamos: puede tratarse de un cobro que
            aún no se ha registrado.
          </p>
        </div>
      </main>
    </div>
  )
}
