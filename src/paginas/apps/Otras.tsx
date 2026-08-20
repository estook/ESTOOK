import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, CalendarClock, MessageSquare, Star, Store } from 'lucide-react'
import { Tarjeta } from '@/componentes/Tarjeta'
import { Boton } from '@/componentes/Boton'
import { Insignia } from '@/componentes/Estado'
import { useSesion } from '@/app/sesion'

function Cabecera({ icono, titulo, texto }: { icono: ReactNode; titulo: string; texto: string }) {
  return (
    <header>
      <h1 className="flex items-center gap-2 font-titulo text-2xl font-semibold">{icono} {titulo}</h1>
      <p className="mt-1 max-w-2xl text-sm text-tinta-suave">{texto}</p>
    </header>
  )
}

function Proximamente({ partes }: { partes: [string, string][] }) {
  return (
    <Tarjeta titulo="Qué entra en esta app">
      <ul className="flex flex-col gap-2">
        {partes.map(([nombre, texto]) => (
          <li key={nombre} className="rounded-lg border border-borde px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{nombre}</span>
              <Insignia>en construcción</Insignia>
            </div>
            <p className="mt-0.5 text-sm text-tinta-suave">{texto}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-tinta-suave">
        La base de datos de todo esto ya está montada y las reglas de acceso también: falta la
        pantalla. Mientras tanto, <Link to="/app/despensa" className="font-semibold text-naranja-oscuro underline">Despensa</Link> ya funciona entera.
      </p>
    </Tarjeta>
  )
}

export function Equipo() {
  return (
    <div className="flex flex-col gap-4">
      <Cabecera icono={<CalendarClock className="size-6 text-naranja" aria-hidden />} titulo="Equipo"
        texto="Personas, cuadrante con turnos partidos y fichaje con un botón." />
      <Proximamente partes={[
        ['Personas', 'Alta con correo y PIN, rol y alcance ajustable casilla a casilla.'],
        ['Horarios', 'Turnos partidos en tramos; al publicar, cada uno recibe el suyo, no el cuadrante entero.'],
        ['Fichajes', 'Botón con reloj en marcha. Cada uno ve sus horas y nunca su sueldo.'],
      ]} />
    </div>
  )
}

export function Negocio() {
  return (
    <div className="flex flex-col gap-4">
      <Cabecera icono={<BarChart3 className="size-6 text-naranja" aria-hidden />} titulo="Negocio"
        texto="Resúmenes, dónde se va el margen, el TPV y la auditoría." />
      <Proximamente partes={[
        ['Resúmenes', 'Día, semana y mes: ventas, materia prima, personal, prime cost y desviación.'],
        ['Costes', 'Subidas sin repercutir, género sin explicar, mermas y platos bajo objetivo.'],
        ['TPV', 'Conexión por API con su onboarding de cuatro pantallas y emparejado de artículos.'],
        ['Auditoría', 'Todo lo que toca dinero, permisos o registros legales. Solo altas.'],
      ]} />
    </div>
  )
}

export function Competencia() {
  return (
    <div className="flex flex-col gap-4">
      <Cabecera icono={<Store className="size-6 text-naranja" aria-hidden />} titulo="Competencia"
        texto="Dónde estás respecto a los de al lado, sin salir a preguntar." />
      <Proximamente partes={[
        ['La lista', 'Locales cercanos ordenables por distancia, valoración o precio del menú.'],
        ['La ficha', 'Precios, tipo de cocina, horarios, reseñas y qué dice Fogón de todo eso.'],
        ['Informe de zona', 'Para decidir una subida de precios con datos, o para enseñárselo al socio.'],
      ]} />
    </div>
  )
}

export function Resenas() {
  return (
    <div className="flex flex-col gap-4">
      <Cabecera icono={<Star className="size-6 text-naranja" aria-hidden />} titulo="Reseñas"
        texto="La voz del cliente, ordenada por tema y cruzada con lo que pasa dentro." />
      <Proximamente partes={[
        ['Lo que se repite', 'Comida, servicio, precio, espera, limpieza y ruido, con su tendencia.'],
        ['Caídas', 'Si la nota baja tres décimas en un mes, aviso con las reseñas que lo explican.'],
        ['Respuesta propuesta', 'Escrita en el tono del local, para que la mandes tú. Nunca responde sola.'],
      ]} />
    </div>
  )
}

export function Chat() {
  return (
    <div className="flex flex-col gap-4">
      <Cabecera icono={<MessageSquare className="size-6 text-naranja" aria-hidden />} titulo="Chat"
        texto="La forma oficial de hablar del trabajo. Todo queda registrado." />
      <Proximamente partes={[
        ['Canales', 'Uno general, uno por área y directos entre dos personas.'],
        ['Tarjetas de contexto', 'Compartir un plato, un pedido o una ficha llega enlazado, no como texto suelto.'],
        ['Confirmación de lectura', 'Para el «mañana entramos a las 11» que luego nadie recuerda.'],
      ]} />
    </div>
  )
}

export function Ajustes() {
  const { actual, salir } = useSesion()
  return (
    <div className="flex flex-col gap-4">
      <Cabecera icono={<span />} titulo="Ajustes" texto="Tu local, tus apps, tus objetivos y tu acceso." />
      <Tarjeta titulo="Este local">
        <dl className="grid gap-2 sm:grid-cols-2">
          {[['Local', actual?.local ?? '—'], ['Tu rol', (actual?.rol ?? '—').replace('_', ' ')],
            ['Plan', actual?.plan ?? '—'], ['Identificador', actual?.local_id.slice(0, 8) ?? '—']].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-borde bg-panel p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-tinta-tenue">{k}</dt>
              <dd className="mt-0.5 font-semibold capitalize">{v}</dd>
            </div>
          ))}
        </dl>
      </Tarjeta>
      <Tarjeta titulo="Mi acceso">
        <Boton tono="discreto" onClick={() => void salir()}>Cerrar sesión</Boton>
      </Tarjeta>
    </div>
  )
}
