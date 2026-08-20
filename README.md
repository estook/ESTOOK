# Estook · Tu cocina, bajo control

Aplicación de gestión para bares y restaurantes. Este repositorio se construye por módulos,
en el orden del manifiesto. **Módulo 0 · Cimientos** es lo que hay hasta ahora.

## Arrancar

    npm install
    npm run dev        # http://localhost:5173
    npm run build      # comprueba tipos y compila
    npm run lint       # solo tipos

Para conectar los servicios, la guía paso a paso está en **`config/CONECTAR.md`**: Supabase,
Google (Maps y Gemini), GitHub Pages y lo que queda pendiente. La app arranca igual sin claves.

Despliegue: GitHub Pages con el flujo de `.github/workflows/desplegar.yml`. Todo lo que necesita
servidor (Fogón, Google, PDF, TPV, Stripe) vive en funciones de Supabase, en `supabase/functions/`.

## Qué entra en M0

- React + Vite + TypeScript, instalable como PWA (funciona sin cobertura y se actualiza sola).
- Sistema de diseño con los colores y las tipografías de la marca, y los componentes base:
  botón, tarjeta, cifra, hoja deslizante, campo, selector, tabla responsive, estado vacío, aviso e insignia.
- Capa de datos con TanStack Query, pensada para red mala: sirve lo último conocido antes que una pantalla en blanco.
- Cola offline con Dexie: lo que se apunta se guarda en el móvil y sube solo al volver la señal, en orden y sin duplicar.
- Esquema completo de base de datos y reglas de acceso por rol (`config/supabase/`).
- Despliegue listo para Netlify.

## Cómo comprobarlo

Abre `/cimientos` en el móvil, instala la app, apunta una merma, pon el móvil en modo avión,
apunta otra y vuelve a tener cobertura: las dos suben solas.

## Estructura

    src/
      app/          arranque y rutas
      componentes/  sistema de diseño
      datos/        supabase y capa de consultas
      marca/        logo e isotipo
      offline/      cola de apuntes (Dexie) y su estado
      paginas/      pantallas
    supabase/
      functions/    funciones de servidor: fogon (Gemini) y lugares (Google Places)
    config/         claves, esquema de base de datos y guías de conexión

## Decisiones que conviene no olvidar

- **Los permisos viven en el servidor.** Un rol sin costes no recibe los campos de precio: consulta
  vistas que no traen esa columna. No es que la app no los pinte.
- **La cifra manda, el historial explica.** El stock se puede corregir a mano siempre; el ajuste queda firmado.
- **Los documentos guardan sus datos.** Cada PDF generado deja en el historial una copia de lo que
  usó, con su fecha, para poder volver dentro de un año y sacarlo idéntico.
- **Nada crítico depende del presupuesto de IA.** Fichar, registrar APPCC, recibir un pedido o generar
  un documento funcionan siempre.
