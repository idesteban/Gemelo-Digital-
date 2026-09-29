"use client";
import SensorCard from "@/components/SensorCard";
import AlertPanel from "@/components/AlertPanel";
import TrafficChart from "@/components/TrafficChart";
import EnergyChart from "@/components/EnergyChart";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ControlBar from "@/components/dashboard/ControlBar";
import CityScene from "@/components/dashboard/CityScene";
import CityHealth from "@/components/dashboard/CityHealth";
import EventLog from "@/components/dashboard/EventLog";
import { useCitySimulation } from "@/hooks/useCitySimulation";
import { SCENARIOS, SENSOR_BY_KEY } from "@/lib/simulation";

export default function DashboardPage() {
  const sim = useCitySimulation();
  const { state, sensors, traffic, energy, trafficSummary, energySummary, health, alerts, baseline } = sim;

  const impact = state.impact;
  const impactSource = impact
    ? impact.source === "scenario"
      ? "escenario"
      : SENSOR_BY_KEY[impact.source].name
    : "";
  const impactFor = (key) => {
    const t = impact?.targets[key];
    if (!t || Math.abs(t.delta) < 1e-9) return null;
    return { id: impact.id, delta: t.delta, reason: t.reason };
  };
  const scenarioName = SCENARIOS.find((s) => s.id === state.scenario)?.name;

  return (
    <div className="space-y-6">
      <DashboardHeader criticalCount={alerts.filter((a) => a.type === "critical").length} live={state.live} />

      <ControlBar state={state} onScenario={sim.applyScenario} onToggle={sim.toggle} onReset={sim.reset} />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="Sensores del barrio">
        {sensors.map((sensor, i) => (
          <SensorCard
            key={sensor.id}
            sensor={sensor}
            index={i}
            impact={impactFor(sensor.key)}
            sourceName={impact?.source === "scenario" ? scenarioName ?? impactSource : impactSource}
            onChange={sim.setValue}
            onHold={sim.setHold}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrafficChart data={traffic} summary={trafficSummary} baseSummary={baseline.trafficSummary} compare={state.compare} />
        <EnergyChart data={energy} summary={energySummary} baseSummary={baseline.energySummary} compare={state.compare} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CityScene className="lg:col-span-2" values={state.values} trafficSummary={trafficSummary} live={state.live} />
        <CityHealth health={health} baseScore={baseline.health.score} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AlertPanel className="lg:col-span-2" alerts={alerts} />
        <EventLog log={state.log} />
      </section>
    </div>
  );
}
