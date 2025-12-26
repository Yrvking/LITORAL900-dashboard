# 📊 LITORAL 900 - Dashboard de Control de Calidad

Sistema avanzado de análisis y visualización de observaciones para proyectos inmobiliarios. Diseñado específicamente para LITORAL 900 con colores gerenciales, estadísticas detalladas y actualización automática de datos.

---

## ✨ Características Principales

### 📈 Análisis Avanzado de Datos
- **KPIs Ejecutivos**: Total observaciones, hallazgos críticos, efectividad de cierre, índice de criticidad
- **Métricas Detalladas**: Observaciones iniciadas, abiertas, cerradas, de alta prioridad
- **Indicadores de Rendimiento**: Días promedio abiertos, cantidad de responsables
- **Análisis de Pareto**: Top especialidades que causan más problemas

### 🗺️ Ubicaciones y Departamentos
- **Mapa de Calor Vertical**: Distribución de problemas por piso/nivel
- **Análisis por Departamento**: Visualización de áreas más afectadas
- **Código de Torre y Piso**: Identificación precisa de ubicaciones
- **Clasificación por Zona**: Análisis geográfico del proyecto

### 📊 Visualizaciones Profesionales
- **Gráficos de Barras**: Partidas, especialidades, departamentos
- **Gráficos Circulares**: Distribución de estados y prioridades
- **Gráficos de Área**: Velocidad de obra (creación vs cierre)
- **Tablas Detalladas**: Desglose completo de hallazgos con filtros

