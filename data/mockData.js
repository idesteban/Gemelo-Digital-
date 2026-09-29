export const sensorData = [
  { id: 1, name: "Iluminación Inteligente", icon: "Lightbulb", value: 87, unit: "%", status: "online", description: "Luminarias LED activas en el barrio", trend: "+3.2%", trendUp: true },
  { id: 2, name: "Cámaras de Tráfico", icon: "Camera", value: 24, unit: "activas", status: "online", description: "Cámaras monitoreando intersecciones", trend: "0%", trendUp: true },
  { id: 3, name: "Consumo Eléctrico", icon: "Zap", value: 342, unit: "kWh", status: "warning", description: "Consumo actual del sector", trend: "+12.5%", trendUp: false },
  { id: 4, name: "Calidad del Aire", icon: "Wind", value: 68, unit: "AQI", status: "online", description: "Índice de calidad del aire", trend: "-5.1%", trendUp: true },
  { id: 5, name: "Flujo Vehicular", icon: "Car", value: 1285, unit: "veh/h", status: "online", description: "Vehículos por hora en vía principal", trend: "+8.0%", trendUp: false },
  { id: 6, name: "Temperatura", icon: "Thermometer", value: 18, unit: "°C", status: "online", description: "Temperatura ambiente promedio", trend: "-1.2°C", trendUp: true },
];

export const trafficChartData = [
  { hora: "06:00", vehiculos: 320, peatones: 150 }, { hora: "08:00", vehiculos: 890, peatones: 420 },
  { hora: "10:00", vehiculos: 650, peatones: 380 }, { hora: "12:00", vehiculos: 780, peatones: 510 },
  { hora: "14:00", vehiculos: 720, peatones: 340 }, { hora: "16:00", vehiculos: 950, peatones: 470 },
  { hora: "18:00", vehiculos: 1100, peatones: 520 }, { hora: "20:00", vehiculos: 680, peatones: 280 },
  { hora: "22:00", vehiculos: 350, peatones: 120 },
];

export const energyChartData = [
  { dia: "Lun", consumo: 285, solar: 95 }, { dia: "Mar", consumo: 310, solar: 88 },
  { dia: "Mié", consumo: 342, solar: 110 }, { dia: "Jue", consumo: 298, solar: 102 },
  { dia: "Vie", consumo: 365, solar: 78 }, { dia: "Sáb", consumo: 220, solar: 120 },
  { dia: "Dom", consumo: 180, solar: 135 },
];

export const alerts = [
  { id: 1, type: "critical", title: "Sobrecarga Eléctrica Detectada", description: "Sector 4-B supera el umbral de consumo en un 15%. Riesgo de falla en transformador.", time: "Hace 3 min", icon: "AlertTriangle" },
  { id: 2, type: "warning", title: "Predicción: Mantenimiento Luminaria", description: "La luminaria #47 en Cra 15 muestra degradación. Falla estimada en 72 horas.", time: "Hace 15 min", icon: "Clock" },
  { id: 3, type: "info", title: "Cámara #12 Reconectada", description: "La cámara de la Calle 80 con Av. 68 se ha reconectado exitosamente.", time: "Hace 28 min", icon: "CheckCircle" },
];

export const legalText = `De conformidad con la Ley 1581 de 2012 (Ley de Protección de Datos Personales)... \n\n**Responsable:** Equipo Proyecto Gemelo Digital.\n\n**Finalidad:** Uso exclusivamente con fines académicos y de simulación urbana.\n\n**Derechos del Titular:** Conocer, actualizar, rectificar y solicitar la supresión de sus datos.\n\n**Seguridad:** Medidas técnicas como cifrado AES-256 y control de acceso.`;

export const habeasDataFAQ = [
  { question: "¿Qué datos personales se recopilan en el Gemelo Digital?", answer: "Se recopilan datos de sensores urbanos como flujo vehicular. No se recopilan datos personales identificables." },
  { question: "¿Cómo se protegen los datos recopilados?", answer: "Mediante cifrado AES-256 en tránsito y en reposo, y control de acceso basado en roles." },
  { question: "¿Los datos pueden ser compartidos con terceros?", answer: "No. Los datos son de uso exclusivamente académico." },
];

export const securityChecklist = [
  { id: 1, control: "Cifrado de Datos (AES-256)", description: "Todos los datos en tránsito y en reposo están cifrados.", status: "completed", category: "Confidencialidad" },
  { id: 2, control: "Control de Acceso (RBAC)", description: "Sistema de roles y permisos implementado.", status: "completed", category: "Autenticación" },
  { id: 3, control: "Firewall y Monitoreo de Red", description: "Monitoreo activo 24/7 con alertas automáticas.", status: "completed", category: "Red" },
  { id: 4, control: "Respaldo y Recuperación", description: "Backups automáticos diarios documentados.", status: "pending", category: "Disponibilidad" },
  { id: 5, control: "Auditoría de Actividades", description: "Sistema de logs que registra todas las acciones.", status: "completed", category: "Trazabilidad" },
];

export const coevaluationFeedback = {
  title: "Mejora de Coevaluación", subtitle: "Feedback sobre Ética Informática",
  feedback: "Se recomendó agregar mecanismos de **transparencia algorítmica** para que los ciudadanos comprendan cómo se procesan sus datos y un 'botón de pánico' para la eliminación de datos.",
  improvements: ["Agregar panel de transparencia", "Mecanismo de eliminación inmediata", "Reportes públicos trimestrales"],
  evaluator: "Grupo B — Sección 10°", date: "Septiembre 2026", score: 4.2,
};

export const sustainabilityMetrics = [
  { id: 1, name: "Consumo Energético", value: 12.4, unit: "kWh/día", icon: "Server", color: "blue", target: 10 },
  { id: 2, name: "Huella de Carbono", value: 4.8, unit: "kg CO₂/mes", icon: "Cloud", color: "emerald", target: 3.5 },
  { id: 3, name: "Energía Renovable", value: 62, unit: "%", icon: "Leaf", color: "green", target: 80 },
  { id: 4, name: "Eficiencia del Código", value: 94, unit: "puntos", icon: "Code", color: "violet", target: 95 },
];

export const carbonFootprintData = [
  { mes: "Abr", emision: 6.2, objetivo: 5.0 }, { mes: "May", emision: 5.8, objetivo: 5.0 },
  { mes: "Jun", emision: 5.1, objetivo: 4.5 }, { mes: "Jul", emision: 4.9, objetivo: 4.5 },
  { mes: "Ago", emision: 4.8, objetivo: 4.0 }, { mes: "Sep", emision: 4.8, objetivo: 3.5 },
];

export const debateConclusions = [
  { title: "Optimización de Servidores", description: "Migrar a servidores Energy Star y reducir máquinas activas en un 30%.", icon: "Server" },
  { title: "Código Verde", description: "Minimizar peticiones de red y optimizar consultas a bases de datos.", icon: "Code" },
  { title: "Hosting Sostenible", description: "Proveedor con al menos 80% de energía renovable.", icon: "Globe" },
];
