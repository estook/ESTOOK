import {
  aclarar, aRgb, cerrarDocumento, cifras, Fila, Marca, nota,
  nuevoDocumento, parrafo, seccion, tabla, textoSobre, type Contexto,
} from '@/documentos/motor'
import { costeUnidadUso, type Producto, type Proveedor } from '@/datos/despensa'
import { GRANDE, aGrande } from '@/datos/unidades'
import { escandallo, type Ingrediente, type Plato } from '@/datos/cocina'
import type { PuntoAppcc, RegistroAppcc } from '@/datos/servicio'

const eur = (n: number | null | undefined, dec = 2) =>
  n == null ? '—' : `${n.toFixed(dec).replace('.', ',')} €`
const numero = (n: number, dec = 2) =>
  new Intl.NumberFormat('es-ES', { maximumFractionDigits: dec }).format(n)
const fecha = (d: string | Date) =>
  new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

// ============================================================
// INVENTARIO VALORADO
// ============================================================
export async function inventarioValorado(
  marca: Marca, productos: Producto[], ctx: Contexto = {},
) {
  const d = await nuevoDocumento(marca, 'Inventario valorado', fecha(new Date()))

  const filas: Fila[] = productos.map((p) => {
    const unidad = p.unidad_uso as 'g' | 'ml' | 'ud'
    const coste = costeUnidadUso(p)
    const cantidad = aGrande(p.stock_actual, unidad)
    const valor = coste != null ? coste * p.stock_actual : null
    return [
      p.nombre,
      p.categoria ?? '—',
      `${numero(cantidad)} ${GRANDE[unidad]}`,
      coste != null ? eur(coste * (unidad === 'ud' ? 1 : 1000), 2) : '—',
      valor != null ? eur(valor) : 'sin precio',
    ]
  })

  const total = productos.reduce((s, p) => {
    const c = costeUnidadUso(p)
    return s + (c != null ? c * p.stock_actual : 0)
  }, 0)
  const sinPrecio = productos.filter((p) => p.precio_ultimo == null).length

  cifras(d, [
    { etiqueta: 'Referencias', valor: String(productos.length) },
    { etiqueta: 'Valor total', valor: eur(total) },
    { etiqueta: 'Sin precio', valor: String(sinPrecio) },
  ])

  tabla(d, {
    head: [['Producto', 'Categoría', 'Hay', 'Coste unitario', 'Valor']],
    body: filas,
    columnStyles: {
      0: { cellWidth: 'auto', fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
    },
    foot: [['', '', '', 'TOTAL', eur(total)]],
    footStyles: { fillColor: aclarar(d.color, 0.85), textColor: [17, 28, 31], fontStyle: 'bold', halign: 'right' },
  })

  if (sinPrecio > 0) {
    nota(d, `${sinPrecio} producto(s) sin precio: no suman al valor del inventario.`, [184, 122, 0])
  }

  cerrarDocumento(d, marca, ctx)
  return d
}

// ============================================================
// HOJA DE RECUENTO — para llevarla a la cámara y rellenar a mano
// ============================================================
export async function hojaDeRecuento(marca: Marca, productos: Producto[], ctx: Contexto = {}) {
  const d = await nuevoDocumento(marca, 'Hoja de recuento', fecha(new Date()))
  parrafo(d, 'Se cuenta en la unidad de compra. Apunta lo que haya y firma abajo. La cifra que escribas manda sobre la teórica.', 'tenue')

  const porCategoria = new Map<string, Producto[]>()
  for (const p of productos) {
    const c = p.categoria ?? 'Sin categoría'
    porCategoria.set(c, [...(porCategoria.get(c) ?? []), p])
  }

  for (const [categoria, lista] of [...porCategoria].sort()) {
    seccion(d, categoria)
    tabla(d, {
      head: [['Producto', 'Formato', 'Teórico', 'Contado', 'Diferencia']],
      body: lista.map((p) => [
        p.nombre,
        p.unidad_compra ?? '—',
        `${numero(aGrande(p.stock_actual, p.unidad_uso as 'g' | 'ml' | 'ud'))} ${GRANDE[p.unidad_uso as 'g' | 'ml' | 'ud']}`,
        '', '',
      ]),
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center', textColor: [130, 142, 145] },
        2: { halign: 'right', textColor: [130, 142, 145] },
        3: { cellWidth: 28, fillColor: [255, 255, 255] },
        4: { cellWidth: 28, fillColor: [255, 255, 255] },
      },
    })
  }

  d.doc.setFont('helvetica', 'normal')
  d.doc.setFontSize(8.5)
  d.doc.setTextColor(130, 142, 145)
  d.doc.text('Contado por: ______________________', d.margen, d.y + 6)
  d.doc.text('Fecha y hora: ______________________', d.margen + 90, d.y + 6)

  cerrarDocumento(d, marca, ctx)
  return d
}

