import type { ReactNode } from 'react'

export interface Columna<T> {
  clave: string
  titulo: string
  /** En móvil solo se pintan las columnas marcadas como principales; el resto va en la tarjeta. */
  principal?: boolean
  alineada?: 'izquierda' | 'derecha'
  celda: (fila: T) => ReactNode
}

/**
 * Tabla en ordenador, tarjetas en móvil. Nunca hay desbordamiento lateral.
 * En pantallas anchas enseña más columnas en vez de estirarse.
 */
export function Tabla<T>({
  columnas,
  filas,
  claveFila,
  onAbrir,
  vacio,
}: {
  columnas: Columna<T>[]
  filas: T[]
  claveFila: (fila: T) => string
  onAbrir?: (fila: T) => void
  vacio?: ReactNode
}) {
  if (filas.length === 0 && vacio) return <>{vacio}</>

  const principales = columnas.filter((c) => c.principal !== false)

  return (
    <>
      {/* Ordenador */}
      <div className="hidden overflow-hidden rounded-lg border border-borde bg-lienzo md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-borde bg-panel">
              {columnas.map((c) => (
                <th
                  key={c.clave}
                  scope="col"
                  className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-tinta-tenue ${
                    c.alineada === 'derecha' ? 'text-right' : 'text-left'
                  }`}
                >
                  {c.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr
                key={claveFila(fila)}
                onClick={onAbrir ? () => onAbrir(fila) : undefined}
                className={`border-b border-borde last:border-0 ${onAbrir ? 'cursor-pointer hover:bg-naranja-suave/60' : ''}`}
              >
                {columnas.map((c) => (
                  <td
                    key={c.clave}
                    className={`px-3 py-2.5 align-middle ${c.alineada === 'derecha' ? 'cifras text-right' : ''}`}
                  >
                    {c.celda(fila)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Móvil */}
      <ul className="flex flex-col gap-2 md:hidden">
        {filas.map((fila) => (
          <li key={claveFila(fila)}>
            <button
              type="button"
              onClick={onAbrir ? () => onAbrir(fila) : undefined}
              className="w-full rounded-lg border border-borde bg-lienzo p-3 text-left shadow-tarjeta active:bg-panel"
            >
              {principales.map((c, i) => (
                <div key={c.clave} className={i === 0 ? '' : 'mt-1 flex items-baseline justify-between gap-3'}>
                  {i === 0 ? (
                    <span className="block font-semibold">{c.celda(fila)}</span>
                  ) : (
                    <>
                      <span className="text-xs uppercase tracking-wide text-tinta-tenue">{c.titulo}</span>
                      <span className="cifras text-sm">{c.celda(fila)}</span>
                    </>
                  )}
                </div>
              ))}
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
