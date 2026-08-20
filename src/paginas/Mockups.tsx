import type { ReactNode } from 'react'

/** Marco de móvil. Lo de dentro no se toca: es una foto de la app, no la app. */
function Movil({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none mx-auto w-[300px] select-none rounded-[28px] border-[6px] border-tinta bg-lienzo p-0 shadow-tarjeta">
      <div className="flex h-6 items-center justify-center rounded-t-[20px] bg-tinta">
        <span className="h-1 w-16 rounded-full bg-white/30" />
      </div>
      <div className="h-[480px] overflow-hidden bg-panel">{children}</div>
      <div className="flex h-12 items-center justify-around rounded-b-[20px] border-t border-borde bg-lienzo">
        <span className="text-[10px] font-bold uppercase tracking-wide text-tinta-tenue">Panel</span>
        <span className="grid size-10 place-items-center rounded-full bg-naranja text-lg font-bold text-white">✦</span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-tinta-tenue">Ajustes</span>
      </div>
    </div>
  )
}

const Barra = ({ titulo }: { titulo: string }) => (
  <div className="flex items-center justify-between border-b border-borde bg-lienzo px-3 py-2">
    <span className="font-titulo text-xs font-bold uppercase tracking-wide">{titulo}</span>
    <span className="rounded bg-naranja-suave px-1.5 py-0.5 text-[9px] font-bold text-naranja-oscuro">PDF</span>
  </div>
)

const Fila = ({ a, b, tono }: { a: string; b: string; tono?: 'ok' | 'alerta' | 'aviso' }) => (
  <div className="flex items-center justify-between border-b border-borde px-3 py-2 last:border-0">
    <span className="text-[11px] font-medium text-tinta">{a}</span>
    <span className={`text-[11px] font-semibold ${
      tono === 'alerta' ? 'text-alerta' : tono === 'ok' ? 'text-ok' : tono === 'aviso' ? 'text-aviso' : 'text-tinta-suave'}`}>{b}</span>
  </div>
)

export function MockPanel() {
  return (
    <Movil>
      <div className="bg-lienzo px-3 py-2 text-[11px] font-semibold text-tinta-tenue">Bar Centro · jueves 20</div>
      <div className="grid grid-cols-2 gap-2 p-3">
        {[['VENTAS HOY', '1.284 €', '▲ 8 %'], ['MATERIA PRIMA', '31 %', 'obj. 32 %'],
          ['PERSONAL', '29 %', 'obj. 30 %'], ['PRIME COST', '60 %', '▼ 2 %']].map(([t, v, s]) => (
          <div key={t} className="rounded-lg border border-borde bg-lienzo p-2">
            <p className="text-[8px] font-bold uppercase tracking-wide text-tinta-tenue">{t}</p>
            <p className="font-titulo text-lg font-semibold">{v}</p>
            <p className="text-[9px] font-semibold text-ok">{s}</p>
          </div>
        ))}
      </div>
      <div className="mx-3 rounded-lg border border-borde bg-lienzo">
        <Barra titulo="Avisos de Fogón · 3" />
        <div className="p-3">
          <p className="text-[11px] font-semibold">El rabo de toro te deja un 2 % de margen</p>
          <p className="mt-1 text-[10px] text-tinta-suave">Sus ingredientes han subido un 14 % desde marzo.</p>
          <div className="mt-2 flex gap-1.5">
            <span className="rounded bg-naranja px-2 py-1 text-[9px] font-bold text-white">Subir a 19,50 €</span>
            <span className="rounded border border-borde px-2 py-1 text-[9px] font-bold text-tinta-suave">Ver escandallo</span>
          </div>
        </div>
      </div>
    </Movil>
  )
}

export function MockDespensa() {
  return (
    <Movil>
      <Barra titulo="Despensa · Productos" />
      <div className="bg-lienzo">
        <Fila a="Pulpo cocido" b="4,2 kg" />
        <Fila a="Merluza" b="2,1 kg · bajo mínimo" tono="alerta" />
        <Fila a="Patata" b="15 kg" />
        <Fila a="Aceite oliva" b="3,2 l" />
        <Fila a="Pimentón" b="sin precio" tono="aviso" />
      </div>
      <div className="m-3 rounded-lg border border-borde bg-lienzo p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-tinta-tenue">Merluza</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded border border-borde bg-panel p-2">
            <p className="text-[8px] uppercase text-tinta-tenue">Formato</p>
            <p className="text-[11px] font-semibold">caja 5 kg · 42,00 €</p>
          </div>
          <div className="rounded border border-borde bg-panel p-2">
            <p className="text-[8px] uppercase text-tinta-tenue">Coste real</p>
            <p className="text-[11px] font-semibold">0,0124 €/g</p>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-tinta-suave">Rendimiento 0,68 — se limpia el 32 %.</p>
      </div>
    </Movil>
  )
}

