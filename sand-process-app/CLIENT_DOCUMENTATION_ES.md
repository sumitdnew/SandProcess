# Sistema de Gestión de Proceso de Arena - Documentación del Prototipo

## Acceso Rápido

**🌐 Acceder al Prototipo**: [https://sand-process.vercel.app/](https://sand-process.vercel.app/)

---

## Resumen

El Sistema de Gestión de Proceso de Arena es una plataforma web integral diseñada para gestionar el ciclo de vida completo de la producción de arena, control de calidad, logística y relaciones con clientes para la industria de petróleo y gas. Este prototipo demuestra todos los flujos de trabajo principales desde la creación de pedidos hasta la entrega y facturación.

## Arquitectura del Sistema

- **Frontend**: React con TypeScript, Material-UI
- **Backend**: Supabase (base de datos PostgreSQL + Storage)
- **Despliegue**: Vercel (hosting listo para producción)
- **Idiomas**: Inglés y Español Argentino

## Características Principales

### 1. **Gestión de Pedidos**
- Crear pedidos mediante Acuerdos de Servicio Maestro (MSA) u Órdenes de Compra independientes
- Subir documentos de PO del cliente
- Rastrear el estado del pedido a través del ciclo de vida completo
- Generar PDFs de Órdenes de Compra
- Filtrado específico por cliente

### 2. **Control de Calidad**
- Crear pruebas de QC vinculadas a pedidos
- Flujo de trabajo simplificado Aprobar/Rechazar
- Informes de prueba completos
- Generación automática de certificados (PDF)
- Certificado requerido antes del despacho

### 3. **Gestión de Producción**
- Seguimiento visual de la línea de producción
- Flujos de trabajo de inicio/finalización de producción
- "Producir a Inventario" para gestión de stock
- Monitoreo de capacidad de producción

### 4. **Logística y Trazabilidad**
- Asignar camiones y conductores a pedidos
- Seguimiento GPS en tiempo real simulado
- Confirmación de entrega con firmas electrónicas
- Captura de fotos en la entrega
- Informes de trazabilidad completos (PDF)
- Seguimiento de puntos de control

### 5. **Gestión de Inventario**
- Niveles de stock en tiempo real por producto y ubicación
- Cantidades reservadas de pedidos activos
- Cálculos de inventario disponible

### 6. **Facturación y Pagos**
- Generación automática de facturas al confirmar entrega
- Seguimiento de pagos
- Métricas de Días de Ventas Pendientes (DSO)
- Generación de PDFs de facturas

### 7. **Portal del Cliente**
- Enviar nuevos pedidos
- Rastrear el estado del pedido en tiempo real
- Ver y descargar facturas
- Pagar facturas (flujo de pago simulado)
- Descargar certificados de QC y documentos

### 8. **Portal del Conductor**
- Ver entregas asignadas
- Marcar entregas "En Tránsito" y "Llegado"
- Capturar firmas de clientes
- Completar confirmación de entrega

## Roles de Usuario

### **Administrador** (Rol Predeterminado)
Acceso completo a todos los módulos:
- Panel de control con KPIs
- Gestión de Pedidos
- Control de Calidad
- Gestión de Producción
- Logística y Gestión de Flota
- Facturación
- Gestión de Clientes y MSA
- Gestión de Inventario

### **Usuario Cliente**
Acceso al Portal del Cliente:
- Enviar pedidos
- Rastrear pedidos
- Ver facturas y realizar pagos
- Descargar certificados y documentos

### **Conductor**
Acceso al Portal del Conductor:
- Ver entregas asignadas
- Actualizar estado de entrega
- Capturar firmas de entrega
- Completar entregas

## Primeros Pasos

### Acceder al Sistema

1. **Abrir la aplicación** en su navegador web
2. **Seleccionar su rol** desde el menú desplegable de usuario (arriba a la derecha)
3. **Elegir idioma** (Inglés/Español) desde el selector de idioma

### Navegación

- **Barra Superior**: Selección de idioma y rol
- **Navegación Lateral**: Acceso a módulos (dependiente del rol)
- **Encabezados de Página**: Acciones e información contextual

## Flujos de Trabajo Principales

### Flujo de Trabajo 1: Ciclo Completo de Pedido a Entrega

#### Paso 1: Crear un Pedido
1. Navegar a la página **Pedidos**
2. Hacer clic en **"Crear Pedido"**
3. Seleccionar cliente y productos
4. Elegir tipo de pedido (MSA u Orden de Compra)
5. Opcionalmente subir documento de PO del cliente
6. Enviar pedido

**Resultado**: Pedido creado con estado "Pendiente"

#### Paso 2: Confirmar Pedido
1. En la página **Pedidos**, encontrar su pedido
2. Hacer clic en **"Ver"** para ver detalles
3. Hacer clic en **"Confirmar Pedido"** (o usar el menú desplegable de estado)
4. Opcionalmente generar PDF de Orden de Compra

**Resultado**: El estado del pedido cambia a "Confirmado"

#### Paso 3: Iniciar Producción
1. Navegar a la página **Producción**
2. Encontrar su pedido en la pestaña "Programa de Producción"
3. Hacer clic en **"Iniciar Producción"**

**Resultado**: El estado del pedido cambia a "En Producción"

#### Paso 4: Completar Producción y Enviar a QC
1. En la página **Producción**, ir a la pestaña "En Producción"
2. Hacer clic en **"Completar Producción → Enviar a QC"**

**Resultado**: El estado del pedido cambia a "QC"

#### Paso 5: Pruebas de Control de Calidad
1. Navegar a la página **Control de Calidad**
2. Encontrar su pedido en la sección "Pedidos que Requieren Pruebas de QC"
3. Hacer clic en **"Crear Prueba"** (si aún no se creó)
4. Hacer clic en el botón **"Ingresar Resultados"**
5. En el modal, hacer clic en **"Aprobar Prueba"** o **"Rechazar Prueba"**
6. La prueba se aprueba automáticamente y se genera el certificado

**Resultado**: 
- Estado de la Prueba de QC: "Aprobada"
- Certificado generado y descargable
- El estado del pedido cambia automáticamente a "Listo"

#### Paso 6: Despachar Pedido
1. Navegar a la página **Pedidos**
2. Encontrar su pedido "Listo"
3. Hacer clic en el botón **"Despachar"**
4. Seleccionar camión y conductor disponibles
5. Confirmar despacho

**Resultado**: 
- Registro de entrega creado
- Estado del pedido: "Despachado"
- Estado del camión: "Asignado"

#### Paso 7: Confirmación de Entrega (Administrador o Conductor)
**Opción A - Administrador (Página de Logística):**
1. Navegar a la página **Logística**
2. Seleccionar la entrega
3. Hacer clic en **"Marcar como En Tránsito"** (si es necesario)
4. Hacer clic en **"Confirmar Entrega y Capturar Firma"**
5. Completar detalles del firmante
6. Dibujar firma en el lienzo
7. Opcionalmente subir foto
8. Confirmar entrega

**Opción B - Conductor (Portal del Conductor):**
1. Cambiar rol a **"Conductor"**
2. Navegar al **Portal del Conductor**
3. Encontrar entrega asignada
4. Hacer clic en **"Marcar En Tránsito"** → **"Marcar Llegado al Sitio"**
5. Hacer clic en **"Confirmar Entrega"**
6. Capturar firma y completar

**Resultado**: 
- Estado de entrega: "Entregado"
- Firma y prueba almacenadas
- Factura generada automáticamente
- Estado del pedido: "Entregado"

#### Paso 8: Generar Factura
1. Navegar a la página **Facturación**
2. Encontrar el pedido entregado
3. La factura ya está generada automáticamente
4. Hacer clic en **"Ver"** para ver detalles de la factura
5. Descargar PDF de la factura

**Resultado**: Factura lista para el cliente

---

### Flujo de Trabajo 2: Producir a Inventario (Gestión de Stock)

1. Navegar a la página **Producción**
2. Hacer clic en el botón **"Producir a Inventario"**
3. Seleccionar producto, cantidad y ubicación
4. Ingresar número de lote
5. Enviar

**Resultado**: 
- Inventario actualizado directamente
- No se requiere pedido de cliente
- Stock disponible para pedidos futuros

---

### Flujo de Trabajo 3: Portal del Cliente - Enviar y Rastrear Pedido

1. Cambiar rol a **"Usuario Cliente"**
2. Navegar al **Portal del Cliente**
3. Seleccionar su cliente del menú desplegable
4. Ir a la pestaña **"Enviar Pedido"**
5. Completar detalles del pedido (producto, cantidad, ubicación, fecha)
6. Opcionalmente subir PO del cliente
7. Enviar pedido

**Resultado**: Pedido creado y visible en la pestaña "Pedidos"

**Para Rastrear:**
1. Ir a la pestaña **"Pedidos"** en el Portal del Cliente
2. Ver todos sus pedidos con estado en tiempo real
3. Hacer clic en el pedido para ver detalles
4. Descargar documentos (POs, certificados)

**Para Pagar Factura:**
1. Ir a la pestaña **"Facturas y Pagos"**
2. Encontrar la factura
3. Hacer clic en **"Pagar Ahora"**
4. Completar formulario de pago simulado

---

### Flujo de Trabajo 4: Portal del Conductor - Completar Entrega

1. Cambiar rol a **"Conductor"**
2. Navegar al **Portal del Conductor**
3. Ver todas las entregas asignadas
4. Hacer clic en una entrega para ver detalles
5. Hacer clic en **"Marcar En Tránsito"** al salir del almacén
6. Hacer clic en **"Marcar Llegado al Sitio"** al llegar al destino
7. Hacer clic en **"Confirmar Entrega"**
8. Completar nombre y cargo del firmante del cliente
9. Dibujar firma en el lienzo
10. Confirmar

**Resultado**: 
- Entrega completada
- Firma capturada
- Factura generada automáticamente
- Informe de trazabilidad disponible

---

## Páginas y Características Principales

### Panel de Control
- **Métricas**: Ingresos, pedidos, entregas, tasa de aprobación de QC
- **Gráficos**: Tendencias de ingresos, distribución de estado de pedidos, producción por producto
- **Actividad Reciente**: Últimos pedidos, entregas, pruebas de QC, facturas
- **Capacidad de Producción**: Utilización actual

### Página de Pedidos
- **Filtrar por Cliente**: Menú desplegable para filtrar pedidos
- **Gestión de Estado**: Actualizar estado del pedido a través del flujo de trabajo
- **Despacho**: Asignar camiones y conductores
- **Generación de PO**: Descargar PDFs de Órdenes de Compra
- **Ver POs Subidos**: Acceder a documentos proporcionados por el cliente

### Página de Control de Calidad
- **Pedidos que Requieren QC**: Lista de pedidos que necesitan pruebas
- **Crear Prueba**: Vincular prueba a pedido y producto
- **Flujo de Trabajo Aprobar/Rechazar**: Interfaz de prueba simplificada
- **Descarga de Certificado**: Certificados PDF con resultados de prueba completos
- **Historial de Pruebas**: Ver todas las pruebas completadas

### Página de Producción
- **Pestañas**: Programa de Producción, En Producción, Cola de QC, Listo para Despacho
- **Seguimiento Visual**: Ver pedidos en cada etapa
- **Acciones Iniciar/Completar**: Mover pedidos a través de la producción
- **Producir a Inventario**: Producción de stock directa

### Página de Logística
- **Mapa en Vivo**: Seguimiento GPS con visualización de ruta
- **Tarjetas de Entrega**: Hacer clic para ver detalles
- **Filtros de Estado**: Filtrar por estado de entrega
- **Asignar Camión**: Asignar vehículos a pedidos listos
- **Confirmación de Entrega**: Capturar firmas y fotos
- **Informes de Trazabilidad**: Descargar PDFs de entrega completos

### Página de Facturación
- **Lista de Facturas**: Todas las facturas con estado de pago
- **Auto-Generación**: Facturas creadas al confirmar entrega
- **Registro de Pagos**: Rastrear pagos de clientes
- **Métricas**: DSO, montos pendientes
- **PDFs de Facturas**: Descargar facturas

### Página de Inventario
- **Niveles de Stock**: Por producto y ubicación
- **Cantidades Reservadas**: De pedidos activos
- **Stock Disponible**: Total menos reservado
- **Actualizaciones en Tiempo Real**: Refleja producción y pedidos

### Portal del Cliente
- **Selector de Cliente**: Filtrar datos por cliente
- **Enviar Pedidos**: Formulario simple de creación de pedidos
- **Rastrear Pedidos**: Estado en tiempo real con descarga de documentos
- **Facturas y Pagos**: Ver y pagar facturas
- **Certificados y Documentos**: Descargar todos los documentos relacionados

### Portal del Conductor
- **Entregas Asignadas**: Solo entregas para el conductor actual
- **Actualizaciones de Estado**: Marcar en tránsito, llegado, entregado
- **Captura de Firma**: Firma electrónica en la entrega
- **Información de Ruta**: Ubicación y detalles de entrega

---

## Generación de Documentos

El sistema genera varios documentos PDF:

### 1. **Orden de Compra (PO)**
- Generada desde la página de Pedidos
- Incluye detalles del pedido, productos, precios, términos
- Información y marca de la empresa

### 2. **Certificado de QC**
- Generado automáticamente cuando la prueba pasa
- Resultados de prueba completos que incluyen:
  - Análisis de tamiz
  - Redondez y esfericidad
  - Densidad aparente
  - Resistencia a la trituración
  - Solubilidad en ácido
  - Turbidez
  - Contenido de humedad
- Certificaciones ISO y cumplimiento de estándares

### 3. **Acuerdo de Servicio Maestro (MSA)**
- Generado desde las páginas de Clientes o MSA
- Términos del contrato, precios, período de validez
- Información de la empresa y del cliente

### 4. **Informe de Trazabilidad**
- Generado desde la página de Logística para pedidos entregados
- Línea de tiempo completa de entrega
- Puntos de control con coordenadas GPS
- Información de firma
- Prueba de entrega

### 5. **Factura**
- Generada automáticamente al confirmar entrega
- Incluye todos los detalles del pedido
- Términos e instrucciones de pago
- Prueba de entrega adjunta

---

## Gestión de Datos

### Datos Maestros

**Clientes**
- Crear y gestionar registros de clientes
- Ver pedidos asociados e ingresos
- Generar MSAs

**Productos**
- Catálogo de productos con especificaciones
- Tamaños de malla y propiedades
- Información de precios

**Camiones y Conductores**
- Gestión de flota
- Asignaciones de conductores
- Seguimiento de mantenimiento
- Monitoreo de estado

**MSAs (Acuerdos de Servicio Maestro)**
- Gestión de contratos
- Acuerdos de precios
- Períodos de validez
- Generar PDFs de MSA

### Configuración
- Capacidad de producción
- Información de la empresa
- Valores predeterminados de QC
- Parámetros del sistema

---

## Flujos de Trabajo de Estado

### Flujo de Estado del Pedido
```
Pendiente → Confirmado → En Producción → QC → Listo → Despachado → Entregado → Completado → Facturado
```

### Flujo de Estado de Entrega
```
Asignado → En Tránsito → Llegado → Entregado
```

### Flujo de Estado de Prueba de QC
```
Pendiente → En Progreso → Aprobada/Rechazada
```

### Estado de Pago de Factura
```
Pendiente → Pagada / Vencida
```

---

## Mejores Prácticas

### Para Administradores

1. **Creación de Pedidos**
   - Siempre verificar información del cliente y producto
   - Subir PO del cliente si se proporciona
   - Usar precios de MSA cuando estén disponibles

2. **Control de Calidad**
   - Crear pruebas inmediatamente cuando el pedido llegue a la etapa de QC
   - Revisar resultados de prueba antes de aprobar
   - Asegurar que el certificado se genere antes del despacho

3. **Despacho**
   - Verificar que existe el certificado de QC
   - Verificar disponibilidad de camión y conductor
   - Confirmar dirección de entrega

4. **Confirmación de Entrega**
   - Siempre capturar firma
   - Tomar fotos cuando sea posible
   - Verificar que todos los puntos de control estén registrados

### Para Clientes

1. **Envío de Pedidos**
   - Proporcionar cantidades y ubicaciones precisas
   - Subir documento de PO si se requiere
   - Especificar fechas de entrega claramente

2. **Rastreo**
   - Revisar la pestaña "Pedidos" regularmente
   - Descargar certificados cuando estén disponibles
   - Revisar facturas oportunamente

3. **Pagos**
   - Pagar facturas a través del portal
   - Mantener registros de pago
   - Contactar soporte para problemas

### Para Conductores

1. **Pre-Entrega**
   - Revisar entregas asignadas
   - Verificar direcciones de entrega
   - Verificar camión y ruta

2. **Durante la Entrega**
   - Actualizar estado al salir del almacén
   - Marcar llegada al sitio
   - Capturar firma antes de salir

3. **Post-Entrega**
   - Confirmar finalización de entrega
   - Verificar que la firma se capturó
   - Reportar cualquier problema

---

## Notas Técnicas

### Configuración del Entorno
- Requiere conexión backend de Supabase
- Variables de entorno para claves API
- Bucket de almacenamiento para carga de documentos

### Compatibilidad del Navegador
- Navegadores modernos (Chrome, Firefox, Edge, Safari)
- Diseño responsivo para tablets
- Interfaz amigable para móviles

### Rendimiento
- Actualizaciones de datos en tiempo real
- Consultas optimizadas
- Generación eficiente de PDFs
- Carga rápida de páginas

---

## Soporte y Contacto

Para preguntas o problemas:
- Revisar esta documentación
- Verificar estado del sistema
- Contactar al administrador del sistema

---

## Información de Versión

**Versión del Prototipo**: 1.0
**Última Actualización**: Enero 2026
**Estado**: Prototipo Funcional

---

*Esta documentación cubre la versión prototipo del Sistema de Gestión de Proceso de Arena. Las características y flujos de trabajo pueden actualizarse según comentarios y requisitos.*

