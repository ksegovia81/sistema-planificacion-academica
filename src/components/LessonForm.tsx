import React, { useState, useEffect } from "react";
import { BookOpen, Sparkles, Clock, Compass, Layers, FileText, CheckCircle2, Upload, Paperclip, X, HelpCircle, Award, Check } from "lucide-react";
import { i18n } from "../i18n";

interface LessonFormProps {
  onGenerate: (formData: {
    theme: string;
    educationLevel: string;
    duration: string;
    pedagogicalApproach: string;
    objective: string;
    additionalNotes: string;
    documentContent?: string;
    documentName?: string;
    documentMimeType?: string;
    includeRubric?: boolean;
    customDidacticMaterial?: string;
  }) => void;
  onGenerateEvaluation: (evaluationData: {
    documentContent: string;
    documentName: string;
    documentMimeType: string;
    difficulty: string;
    questionTypes: string[];
    questionCount: number;
  }) => void;
  isLoading: boolean;
  lang: string;
}

const SUGGESTED_THEMES_ES = [
  { text: "English Grammar", icon: "🇬🇧" },
  { text: "Fotosíntesis", icon: "🌱" },
  { text: "El ciclo del agua", icon: "💧" },
  { text: "Teorema de Pitágoras", icon: "📐" },
  { text: "El Imperio Romano", icon: "🏛️" },
  { text: "Fracciones básicas", icon: "🍕" },
  { text: "Leyes de Newton", icon: "🍎" },
  { text: "Cambio climático", icon: "🌍" },
];

const SUGGESTED_THEMES_EN = [
  { text: "English Grammar", icon: "🇬🇧" },
  { text: "Photosynthesis", icon: "🌱" },
  { text: "The Water Cycle", icon: "💧" },
  { text: "Pythagorean Theorem", icon: "📐" },
  { text: "The Roman Empire", icon: "🏛️" },
  { text: "Basic Fractions", icon: "🍕" },
  { text: "Newton's Laws", icon: "🍎" },
  { text: "Climate Change", icon: "🌍" },
];

const PEDAGOGICAL_APPROACHES_ES = [
  { value: "Constructivismo", label: "Constructivista (Aprendizaje activo y autónomo)" },
  { value: "Aprendizaje Basado en Problemas (ABP)", label: "ABP (Resolución de retos reales)" },
  { value: "Aula Invertida (Flipped Classroom)", label: "Aula Invertida (Teoría previa en casa, práctica en clase)" },
  { value: "Aprendizaje Cooperativo", label: "Aprendizaje Cooperativo (Trabajo en equipos coordinados)" },
  { value: "Enfoque Directo / Clase Magistral Interactiva", label: "Clase Magistral Interactiva (Explicación activa + feedback)" },
  { value: "Gamificación", label: "Gamificación (Aprender jugando con dinámicas lúdicas)" },
];

const PEDAGOGICAL_APPROACHES_EN = [
  { value: "Constructivism", label: "Constructivist (Active and autonomous learning)" },
  { value: "Problem-Based Learning (PBL)", label: "PBL (Solving real-world challenges)" },
  { value: "Flipped Classroom", label: "Flipped Classroom (Pre-class study, in-class active practice)" },
  { value: "Cooperative Learning", label: "Cooperative Learning (Teamwork and coordinated groups)" },
  { value: "Direct Instruction / Interactive Lecture", label: "Interactive Lecture (Active lecture + feedback)" },
  { value: "Gamification", label: "Gamification (Play-based learning with fun dynamics)" },
];

const EDUCATION_LEVELS_ES = [
  "10.º Grado (Primero de la Media - Paraguay)",
  "Educación Primaria (6-11 años)",
  "Educación Secundaria (12-15 años)",
  "Bachillerato / Preparatoria (16-18 años)",
  "Educación Superior / Universitaria",
  "Educación Técnico-Profesional",
  "Educación de Adultos",
];

const EDUCATION_LEVELS_EN = [
  "10th Grade (High School Sophomore)",
  "Primary Education (Ages 6-11)",
  "Secondary Education (Ages 12-15)",
  "High School / Preparatory (Ages 16-18)",
  "Higher / University Education",
  "Technical & Professional Education",
  "Adult Education",
];

const DURATIONS_ES = [
  "90 minutos",
  "45 minutos",
  "60 minutos",
  "120 minutos",
  "180 minutos (Taller)",
];

const DURATIONS_EN = [
  "90 minutes",
  "45 minutes",
  "60 minutes",
  "120 minutes",
  "180 minutes (Workshop)",
];

