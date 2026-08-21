import type { ReactNode } from 'react'
import { CaraFogon } from '@/marca/Logo'

/**
 * Mockups de la app para la landing. Reproducen pantallas reales de Estook con
 * los mismos componentes visuales, a escala pequeña. No se puede interactuar
 * con ellos: son una foto, no la app.
 */

export function Telefono({ children, etiqueta }: { children: ReactNode; etiqueta?: string }) {
  return (
    <div className="pointer-events-none relative mx-auto w-[248px] select-none">
      <div className="rounded-[30px] border-[7px] border-tinta bg-tinta text-tinta shadow-[0_24px_60px_-20px_rgba(17,28,31,0.45)]">
        <div className="relative overflow-hidden rounded-[23px] bg-panel">
          <div className="flex h-7 items-center justify-between bg-lienzo px-3 text-[8px] font-semibold text-tinta-tenue">
            <span>9:41</span>
            <span className="h-3.5 w-14 rounded-b-xl bg-tinta" />
            <span>100 %</span>
          </div>
          <div className="h-[404px] overflow-hidden bg-panel text-tinta">{children}</div>
          <div className="flex h-11 items-center justify-around border-t border-borde bg-lienzo">
            <span className="text-[8px] font-bold uppercase tracking-wide text-naranja">Panel</span>
            <span className="-mt-5 grid size-10 place-items-center rounded-full bg-naranja text-white shadow-flotante">
              <span className="grid grid-cols-2 gap-0.5">
                {[0, 1, 2, 3].map((i) => <span key={i} className="size-1.5 rounded-[2px] bg-white" />)}
              </span>
            </span>
            <span className="text-[8px] font-bold uppercase tracking-wide text-tinta-tenue">Ajustes</span>
          </div>
        </div>
      </div>
      {etiqueta && (
        <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-tinta-tenue">
          {etiqueta}
        </p>
      )}
    </div>
  )
}

const Barra = ({ titulo, accion }: { titulo: string; accion?: string }) => (
  <div className="flex items-center justify-between border-b border-borde bg-lienzo px-3 py-2">
    <span className="font-titulo text-[10px] font-bold uppercase tracking-wide">{titulo}</span>
    {accion && (
      <span className="rounded bg-naranja px-1.5 py-0.5 text-[8px] font-bold text-white">{accion}</span>
    )}
  </div>
)

const Fila = ({ a, b, tono }: { a: string; b: string; tono?: 'ok' | 'alerta' | 'aviso' }) => (
  <div className="flex items-center justify-between border-b border-borde px-3 py-2 last:border-0">
    <span className="truncate text-[10px] font-medium">{a}</span>
    <span className={`shrink-0 text-[10px] font-semibold ${
      tono === 'alerta' ? 'text-alerta' : tono === 'ok' ? 'text-ok' : tono === 'aviso' ? 'text-aviso' : 'text-tinta-tenue'
    }`}>{b}</span>
  </div>
)

