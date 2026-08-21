import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { Aparece, Contador } from '@/paginas/efectos'
import { CabeceraPagina, MarcoWeb } from '@/paginas/web/MarcoWeb'

const planes = [
  {
    nombre: 'Base', precio: 45, nota: 'por local y mes, IVA incluido',
    para: 'Un establecimiento que quiere controlar costes y cumplir con los registros.',
    incluye: [
      'Las ocho áreas y todos los documentos',
      'Fogón con 30 consultas al día',
      '60 albaranes por fotografía al mes',
      'Competencia y reseñas con revisión semanal',
      'Acceso para la gestoría',
      'Ventas por CSV, fotografía del Z o total diario',
    ],
  },
  {
    nombre: 'Pro', precio: 69, nota: 'por local y mes, IVA incluido', destacado: true,
    para: 'Quien quiere que las ventas entren solas y el cierre esté hecho al terminar el servicio.',
    incluye: [
      'Todo lo del plan Base',
      'TPV conectado por API',
      'Fogón con 60 consultas al día',
      'Albaranes por fotografía sin límite',
      'Alertas de cambios en la competencia',
      'Respuesta propuesta a cada reseña',
      'Soporte prioritario',
    ],
  },
  {
    nombre: 'Grupo', precio: 55, nota: 'por local y mes · de 2 a 3 locales',
    para: 'Varios establecimientos con los mismos indicadores en una sola vista.',
    incluye: [
      'Todo lo del plan Pro en cada local',
      'Comparativa entre establecimientos',
      'Catálogo y recetas compartidos',
      'TPV incluido en cada local',
      'Soporte prioritario',
    ],
  },
]

const PREGUNTAS: [string, string][] = [
  ['¿Hay periodo de prueba?', 'Catorce días. Se solicita el método de pago al comenzar y, si no se cancela antes del día quince, se activa el plan seleccionado. Durante la prueba está disponible todo, con algún límite de volumen.'],
  ['¿Hay permanencia?', 'No. Se puede cancelar en cualquier momento y la facturación se detiene al final del periodo en curso.'],
  ['¿Cuántos dispositivos puedo usar?', 'Los que necesites. El precio es por establecimiento, no por usuario ni por terminal.'],
  ['¿Se integra con mi TPV?', 'Sí, en los planes Pro y Grupo, mediante una API unificada compatible con las marcas más habituales en España. Las ventas se sincronizan cada quince minutos. En el plan Base se incorporan por CSV, por fotografía del Z o con el total del día.'],
  ['¿Sirve para el control sanitario?', 'Sí. Se define el plan con sus puntos de control, límites y frecuencias, y el equipo lo cumplimenta firmando con su PIN. Un valor fuera de rango exige registrar la acción correctiva. De ahí se obtiene la carpeta de inspección del periodo.'],
  ['¿Funciona sin conexión?', 'Sí. Se instala como aplicación en el móvil y lo que se registra sin cobertura queda guardado en el dispositivo y se sincroniza al recuperar la señal, en orden y sin duplicados.'],
  ['¿Cada empleado ve todo?', 'No. Los permisos se definen por puesto y se ajustan uno a uno. El personal de cocina consulta gramajes y elaboraciones sin ningún importe. Las restricciones se aplican en el servidor.'],
  ['¿Qué pasa con mis datos si me doy de baja?', 'Se exportan íntegramente en un clic y la cuenta permanece en modo lectura durante sesenta días. No se elimina información.'],
  ['Tengo más de tres locales', 'El precio se acuerda según volumen, con integración con tu ERP, informes propios, formación y responsable asignado.'],
]

export function Precios() {
  return (
    <MarcoWeb>
      <CabeceraPagina
        seccion="Precios"
        titulo="Por local y mes, sin permanencia"
        entrada="Todos los planes incluyen las ocho áreas, todos los documentos y a Fogón. Lo que cambia es el volumen de uso y si el TPV entra conectado. Dispositivos ilimitados."
      />

      <section className="bg-lienzo">
        <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-20">
          <div className="grid gap-5 lg:grid-cols-3">
            {planes.map((p, i) => (
              <Aparece key={p.nombre} retraso={i * 90}>
                <article className={`flex h-full flex-col rounded-2xl border p-7 transition-all duration-300 hover:-translate-y-1 ${
                  p.destacado
                    ? 'border-tinta bg-tinta text-white shadow-[0_20px_50px_-25px_rgba(17,28,31,.6)]'
                    : 'border-borde bg-lienzo hover:border-naranja hover:shadow-tarjeta'
                }`}>
                  {p.destacado && (
                    <span className="mb-4 w-fit rounded-full bg-naranja px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                      Más contratado
                    </span>
                  )}
                  <h2 className="font-titulo text-lg font-semibold uppercase tracking-wide">{p.nombre}</h2>
                  <p className="mt-4 font-titulo text-[2.75rem] font-semibold leading-none">
                    <Contador hasta={p.precio} sufijo=" €" />
                  </p>
                  <p className={`mt-1.5 text-xs ${p.destacado ? 'text-white/50' : 'text-tinta-tenue'}`}>{p.nota}</p>
                  <p className={`mt-5 text-sm leading-relaxed ${p.destacado ? 'text-white/70' : 'text-tinta-suave'}`}>
                    {p.para}
                  </p>
                  <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                    {p.incluye.map((x) => (
                      <li key={x} className="flex gap-2.5 text-sm">
                        <Check className={`mt-0.5 size-4 shrink-0 ${p.destacado ? 'text-naranja' : 'text-ok'}`} aria-hidden />
                        <span className={p.destacado ? 'text-white/85' : ''}>{x}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/entrar?alta=1" className="mt-7">
                    <Boton ancho tono={p.destacado ? 'principal' : 'secundario'}>Probar 14 días</Boton>
                  </Link>
                </article>
              </Aparece>
            ))}
          </div>

          <Aparece retraso={120}>
            <div className="mt-8 grid gap-4 rounded-2xl border border-borde bg-panel p-6 sm:grid-cols-3">
              {[
                ['Pago anual', 'Dos meses de descuento sobre la tarifa mensual.'],
                ['Más de tres locales', 'Precio acordado según volumen, con responsable asignado.'],
                ['Sin coste de alta', 'La configuración inicial y el traspaso de datos no se facturan.'],
              ].map(([t, s]) => (
                <div key={t}>
                  <p className="font-titulo text-sm font-semibold uppercase tracking-wide">{t}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-tinta-suave">{s}</p>
                </div>
              ))}
            </div>
          </Aparece>
        </div>
      </section>

      <section className="border-t border-borde bg-panel">
        <div className="mx-auto max-w-[860px] px-4 py-16 md:px-8 md:py-20">
          <Aparece>
            <h2 className="font-titulo text-3xl font-semibold">Preguntas frecuentes</h2>
          </Aparece>
          <div className="mt-10 divide-y divide-borde border-y border-borde">
            {PREGUNTAS.map(([p, r]) => (
              <details key={p} className="group py-1">
                <summary className="flex cursor-pointer list-none items-center gap-4 py-4 font-titulo font-semibold marker:hidden">
                  <span className="flex-1">{p}</span>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border border-borde text-naranja transition-transform duration-300 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pb-5 pr-11 leading-relaxed text-tinta-suave">{r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </MarcoWeb>
  )
}