const LOADING_STEPS_ES = [
  "Analizando la temática elegida...",
  "Procesando el documento adjunto con inteligencia pedagógica...",
  "Estructurando los objetivos generales y específicos...",
  "Diseñando la secuencia didáctica pedagógica...",
  "Seleccionando materiales óptimos para el docente y alumno...",
  "Elaborando la ficha de trabajo práctica...",
  "Redactando criterios de evaluación y rúbrica formativa...",
  "Generando consejos adicionales de diferenciación en el aula...",
  "Finalizando la planificación pedagógica...",
];

const LOADING_STEPS_EN = [
  "Analyzing selected topic...",
  "Processing attached document with pedagogical intelligence...",
  "Structuring general and specific learning objectives...",
  "Designing the pedagogical learning sequence...",
  "Selecting optimal resources for teacher and student...",
  "Crafting independent practice worksheet...",
  "Drafting evaluation criteria and formative rubric...",
  "Generating classroom differentiation guidelines...",
  "Finalizing pedagogical lesson plan...",
];

export default function LessonForm({ onGenerate, onGenerateEvaluation, isLoading, lang }: LessonFormProps) {
  const isEn = lang === "en";
  const activeLang = (isEn ? "en" : "es") as "en" | "es";
  const t = i18n[activeLang];

  const suggestedThemes = isEn ? SUGGESTED_THEMES_EN : SUGGESTED_THEMES_ES;
  const pedagogicalApproaches = isEn ? PEDAGOGICAL_APPROACHES_EN : PEDAGOGICAL_APPROACHES_ES;
  const educationLevels = isEn ? EDUCATION_LEVELS_EN : EDUCATION_LEVELS_ES;
  const durations = isEn ? DURATIONS_EN : DURATIONS_ES;
  const loadingSteps = isEn ? LOADING_STEPS_EN : LOADING_STEPS_ES;

  const [theme, setTheme] = useState(suggestedThemes[0].text);
  const [educationLevel, setEducationLevel] = useState(educationLevels[0]);
  const [duration, setDuration] = useState(durations[0]);
  const [pedagogicalApproach, setPedagogicalApproach] = useState(pedagogicalApproaches[0].value);
  const [objective, setObjective] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  // File Upload States
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string | null>(null);
  const [includeRubric, setIncludeRubric] = useState(false);
  const [pasteContent, setPasteContent] = useState("");
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [customDidacticMaterial, setCustomDidacticMaterial] = useState("");

  // Customized Evaluation states
  const [evalDifficulty, setEvalDifficulty] = useState(isEn ? "Medium" : "Medio");
  const [evalQuestionTypes, setEvalQuestionTypes] = useState<string[]>(["opcion_multiple"]);
  const [evalQuestionCount, setEvalQuestionCount] = useState(10);

  // Adapt defaults if language changes and fields are untouched
  useEffect(() => {
    setTheme(suggestedThemes[0].text);
    setEducationLevel(educationLevels[0]);
    setDuration(durations[0]);
    setPedagogicalApproach(pedagogicalApproaches[0].value);
    setEvalDifficulty(isEn ? "Medium" : "Medio");
  }, [lang]);

  // Rotate loading steps message to keep the experience highly engaging
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % loadingSteps.length);
      }, 3500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, loadingSteps]);

  // Handle file reader
  const handleFile = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setFileMimeType(file.type || "");
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;
      const commaIndex = dataUrl.indexOf(",");
      if (commaIndex !== -1) {
        const base64 = dataUrl.substring(commaIndex + 1);
        setFileContent(base64);
      } else {
        setFileContent(dataUrl);
      }
    };
    reader.onerror = () => {
      alert(isEn ? "Error reading file. Please try again." : "Error al leer el archivo. Por favor, intenta de nuevo.");
    };
    
    // Read files as DataURL (handles binary files like PDF, Word, Excel, PowerPoint)
    reader.readAsDataURL(file);
  };

  // Drag listeners
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Drop listener
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Manual select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeAttachedFile = () => {
    setFileName(null);
    setFileContent(null);
    setFileMimeType(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme.trim()) return;

    // Use fileContent or pasteContent or both as document source
    const finalDocContent = fileContent || (pasteContent.trim() ? pasteContent.trim() : undefined);
    const finalDocName = fileName || (pasteContent.trim() ? (isEn ? "Manually pasted text" : "Texto pegado manualmente") : undefined);
    const finalMimeType = fileMimeType || (pasteContent.trim() ? "text/plain" : undefined);

    onGenerate({
      theme: theme.trim(),
      educationLevel,
      duration,
      pedagogicalApproach,
      objective: objective.trim(),
      additionalNotes: additionalNotes.trim(),
      documentContent: finalDocContent || undefined,
      documentName: finalDocName,
      documentMimeType: finalMimeType,
      includeRubric,
      customDidacticMaterial: customDidacticMaterial.trim() || undefined,
    });
  };

  return (
    <div id="form-container" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display">{t.formTitle}</h2>
          <p className="text-sm text-slate-500">{t.formSubtitle}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Theme input */}
        <div className="space-y-2">
          <label htmlFor="theme-input" className="block text-sm font-semibold text-slate-700">
            {t.fieldTheme} <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              id="theme-input"
              type="text"
              required
              disabled={isLoading}
              placeholder={t.fieldThemePlaceholder}
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
            />
            <Sparkles className="absolute right-3.5 top-3.5 w-5 h-5 text-indigo-400 pointer-events-none" />
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-slate-500 block">{t.popularSuggestions}</span>
          <div className="flex flex-wrap gap-2">
            {suggestedThemes.map((item) => (
              <button
                key={item.text}
                type="button"
                disabled={isLoading}
                onClick={() => setTheme(item.text)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center space-x-1 cursor-pointer ${
                  theme === item.text
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Level and Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="level-select" className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-400" /> {t.fieldLevel}
            </label>
            <select
              id="level-select"
              disabled={isLoading}
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all text-slate-700"
            >
              {educationLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="duration-select" className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" /> {t.fieldDuration}
            </label>
            <select
              id="duration-select"
              disabled={isLoading}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all text-slate-700"
            >
              {durations.map((dur) => (
                <option key={dur} value={dur}>
                  {dur}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pedagogical Approach */}
        <div className="space-y-2">
          <label htmlFor="approach-select" className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-slate-400" /> {t.fieldApproach}
          </label>
          <select
            id="approach-select"
            disabled={isLoading}
            value={pedagogicalApproach}
            onChange={(e) => setPedagogicalApproach(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all text-slate-700"
          >
            {pedagogicalApproaches.map((appr) => (
              <option key={appr.value} value={appr.value}>
                {appr.label}
              </option>
            ))}
          </select>
        </div>

        {/* Document Attachment & Upload Section */}
        <div className="space-y-2.5">
          <label className="block text-sm font-semibold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Paperclip className="w-4 h-4 text-slate-400" /> {t.fieldUpload}
            </span>
            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">{isEn ? "OPTIONAL" : "OPCIONAL"}</span>
          </label>
          
          {/* Drag & Drop Zone */}
          {!fileName ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
                dragActive 
                  ? "border-indigo-500 bg-indigo-50/40" 
                  : "border-slate-200 hover:border-indigo-300 bg-slate-50/50 hover:bg-slate-50"
              }`}
            >
              <input
                id="doc-file-input"
                type="file"
                disabled={isLoading}
                accept=".txt,.md,.csv,.json,.html,.xml,.pdf,.docx,.xlsx,.xls,.pptx"
                onChange={handleFileChange}
                className="hidden"
              />
              <label 
                htmlFor="doc-file-input" 
                className="cursor-pointer flex flex-col items-center space-y-2 group"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">{isEn ? "Drag or select a file" : "Arrastra o selecciona un archivo"}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{isEn ? "Supports PDF, Word, Excel, PowerPoint and plain text" : "Soporta PDF, Word, Excel, PowerPoint y texto plano"}</p>
                </div>
              </label>
              
              <div className="mt-3.5 pt-3 border-t border-slate-100 flex justify-center">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowPasteArea(!showPasteArea)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  {showPasteArea 
                    ? (isEn ? "Hide text box" : "Ocultar cuadro de texto") 
                    : (isEn ? "Or paste your PDF / Word text directly" : "O pegar el texto de tu PDF / Word directamente")}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-mono text-xs font-bold shrink-0">
                  {fileName.split(".").pop()?.toUpperCase() || "DOC"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate" title={fileName}>
                    {fileName}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    {isEn ? "Document loaded successfully" : "Documento leído con éxito"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeAttachedFile}
                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all rounded"
                title={isEn ? "Remove file" : "Remover archivo"}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Alternative Manual Text Paste Box */}
          {showPasteArea && !fileName && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <label htmlFor="paste-area" className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                {t.fieldUploadPaste}:
              </label>
              <textarea
                id="paste-area"
                rows={4}
                disabled={isLoading}
                placeholder={t.fieldUploadPastePlaceholder}
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-xs text-slate-700 placeholder:text-slate-400 resize-y font-mono"
              />
              {pasteContent.trim() && (
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">{isEn ? "Loaded characters: " : "Caracteres cargados: "}{pasteContent.length}</span>
                  <button 
                    type="button" 
                    onClick={() => setPasteContent("")} 
                    className="text-rose-600 hover:underline"
                  >
                    {isEn ? "Clear text" : "Borrar texto"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Include Rubric Option */}
        <div className="bg-slate-50 hover:bg-indigo-50/10 border border-slate-200 rounded-xl p-4 transition-all flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${includeRubric ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight">{t.detailedRubric}</h4>
              <p className="text-[10px] text-slate-500 font-medium">{t.fieldRubric}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setIncludeRubric(!includeRubric)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${includeRubric ? 'bg-indigo-600' : 'bg-slate-200'}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${includeRubric ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>

        {/* Optional Custom Objectives */}
        <div className="space-y-2">
          <label htmlFor="objective-input" className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-slate-400" /> {t.fieldObjective}
          </label>
          <textarea
            id="objective-input"
            rows={2}
            disabled={isLoading}
            placeholder={t.fieldObjectivePlaceholder}
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all text-slate-700 text-sm placeholder:text-slate-400 resize-y"
          />
        </div>

        {/* Additional notes */}
        <div className="space-y-2">
          <label htmlFor="notes-input" className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-slate-400" /> {isEn ? "Additional instructions or Resources (Optional)" : "Instrucciones adicionales o Recursos (Opcional)"}
          </label>
          <textarea
            id="notes-input"
            rows={2}
            disabled={isLoading}
            placeholder={isEn ? "e.g., Add simple home experiments, use recycled materials, etc." : "Ej. Añadir experimentos caseros sencillos, usar material reciclado, etc."}
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all text-slate-700 text-sm placeholder:text-slate-400 resize-y"
          />
        </div>

        {/* Custom Didactic Material creation */}
        <div className="space-y-2">
          <label htmlFor="custom-didactic-material-input" className="block text-sm font-semibold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" /> {t.fieldDidactic}
            </span>
            <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{isEn ? "OMIT IF EMPTY" : "SI SE DEJA VACÍO, NO SE CREARÁ"}</span>
          </label>
          <input
            id="custom-didactic-material-input"
            type="text"
            disabled={isLoading}
            placeholder={t.fieldDidacticPlaceholder}
            value={customDidacticMaterial}
            onChange={(e) => setCustomDidacticMaterial(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all text-slate-700 text-sm placeholder:text-slate-400"
          />
          <p className="text-[10px] text-slate-400 italic">
            {isEn 
              ? "Specify what kind of extra didactic material you want the AI to generate. If empty, it won't be created." 
              : "Especifica qué tipo de material didáctico adicional deseas que la IA genere. Si esta caja está vacía, el material no se creará."}
          </p>
        </div>

        {/* SECTION: EXCLUSIVE EVALUATION GENERATOR */}
        <div className={`p-6 rounded-2xl border transition-all duration-300 ${
          fileContent 
            ? 'bg-emerald-50/40 border-emerald-200/80 shadow-md shadow-emerald-600/5' 
            : 'bg-slate-50/50 border-slate-200 opacity-80'
        }`}>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Award className={`w-5 h-5 ${fileContent ? 'text-emerald-600' : 'text-slate-400'}`} />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-display">
                  {t.formEvalTitle}
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed font-sans">
                {t.formEvalSubtitle}
              </p>
            </div>
            {fileContent ? (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-full">
                {isEn ? "Enabled" : "Habilitado"}
              </span>
            ) : (
              <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-full">
                {isEn ? "Inactive" : "Inactivo"}
              </span>
            )}
          </div>

          {!fileContent && (
            <div className="mt-4 p-3 bg-slate-100/60 border border-dashed border-slate-200 rounded-xl text-center">
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed font-sans">
                {isEn 
                  ? "🔒 Upload a file above (PDF, Word, Excel, etc.) or paste text to enable this section and its options." 
                  : "🔒 Adjunta un archivo arriba (PDF, Word, Excel, etc.) o pega texto para habilitar este botón y sus opciones."}
              </p>
            </div>
          )}

          <div className={`mt-5 space-y-5 transition-all ${!fileContent ? 'pointer-events-none select-none filter blur-[0.3px]' : ''}`}>
            
            {/* 1. DIFICULTAD */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                {t.fieldDifficulty}:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["Bajo", "Medio", "Alto"].map((level) => {
                  const displayLevel = isEn 
                    ? (level === "Bajo" ? "Low" : level === "Medio" ? "Medium" : "High") 
                    : (level === "Bajo" ? "Bajo" : level === "Medio" ? "Medio" : "Alto");
                  const matchVal = level === "Bajo" ? (isEn ? "Low" : "Bajo") : level === "Medio" ? (isEn ? "Medium" : "Medio") : (isEn ? "High" : "Alto");
                  
                  return (
                    <button
                      key={level}
                      type="button"
                      disabled={!fileContent}
                      onClick={() => setEvalDifficulty(matchVal)}
                      className={`py-2 px-3 text-xs font-bold rounded-lg uppercase tracking-wider border transition-all cursor-pointer ${
                        evalDifficulty === matchVal
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/10'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      {displayLevel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. TIPO DE PREGUNTAS */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                {isEn ? "Question Types (Select one or more):" : "Tipos de Preguntas (Selecciona uno o varios):"}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: "opcion_multiple", label: t.typeMultiple },
                  { id: "verdadero_falso", label: t.typeTrueFalse },
                  { id: "juicio_critico", label: t.typeCritical },
                ].map((type) => {
                  const isSelected = evalQuestionTypes.includes(type.id);
                  return (
                    <button
                      key={type.id}
                      type="button"
                      disabled={!fileContent}
                      onClick={() => {
                        if (isSelected) {
                          setEvalQuestionTypes(evalQuestionTypes.filter(t => t !== type.id));
                        } else {
                          setEvalQuestionTypes([...evalQuestionTypes, type.id]);
                        }
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-[10px] font-bold uppercase tracking-tight transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span>{type.label}</span>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ml-1.5 ${isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'}`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. CANTIDAD DE PREGUNTAS */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                {t.fieldQuestionCount}:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={!fileContent}
                    onClick={() => setEvalQuestionCount(num)}
                    className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      evalQuestionCount === num
                        ? 'bg-slate-800 border-slate-800 text-white'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    {num} {isEn ? "Qs" : "Pregs"}
                  </button>
                ))}
              </div>
            </div>

          </div>

          <button
            type="button"
            disabled={!fileContent || isLoading || evalQuestionTypes.length === 0}
            onClick={(e) => {
              e.preventDefault();
              if (!fileContent) return;
              onGenerateEvaluation({
                documentContent: fileContent,
                documentName: fileName || "documento_adjunto",
                documentMimeType: fileMimeType || "text/plain",
                difficulty: evalDifficulty,
                questionTypes: evalQuestionTypes,
                questionCount: evalQuestionCount
              });
            }}
            className="mt-6 w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold font-display rounded-xl shadow-md shadow-emerald-600/10 hover:shadow-lg hover:shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer uppercase tracking-wider text-xs"
          >
            {isLoading ? (
              <div className="flex items-center space-x-3">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{t.btnGenerating}</span>
              </div>
            ) : (
              <>
                <Award className="w-5 h-5 text-emerald-100" />
                <span>{t.btnGenerateEval}</span>
              </>
            )}
          </button>
        </div>

        <div className="relative py-2 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <span className="relative px-3 bg-white text-[11px] font-bold text-slate-400 uppercase tracking-widest">{isEn ? "OR" : "Ó"}</span>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isLoading || !theme.trim()}
          className="w-full relative overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-bold font-display shadow-md shadow-indigo-600/10 hover:shadow-lg hover:shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer text-xs uppercase tracking-wider"
        >
          {isLoading ? (
            <div className="flex items-center space-x-3">
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>{t.btnGenerating}</span>
            </div>
          ) : (
            <>
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span>{t.btnGenerateClass}</span>
            </>
          )}
        </button>
      </form>

      {/* Interactive Pedagogical Progress Indicator */}
      {isLoading && (
        <div className="mt-6 p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-xl animate-pulse">
          <div className="flex items-center space-x-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
            </span>
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">{isEn ? "AI Pedagogical Laboratory" : "Laboratorio Pedagógico de IA"}</span>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-700 transition-all duration-300">
            {loadingSteps[loadingStepIndex]}
          </p>
          <div className="mt-3 w-full bg-indigo-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${((loadingStepIndex + 1) / loadingSteps.length) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
