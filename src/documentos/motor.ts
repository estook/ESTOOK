import jsPDF from 'jspdf'
import autoTable, { type RowInput, type UserOptions } from 'jspdf-autotable'

/**
 * Motor de documentos.
 *
 * Todo documento de Estook sale igual por fuera: cabecera con la marca del
 * local, cuerpo propio de cada plantilla y pie con la fecha, quién lo generó y
 * la numeración. Lo que cambia es el cuerpo, y cada plantilla está pensada para
 * lo suyo — un horario se presenta como una cuadrícula, no como un texto.
 */

export interface Marca {
  local: string
  direccion?: string | null
  cif?: string | null
  telefono?: string | null
  logoUrl?: string | null       // logo del local, en base64 o URL
  color: string                 // #RRGGBB — el de la marca o el que elija
}

export interface Contexto {
  generadoPor?: string
  periodo?: string
}

export type Orientacion = 'vertical' | 'apaisado'

const GRIS_TEXTO: RGB = [60, 74, 78]
const GRIS_TENUE: RGB = [130, 142, 145]
const GRIS_LINEA: RGB = [226, 231, 231]
const GRIS_FONDO: RGB = [245, 247, 247]

type RGB = [number, number, number]

export function aRgb(hex: string): RGB {
  const limpio = hex.replace('#', '')
  const n = parseInt(limpio.length === 3 ? limpio.split('').map((c) => c + c).join('') : limpio, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Un color legible para poner texto encima: negro sobre claro, blanco sobre oscuro. */
export function textoSobre(color: RGB): RGB {
  const luz = (0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2]) / 255
  return luz > 0.62 ? [17, 28, 31] : [255, 255, 255]
}

/** Aclara un color para usarlo de fondo suave. */
export function aclarar(color: RGB, cantidad = 0.88): RGB {
  return color.map((c) => Math.round(c + (255 - c) * cantidad)) as RGB
}

export interface Documento {
  doc: jsPDF
  ancho: number
  alto: number
  margen: number
  color: RGB
  y: number
}

export async function nuevoDocumento(
  marca: Marca,
  titulo: string,
  subtitulo: string | undefined,
  orientacion: Orientacion = 'vertical',
): Promise<Documento> {
  const doc = new jsPDF({ orientation: orientacion === 'apaisado' ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' })
  const ancho = doc.internal.pageSize.getWidth()
  const alto = doc.internal.pageSize.getHeight()
  const margen = 14
  const color = aRgb(marca.color)

  // Banda superior con el color del local
  doc.setFillColor(...color)
  doc.rect(0, 0, ancho, 3, 'F')

  let y = margen + 4

  // Logo del local, si lo hay
  let xTexto = margen
  if (marca.logoUrl) {
    try {
      const datos = await comoBase64(marca.logoUrl)
      const alturaLogo = 14
      const anchoLogo = await anchoProporcional(datos, alturaLogo)
      doc.addImage(datos, 'PNG', margen, y - 3, anchoLogo, alturaLogo, undefined, 'FAST')
      xTexto = margen + anchoLogo + 5
    } catch {
      // Si el logo falla, el documento sale igual: nunca se queda a medias por una imagen.
    }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(17, 28, 31)
  doc.text(marca.local, xTexto, y + 3)

  const señas = [marca.direccion, marca.telefono, marca.cif ? `CIF ${marca.cif}` : null]
    .filter(Boolean).join(' · ')
  if (señas) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...GRIS_TENUE)
    doc.text(señas, xTexto, y + 8)
  }

  // Título del documento, a la derecha
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...color)
  doc.text(titulo.toUpperCase(), ancho - margen, y + 3, { align: 'right' })
  if (subtitulo) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...GRIS_TEXTO)
    doc.text(subtitulo, ancho - margen, y + 8.5, { align: 'right' })
  }

  y += 14
  doc.setDrawColor(...GRIS_LINEA)
  doc.setLineWidth(0.3)
  doc.line(margen, y, ancho - margen, y)
  y += 8

  return { doc, ancho, alto, margen, color, y }
}

/** Pie de todas las páginas: fecha, quién y numeración. Se llama al final. */
export function cerrarDocumento(d: Documento, marca: Marca, ctx: Contexto = {}) {
  const paginas = d.doc.getNumberOfPages()
  const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  for (let i = 1; i <= paginas; i++) {
    d.doc.setPage(i)
    d.doc.setDrawColor(...GRIS_LINEA)
    d.doc.setLineWidth(0.2)
    d.doc.line(d.margen, d.alto - 12, d.ancho - d.margen, d.alto - 12)
    d.doc.setFont('helvetica', 'normal')
    d.doc.setFontSize(7.5)
    d.doc.setTextColor(...GRIS_TENUE)
    const izquierda = [marca.local, `Generado el ${fecha}`, ctx.generadoPor ? `por ${ctx.generadoPor}` : null]
      .filter(Boolean).join(' · ')
    d.doc.text(izquierda, d.margen, d.alto - 7.5)
    d.doc.text(`Página ${i} de ${paginas}`, d.ancho - d.margen, d.alto - 7.5, { align: 'right' })
  }
}

