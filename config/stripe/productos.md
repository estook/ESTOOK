# Stripe · los planes

Precios **con IVA incluido**, por local y mes. En Stripe se crea un producto por plan con dos
precios: mensual y anual.

| Producto | Mensual | Anual (dos meses gratis) | Variable |
|---|---|---|---|
| Estook Base | 45 € | 450 € | `STRIPE_PRECIO_BASE` / `_BASE_ANUAL` |
| Estook Pro | 69 € | 690 € | `STRIPE_PRECIO_PRO` / `_PRO_ANUAL` |
| Estook Grupo | 55 € por local | 550 € por local | `STRIPE_PRECIO_GRUPO` / `_GRUPO_ANUAL` |

Grupo se cobra con cantidad: 2 locales = 110 €, 3 = 165 €. Máximo tres; a partir del cuarto,
plan a medida y se cierra por teléfono.

Al crear cada precio, marcar que el importe incluye impuestos (`tax_behavior: inclusive`) para
que lo que ve el hostelero sea exactamente lo que se le cobra.

Prueba de 14 días sin tarjeta: no se crea suscripción en Stripe hasta que contrata. El límite
lo lleva la app (`cuentas.plan = 'prueba'` y `cuentas.prueba_termina_en`).
