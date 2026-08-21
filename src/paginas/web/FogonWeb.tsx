import { Link } from 'react-router-dom'
import { ArrowRight, Boxes, ChefHat, ClipboardCheck, Store, TrendingDown, Users } from 'lucide-react'
import { CaraFogon } from '@/marca/Logo'
import { Boton } from '@/componentes/Boton'
import { Aparece, Contador } from '@/paginas/efectos'
import { CabeceraPagina, MarcoWeb } from '@/paginas/web/MarcoWeb'

const FUENTES = [
  { icono: Boxes, titulo: 'Compras y existencias', texto: 'Precios por proveedor, histórico, mermas y rotación.' },
  { icono: ChefHat, titulo: 'Cocina y carta', texto: 'Escandallos, márgenes por plato y qué se vende.' },
  { icono: ClipboardCheck, titulo: 'Servicio', texto: 'Ventas, cierres y registros de control sanitario.' },
  { icono: Users, titulo: 'Equipo', texto: 'Cuadrante, horas y coste de personal por día.' },
  { icono: Store, titulo: 'Tu entorno', texto: 'Precios y valoraciones de los establecimientos cercanos.' },
  { icono: TrendingDown, titulo: 'Tendencia', texto: 'Comparación con semanas anteriores y con el mismo mes del año pasado.' },
]

const AHORA = [
  ['Quedan 2,1 kg de merluza con caducidad el día 19', 'No está en el menú de hoy. Se recomienda darle salida.'],
  ['Tres días seguidos con la cámara de pescado por encima de 4 °C', 'Revisar el cierre de la puerta y registrar la acción correctiva.'],
  ['El pedido a Pescados Gil se envió hace cuatro días', 'Si ya ha llegado, recíbelo para que el género entre en el inventario.'],
  ['Faltan dos controles sanitarios de hoy', 'Sin registrar aparecen en rojo en la carpeta de inspección.'],
]

const DESPUES = [
  ['El rabo de toro está al 2 % de margen', 'Sus ingredientes han subido un 14 % desde marzo y el precio no se ha revisado.'],
  ['El martes es el día de menor facturación desde junio', 'El cuadrante mantiene dos horas de sala por encima de lo necesario.'],
  ['Tu menú está 1,50 € por debajo de la media de la zona', 'Con una valoración superior a la de los establecimientos cercanos.'],
  ['La merluza se raciona un 6 % por encima de la ficha', 'Se ajusta el cálculo para que deje de aparecer como desviación.'],
]

export function FogonWeb() {
  return (
    <MarcoWeb>
      <CabeceraPagina
        seccion="Fogón · inteligencia artificial"
        titulo="Analiza el negocio entero y te dice qué hacer"
        entrada="Fogón cruza miles de datos de tu establecimiento y de tu entorno para detectar lo que está costando dinero hoy y lo que lo costará dentro de un mes. No espera a que preguntes."
      />

      {/* ---------- De dónde saca la información ---------- */}
      <section className="border-b border-borde bg-lienzo">
        <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-20">
          <Aparece>
            <h2 className="max-w-2xl font-titulo text-3xl font-semibold leading-tight md:text-[2.2rem]">
              Con qué trabaja
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-tinta-suave">
              Todo lo que ocurre en la aplicación alimenta un resumen permanente del establecimiento.
              Los números no los estima: los recibe ya calculados.
            </p>
          </Aparece>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FUENTES.map(({ icono: Icono, titulo, texto }, i) => (
              <Aparece key={titulo} retraso={i * 70}>
                <article className="h-full rounded-xl border border-borde bg-lienzo p-5 transition-all duration-300 hover:-translate-y-1 hover:border-naranja hover:shadow-tarjeta">
                  <Icono className="size-5 text-naranja" aria-hidden />
                  <h3 className="mt-3 font-titulo text-sm font-semibold uppercase tracking-wide">{titulo}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-tinta-suave">{texto}</p>
                </article>
              </Aparece>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Qué resuelve ---------- */}
      <section className="relative overflow-hidden bg-tinta text-white">
        <div className="pointer-events-none absolute right-0 top-0 size-[420px] rounded-full bg-naranja/20 blur-[120px]" />
        <div className="relative mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-20">
          <Aparece>
            <h2 className="font-titulo text-3xl font-semibold leading-tight md:text-[2.2rem]">
              Qué resuelve
            </h2>
          </Aparece>

          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            {[['Durante el servicio', AHORA], ['A medio plazo', DESPUES]].map(([titulo, lista], col) => (
              <Aparece key={String(titulo)} desde={col === 0 ? 'izquierda' : 'derecha'}>
                <h3 className="font-titulo text-sm font-semibold uppercase tracking-[0.18em] text-white/50">
                  {titulo as string}
                </h3>
                <ul className="mt-5 flex flex-col gap-3">
                  {(lista as string[][]).map(([t, s]) => (
                    <li key={t} className="rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur transition-colors hover:border-naranja/50">
                      <div className="flex gap-3">
                        <CaraFogon className="size-7" />
                        <div>
                          <p className="text-sm font-semibold leading-tight">{t}</p>
                          <p className="mt-1 text-sm text-white/60">{s}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Aparece>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Cómo se comporta ---------- */}
      <section className="border-b border-borde bg-lienzo">
        <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-20">
          <Aparece>
            <h2 className="font-titulo text-3xl font-semibold leading-tight md:text-[2.2rem]">
              Cómo se comporta
            </h2>
          </Aparece>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              ['Habla según el puesto', 'Al personal de cocina le informa de tareas y caducidades, sin ningún importe. La información económica queda para quien corresponde.'],
              ['Cifras verificables', 'Cada dato procede de una consulta a tu base de datos. Si un número no existe, lo dice en vez de inventarlo.'],
              ['La decisión es tuya', 'Propone la acción y deja el cambio preparado, pero la confirmación es siempre de una persona. Lo aceptado queda registrado.'],
            ].map(([t, s], i) => (
              <Aparece key={t} retraso={i * 80}>
                <div>
                  <p className="font-titulo text-base font-semibold">{t}</p>
                  <p className="mt-2 text-sm leading-relaxed text-tinta-suave">{s}</p>
                </div>
              </Aparece>
            ))}
          </div>

          <Aparece retraso={120}>
            <div className="mt-14 grid gap-6 rounded-2xl border border-borde bg-panel p-8 sm:grid-cols-3">
              {[
                ['Consultas al día', <Contador key="a" hasta={60} />, 'Según el plan contratado'],
                ['Avisos automáticos', <Contador key="b" hasta={6} />, 'Diarios, sin preguntar'],
                ['Análisis del cierre', <Contador key="c" hasta={1} />, 'Cada noche, con resumen semanal'],
              ].map(([t, v, s]) => (
                <div key={String(t)}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-tinta-tenue">{t}</p>
                  <p className="mt-1 font-titulo text-3xl font-semibold">{v}</p>
                  <p className="mt-1 text-xs text-tinta-tenue">{s}</p>
                </div>
              ))}
            </div>
          </Aparece>

          <Aparece retraso={160}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/precios"><Boton>Ver planes <ArrowRight className="size-4" /></Boton></Link>
              <Link to="/producto" className="text-sm font-semibold text-naranja-oscuro hover:underline">
                Ver la aplicación por dentro
              </Link>
            </div>
          </Aparece>
        </div>
      </section>
    </MarcoWeb>
  )
}
