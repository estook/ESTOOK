/**
 * En hostelería se compra y se cuenta en kilos, litros y unidades. Los gramos
 * y mililitros solo aparecen dentro de una ficha técnica, al racionar.
 *
 * Por dentro Estook guarda todo en la unidad pequeña (g, ml, ud) para que los
 * escandallos salgan exactos. De cara al usuario se enseña siempre en grande.
 */

export type UnidadPequena = 'g' | 'ml' | 'ud'
export type UnidadGrande = 'kg' | 'l' | 'ud'

export const GRANDE: Record<UnidadPequena, UnidadGrande> = { g: 'kg', ml: 'l', ud: 'ud' }
export const PEQUENA: Record<UnidadGrande, UnidadPequena> = { kg: 'g', l: 'ml', ud: 'ud' }
const FACTOR: Record<UnidadPequena, number> = { g: 1000, ml: 1000, ud: 1 }

export const aGrande = (valor: number, unidad: UnidadPequena) => valor / FACTOR[unidad]
export const aPequena = (valor: number, unidad: UnidadPequena) => valor * FACTOR[unidad]

const numero = (n: number, decimales = 2) =>
  new Intl.NumberFormat('es-ES', { maximumFractionDigits: decimales }).format(n)

/** «4,2 kg», «3 l», «12 ud» — lo que entiende cualquiera en una cocina. */
export function mostrar(valorPequeno: number, unidad: UnidadPequena, decimales = 2) {
  const g = GRANDE[unidad]
  return `${numero(aGrande(valorPequeno, unidad), decimales)} ${g}`
}

/** Formatos de compra habituales. El nombre es lo que se ve; lo demás se calcula. */
export const FORMATOS = [
  { clave: 'caja', nombre: 'Caja' },
  { clave: 'saco', nombre: 'Saco' },
  { clave: 'garrafa', nombre: 'Garrafa' },
  { clave: 'bandeja', nombre: 'Bandeja' },
  { clave: 'bolsa', nombre: 'Bolsa' },
  { clave: 'lata', nombre: 'Lata' },
  { clave: 'botella', nombre: 'Botella' },
  { clave: 'pieza', nombre: 'Pieza suelta' },
  { clave: 'granel', nombre: 'A granel (por kilo o litro)' },
] as const

/** Cuánto se aprovecha después de limpiar, en lenguaje de cocina. */
export const MERMAS_HABITUALES = [
  { texto: 'Entra tal cual', rendimiento: 1 },
  { texto: 'Se limpia un poco (10 %)', rendimiento: 0.9 },
  { texto: 'Se limpia bastante (30 %)', rendimiento: 0.7 },
  { texto: 'Pescado entero (50 %)', rendimiento: 0.5 },
] as const

/**
 * Texto que resume la compra en una línea, para enseñarlo mientras se rellena
 * el formulario: «1 caja = 3 kg · 42,00 € → 14,00 €/kg comprado · 20,59 €/kg útil».
 */
export function resumenDeCompra({
  formato, contenido, unidad, precio, rendimiento,
}: {
  formato: string
  contenido: number
  unidad: UnidadGrande
  precio: number | null
  rendimiento: number
}) {
  if (!contenido) return null
  const partes = [`1 ${formato.toLowerCase()} = ${numero(contenido)} ${unidad}`]
  if (precio && precio > 0) {
    partes.push(`${numero(precio)} €`)
    const porUnidad = precio / contenido
    partes.push(`${numero(porUnidad)} €/${unidad} comprado`)
    if (rendimiento > 0 && rendimiento < 1) {
      partes.push(`${numero(porUnidad / rendimiento)} €/${unidad} útil`)
    }
  }
  return partes.join(' · ')
}