// ============================================================
// PEDIDO AL PROVEEDOR
// ============================================================
export async function pedidoAProveedor(
  marca: Marca,
  proveedor: Proveedor,
  lineas: { texto: string; cantidad: string; unidad: string }[],
  extra: { fecha?: string; hora?: string; notas?: string },
  ctx: Contexto = {},
) {
  const d = await nuevoDocumento(marca, 'Pedido', `Para ${proveedor.nombre}`)

  parrafo(d, `Pedido de ${marca.local}${extra.fecha ? ` para el ${fecha(extra.fecha)}` : ''}${extra.hora ? ` sobre las ${extra.hora}` : ''}.`)

  tabla(d, {
    head: [['Cantidad', 'Unidad', 'Producto']],
    body: lineas.map((l) => [l.cantidad || '', l.unidad, l.texto]),
    columnStyles: {
      0: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 26, halign: 'center' },
      2: { cellWidth: 'auto' },
    },
  })

  if (extra.notas) {
    seccion(d, 'Nota para el proveedor')
    parrafo(d, extra.notas)
  }

  seccion(d, 'Datos de entrega')
  tabla(d, {
    body: [
      ['Entregar en', marca.direccion ?? marca.local],
      ['Contacto', marca.telefono ?? '—'],
      ['Día', extra.fecha ? fecha(extra.fecha) : 'Sin concretar'],
      ['Hora', extra.hora || 'Sin concretar'],
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1.8 },
    columnStyles: { 0: { cellWidth: 38, fontStyle: 'bold', textColor: [130, 142, 145] } },
  })

  cerrarDocumento(d, marca, ctx)
  return d
}

// ============================================================
// FICHA TÉCNICA — con costes (jefatura) o sin ellos (para colgar en cocina)
// ============================================================
export async function fichaTecnica(
  marca: Marca,
  plato: Plato,
  ingredientes: Ingrediente[],
  productos: Producto[],
  opciones: { conCostes: boolean },
  ctx: Contexto = {},
) {
  const d = await nuevoDocumento(
    marca, 'Ficha técnica',
    `${plato.nombre}${plato.familia ? ` · ${plato.familia}` : ''} · versión ${plato.version}`,
  )

  const cuentas = escandallo(ingredientes, productos, plato)

  if (opciones.conCostes) {
    cifras(d, [
      { etiqueta: 'Coste del plato', valor: eur(cuentas.costeTotal, 3) },
      { etiqueta: 'Precio con IVA', valor: eur(plato.precio_venta) },
      { etiqueta: 'Base sin IVA', valor: eur(cuentas.base) },
      { etiqueta: 'Margen', valor: cuentas.margen == null ? '—' : `${cuentas.margen.toFixed(1).replace('.', ',')} %` },
    ])
  }

  seccion(d, 'Ingredientes')
  tabla(d, {
    head: opciones.conCostes
      ? [['Ingrediente', 'Cantidad', '%', 'Coste']]
      : [['Ingrediente', 'Cantidad']],
    body: cuentas.lineas.map((l) => {
      const unidad = l.producto?.unidad_uso ?? 'g'
      const peso = cuentas.costeTotal > 0 && l.costeLinea != null
        ? `${((l.costeLinea / cuentas.costeTotal) * 100).toFixed(0)} %` : '—'
      const base = [l.producto?.nombre ?? '—', `${numero(l.ingrediente.cantidad)} ${unidad}`]
      return opciones.conCostes ? [...base, peso, eur(l.costeLinea, 3)] : base
    }),
    columnStyles: opciones.conCostes
      ? { 0: { fontStyle: 'bold' }, 1: { halign: 'right', cellWidth: 30 }, 2: { halign: 'center', cellWidth: 18 }, 3: { halign: 'right', cellWidth: 26 } }
      : { 0: { fontStyle: 'bold' }, 1: { halign: 'right', cellWidth: 40 } },
  })

  if (plato.mise_en_place) { seccion(d, 'Mise en place'); parrafo(d, plato.mise_en_place) }

  const pasos = plato.pasos ?? []
  if (pasos.length) {
    seccion(d, 'Elaboración')
    tabla(d, {
      head: [['#', 'Paso', 'Tiempo', 'Temp.', 'Utensilio']],
      body: pasos.map((p, i) => [
        String(i + 1), p.texto,
        p.minutos ? `${p.minutos} min` : '—',
        p.temperatura ? `${p.temperatura} °C` : '—',
        p.utensilio ?? '—',
      ]),
      columnStyles: {
        0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 30, halign: 'center' },
      },
    })
  }

  if (plato.truco) { seccion(d, 'El truco'); parrafo(d, plato.truco) }
  if (plato.conservacion) { seccion(d, 'Conservación'); parrafo(d, plato.conservacion) }

  const alergenos = plato.alergenos ?? []
  if (alergenos.length) {
    seccion(d, 'Alérgenos')
    parrafo(d, alergenos.join(' · '))
  }

  if (!opciones.conCostes) {
    parrafo(d, 'Ficha para cocina. Los costes y el margen están en la versión de jefatura.', 'tenue')
  }

  cerrarDocumento(d, marca, ctx)
  return d
}

