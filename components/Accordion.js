"use client";
import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export default function Accordion({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 animate-fade-in">
      <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
        <HelpCircle size={20} className="text-blue-400" /> Preguntas Frecuentes — Habeas Data
      </h2>
      <div className="divide-y divide-slate-700">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.question}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="w-full flex items-center justify-between gap-4 py-4 text-left text-slate-200 hover:text-white"
              >
                <span className="font-medium">{item.question}</span>
                <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100 pb-4" : "grid-rows-[0fr] opacity-0"}`}>
                <p className="overflow-hidden text-sm text-slate-400">{item.answer}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
