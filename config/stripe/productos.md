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

## La prueba de 14 días

**Con tarjeta desde el principio.** El hostelero mete su método de pago, empieza la prueba y,
si no la cancela, al día 15 se le cobra el plan. En Stripe es un `trial_period_days: 14` en la
suscripción, no un estado aparte.

Cómo queda:

1. Elige plan y pasa por el checkout con tarjeta. Se crea la suscripción en estado *trialing*.
2. La cuenta queda en `plan = 'prueba'` con `prueba_termina_en` a 14 días, y con los cupos de
   la prueba: 10 preguntas al día, 3 documentos al día, 5 albaranes por foto en total, una
   consulta de competencia, reseñas en solo lectura y sin TPV conectado.
3. Tres días antes del cargo, correo avisando de cuándo y cuánto se va a cobrar. Esto no es
   opcional: evita la mitad de las reclamaciones y las devoluciones de recibo.
4. Al terminar, Stripe cobra solo y manda `customer.subscription.updated` con estado *active*.
   La app pasa la cuenta a su plan y levanta los cupos.
5. Si cancela durante la prueba, no se cobra nada y la cuenta queda en solo lectura 30 días con
   todo exportable. No se borra nada.
6. Si la tarjeta falla al cobrar, entra por `invoice.payment_failed`: aviso al gerente, solo
   lectura a los 7 días y archivo a los 60.

Ventaja: convierte mucho mejor y filtra al curioso. Coste real de una prueba completa: 1,40 €.
