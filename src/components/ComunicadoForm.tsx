import React, { useState } from "react";
import { Megaphone, Sparkles, User, FileText, Lightbulb } from "lucide-react";

interface ComunicadoFormProps {
  onGenerate: (data: { nombre: string; tema: string }) => void;
  isLoading: boolean;
}

const TEMAS_PREDEFINIDOS = [
  { label: "📝 Tareas pendientes o incompletas", value: "Falta constante en la entrega de tareas escolares y actividades para el hogar." },
  { label: "📉 Rendimiento académico bajo", value: "Bajo rendimiento en las evaluaciones del periodo y necesidad de reforzamiento en la materia." },
  { label: "🌟 Reconocimiento y felicitación", value: "Felicitación especial por excelente desempeño académico, esfuerzo notable y gran compañerismo en el aula." },
  { label: "💬 Conducta e interrupción constante", value: "Dificultad para mantener el enfoque en clase, interrupciones constantes y necesidad de trabajar el respeto a las normas del aula." },
  { label: "📅 Inasistencias o tardanzas", value: "Preocupación por inasistencias reiteradas o tardanzas que están afectando el ritmo de aprendizaje del estudiante." },
  { label: "🤝 Falta de integración o timidez", value: "Baja participación grupal, timidez extrema o aparente dificultad para integrarse con sus compañeros de equipo." }
];

export default function ComunicadoForm({ onGenerate, isLoading }: ComunicadoFormProps) {
  const [nombre, setNombre] = useState("");
  const [tema, setTema] = useState("");

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
          <Megaphone className="w-4 h-4 text-indigo-600" /> Redactor de Comunicados
        </h2>
        <p className="text-xs text-slate-500">
          Crea mensajes escolares empáticos, respetuosos y asertivos dirigidos a las familias.
        </p>
      </div>

      <div className="space-y-5">
        {/* Name input */}
        <div className="space-y-2">
          <label htmlFor="student-name-input" className="block text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" /> Nombre del Estudiante
          </label>
          <input
            id="student-name-input"
            type="text"
            required
            disabled={isLoading}
            placeholder="Ej. Sofía Mendoza, Carlos Ortiz..."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all text-slate-700 text-sm placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* Topic input */}
        <div className="space-y-2">
          <label htmlFor="comunicado-topic-input" className="block text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" /> Tema o Situación a Tratar
          </label>
          <textarea
            id="comunicado-topic-input"
            required
            rows={4}
            disabled={isLoading}
            placeholder="Ej. Ha bajado sus notas en matemáticas porque no presta atención, o queremos felicitarle por su gran compañerismo..."
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all text-slate-700 text-sm placeholder:text-slate-400 font-medium resize-y"
          />
        </div>

        {/* Predefined Topic Suggestions */}
        <div className="space-y-2.5">
          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-500" /> Situaciones comunes (Haz clic para usar):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {TEMAS_PREDEFINIDOS.map((t, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isLoading}
                onClick={() => selectTemaSugerido(t.value)}
                className={`text-[10px] text-left px-2.5 py-1.5 rounded-lg border text-slate-600 hover:text-indigo-900 hover:bg-indigo-50 hover:border-indigo-200 transition-all cursor-pointer ${
                  tema === t.value ? "bg-indigo-50 border-indigo-200 text-indigo-900 font-bold" : "bg-white border-slate-200"
                }`}
              >
                {t.label}
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
            <span>Redactando Comunicado Asertivo...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Generar Comunicado Empático</span>
          </>
        )}
      </button>
    </form>
  );
}