/** Tabla con el aspecto de la casa: cabecera en el color del local, filas alternas. */
export function tabla(d: Documento, opciones: UserOptions) {
  const textoCabecera = textoSobre(d.color)
  autoTable(d.doc, {
    startY: d.y,
    margin: { left: d.margen, right: d.margen, bottom: 18 },
    theme: 'grid',
    styles: {
      font: 'helvetica', fontSize: 9, cellPadding: 2.6,
      lineColor: GRIS_LINEA, lineWidth: 0.2, textColor: [17, 28, 31],
      overflow: 'linebreak', valign: 'middle',
    },
    headStyles: {
      fillColor: d.color, textColor: textoCabecera, fontStyle: 'bold',
      fontSize: 8.5, halign: 'center', valign: 'middle', cellPadding: 3,
    },
    alternateRowStyles: { fillColor: GRIS_FONDO },
    ...opciones,
    didDrawPage: (datos) => {
      d.y = datos.cursor?.y ?? d.y
    },
  })
  d.y = (d.doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
}

/** Un rótulo de sección, para separar bloques dentro de un documento. */
export function seccion(d: Documento, texto: string) {
  if (d.y > d.alto - 40) { d.doc.addPage(); d.y = d.margen + 8 }
  d.doc.setFillColor(...aclarar(d.color))
  d.doc.roundedRect(d.margen, d.y - 4.5, d.ancho - d.margen * 2, 8, 1.2, 1.2, 'F')
  d.doc.setFont('helvetica', 'bold')
  d.doc.setFontSize(9)
  d.doc.setTextColor(...d.color)
  d.doc.text(texto.toUpperCase(), d.margen + 3, d.y + 1)
  d.y += 9
}

/** Fila de cifras destacadas, para resúmenes. */
export function cifras(d: Documento, datos: { etiqueta: string; valor: string }[]) {
  const hueco = 3
  const anchoCaja = (d.ancho - d.margen * 2 - hueco * (datos.length - 1)) / datos.length
  datos.forEach((c, i) => {
    const x = d.margen + i * (anchoCaja + hueco)
    d.doc.setFillColor(...GRIS_FONDO)
    d.doc.setDrawColor(...GRIS_LINEA)
    d.doc.roundedRect(x, d.y, anchoCaja, 18, 1.5, 1.5, 'FD')
    d.doc.setFont('helvetica', 'normal')
    d.doc.setFontSize(7)
    d.doc.setTextColor(...GRIS_TENUE)
    d.doc.text(c.etiqueta.toUpperCase(), x + 3, d.y + 6)
    d.doc.setFont('helvetica', 'bold')
    d.doc.setFontSize(13)
    d.doc.setTextColor(17, 28, 31)
    d.doc.text(c.valor, x + 3, d.y + 14)
  })
  d.y += 24
}

export function parrafo(d: Documento, texto: string, tono: 'normal' | 'tenue' = 'normal') {
  d.doc.setFont('helvetica', 'normal')
  d.doc.setFontSize(9)
  d.doc.setTextColor(...(tono === 'tenue' ? GRIS_TENUE : GRIS_TEXTO))
  const lineas = d.doc.splitTextToSize(texto, d.ancho - d.margen * 2)
  d.doc.text(lineas, d.margen, d.y)
  d.y += lineas.length * 4.4 + 4
}

/** Aviso destacado dentro del documento (por ejemplo, un valor fuera de rango). */
export function nota(d: Documento, texto: string, color: RGB = [200, 50, 42]) {
  const alto = 10
  d.doc.setFillColor(...aclarar(color, 0.9))
  d.doc.setDrawColor(...color)
  d.doc.setLineWidth(0.3)
  d.doc.roundedRect(d.margen, d.y - 4, d.ancho - d.margen * 2, alto, 1.5, 1.5, 'FD')
  d.doc.setFont('helvetica', 'bold')
  d.doc.setFontSize(8.5)
  d.doc.setTextColor(...color)
  d.doc.text(texto, d.margen + 3, d.y + 2)
  d.y += alto + 4
}

export type Fila = RowInput

// ---------- Utilidades de imagen ----------

async function comoBase64(url: string): Promise<string> {
  if (url.startsWith('data:')) return url
  const r = await fetch(url)
  const blob = await r.blob()
  return new Promise((res, rej) => {
    const lector = new FileReader()
    lector.onload = () => res(lector.result as string)
    lector.onerror = rej
    lector.readAsDataURL(blob)
  })
}

async function anchoProporcional(base64: string, alturaMm: number): Promise<number> {
  return new Promise((res) => {
    const img = new Image()
    img.onload = () => res(Math.min(45, (img.width / img.height) * alturaMm))
    img.onerror = () => res(alturaMm)
    img.src = base64
  })
}

/** Descarga el PDF con un nombre limpio. */
export function descargar(d: Documento, nombre: string) {
  const limpio = nombre
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '-').toLowerCase()
  d.doc.save(`${limpio}.pdf`)
}

/** Abre el diálogo de impresión con el documento ya cargado. */
export function imprimir(d: Documento) {
  d.doc.autoPrint()
  const url = d.doc.output('bloburl')
  window.open(url, '_blank')
}

/** Comparte el PDF (móvil) o lo descarga si el dispositivo no sabe compartir. */
export async function compartir(d: Documento, nombre: string) {
  const blob = d.doc.output('blob')
  const archivo = new File([blob], `${nombre}.pdf`, { type: 'application/pdf' })
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean }
  if (nav.canShare?.({ files: [archivo] })) {
    await navigator.share({ files: [archivo], title: nombre })
  } else {
    descargar(d, nombre)
  }
}
