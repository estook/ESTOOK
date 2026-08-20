# Google · fichas, competencia y reseñas

## Places API (New) — `GOOGLE_MAPS_KEY`

Google Cloud Console › APIs › activar **Places API (New)** › crear credencial y restringirla
por dominio. Se usa para buscar el restaurante en el alta, traer dirección, horarios y
valoración, y localizar los locales de la zona.

**Límite asumido**: Places devuelve como mucho cinco reseñas por local. De los competidores se
guarda la nota media, el número de reseñas y esas cinco. El histórico completo solo existe para
el local propio, vía Business Profile.

## Business Profile API — reseñas propias

`GOOGLE_BUSINESS_CLIENT_ID` y `_SECRET`. El dueño autoriza con su cuenta de Google durante el
onboarding; para tu propio negocio es gratis y sin tope. Si no autoriza, la app de Reseñas se
queda con lo que da Places y se explica por qué.

## Control de gasto

- Refresco real de competidores: **una vez por semana**. El Panel se recalcula cada 6 h sobre lo
  guardado, sin llamar a Google.
- Caché compartida por zona: los locales de una misma calle se consultan una vez y sirven para
  todos los clientes de esa zona.
- Tope: 0,10 €/día por local y 20 €/día en toda la empresa. Al alcanzarlo, corte duro y el Panel
  sigue con lo guardado.