// ============================================================
// CARTA — a dos columnas, pensada para leerse en mesa
// ============================================================
export async function cartaCompleta(
  marca: Marca,
  secciones: { nombre: string; platos: { nombre: string; descripcion?: string | null; precio: number | null }[] }[],
  ctx: Contexto = {},
) {
  const d = await nuevoDocumento(marca, 'Carta', fecha(new Date()))
  const colorTexto = textoSobre(d.color)
  const anchoColumna = (d.ancho - d.margen * 2 - 8) / 2
  let columna = 0
  let yColumna = [d.y, d.y]

  const escribir = (alto: number) => {
    if (yColumna[columna] + alto > d.alto - 20) {
      if (columna === 0) { columna = 1 } else { d.doc.addPage(); columna = 0; yColumna = [d.margen + 8, d.margen + 8] }
    }
  }

  for (const s of secciones) {
    escribir(14)
    const x = d.margen + columna * (anchoColumna + 8)
    d.doc.setFillColor(...d.color)
    d.doc.roundedRect(x, yColumna[columna], anchoColumna, 7.5, 1.2, 1.2, 'F')
    d.doc.setFont('helvetica', 'bold')
    d.doc.setFontSize(9.5)
    d.doc.setTextColor(...colorTexto)
    d.doc.text(s.nombre.toUpperCase(), x + anchoColumna / 2, yColumna[columna] + 5.2, { align: 'center' })
    yColumna[columna] += 12

    for (const p of s.platos) {
      const desc = p.descripcion
        ? d.doc.splitTextToSize(p.descripcion, anchoColumna - 22) as string[]
        : []
      const alto = 6 + desc.length * 3.8
      escribir(alto)
      const xp = d.margen + columna * (anchoColumna + 8)

      d.doc.setFont('helvetica', 'bold')
      d.doc.setFontSize(9.5)
      d.doc.setTextColor(17, 28, 31)
      d.doc.text(p.nombre, xp, yColumna[columna])
      d.doc.setTextColor(...d.color)
      d.doc.text(p.precio != null ? eur(p.precio) : '', xp + anchoColumna, yColumna[columna], { align: 'right' })

      if (desc.length) {
        d.doc.setFont('helvetica', 'italic')
        d.doc.setFontSize(8)
        d.doc.setTextColor(130, 142, 145)
        d.doc.text(desc, xp, yColumna[columna] + 4)
      }
      yColumna[columna] += alto
    }
    yColumna[columna] += 4
  }

  d.y = Math.max(...yColumna)
  cerrarDocumento(d, marca, ctx)
  return d
}

// ============================================================
// HORARIO SEMANAL — cuadrícula, como una hoja de cálculo
// ============================================================
export interface TurnoImpreso {
  persona: string
  dias: (string[] | null)[]   // 7 posiciones; cada una, sus tramos («12:00-16:00»)
  horas: number
}

