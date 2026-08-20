import { Link } from 'react-router-dom'
import { ArrowRight, ScanLine, ShoppingCart, Trash2 } from 'lucide-react'
import { Cifra, Tarjeta } from '@/componentes/Tarjeta'
import { Boton } from '@/componentes/Boton'
import { Aviso, Cargando, Insignia } from '@/componentes/Estado'
import { useSesion } from '@/app/sesion'
import { cantidad, euros, usePedidos, useProductos } from '@/datos/despensa'
import { useCola } from '@/offline/useCola'

/**
 * El Panel es el sitio donde se mira; las apps son donde se trabaja.
 * Nada se apila y no hay scroll infinito: widgets plegables, y plegados
 * enseñan su resumen en la cabecera.
 */
export function PanelInicio() {
  const { actual } = useSesion()
  const { data: productos, isLoading } = useProductos(actual?.local_id)
  const { data: pedidos } = usePedidos(actual?.local_id)
  const { conRed, enCola } = useCola()

  if (!actual) {
    return (
      <Aviso nivel="importante" titulo="Tu cuenta todavía no tiene local">
        Si eres el dueño, ejecuta <code>config/supabase/alta.sql</code> y <code>admin.sql</code> en
        el editor SQL de Supabase. Si trabajas aquí, pide que te inviten.
      </Aviso>
    )
  }

  const lista = productos ?? []
  const bajoMinimo = lista.filter((p) => p.minimo != null && p.stock_actual < p.minimo)
  const sinPrecio = lista.filter((p) => p.precio_ultimo == null)
  const valorCamara = lista.reduce((s, p) => {
    const coste = p.precio_ultimo != null && p.factor && p.rendimiento
      ? p.precio_ultimo / (p.factor * p.rendimiento) : 0
    return s + coste * p.stock_actual
  }, 0)
  const abiertos = (pedidos ?? []).filter((p) => p.estado !== 'recibido' && p.estado !== 'cancelado')

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-titulo text-2xl font-semibold">{actual.local}</h1>
          <p className="text-sm text-tinta-suave">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Insignia tono={conRed ? 'ok' : 'alerta'}>{conRed ? 'Con cobertura' : 'Sin cobertura'}</Insignia>
          {enCola > 0 && <Insignia tono="aviso">{enCola} sin subir</Insignia>}
        </div>
      </header>

      {isLoading ? <Cargando texto="Leyendo tus números" /> : (
        <>
          <section className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
            <Cifra etiqueta="Valor en cámara" valor={euros(valorCamara)} origen="Suma del coste real de lo que hay" />
            <Cifra etiqueta="Referencias" valor={String(lista.length)} origen="Productos activos en despensa" />
            <Cifra etiqueta="Bajo mínimo" valor={String(bajoMinimo.length)} origen="Por debajo del mínimo fijado"
              tendencia={bajoMinimo.length ? 'baja' : 'igual'} />
            <Cifra etiqueta="Pedidos abiertos" valor={String(abiertos.length)} origen="En borrador o enviados" />
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <Tarjeta titulo="Hoy hay que hacer" resumen={`${bajoMinimo.length + sinPrecio.length} cosas`}>
              {bajoMinimo.length === 0 && sinPrecio.length === 0 ? (
                <p className="text-sm text-tinta-suave">Nada pendiente. Buena señal.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {bajoMinimo.slice(0, 4).map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-borde px-3 py-2 text-sm">
                      <span>
                        <strong>{p.nombre}</strong> bajo mínimo
                        <span className="block text-xs text-tinta-tenue">
                          quedan {cantidad(p.stock_actual, p.unidad_uso)} de {cantidad(p.minimo ?? 0, p.unidad_uso)}
                        </span>
                      </span>
                      <Link to="/app/despensa"><Boton tamano="pequeno" tono="discreto">Pedir</Boton></Link>
                    </li>
                  ))}
                  {sinPrecio.length > 0 && (
                    <li className="flex items-center justify-between gap-3 rounded-lg border border-borde px-3 py-2 text-sm">
                      <span>
                        <strong>{sinPrecio.length} producto(s) sin precio</strong>
                        <span className="block text-xs text-tinta-tenue">cuentan cero en los escandallos</span>
                      </span>
                      <Link to="/app/despensa"><Boton tamano="pequeno" tono="discreto">Ver</Boton></Link>
                    </li>
                  )}
                </ul>
              )}
            </Tarjeta>

            <Tarjeta titulo="Accesos rápidos">
              <div className="grid grid-cols-2 gap-2">
                <Link to="/app/despensa"><Boton ancho tono="discreto"><ScanLine className="size-4" aria-hidden /> Escanear albarán</Boton></Link>
                <Link to="/app/despensa"><Boton ancho tono="discreto"><ShoppingCart className="size-4" aria-hidden /> Nuevo pedido</Boton></Link>
                <Link to="/diagnostico"><Boton ancho tono="discreto"><Trash2 className="size-4" aria-hidden /> Apuntar merma</Boton></Link>
                <Link to="/app/negocio"><Boton ancho tono="discreto">Cerrar caja <ArrowRight className="size-4" aria-hidden /></Boton></Link>
              </div>
              <p className="mt-3 text-xs text-tinta-tenue">
                Escanear albarán y cerrar caja llegan con los módulos de despensa por foto y servicio.
              </p>
            </Tarjeta>
          </div>
        </>
      )}
    </div>
  )
}
