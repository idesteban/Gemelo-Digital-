# Gemelo Digital — El Modelo Virtual

Simulación interactiva de una ciudad inteligente (Barrio Bogotá, Colombia) hecha con
Next.js, Tailwind CSS, Recharts y lucide-react.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abre <http://localhost:3000/dashboard>.

## Qué se puede hacer en el dashboard

- **Barras de desplazamiento en los 6 sensores.** Cada tarjeta tiene un slider con zonas
  de estado (verde / ámbar / rojo) y una marca del valor base. Al moverlo cambian el
  valor, el estado (Online / Warning / Critical) y la tendencia vs. ayer.
- **Acoplamiento del gemelo.** Las variables se afectan entre sí:
  - Flujo vehicular → calidad del aire (emisiones)
  - Iluminación y cámaras → consumo eléctrico
  - Temperatura → consumo (climatización) y aire (ozono)
  La tarjeta afectada pulsa y muestra cuánto cambió y por qué. Se puede apagar.
- **Gráficos en vivo.** Tráfico (vehículos y peatones por hora) y energía (red vs. solar)
  se recalculan con cada movimiento; la opción *Comparar base* dibuja el escenario original.
- **Escenarios.** Día normal, Hora pico, Día sin carro, Noche segura, Ola de calor,
  Modo eco y Falla de red.
- **Modo en vivo.** Los sensores fluctúan alrededor del valor fijado, como en la vida real.
- **Vista del Gemelo.** Escena animada del barrio: luminarias, autos, ciclistas, cámaras,
  ventanas encendidas (consumo), smog (AQI) y color del cielo (temperatura).
- **Índice de Salud Urbana**, **alertas inteligentes** generadas según el estado y
  **bitácora** de cada ajuste con su efecto en cadena.

## Estructura

```
app/            páginas (dashboard, legalidad, ciberseguridad, sostenibilidad)
components/     tarjetas, gráficos, escena, índice, alertas, bitácora
data/mockData.js  datos base del barrio
lib/simulation.js motor de simulación (funciones puras)
hooks/useCitySimulation.js estado de la simulación
```
