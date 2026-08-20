import { useState } from 'react'
import { CloudOff, Cloud, Package, RefreshCw, Thermometer, Trash2 } from 'lucide-react'
import { Logotipo } from '@/marca/Logo'
import { Boton } from '@/componentes/Boton'
import { Cifra, Tarjeta } from '@/componentes/Tarjeta'
import { Campo, Selector } from '@/componentes/Campo'
import { Hoja } from '@/componentes/Hoja'
import { Tabla, type Columna } from '@/componentes/Tabla'
import { Aviso, Insignia, Vacio } from '@/componentes/Estado'
import { hayConexion } from '@/datos/supabase'
import { encolar, type Apunte } from '@/offline/cola'
import { useCola } from '@/offline/useCola'

const motivos = ['Caducidad', 'Rotura', 'Error de cocina', 'Devolución', 'Personal']

export function Cimientos() {
  const { conRed, enCola, apuntes, sincronizando, subirAhora, refrescar } = useCola()
  const [hojaAbierta, setHojaAbierta] = useState(false)
  const [producto, setProducto] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState(motivos[0])
  const [guardado, setGuardado] = useState<string | null>(null)

  async function apuntarMerma() {
    if (!producto.trim() || !cantidad.trim()) return
    await encolar('mermas', {
      producto: producto.trim(),
      cantidad: Number(cantidad.replace(',', '.')),
      motivo,
      registrado_en: new Date().toISOString(),
    })
    setGuardado(`${producto.trim()} · ${cantidad} · ${motivo.toLowerCase()}`)
    setProducto('')
    setCantidad('')
    setHojaAbierta(false)
    await refrescar()
  }

  const columnas: Columna<Apunte>[] = [
    {
      clave: 'que',
      titulo: 'Apunte',
      celda: (a) => (
        <span className="flex items-center gap-2">
          <span className="font-semibold capitalize">{a.tabla}</span>
          <span className="text-tinta-tenue">{String(a.datos.producto ?? a.datos.punto ?? '')}</span>
        </span>
      ),
    },
    {
      clave: 'hora',
      titulo: 'Hora',
      celda: (a) => new Date(a.creadoEn).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    },
    {
      clave: 'estado',
      titulo: 'Estado',
      alineada: 'derecha',
      celda: (a) => (
        <Insignia tono={a.estado === 'subido' ? 'ok' : a.estado === 'fallido' ? 'alerta' : 'aviso'}>
          {a.estado === 'subido' ? 'En el servidor' : a.estado === 'fallido' ? 'Falló' : 'En el móvil'}
        </Insignia>
      ),
    },
  ]

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[1440px] flex-col gap-4 px-4 py-5 md:px-8 md:py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Logotipo />
        <div className="flex items-center gap-2">
          <Insignia tono={conRed ? 'ok' : 'alerta'}>
            {conRed ? <Cloud className="size-3.5" aria-hidden /> : <CloudOff className="size-3.5" aria-hidden />}
            {conRed ? 'Con cobertura' : 'Sin cobertura'}
          </Insignia>
          <Insignia tono={hayConexion ? 'ok' : 'neutro'}>
            {hayConexion ? 'Servidor conectado' : 'Servidor sin conectar'}
          </Insignia>
        </div>
      </header>

      <div>
        <h1 className="font-titulo text-2xl font-semibold">Módulo 0 · Cimientos</h1>
        <p className="mt-1 max-w-2xl text-sm text-tinta-suave">
          Esta pantalla existe para comprobar que la base aguanta: se guarda estando sin cobertura y sube al volver.
          Desaparece en cuanto entre el Panel del módulo 2.
        </p>
      </div>

      <section className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
        <Cifra etiqueta="En cola" valor={String(enCola)} origen="Guardados en este móvil" />
        <Cifra
          etiqueta="Cobertura"
          valor={conRed ? 'Sí' : 'No'}
          origen="Red del dispositivo"
          tendencia={conRed ? 'sube' : 'baja'}
        />
        <Cifra etiqueta="Servidor" valor={hayConexion ? 'Listo' : 'Pendiente'} origen="Claves de /config/.env.local" />
        <Cifra etiqueta="Toque mínimo" valor="44 px" origen="Mínimo en toda la app" />
      </section>

      {!hayConexion && (
        <Aviso nivel="importante" titulo="Todavía no hay servidor conectado">
          Es lo previsto: primero se construye y al final se conectan Supabase, Stripe y las APIs. Mientras tanto los
          apuntes se guardan en el móvil y se quedan esperando en la cola.
        </Aviso>
      )}

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Tarjeta
          titulo="Sin cobertura"
          acciones={
            <Boton tamano="pequeno" tono="discreto" onClick={() => void subirAhora()} cargando={sincronizando}>
              <RefreshCw className="size-4" aria-hidden />
              Subir ahora
            </Boton>
          }
        >
          <p className="text-sm text-tinta-suave">
            Apunta una merma, quita la cobertura del móvil y apunta otra. Las dos se guardan igual. Al volver la red,
            suben solas y en orden.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Boton onClick={() => setHojaAbierta(true)}>
              <Trash2 className="size-4" aria-hidden />
              Apuntar merma
            </Boton>
            <Boton
              tono="discreto"
              onClick={() =>
                void encolar('appcc_registros', {
                  punto: 'Cámara de pescado',
                  valor: 3.4,
                  registrado_en: new Date().toISOString(),
                }).then(refrescar)
              }
            >
              <Thermometer className="size-4" aria-hidden />
              Registrar temperatura
            </Boton>
          </div>
          {guardado && (
            <div className="mt-3">
              <Aviso nivel="hecho" titulo="Merma apuntada">
                {guardado}. {conRed ? 'Subiendo al servidor.' : 'Se subirá en cuanto vuelva la cobertura.'}
              </Aviso>
            </div>
          )}
        </Tarjeta>

        <Tarjeta titulo="Cola del dispositivo" plegable resumen={`${enCola} esperando`}>
          <Tabla
            columnas={columnas}
            filas={apuntes}
            claveFila={(a) => a.clave}
            vacio={
              <Vacio
                icono={<Package className="size-8" aria-hidden />}
                titulo="Aún no has apuntado nada"
                explicacion="Lo que apuntes aparecerá aquí con su estado: en el móvil o ya en el servidor."
                accion={<Boton onClick={() => setHojaAbierta(true)}>Apuntar merma</Boton>}
              />
            }
          />
        </Tarjeta>
      </div>

      <Hoja
        abierta={hojaAbierta}
        titulo="Apuntar merma"
        descripcion="Tres datos y listo. El motivo es obligatorio: sin motivo no hay análisis."
        onCerrar={() => setHojaAbierta(false)}
        pie={
          <>
            <Boton tono="discreto" onClick={() => setHojaAbierta(false)}>
              Cancelar
            </Boton>
            <Boton onClick={() => void apuntarMerma()}>Apuntar</Boton>
          </>
        }
      >
        <div className="flex flex-col gap-4 pt-1">
          <Campo
            etiqueta="Producto"
            obligatorio
            placeholder="Merluza"
            value={producto}
            onChange={(e) => setProducto(e.target.value)}
          />
          <Campo
            etiqueta="Cantidad"
            obligatorio
            inputMode="decimal"
            placeholder="1,2"
            ayuda="En la unidad de uso del producto."
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
          />
          <Selector etiqueta="Motivo" obligatorio value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            {motivos.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Selector>
        </div>
      </Hoja>
    </div>
  )
}