export function MockFicha() {
  return (
    <Movil>
      <Barra titulo="Cocina · Pulpo a la brasa" />
      <div className="h-24 bg-gradient-to-br from-naranja to-naranja-oscuro" />
      <div className="bg-lienzo">
        <Fila a="Pulpo cocido" b="180 g" />
        <Fila a="Patata" b="120 g" />
        <Fila a="Aceite oliva" b="15 ml" />
        <Fila a="Pimentón" b="2 g" />
      </div>
      <div className="m-3 rounded-lg border border-borde bg-lienzo p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-tinta-tenue">Paso 2 de 5</p>
        <p className="mt-1 text-[12px] font-semibold">Marcar a la brasa 3 min por cara</p>
        <p className="mt-1 text-[10px] text-tinta-suave">Brasa fuerte, 220 °C. Sin mover hasta que suelte solo.</p>
      </div>
      <p className="px-3 text-[10px] text-tinta-tenue">
        El cocinero ve esto mismo sin un solo importe.
      </p>
    </Movil>
  )
}

export function MockCuadrante() {
  return (
    <Movil>
      <Barra titulo="Equipo · Semana del 17" />
      <div className="bg-lienzo">
        <Fila a="Luis · jueves" b="12-16 y 20-23 · 7 h" />
        <Fila a="Ana · jueves" b="8-16 · 8 h" />
        <Fila a="Iván · jueves" b="sin cubrir" tono="alerta" />
        <Fila a="Marta · viernes" b="18-00 · 6 h" />
      </div>
      <div className="m-3 rounded-lg border border-borde bg-lienzo p-3">
        <p className="text-[11px] font-semibold">Al publicar, cada uno recibe el suyo</p>
        <p className="mt-1 text-[10px] text-tinta-suave">
          «Semana del 17 al 23: lunes 8-16, jueves partido 12-16 y 20-23. 38 horas.»
        </p>
      </div>
      <div className="mx-3 rounded-lg border border-aviso/30 bg-aviso-suave p-3">
        <p className="text-[10px] font-semibold">Descanso menor de 12 h entre jornadas</p>
      </div>
    </Movil>
  )
}

export function MockCompetencia() {
  return (
    <Movil>
      <Barra titulo="Competencia · tu calle" />
      <div className="bg-lienzo">
        <Fila a="Casa Manolo · 180 m" b="14,50 € · 4,3" />
        <Fila a="La Tasca · 340 m" b="13,00 € · 4,6" />
        <Fila a="Sushi Kai · 520 m" b="18,90 € · 4,1" />
        <Fila a="Tú" b="13,00 € · 4,7" tono="ok" />
      </div>
      <div className="m-3 rounded-lg border border-borde bg-lienzo p-3">
        <p className="text-[11px] font-semibold">Tu menú está 1,50 € por debajo de la media</p>
        <p className="mt-1 text-[10px] text-tinta-suave">
          Y tu valoración es la más alta de la calle: tienes margen para subirlo.
        </p>
      </div>
    </Movil>
  )
}

export const PANTALLAS = [
  {
    clave: 'panel', nombre: 'El Panel',
    titulo: 'Lo primero que ves es cómo va el día',
    texto: 'Ventas, materia prima, personal y prime cost, con su objetivo debajo. Y los avisos de Fogón como tarjetas que se leen, se aplican y se cierran. Nada se apila: cada widget se pliega y enseña su resumen.',
    mock: MockPanel,
  },
  {
    clave: 'despensa', nombre: 'Despensa',
    titulo: 'El coste real, no el precio del envase',
    texto: 'Una caja de merluza de 5 kg a 42 € no cuesta 8,40 €/kg: cuesta 12,35 €/kg después de limpiarla. Estook lo calcula con el formato y el rendimiento, y con eso salen los escandallos.',
    mock: MockDespensa,
  },
  {
    clave: 'cocina', nombre: 'Cocina',
    titulo: 'La ficha que el cocinero mira desde el pase',
    texto: 'Gramajes, pasos con foto, tiempo, temperatura y el truco del jefe. En letra grande y sin un solo importe: los costes son otra cara de la misma ficha, y esa la ves tú.',
    mock: MockFicha,
  },
  {
    clave: 'equipo', nombre: 'Equipo',
    titulo: 'Turnos partidos, y cada uno recibe el suyo',
    texto: 'El cuadrante se monta arrastrando. Al publicarlo, a cada persona le llega su horario al móvil y por correo en PDF. Si cambias algo después, solo se entera el afectado, y con lo que cambia.',
    mock: MockCuadrante,
  },
  {
    clave: 'competencia', nombre: 'Competencia',
    titulo: 'Qué cobran los de tu calle',
    texto: 'Precio del menú, valoración y reseñas de los locales de tu zona, con tu posición al lado. Para subir un precio con datos delante, no por corazonada.',
    mock: MockCompetencia,
  },
] as const
