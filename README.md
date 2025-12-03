# 🦠 COVID-19 Rewind – Interactive Data Visualizer
Análisis interactivo y visual de la evolución mundial de la pandemia COVID-19, combinando datos epidemiológicos, demográficos, vacunación y modelos ligeros de Machine Learning.

---

## 📌 Descripción del problema
Durante la pandemia de COVID-19 se generó una enorme cantidad de datos provenientes de múltiples fuentes (epidemiológicos, vacunación, demografía, movilidad…). Sin embargo:

- Estaban dispersos y requerían conocimiento técnico para integrarlos.
- No existía una interfaz clara, moderna e intuitiva para visualizar tendencias globales.
- Comparar países, estudiar impacto de la vacunación o analizar patrones requería herramientas avanzadas.

**COVID-19 Rewind nace para centralizar y transformar estos datos en visualizaciones accesibles, comprensibles y atractivas.**

---

## 🎯 Objetivos principales

1. **Unificar datasets internacionales** en un formato limpio y procesado listo para ser consumido por el frontend.
2. **Diseñar una plataforma web moderna**, con apariencia profesional y experiencia fluida.
3. **Explorar visualmente la evolución de la pandemia** mediante:
   - Mapa global animado por fechas.
   - Series temporales detalladas por país.
   - Cruces entre vacunación e incidencia.
   - Perfiles sanitarios de cada país.
4. **Aplicar modelos ligeros de Machine Learning** para:
   - Predecir tendencias a corto plazo.
   - Clusterizar países por patrones similares.
5. **Crear visualizaciones originales y didácticas** que permitan al usuario responder preguntas como:
   - ¿Cuándo empezaron las olas en cada país?
   - ¿Cómo afecta la vacunación a la incidencia?
   - ¿Qué países tienen perfiles pandémicos semejantes?

---

## 🧩 Plan inicial de trabajo

### **Fase 1 — Preparación de datos (Backend con Python)**
- Recolección de datasets epidemiológicos, vacunación y demografía.
- Limpieza, normalización y unificación de códigos de país.
- Cálculo de métricas clave (casos por 100k MA7, vacunación %, fatalidad…).
- Generación de archivos JSON optimizados para el frontend.

### **Fase 2 — Arquitectura del frontend (React + TypeScript)**
- Estructura inicial del proyecto.
- Routing de secciones: mapa global, insights, forecast, perfiles, clustering.
- Diseño base común (tema claro profesional, tipografías, layout principal).

### **Fase 3 — Visualizaciones principales**
- **Mapa global animado** con slider temporal + leyenda dinámica.
- **Time series por país** con selector de métricas.
- **Vaccination vs impact** con scatter plot interactivo.
- **Country profile** con tarjeta resumen.
- **ML forecast** con regresión lineal de corto plazo.

### **Fase 4 — Machine Learning y analíticas**
- Implementación de modelos ML: regresión + k-means.
- Creación de scripts independientes para recálculo rápido.
- Generación de JSON de clusters y predicciones.

### **Fase 5 — Mejoras de UX/UI**
- Animaciones de entrada.
- Carrousel de visualizaciones destacadas.
- Componentes reutilizables y diseño más limpio.
- Optimización de responsividad en pantallas pequeñas.

### **Fase 6 — Documentación y entrega**
- README estructurado con descripción, objetivos y plan.
- Capturas del dashboard.
- Explicación breve de visualizaciones y modelos.

---

## 🛠️ Stack tecnológico

- **Frontend:** React + TypeScript + Recharts + react-simple-maps  
- **Backend:** Python + Pandas + NumPy + Scikit-learn  
- **Datos:** ECDC / OWID procesados  
- **Estilo:** CSS modular minimalista con diseño moderno  



