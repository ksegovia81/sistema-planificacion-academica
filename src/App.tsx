import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Printer, 
  Copy, 
  Check, 
  Trash2, 
  Clock, 
  Layers, 
  Compass, 
  BookOpen, 
  HelpCircle, 
  FileText, 
  ListChecks, 
  AlertCircle,
  Download,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  X,
  Award,
  Megaphone,
  User,
  Heart
} from "lucide-react";
import LessonForm from "./components/LessonForm";
import ComunicadoForm from "./components/ComunicadoForm";
import { LessonPlan, SavedLessonPlan, CustomEvaluation, ParentCommunication, SavedParentCommunication } from "./types";
import { i18n } from "./i18n";

const parseBoldText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-bold text-slate-800">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const renderMarkdown = (text: string) => {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    // Headers
    if (line.startsWith("### ")) {
      return <h4 key={idx} className="text-sm font-extrabold text-slate-800 uppercase tracking-tight mt-6 mb-2.5">{line.replace("### ", "")}</h4>;
    }
    if (line.startsWith("## ")) {
      return <h3 key={idx} className="text-base font-black text-indigo-900 uppercase tracking-tight mt-8 mb-4 border-b border-indigo-100 pb-1.5">{line.replace("## ", "")}</h3>;
    }
    if (line.startsWith("# ")) {
      return <h2 key={idx} className="text-xl font-black text-slate-900 uppercase tracking-tight mt-10 mb-5">{line.replace("# ", "")}</h2>;
    }
    // Lists
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const cleanLine = line.substring(2);
      return (
        <li key={idx} className="ml-5 list-disc text-xs text-slate-600 leading-relaxed my-1">
          {parseBoldText(cleanLine)}
        </li>
      );
    }
    // Numbered lists
    const numMatch = line.match(/^(\d+)\.\s(.*)/);
    if (numMatch) {
      return (
        <li key={idx} className="ml-5 list-decimal text-xs text-slate-600 leading-relaxed my-1">
          {parseBoldText(numMatch[2])}
        </li>
      );
    }
    // Blockquote
    if (line.startsWith("> ")) {
      return (
        <blockquote key={idx} className="border-l-4 border-emerald-500 bg-emerald-50/40 p-3 my-4 italic text-xs text-slate-700 font-medium">
          {parseBoldText(line.substring(2))}
        </blockquote>
      );
    }
    // Horizontal rule
    if (line.trim() === "---") {
      return <hr key={idx} className="border-slate-200 my-6" />;
    }
    // Empty line
    if (!line.trim()) {
      return <div key={idx} className="h-2" />;
    }
    // Normal paragraph
    return (
      <p key={idx} className="text-xs text-slate-600 leading-relaxed my-2">
        {parseBoldText(line)}
      </p>
    );
  });
};

