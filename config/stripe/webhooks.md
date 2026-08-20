# Stripe · webhooks

Endpoint: `POST /api/stripe`. La firma se comprueba con `STRIPE_WEBHOOK_SECRET`.

| Evento | Qué hace Estook |
|---|---|
| `checkout.session.completed` | Guarda `stripe_cliente_id` y arranca la prueba de 14 días con tarjeta ya puesta |
| `customer.subscription.trial_will_end` | Tres días antes: correo avisando de cuándo y cuánto se cobra |
| `customer.subscription.updated` | Fin de prueba (pasa a *active* y levanta los cupos), cambio de plan, de ciclo o de número de locales |
| `customer.subscription.deleted` | Deja la cuenta en solo lectura 30 días, con todo exportable |
| `invoice.payment_failed` | Avisa al gerente. A los 7 días, solo lectura. A los 60, archivo |
| `invoice.paid` | Devuelve la cuenta a `al_dia` |

Nunca se borran datos por un impago. Solo se restringe el acceso.
