// Motor de simulación del Gemelo Digital.
// Funciones puras: reciben el estado de las 6 variables del barrio y devuelven
// estados de sensores, series para los gráficos, índice de salud y alertas.
import { sensorData, trafficChartData, energyChartData } from "@/data/mockData";

// ---------------------------------------------------------------------------
// Configuración de cada variable controlable (se une con sensorData por id)
// zones: tramos del slider y su estado; el último tramo cubre hasta `max`.
// ---------------------------------------------------------------------------
const SIM_CONFIG = {
  1: {
    key: "iluminacion", min: 0, max: 100, step: 1, decimals: 0,
    control: "Intensidad de luminarias",
    better: "higher",
    zones: [{ to: 25, status: "critical" }, { to: 50, status: "warning" }, { to: 100, status: "online" }],
  },
  2: {
    key: "camaras", min: 0, max: 40, step: 1, decimals: 0,
    control: "Cámaras en línea",
    better: "higher",
    zones: [{ to: 8, status: "critical" }, { to: 16, status: "warning" }, { to: 40, status: "online" }],
  },
  3: {
    key: "consumo", min: 150, max: 500, step: 1, decimals: 0,
    control: "Demanda del sector",
    better: "lower",
    zones: [{ to: 330, status: "online" }, { to: 430, status: "warning" }, { to: 500, status: "critical" }],
  },
  4: {
    key: "aire", min: 0, max: 300, step: 1, decimals: 0,
    control: "Índice AQI",
    better: "lower",
    zones: [{ to: 100, status: "online" }, { to: 150, status: "warning" }, { to: 300, status: "critical" }],
  },
  5: {
    key: "flujo", min: 0, max: 3000, step: 5, decimals: 0,
    control: "Vehículos por hora",
    better: "lower",
    zones: [{ to: 1700, status: "online" }, { to: 2300, status: "warning" }, { to: 3000, status: "critical" }],
  },
  6: {
    key: "temperatura", min: 0, max: 35, step: 0.5, decimals: 1,
    control: "Temperatura ambiente",
    better: "ideal", ideal: 18,
    zones: [
      { to: 5, status: "critical" }, { to: 10, status: "warning" }, { to: 25, status: "online" },
      { to: 29, status: "warning" }, { to: 35, status: "critical" },
    ],
  },
};

// "Ayer" se deduce de la tendencia original de mockData, así al cargar
// la tarjeta muestra exactamente el mismo +3.2%, 0%, +12.5%… de siempre.
function parseYesterday(sensor) {
  const n = parseFloat(sensor.trend);
  if (sensor.trend.trim().endsWith("%")) return sensor.value / (1 + n / 100);
  return sensor.value - n;
}

export const SENSORS = sensorData.map((s) => ({
  ...s,
  ...SIM_CONFIG[s.id],
  base: s.value,
  yesterday: parseYesterday(s),
  trendKind: s.trend.trim().endsWith("%") ? "pct" : "abs",
}));

export const SENSOR_BY_KEY = Object.fromEntries(SENSORS.map((s) => [s.key, s]));
export const BASE_VALUES = Object.fromEntries(SENSORS.map((s) => [s.key, s.base]));

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const sum = (arr) => arr.reduce((a, b) => a + b, 0);

export function snap(key, value) {
  const s = SENSOR_BY_KEY[key];
  const stepped = Math.round(value / s.step) * s.step;
  return clamp(Number(stepped.toFixed(s.decimals)), s.min, s.max);
}

export function formatNumber(value, decimals = 0, minDecimals = decimals) {
  return value.toLocaleString("en-US", { minimumFractionDigits: minDecimals, maximumFractionDigits: decimals });
}

// Valor de un sensor: 18 °C se muestra "18" y 18.5 °C "18.5".
export function formatValue(key, value) {
  return formatNumber(value, SENSOR_BY_KEY[key].decimals, 0);
}

export function statusFor(key, value) {
  const { zones } = SENSOR_BY_KEY[key];
  return (zones.find((z) => value < z.to) ?? zones[zones.length - 1]).status;
}

