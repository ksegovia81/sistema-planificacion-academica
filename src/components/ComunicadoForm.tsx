import React, { useState } from "react";
import { Megaphone, Sparkles, User, FileText, Lightbulb } from "lucide-react";
import { i18n } from "../i18n";

interface ComunicadoFormProps {
  onGenerate: (data: { nombre: string; tema: string }) => void;
  isLoading: boolean;
  lang: string;
}

const TEMAS_PREDEFINIDOS_ES = [
  { label: "📝 Tareas pendientes o incompletas", value: "Falta constante en la entrega de tareas escolares y actividades para el hogar." },
  { label: "📉 Rendimiento académico bajo", value: "Bajo rendimiento en las evaluaciones del periodo y necesidad de reforzamiento en la materia." },
  { label: "🌟 Reconocimiento y felicitación", value: "Felicitación especial por excelente desempeño académico, esfuerzo notable y gran compañerismo en el aula." },
  { label: "💬 Conducta e interrupción constante", value: "Dificultad para mantener el enfoque en clase, interrupciones constantes y necesidad de trabajar el respeto a las normas del aula." },
  { label: "📅 Inasistencias o tardanzas", value: "Preocupación por inasistencias reiteradas o tardanzas que están afectando el ritmo de aprendizaje del estudiante." },
  { label: "🤝 Falta de integración o timidez", value: "Baja participación grupal, timidez extrema o aparente dificultad para integrarse con sus compañeros de equipo." }
];

const TEMAS_PREDEFINIDOS_EN = [
  { label: "📝 Pending or incomplete homework", value: "Constant lack of submission of school homework and home activities." },
  { label: "📉 Low academic performance", value: "Low performance in academic assessments during the period and need for reinforcement in the subject." },
  { label: "🌟 Recognition and congratulations", value: "Special congratulations for excellent academic performance, notable effort, and great fellowship in the classroom." },
  { label: "💬 Behavioral issues & disruptions", value: "Difficulty maintaining focus in class, constant disruptions, and need to work on respecting classroom rules." },
  { label: "📅 Absences or tardiness", value: "Concern about repeated absences or tardiness that are affecting the student's learning pace." },
  { label: "🤝 Lack of integration or shyness", value: "Low group participation, extreme shyness, or apparent difficulty integrating with peers in teamwork." }
];

export default function ComunicadoForm({ onGenerate, isLoading, lang }: ComunicadoFormProps) {
  const [nombre, setNombre] = useState("");
  const [tema, setTema] = useState("");

  const activeLang = (lang === "en" ? "en" : "es") as "en" | "es";
  const t = i18n[activeLang];
  const suggestions = activeLang === "en" ? TEMAS_PREDEFINIDOS_EN : TEMAS_PREDEFINIDOS_ES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !tema.trim()) return;
    onGenerate({ nombre: nombre.trim(), tema: tema.trim() });
  };

  const selectTemaSugerido = (val: string) => {
    setTema(val);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-sm font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
          <Megaphone className="w-4 h-4 text-indigo-600" /> {t.formCommTitle}
        </h2>
        <p className="text-xs text-slate-500">
          {t.formCommSubtitle}
        </p>
      </div>

      <div className="space-y-5">
        {/* Name input */}
        <div className="space-y-2">
          <label htmlFor="student-name-input" className="block text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" /> {t.fieldStudentName}
          </label>
          <input
            id="student-name-input"
            type="text"
            required
            disabled={isLoading}
            placeholder={t.fieldStudentNamePlaceholder}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all text-slate-700 text-sm placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* Topic input */}
        <div className="space-y-2">
          <label htmlFor="comunicado-topic-input" className="block text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" /> {t.fieldSituation}
          </label>
          <textarea
            id="comunicado-topic-input"
            required
            rows={4}
            disabled={isLoading}
            placeholder={t.fieldSituationPlaceholder}
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all text-slate-700 text-sm placeholder:text-slate-400 font-medium resize-y"
          />
        </div>

        {/* Predefined Topic Suggestions */}
        <div className="space-y-2.5">
          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-500" /> {t.commonSituations}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isLoading}
                onClick={() => selectTemaSugerido(item.value)}
                className={`text-[10px] text-left px-2.5 py-1.5 rounded-lg border text-slate-600 hover:text-indigo-900 hover:bg-indigo-50 hover:border-indigo-200 transition-all cursor-pointer ${
                  tema === item.value ? "bg-indigo-50 border-indigo-200 text-indigo-900 font-bold" : "bg-white border-slate-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !nombre.trim() || !tema.trim()}
        className="w-full py-3.5 px-4 bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-indigo-600/15 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>{t.btnGenerating}</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>{t.btnGenerateComm}</span>
          </>
        )}
      </button>
    </form>
  );
}