export async function horarioSemanal(
  marca: Marca,
  semana: { desde: string; hasta: string },
  turnos: TurnoImpreso[],
  ctx: Contexto = {},
) {
  const d = await nuevoDocumento(
    marca, 'Horario semanal',
    `Del ${fecha(semana.desde)} al ${fecha(semana.hasta)}`,
    'apaisado',
  )

  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  const inicio = new Date(semana.desde)
  const cabecera = dias.map((nombre, i) => {
    const f = new Date(inicio); f.setDate(inicio.getDate() + i)
    return `${nombre}\n${f.getDate()}`
  })

  const cuerpo: Fila[] = turnos.map((t) => [
    t.persona,
    ...t.dias.map((tramos) => (tramos && tramos.length ? tramos.join('\n') : '—')),
    `${numero(t.horas, 1)} h`,
  ])

  const totalHoras = turnos.reduce((s, t) => s + t.horas, 0)

  tabla(d, {
    head: [['Persona', ...cabecera, 'Total']],
    body: cuerpo,
    foot: [['', ...dias.map(() => ''), `${numero(totalHoras, 1)} h`]],
    styles: {
      fontSize: 8.5, cellPadding: 2.4, halign: 'center', valign: 'middle',
      lineColor: [226, 231, 231], lineWidth: 0.2, overflow: 'linebreak',
    },
    headStyles: { fillColor: d.color, textColor: textoSobre(d.color), fontStyle: 'bold', fontSize: 8, halign: 'center' },
    footStyles: { fillColor: aclarar(d.color, 0.85), textColor: [17, 28, 31], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 34, halign: 'left', fontStyle: 'bold' },
      8: { cellWidth: 18, fontStyle: 'bold', fillColor: aclarar(d.color, 0.92) },
    },
    // Los descansos, en gris, para que se distingan de un vistazo
    didParseCell: (datos) => {
      if (datos.section === 'body' && datos.column.index > 0 && datos.column.index < 8) {
        if (datos.cell.raw === '—') {
          datos.cell.styles.textColor = [180, 188, 190]
          datos.cell.styles.fillColor = [250, 251, 251]
        }
      }
    },
  })

  parrafo(d, 'Los tramos partidos aparecen en dos líneas dentro de la misma casilla. El total de cada persona está a la derecha.', 'tenue')

  cerrarDocumento(d, marca, ctx)
  return d
}

/** El horario de una sola persona, para mandárselo por WhatsApp. */
export async function horarioIndividual(
  marca: Marca,
  persona: string,
  semana: { desde: string; hasta: string },
  dias: (string[] | null)[],
  horas: number,
  ctx: Contexto = {},
) {
  const d = await nuevoDocumento(marca, 'Tu horario', `${persona} · del ${fecha(semana.desde)} al ${fecha(semana.hasta)}`)
  const nombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

  cifras(d, [
    { etiqueta: 'Horas de la semana', valor: `${numero(horas, 1)} h` },
    { etiqueta: 'Días de trabajo', valor: String(dias.filter((x) => x && x.length).length) },
  ])

  tabla(d, {
    head: [['Día', 'Turno']],
    body: nombres.map((n, i) => [n, dias[i]?.length ? dias[i]!.join('  ·  ') : 'Libre']),
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold' },
      1: { halign: 'center' },
    },
    didParseCell: (datos) => {
      if (datos.section === 'body' && datos.cell.raw === 'Libre') {
        datos.cell.styles.textColor = [180, 188, 190]
      }
    },
  })

  cerrarDocumento(d, marca, ctx)
  return d
}

