import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { registerSW } from 'virtual:pwa-register'
import { clienteConsultas } from '@/datos/query'
import { App } from '@/app/App'
import './estilos.css'

/**
 * Si algo revienta al arrancar, se enseña el motivo en pantalla.
 * Una pantalla en blanco no dice nada y es lo peor que le puede pasar
 * a alguien que está mirando esto desde el móvil de la barra.
 */
function pantallaDeError(mensaje: string) {
  const raiz = document.getElementById('root')
  if (!raiz) return
  raiz.innerHTML = `
    <div style="font-family:system-ui;padding:24px;max-width:640px;margin:0 auto;color:#111C1F">
      <h1 style="font-size:20px;margin:0 0 8px">Estook no ha podido arrancar</h1>
      <p style="color:#3C4A4E;margin:0 0 16px">Esto es lo que ha fallado:</p>
      <pre style="background:#F5F7F7;border:1px solid #E2E7E7;border-radius:8px;padding:12px;
                  white-space:pre-wrap;word-break:break-word;font-size:13px">${mensaje}</pre>
      <button onclick="location.reload()"
        style="margin-top:16px;height:44px;padding:0 16px;border:0;border-radius:8px;
               background:#FF7A00;color:#fff;font-weight:600">Reintentar</button>
    </div>`
}

window.addEventListener('error', (e) => {
  if (!document.getElementById('root')?.hasChildNodes()) pantallaDeError(String(e.message))
})

try {
  registerSW({ immediate: true })
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={clienteConsultas}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  )
} catch (e) {
  pantallaDeError(e instanceof Error ? e.message : String(e))
}
