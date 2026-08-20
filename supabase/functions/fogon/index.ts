// ============================================================
// FOGÓN · el asistente. Vive en el servidor porque la clave del modelo
// no puede pisar el navegador jamás.
//
// Reglas del manifiesto que se cumplen aquí:
//  · Fogón nunca calcula: los números llegan resueltos de la base.
//  · Lee el resumen vivo del local (máx. ~1.500 tokens) + el perfil (~1.000).
//  · Español de España, directo, máximo cuatro frases.
//  · Propone y rellena, nunca guarda solo.
//  · Cupo por plan y tope de gasto diario, con degradación en vez de corte.
// ============================================================
import { cabeceras, clienteDeServicio, exigirMiembro, gastoDeHoy, responder, TOPES } from '../_compartido/comun.ts'

const MODELO_RAPIDO = Deno.env.get('AI_MODELO_RAPIDO') ?? 'gemini-2.5-flash-lite'
const MODELO_ANALISIS = Deno.env.get('AI_MODELO_ANALISIS') ?? 'gemini-2.5-flash'

// € por millón de tokens, para poder medir el coste real por cliente.
const TARIFAS: Record<string, { entrada: number; salida: number }> = {
  'gemini-2.5-flash-lite': { entrada: 0.09, salida: 0.37 },
  'gemini-2.5-flash': { entrada: 0.28, salida: 2.3 },
  'gemini-2.5-pro': { entrada: 1.15, salida: 9.2 },
}

const CUPOS: Record<string, number> = { prueba: 10, base: 30, pro: 60, grupo: 60, a_medida: 500 }

const INSTRUCCIONES = `Eres Fogón, el asistente de Estook, una app de gestión para bares y restaurantes.
Hablas español de España, directo y sin rodeos, con el tuteo de cocina. Máximo cuatro frases.
Nunca calculas cifras: usas exactamente las que te llegan en el contexto. Si un dato no está, lo dices.
No inventas precios, márgenes ni fechas. Propones y rellenas, pero nunca das nada por guardado.
Si hablas con un cocinero o con sala, no mencionas ningún importe, coste ni margen.
Cuando propongas una acción, termina con una sola acción concreta.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cabeceras })
  try {
    const { local_id, pregunta, pantalla, tarea = 'chat' } = await req.json()
    if (!local_id || !pregunta) return responder({ error: 'Falta el local o la pregunta.' }, 400)

    const { sb, miembro } = await exigirMiembro(req, local_id)
    const servicio = clienteDeServicio()

    // Plan y cuenta
    const { data: local } = await sb.from('locales').select('id, nombre, cuenta_id, cuentas(plan)').eq('id', local_id).single()
    const plan = (local?.cuentas as { plan: string } | null)?.plan ?? 'prueba'
    const cuentaId = local?.cuenta_id as string

    // Cupo del día
    const desde = new Date(); desde.setHours(0, 0, 0, 0)
    const { count } = await servicio.from('consumo_ia').select('id', { count: 'exact', head: true })
      .eq('local_id', local_id).eq('tarea', 'chat').gte('creado_en', desde.toISOString())
    const cupo = CUPOS[plan] ?? 10
    if ((count ?? 0) >= cupo) {
      return responder({
        agotado: true,
        respuesta: `Has llegado a las ${cupo} preguntas de hoy de tu plan. Los avisos automáticos siguen funcionando.`,
      })
    }

    // Topes de gasto: primero se abarata, y lo último que se toca es lo que el usuario pide.
    const gastoLocal = await gastoDeHoy('ia', cuentaId, local_id)
    const gastoEmpresa = await gastoDeHoy('ia', cuentaId)
    const topeLocal = TOPES.ia_dia_local[plan as keyof typeof TOPES.ia_dia_local] ?? 0.15
    const apretado = gastoLocal > topeLocal * 0.8 || gastoEmpresa > TOPES.ia_dia_empresa * 0.8
    const modelo = tarea === 'cierre' || tarea === 'resumen' ? (apretado ? MODELO_RAPIDO : MODELO_ANALISIS) : MODELO_RAPIDO

    // Contexto: resumen vivo + perfil. Si aprieta el gasto, solo el resumen del día.
    const { data: ctx } = await sb.from('contexto_local').select('resumen_dia, perfil_negocio').eq('local_id', local_id).maybeSingle()
    const contexto = [
      `Local: ${local?.nombre ?? ''}. Hablas con un ${miembro.rol.replace('_', ' ')}.`,
      pantalla ? `Está en la pantalla: ${pantalla}.` : '',
      ctx?.resumen_dia ?? 'Sin resumen del día todavía.',
      apretado ? '' : (ctx?.perfil_negocio ?? ''),
    ].filter(Boolean).join('\n\n')

    const clave = Deno.env.get('AI_API_KEY')
    if (!clave) return responder({ error: 'Fogón no está conectado todavía.' }, 503)

    const t0 = Date.now()
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': clave },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: `${INSTRUCCIONES}\n\nCONTEXTO DEL NEGOCIO:\n${contexto}` }] },
          contents: [{ role: 'user', parts: [{ text: pregunta }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 500 },
        }),
      },
    )
    const ms = Date.now() - t0
    if (!r.ok) return responder({ error: 'Fogón no ha podido responder. Inténtalo otra vez.' }, 502)

    const datos = await r.json()
    const respuesta = datos?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
    const uso = datos?.usageMetadata ?? {}
    const tarifa = TARIFAS[modelo] ?? TARIFAS['gemini-2.5-flash-lite']
    const coste = ((uso.promptTokenCount ?? 0) * tarifa.entrada + (uso.candidatesTokenCount ?? 0) * tarifa.salida) / 1_000_000

    // Cada llamada se mide: es la cifra que dice si un plan está bien puesto.
    await servicio.from('consumo_ia').insert({
      cuenta_id: cuentaId, local_id, tarea, modelo,
      tokens_entrada: uso.promptTokenCount ?? 0,
      tokens_salida: uso.candidatesTokenCount ?? 0,
      con_cache: Boolean(uso.cachedContentTokenCount),
      coste_eur: coste, milisegundos: ms,
    })

    return responder({ respuesta, modelo, restantes: cupo - (count ?? 0) - 1 })
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : 'error'
    const estado = mensaje.includes('acceso') || mensaje.includes('sesion') ? 403 : 500
    return responder({ error: mensaje }, estado)
  }
})