// ============================================================
// PARTE DE APPCC — el que mira el inspector
// ============================================================
export async function parteAppcc(
  marca: Marca,
  dia: string,
  puntos: PuntoAppcc[],
  registros: RegistroAppcc[],
  ctx: Contexto = {},
) {
  const d = await nuevoDocumento(marca, 'Parte de APPCC', fecha(dia))

  const filas: Fila[] = puntos.map((p) => {
    const r = registros.find((x) => x.punto_id === p.id)
    const limite = p.limite_min != null || p.limite_max != null
      ? `${p.limite_min ?? '−∞'} a ${p.limite_max ?? '∞'} °C` : 'Visual'
    return [
      p.nombre,
      limite,
      r ? (r.valor != null ? `${numero(r.valor, 1)} °C` : 'Comprobado') : 'NO REGISTRADO',
      r ? (r.correcto ? 'Correcto' : 'Fuera de rango') : '—',
      r ? new Date(r.registrado_en).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—',
      r?.accion_correctiva ?? '',
    ]
  })

  const sinRegistrar = filas.filter((f) => (f as string[])[2] === 'NO REGISTRADO').length
  const fueraDeRango = registros.filter((r) => r.correcto === false).length

  cifras(d, [
    { etiqueta: 'Puntos del plan', valor: String(puntos.length) },
    { etiqueta: 'Registrados', valor: String(puntos.length - sinRegistrar) },
    { etiqueta: 'Fuera de rango', valor: String(fueraDeRango) },
  ])

  tabla(d, {
    head: [['Punto de control', 'Límite', 'Valor', 'Estado', 'Hora', 'Acción correctiva']],
    body: filas,
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 42 },
      1: { halign: 'center', cellWidth: 26 },
      2: { halign: 'center', cellWidth: 24 },
      3: { halign: 'center', cellWidth: 26 },
      4: { halign: 'center', cellWidth: 16 },
      5: { cellWidth: 'auto', fontSize: 8 },
    },
    didParseCell: (datos) => {
      if (datos.section !== 'body') return
      const valor = String(datos.row.raw ? (datos.row.raw as string[])[2] : '')
      const estado = String(datos.row.raw ? (datos.row.raw as string[])[3] : '')
      if (valor === 'NO REGISTRADO') {
        datos.cell.styles.textColor = [200, 50, 42]
        datos.cell.styles.fontStyle = 'bold'
      } else if (estado === 'Fuera de rango') {
        datos.cell.styles.textColor = [184, 122, 0]
      }
    },
  })

  if (sinRegistrar > 0) {
    nota(d, `${sinRegistrar} punto(s) sin registrar en esta fecha.`)
  }

  d.doc.setFont('helvetica', 'normal')
  d.doc.setFontSize(8.5)
  d.doc.setTextColor(130, 142, 145)
  d.doc.text('Responsable: ______________________', d.margen, d.y + 6)
  d.doc.text('Firma: ______________________', d.margen + 95, d.y + 6)

  cerrarDocumento(d, marca, ctx)
  return d
}

// ============================================================
// RESUMEN DEL DÍA
// ============================================================
export async function resumenDelDia(
  marca: Marca,
  datos: {
    dia: string
    ventas: number | null
    tickets: number | null
    origen: string | null
    mermas: { producto: string; cantidad: string; motivo: string }[]
    appccPendientes: number
    bajoMinimo: string[]
  },
  ctx: Contexto = {},
) {
  const d = await nuevoDocumento(marca, 'Resumen del día', fecha(datos.dia))

  cifras(d, [
    { etiqueta: 'Ventas', valor: eur(datos.ventas) },
    { etiqueta: 'Tickets', valor: datos.tickets != null ? String(datos.tickets) : '—' },
    {
      etiqueta: 'Ticket medio',
      valor: datos.ventas && datos.tickets ? eur(datos.ventas / datos.tickets) : '—',
    },
  ])

  if (datos.origen) {
    parrafo(d, `Origen de las ventas: ${datos.origen.replace('_', ' ')}.`, 'tenue')
  }

  seccion(d, 'Mermas del día')
  if (datos.mermas.length === 0) {
    parrafo(d, 'No se ha registrado ninguna merma.', 'tenue')
  } else {
    tabla(d, {
      head: [['Producto', 'Cantidad', 'Motivo']],
      body: datos.mermas.map((m) => [m.producto, m.cantidad, m.motivo.replace('_', ' ')]),
      columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right', cellWidth: 30 }, 2: { halign: 'center', cellWidth: 40 } },
    })
  }

  if (datos.bajoMinimo.length) {
    seccion(d, 'Género bajo mínimo')
    parrafo(d, datos.bajoMinimo.join(' · '))
  }

  if (datos.appccPendientes > 0) {
    nota(d, `Quedan ${datos.appccPendientes} controles de APPCC sin registrar.`, [184, 122, 0])
  }

  cerrarDocumento(d, marca, ctx)
  return d
}

export { aRgb }
