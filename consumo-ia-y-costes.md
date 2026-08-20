# Consumo de IA y costes por cliente · Estook

Actualizado a agosto de 2026, con Gemini en vez de Claude. Cambio usado: 1 $ = 0,92 €.
Todo lo que hay aquí está implementado en el código, no es una intención.

\---

## 1 · Qué modelo hace cada cosa

|Tarea|Modelo|Por qué|
|-|-|-|
|Preguntas del día a día a Fogón|`gemini-2.5-flash-lite`|Rápido y barato; el contexto ya viene resuelto|
|Propuestas de menú del día|`gemini-2.5-flash-lite`|Es elegir entre lo que hay, no razonar mucho|
|Redacción de mensajes y respuestas a reseñas|`gemini-2.5-flash-lite`|Escribir bonito no necesita más|
|Análisis del cierre|`gemini-2.5-flash`|Cruza cifras del día con el histórico|
|Resumen semanal|`gemini-2.5-flash`|Es el que más piensa de todos|
|Lectura de albaranes por foto|`gemini-2.5-flash`|Visión: hay que leer números sin equivocarse|
|Alertas y avisos del Panel|**ninguno**|Salen de consultas a la base. Cuestan cero|

Se cambian sin tocar código: son los secretos `AI\_MODELO\_RAPIDO` y `AI\_MODELO\_ANALISIS`.

**Tarifas** (€ por millón de tokens):

|Modelo|Entrada|Salida|
|-|-|-|
|`gemini-2.5-flash-lite`|0,09|0,37|
|`gemini-2.5-flash`|0,28|2,30|
|`gemini-2.5-pro`|1,15|9,20|

\---

## 2 · Lo que consume un restaurante medio al mes

Un local, uso normal, plan Base:

|Tarea|Veces al mes|Modelo|Coste|
|-|-|-|-|
|Preguntas a Fogón (8 al día)|240|flash-lite|0,28 €|
|Análisis del cierre|30|flash|0,31 €|
|Resumen semanal|4|flash|0,08 €|
|Albaranes por foto|30|flash visión|0,21 €|
|Propuestas de menú del día|22|flash-lite|0,06 €|
|Mensajes y respuestas a reseñas|40|flash-lite|0,06 €|
|Análisis de reseñas (lote semanal)|4|flash-lite|0,02 €|
|Análisis de competencia (lote semanal)|4|flash-lite|0,02 €|
|Avisos por consulta a la base|\~600|—|0 €|
|**Total IA**|||**≈ 1,04 €**|

Tres cosas lo mantienen ahí: el contexto va cacheado, los números llegan resueltos por SQL
(el 90 % de los avisos no llama al modelo) y el trabajo pesado va en lote nocturno.

**El caso malo:** un gerente enganchado que pregunta 60 veces al día llega a unos 2,10 €/mes.
Sigue siendo asumible, y el cupo del plan lo corta antes de que se dispare.

\---

## 3 · Google Places, que es lo caro de verdad

Text Search 32 $/1.000 · Place Details con reseñas 40 $/1.000.

|Uso|Llamadas/mes|Coste|
|-|-|-|
|Alta del local (una sola vez)|12|0,44 € el primer mes|
|Tus propias reseñas (Business Profile)|ilimitado|0 €|
|Competencia: 10 locales, refresco semanal|40|1,47 €|
|Con caché compartida por zona (3 clientes en la misma ciudad)|\~14|0,52 €|

**El dato que hay que tener grabado:** si los diez competidores se refrescaran de verdad cada
ocho horas, serían 900 llamadas al mes = **33 € por local**. Treinta veces el coste. Por eso
el reloj está partido en dos:

* **Cada 8 horas** se recalcula tu posición y tus avisos con lo que ya está guardado. Sin
llamar a Google. Coste cero.
* **Una vez por semana** se refrescan de verdad los datos de cada competidor.
* **Al momento**, si abres la ficha de un competidor concreto, se refresca ese y solo ese.
* **Caché compartida por zona**: los locales de una misma calle se piden una vez y sirven para
todos los clientes que estén ahí. Cuantos más clientes en una ciudad, más barato sale.

\---

## 4 · Coste total y margen por plan