// ---------- Panel ----------
export function MockPanel() {
  return (
    <Telefono>
      <div className="bg-lienzo px-3 py-2.5">
        <p className="font-titulo text-sm font-semibold">Buenas tardes, Marta</p>
        <p className="text-[9px] text-tinta-tenue">Jueves, 12 de junio · Casa Marta</p>
      </div>

      <div className="mx-3 mt-2 flex items-center justify-between rounded-lg bg-ok px-3 py-2.5 text-white">
        <span>
          <span className="block text-[11px] font-bold">Abrir el restaurante</span>
          <span className="block text-[8px] opacity-80">Empieza la jornada</span>
        </span>
        <span className="text-sm">›</span>
      </div>

      <p className="mt-3 px-3 text-[9px] font-bold uppercase tracking-wide">
        <span className="mr-1.5 inline-block size-1.5 rounded-full bg-alerta align-middle" />
        3 cosas necesitan atención
      </p>

      <div className="mt-1.5 flex flex-col gap-1.5 px-3">
        {[
          ['El rabo de toro está al 2 % de margen', 'Sus ingredientes han subido un 14 % desde marzo.'],
          ['Merluza por debajo del mínimo', 'Quedan 2,1 kg de los 5 kg que fijaste.'],
          ['Faltan 2 controles de APPCC', 'Cámara de pescado y congelador.'],
        ].map(([t, s]) => (
          <div key={t} className="rounded-lg border border-borde bg-lienzo p-2">
            <div className="flex gap-2">
              <CaraFogon className="size-5" />
              <div className="min-w-0">
                <p className="text-[9.5px] font-semibold leading-tight">{t}</p>
                <p className="mt-0.5 text-[8px] leading-tight text-tinta-tenue">{s}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Telefono>
  )
}

// ---------- Inventario ----------
export function MockInventario() {
  return (
    <Telefono>
      <Barra titulo="Inventario · Productos" accion="PDF" />
      <div className="bg-lienzo">
        <Fila a="Pulpo cocido" b="4,2 kg" />
        <Fila a="Merluza" b="hay que pedir" tono="alerta" />
        <Fila a="Patata" b="15 kg" />
        <Fila a="Aceite de oliva" b="3,2 l" />
        <Fila a="Pimentón" b="sin precio" tono="aviso" />
      </div>

      <div className="m-3 rounded-lg border border-borde bg-lienzo p-2.5">
        <p className="text-[8px] font-bold uppercase tracking-wide text-tinta-tenue">Merluza</p>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          <div className="rounded border border-borde bg-panel p-1.5">
            <p className="text-[7px] uppercase text-tinta-tenue">Compra</p>
            <p className="text-[9.5px] font-semibold">caja 5 kg · 42 €</p>
          </div>
          <div className="rounded border border-borde bg-panel p-1.5">
            <p className="text-[7px] uppercase text-tinta-tenue">Coste útil</p>
            <p className="text-[9.5px] font-semibold text-naranja-oscuro">12,35 €/kg</p>
          </div>
        </div>
        <p className="mt-1.5 text-[8px] leading-tight text-tinta-tenue">
          Se limpia un 32 %: por eso el kilo que llega a la mesa cuesta más que el que compras.
        </p>
      </div>
    </Telefono>
  )
}

// ---------- Escandallo ----------
export function MockEscandallo() {
  return (
    <Telefono>
      <Barra titulo="Cocina · Pulpo a la brasa" accion="PDF" />
      <div className="grid grid-cols-2 gap-1.5 p-3">
        {[['Coste', '4,182 €'], ['Precio', '19,50 €'], ['Base sin IVA', '17,73 €'], ['Margen', '76,4 %']].map(([t, v], i) => (
          <div key={t} className="rounded-lg border border-borde bg-panel p-2">
            <p className="text-[7px] font-bold uppercase tracking-wide text-tinta-tenue">{t}</p>
            <p className={`text-[12px] font-semibold ${i === 3 ? 'text-ok' : ''}`}>{v}</p>
          </div>
        ))}
      </div>
      <div className="mx-3 rounded-lg border border-borde bg-lienzo">
        <Fila a="Pulpo cocido · 180 g" b="3,20 €" />
        <Fila a="Patata · 120 g" b="0,08 €" />
        <Fila a="Aceite de oliva · 15 ml" b="0,12 €" />
        <Fila a="Pimentón · 2 g" b="0,04 €" />
      </div>
      <p className="mt-2 px-3 text-[8px] leading-tight text-tinta-tenue">
        El cocinero abre la misma ficha y ve gramajes, pasos y fotos. Sin un solo importe.
      </p>
    </Telefono>
  )
}

// ---------- Cuadrante ----------
export function MockCuadrante() {
  return (
    <Telefono>
      <Barra titulo="Equipo · Semana del 17" accion="PDF" />
      <div className="bg-lienzo">
        <Fila a="Luis · jueves" b="12-16 · 20-23" />
        <Fila a="Ana · jueves" b="8-16" />
        <Fila a="Iván · jueves" b="sin cubrir" tono="alerta" />
        <Fila a="Marta · viernes" b="18-00" />
      </div>
      <div className="m-3 rounded-lg border border-borde bg-lienzo p-2.5">
        <p className="text-[9.5px] font-semibold">Al publicar, cada uno recibe el suyo</p>
        <p className="mt-1 text-[8px] leading-tight text-tinta-tenue">
          «Semana del 17 al 23: lunes 8-16, jueves partido 12-16 y 20-23. 38 horas.»
        </p>
      </div>
      <div className="mx-3 rounded-lg border border-aviso/30 bg-aviso-suave p-2.5">
        <p className="text-[8.5px] font-semibold">Descanso menor de 12 h entre jornadas</p>
      </div>
    </Telefono>
  )
}

// ---------- APPCC ----------
export function MockAppcc() {
  return (
    <Telefono>
      <Barra titulo="Servicio · APPCC" accion="PDF" />
      <div className="bg-lienzo">
        <Fila a="Cámara de pescado" b="2,8 °C" tono="ok" />
        <Fila a="Cámara de carne" b="3,1 °C" tono="ok" />
        <Fila a="Congelador" b="−19 °C" tono="ok" />
        <Fila a="Aceite de freidora" b="pendiente" tono="aviso" />
        <Fila a="Limpieza de cocina" b="pendiente" tono="aviso" />
      </div>
      <div className="m-3 rounded-lg border border-alerta/30 bg-alerta-suave p-2.5">
        <p className="text-[9px] font-semibold">Valor fuera de rango</p>
        <p className="mt-0.5 text-[8px] leading-tight text-tinta-suave">
          No se puede continuar sin registrar la acción correctiva.
        </p>
      </div>
      <p className="px-3 text-[8px] leading-tight text-tinta-tenue">
        Firmado con PIN. La carpeta de inspección sale en un toque.
      </p>
    </Telefono>
  )
}

// ---------- Competencia ----------
export function MockCompetencia() {
  return (
    <Telefono>
      <Barra titulo="Competencia · tu zona" />
      <div className="bg-lienzo">
        <Fila a="Casa Manolo · 180 m" b="14,50 € · 4,3" />
        <Fila a="La Tasca · 340 m" b="13,00 € · 4,6" />
        <Fila a="Sushi Kai · 520 m" b="18,90 € · 4,1" />
        <Fila a="Tu local" b="13,00 € · 4,7" tono="ok" />
      </div>
      <div className="m-3 rounded-lg border border-borde bg-lienzo p-2.5">
        <div className="flex gap-2">
          <CaraFogon className="size-5" />
          <div>
            <p className="text-[9.5px] font-semibold leading-tight">
              Tu menú está 1,50 € por debajo de la media
            </p>
            <p className="mt-0.5 text-[8px] leading-tight text-tinta-tenue">
              Y tu valoración es la más alta de la calle: hay margen para revisarlo.
            </p>
          </div>
        </div>
      </div>
    </Telefono>
  )
}

export const PANTALLAS = [
  {
    clave: 'panel',
    nombre: 'Panel',
    titulo: 'Lo primero que ves es lo que hay que resolver',
    texto: 'Al entrar, la aplicación no muestra menús: muestra las tres o cuatro cosas que requieren una decisión hoy, cada una con su acción directa. Debajo, las cifras del día y el asistente. Cada persona ve lo que le corresponde según su puesto.',
    detalles: [
      ['Abrir y cerrar el día', 'Un botón para iniciar la jornada y otro para cerrar caja, con confirmación. Quien no gestiona ve en su lugar el botón de fichaje.'],
      ['Avisos con acción', 'Cada tarjeta lleva la acción que resuelve el problema, un cierre y un «ahora no» que la devuelve en siete días.'],
      ['Acción rápida', 'Un botón permanente con las seis operaciones más frecuentes, filtradas por rol.'],
    ],
    mock: MockPanel,
  },
  {
    clave: 'inventario',
    nombre: 'Inventario',
    titulo: 'El coste real, no el precio del envase',
    texto: 'Una caja de merluza de 5 kg a 42 € no cuesta 8,40 €/kg: cuesta 12,35 €/kg una vez limpia. Estook calcula el coste de la unidad aprovechable a partir del formato de compra y la merma, y con ese número trabaja el resto de la aplicación.',
    detalles: [
      ['Alta guiada', 'Seis preguntas encadenadas, adaptadas a cómo te sirve cada proveedor: a peso, en envase cerrado o por unidades.'],
      ['Proveedores y pedidos', 'Días de reparto, pedido mínimo y contacto. Los pedidos se escriben libremente, se envían por WhatsApp y al recibirlos entra el género.'],
      ['Existencias corregibles', 'La cifra que dice el responsable manda; el ajuste queda registrado con su nombre y la fecha.'],
    ],
    mock: MockInventario,
  },
  {
    clave: 'cocina',
    nombre: 'Cocina',
    titulo: 'Cada plato, con su coste y su margen',
    texto: 'La ficha técnica reúne ingredientes, gramajes, elaboración y coste por línea. De ahí sale el margen real de la carta y el precio recomendado para el objetivo que te hayas fijado.',
    detalles: [
      ['Dos caras de la misma ficha', 'La versión de jefatura incluye costes y margen; la de cocina, gramajes, pasos y fotos, sin ningún importe.'],
      ['Carta con análisis', 'Cada plato queda clasificado según lo que deja y lo que se vende, con la recomendación correspondiente.'],
      ['Recálculo automático', 'Si sube el precio de un ingrediente, el margen de todos los platos que lo llevan se actualiza sin intervención.'],
    ],
    mock: MockEscandallo,
  },
  {
    clave: 'equipo',
    nombre: 'Equipo',
    titulo: 'Turnos partidos y horas, sin hojas de cálculo',
    texto: 'El cuadrante admite varios tramos por día y se publica cuando está cerrado. Al publicarlo, cada persona recibe únicamente su horario; si después cambia algo, solo se notifica al afectado y con el detalle de qué cambia.',
    detalles: [
      ['Avisos de cumplimiento', 'Descansos inferiores a doce horas, exceso de jornada semanal y turnos sin cubrir.'],
      ['Fichaje', 'Un botón con el reloj en marcha. Cada persona ve sus horas; la información salarial no aparece en ninguna pantalla.'],
      ['Documentos', 'Cuadrante semanal para imprimir y horario individual para enviar.'],
    ],
    mock: MockCuadrante,
  },
  {
    clave: 'servicio',
    nombre: 'Servicio',
    titulo: 'Los registros sanitarios, resueltos a diario',
    texto: 'El plan de control se define una vez y el equipo lo cumplimenta en dos toques, firmando con su PIN. Un valor fuera de rango no permite continuar sin registrar la acción correctiva.',
    detalles: [
      ['Carpeta de inspección', 'Todos los partes del periodo en un único documento, con los puntos no registrados señalados.'],
      ['Cierre de caja', 'Cuatro pasos: origen de las ventas, mermas, controles pendientes y firma.'],
      ['Trazabilidad', 'Cada registro guarda hora, responsable y valor. No se puede modificar después.'],
    ],
    mock: MockAppcc,
  },
  {
    clave: 'competencia',
    nombre: 'Competencia',
    titulo: 'Tu posición en la zona, con datos',
    texto: 'Precio del menú, valoración y número de reseñas de los establecimientos de tu entorno, con tu posición relativa. La información se actualiza periódicamente y el análisis se recalcula varias veces al día.',
    detalles: [
      ['Comparativa de precios', 'Precio medio de la zona y variación semanal, para decidir una revisión de tarifas con criterio.'],
      ['Reseñas', 'Opiniones agrupadas por tema, detección de caídas de valoración y respuesta propuesta en el tono del local.'],
      ['Sin datos personales', 'Solo se almacena información pública y agregada, con la fecha de consulta.'],
    ],
    mock: MockCompetencia,
  },
] as const