export default function App() {
  const [lang, setLang] = useState<"es" | "en">("es");
  const t = i18n[lang];
  const [activeLesson, setActiveLesson] = useState<LessonPlan | null>(null);
  const [savedLessons, setSavedLessons] = useState<SavedLessonPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"sequence" | "worksheet" | "evaluation" | "rubric" | "didactic_material">("sequence");
  const [showPrintModal, setShowPrintModal] = useState(false);

  // States for the custom document evaluation feature
  const [activeEvaluation, setActiveEvaluation] = useState<CustomEvaluation | null>(null);
  const [viewMode, setViewMode] = useState<"lesson" | "evaluation" | "comunicado">("lesson");
  const [activeEvaluationTab, setActiveEvaluationTab] = useState<"student" | "answers">("student");

  // States for Parent Communications
  const [activeComunicado, setActiveComunicado] = useState<ParentCommunication | null>(null);
  const [savedComunicados, setSavedComunicados] = useState<SavedParentCommunication[]>([]);

  // Load saved lessons and communications from LocalStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("generador_clases_historico");
      if (stored) {
        setSavedLessons(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error al cargar histórico de clases:", e);
    }

    try {
      const storedCom = localStorage.getItem("generador_comunicados_historico");
      if (storedCom) {
        setSavedComunicados(JSON.parse(storedCom));
      }
    } catch (e) {
      console.error("Error al cargar histórico de comunicados:", e);
    }
  }, []);

  // Save lessons to LocalStorage when list changes
  const saveLessonsToStorage = (updated: SavedLessonPlan[]) => {
    try {
      localStorage.setItem("generador_clases_historico", JSON.stringify(updated));
      setSavedLessons(updated);
    } catch (e) {
      console.error("Error al guardar histórico de clases:", e);
    }
  };

  // Save communications to LocalStorage when list changes
  const saveComunicadosToStorage = (updated: SavedParentCommunication[]) => {
    try {
      localStorage.setItem("generador_comunicados_historico", JSON.stringify(updated));
      setSavedComunicados(updated);
    } catch (e) {
      console.error("Error al guardar histórico de comunicados:", e);
    }
  };

  const handleGenerate = async (formData: {
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
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-lesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, lang }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error del servidor (${response.status})`);
      }

      const data: LessonPlan = await response.json();
      setActiveLesson(data);
      setActiveTab("sequence");

      // Save to history
      const newSaved: SavedLessonPlan = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
        timestamp: Date.now(),
        data,
      };
      
      const updatedList = [newSaved, ...savedLessons].slice(0, 20); // Keep last 20
      saveLessonsToStorage(updatedList);
    } catch (err: any) {
      console.error("Error al generar sesión:", err);
      setError(err.message || "Ocurrió un error inesperado al generar la sesión de aprendizaje.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateEvaluation = async (evaluationData: {
    documentContent: string;
    documentName: string;
    documentMimeType: string;
    difficulty: string;
    questionTypes: string[];
    questionCount: number;
  }) => {
    setIsLoading(true);
    setError(null);
    setActiveEvaluation(null);

    try {
      const response = await fetch("/api/generate-evaluation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...evaluationData, lang }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error del servidor al generar evaluación (${response.status})`);
      }

      const data: CustomEvaluation = await response.json();
      setActiveEvaluation(data);
      setViewMode("evaluation");
      setActiveEvaluationTab("student");

      // Scroll smoothly to results area
      setTimeout(() => {
        const element = document.getElementById("evaluation-results-area");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } catch (err: any) {
      console.error("Error al generar evaluación personalizada:", err);
      setError(err.message || "Ocurrió un error inesperado al generar la evaluación.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadEvaluationDoc = (evaluation: CustomEvaluation) => {
    if (!evaluation) return;

    const examHtml = `
      <html xmlns:o='urn:schemas-microsoft-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${evaluation.titulo}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            color: #1e293b;
            line-height: 1.6;
            padding: 30px;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #10b981;
            padding-bottom: 12px;
            margin-bottom: 25px;
          }
          .header h1 {
            font-size: 20pt;
            margin: 0;
            font-weight: bold;
            color: #065f46;
          }
          .header p {
            font-size: 10pt;
            color: #64748b;
            margin: 5px 0 0 0;
            font-style: italic;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          .info-table td {
            border: 1px solid #cbd5e1;
            padding: 10px 12px;
            font-size: 11pt;
          }
          .instructions {
            border: 1px solid #10b981;
            background-color: #f0fdf4;
            padding: 15px;
            margin-bottom: 30px;
            font-size: 11pt;
            border-radius: 4px;
          }
          .question-item {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .question-title {
            font-weight: bold;
            font-size: 12pt;
            margin-bottom: 10px;
            color: #0f172a;
          }
          .options-list {
            margin-left: 20px;
            margin-bottom: 15px;
          }
          .option-item {
            margin-bottom: 8px;
            font-size: 11pt;
          }
          .write-space {
            height: 140px;
            border: 1px dashed #a7f3d0;
            margin-top: 10px;
            margin-bottom: 15px;
            background-color: #f9fafb;
          }
          .true-false-line {
            font-size: 11pt;
            margin-top: 5px;
            color: #334155;
          }
          .page-break {
            page-break-before: always;
          }
          .teacher-section {
            color: #065f46;
            background-color: #f0fdf4;
            border-left: 4px solid #10b981;
            padding: 12px;
            margin-top: 10px;
            font-size: 10.5pt;
          }
        </style>
      </head>
      <body>
        <!-- HOJA DEL ESTUDIANTE -->
        <div class="header">
          <h1>${evaluation.titulo.toUpperCase()}</h1>
          <p>Evaluación Formativa Basada en Documento de Referencia</p>
        </div>

        <table class="info-table">
          <tr>
            <td width="60%"><strong>Estudiante:</strong> ___________________________________________</td>
            <td width="40%"><strong>Fecha:</strong> ________________________</td>
          </tr>
          <tr>
            <td><strong>Dificultad del examen:</strong> ${evaluation.dificultad}</td>
            <td><strong>Nro. de Preguntas:</strong> ${evaluation.cantidadPreguntas}</td>
          </tr>
        </table>

        <div class="instructions">
          <strong>Instrucciones:</strong> ${evaluation.instrucciones}
        </div>

        <h2>CUESTIONARIO PARA EL ALUMNO</h2>
        <br/>
        ${evaluation.preguntas.map((q, idx) => {
          let optionsMarkup = "";
          if (q.tipo === "opcion_multiple" && q.opciones && q.opciones.length > 0) {
            optionsMarkup = `
              <table style="width:100%; margin-left: 15px;">
                ${q.opciones.map(opt => `<tr><td style="padding: 4px 0; font-size:11pt;">[   ] ${opt}</td></tr>`).join("")}
              </table>
            `;
          } else if (q.tipo === "verdadero_falso") {
            optionsMarkup = `<div class="true-false-line"><em>Marca con una (V) si es Verdadero o con una (F) si es Falso: [  ]</em></div>`;
          } else if (q.tipo === "juicio_critico") {
            optionsMarkup = `
              <div style="font-size: 10pt; color: #64748b; margin-top: 5px; font-style: italic;">Escribe tu respuesta y fundamenta tu análisis en el espacio provisto:</div>
              <div class="write-space"></div>
            `;
          }

          return `
            <div class="question-item">
              <div class="question-title">${idx + 1}. ${q.enunciado}</div>
              ${optionsMarkup}
            </div>
          `;
        }).join("")}

        <!-- SECCIÓN DEL DOCENTE (CLAVE DE RESPUESTAS) -->
        <div class="page-break"></div>
        
        <div class="header" style="border-bottom: 3px solid #059669;">
          <h1 style="color: #059669;">CLAVE DE CORRECCIÓN (SÓLO PARA EL DOCENTE)</h1>
          <p>Solucionario y Criterios de Evaluación Generados por IA</p>
        </div>

        <p style="font-size: 11pt; margin-bottom: 25px; font-style: italic;">Use este solucionario oficial generado automáticamente para guiar la corrección y la retroalimentación cualitativa de los estudiantes:</p>

        ${evaluation.preguntas.map((q, idx) => {
          return `
            <div class="question-item" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 20px;">
              <div class="question-title" style="color: #0f172a;">Pregunta ${idx + 1}: ${q.enunciado}</div>
              <div class="teacher-section">
                <strong>Respuesta / Solución Modelo:</strong><br/>
                <div style="margin-top: 5px; color: #0f172a;">${q.respuestaCorrecta}</div>
                <br/>
                <strong>Justificación Pedagógica o Criterio de Corrección:</strong><br/>
                <div style="margin-top: 5px; color: #334155;">${q.justificacion}</div>
              </div>
            </div>
          `;
        }).join("")}

      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + examHtml], {
      type: 'application/msword;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Evaluacion_${evaluation.titulo.replace(/[^a-zA-Z0-9]/g, "_")}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadComunicadoDoc = (comunicado: ParentCommunication) => {
    if (!comunicado) return;

    const documentHtml = `
      <html xmlns:o='urn:schemas-microsoft-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${comunicado.titulo}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            color: #1e293b;
            line-height: 1.6;
            padding: 40px;
          }
          .letter {
            max-width: 600px;
            margin: 0 auto;
            border: 1px solid #e2e8f0;
            padding: 40px;
            background-color: #ffffff;
          }
          .title {
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
            color: #1e1b4b;
            margin-bottom: 30px;
            text-transform: uppercase;
          }
          .saludo {
            font-weight: bold;
            margin-bottom: 20px;
          }
          .paragraph {
            margin-bottom: 20px;
            text-align: justify;
            text-indent: 30px;
          }
          .despedida {
            margin-top: 35px;
            margin-bottom: 50px;
          }
          .signature-area {
            text-align: center;
            margin-top: 60px;
          }
          .signature-line {
            width: 250px;
            border-top: 1px solid #475569;
            margin: 0 auto 10px auto;
          }
          .meta-info {
            font-size: 9pt;
            color: #64748b;
            margin-top: 80px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="letter">
          <div class="title">${comunicado.titulo}</div>
          <div class="saludo">${comunicado.saludo}</div>
          <div class="paragraph">${comunicado.introduccion}</div>
          <div class="paragraph">${comunicado.desarrollo}</div>
          <div class="paragraph">${comunicado.propuestaColaboracion}</div>
          <div class="despedida">${comunicado.despedida}</div>
          
          <div class="signature-area">
            <div class="signature-line"></div>
            <div style="font-weight: bold;">Equipo de Docencia y Tutoría</div>
            <div style="font-size: 10pt; color: #64748b;">Institución Educativa</div>
          </div>

          <div class="meta-info">
            <strong>Recomendaciones sugeridas para trabajar en el hogar:</strong>
            <ul>
              ${comunicado.sugerenciasCasa.map(sug => `<li>${sug}</li>`).join("")}
            </ul>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + documentHtml], {
      type: 'application/msword;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Comunicado_${comunicado.titulo.replace(/[^a-zA-Z0-9]/g, "_")}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerateComunicado = async (comunicadoData: { nombre: string; tema: string }) => {
    setIsLoading(true);
    setError(null);
    setActiveComunicado(null);

    try {
      const response = await fetch("/api/generate-comunicado", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...comunicadoData, lang }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error del servidor (${response.status})`);
      }

      const data: ParentCommunication = await response.json();
      setActiveComunicado(data);
      setViewMode("comunicado");

      // Save to history
      const newSaved: SavedParentCommunication = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
        timestamp: Date.now(),
        nombre: comunicadoData.nombre,
        tema: comunicadoData.tema,
        data,
      };

      const updatedList = [newSaved, ...savedComunicados].slice(0, 20); // Keep last 20
      saveComunicadosToStorage(updatedList);
    } catch (err: any) {
      console.error("Error al generar comunicado:", err);
      setError(err.message || "Ocurrió un error inesperado al generar el comunicado asertivo para padres.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSaved = (saved: SavedLessonPlan) => {
    setActiveLesson(saved.data);
    setActiveTab("sequence");
    // Scroll smoothly to top or results area
    const element = document.getElementById("lesson-results-area");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = savedLessons.filter((item) => item.id !== id);
    saveLessonsToStorage(filtered);
    if (activeLesson && !filtered.some((item) => item.data.titulo === activeLesson.titulo)) {
      // Keep active if wanted, or clear
    }
  };

  const handleSelectSavedComunicado = (saved: SavedParentCommunication) => {
    setActiveComunicado(saved.data);
    setViewMode("comunicado");
    // Scroll smoothly to results area
    const element = document.getElementById("lesson-results-area");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleDeleteSavedComunicado = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = savedComunicados.filter((item) => item.id !== id);
    saveComunicadosToStorage(filtered);
  };

  const handleCopyText = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSection(sectionKey);
      setTimeout(() => setCopiedSection(null), 2500);
    });
  };

  const handlePrint = () => {
    setShowPrintModal(true);
    try {
      window.focus();
      window.print();
    } catch (e) {
      console.error("Error al disparar window.print:", e);
    }
  };

  const handleDownloadPrintableHtml = (lesson: LessonPlan) => {
    if (!lesson) return;
    
    const didacticMaterialHtml = lesson.materialDidactico ? `
      <div class="section print-page-break">
        <div class="text-center">
          <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase;">${lesson.materialDidactico.titulo}</h2>
          <p class="italic" style="font-size: 12px; color: #475569; margin-bottom: 20px;">Material Didáctico Complementario (${lesson.materialDidactico.tipo})</p>
        </div>
        <div style="font-size: 13px; line-height: 1.6; color: #334155; padding: 20px; border: 1px solid #cbd5e1; background-color: #ffffff; white-space: pre-wrap;">
          ${lesson.materialDidactico.contenido}
        </div>
      </div>
    ` : "";

    const rubricHtml = lesson.rubrica ? `
      <div class="section print-page-break">
        <div class="text-center">
          <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase;">${lesson.rubrica.tituloRubrica}</h2>
          <p class="italic" style="font-size: 12px; color: #475569; margin-bottom: 20px;">Rúbrica de Evaluación de Desempeño</p>
        </div>
        <table class="rubric-table">
          <thead>
            <tr>
              <th style="width: 20%;">Criterio</th>
              <th style="width: 20%;">Excelente</th>
              <th style="width: 20%;">Bueno</th>
              <th style="width: 20%;">Regular</th>
              <th style="width: 20%;">Insuficiente</th>
            </tr>
          </thead>
          <tbody>
            ${lesson.rubrica.criterios.map(crit => `
              <tr>
                <td class="font-bold">${crit.criterio}</td>
                <td>${crit.excelente}</td>
                <td>${crit.bueno}</td>
                <td>${crit.regular}</td>
                <td>${crit.insuficiente}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : "";

    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Sesión de Aprendizaje - ${lesson.titulo}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #0f172a;
      line-height: 1.5;
      padding: 40px;
      max-width: 900px;
      margin: 0 auto;
      background-color: #fff;
    }
    h1, h2, h3, h4 {
      color: #1e293b;
      margin-top: 0;
    }
    .text-center { text-align: center; }
    .italic { font-style: italic; }
    .uppercase { text-transform: uppercase; }
    .font-bold { font-weight: bold; }
    .header {
      border-bottom: 3px solid #0f172a;
      padding-bottom: 15px;
      margin-bottom: 25px;
      text-align: center;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 5px;
    }
    .header p {
      font-size: 11px;
      font-family: monospace;
      color: #475569;
      margin: 0;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 25px;
    }
    .card {
      border: 1px solid #cbd5e1;
      padding: 15px;
      background-color: #f8fafc;
    }
    .card h3 {
      font-size: 14px;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
      border: 1px solid #cbd5e1;
    }
    .info-table td {
      padding: 10px 15px;
      border: 1px solid #cbd5e1;
      font-size: 13px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 800;
      text-transform: uppercase;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 5px;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    .block {
      border: 1px solid #cbd5e1;
      margin-bottom: 20px;
    }
    .block-header {
      background-color: #f1f5f9;
      padding: 8px 15px;
      border-bottom: 1px solid #cbd5e1;
      font-weight: bold;
      font-size: 13px;
      display: flex;
      justify-content: space-between;
    }
    .block-content {
      padding: 15px;
      font-size: 13px;
    }
    .activity-item {
      margin-bottom: 12px;
    }
    .activity-item:last-child {
      margin-bottom: 0;
    }
    .activity-type {
      font-weight: bold;
      text-decoration: underline;
      text-transform: uppercase;
    }
    .recursos {
      font-size: 11px;
      color: #475569;
      margin-top: 3px;
    }
    .rubric-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    .rubric-table th, .rubric-table td {
      border: 1px solid #cbd5e1;
      padding: 10px;
      font-size: 11px;
      vertical-align: top;
    }
    .rubric-table th {
      background-color: #f1f5f9;
      font-weight: bold;
    }
    .worksheet-instructions {
      border: 1px solid #cbd5e1;
      padding: 12px;
      background-color: #f8fafc;
      font-size: 13px;
      margin-bottom: 20px;
    }
    .exercise-item {
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .exercise-enunciado {
      font-size: 13px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .exercise-pista {
      font-size: 11px;
      color: #64748b;
      font-style: italic;
    }
    .exercise-space {
      height: 90px;
      border: 1px solid #e2e8f0;
      background-color: #fafafa;
      margin-top: 10px;
    }
    .print-page-break {
      page-break-before: always;
    }
    .print-button-container {
      background-color: #e2e8f0;
      padding: 15px;
      text-align: center;
      margin-bottom: 30px;
      border-radius: 8px;
    }
    .btn {
      background-color: #4f46e5;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      border-radius: 4px;
    }
    .btn:hover {
      background-color: #4338ca;
    }
    @media print {
      .print-button-container {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>

  <div class="print-button-container">
    <p style="margin-top: 0; font-size: 13px; color: #334155;">Este archivo está listo para ser impreso o guardado como PDF en tu computadora.</p>
    <button class="btn" onclick="window.print()">Imprimir / Guardar como PDF ahora</button>
  </div>

  <div class="header">
    <h1>PLANIFICACIÓN PEDAGÓGICA Y SECUENCIA DIDÁCTICA</h1>
    <p>Generado con Planificador de Clases Inteligente</p>
  </div>

  <table class="info-table">
    <tr>
      <td><strong>Sesión de Clase:</strong> ${lesson.titulo}</td>
      <td><strong>Nivel Educativo:</strong> ${lesson.nivel}</td>
    </tr>
    <tr>
      <td><strong>Temática:</strong> ${lesson.tema}</td>
      <td><strong>Duración Estimada:</strong> ${lesson.duracion}</td>
    </tr>
    <tr>
      <td colspan="2"><strong>Enfoque Pedagógico:</strong> ${lesson.enfoque}</td>
    </tr>
  </table>

  <div class="grid-2">
    <div class="card">
      <h3>Objetivos de Aprendizaje</h3>
      <p style="font-size: 13px; margin-bottom: 8px;"><strong>General:</strong> ${lesson.objetivos.objetivoGeneral}</p>
      <p style="font-size: 13px; font-weight: bold; margin-bottom: 4px;">Específicos:</p>
      <ul style="margin: 0; padding-left: 20px; font-size: 12px;">
        ${lesson.objetivos.objetivosEspecificos.map(item => `<li>${item}</li>`).join("")}
      </ul>
    </div>
    <div class="card">
      <h3>Materiales y Recursos</h3>
      <p style="font-size: 12px; margin-bottom: 8px;"><strong>Para el Docente:</strong><br><span style="color: #334155;">${lesson.materiales.docente.join(", ")}</span></p>
      <p style="font-size: 12px; margin: 0;"><strong>Para el Estudiante:</strong><br><span style="color: #334155;">${lesson.materiales.estudiante.join(", ")}</span></p>
    </div>
  </div>

  <div class="section-title">Secuencia Didáctica Paso a Paso</div>

  <div class="block">
    <div class="block-header">
      <span>01. INICIO (MOTIVACIÓN Y SABERES PREVIOS)</span>
      <span>${lesson.secuenciaDidactica.inicio.duracionEstimada}</span>
    </div>
    <div class="block-content">
      ${lesson.secuenciaDidactica.inicio.actividades.map(act => `
        <div class="activity-item">
          <span class="activity-type">${act.tipo}:</span> ${act.descripcion}
          ${act.recursos ? `<div class="recursos">Recursos: ${act.recursos}</div>` : ""}
        </div>
      `).join("")}
    </div>
  </div>

  <div class="block">
    <div class="block-header">
      <span>02. DESARROLLO (PROCESAMIENTO Y PRÁCTICA)</span>
      <span>${lesson.secuenciaDidactica.desarrollo.duracionEstimada}</span>
    </div>
    <div class="block-content">
      ${lesson.secuenciaDidactica.desarrollo.actividades.map(act => `
        <div class="activity-item">
          <span class="activity-type">${act.tipo}:</span> ${act.descripcion}
          ${act.recursos ? `<div class="recursos">Recursos: ${act.recursos}</div>` : ""}
        </div>
      `).join("")}
    </div>
  </div>

  <div class="block">
    <div class="block-header">
      <span>03. CIERRE (CONSOLIDACIÓN Y REFLEXIÓN)</span>
      <span>${lesson.secuenciaDidactica.cierre.duracionEstimada}</span>
    </div>
    <div class="block-content">
      ${lesson.secuenciaDidactica.cierre.actividades.map(act => `
        <div class="activity-item">
          <span class="activity-type">${act.tipo}:</span> ${act.descripcion}
          ${act.recursos ? `<div class="recursos">Recursos: ${act.recursos}</div>` : ""}
        </div>
      `).join("")}
    </div>
  </div>

  <div class="grid-2 print-page-break" style="margin-top: 30px;">
    <div class="card">
      <h3>Evaluación del Aprendizaje</h3>
      <p style="font-size: 12px; margin-bottom: 4px;"><strong>Evidencia:</strong> ${lesson.evaluacion.evidencia}</p>
      <p style="font-size: 12px; margin-bottom: 8px;"><strong>Instrumento:</strong> ${lesson.evaluacion.instrumento}</p>
      <p style="font-size: 12px; font-weight: bold; margin-bottom: 4px;">Criterios de Valoración:</p>
      <ul style="margin: 0; padding-left: 20px; font-size: 11px;">
        ${lesson.evaluacion.criterios.map(crit => `<li>${crit}</li>`).join("")}
      </ul>
    </div>
    <div class="card">
      <h3>Sugerencias Metodológicas</h3>
      <p style="font-size: 11px; margin-bottom: 8px;"><strong>Diferenciación / Inclusión:</strong><br><span style="color: #334155;">${lesson.sugerenciasDocente.diferenciacion}</span></p>
      <p style="font-size: 11px; font-weight: bold; margin-bottom: 4px;">Preguntas Socráticas:</p>
      <ul style="margin: 0; padding-left: 20px; font-size: 11px; font-style: italic;">
        ${lesson.sugerenciasDocente.preguntasClave.map(q => `<li>"${q}"</li>`).join("")}
      </ul>
    </div>
  </div>

  <div class="section print-page-break" style="margin-top: 40px;">
    <div class="text-center">
      <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">${lesson.fichaTrabajo.tituloFicha}</h2>
      <p style="font-size: 12px; color: #475569; margin-bottom: 20px;">Nombre del estudiante: _____________________________________ Fecha: ___________</p>
    </div>
    
    <div class="worksheet-instructions">
      <strong>Instrucciones:</strong> ${lesson.fichaTrabajo.instrucciones}
    </div>

    <div style="margin-top: 20px;">
      ${lesson.fichaTrabajo.ejercicios.map((ej, idx) => `
        <div class="exercise-item">
          <div class="exercise-enunciado">Pregunta ${idx + 1}: ${ej.enunciado}</div>
          ${ej.pistas ? `<div class="exercise-pista">Pista: ${ej.pistas}</div>` : ""}
          <div class="exercise-space"></div>
        </div>
      `).join("")}
    </div>
  </div>

  ${didacticMaterialHtml}
  ${rubricHtml}

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Plan_de_Clase_${lesson.titulo.replace(/[^a-zA-Z0-9]/g, "_")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Compile a markdown/text version of the lesson plan to copy
  const getFullMarkdown = (lesson: LessonPlan) => {
    if (!lesson) return "";
    let markdownText = `
# SESIÓN DE APRENDIZAJE: ${lesson.titulo.toUpperCase()}
**Tema**: ${lesson.tema}
**Nivel Educativo**: ${lesson.nivel}
**Duración**: ${lesson.duracion}
**Enfoque Pedagógico**: ${lesson.enfoque}

## OBJETIVOS DE APRENDIZAJE
- **Objetivo General**: ${lesson.objetivos.objetivoGeneral}
${lesson.objetivos.objetivosEspecificos.map(o => `- **Objetivo Específico**: ${o}`).join("\n")}
${lesson.objetivos.competencias.map(c => `- **Competencia**: ${c}`).join("\n")}

## MATERIALES Y RECURSOS
### Para el Docente:
${lesson.materiales.docente.map(m => `- ${m}`).join("\n")}
### Para el Estudiante:
${lesson.materiales.estudiante.map(m => `- ${m}`).join("\n")}

## SECUENCIA DIDÁCTICA

### 1. INICIO (${lesson.secuenciaDidactica.inicio.duracionEstimada})
${lesson.secuenciaDidactica.inicio.actividades.map(act => `- **${act.tipo}**: ${act.descripcion} ${act.recursos ? `(Recursos: ${act.recursos})` : ""}`).join("\n")}

### 2. DESARROLLO (${lesson.secuenciaDidactica.desarrollo.duracionEstimada})
${lesson.secuenciaDidactica.desarrollo.actividades.map(act => `- **${act.tipo}**: ${act.descripcion} ${act.recursos ? `(Recursos: ${act.recursos})` : ""}`).join("\n")}

### 3. CIERRE (${lesson.secuenciaDidactica.cierre.duracionEstimada})
${lesson.secuenciaDidactica.cierre.actividades.map(act => `- **${act.tipo}**: ${act.descripcion} ${act.recursos ? `(Recursos: ${act.recursos})` : ""}`).join("\n")}

## EVALUACIÓN
- **Evidencia**: ${lesson.evaluacion.evidencia}
- **Instrumento Recomendado**: ${lesson.evaluacion.instrumento}
- **Criterios de Evaluación**:
${lesson.evaluacion.criterios.map(crit => `- ${crit}`).join("\n")}

## SUGERENCIAS DE ATENCIÓN A LA DIVERSIDAD (DIFERENCIACIÓN)
${lesson.sugerenciasDocente.diferenciacion}

## PREGUNTAS CLAVE PARA EL DOCENTE
${lesson.sugerenciasDocente.preguntasClave.map(p => `- ${p}`).join("\n")}

## FICHA DE TRABAJO PARA EL ESTUDIANTE: ${lesson.fichaTrabajo.tituloFicha}
*Instrucciones*: ${lesson.fichaTrabajo.instrucciones}
${lesson.fichaTrabajo.ejercicios.map((ej, index) => `
${index + 1}. ${ej.enunciado}
   *Sugerencia/Pista*: ${ej.pistas || "N/A"}
   *Solución Esperada*: ${ej.solucionSugerida}`).join("\n")}
`;

    if (lesson.rubrica && lesson.rubrica.criterios && lesson.rubrica.criterios.length > 0) {
      markdownText += `

## RÚBRICA DE EVALUACIÓN: ${lesson.rubrica.tituloRubrica}

| Criterio | Excelente | Bueno | Regular | Insuficiente |
| :--- | :--- | :--- | :--- | :--- |
${lesson.rubrica.criterios.map(crit => `| **${crit.criterio}** | ${crit.excelente} | ${crit.bueno} | ${crit.regular} | ${crit.insuficiente} |`).join("\n")}
`;
    }

    if (lesson.materialDidactico && lesson.materialDidactico.contenido) {
      markdownText += `

## MATERIAL DIDÁCTICO PERSONALIZADO: ${lesson.materialDidactico.titulo}
**Tipo**: ${lesson.materialDidactico.tipo}

${lesson.materialDidactico.contenido}
`;
    }

    return markdownText.trim();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased">
      
      {/* Top Header - Geometric Balance Style */}
      <header className="h-20 bg-white border-b border-slate-200 px-6 md:px-12 flex items-center justify-between shrink-0 no-print">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-none flex items-center justify-center text-white font-bold text-xl font-display">L</div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-800 uppercase font-display">
              {lang === "en" ? "ACADEMIC PLANNING SYSTEM" : "SISTEMA DE PLANIFICACIÓN ACADÉMICA"}
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
              {lang === "en" ? "Structured Learning Session" : "Sesión de Aprendizaje Estructurada"}
            </p>
          </div>
        </div>

        {/* Language Switcher and Active Info */}
        <div className="flex items-center space-x-6">
          <div className="hidden md:flex space-x-6">
            {activeLesson ? (
              <>
                <div className="text-right border-l border-slate-200 pl-6">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    {lang === "en" ? "Active Topic" : "Temática Activa"}
                  </p>
                  <p className="text-sm font-semibold text-indigo-600 truncate max-w-[200px]">{activeLesson.tema}</p>
                </div>
                <div className="text-right border-l border-slate-200 pl-6">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    {lang === "en" ? "Duration" : "Duración"}
                  </p>
                  <p className="text-sm font-semibold text-slate-700">{activeLesson.duracion}</p>
                </div>
              </>
            ) : (
              <div className="text-right border-l border-slate-200 pl-6 flex items-center">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  {lang === "en" ? "Waiting for parameters..." : "Esperando parámetros de entrada..."}
                </span>
              </div>
            )}
          </div>

          {/* Elegant Language Selection Toggle */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setLang("es")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                lang === "es"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              ES
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                lang === "en"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden no-print">
        
        {/* Left column: Setup & History */}
        <aside className="w-full lg:w-[420px] bg-slate-50 border-r border-slate-200 p-6 md:p-8 flex flex-col space-y-6 lg:overflow-y-auto shrink-0">
          
          {/* Main View Mode Selector (Suite Toggle) */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-250">
            <button
              onClick={() => {
                setViewMode("lesson");
              }}
              className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                viewMode !== "comunicado"
                  ? "bg-white text-indigo-700 shadow-md shadow-indigo-600/5 font-black"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{lang === "en" ? "Plans & Eval" : "Planes y Eval."}</span>
            </button>
            <button
              onClick={() => {
                setViewMode("comunicado");
              }}
              className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                viewMode === "comunicado"
                  ? "bg-white text-indigo-700 shadow-md shadow-indigo-600/5 font-black"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>{lang === "en" ? "Communications" : "Comunicados"}</span>
            </button>
          </div>

          {viewMode !== "comunicado" ? (
            <>
              {/* Main setup form */}
              <LessonForm onGenerate={handleGenerate} onGenerateEvaluation={handleGenerateEvaluation} isLoading={isLoading} lang={lang} />

              {/* History / Saved Sessions */}
              <div className="border-t border-slate-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    {lang === "en" ? `Saved Sessions (${savedLessons.length})` : `Sesiones Guardadas (${savedLessons.length})`}
                  </h3>
                  {savedLessons.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm(lang === "en" ? "Are you sure you want to clear your class history?" : "¿Estás seguro de borrar todo el historial?")) {
                          saveLessonsToStorage([]);
                        }
                      }}
                      className="text-xs text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{lang === "en" ? "Clear" : "Limpiar"}</span>
                    </button>
                  )}
                </div>

                {savedLessons.length === 0 ? (
                  <div className="bg-white border border-slate-200 border-dashed p-6 text-center">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">{lang === "en" ? "No sessions in history" : "Sin sesiones en el historial"}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{lang === "en" ? "Lessons you generate will be automatically saved here." : "Las clases que generes se guardarán automáticamente aquí."}</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[300px] lg:max-h-none overflow-y-auto pr-1">
                    {savedLessons.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectSaved(item)}
                        className={`p-4 bg-white border cursor-pointer group transition-all flex justify-between items-start ${
                          activeLesson && activeLesson.titulo === item.data.titulo
                            ? "border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50/10"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[9px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 border border-slate-200 font-bold">
                              {item.data.nivel.split(" ")[0]}
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight truncate">
                            {item.data.titulo}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">{lang === "en" ? "Topic" : "Tema"}: {item.data.tema}</p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteSaved(item.id, e)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors ml-2 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title={lang === "en" ? "Delete from history" : "Eliminar de mi historial"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Comunicado form */}
              <ComunicadoForm onGenerate={handleGenerateComunicado} isLoading={isLoading} lang={lang} />

              {/* History / Saved Comunicados */}
              <div className="border-t border-slate-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    {lang === "en" ? `Saved Communications (${savedComunicados.length})` : `Comunicados Guardados (${savedComunicados.length})`}
                  </h3>
                  {savedComunicados.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm(lang === "en" ? "Are you sure you want to clear your communication history?" : "¿Estás seguro de borrar todo el historial de comunicados?")) {
                          saveComunicadosToStorage([]);
                        }
                      }}
                      className="text-xs text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{lang === "en" ? "Clear" : "Limpiar"}</span>
                    </button>
                  )}
                </div>

                {savedComunicados.length === 0 ? (
                  <div className="bg-white border border-slate-200 border-dashed p-6 text-center">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">{lang === "en" ? "No communications in history" : "Sin comunicados en el historial"}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{lang === "en" ? "Assertive communications will be automatically saved here." : "Los comunicados asertivos se guardarán automáticamente aquí."}</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[300px] lg:max-h-none overflow-y-auto pr-1">
                    {savedComunicados.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectSavedComunicado(item)}
                        className={`p-4 bg-white border cursor-pointer group transition-all flex justify-between items-start ${
                          activeComunicado && activeComunicado.titulo === item.data.titulo
                            ? "border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50/10"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[9px] font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.5 border border-emerald-200 font-bold uppercase">
                              {lang === "en" ? "Communication" : "Comunicado"}
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight truncate">
                            {item.data.titulo}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">{lang === "en" ? "Student" : "Alumno"}: {item.nombre}</p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteSavedComunicado(item.id, e)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors ml-2 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title={lang === "en" ? "Delete from history" : "Eliminar de mi historial"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </aside>

        {/* Right Area: Results Screen */}
        <section id="lesson-results-area" className="flex-1 bg-white p-6 md:p-8 lg:p-12 overflow-y-auto flex flex-col">
          {error && (
            <div className="bg-rose-50 border border-rose-200 p-6 mb-8 text-rose-800 flex items-start space-x-3 rounded-none">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wide">
                  {lang === "en" ? "Error generating content" : "Error al generar la clase"}
                </h4>
                <p className="text-xs mt-1 leading-relaxed">{error}</p>
                <div className="mt-4 flex space-x-3">
                  <button 
                    onClick={() => {
                      if (document.getElementById("theme-input")) {
                        document.getElementById("theme-input")?.focus();
                      }
                    }} 
                    className="text-xs font-bold underline text-rose-900 uppercase tracking-widest hover:text-rose-950"
                  >
                    {lang === "en" ? "Modify parameters" : "Modificar parámetros"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {(viewMode === "comunicado" && !activeComunicado) || (viewMode !== "comunicado" && !activeLesson && !activeEvaluation) ? (
            viewMode === "comunicado" ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
                <div className="w-16 h-16 bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400 mb-6">
                  <Megaphone className="w-8 h-8 text-indigo-500" />
                </div>
                <h3 className="text-xl font-light text-slate-800 uppercase tracking-wider font-display">
                  {t.welcomeCommTitle}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mt-2 leading-relaxed">
                  {t.welcomeCommDesc}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-indigo-500" /> {t.welcomeCommFeature1}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-500" /> {t.welcomeCommFeature2}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-500" /> {t.welcomeCommFeature3}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
                <div className="w-16 h-16 bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400 font-light text-2xl mb-6">
                  L
                </div>
                <h3 className="text-xl font-light text-slate-800 uppercase tracking-wider font-display">
                  {t.welcomePlansTitle}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mt-2 leading-relaxed">
                  {t.welcomePlansDesc}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-indigo-500" /> {t.welcomePlansFeature1}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-500" /> {t.welcomePlansFeature2}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-indigo-500" /> {t.welcomePlansFeature3}
                  </span>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-6 flex-1 flex flex-col">
              {/* View Mode Toggle Header */}
              {(activeLesson || activeEvaluation) && (
                <div className="flex border border-slate-200 bg-slate-50 p-1 rounded-xl self-start shrink-0">
                  {activeLesson && (
                    <button
                      onClick={() => setViewMode("lesson")}
                      className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center space-x-2 cursor-pointer ${
                        viewMode === "lesson"
                          ? "bg-white text-indigo-700 shadow-sm border border-slate-200/20"
                          : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>{lang === "en" ? "Pedagogical Lesson Plan" : "Planificación Pedagógica"}</span>
                    </button>
                  )}
                  {activeEvaluation && (
                    <button
                      id="evaluation-results-area"
                      onClick={() => setViewMode("evaluation")}
                      className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center space-x-2 cursor-pointer ${
                        viewMode === "evaluation"
                          ? "bg-white text-emerald-700 shadow-sm border border-slate-200/20"
                          : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      <Award className="w-4 h-4" />
                      <span>{lang === "en" ? "Document Assessment" : "Evaluación de Documento"}</span>
                    </button>
                  )}
                </div>
              )}

              {viewMode === "lesson" && activeLesson && (
                <div className="space-y-8 flex-1 flex flex-col">
              
              {/* Session Core Info Header */}
              <div className="border-b border-slate-200 pb-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2.5 py-1 uppercase font-black border border-indigo-200/50">
                    {activeLesson.nivel}
                  </span>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2.5 py-1 uppercase font-black border border-slate-200">
                    {activeLesson.enfoque}
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2.5 py-1 uppercase font-black border border-emerald-200/50">
                    {activeLesson.duracion}
                  </span>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-light text-slate-900 uppercase tracking-tight font-display">
                      {lang === "en" ? "Session:" : "Sesión:"} <span className="font-bold text-slate-800">{activeLesson.titulo}</span>
                    </h2>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
                      {lang === "en" ? "Main Thematic Axis:" : "Eje Temático Principal:"} <span className="text-slate-700 font-bold">{activeLesson.tema}</span>
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center space-x-2 shrink-0 self-start">
                    <button
                      onClick={() => handleCopyText(getFullMarkdown(activeLesson), "full")}
                      className="px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer"
                    >
                      {copiedSection === "full" ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>{lang === "en" ? "Copied!" : "¡Copiado!"}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>{lang === "en" ? "Copy Markdown" : "Copiar Markdown"}</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handlePrint}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>{lang === "en" ? "Print / PDF" : "Imprimir / PDF"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Lesson Tabs - Navigation inside Workspace */}
              <div className="border-b border-slate-200 flex space-x-1.5">
                <button
                  onClick={() => setActiveTab("sequence")}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                    activeTab === "sequence"
                      ? "border-indigo-600 text-indigo-600 font-black"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {lang === "en" ? "1. Didactic Sequence" : "1. Secuencia Didáctica"}
                </button>
                <button
                  onClick={() => setActiveTab("worksheet")}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                    activeTab === "worksheet"
                      ? "border-indigo-600 text-indigo-600 font-black"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {lang === "en" ? "2. Student Worksheet" : "2. Ficha de Trabajo"}
                </button>
                <button
                  onClick={() => setActiveTab("evaluation")}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                    activeTab === "evaluation"
                      ? "border-indigo-600 text-indigo-600 font-black"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {lang === "en" ? "3. Assessment & Advice" : "3. Evaluación & Consejos"}
                </button>
                {activeLesson.rubrica && (
                  <button
                    onClick={() => setActiveTab("rubric")}
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                      activeTab === "rubric"
                        ? "border-indigo-600 text-indigo-600 font-black"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {lang === "en" ? "4. Evaluation Rubric" : "4. Rúbrica de Evaluación"}
                  </button>
                )}
                {activeLesson.materialDidactico && activeLesson.materialDidactico.contenido && (
                  <button
                    onClick={() => setActiveTab("didactic_material")}
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                      activeTab === "didactic_material"
                        ? "border-emerald-600 text-emerald-600 font-black"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {lang === "en" ? "✨ Didactic Material" : "✨ Material Didáctico"}
                  </button>
                )}
              </div>

              {/* Tab Content 1: Sequence */}
              {activeTab === "sequence" && (
                <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                  
                  {/* Left sub-column: Goals and Materials */}
                  <div className="xl:col-span-1 space-y-6">
                    <div className="bg-slate-50 border border-slate-200 p-6 space-y-6">
                      
                      {/* Learning Goals */}
                      <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">
                          {lang === "en" ? "Learning Objectives" : "Objetivos de Aprendizaje"}
                        </h3>
                        <div className="space-y-3">
                          <div className="bg-white p-4 border border-slate-200/60 shadow-sm">
                            <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">
                              {lang === "en" ? "General" : "General"}
                            </p>
                            <p className="text-xs leading-relaxed text-slate-700 font-medium">
                              {activeLesson.objetivos.objetivoGeneral}
                            </p>
                          </div>
                          
                          {activeLesson.objetivos.objetivosEspecificos.length > 0 && (
                            <div className="space-y-2 pt-2">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                {lang === "en" ? "Specific" : "Específicos"}
                              </p>
                              <ul className="space-y-2">
                                {activeLesson.objetivos.objetivosEspecificos.map((item, idx) => (
                                  <li key={idx} className="flex items-start space-x-2">
                                    <div className="mt-1.5 w-1.5 h-1.5 bg-indigo-500 shrink-0"></div>
                                    <span className="text-xs text-slate-600 leading-relaxed">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {activeLesson.objetivos.competencias && activeLesson.objetivos.competencias.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-slate-200/60">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                {lang === "en" ? "Key Competencies" : "Competencias Clave"}
                              </p>
                              <ul className="space-y-2">
                                {activeLesson.objetivos.competencias.map((item, idx) => (
                                  <li key={idx} className="flex items-start space-x-2">
                                    <div className="mt-1.5 w-1.5 h-1.5 bg-slate-400 shrink-0"></div>
                                    <span className="text-xs text-slate-600 leading-relaxed italic">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Required Resources / Materials */}
                      <div className="border-t border-slate-200 pt-5 space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          {lang === "en" ? "Required Resources" : "Recursos Necesarios"}
                        </h3>
                        
                        <div className="space-y-3.5">
                          <div>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                              {lang === "en" ? "For the Teacher" : "Del Docente"}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {activeLesson.materiales.docente.map((item, idx) => (
                                <span 
                                  key={idx} 
                                  className="bg-white border border-slate-200 px-2.5 py-1 text-[11px] text-slate-700 font-medium font-sans"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                              {lang === "en" ? "For the Student" : "Del Estudiante"}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {activeLesson.materiales.estudiante.map((item, idx) => (
                                <span 
                                  key={idx} 
                                  className="bg-white border border-slate-200 px-2.5 py-1 text-[11px] text-slate-700 font-medium font-sans"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Right sub-column: Timeline / Sequence */}
                  <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                        {lang === "en" ? "Class Structure" : "Estructura de la Clase"}
                      </h3>
                      <div className="flex space-x-1.5">
                        <div className="w-2.5 h-2.5 bg-slate-200"></div>
                        <div className="w-2.5 h-2.5 bg-slate-400"></div>
                        <div className="w-2.5 h-2.5 bg-indigo-600"></div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* INICIO */}
                      <div className="bg-white border border-slate-200 flex items-stretch hover:shadow-sm transition-all group">
                        <div className="w-14 bg-slate-100 flex flex-col items-center justify-center border-r border-slate-200 text-slate-400 font-mono text-base font-bold select-none shrink-0">
                          <span>01</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            {lang === "en" ? "BEG" : "INI"}
                          </span>
                        </div>
                        <div className="p-5 md:p-6 flex-1 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2">
                            <h4 className="font-bold text-slate-800 uppercase tracking-wide text-xs">
                              {lang === "en" ? "Beginning Phase (Connection & Motivation)" : "Fase de Inicio (Conexión y Motivación)"}
                            </h4>
                            <span className="text-[11px] font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 font-bold self-start sm:self-center">
                              {activeLesson.secuenciaDidactica.inicio.duracionEstimada}
                            </span>
                          </div>
                          
                          <div className="space-y-3.5">
                            {activeLesson.secuenciaDidactica.inicio.actividades.map((act, idx) => (
                              <div key={idx} className="space-y-1">
                                <span className="inline-block text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-1.5 py-0.5 border border-indigo-100">
                                  {act.tipo}
                                </span>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                  {act.descripcion}
                                </p>
                                {act.recursos && (
                                  <p className="text-[11px] text-slate-400 italic">
                                    Recursos específicos: {act.recursos}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="w-1.5 bg-indigo-300"></div>
                      </div>

                      {/* DESARROLLO */}
                      <div className="bg-white border border-slate-200 flex items-stretch hover:shadow-sm transition-all">
                        <div className="w-14 bg-slate-100 flex flex-col items-center justify-center border-r border-slate-200 text-slate-400 font-mono text-base font-bold select-none shrink-0">
                          <span>02</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            {lang === "en" ? "DEV" : "DES"}
                          </span>
                        </div>
                        <div className="p-5 md:p-6 flex-1 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2">
                            <h4 className="font-bold text-slate-800 uppercase tracking-wide text-xs">
                              {lang === "en" ? "Development Phase (Processing & Practice)" : "Fase de Desarrollo (Procesamiento y Práctica)"}
                            </h4>
                            <span className="text-[11px] font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 font-bold self-start sm:self-center">
                              {activeLesson.secuenciaDidactica.desarrollo.duracionEstimada}
                            </span>
                          </div>
                          
                          <div className="space-y-4">
                            {activeLesson.secuenciaDidactica.desarrollo.actividades.map((act, idx) => (
                              <div key={idx} className="space-y-1 border-l-2 border-indigo-100 pl-3">
                                <span className="inline-block text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-1.5 py-0.5 border border-indigo-100">
                                  {act.tipo}
                                </span>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                  {act.descripcion}
                                </p>
                                {act.recursos && (
                                  <p className="text-[11px] text-slate-400 italic">
                                    {lang === "en" ? "Specific resources:" : "Recursos específicos:"} {act.recursos}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="w-1.5 bg-indigo-500"></div>
                      </div>

                      {/* CIERRE */}
                      <div className="bg-white border border-slate-200 flex items-stretch hover:shadow-sm transition-all">
                        <div className="w-14 bg-slate-100 flex flex-col items-center justify-center border-r border-slate-200 text-slate-400 font-mono text-base font-bold select-none shrink-0">
                          <span>03</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            {lang === "en" ? "END" : "CIE"}
                          </span>
                        </div>
                        <div className="p-5 md:p-6 flex-1 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2">
                            <h4 className="font-bold text-slate-800 uppercase tracking-wide text-xs">
                              {lang === "en" ? "Closing Phase (Reflection & Assessment)" : "Fase de Cierre (Reflexión y Evaluación)"}
                            </h4>
                            <span className="text-[11px] font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 font-bold self-start sm:self-center">
                              {activeLesson.secuenciaDidactica.cierre.duracionEstimada}
                            </span>
                          </div>
                          
                          <div className="space-y-3.5">
                            {activeLesson.secuenciaDidactica.cierre.actividades.map((act, idx) => (
                              <div key={idx} className="space-y-1">
                                <span className="inline-block text-[10px] font-bold text-indigo-800 uppercase tracking-wider bg-indigo-50 px-1.5 py-0.5 border border-indigo-100">
                                  {act.tipo}
                                </span>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                  {act.descripcion}
                                </p>
                                {act.recursos && (
                                  <p className="text-[11px] text-slate-400 italic">
                                    {lang === "en" ? "Specific resources:" : "Recursos específicos:"} {act.recursos}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="w-1.5 bg-slate-800"></div>
                      </div>

                    </div>
                  </div>

                </div>
              )}

              {/* Tab Content 2: Worksheet */}
              {activeTab === "worksheet" && (
                <div className="flex-1 bg-slate-50 border border-slate-200 p-6 md:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block mb-0.5">
                        {lang === "en" ? "DELIVERABLE MATERIAL" : "MATERIAL ENTREGABLE"}
                      </span>
                      <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
                        {activeLesson.fichaTrabajo.tituloFicha}
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        const exercisesText = activeLesson.fichaTrabajo.ejercicios.map((ej, index) => {
                          const qLabel = lang === "en" ? "Question" : "Pregunta";
                          const pLabel = lang === "en" ? "Hint" : "Pista";
                          const sLabel = lang === "en" ? "Recommended Solution" : "Solución recomendada";
                          return `${index + 1}. ${qLabel}: ${ej.enunciado}\n   ${pLabel}: ${ej.pistas || "N/A"}\n   ${sLabel}: ${ej.solucionSugerida}`;
                        }).join("\n\n");
                        const wsTitle = lang === "en" ? "STUDENT WORKSHEET" : "FICHA DE TRABAJO";
                        const instLabel = lang === "en" ? "Instructions" : "Instrucciones";
                        const exLabel = lang === "en" ? "Exercises" : "Ejercicios";
                        const fullText = `${wsTitle}: ${activeLesson.fichaTrabajo.tituloFicha}\n\n${instLabel}:\n${activeLesson.fichaTrabajo.instrucciones}\n\n${exLabel}:\n${exercisesText}`;
                        handleCopyText(fullText, "worksheet");
                      }}
                      className="px-4.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shadow-sm hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer self-start sm:self-center"
                    >
                      {copiedSection === "worksheet" ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>{lang === "en" ? "Copied!" : "¡Copia Lista!"}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>{lang === "en" ? "Copy Worksheet" : "Copiar Ficha de Trabajo"}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Instructions banner */}
                  <div className="bg-white border-l-4 border-indigo-600 p-4 shadow-sm">
                    <span className="text-[9px] font-black text-indigo-700 uppercase block mb-1">
                      {lang === "en" ? "Student Instructions:" : "Instrucciones para el Estudiante:"}
                    </span>
                    <p className="text-xs text-slate-600 italic leading-relaxed">{activeLesson.fichaTrabajo.instrucciones}</p>
                  </div>

                  {/* Exercises Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeLesson.fichaTrabajo.ejercicios.map((ej, index) => (
                      <div key={index} className="bg-white border border-slate-200 p-6 flex flex-col space-y-4">
                        <div className="flex justify-between items-start">
                          <span className="w-8 h-8 bg-slate-100 flex items-center justify-center font-mono text-xs font-bold text-slate-500 border border-slate-200">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>
                        
                        <div className="space-y-1.5 flex-1">
                          <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                            {lang === "en" ? "Question or Premise:" : "Pregunta o Enunciado:"}
                          </p>
                          <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 border border-slate-100 p-3">
                            {ej.enunciado}
                          </p>
                        </div>

                        {ej.pistas && (
                          <div className="text-[11px] text-slate-500 italic bg-amber-50/50 border border-amber-100/50 p-2.5">
                            <span className="font-bold text-amber-800 not-italic uppercase text-[9px] block mb-0.5">
                              {lang === "en" ? "Support Hint:" : "Pista de Apoyo:"}
                            </span>
                            {ej.pistas}
                          </div>
                        )}

                        <details className="group border-t border-slate-100 pt-3">
                          <summary className="text-[10px] font-bold uppercase text-indigo-600 hover:text-indigo-800 cursor-pointer list-none flex items-center justify-between">
                            <span>{lang === "en" ? "View Expected Solution" : "Ver Solución Esperada"}</span>
                            <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90 text-indigo-500" />
                          </summary>
                          <p className="text-xs text-slate-600 mt-2 bg-indigo-50/20 border border-indigo-100/30 p-3 italic leading-relaxed">
                            {ej.solucionSugerida}
                          </p>
                        </details>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab Content 3: Evaluation */}
              {activeTab === "evaluation" && (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  
                  {/* Evaluation Metrics & Evidence */}
                  <div className="lg:col-span-2 bg-slate-50 border border-slate-200 p-6 md:p-8 space-y-6">
                    <div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">
                        {lang === "en" ? "Evaluation System & Metrics" : "Sistema y Métricas de Evaluación"}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-5 border border-slate-200 flex flex-col justify-between">
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                              {lang === "en" ? "Evidence of Learning" : "Evidencia de Aprendizaje"}
                            </p>
                            <p className="text-xs font-bold text-slate-800 uppercase tracking-tight mb-2">
                              {lang === "en" ? "Deliverable Product" : "Producto Entregable"}
                            </p>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {activeLesson.evaluacion.evidencia}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white p-5 border border-slate-200 flex flex-col justify-between">
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                              {lang === "en" ? "Suggested Instrument" : "Instrumento Sugerido"}
                            </p>
                            <p className="text-xs font-bold text-slate-800 uppercase tracking-tight mb-2">
                              {lang === "en" ? "Assessment Tool" : "Herramienta de Valoración"}
                            </p>
                            <p className="text-xs text-slate-600 leading-relaxed font-mono">
                              {activeLesson.evaluacion.instrumento}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">
                        {lang === "en" ? "Formative Evaluation Criteria" : "Criterios de Evaluación Formativa"}
                      </p>
                      <div className="space-y-2">
                        {activeLesson.evaluacion.criterios.map((crit, idx) => (
                          <div key={idx} className="bg-white p-4 border border-slate-200 flex items-start space-x-3">
                            <span className="w-5 h-5 bg-indigo-50 border border-indigo-200 rounded-none flex items-center justify-center font-mono text-[10px] font-black text-indigo-700 shrink-0">
                              {idx + 1}
                            </span>
                            <p className="text-xs text-slate-700 leading-relaxed font-medium">
                              {crit}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Teacher Guidance / Sugerencias */}
                  <div className="lg:col-span-1 space-y-6">
                    
                    {/* Key Questions */}
                    <div className="bg-slate-950 p-6 text-white space-y-4">
                      <div>
                        <span className="text-[9px] text-indigo-400 uppercase font-black tracking-widest">
                          {lang === "en" ? "ACTIVE LEARNING" : "DIDÁCTICA ACTIVA"}
                        </span>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mt-0.5">
                          {lang === "en" ? "High Cognitive Demand Questions" : "Preguntas de Alta Demanda Cognitiva"}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {lang === "en" 
                          ? "Use these trigger questions during class development to generate socratic debate and challenge student logic:" 
                          : "Utiliza estas preguntas disparadoras durante el desarrollo de la clase para generar debate socrático y desafiar la lógica de los estudiantes:"}
                      </p>
                      <ul className="space-y-3 pt-2">
                        {activeLesson.sugerenciasDocente.preguntasClave.map((pregunta, idx) => (
                          <li key={idx} className="flex items-start space-x-2.5">
                            <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                            <span className="text-xs text-slate-200 italic leading-relaxed">{pregunta}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Inclusive Pedagogy / Differentiation */}
                    <div className="bg-indigo-50 border-l-4 border-indigo-600 p-6 space-y-3">
                      <div>
                        <span className="text-[9px] text-indigo-700 font-bold uppercase tracking-wider block">
                          {lang === "en" ? "ATTENTION TO DIVERSITY" : "ATENCIÓN A LA DIVERSIDAD"}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          {lang === "en" ? "Differentiation Strategies" : "Estrategias de Diferenciación"}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                        {activeLesson.sugerenciasDocente.diferenciacion}
                      </p>
                    </div>

                  </div>
                </div>
              )}

              {/* Tab Content 4: Rubric */}
              {activeTab === "rubric" && activeLesson.rubrica && (
                <div className="flex-1 bg-slate-50 border border-slate-200 p-6 md:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block mb-0.5">
                        {lang === "en" ? "FORMAL ASSESSMENT" : "EVALUACIÓN FORMAL"}
                      </span>
                      <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
                        {activeLesson.rubrica.tituloRubrica}
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        const rubHeader = lang === "en" ? "EVALUATION RUBRIC" : "RÚBRICA DE EVALUACIÓN";
                        let rubricText = `${rubHeader}: ${activeLesson.rubrica?.tituloRubrica}\n\n`;
                        activeLesson.rubrica?.criterios.forEach((crit, index) => {
                          const critLabel = lang === "en" ? "Criteria" : "Criterio";
                          const excLabel = lang === "en" ? "Excellent" : "Excelente";
                          const gdLabel = lang === "en" ? "Good" : "Bueno";
                          const frLabel = lang === "en" ? "Fair" : "Regular";
                          const prLabel = lang === "en" ? "Needs Improvement" : "Insuficiente";
                          rubricText += `${index + 1}. ${critLabel}: ${crit.criterio}\n`;
                          rubricText += `   - ${excLabel}: ${crit.excelente}\n`;
                          rubricText += `   - ${gdLabel}: ${crit.bueno}\n`;
                          rubricText += `   - ${frLabel}: ${crit.regular}\n`;
                          rubricText += `   - ${prLabel}: ${crit.insuficiente}\n\n`;
                        });
                        handleCopyText(rubricText, "rubric");
                      }}
                      className="px-4.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shadow-sm hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer self-start sm:self-center"
                    >
                      {copiedSection === "rubric" ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>{lang === "en" ? "Copied!" : "¡Copia Lista!"}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>{lang === "en" ? "Copy Complete Rubric" : "Copiar Rúbrica completa"}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Interactive rubric table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-slate-200 bg-white shadow-sm rounded-none">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-4 text-xs font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200 min-w-[150px]">
                            {lang === "en" ? "Criteria / Aspect" : "Criterio / Aspecto"}
                          </th>
                          <th className="p-4 text-xs font-bold text-emerald-700 uppercase tracking-wider border-r border-slate-200 min-w-[200px] bg-emerald-50/50">
                            {lang === "en" ? "Excellent (Max)" : "Excelente (Max)"}
                          </th>
                          <th className="p-4 text-xs font-bold text-blue-700 uppercase tracking-wider border-r border-slate-200 min-w-[200px] bg-blue-50/30">
                            {lang === "en" ? "Good" : "Bueno"}
                          </th>
                          <th className="p-4 text-xs font-bold text-amber-700 uppercase tracking-wider border-r border-slate-200 min-w-[200px] bg-amber-50/30">
                            {lang === "en" ? "Fair" : "Regular"}
                          </th>
                          <th className="p-4 text-xs font-bold text-rose-700 uppercase tracking-wider min-w-[200px] bg-rose-50/30">
                            {lang === "en" ? "Needs Improvement" : "Insuficiente"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {activeLesson.rubrica.criterios.map((crit, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                            <td className="p-4 border-r border-slate-200">
                              <p className="text-xs font-bold text-slate-800">{crit.criterio}</p>
                              <span className="inline-block text-[9px] font-mono text-slate-400 mt-1">
                                {lang === "en" ? "Aspect" : "Aspecto"} {idx + 1}
                              </span>
                            </td>
                            <td className="p-4 border-r border-slate-200 text-xs text-slate-600 leading-relaxed bg-emerald-50/10">
                              {crit.excelente}
                            </td>
                            <td className="p-4 border-r border-slate-200 text-xs text-slate-600 leading-relaxed">
                              {crit.bueno}
                            </td>
                            <td className="p-4 border-r border-slate-200 text-xs text-slate-600 leading-relaxed">
                              {crit.regular}
                            </td>
                            <td className="p-4 text-xs text-slate-600 leading-relaxed bg-rose-50/5">
                              {crit.insuficiente}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start space-x-3">
                    <span className="inline-block bg-indigo-600 text-white rounded-full p-1 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </span>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-tight">
                        {lang === "en" ? "Application Advice" : "Consejo de Aplicación"}
                      </h4>
                      <p className="text-xs text-indigo-700 leading-relaxed">
                        {lang === "en"
                          ? "You can print or copy this full rubric to share directly with your students before worksheet development, ensuring transparency in their learning goals."
                          : "Puedes imprimir o copiar esta rúbrica completa para compartirla directamente con tus estudiantes antes del desarrollo de la ficha de trabajo, garantizando transparencia en sus metas de aprendizaje."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content 5: Custom Didactic Material */}
              {activeTab === "didactic_material" && activeLesson.materialDidactico && (
                <div className="flex-1 bg-slate-50 border border-slate-200 p-6 md:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-0.5">
                        {activeLesson.materialDidactico.tipo || (lang === "en" ? "CUSTOM DIDACTIC MATERIAL" : "MATERIAL DIDÁCTICO PERSONALIZADO")}
                      </span>
                      <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
                        {activeLesson.materialDidactico.titulo}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleCopyText(activeLesson.materialDidactico?.contenido || "", "didactic_material")}
                      className="px-4.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shadow-sm hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer self-start sm:self-center"
                    >
                      {copiedSection === "didactic_material" ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>{lang === "en" ? "Copied!" : "¡Copia Lista!"}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>{lang === "en" ? "Copy Material" : "Copiar Material"}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Rendered content */}
                  <div className="bg-white border border-slate-200 p-6 md:p-8 shadow-sm space-y-4 max-w-none">
                    {renderMarkdown(activeLesson.materialDidactico.contenido)}
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start space-x-3">
                    <span className="inline-block bg-emerald-600 text-white rounded-full p-1 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </span>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-tight">
                        {lang === "en" ? "About this Material" : "Acerca de este Material"}
                      </h4>
                      <p className="text-xs text-emerald-700 leading-relaxed">
                        {lang === "en"
                          ? "This interactive learning material was designed based on your specifications and class plan parameters. It is ideal to be printed or projected directly for your students."
                          : "Este material didáctico interactivo fue diseñado en base a tus especificaciones y los parámetros del plan de clase. Es ideal para ser impreso o proyectado directamente para tus estudiantes."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              </div>
              )}

              {/* SECTION: EXCLUSIVE EVALUATION GENERATION RESULT VIEW */}
              {viewMode === "evaluation" && activeEvaluation && (
                <div className="space-y-8 flex-1 flex flex-col">
                  {/* Evaluation Header */}
                  <div className="border-b border-slate-200 pb-6">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2.5 py-1 uppercase font-black border border-emerald-200/50">
                        {lang === "en" ? "Difficulty:" : "Dificultad:"} {activeEvaluation.dificultad}
                      </span>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2.5 py-1 uppercase font-black border border-slate-200 truncate max-w-[200px]">
                        {lang === "en" ? "Document:" : "Documento:"} {activeEvaluation.documentoReferencia}
                      </span>
                      <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2.5 py-1 uppercase font-black border border-indigo-200/50">
                        {activeEvaluation.preguntas.length} {lang === "en" ? "Questions" : "Preguntas"}
                      </span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl md:text-3xl font-light text-slate-900 uppercase tracking-tight font-display">
                          {lang === "en" ? "Assessment:" : "Evaluación:"} <span className="font-bold text-emerald-800">{activeEvaluation.titulo}</span>
                        </h2>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
                          {lang === "en" ? "Generated exclusively based on the attached document" : "Generada exclusivamente en base al documento adjunto"}
                        </p>
                      </div>

                      {/* Word Download Button */}
                      <div className="flex items-center space-x-2 shrink-0 self-start no-print">
                        <button
                          onClick={() => handleDownloadEvaluationDoc(activeEvaluation)}
                          className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer shadow-md shadow-emerald-600/10 hover:shadow-lg rounded-xl"
                        >
                          <Download className="w-4 h-4 text-emerald-100 animate-pulse" />
                          <span>{lang === "en" ? "Download Word (.doc)" : "Descargar Word (.doc)"}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tab Selector inside Evaluation */}
                  <div className="flex border-b border-slate-200 no-print">
                    <button
                      onClick={() => setActiveEvaluationTab("student")}
                      className={`px-6 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                        activeEvaluationTab === "student"
                          ? "border-emerald-600 text-emerald-800 bg-emerald-50/20 font-black"
                          : "border-transparent text-slate-500 hover:text-slate-700 font-bold"
                      }`}
                    >
                      {lang === "en" ? "📄 Student Sheet" : "📄 Ficha del Estudiante"}
                    </button>
                    <button
                      onClick={() => setActiveEvaluationTab("answers")}
                      className={`px-6 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                        activeEvaluationTab === "answers"
                          ? "border-emerald-600 text-emerald-800 bg-emerald-50/20 font-black"
                          : "border-transparent text-slate-500 hover:text-slate-700 font-bold"
                      }`}
                    >
                      {lang === "en" ? "🔑 Answer Key (Teacher)" : "🔑 Solucionario (Docente)"}
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 space-y-6">
                    {activeEvaluationTab === "student" ? (
                      <div className="bg-white border border-slate-200 p-6 md:p-8 space-y-8 rounded-2xl shadow-sm">
                        {/* Header block for exam */}
                        <div className="border-b border-slate-200 pb-6 text-center space-y-2">
                          <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">{activeEvaluation.titulo}</h3>
                          <p className="text-xs text-slate-500 italic">
                            {lang === "en" ? "Performance and Understanding Evaluation" : "Evaluación de Desempeño y Comprensión"}
                          </p>
                          <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto pt-4 text-left">
                            <div className="border border-slate-200 p-2.5 text-xs text-slate-600 font-medium">
                              <span className="font-bold text-slate-800">{lang === "en" ? "Student:" : "Estudiante:"}</span> ____________________________________
                            </div>
                            <div className="border border-slate-200 p-2.5 text-xs text-slate-600 font-medium">
                              <span className="font-bold text-slate-800">{lang === "en" ? "Date:" : "Fecha:"}</span> _______________________
                            </div>
                          </div>
                        </div>

                        {/* Instructions */}
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            {lang === "en" ? "General instructions:" : "Instrucciones generales:"}
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed">{activeEvaluation.instrucciones}</p>
                        </div>

                        {/* Question List */}
                        <div className="space-y-8">
                          {activeEvaluation.preguntas.map((q, idx) => (
                            <div key={idx} className="space-y-3 pb-6 border-b border-dashed border-slate-200 last:border-0 last:pb-0">
                              <h5 className="text-sm font-bold text-slate-800 leading-relaxed">
                                {idx + 1}. {q.enunciado}
                              </h5>

                              {/* Opción Múltiple */}
                              {q.tipo === "opcion_multiple" && q.opciones && q.opciones.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 ml-4">
                                  {q.opciones.map((opt, oIdx) => (
                                    <div key={oIdx} className="flex items-center space-x-2.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-700 hover:bg-slate-100/50 transition-colors">
                                      <span className="w-5 h-5 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-[10px] text-slate-600">
                                        {String.fromCharCode(65 + oIdx)}
                                      </span>
                                      <span>{opt}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Verdadero o Falso */}
                              {q.tipo === "verdadero_falso" && (
                                <div className="flex space-x-6 ml-4 text-xs">
                                  <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 px-4 py-2 border border-slate-100 rounded-lg hover:bg-slate-100/50">
                                    <input type="radio" name={`q-${idx}`} className="text-emerald-600 focus:ring-emerald-500" />
                                    <span className="font-semibold text-slate-700">{lang === "en" ? "True" : "Verdadero"}</span>
                                  </label>
                                  <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 px-4 py-2 border border-slate-100 rounded-lg hover:bg-slate-100/50">
                                    <input type="radio" name={`q-${idx}`} className="text-emerald-600 focus:ring-emerald-500" />
                                    <span className="font-semibold text-slate-700">{lang === "en" ? "False" : "Falso"}</span>
                                  </label>
                                </div>
                              )}

                              {/* Juicio Crítico */}
                              {q.tipo === "juicio_critico" && (
                                <div className="ml-4 space-y-2">
                                  <p className="text-[11px] text-slate-400 italic">
                                    {lang === "en" 
                                      ? "Write your answer and support your point of view analytically in the space below:" 
                                      : "Escribe tu respuesta y fundamenta tu punto de vista de manera analítica en el siguiente espacio:"}
                                  </p>
                                  <div className="w-full h-32 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl"></div>
                                </div>
                              )}

                            </div>
                          ))}
                        </div>

                        {/* Download Prompt in Student Tab */}
                        <div className="pt-6 border-t border-slate-200 flex justify-center no-print">
                          <button
                            onClick={() => handleDownloadEvaluationDoc(activeEvaluation)}
                            className="px-5 py-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer rounded-xl"
                          >
                            <Download className="w-4 h-4 text-slate-300" />
                            <span>{lang === "en" ? "Download Full Sheet in Word (.doc)" : "Descargar Ficha Completa en Word (.doc)"}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Key List */}
                        {activeEvaluation.preguntas.map((q, idx) => (
                          <div key={idx} className="bg-emerald-50/30 border border-emerald-100/80 rounded-2xl p-6 space-y-4">
                            <div className="flex justify-between items-start">
                              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                                {lang === "en" ? "Question" : "Pregunta"} {idx + 1}
                              </h5>
                              <span className="bg-emerald-100/80 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-200/50">
                                {q.tipo === "opcion_multiple" 
                                  ? (lang === "en" ? "Multiple Choice" : "Opción Múltiple") 
                                  : q.tipo === "verdadero_falso" 
                                    ? (lang === "en" ? "True/False" : "Verdadero/Falso") 
                                    : (lang === "en" ? "Critical Judgment" : "Juicio Crítico")}
                              </span>
                            </div>

                            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                              {q.enunciado}
                            </p>

                            {q.tipo === "opcion_multiple" && q.opciones && q.opciones.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-2">
                                {q.opciones.map((opt, oIdx) => {
                                  const isCorrect = q.respuestaCorrecta.trim().toUpperCase() === String.fromCharCode(65 + oIdx) || q.respuestaCorrecta.trim() === opt;
                                  return (
                                    <div key={oIdx} className={`p-2.5 rounded-lg text-xs flex items-center space-x-2.5 border ${
                                      isCorrect
                                        ? 'bg-emerald-100/50 border-emerald-300 text-emerald-900 font-bold shadow-sm'
                                        : 'bg-white border-slate-100 text-slate-600'
                                    }`}>
                                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                        isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                                      }`}>
                                        {String.fromCharCode(65 + oIdx)}
                                      </span>
                                      <span>{opt}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            <div className="bg-white border border-emerald-100 rounded-xl p-4 space-y-2.5">
                              <div>
                                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                                  {lang === "en" ? "Correct / Suggested Answer:" : "Respuesta Correcta / Sugerida:"}
                                </span>
                                <p className="text-xs font-bold text-slate-800 mt-0.5">
                                  {q.respuestaCorrecta}
                                </p>
                              </div>

                              <div className="border-t border-slate-100 pt-2.5">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                  {lang === "en" ? "Pedagogical Justification or Assessment Criteria:" : "Justificación Pedagógica o Criterio de Evaluación:"}
                                </span>
                                <p className="text-xs text-slate-600 leading-relaxed mt-0.5 font-medium">
                                  {q.justificacion}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION: PARENT COMMUNICATION RESULT VIEW */}
              {viewMode === "comunicado" && activeComunicado && (
                <div className="space-y-8 flex-1 flex flex-col">
                  {/* Comunicado Header */}
                  <div className="border-b border-slate-200 pb-6">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2.5 py-1 uppercase font-black border border-emerald-200/50">
                        {lang === "en" ? "Assertive Writing" : "Redacción Asertiva"}
                      </span>
                      <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2.5 py-1 uppercase font-black border border-indigo-200/50">
                        {lang === "en" ? "Topic:" : "Tema:"} {activeComunicado.tema}
                      </span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl md:text-3xl font-light text-slate-900 uppercase tracking-tight font-display">
                          {lang === "en" ? "Communication:" : "Comunicado:"} <span className="font-bold text-slate-800">{activeComunicado.titulo}</span>
                        </h2>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
                          {lang === "en" ? "Primary motive for constructive and assertive communication" : "Motivo principal de comunicación constructiva y asertiva"}
                        </p>
                      </div>

                      {/* Download & Copy Buttons */}
                      <div className="flex items-center space-x-2 shrink-0 self-start no-print">
                        <button
                          onClick={() => handleCopyText(
                            `${activeComunicado.titulo}\n\n${activeComunicado.saludo}\n\n${activeComunicado.introduccion}\n\n${activeComunicado.desarrollo}\n\n${activeComunicado.propuestaColaboracion}\n\n${activeComunicado.despedida}\n\n${lang === "en" ? "Sincerely,\nTeaching Staff" : "Atentamente,\nEquipo Docente"}`,
                            "comunicado-full"
                          )}
                          className={`px-4 py-3 border text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer rounded-xl ${
                            copiedSection === "comunicado-full"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                          }`}
                        >
                          {copiedSection === "comunicado-full" ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-600 animate-bounce" />
                              <span>{lang === "en" ? "Copied" : "Copiado"}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>{lang === "en" ? "Copy Text" : "Copiar Texto"}</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleDownloadComunicadoDoc(activeComunicado)}
                          className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer shadow-md shadow-indigo-600/10 hover:shadow-lg rounded-xl"
                        >
                          <Download className="w-4 h-4 text-indigo-100" />
                          <span>{lang === "en" ? "Download Word" : "Descargar Word"}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Main Printable Letter Layout */}
                  <div className="flex-1 max-w-3xl mx-auto w-full space-y-8 pb-12">
                    {/* The School Letter Card */}
                    <div className="bg-white border border-slate-200/80 shadow-sm p-8 md:p-12 space-y-6 relative overflow-hidden">
                      {/* Decorative header of the letter */}
                      <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4 mb-8">
                        <div>
                          <p className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-widest">
                            {lang === "en" ? "OFFICIAL COMMUNICATION" : "COMUNICADO OFICIAL"}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono font-medium">
                            {new Date().toLocaleDateString(lang === "en" ? "en-US" : "es-ES", { year: "numeric", month: "long", day: "numeric" })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-700 uppercase tracking-wider">
                            {lang === "en" ? "Educational Institution" : "Institución Educativa"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">
                            {lang === "en" ? "Counseling & Tutoring Department" : "Departamento de Orientación y Tutoría"}
                          </p>
                        </div>
                      </div>

                      {/* Content of the letter */}
                      <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
                        <p className="font-bold text-slate-800 mb-6">{activeComunicado.saludo}</p>
                        <p className="text-justify">{parseBoldText(activeComunicado.introduccion)}</p>
                        <p className="text-justify">{parseBoldText(activeComunicado.desarrollo)}</p>
                        <p className="text-justify">{parseBoldText(activeComunicado.propuestaColaboracion)}</p>
                        <p className="mt-8 mb-12">{activeComunicado.despedida}</p>
                      </div>

                      {/* Signature block */}
                      <div className="pt-8 border-t border-slate-100/60 flex flex-col items-center text-center">
                        <div className="w-48 border-t border-slate-300 my-4"></div>
                        <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                          {lang === "en" ? "Teaching and Tutoring" : "Docencia y Tutoría"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          {lang === "en" ? "School Support Team" : "Equipo de Acompañamiento Escolar"}
                        </p>
                      </div>
                    </div>

                    {/* Secondary Information: Asertividad & Hogar tabs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
                      {/* Techniques utilized box */}
                      <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4">
                        <div className="flex items-center space-x-2 text-indigo-800 border-b border-slate-200 pb-2">
                          <Heart className="w-5 h-5 text-indigo-600" />
                          <h4 className="text-xs font-black uppercase tracking-wider">
                            {lang === "en" ? "Assertive Strategies Employed" : "Estrategias Asertivas Empleadas"}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500 italic leading-relaxed">
                          {lang === "en"
                            ? "The writing utilizes positive psychology and assertive techniques to maintain a strong partnership with the family:"
                            : "La redacción utiliza psicología positiva y técnicas asertivas para mantener una alianza fuerte con la familia:"}
                        </p>
                        <ul className="space-y-2.5">
                          {activeComunicado.tecnicasUtilizadas.map((tec, tIdx) => (
                            <li key={tIdx} className="text-xs text-slate-700 flex items-start space-x-2">
                              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                {tIdx + 1}
                              </span>
                              <span className="font-medium">{tec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Home guidelines box */}
                      <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4">
                        <div className="flex items-center space-x-2 text-emerald-800 border-b border-slate-200 pb-2">
                          <Sparkles className="w-5 h-5 text-emerald-600" />
                          <h4 className="text-xs font-black uppercase tracking-wider">
                            {lang === "en" ? "Guidelines for Home" : "Orientaciones para el Hogar"}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500 italic leading-relaxed">
                          {lang === "en"
                            ? "Recommendations to share with parents or to follow up from home cooperatively:"
                            : "Recomendaciones para compartir con los padres o para dar continuidad desde casa de manera cooperativa:"}
                        </p>
                        <ul className="space-y-2.5">
                          {activeComunicado.sugerenciasCasa.map((sug, sIdx) => (
                            <li key={sIdx} className="text-xs text-slate-700 flex items-start space-x-2">
                              <span className="text-emerald-500 shrink-0 font-bold mt-0.5">✓</span>
                              <span className="font-medium">{sug}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </section>

      </main>

      {/* Static Footer - Bottom Status Bar */}
      <footer className="h-10 bg-slate-900 px-6 md:px-12 flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest shrink-0 no-print">
        <div className="flex space-x-6">
          <span>SISTEMA DE PLANIFICACIÓN ACADÉMICA</span>
          <span className="hidden sm:inline">Último guardado: LocalStorage</span>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          <span>Planificador Inteligente Activo</span>
        </div>
      </footer>

      {/* Dedicated Print-Only View */}
      {activeLesson && (
        <div className="hidden print:block print-container p-8 max-w-full text-slate-950 font-sans space-y-8 bg-white">
          
          {/* Print Header */}
          <div className="border-b-2 border-slate-950 pb-4 text-center">
            <h1 className="text-2xl font-black uppercase tracking-tight">PLANIFICACIÓN PEDAGÓGICA Y SECUENCIA DIDÁCTICA</h1>
            <p className="text-[11px] font-mono uppercase tracking-widest mt-1 text-slate-600">Generado con IA de Soporte Curricular</p>
          </div>

          {/* Core Info */}
          <div className="grid grid-cols-2 gap-4 text-xs border border-slate-300 p-4 bg-slate-50">
            <div>
              <p><strong>Sesión de Clase:</strong> {activeLesson.titulo}</p>
              <p><strong>Temática:</strong> {activeLesson.tema}</p>
              <p><strong>Enfoque Pedagógico:</strong> {activeLesson.enfoque}</p>
            </div>
            <div>
              <p><strong>Nivel Educativo:</strong> {activeLesson.nivel}</p>
              <p><strong>Duración Estimada:</strong> {activeLesson.duracion}</p>
            </div>
          </div>

          {/* Objectives & Materials */}
          <div className="grid grid-cols-2 gap-6 pt-4">
            <div className="border border-slate-300 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider border-b pb-1.5 mb-2">Objetivos de Aprendizaje</h3>
              <p className="text-xs mb-2"><strong>General:</strong> {activeLesson.objetivos.objetivoGeneral}</p>
              <p className="text-xs font-bold mb-1">Específicos:</p>
              <ul className="list-disc pl-4 space-y-1 text-xs">
                {activeLesson.objetivos.objetivosEspecificos.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="border border-slate-300 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider border-b pb-1.5 mb-2">Materiales & Recursos</h3>
              <p className="text-xs mb-1"><strong>Para el Docente:</strong></p>
              <p className="text-xs text-slate-700 mb-3">{activeLesson.materiales.docente.join(", ")}</p>
              <p className="text-xs mb-1"><strong>Para el Estudiante:</strong></p>
              <p className="text-xs text-slate-700">{activeLesson.materiales.estudiante.join(", ")}</p>
            </div>
          </div>

          {/* Sequence - Page Break before this */}
          <div className="print-page-break pt-4 space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest border-b-2 border-slate-950 pb-1">SECUENCIA DIDÁCTICA PASO A PASO</h2>
            
            {/* INICIO */}
            <div className="border border-slate-300">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 flex justify-between font-bold text-xs">
                <span>01. INICIO (MOTIVACIÓN Y SABERES PREVIOS)</span>
                <span>{activeLesson.secuenciaDidactica.inicio.duracionEstimada}</span>
              </div>
              <div className="p-4 space-y-3">
                {activeLesson.secuenciaDidactica.inicio.actividades.map((act, idx) => (
                  <div key={idx} className="text-xs">
                    <span className="font-bold underline uppercase">{act.tipo}:</span> {act.descripcion}
                    {act.recursos && <p className="text-[10px] text-slate-600 mt-0.5">Recursos: {act.recursos}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* DESARROLLO */}
            <div className="border border-slate-300">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 flex justify-between font-bold text-xs">
                <span>02. DESARROLLO (PROCESAMIENTO Y PRÁCTICA)</span>
                <span>{activeLesson.secuenciaDidactica.desarrollo.duracionEstimada}</span>
              </div>
              <div className="p-4 space-y-4">
                {activeLesson.secuenciaDidactica.desarrollo.actividades.map((act, idx) => (
                  <div key={idx} className="text-xs border-l-2 border-slate-400 pl-2">
                    <span className="font-bold underline uppercase">{act.tipo}:</span> {act.descripcion}
                    {act.recursos && <p className="text-[10px] text-slate-600 mt-0.5">Recursos: {act.recursos}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* CIERRE */}
            <div className="border border-slate-300">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 flex justify-between font-bold text-xs">
                <span>03. CIERRE (CONSOLIDACIÓN Y REFLEXIÓN)</span>
                <span>{activeLesson.secuenciaDidactica.cierre.duracionEstimada}</span>
              </div>
              <div className="p-4 space-y-3">
                {activeLesson.secuenciaDidactica.cierre.actividades.map((act, idx) => (
                  <div key={idx} className="text-xs">
                    <span className="font-bold underline uppercase">{act.tipo}:</span> {act.descripcion}
                    {act.recursos && <p className="text-[10px] text-slate-600 mt-0.5">Recursos: {act.recursos}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Evaluation & Suggestion Print section */}
          <div className="print-page-break pt-4 grid grid-cols-2 gap-6">
            <div className="border border-slate-300 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider border-b pb-1.5 mb-2">Evaluación del Aprendizaje</h3>
              <p className="text-xs mb-1"><strong>Evidencia (Entregable):</strong> {activeLesson.evaluacion.evidencia}</p>
              <p className="text-xs mb-2"><strong>Instrumento de Evaluación:</strong> {activeLesson.evaluacion.instrumento}</p>
              <p className="text-xs font-bold mb-1">Criterios de Valoración:</p>
              <ul className="list-decimal pl-4 space-y-1 text-xs">
                {activeLesson.evaluacion.criterios.map((crit, idx) => (
                  <li key={idx}>{crit}</li>
                ))}
              </ul>
            </div>

            <div className="border border-slate-300 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider border-b pb-1.5 mb-2">Sugerencias Metodológicas</h3>
              <p className="text-xs mb-2"><strong>Adecuación Curricular / Diferenciación:</strong></p>
              <p className="text-xs text-slate-700 leading-relaxed mb-4">{activeLesson.sugerenciasDocente.diferenciacion}</p>
              <p className="text-xs font-bold mb-1">Preguntas Socráticas Clave:</p>
              <ul className="list-disc pl-4 space-y-1 text-xs">
                {activeLesson.sugerenciasDocente.preguntasClave.map((item, idx) => (
                  <li key={idx} className="italic">"{item}"</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Worksheet print view */}
          <div className="print-page-break pt-4 border-t-2 border-slate-950 space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-bold uppercase">{activeLesson.fichaTrabajo.tituloFicha}</h2>
              <p className="text-xs text-slate-500 italic">Nombre del estudiante: _____________________________________ Fecha: ___________</p>
            </div>
            
            <div className="border border-slate-300 p-3 bg-slate-50">
              <p className="text-xs"><strong>Instrucciones:</strong> {activeLesson.fichaTrabajo.instrucciones}</p>
            </div>

            <div className="space-y-6 pt-4">
              {activeLesson.fichaTrabajo.ejercicios.map((ej, index) => (
                <div key={index} className="space-y-2 border-b border-dashed pb-4">
                  <p className="text-xs font-bold">Pregunta {index + 1}: {ej.enunciado}</p>
                  {ej.pistas && <p className="text-[10px] text-slate-500 italic">Pista: {ej.pistas}</p>}
                  <div className="h-24 border border-slate-200 mt-2 bg-slate-50/20"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Rubric print view */}
          {activeLesson.rubrica && (
            <div className="print-page-break pt-4 border-t-2 border-slate-950 space-y-4">
              <div className="text-center">
                <h2 className="text-lg font-bold uppercase">{activeLesson.rubrica.tituloRubrica}</h2>
                <p className="text-xs text-slate-500 italic">Rúbrica de Evaluación de Desempeño</p>
              </div>

              <div className="pt-2">
                <table className="w-full text-left border-collapse border border-slate-400 bg-white">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-400">
                      <th className="p-2 text-[10px] font-bold uppercase border-r border-slate-400 w-1/5">Criterio</th>
                      <th className="p-2 text-[10px] font-bold uppercase border-r border-slate-400 w-1/5">Excelente</th>
                      <th className="p-2 text-[10px] font-bold uppercase border-r border-slate-400 w-1/5">Bueno</th>
                      <th className="p-2 text-[10px] font-bold uppercase border-r border-slate-400 w-1/5">Regular</th>
                      <th className="p-2 text-[10px] font-bold uppercase w-1/5">Insuficiente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-400">
                    {activeLesson.rubrica.criterios.map((crit, idx) => (
                      <tr key={idx}>
                        <td className="p-2 border-r border-slate-400 text-[10px] font-bold">{crit.criterio}</td>
                        <td className="p-2 border-r border-slate-400 text-[10px] text-slate-700">{crit.excelente}</td>
                        <td className="p-2 border-r border-slate-400 text-[10px] text-slate-700">{crit.bueno}</td>
                        <td className="p-2 border-r border-slate-400 text-[10px] text-slate-700">{crit.regular}</td>
                        <td className="p-2 text-[10px] text-slate-700">{crit.insuficiente}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Print & PDF Export Hub Modal */}
      {showPrintModal && activeLesson && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print animate-fade-in">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col transform scale-100 transition-all">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between animate-none">
              <div className="flex items-center space-x-2.5">
                <Printer className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm uppercase tracking-wider font-display">Exportar Plan de Clase / PDF</h3>
              </div>
              <button 
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
              
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start space-x-3">
                <span className="bg-indigo-600 text-white rounded-full p-1 mt-0.5 inline-flex shrink-0">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">¿Por qué este panel?</h4>
                  <p className="text-xs text-indigo-700 leading-relaxed">
                    Hemos activado el diálogo de impresión de tu sistema. Si no ha aparecido o te encuentras dentro del panel de AI Studio, ten en cuenta que el navegador <strong>bloquea la impresión automática desde iframes</strong> por razones de seguridad.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Elige una de estas alternativas:</p>
                
                {/* Option 1: Download HTML */}
                <button
                  onClick={() => handleDownloadPrintableHtml(activeLesson)}
                  className="w-full text-left p-4 bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-200/80 rounded-xl transition-all flex items-start space-x-3.5 group cursor-pointer"
                >
                  <div className="bg-emerald-600 text-white rounded-lg p-2.5 shrink-0 group-hover:scale-105 transition-transform">
                    <Download className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-emerald-900 uppercase tracking-tight">1. Descargar HTML Imprimible (Garantizado)</h5>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      Descarga un archivo liviano que se abre en cualquier computadora. Al abrirlo, se activa la ventana de impresión/Guardar como PDF de forma perfecta y limpia.
                    </p>
                  </div>
                </button>

                {/* Option 2: Copy instructions */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start space-x-3.5">
                  <div className="bg-slate-700 text-white rounded-lg p-2.5 shrink-0">
                    <ExternalLink className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-tight">2. Abrir en pestaña nueva</h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Haz clic en el icono de <strong>"Abrir en pestaña nueva"</strong> en la esquina superior derecha del panel de AI Studio para ver la app en pantalla completa y que el botón de Imprimir funcione de manera directa.
                    </p>
                  </div>
                </div>

                {/* Option 3: Manual Retry */}
                <button
                  onClick={() => {
                    try {
                      window.focus();
                      window.print();
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="w-full text-left p-4 bg-indigo-50/60 hover:bg-indigo-50 border border-indigo-100 rounded-xl transition-all flex items-start space-x-3.5 group cursor-pointer"
                >
                  <div className="bg-indigo-600 text-white rounded-lg p-2.5 shrink-0 group-hover:scale-105 transition-transform">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-indigo-900 uppercase tracking-tight">3. Reintentar Impresión Directa</h5>
                    <p className="text-xs text-indigo-700 leading-relaxed">
                      Si has dado permisos o estás en pantalla completa, haz clic para volver a solicitar la ventana de impresión nativa.
                    </p>
                  </div>
                </button>

                {/* Option 4: Copy Full Markdown */}
                <button
                  onClick={() => {
                    handleCopyText(getFullMarkdown(activeLesson), "full");
                  }}
                  className="w-full text-left p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-start space-x-3.5 group cursor-pointer"
                >
                  <div className="bg-slate-600 text-white rounded-lg p-2.5 shrink-0 group-hover:scale-105 transition-transform">
                    {copiedSection === "full" ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                      {copiedSection === "full" ? "¡Copiado al Portapapeles!" : "4. Copiar Plan Completo (Markdown)"}
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Copia todo el plan estructurado en formato Markdown para pegarlo fácilmente en tu procesador de textos favorito.
                    </p>
                  </div>
                </button>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-none cursor-pointer transition-colors shadow-sm"
              >
                Entendido, Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
