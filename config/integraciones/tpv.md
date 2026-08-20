# TPV · API unificada

Un solo conector para todas las marcas (Ágora, Hosteltáctil, Last.app, Revo, Lightspeed,
Square…). Es el mayor coste variable del plan Pro: hay que cerrar precio por volumen antes de
lanzar.

## Qué se recoge

- **Ventas**: pedidos con sus líneas, pagos, propinas, descuentos, modificadores, canal y mesa.
- **Cierres**: el Z del día, para cuadrar contra lo que calcula Estook.
- **Inventario**, si la marca lo ofrece: sirve para actualizar la despensa de una, con
  confirmación previa. Nunca pisa un ajuste hecho a mano sin avisar.

## Reglas

- Se pide por **fecha de servicio**, no por hora de cobro.
- Cada pedido lleva identificador único y no puede entrar dos veces (`ventas.identificador_externo`).
- Los menús del TPV se explotan a sus platos; los modificadores que llevan producto descuentan producto.
- Lo que quede sin emparejar cuenta en dinero pero no descuenta género, y sale avisado.
- Si la conexión falla dos horas: aviso al gerente y se ofrece cerrar con CSV o con el total.
  El cierre nunca se bloquea.

Claves: `POS_API_KEY`, `POS_WEBHOOK_SECRET`.