### 🎨 Diseño Gerencial
- **Colores Corporativos**: Navy oscuro (#0f172a), dorado (#d97706), emerald, rose
- **Interfaz Web Moderna**: Responsive, limpia y profesional
- **Tipografía Ejecutiva**: Fuentes modernas y legibles
- **Efectos Visuales**: Transiciones suaves, hover effects, animaciones

### 📥 Actualización Automática de CSV
- **Carga Directa de Archivos**: Sube tu CSV desde Procore sin procesamiento
- **Auto-Análisis**: El dashboard procesa y analiza automáticamente
- **Datos en Tiempo Real**: Actualización inmediata al cargar nuevo archivo
- **Soporte Múltiples Formatos**: Compatible con exportaciones estándar de Procore

---

## 🚀 Instalación y Uso

### Opción 1: Usar el HTML (Recomendado - Sin instalación)

1. **Descarga el archivo**: `Dashboard_Litoral900.html`
2. **Doble-click** para abrir en tu navegador
3. **Carga el CSV**: Haz click en "Cargar CSV" o arrastra tu archivo
4. **¡Listo!**: El dashboard se actualizará automáticamente

### Opción 2: Usar con React (Para desarrollo)

Si estás usando un proyecto React:

```bash
# Copia el archivo Dashboard_Procore_Advanced.js a tu carpeta src/components/
cp Dashboard_Procore_Advanced.js src/components/

# En tu archivo principal, importa el componente:
import DashboardProcoreAdvanced from './components/Dashboard_Procore_Advanced';

# Y úsalo en tu aplicación:
<DashboardProcoreAdvanced />
```

### Opción 3: Con Node.js / Webpack

```bash
# Instala las dependencias necesarias:
npm install react react-dom recharts lucide-react

# Luego importa y usa el componente como en Opción 2
```

---

## 📋 Formato del CSV Esperado

El dashboard espera un CSV con las siguientes columnas:

```
Número,Tipo,Especialidad,Título,Persona asignada,Compañía de la persona asignada,Fecha de notificación,Estatus,Prioridad,Ubicación
```

### Descripción de Campos:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Número** | ID de la observación | 428 |
| **Tipo** | Clasificación de la observación | Deficiencia, Seguridad, Acabados, Eléctrico |
| **Especialidad** | Código de partida y especialidad | 110 - PRO - Control de Calidad |
| **Título** | Descripción breve del problema | Conexiones firmes y sin fugas |
| **Persona asignada** | Nombre del responsable | Edwin Aroni |
| **Compañía de la persona asignada** | Empresa asignada | ARONI |
| **Fecha de notificación** | Fecha del hallazgo | 26/12/25 |
| **Estatus** | Estado actual | Iniciado, Abierto, Cerrado, Listo para revisión |
| **Prioridad** | Nivel de urgencia | Urgent, High, Medium, Low |
| **Ubicación** | Ubicación en la estructura | TORRE>PISO 14>DPTO 1401 |

### Formato de Ubicación:
```
TORRE>PISO 14>DPTO 1401
TORRE>SOTANO 1
TORRE>PISO 05
```

### Estados Válidos:
- `Iniciado` - En proceso
- `Abierto` - Requiere atención inmediata
- `Cerrado` - Completado
- `Listo para revisión` - Pendiente de aprobación

### Prioridades Válidas:
- `Urgent` - Crítico/Rojo
- `High` - Alto/Naranja
- `Medium` - Medio/Azul
- `Low` - Bajo/Gris

---

## 📊 Filtros y Controles

### Filtros Disponibles:
- **Por Tipo**: Todos, Deficiencia, Seguridad, Acabados, Eléctrico, Sanitario, Estructural
- **Por Prioridad**: Todas, Urgent, High, Medium, Low

### Acciones:
- **Cargar CSV**: Actualiza los datos del dashboard
- **Auto-Refresh**: Actualización automática cada minuto (experimental)
- **Exportar Reporte**: Descarga los datos en Excel/PDF (en desarrollo)

---

## 📈 Interpretación de Gráficos

### Distribución por Nivel (Mapa de Calor)
- Barras rojas = Pisos/niveles con más problemas
- Barras grises = Pisos/niveles con pocos problemas
- Útil para identificar áreas de riesgo

### Estado de Observaciones (Pie Chart)
- **Verde**: Cerradas (completadas)
- **Naranja**: Iniciadas (en proceso)
- **Rojo**: Abiertas (críticas)
- **Azul**: Listas para revisión

### Top Especialidades (Pareto)
- **Barra Roja (1era)**: Especialidad que más impacta
- **Barras Azules (resto)**: Otras especialidades
- Útil para priorizar mejoras

### Velocidad de Obra (Área)
- **Línea negra**: Observaciones creadas
- **Línea verde**: Observaciones cerradas
- **Línea roja punteada**: Observaciones abiertas

---

## 🎯 Casos de Uso

### 1. Reunión Semanal de Obra
Carga el CSV de la semana y presenta:
- KPI de observaciones críticas
- Top 3 especialidades problémáticas
- Distribución por piso para enfoque de recursos

### 2. Seguimiento de Calidad
Identifica patrones de fallos usando:
- Gráfico de Pareto (qué causa más problemas)
- Mapa de calor vertical (dónde ocurren)
- Velocidad de obra (ritmo de cierre)

### 3. Reportes Ejecutivos
Genera reportes profesionales con:
- Efectividad de cierre (%)
- Índice de criticidad
- Tendencias por fecha
- Compañías responsables

### 4. Análisis de Responsables
Visualiza desempeño por:
- Persona asignada
- Compañía contratista
- Especialidad

---

## 🛠️ Configuración Avanzada

### Personalizar Colores

En el código JavaScript, busca la sección `THEME`:

```javascript
const THEME = {
    primary: '#0f172a',      // Cambiar color principal
    accent: '#d97706',       // Cambiar color de atención
    success: '#059669',      // Cambiar color de éxito
    danger: '#be123c',       // Cambiar color de riesgo
    // ... más colores
};
```

### Agregar Nuevos Tipos de Observación

En la función `parseCSV`, modifica `tipoMap`:

```javascript
const tipoMap = {
    'Deficiencia': 'Deficiencia',
    'Seguridad': 'Seguridad',
    'TuNuevoTipo': 'Tu Nuevo Tipo',  // Agregar aquí
};
```

### Cambiar Límites de Datos

Para cambiar el número de registros en tablas o gráficos:

```javascript
// En gráficos
.slice(0, 8)  // Cambia 8 por el número que desees

// En tablas detalladas
.slice(0, 15) // Muestra 15 registros, cambia según necesites
```

---

## 🔧 Solución de Problemas

### El dashboard no carga
- Verifica que estés usando un navegador moderno (Chrome, Firefox, Edge)
- Limpia la caché del navegador
- Abre la consola (F12) y revisa si hay errores

### El CSV no se procesa correctamente
- Verifica que el archivo esté en formato UTF-8
- Comprueba que los nombres de columnas coincidan exactamente
- Asegúrate de que las fechas usen formato DD/MM/YY

### Los gráficos no se ven
- Aumenta la ventana del navegador
- Recarga la página (F5)
- Verifica que JavaScript esté habilitado

### Auto-refresh no funciona
- Esta es una función experimental
- El auto-refresh requiere que un servidor suministre los datos nuevos
- Para producción, considera integrar una API

---

## 📱 Compatibilidad

| Navegador | Soporte |
|-----------|---------|
| Chrome 90+ | ✅ Completo |
| Firefox 88+ | ✅ Completo |
| Edge 90+ | ✅ Completo |
| Safari 14+ | ✅ Completo |
| Mobile (iOS/Android) | ✅ Responsive |

---

## 📝 Estructura de Archivos

```
c:\Users\Yrving\Postman\
├── Dashboard_Litoral900.html          # 🎯 USAR ESTE (No requiere instalación)
├── Dashboard_Procore_Advanced.js       # Para proyectos React
├── Dashboard_Procore.js                # Versión anterior
└── README.md                           # Este archivo
```

---

## 🔐 Seguridad

- Todos los datos se procesan **localmente** en tu navegador
- **No se envía información** a servidores externos
- El archivo CSV se carga y procesa completamente en memoria
- **100% privado y seguro**

---

## 📞 Soporte y Mejoras

### Cambios Recientes (v2.0)
- ✅ Análisis avanzado de estadísticas
- ✅ Mapa de calor por ubicación/piso
- ✅ Colores gerenciales profesionales
- ✅ Actualización automática de CSV
- ✅ Interfaz responsive tipo web
- ✅ Más gráficos (Pareto, Distribuciones, Tendencias)

### Próximas Mejoras Planeadas
- 🔜 Exportar reportes a PDF/Excel
- 🔜 Integración con APIs de Procore
- 🔜 Auto-actualización de archivos
- 🔜 Dashboards personalizables
- 🔜 Comparativas multiperíodo
- 🔜 Alertas automáticas de críticos

---

## 📄 Licencia

Desarrollado específicamente para **LITORAL 900 - Mirano Inmobiliario**

---

## 📌 Notas Importantes

1. **Copia de Seguridad**: Guarda siempre tus archivos CSV originales
2. **Navegador Actualizado**: Usa una versión reciente del navegador
3. **JavaScript Habilitado**: El dashboard requiere JavaScript activo
4. **Resolución Óptima**: Se recomienda pantalla de 1920x1080 o superior para mejor visualización

---

**Versión**: 2.0  
**Última Actualización**: 26 de Diciembre, 2025  
**Desarrollado para**: LITORAL 900 - Proyecto Inmobiliario Miraflores
# LITORAL900-dashboard
