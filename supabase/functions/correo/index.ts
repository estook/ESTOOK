// ============================================================
// CORREO · envío con Resend desde el servidor.
//
// Ojo: esta función es para los correos de la app (invitaciones, horarios,
// documentos, resumen semanal). Los correos de Auth — confirmar cuenta y
// recuperar contraseña — los manda Supabase, y para que salgan por Resend hay
// que configurar el SMTP en el panel (ver config/CONECTAR.md, apartado 1.6).
// La clave por sí sola no cambia nada.
// ============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ORIGENES = (Deno.env.get('APP_URL') ?? '')
  .split(',')
  .map((u) => { try { return new URL(u.trim()).origin } catch { return '' } })
  .filter(Boolean)

/**
 * El navegador compara el origen exacto (esquema + dominio), sin ruta. Si en
 * APP_URL se guardó algo como https://midominio.com/APP/, la comparación falla
 * y el navegador bloquea la llamada antes de que llegue aquí: por eso solo se
 * veían OPTIONS en las invocaciones. Se responde con el origen que pide, si
 * está permitido, y si no hay lista configurada se acepta cualquiera.
 */
function cabecerasDe(req: Request) {
  const origen = req.headers.get('Origin') ?? ''
  const permitido = ORIGENES.length === 0 || ORIGENES.includes(origen) ? (origen || '*') : ORIGENES[0]
  return {
    'Access-Control-Allow-Origin': permitido,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}

let cabeceras: Record<string, string> = { 'Access-Control-Allow-Origin': '*' }

const responder = (d: unknown, e = 200) =>
  new Response(JSON.stringify(d), { status: e, headers: { ...cabeceras, 'Content-Type': 'application/json' } })

const TIPOS = ['invitacion', 'horario', 'documento', 'resumen'] as const
type Tipo = (typeof TIPOS)[number]

const TOPE_DIARIO = 30 // por local; lo que pase, se encola para el día siguiente

async function exigirMiembro(req: Request, localId: string) {
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('sin sesion')
  const { data } = await sb.from('miembros').select('id, rol')
    .eq('local_id', localId).eq('persona_id', user.id).eq('activo', true).maybeSingle()
  if (!data) throw new Error('sin acceso')
  return { sb, miembro: data }
}

/** Plantilla común: la marca del local, no la nuestra. */
function plantilla({ local, color, titulo, cuerpo, boton }: {
  local: string; color: string; titulo: string; cuerpo: string
  boton?: { texto: string; url: string }
}) {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#F5F7F7;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#111C1F">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
    <table width="100%" style="max-width:560px;background:#fff;border:1px solid #E2E7E7;border-radius:12px" cellpadding="0" cellspacing="0">
      <tr><td style="padding:24px 24px 0"><p style="margin:0;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${color}">${local}</p></td></tr>
      <tr><td style="padding:12px 24px 0"><h1 style="margin:0;font-size:20px;line-height:1.3">${titulo}</h1></td></tr>
      <tr><td style="padding:12px 24px 0;font-size:15px;line-height:1.6;color:#3C4A4E">${cuerpo}</td></tr>
      ${boton ? `<tr><td style="padding:20px 24px 0"><a href="${boton.url}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px">${boton.texto}</a></td></tr>` : ''}
      <tr><td style="padding:24px;font-size:12px;color:#6B7A7E">Este mensaje se ha enviado desde ${local} con Estook.</td></tr>
    </table>
  </td></tr></table></body></html>`
}

Deno.serve(async (req) => {
  cabeceras = cabecerasDe(req)
  if (req.method === 'OPTIONS') return new Response('ok', { status: 204, headers: cabeceras })
  if (req.method !== 'POST') return responder({ error: 'Método no permitido.' }, 405)

  try {
    const { local_id, tipo, para, asunto, titulo, cuerpo, boton, adjunto } = await req.json()
    if (typeof local_id !== 'string' || !TIPOS.includes(tipo as Tipo) || !para) {
      return responder({ error: 'Petición incorrecta.' }, 400)
    }

    const { sb } = await exigirMiembro(req, local_id)
    const servicio = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('CLAVE_SERVICIO')!)

    const { data: local } = await sb.from('locales')
      .select('nombre, color_secundario, cuenta_id').eq('id', local_id).single()
    if (!local) return responder({ error: 'Local no encontrado.' }, 404)

    // Tope de correos del día
    const desde = new Date(); desde.setHours(0, 0, 0, 0)
    const { data: enviados } = await servicio.from('consumo_externo').select('llamadas')
      .eq('local_id', local_id).eq('servicio', 'correo').gte('creado_en', desde.toISOString())
    const total = (enviados ?? []).reduce((s: number, f: { llamadas: number }) => s + Number(f.llamadas ?? 0), 0)
    if (total >= TOPE_DIARIO) {
      return responder({ encolado: true, aviso: 'Se ha alcanzado el máximo de correos de hoy. Se enviará mañana.' })
    }

    const clave = Deno.env.get('RESEND_API_KEY')
    const remitente = Deno.env.get('MAIL_FROM')
    if (!clave || !remitente) return responder({ error: 'El correo no está configurado todavía.' }, 503)

    const html = plantilla({
      local: local.nombre,
      color: local.color_secundario ?? '#FF7A00',
      titulo: titulo ?? asunto,
      cuerpo,
      boton,
    })

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${local.nombre} <${remitente}>`,
        to: Array.isArray(para) ? para : [para],
        subject: asunto,
        html,
        ...(adjunto ? { attachments: [adjunto] } : {}),
      }),
    })

    if (!r.ok) {
      console.error('resend:', await r.text())
      return responder({ error: 'No se ha podido enviar el correo.' }, 502)
    }

    await servicio.from('consumo_externo').insert({
      cuenta_id: local.cuenta_id, local_id, servicio: 'correo', llamadas: 1, coste_eur: 0,
    })

    return responder({ enviado: true })
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : ''
    if (mensaje === 'sin sesion' || mensaje === 'sin acceso') return responder({ error: 'Sin acceso.' }, 403)
    console.error('correo:', mensaje)
    return responder({ error: 'Algo ha fallado.' }, 500)
  }
})
