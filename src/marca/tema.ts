/**
 * Tema del local.
 *
 * El color que el gerente elige en Ajustes no es solo el de los documentos:
 * tiñe la app entera. Se aplica escribiendo las variables CSS que usa Tailwind,
 * así que no hay que tocar ni una clase.
 */

function aRgb(hex: string): [number, number, number] {
  const limpio = hex.replace('#', '')
  const largo = limpio.length === 3 ? limpio.split('').map((c) => c + c).join('') : limpio
  const n = parseInt(largo, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const oscurecer = (c: [number, number, number], f = 0.88): [number, number, number] =>
  c.map((v) => Math.round(v * f)) as [number, number, number]

const aclarar = (c: [number, number, number], f = 0.9): [number, number, number] =>
  c.map((v) => Math.round(v + (255 - v) * f)) as [number, number, number]

/** Un texto legible encima del color: se usa para saber si el color es claro. */
export function esClaro(hex: string) {
  const [r, g, b] = aRgb(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62
}

export function aplicarTema(hex?: string | null) {
  const raiz = document.documentElement
  if (!hex || !/^#[0-9a-fA-F]{3,6}$/.test(hex)) {
    raiz.style.removeProperty('--marca')
    raiz.style.removeProperty('--marca-oscuro')
    raiz.style.removeProperty('--marca-suave')
    raiz.style.removeProperty('--color-local')
    return
  }
  const base = aRgb(hex)
  raiz.style.setProperty('--marca', base.join(' '))
  raiz.style.setProperty('--marca-oscuro', oscurecer(base).join(' '))
  raiz.style.setProperty('--marca-suave', aclarar(base).join(' '))
  raiz.style.setProperty('--color-local', hex)

  // La barra del navegador en el móvil también se tiñe
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hex)
}