||Base 45 €|Pro 69 €|Grupo 55 €/local|
|-|-|-|-|
|IA|1,04 €|1,40 €|1,40 €|
|Google Places|1,47 €|1,47 €|1,47 €|
|Infraestructura|0,52 €|0,52 €|0,52 €|
|Conexión de TPV|—|11,00 €|11,00 €|
|Stripe|0,93 €|1,29 €|1,90 € (2 locales)|
|**Coste**|**3,96 €**|**15,68 €**|**15,68 €/local**|
|**Margen**|41,04 € · **91,2 %**|53,32 € · **77,3 %**|39,32 € · **71,5 %**|

Con Gemini el margen sube unas décimas respecto al cálculo del manifiesto. Los precios se
quedan como están: el que manda es el TPV, que sigue siendo dos tercios del coste de Pro.

**Coste de una prueba de 14 días completa: unos 1,40 €.** Aunque solo convierta uno de cada
tres, sale a cuenta.

**Punto de equilibrio** (500 €/mes de costes fijos): con quince locales de pago, el proyecto
se sostiene solo.

\---

## 5 · Los frenos, y qué pasa al llegar a cada uno

Por local y día:

|Recurso|Tope|Al 80 %|Al 100 %|
|-|-|-|-|
|IA · prueba|0,08 €|—|Se avisa de que se acabó el cupo de la prueba|
|IA · Base|0,15 € (≈4,50 €/mes)|Aviso interno|Se aplazan las tareas automáticas; el chat sigue con el modelo barato|
|IA · Pro y Grupo|0,25 €|Aviso interno|Igual|
|Google Places|0,10 € (3 €/mes)|Aviso interno|Corte duro: el Panel usa lo guardado|
|Preguntas a Fogón|10 / 30 / 60 al día según plan|Aviso al usuario|Siguen los avisos que salen de consultas|
|Ráfaga por persona|12 cada 10 minutos|—|«Espera un momento», sin cortar la sesión|
|Albaranes por foto|5 (prueba) · 60/mes (Base) · sin límite (Pro)|—|Se avisa y se deja meter a mano|
|Correos salientes|30 al día|—|Se encolan para el día siguiente|
|Almacenamiento|2 GB|Aviso al usuario|Se pide borrar fotos antiguas|

De toda la empresa:

|Recurso|Tope diario|Qué pasa|
|-|-|-|
|Gasto total de IA|35 €|Avisos al 60 % y al 80 %; corte de tareas automáticas al 100 %|
|Gasto total en Google Places|20 €|Corte duro en cuanto se alcanza|
|Anomalía|gasto > 1,3 × la media de 7 días|Correo inmediato con el desglose por cliente|
|Presupuesto en Google Cloud|600 €/mes|Alertas nativas a 300 € y 450 €|

**Orden de degradación** (nunca se corta al usuario en seco):

1. Se aplaza lo automático: competencia, revisión de webs de proveedores, propuestas no pedidas.
2. Se abarata: el chat baja al modelo rápido y el contexto se recorta a lo del día.
3. Se recorta el contexto: solo el resumen mínimo.
4. Lo último que se toca es lo que el usuario ha pedido activamente. Si alguien pulsa
«pregúntale a Fogón» mientras cierra la caja, se le responde.
5. Nada crítico depende del presupuesto: fichar, registrar el APPCC, recibir un pedido o
generar un PDF funcionan siempre, porque no llaman al modelo.

\---

## 6 · Cómo se mide

Cada llamada al modelo y a Google se guarda con cliente, local, persona, tarea, modelo,
tokens de entrada y salida, si fue caché, coste calculado y milisegundos. Tablas `consumo\_ia`
y `consumo\_externo`.

Esa es la cifra que dirá si un plan está bien puesto. Consulta para el panel interno:

```sql
select l.nombre,
       round(sum(c.coste\_eur)::numeric, 4) as coste\_ia\_mes,
       count(\*) as llamadas
from consumo\_ia c
join locales l on l.id = c.local\_id
where c.creado\_en >= date\_trunc('month', now())
group by l.nombre
order by coste\_ia\_mes desc;
```

## 7 · Lo que hay que vigilar

1. **El precio del TPV.** Dos tercios del coste de Pro. Negociarlo por volumen antes de lanzar;
por encima de 15 € por local, hay que subir Pro o dejar la conexión como extra.
2. **Google Places.** Un error de configuración multiplica la factura por diez sin que nadie se
entere. Por eso el tope diario es corte duro, no aviso.
3. **El cliente que abusa de Fogón.** Los cupos existen para eso, pero conviene mirar el panel
interno la primera semana de cada cliente nuevo.
4. **Las fotos.** Redimensionar a 1.600 px al subir es obligatorio, no opcional.

