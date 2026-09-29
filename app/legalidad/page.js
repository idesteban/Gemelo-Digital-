"use client";
import { useState } from "react";
import Accordion from "@/components/Accordion";
import { legalText, habeasDataFAQ } from "@/data/mockData";
import { Scale, CheckCircle, ShieldCheck } from "lucide-react";

// Convierte los **negritas** y saltos de párrafo del texto legal en JSX.
function renderText(text) {
  return text.split("\n\n").map((para, i) => (
    <p key={i}>
      {para.split(/(\*\*[^*]+\*\*)/g).map((chunk, j) =>
        chunk.startsWith("**") ? <strong key={j} className="text-white">{chunk.slice(2, -2)}</strong> : chunk,
      )}
    </p>
  ));
}

export default function LegalidadPage() {
  const [accepted, setAccepted] = useState(false);
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white flex items-center gap-3 animate-fade-in"><Scale className="text-blue-400" /> Legalidad y Habeas Data</h1>
      <div className="bg-slate-800/60 border border-slate-700/50 p-6 rounded-2xl animate-fade-in">
        <div className="space-y-3 text-sm leading-relaxed text-slate-300">{renderText(legalText)}</div>
        <button onClick={() => setAccepted(!accepted)} className={`mt-6 flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors ${accepted ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500 text-white hover:bg-blue-600"}`}>
          {accepted ? <CheckCircle /> : <ShieldCheck />} {accepted ? "Políticas Aceptadas" : "Aceptar Políticas"}
        </button>
      </div>
      <Accordion items={habeasDataFAQ} />
    </div>
  );
}