export const STATUS_META = {
  online: { label: "Online", color: "#10b981", dot: "bg-emerald-400", text: "text-emerald-400" },
  warning: { label: "Warning", color: "#f59e0b", dot: "bg-amber-400", text: "text-amber-400" },
  critical: { label: "Critical", color: "#ef4444", dot: "bg-red-500", text: "text-red-400" },
};

// Tendencia vs. ayer: flecha = dirección real, color = si el cambio es bueno.
export function trendFor(sensor, value) {
  const { yesterday, trendKind, better, ideal } = sensor;
  const diff = value - yesterday;
  let text;
  if (trendKind === "pct") {
    const pct = yesterday === 0 ? 0 : (diff / yesterday) * 100;
    text = Math.abs(pct) < 0.05 ? "0%" : `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;
  } else {
    text = Math.abs(diff) < 0.05 ? `0${sensor.unit}` : `${diff > 0 ? "+" : ""}${diff.toFixed(1)}${sensor.unit}`;
  }
  const flat = text.startsWith("0");
  let good;
  if (better === "higher") good = diff >= 0;
  else if (better === "lower") good = diff <= 0;
  else good = Math.abs(value - ideal) <= Math.abs(yesterday - ideal);
  return { text, direction: flat ? "flat" : diff > 0 ? "up" : "down", good: flat || good };
}

export function buildSensors(values) {
  return SENSORS.map((s) => {
    const value = values[s.key];
    return { ...s, value, status: statusFor(s.key, value), trend: trendFor(s, value) };
  });
}

// ---------------------------------------------------------------------------
// Acoplamiento del gemelo: mover una variable "causa" arrastra a las variables
// "efecto" (consumo y aire). Cada regla devuelve el delta del objetivo.
// ---------------------------------------------------------------------------
export const COUPLINGS = {
  iluminacion: [
    { target: "consumo", reason: "carga del alumbrado", effect: (a, b) => (b - a) * 0.9 },
  ],
  camaras: [
    { target: "consumo", reason: "red de videovigilancia", effect: (a, b) => (b - a) * 0.6 },
  ],
  flujo: [
    { target: "aire", reason: "emisiones vehiculares", effect: (a, b) => (b - a) * 0.025 },
  ],
  temperatura: [
    // Frío -> calefacción, calor -> ventilación: el consumo sube al alejarse de 18 °C.
    { target: "consumo", reason: "climatización", effect: (a, b) => (Math.abs(b - 18) - Math.abs(a - 18)) * 4 },
    // El calor favorece la formación de ozono.
    { target: "aire", reason: "formación de ozono", effect: (a, b) => (Math.max(0, b - 18) - Math.max(0, a - 18)) * 1.8 },
  ],
};

// ---------------------------------------------------------------------------
// Contexto: clima de Bogotá y franja horaria
// temp: ajuste sobre la temperatura típica de la franja · solar/peat/speed: factores
// vis: visibilidad para las cámaras de seguridad
// ---------------------------------------------------------------------------
export const CLIMAS = [
  { id: "soleado", name: "Soleado", icon: "Sun", temp: 3, solar: 1.15, peat: 1.1, speed: 1, vis: 1, clouds: 1 },
  { id: "parcial", name: "Parcialmente nublado", icon: "CloudSun", temp: 0, solar: 1, peat: 1, speed: 1, vis: 1, clouds: 3 },
  { id: "nublado", name: "Nublado", icon: "Cloud", temp: -1, solar: 0.7, peat: 0.95, speed: 1, vis: 0.95, clouds: 7 },
  { id: "llovizna", name: "Llovizna", icon: "CloudDrizzle", temp: -2, solar: 0.55, peat: 0.8, speed: 0.9, vis: 0.88, clouds: 7, rain: 0.45 },
  { id: "aguacero", name: "Aguacero", icon: "CloudRain", temp: -4, solar: 0.35, peat: 0.5, speed: 0.65, vis: 0.72, clouds: 8, rain: 1 },
  { id: "granizada", name: "Granizada", icon: "CloudHail", temp: -7, solar: 0.3, peat: 0.35, speed: 0.5, vis: 0.7, clouds: 8, hail: true },
  { id: "niebla", name: "Niebla", icon: "CloudFog", temp: -3, solar: 0.5, peat: 0.85, speed: 0.75, vis: 0.55, clouds: 0, fog: true },
];

export const FRANJAS = [
  { id: "madrugada", name: "Madrugada", range: "00:00 – 05:59", icon: "MoonStar", baseTemp: 8, flujo: 250, dark: true, risk: 1.35, hours: [] },
  { id: "manana", name: "Mañana", range: "06:00 – 11:59", icon: "Sunrise", baseTemp: 14, flujo: 1550, dark: false, risk: 0.8, hours: ["06:00", "10:00"] },
  { id: "tarde", name: "Tarde", range: "12:00 – 17:59", icon: "Sun", baseTemp: 19, flujo: 1150, dark: false, risk: 0.85, hours: ["12:00", "16:00"] },
  { id: "noche", name: "Noche", range: "18:00 – 23:59", icon: "Moon", baseTemp: 12, flujo: 900, dark: true, risk: 1.2, hours: ["18:00", "22:00"] },
];

export const DEFAULT_CONTEXT = { clima: "parcial", franja: "noche" };
export const climaById = (id) => CLIMAS.find((c) => c.id === id) ?? CLIMAS[1];
export const franjaById = (id) => FRANJAS.find((f) => f.id === id) ?? FRANJAS[3];

// Seguridad ciudadana medida por la red de cámaras: cobertura × visibilidad
// (luz y clima) + iluminación, corregida por el riesgo de la franja horaria.
export function computeSecurity(v, climaId, franjaId) {
  const c = climaById(climaId);
  const f = franjaById(franjaId);
  const light = f.dark ? v.iluminacion / 100 : 1;
  const visibility = c.vis * (f.dark ? 0.55 + 0.45 * light : 1);
  const coverage = clamp(v.camaras / 32, 0, 1);
  const vision = coverage * visibility;
  const raw = 100 * (0.55 * vision + 0.45 * light);
  const score = Math.round(clamp(raw + (1 - f.risk) * 40, 0, 100));
  return {
    score,
    coverage: Math.round(coverage * 100),
    visibility: Math.round(visibility * 100),
    incidents: Math.max(0, Math.round((100 - score) / 11)),
    ...healthLabel(score),
  };
}

// ---------------------------------------------------------------------------
// Escenarios predefinidos
// ---------------------------------------------------------------------------
export const SCENARIOS = [
  { id: "base", name: "Día normal", icon: "Sun", description: "Valores de referencia del barrio", values: BASE_VALUES },
  { id: "pico", name: "Hora pico", icon: "CarFront", description: "Salida de oficinas: vías cargadas y más emisiones",
    values: { iluminacion: 87, camaras: 24, consumo: 398, aire: 118, flujo: 2150, temperatura: 20 } },
  { id: "sincarro", name: "Día sin carro", icon: "Bike", description: "Jornada distrital: bicis y peatones toman la calle",
    values: { iluminacion: 80, camaras: 24, consumo: 290, aire: 32, flujo: 260, temperatura: 17 } },
  { id: "noche", name: "Noche segura", icon: "Moon", description: "Iluminación y videovigilancia al máximo",
    values: { iluminacion: 100, camaras: 38, consumo: 372, aire: 55, flujo: 420, temperatura: 11 } },
  { id: "calor", name: "Ola de calor", icon: "Flame", description: "Temperaturas récord, ozono y demanda eléctrica disparados",
    values: { iluminacion: 70, camaras: 24, consumo: 455, aire: 165, flujo: 1400, temperatura: 30 } },
  { id: "eco", name: "Modo eco", icon: "Leaf", description: "Atenuación inteligente y movilidad sostenible",
    values: { iluminacion: 60, camaras: 30, consumo: 235, aire: 45, flujo: 900, temperatura: 18 } },
  { id: "apagon", name: "Falla de red", icon: "ZapOff", description: "Apagón en el sector 4-B: el barrio queda a oscuras",
    values: { iluminacion: 12, camaras: 5, consumo: 160, aire: 70, flujo: 1300, temperatura: 18 } },
];

// ---------------------------------------------------------------------------
// Gráfico de tráfico (vehículos y peatones por hora)
// ---------------------------------------------------------------------------
const NIGHT_WEIGHT = { "06:00": 0.6, "18:00": 0.5, "20:00": 1, "22:00": 1 };
const BASE_VEH_MEAN = sum(trafficChartData.map((d) => d.vehiculos)) / trafficChartData.length;

export function trafficFactors(v) {
  const base = BASE_VALUES;
  return {
    volume: v.flujo / base.flujo,
    // Más cámaras = semáforos adaptativos = picos más suaves (el total se conserva).
    peak: clamp(1 - (0.45 * (v.camaras - base.camaras)) / 40, 0.55, 1.35),
    temp: clamp(1 - 0.03 * Math.max(0, Math.abs(v.temperatura - 18) - 2), 0.35, 1),
    air: v.aire <= base.aire
      ? 1 + (0.12 * (base.aire - v.aire)) / base.aire
      : clamp(1 - (0.55 * (v.aire - base.aire)) / 232, 0.45, 1),
    cars: clamp(1 - (0.18 * (v.flujo - base.flujo)) / base.flujo, 0.75, 1.2),
    light: 0.5 + 0.5 * (v.iluminacion / base.iluminacion),
  };
}

export function buildTrafficData(v, climaId = DEFAULT_CONTEXT.clima) {
  const f = trafficFactors(v);
  const weather = climaById(climaId).peat;
  return trafficChartData.map((d) => {
    const w = NIGHT_WEIGHT[d.hora] ?? 0;
    const light = 1 + w * (f.light - 1);
    return {
      hora: d.hora,
      vehiculos: Math.round(Math.max(0, (BASE_VEH_MEAN + (d.vehiculos - BASE_VEH_MEAN) * f.peak) * f.volume)),
      peatones: Math.round(d.peatones * f.temp * f.air * f.cars * light * weather),
      baseVehiculos: d.vehiculos,
      basePeatones: d.peatones,
    };
  });
}

// ---------------------------------------------------------------------------
// Gráfico de energía (consumo de red vs. generación solar por día)
// ---------------------------------------------------------------------------
export function solarFactor(v, climaId = DEFAULT_CONTEXT.clima) {
  const haze = clamp(1 - (0.35 * (v.aire - BASE_VALUES.aire)) / 232, 0.62, 1.06);
  const heat = 1 - 0.005 * Math.max(0, v.temperatura - 25);
  return haze * heat * climaById(climaId).solar;
}

export function buildEnergyData(v, climaId = DEFAULT_CONTEXT.clima) {
  const scale = v.consumo / BASE_VALUES.consumo;
  const sf = solarFactor(v, climaId);
  return energyChartData.map((d) => ({
    dia: d.dia,
    consumo: Math.round(d.consumo * scale),
    solar: Math.round(d.solar * sf),
    baseConsumo: d.consumo,
    baseSolar: d.solar,
  }));
}

// Factor de emisión de la red colombiana (kg CO₂ por kWh, aprox.)
export const GRID_CO2 = 0.126;

export function summarizeEnergy(data) {
  const consumo = sum(data.map((d) => d.consumo));
  const solar = sum(data.map((d) => d.solar));
  return {
    consumo,
    solar,
    coverage: consumo ? solar / consumo : 0,
    co2: Math.max(0, consumo - solar) * GRID_CO2,
  };
}

export function summarizeTraffic(data) {
  const peak = data.reduce((m, d) => (d.vehiculos > m.vehiculos ? d : m), data[0]);
  return {
    peak,
    vehiculos: sum(data.map((d) => d.vehiculos)),
    peatones: sum(data.map((d) => d.peatones)),
  };
}

// ---------------------------------------------------------------------------
// Índice de Salud Urbana (0–100)
// ---------------------------------------------------------------------------
export function healthLabel(score) {
  if (score >= 80) return { label: "Óptimo", status: "online" };
  if (score >= 60) return { label: "Estable", status: "online" };
  if (score >= 40) return { label: "En riesgo", status: "warning" };
  return { label: "Crítico", status: "critical" };
}

export function computeHealth(v, energySummary, securityScore) {
  const capacity = 1500 + 25 * v.camaras;
  const movilidad = clamp(100 - Math.max(0, v.flujo / capacity - 0.35) * 100, 0, 100);

  const demand = clamp(((500 - v.consumo) / 300) * 100, 0, 100);
  const coverage = clamp((energySummary.coverage / 0.6) * 100, 0, 100);
  const energia = 0.65 * demand + 0.35 * coverage;

  const airScore = clamp(100 - v.aire / 2.5, 0, 100);
  const tempScore = clamp(100 - 7 * Math.max(0, Math.abs(v.temperatura - 18) - 2), 0, 100);
  const ambiente = 0.7 * airScore + 0.3 * tempScore;

  const seguridad = securityScore ?? 0.55 * v.iluminacion + 0.45 * clamp((v.camaras / 32) * 100, 0, 100);

  const parts = [
    { key: "movilidad", name: "Movilidad", value: Math.round(movilidad) },
    { key: "energia", name: "Energía", value: Math.round(energia) },
    { key: "ambiente", name: "Ambiente", value: Math.round(ambiente) },
    { key: "seguridad", name: "Seguridad", value: Math.round(seguridad) },
  ];
  // Un subsistema colapsado no puede quedar escondido en el promedio.
  const mean = sum(parts.map((p) => p.value)) / parts.length;
  const worst = Math.min(...parts.map((p) => p.value));
  const score = Math.round(Math.min(mean, worst + 40));
  return { score, parts, ...healthLabel(score) };
}

function f_vis(clima, franja) {
  if (clima.vis < 0.8) return clima.name.toLowerCase();
  return franja.dark ? "la oscuridad" : "el clima";
}

// ---------------------------------------------------------------------------
// Alertas generadas a partir del estado actual del gemelo
// ---------------------------------------------------------------------------
export function generateAlerts(v, energySummary, ctx = {}) {
  const list = [];
  const push = (a) => list.push(a);
  const franja = franjaById(ctx.franja ?? DEFAULT_CONTEXT.franja);
  const clima = climaById(ctx.clima ?? DEFAULT_CONTEXT.clima);
  const security = ctx.security;

  if (security && security.score < 45) {
    push({ id: "seg-crit", type: "critical", icon: "ShieldAlert", title: "Riesgo de Seguridad Alto",
      description: `Índice de seguridad ${security.score}/100 en la ${franja.name.toLowerCase()}. Cobertura de cámaras ${security.coverage}% y visibilidad ${security.visibility}%. Se recomienda enviar patrullas del cuadrante.` });
  } else if (security && security.score < 60) {
    push({ id: "seg-warn", type: "warning", icon: "ShieldAlert", title: "Seguridad Reducida",
      description: `Las cámaras ven al ${security.visibility}% por ${f_vis(clima, franja)}. ~${security.incidents} incidentes estimados por hora.` });
  }
  if (clima.id === "aguacero" || clima.id === "granizada") {
    push({ id: "clima-crit", type: "warning", icon: clima.icon, title: clima.id === "aguacero" ? "Aguacero sobre el Sector" : "Granizada en Curso",
      description: "Riesgo de encharcamientos en la Av. Caracas. Velocidad vehicular reducida y menor generación solar." });
  }

  if (v.consumo >= 430) {
    push({ id: "consumo-crit", type: "critical", icon: "AlertTriangle", title: "Sobrecarga Eléctrica Detectada",
      description: `Sector 4-B supera el umbral de consumo en un ${Math.round((v.consumo / 330 - 1) * 100)}%. Riesgo de falla en transformador.` });
  } else if (v.consumo >= 330) {
    push({ id: "consumo-warn", type: "warning", icon: "Zap", title: "Consumo Eléctrico Elevado",
      description: `La demanda (${formatNumber(v.consumo)} kWh) está ${Math.round((v.consumo / 330 - 1) * 100)}% sobre el umbral recomendado. Se sugiere atenuar el alumbrado.` });
  }

  if (v.aire >= 150) {
    push({ id: "aire-crit", type: "critical", icon: "Wind", title: "Alerta Ambiental: Aire Dañino",
      description: `AQI de ${Math.round(v.aire)}. Se recomienda activar pico y placa ambiental y suspender actividades al aire libre.` });
  } else if (v.aire >= 100) {
    push({ id: "aire-warn", type: "warning", icon: "Wind", title: "Calidad del Aire Moderada",
      description: `AQI de ${Math.round(v.aire)}: perjudicial para grupos sensibles. Monitoreo reforzado en la Av. Caracas.` });
  }

  if (v.flujo >= 2300) {
    push({ id: "flujo-crit", type: "critical", icon: "CarFront", title: "Congestión Severa",
      description: `${formatNumber(v.flujo)} veh/h en la vía principal. Tiempo de viaje estimado +${Math.round((v.flujo / 1285 - 1) * 60)}%.` });
  } else if (v.flujo >= 1700) {
    push({ id: "flujo-warn", type: "warning", icon: "CarFront", title: "Tráfico Denso",
      description: `El flujo supera los 1,700 veh/h. ${v.camaras >= 24 ? "Semáforos adaptativos compensando." : "Pocas cámaras para optimizar semáforos."}` });
  }

  if (!franja.dark) {
    // De día la iluminación baja es normal: no genera alertas.
  } else if (v.iluminacion < 25) {
    push({ id: "luz-crit", type: "critical", icon: "Lightbulb", title: "Zonas Oscuras Detectadas",
      description: `Solo ${Math.round(v.iluminacion)}% de las luminarias activas. Riesgo alto para la seguridad peatonal.` });
  } else if (v.iluminacion < 50) {
    push({ id: "luz-warn", type: "warning", icon: "Lightbulb", title: "Iluminación Insuficiente",
      description: `Luminarias al ${Math.round(v.iluminacion)}%. Algunas cuadras quedan por debajo de la norma RETILAP.` });
  } else if (v.iluminacion >= 95) {
    push({ id: "luz-pred", type: "warning", icon: "Clock", title: "Predicción: Mantenimiento Luminaria",
      description: `Operar al ${Math.round(v.iluminacion)}% acelera la degradación de la luminaria #47 en Cra 15. Falla estimada en ${Math.round(72 - (v.iluminacion - 95) * 8)} horas.` });
  }

  if (v.camaras < 8) {
    push({ id: "cam-crit", type: "critical", icon: "Camera", title: "Videovigilancia Fuera de Servicio",
      description: `Solo ${Math.round(v.camaras)} cámaras en línea. Intersecciones sin monitoreo en todo el sector.` });
  } else if (v.camaras < 16) {
    push({ id: "cam-warn", type: "warning", icon: "Camera", title: "Cámaras Desconectadas",
      description: `${24 - Math.round(v.camaras)} cámaras fuera de línea respecto a la operación normal.` });
  }

  if (v.temperatura >= 29 || v.temperatura < 5) {
    push({ id: "temp-crit", type: "critical", icon: "Thermometer", title: v.temperatura >= 29 ? "Ola de Calor Extrema" : "Helada en el Sector",
      description: `${formatNumber(v.temperatura, 1, 0)} °C. Activar protocolo de atención a población vulnerable.` });
  } else if (v.temperatura >= 25 || v.temperatura < 10) {
    push({ id: "temp-warn", type: "warning", icon: "Thermometer", title: v.temperatura >= 25 ? "Isla de Calor Urbana" : "Temperatura Baja",
      description: `${formatNumber(v.temperatura, 1, 0)} °C, fuera del rango de confort (10–25 °C).` });
  }

  if (energySummary.coverage >= 0.45) {
    push({ id: "solar-ok", type: "info", icon: "CheckCircle", title: "Excelente Cobertura Solar",
      description: `Los paneles cubren el ${Math.round(energySummary.coverage * 100)}% de la demanda semanal.` });
  }
  if (v.flujo <= 500) {
    push({ id: "movilidad-ok", type: "info", icon: "CheckCircle", title: "Movilidad Sostenible",
      description: "Flujo vehicular muy bajo: calles abiertas para peatones y ciclistas." });
  }
  if (v.camaras >= 24) {
    push({ id: "cam-ok", type: "info", icon: "CheckCircle", title: "Cámara #12 Reconectada",
      description: "La cámara de la Calle 80 con Av. 68 se ha reconectado exitosamente." });
  }

  const order = { critical: 0, warning: 1, info: 2 };
  return list.sort((a, b) => order[a.type] - order[b.type]);
}
