# Sistema de Gestión de Proceso de Arena — Guion para demo (5–10 min)

**Basado en la app real.** Usar el rol **Admin** (barra superior) para ver todas las secciones. Duración objetivo: ~7 min.

---

## Antes de empezar

- Abrir el demo alojado: [https://sand-process.vercel.app/](https://sand-process.vercel.app/)
- En la **barra superior**, elegir el rol **Admin** para que el menú izquierdo muestre todos los ítems
- Opcional: cambiar el idioma (EN/ES) en la barra superior para mostrar el soporte bilingüe

---

## 1. Intro (0:00 – 0:40)

**[Pantalla: Inicio — Dashboard en `/`]**

- "Este es el Sistema de Gestión de Proceso de Arena para operaciones de procesamiento de arena en Vaca Muerta, Argentina."
- "Incluye pedidos, logística con GPS, calidad, facturación, inventario, flota, producción, aprobaciones y un portal de clientes, con roles e inglés/español."
- "Voy a recorrer las áreas principales; estamos logueados como Admin así que vemos todo."

---

## 2. Dashboard (0:40 – 1:45)

**[Quedarse en `/` — Dashboard]**

- "El dashboard es por rol: los admins ven esto; los choferes entran directo a Logística, calidad a Calidad, y así."
- **Tarjetas de KPI:** "Ingresos totales, pedidos totales, entregas activas, tasa de aprobación de QC — todo con datos en vivo."
- **Gráficos:** "Tendencia de ingresos, estado de los pedidos y volumen de producción por producto."
- **Actividad reciente:** "Últimos pedidos, entregas y ensayos de QC."
- **Estadísticas rápidas:** "Facturas pendientes y vencidas, capacidad de producción, QC pendiente — con enlaces a Facturación y Calidad."
- Si aparece **Mis tareas:** "Las tareas del rol actual se muestran acá y llevan a la página de Tareas."

---

## 3. Pedidos (1:45 – 2:45)

**[Menú izquierdo → Pedidos → `/orders`]**

- "En Pedidos se listan todos los pedidos de clientes con estado y búsqueda."
- Abrir un pedido: "Detalle, productos, estado y si tiene certificado."
- "Desde acá se pueden crear pedidos nuevos" — abrir un momento el diálogo de Crear pedido (no hace falta enviar).

---

## 4. Logística y mapa (2:45 – 3:45)

**[Menú izquierdo → Logística → `/logistics`]**

- "En Logística se hace el seguimiento de las entregas con GPS."
- "El mapa muestra cantera y pozos; podemos elegir una entrega y ver la ruta y el estado."
- Mostrar una entrega: "Avance, pasos y trazabilidad desde cantera hasta el cliente."

---

## 5. Tareas, Despacho, Aprobaciones (3:45 – 4:30)

**[Opcional — se puede acortar o saltear para la versión de 5 min]**

- **Tareas (`/tasks`):** "Tareas por rol — qué tiene que hacer cada uno en el día."
- **Despacho (`/dispatcher`):** "Asignar entregas y manejar el tablero."
- **Aprobaciones (`/approvals`):** "Aprobaciones de flujo para operaciones y jefatura."

---

## 6. Calidad, Facturación, Inventario, Flota (4:30 – 5:45)

**[Ir pasando por el menú izquierdo]**

- **Calidad (`/quality`):** "Ensayos de QC y resultados por lote; enlace a certificados."
- **Facturación (`/billing`):** "Facturas asociadas a pedidos; pendientes y cobradas."
- **Inventario (`/inventory`):** "Stock por ubicación y producto para planificar."
- **Flota (`/fleet`):** "Camiones y choferes para la logística."
- **Producción (`/production`):** "Planificación y capacidad de producción."

---

## 7. Portal del cliente y roles (5:45 – 6:30)

- **Portal del cliente:** "Cambiar el rol a **Usuario cliente** en la barra superior — el menú pasa a mostrar solo el Portal del cliente. Ahí el cliente ve sus pedidos y documentos."
- Volver a **Admin**.

---

## 8. Cierre (6:30 – 7:00)

**[Volver al Dashboard `/`]**

- "En resumen: dashboard con KPIs y gráficos, pedidos, logística con mapa y GPS, tareas, despacho, aprobaciones, calidad, facturación, inventario, flota, producción y portal del cliente — todo por roles y bilingüe. Gracias por ver el demo."

---

## Rutas (referencia)

| Ruta               | Página / Etiqueta en menú |
|--------------------|---------------------------|
| `/`                | Dashboard                 |
| `/tasks`           | Tareas                    |
| `/orders`         | Pedidos                   |
| `/logistics`      | Logística                 |
| `/dispatcher`     | Despacho                  |
| `/approvals`      | Aprobaciones              |
| `/rules`          | Reglas                    |
| `/quality`        | Calidad                   |
| `/billing`        | Facturación               |
| `/inventory`      | Inventario                |
| `/fleet`          | Flota                     |
| `/production`     | Producción                |
| `/customer-portal`| Portal del cliente        |
| `/msas`           | MSAs                      |
| `/customers`      | Clientes                  |

---

## Atajos de tiempo

- **~5 min:** Intro → Dashboard → Pedidos → Logística → Cierre (saltear Tareas, Despacho, Aprobaciones y el detalle de Calidad/Facturación/Inventario/Flota/Producción/Portal).
- **~10 min:** Sumar una acción concreta por área (ej.: crear un pedido, abrir una factura, mostrar un ensayo de QC, cambiar a Usuario cliente y volver).
- Hacer una pausa de 1–2 segundos antes de cada clic para editar más fácil.
- Ensayar una vez con cronómetro.
