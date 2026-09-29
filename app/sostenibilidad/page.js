"use client";
import CarbonChart from "@/components/CarbonChart";
import { Icon } from "@/components/icons";
import { sustainabilityMetrics, carbonFootprintData, debateConclusions } from "@/data/mockData";
import { Leaf, Target } from "lucide-react";

export default function SostenibilidadPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Leaf className="text-emerald-400" /> Sostenibilidad Ambiental</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sustainabilityMetrics.map((metric) => (
          <div key={metric.id} className="bg-slate-800/60 border border-slate-700/50 p-5 rounded-2xl card-hover">
            <div className="flex items-center justify-between">
              <h3 className="text-slate-300 text-sm">{metric.name}</h3>
              <Icon name={metric.icon} size={18} className="text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">{metric.value} <span className="text-xs text-slate-400">{metric.unit}</span></p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Target size={12} /> Meta: {metric.target} {metric.unit}</p>
          </div>
        ))}
      </div>
      <CarbonChart data={carbonFootprintData} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {debateConclusions.map((c) => (
          <div key={c.title} className="bg-slate-800/60 border border-slate-700/50 p-5 rounded-2xl">
            <Icon name={c.icon} size={20} className="text-emerald-400" />
            <h3 className="text-white font-semibold mt-3">{c.title}</h3>
            <p className="text-sm text-slate-400 mt-1">{c.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
