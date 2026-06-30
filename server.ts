import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import officeParser from "officeparser";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy-initialized Gemini Client to prevent crashing on boot if key is missing
let aiClient: GoogleGenAI | null = null;
function getAIClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("La clave de API (GEMINI_API_KEY) no está configurada. Por favor, añádela en la pestaña Configuración > Secrets en AI Studio.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
          'x-goog-api-client': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// Robust wrapper with automatic model fallback and retry logic for high-demand periods
async function generateContentWithRetry(params: {
  contents: any;
  config: any;
  initialModel?: string;
}) {
  const ai = getAIClient();
  const modelsToTry = [params.initialModel || "gemini-3.5-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    let delay = 1000;
    const maxRetries = 2;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Intentando llamar al modelo ${model} (Intento ${attempt}/${maxRetries})...`);
        const response = await ai.models.generateContent({
          model: model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errorStr = String(err.message || err || "");
        console.warn(`Error llamando a ${model} en intento ${attempt}: ${errorStr}`);
        
        // If it's a 503, 429, or other transient error, wait and retry.
        const isTransient = errorStr.includes("503") || 
                            errorStr.includes("429") || 
                            errorStr.includes("demand") || 
                            errorStr.includes("unavailable") || 
                            errorStr.includes("busy") || 
                            errorStr.includes("temporary");
        
        if (attempt < maxRetries && isTransient) {
          console.log(`Esperando ${delay}ms antes de reintentar con el mismo modelo...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // exponential backoff
        } else {
          break; // Try the next fallback model in the outer loop
        }
      }
    }
  }

  throw lastError || new Error("Fallo al generar contenido con todos los modelos disponibles.");
}

// Schema for structured Parent Communications
const comunicadoSchema = {
  type: Type.OBJECT,
  properties: {
    titulo: {
      type: Type.STRING,
      description: "Título formal, empático y asertivo para el comunicado."
    },
    saludo: {
      type: Type.STRING,
      description: "Saludo formal y respetuoso dirigido a los padres o tutores (ej. 'Estimados padres de familia de [Nombre]', 'Estimados tutores de [Nombre]', etc.)."
    },
    introduccion: {
      type: Type.STRING,
      description: "Introducción que establece el contexto de manera asertiva, empática y constructiva."
    },
    desarrollo: {
      type: Type.STRING,
      description: "Cuerpo principal del comunicado redactado con técnicas asertivas (enfoque positivo, descripción objetiva de los hechos, empatía y metas claras). Formateado en Markdown elegante si es necesario."
    },
    propuestaColaboracion: {
      type: Type.STRING,
      description: "Propuesta de trabajo conjunto y canales de comunicación abiertos (asertividad, sin tono punitivo, buscando alianza con el hogar)."
    },
    despedida: {
      type: Type.STRING,
      description: "Cierre cordial, agradeciendo la colaboración constante."
    },
    tecnicasUtilizadas: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Listado detallado de las técnicas de comunicación asertiva y empatía que se aplicaron en la redacción de este comunicado (ej. 'Técnica del Sándwich (positivo-mejora-positivo)', 'Comunicación sin juicios de valor', 'Enfoque de corresponsabilidad', 'Mensajes Yo en lugar de Tú'). Explicar cómo ayudan."
    },
    sugerenciasCasa: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Recomendaciones prácticas, asertivas y constructivas para que los padres puedan acompañar y apoyar este tema desde el hogar de manera positiva."
    }
  },
  required: ["titulo", "saludo", "introduccion", "desarrollo", "propuestaColaboracion", "despedida", "tecnicasUtilizadas", "sugerenciasCasa"]
};

// Full schema to structure the Class Session (Sesión de Aprendizaje) JSON response
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    titulo: {
      type: Type.STRING,
      description: "Título creativo y motivador para la sesión de clase.",
    },
    tema: {
      type: Type.STRING,
      description: "El tema abordado de forma clara.",
    },
    nivel: {
      type: Type.STRING,
      description: "Nivel educativo al que va dirigido.",
    },
    duracion: {
      type: Type.STRING,
      description: "Duración total de la clase.",
    },
    enfoque: {
      type: Type.STRING,
      description: "Enfoque pedagógico seleccionado (ej. Constructivista, ABP, Clase Invertida, Aprendizaje Colaborativo).",
    },
    objetivos: {
      type: Type.OBJECT,
      properties: {
        objetivoGeneral: {
          type: Type.STRING,
          description: "Objetivo de aprendizaje principal y claro de la sesión.",
        },
        objetivosEspecificos: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Lista de 2 a 4 objetivos específicos de aprendizaje.",
        },
        competencias: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Competencias, habilidades o capacidades clave a desarrollar.",
        },
      },
      required: ["objetivoGeneral", "objetivosEspecificos", "competencias"],
    },
    materiales: {
      type: Type.OBJECT,
      properties: {
        docente: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Materiales, herramientas o recursos que necesitará el docente.",
        },
        estudiante: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Materiales y útiles que necesitarán los estudiantes.",
        },
      },
      required: ["docente", "estudiante"],
    },
    secuenciaDidactica: {
      type: Type.OBJECT,
      properties: {
        inicio: {
          type: Type.OBJECT,
          properties: {
            duracionEstimada: { type: Type.STRING, description: "Ej: 15 minutos" },
            actividades: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tipo: { type: Type.STRING, description: "Ej. Motivación/Gancho, Recuperación de saberes previos, Conflicto cognitivo, Declaración del propósito" },
                  descripcion: { type: Type.STRING, description: "Paso a paso detallado de lo que hace el docente y los estudiantes." },
                  recursos: { type: Type.STRING, description: "Materiales usados específicos para este paso." },
                },
                required: ["tipo", "descripcion"],
              },
            },
          },
          required: ["duracionEstimada", "actividades"],
        },
        desarrollo: {
          type: Type.OBJECT,
          properties: {
            duracionEstimada: { type: Type.STRING, description: "Ej: 60 minutos" },
            actividades: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tipo: { type: Type.STRING, description: "Ej. Procesamiento de información, Modelado/Explicación, Práctica guiada, Práctica autónoma o cooperativa" },
                  descripcion: { type: Type.STRING, description: "Paso a paso minucioso de la explicación, ejercicios y dinámicas grupales." },
                  recursos: { type: Type.STRING, description: "Materiales usados específicos para este paso." },
                },
                required: ["tipo", "descripcion"],
              },
            },
          },
          required: ["duracionEstimada", "actividades"],
        },
        cierre: {
          type: Type.OBJECT,
          properties: {
            duracionEstimada: { type: Type.STRING, description: "Ej: 15 minutos" },
            actividades: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tipo: { type: Type.STRING, description: "Ej. Metacognición (¿Qué aprendimos? ¿Cómo lo aprendimos?), Resumen de ideas fuerza, Evaluación formativa, Actividad de extensión" },
                  descripcion: { type: Type.STRING, description: "Paso a paso de la reflexión final y consolidación." },
                  recursos: { type: Type.STRING, description: "Materiales usados específicos para este paso." },
                },
                required: ["tipo", "descripcion"],
              },
            },
          },
          required: ["duracionEstimada", "actividades"],
        },
      },
      required: ["inicio", "desarrollo", "cierre"],
    },
    evaluacion: {
      type: Type.OBJECT,
      properties: {
        criterios: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Criterios específicos de evaluación que permiten saber si se alcanzaron los objetivos.",
        },
        evidencia: {
          type: Type.STRING,
          description: "Entregable o acción tangible realizada por el estudiante (ej: organizador visual, maqueta, ficha de respuestas, etc.).",
        },
        instrumento: {
          type: Type.STRING,
          description: "Instrumento recomendado para evaluar (ej: Lista de cotejo, Rúbrica formativa, Escala de valoración).",
        },
      },
      required: ["criterios", "evidencia", "instrumento"],
    },
    fichaTrabajo: {
      type: Type.OBJECT,
      properties: {
        tituloFicha: { type: Type.STRING, description: "Título de la hoja de trabajo o cuestionario de práctica." },
        instrucciones: { type: Type.STRING, description: "Instrucciones claras para resolver los ejercicios." },
        ejercicios: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              enunciado: { type: Type.STRING, description: "La pregunta o ejercicio planteado al alumno." },
              pistas: { type: Type.STRING, description: "Una sugerencia o pista pedagógica sutil." },
              solucionSugerida: { type: Type.STRING, description: "Respuesta o solución modelo esperada." },
            },
            required: ["enunciado", "solucionSugerida"],
          },
        },
      },
      required: ["tituloFicha", "instrucciones", "ejercicios"],
    },
    sugerenciasDocente: {
      type: Type.OBJECT,
      properties: {
        diferenciacion: {
          type: Type.STRING,
          description: "Sugerencias de adecuación curricular o diferenciación para alumnos avanzados y alumnos que requieran más apoyo.",
        },
        preguntasClave: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Lista de 3 a 5 preguntas potentes (de alta demanda cognitiva) para motivar la reflexión crítica de los alumnos.",
        },
      },
      required: ["diferenciacion", "preguntasClave"],
    },
    rubrica: {
      type: Type.OBJECT,
      properties: {
        tituloRubrica: {
          type: Type.STRING,
          description: "Título descriptivo de la rúbrica (ej. Rúbrica de Evaluación de Gramática Inglesa).",
        },
        criterios: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              criterio: { type: Type.STRING, description: "Aspecto o criterio a evaluar (ej. Fluidez, Estructura, Creatividad)." },
              excelente: { type: Type.STRING, description: "Descripción detallada del nivel Excelente (Ej. puntuación máxima)." },
              bueno: { type: Type.STRING, description: "Descripción detallada del nivel Bueno." },
              regular: { type: Type.STRING, description: "Descripción detallada del nivel Regular." },
              insuficiente: { type: Type.STRING, description: "Descripción detallada del nivel Insuficiente / Necesita mejorar." },
            },
            required: ["criterio", "excelente", "bueno", "regular", "insuficiente"],
          },
        },
      },
      required: ["tituloRubrica", "criterios"],
    },
    materialDidactico: {
      type: Type.OBJECT,
      properties: {
        titulo: {
          type: Type.STRING,
          description: "Título creativo para el material didáctico solicitado.",
        },
        tipo: {
          type: Type.STRING,
          description: "El tipo de material solicitado (ej. Juego, Flashcards, Resumen, Caso de estudio, etc.).",
        },
        contenido: {
          type: Type.STRING,
          description: "El contenido pedagógico completamente desarrollado de este material didáctico, formateado en Markdown limpio y elegante (con tablas, listas, diálogos, o cuestionarios según el tipo). Debe estar completamente desarrollado y listo para usar por el docente o alumno sin dejar marcadores de posición o resúmenes vacíos.",
        },
      },
      required: ["titulo", "tipo", "contenido"],
    },
  },
  required: [
    "titulo",
    "tema",
    "nivel",
    "duracion",
    "enfoque",
    "objetivos",
    "materiales",
    "secuenciaDidactica",
    "evaluacion",
    "fichaTrabajo",
    "sugerenciasDocente",
    "rubrica"
  ],
};

// Schema for document-based custom evaluation JSON response
const evaluationSchema = {
  type: Type.OBJECT,
  properties: {
    titulo: { 
      type: Type.STRING, 
      description: "Título formal de la evaluación (ej. Evaluación de Comprensión Lectora: [Tema del documento])." 
    },
    instrucciones: { 
      type: Type.STRING, 
      description: "Instrucciones claras y detalladas para el estudiante sobre cómo resolver la prueba." 
    },
    dificultad: { 
      type: Type.STRING, 
      description: "Nivel de dificultad de la evaluación (Bajo, Medio, Alto)." 
    },
    cantidadPreguntas: { 
      type: Type.INTEGER, 
      description: "Cantidad de preguntas generadas." 
    },
    preguntas: {
      type: Type.ARRAY,
      description: "Lista de preguntas generadas basadas exclusivamente en el documento.",
      items: {
        type: Type.OBJECT,
        properties: {
          tipo: { 
            type: Type.STRING, 
            description: "El tipo de pregunta: 'opcion_multiple', 'verdadero_falso' o 'juicio_critico'." 
          },
          enunciado: { 
            type: Type.STRING, 
            description: "El texto completo de la pregunta o enunciado." 
          },
          opciones: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Para opción múltiple: provee exactamente 4 opciones con letras de inicio (A, B, C, D) (ej. 'A) opción 1', 'B) ...'). Dejar este arreglo vacío o no incluirlo para verdadero_falso o juicio_critico."
          },
          respuestaCorrecta: { 
            type: Type.STRING, 
            description: "Respuesta correcta para opción múltiple (ej. 'A') o verdadero/falso (ej. 'Verdadero' o 'Falso'). Para juicio crítico, describe detalladamente la respuesta sugerida o criterios de respuesta correctos." 
          },
          justificacion: { 
            type: Type.STRING, 
            description: "Breve explicación didáctica de por qué esta es la respuesta correcta, o el criterio de corrección detallado si es de juicio crítico." 
          }
        },
        required: ["tipo", "enunciado", "respuestaCorrecta", "justificacion"]
      }
    }
  },
  required: ["titulo", "instrucciones", "dificultad", "cantidadPreguntas", "preguntas"]
};


// Helper function to safely parse office files (Word/PPTX/etc.) using officeparser
async function parseOfficeFile(buffer: Buffer): Promise<string> {
  const parser = officeParser as any;
  if (typeof parser.parseOfficePromise === "function") {
    return parser.parseOfficePromise(buffer);
  }
  return new Promise((resolve, reject) => {
    parser.parseOffice(buffer, (data: any, err: any) => {
      if (err) {
        return reject(err);
      }
      resolve(data);
    });
  });
}

// API Endpoint to generate a structured class session
app.post("/api/generate-lesson", async (req, res) => {
  const {
    theme,
    educationLevel,
    duration,
    objective,
    pedagogicalApproach,
    additionalNotes,
    documentContent,
    documentName,
    documentMimeType,
    includeRubric,
    customDidacticMaterial,
    lang,
  } = req.body;

  if (!theme) {
    return res.status(400).json({ error: "El tema (theme) es un parámetro obligatorio." });
  }

  const isEnglish = lang === "en" || lang === "en-US";

  try {
    const ai = getAIClient();

    let extractedText = "";
    let isPdf = false;
    let pdfBuffer: Buffer | null = null;

    if (documentContent) {
      const isBase64 = documentMimeType && documentMimeType !== "text/plain" && documentMimeType !== "text/markdown" && documentMimeType !== "text/csv" && documentMimeType !== "application/json";
      
      if (isBase64) {
        try {
          const buffer = Buffer.from(documentContent, "base64");
          const nameLower = (documentName || "").toLowerCase();
          
          if (documentMimeType === "application/pdf" || nameLower.endsWith(".pdf")) {
            isPdf = true;
            pdfBuffer = buffer;
          } else if (
            documentMimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
            nameLower.endsWith(".docx")
          ) {
            const result = await mammoth.extractRawText({ buffer });
            extractedText = result.value;
          } else if (
            documentMimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || 
            documentMimeType === "application/vnd.ms-excel" || 
            nameLower.endsWith(".xlsx") || 
            nameLower.endsWith(".xls")
          ) {
            const workbook = XLSX.read(buffer, { type: "buffer" });
            extractedText = `Contenido del archivo Excel ${documentName || ""}:\n`;
            workbook.SheetNames.forEach((sheetName) => {
              const worksheet = workbook.Sheets[sheetName];
              extractedText += `--- Hoja: ${sheetName} ---\n`;
              extractedText += XLSX.utils.sheet_to_txt(worksheet) + "\n";
            });
          } else if (
            documentMimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" || 
            nameLower.endsWith(".pptx")
          ) {
            try {
              extractedText = await parseOfficeFile(buffer);
            } catch (pptErr) {
              console.error("Error al parsear PPTX con officeparser:", pptErr);
              extractedText = buffer.toString("utf-8").replace(/[^\x20-\x7E\t\r\n]/g, "");
            }
          } else {
            try {
              extractedText = await parseOfficeFile(buffer);
            } catch (fallbackErr) {
              extractedText = buffer.toString("utf-8");
            }
          }
        } catch (parseError: any) {
          console.error("Error al decodificar y parsear archivo binario:", parseError);
          extractedText = `[Error al extraer texto del archivo ${documentName || "documento"}: ${parseError.message}]`;
        }
      } else {
        extractedText = documentContent;
      }
    }

    // Construct a rich educational prompt
    const systemPrompt = isEnglish
      ? `You are an expert pedagogue and an excellent curriculum designer. Your task is to generate a complete, rigorous, and didactic lesson plan called "Lesson Plan" or "Class Session" in English. You must adapt all the content according to the educational level, duration, and pedagogical approach provided by the user. Ensure that the activities are realistic, dynamic, and of high quality to capture the student's interest.`
      : `Eres un pedagogo experto y un excelente diseñador curricular en Paraguay y Latinoamérica. Tu tarea es generar una planificación docente completa, rigurosa y didáctica llamada "Sesión de Aprendizaje" o "Plan de Clase" en español. Debes adaptar todo el contenido según los parámetros de nivel educativo, duración, y enfoque pedagógico que profesa el usuario. Asegúrate de que las actividades planteadas sean realistas, dinámicas y de alta calidad para capturar el interés del estudiante.`;

    let userPrompt = isEnglish
      ? `Please generate a complete and highly detailed class session based on the following parameters:
- **Topic**: "${theme}"
- **Educational Level**: "${educationLevel || "Any"}"
- **Estimated Duration**: "${duration || "90 minutes"}"
- **Pedagogical Approach**: "${pedagogicalApproach || "Constructivism and Active Learning"}"
${objective ? `- **Requested specific learning objective**: "${objective}"` : ""}
${additionalNotes ? `- **Additional notes / User requirements**: "${additionalNotes}"` : ""}`
      : `Por favor, genera una sesión de clase completa y altamente detallada basada en los siguientes parámetros:
- **Tema o Temática**: "${theme}"
- **Nivel Educativo**: "${educationLevel || "Cualquiera"}"
- **Duración Estimada**: "${duration || "90 minutos"}"
- **Enfoque Pedagógico**: "${pedagogicalApproach || "Constructivismo y Aprendizaje Activo"}"
${objective ? `- **Objetivo de Aprendizaje específico solicitado**: "${objective}"` : ""}
${additionalNotes ? `- **Notas adicionales / Requisitos del usuario**: "${additionalNotes}"` : ""}`;

    if (isPdf && pdfBuffer) {
      userPrompt += isEnglish
        ? `\n\n- **REFERENCE DOCUMENT (PDF Attached)**:
The user has attached a reference PDF document titled "${documentName || "attached_document.pdf"}". You have been provided with the PDF directly for analysis. You must base the didactic content of the session, exercises, explanations, pedagogical concepts, and the learning sequence STRICTLY on the information, readings, or grammar provided in this PDF.`
        : `\n\n- **DOCUMENTO DE REFERENCIA (PDF Adjunto)**:
El usuario ha adjuntado un documento PDF de referencia titulado "${documentName || "documento_adjunto.pdf"}". Se te ha provisto el PDF directamente para su análisis. Debes basar el contenido didáctico de la sesión, los ejercicios, explicaciones, conceptos pedagógicos y la secuencia didáctica ESTRICTAMENTE en la información, lecturas o gramática provista en este PDF.`;
    } else if (extractedText) {
      userPrompt += isEnglish
        ? `\n\n- **ATTACHED REFERENCE DOCUMENT (Maximum Priority)**:
The user has attached a reference document titled "${documentName || "attached_document"}". You must base the didactic content of the session, exercises, explanations, concepts, and learning sequence STRICTLY on the extracted text content below:
"""
${extractedText}
"""`
        : `\n\n- **DOCUMENTO DE REFERENCIA ADJUNTO (Prioridad Máxima)**:
El usuario ha adjuntado un documento de referencia titulado "${documentName || "documento_adjunto"}". Debes basar el contenido didáctico de la sesión, los ejercicios, explicaciones, conceptos y la secuencia didáctica ESTRICTAMENTE en el contenido de texto extraído a continuación:
"""
${extractedText}
"""`;
    }

    if (includeRubric) {
      userPrompt += isEnglish
        ? `\n\n- **DETAILED EVALUATION RUBRIC (FUNDAMENTAL REQUIREMENT)**:
The user has specifically requested to include an EVALUATION RUBRIC. Please generate an extremely detailed, professional, and didactic rubric in the "rubrica" field, consisting of at least 3 or 4 criteria relevant to the topic and clear levels of achievement with detailed descriptive texts for Excellent, Good, Fair, and Poor.`
        : `\n\n- **RÚBRICA DE EVALUACIÓN DETALLADA (REQUISITO FUNDAMENTAL)**:
El usuario ha solicitado expresamente incluir una RÚBRICA LISTA PARA APLICAR basada en la temática. Por favor, genera una rúbrica extremadamente detallada, profesional y didáctica en el campo "rubrica", que conste de al menos 3 o 4 criterios pertinentes al tema y niveles claros de logro con textos descriptivos minuciosos para Excelente, Bueno, Regular e Insuficiente.`;
    } else {
      userPrompt += isEnglish
        ? `\n\n- **EVALUATION RUBRIC**:
The user has not urgently requested a detailed rubric. Generate a simple or standard rubric according to the topic in the "rubrica" field of the JSON response.`
        : `\n\n- **RÚBRICA DE EVALUACIÓN**:
El usuario no ha solicitado de forma urgente una rúbrica detallada. Genera una rúbrica sencilla o estándar acorde al tema en el campo "rubrica" de la respuesta.`;
    }

    if (customDidacticMaterial && customDidacticMaterial.trim()) {
      userPrompt += isEnglish
        ? `\n\n- **CUSTOM DIDACTIC MATERIAL (FUNDAMENTAL REQUIREMENT)**:
The user has explicitly requested to create the following didactic material: "${customDidacticMaterial.trim()}".
You must complete the 'materialDidactico' field with a creative title, the type of material ("${customDidacticMaterial.trim()}"), and the full pedagogical content of this didactic material, fully developed in Markdown (using lists, tables, dialogues, or detailed explanations as appropriate). Do not use empty summaries or placeholders. Develop all the content.`
        : `\n\n- **MATERIAL DIDÁCTICO PERSONALIZADO (REQUISITO FUNDAMENTAL)**:
El usuario ha solicitado expresamente crear el siguiente material didáctico: "${customDidacticMaterial.trim()}".
Debes completar obligatoriamente el campo 'materialDidactico' con un título creativo, el tipo de material ("${customDidacticMaterial.trim()}"), y el contenido pedagógico completo de este material didáctico, desarrollado extensamente en Markdown (utilizando listas, tablas, diálogos o explicaciones detalladas según corresponda). No utilices resúmenes vacíos ni dejes marcadores de posición. Desarrolla todo el contenido.`;
    } else {
      userPrompt += isEnglish
        ? `\n\n- **NO CUSTOM DIDACTIC MATERIAL**:
No specific custom didactic material has been requested. Please leave the 'materialDidactico' field as null or omit it in the JSON response.`
        : `\n\n- **SIN MATERIAL DIDÁCTICO PERSONALIZADO**:
No se ha solicitado crear un material didáctico específico personalizado. Por favor, deja el campo 'materialDidactico' como null o no lo generes en la respuesta JSON.`;
    }

    userPrompt += isEnglish
      ? `\n\nGenerate the class session strictly following the structure of the defined JSON schema. All the returned text must be in professional and pedagogically adapted English.`
      : `\n\nGenera la sesión de clase siguiendo estrictamente la estructura del esquema JSON definido. Todo el texto de retorno debe ser en español castellano profesional y adaptado didácticamente.`;

    // Setup contents argument for generateContent
    let contents: any = userPrompt;
    if (isPdf && pdfBuffer) {
      const pdfPart = {
        inlineData: {
          mimeType: "application/pdf",
          data: pdfBuffer.toString("base64"),
        },
      };
      const textPart = {
        text: userPrompt,
      };
      contents = { parts: [pdfPart, textPart] };
    }

    const response = await generateContentWithRetry({
      initialModel: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No se pudo obtener una respuesta válida del modelo de IA.");
    }

    const lessonJson = JSON.parse(resultText);
    lessonJson.includeRubric = !!includeRubric;
    res.json(lessonJson);
  } catch (error: any) {
    console.error("Error generating class session:", error);
    res.status(500).json({
      error: error.message || "Error interno al generar la sesión de clases con Gemini."
    });
  }
});

// API Endpoint to generate a customized document-based evaluation
app.post("/api/generate-evaluation", async (req, res) => {
  const {
    documentContent,
    documentName,
    documentMimeType,
    difficulty,
    questionTypes,
    questionCount,
    lang,
  } = req.body;

  if (!documentContent) {
    return res.status(400).json({ error: "Se requiere un documento adjunto para generar la evaluación." });
  }

  const qCount = parseInt(questionCount, 10) || 5;
  const diffStr = difficulty || "Medio";
  const typesList = Array.isArray(questionTypes) && questionTypes.length > 0 ? questionTypes : ["opcion_multiple"];
  const isEnglish = lang === "en" || lang === "en-US";

  try {
    const ai = getAIClient();

    let extractedText = "";
    let isPdf = false;
    let pdfBuffer: Buffer | null = null;

    const isBase64 = documentMimeType && documentMimeType !== "text/plain" && documentMimeType !== "text/markdown" && documentMimeType !== "text/csv" && documentMimeType !== "application/json";
    
    if (isBase64) {
      try {
        const buffer = Buffer.from(documentContent, "base64");
        const nameLower = (documentName || "").toLowerCase();
        
        if (documentMimeType === "application/pdf" || nameLower.endsWith(".pdf")) {
          isPdf = true;
          pdfBuffer = buffer;
        } else if (
          documentMimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
          nameLower.endsWith(".docx")
        ) {
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value;
        } else if (
          documentMimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || 
          documentMimeType === "application/vnd.ms-excel" || 
          nameLower.endsWith(".xlsx") || 
          nameLower.endsWith(".xls")
        ) {
          const workbook = XLSX.read(buffer, { type: "buffer" });
          extractedText = `Contenido del archivo Excel ${documentName || ""}:\n`;
          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            extractedText += `--- Hoja: ${sheetName} ---\n`;
            extractedText += XLSX.utils.sheet_to_txt(worksheet) + "\n";
          });
        } else if (
          documentMimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" || 
          nameLower.endsWith(".pptx")
        ) {
          try {
            extractedText = await parseOfficeFile(buffer);
          } catch (pptErr) {
            console.error("Error al parsear PPTX con officeparser:", pptErr);
            extractedText = buffer.toString("utf-8").replace(/[^\x20-\x7E\t\r\n]/g, "");
          }
        } else {
          try {
            extractedText = await parseOfficeFile(buffer);
          } catch (fallbackErr) {
            extractedText = buffer.toString("utf-8");
          }
        }
      } catch (parseError: any) {
        console.error("Error al decodificar y parsear archivo binario para evaluación:", parseError);
        extractedText = `[Error al extraer texto del archivo ${documentName || "documento"}: ${parseError.message}]`;
      }
    } else {
      extractedText = documentContent;
    }

    // Construct evaluation system prompt
    const systemPrompt = isEnglish
      ? `You are an expert pedagogue and a specialist in formative and summative assessment design in English. Your task is to generate a structured, high-quality, and pedagogically rigorous academic assessment/quiz based STRICTLY on the document provided as a reference. Do not invent information not supported by the document.`
      : `Eres un pedagogo experto y un especialista en diseño de evaluaciones formativas y sumativas en español. Tu tarea es generar una evaluación/prueba académica estructurada, de alta calidad y rigor pedagógico, basada ESTRICTAMENTE en el documento provisto como referencia. No inventes información que no esté sustentada en el documento.`;

    let userPrompt = isEnglish
      ? `Please generate a complete academic assessment based on the attached document. Requested parameters:
- **Difficulty**: "${diffStr}" (Adapt the cognitive complexity of the questions to this level: Low is literal comprehension, Medium is basic analysis and application, High is deep analysis, synthesis, or complex critical judgment).
- **Total Number of Questions**: ${qCount}
- **Allowed Question Types**: ${typesList.map((t: string) => {
      if (t === "opcion_multiple") return "Multiple Choice (4 alternatives)";
      if (t === "verdadero_falso") return "True or False";
      if (t === "juicio_critico") return "Critical Judgment (open-ended question of high cognitive demand)";
      return t;
    }).join(", ")}

Instructions for generating questions:
1. Generate exactly ${qCount} questions in total, distributed evenly among the selected question types.
2. Each question must strictly belong to one of the authorized types (tipo: 'opcion_multiple', 'verdadero_falso', or 'juicio_critico').
3. For 'opcion_multiple':
   - You must provide exactly 4 response options in the "opciones" array starting with letters (A, B, C, D) (e.g.: ["A) Option one", "B) Option two", ...]).
   - The "respuestaCorrecta" field must contain only the correct letter (e.g.: "A" or "B" or "C" or "D").
4. For 'verdadero_falso':
   - Leave the "opciones" array empty or null.
   - The "respuestaCorrecta" field must be "True" or "False".
5. For 'juicio_critico':
   - Leave the "opciones" array empty or null.
   - The "respuestaCorrecta" field must contain a detailed suggested model response or specific criteria the teacher should look for to consider the response correct.
6. The "justificacion" field must explain in a didactic way why the answer is correct or the rationale behind it based on the reading.

All text must be in professional, pedagogically adapted English.`
      : `Por favor, genera una evaluación académica completa basada en el documento adjunto. Parámetros solicitados:
- **Dificultad**: "${diffStr}" (Adapta la complejidad cognitiva de las preguntas a este nivel: Bajo es comprensión literal, Medio es análisis y aplicación básica, Alto es análisis profundo, síntesis o juicio crítico complejo).
- **Cantidad Total de Preguntas**: ${qCount}
- **Tipos de Preguntas Permitidos**: ${typesList.map((t: string) => {
      if (t === "opcion_multiple") return "Opción Múltiple (4 alternativas)";
      if (t === "verdadero_falso") return "Verdadero o Falso";
      if (t === "juicio_critico") return "Juicio Crítico (pregunta abierta de alta demanda cognitiva)";
      return t;
    }).join(", ")}

Instrucciones para generar las preguntas:
1. Genera exactamente ${qCount} preguntas en total distribuidas de forma equitativa entre los tipos de preguntas seleccionados.
2. Cada pregunta debe pertenecer estrictamente a uno de los tipos autorizados (tipo: 'opcion_multiple', 'verdadero_falso' o 'juicio_critico').
3. Para 'opcion_multiple':
   - Debes proveer exactamente 4 opciones de respuesta en el arreglo "opciones" empezando con la letra (A, B, C, D) (ej: ["A) Opción uno", "B) Opción dos", ...]).
   - El campo "respuestaCorrecta" debe contener sólo la letra correcta (ej: "A" o "B" o "C" o "D").
4. Para 'verdadero_falso':
   - Deja el arreglo "opciones" vacío o nulo.
   - El campo "respuestaCorrecta" debe ser "Verdadero" o "Falso".
5. Para 'juicio_critico':
   - Deja el arreglo "opciones" vacío o nulo.
   - El campo "respuestaCorrecta" debe contener una respuesta modelo sugerida detallada o los criterios específicos que el docente debe buscar para considerar la respuesta correcta.
6. El campo "justificacion" debe explicar de manera didáctica el porqué de la respuesta o el fundamento de la misma en base a la lectura.

Todo el texto generado debe estar en español castellano profesional y adaptado didácticamente.`;

    if (isPdf && pdfBuffer) {
      userPrompt += isEnglish
        ? `\n\n- **REFERENCE DOCUMENT (PDF Attached)**:
The user has attached the PDF titled "${documentName || "document.pdf"}". Analyze it thoroughly and strictly base your questions on it.`
        : `\n\n- **DOCUMENTO DE REFERENCIA (PDF Adjunto)**:
El usuario ha adjuntado el PDF titulado "${documentName || "document.pdf"}". Analízalo detalladamente y basa tus preguntas en él de forma rigurosa.`;
    } else if (extractedText) {
      userPrompt += isEnglish
        ? `\n\n- **REFERENCE DOCUMENT TEXT**:\n"""\n${extractedText}\n"""`
        : `\n\n- **TEXTO DEL DOCUMENTO DE REFERENCIA**:\n"""\n${extractedText}\n"""`;
    }

    userPrompt += isEnglish
      ? `\n\nGenerate the structured evaluation based on the provided JSON schema. Ensure to return exactly a valid JSON in English.`
      : `\n\nGenera la evaluación estructurada en base al esquema JSON provisto. Asegúrate de retornar exactamente un JSON válido.`;

    let contents: any = userPrompt;
    if (isPdf && pdfBuffer) {
      const pdfPart = {
        inlineData: {
          mimeType: "application/pdf",
          data: pdfBuffer.toString("base64"),
        },
      };
      const textPart = {
        text: userPrompt,
      };
      contents = { parts: [pdfPart, textPart] };
    }

    const response = await generateContentWithRetry({
      initialModel: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: evaluationSchema,
        temperature: 0.7,
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No se pudo obtener una respuesta válida del modelo de IA al generar la evaluación.");
    }

    const evaluationJson = JSON.parse(resultText);
    res.json(evaluationJson);
  } catch (err: any) {
    console.error("Error al generar evaluación basada en documento:", err);
    res.status(500).json({
      error: err.message || "Error interno al generar la evaluación estructurada."
    });
  }
});


// API Endpoint to generate assertive communications for parents
app.post("/api/generate-comunicado", async (req, res) => {
  try {
    const { nombre, tema, lang } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: "El nombre del alumno o destinatario es requerido." });
    }
    if (!tema || !tema.trim()) {
      return res.status(400).json({ error: "El tema o motivo del comunicado es requerido." });
    }

    const isEnglish = lang === "en" || lang === "en-US";

    const systemPrompt = isEnglish
      ? `You are an educational psychologist and expert teacher in assertive communication, empathy, and conflict resolution between school and home.
Your goal is to draft a communication for parents about a specific topic concerning a student, rigorously and expertly applying assertive and empathetic communication techniques in English.

The assertive communication techniques you must explicitly apply include:
1. **The Sandwich Technique**: Start by valuing a positive aspect or strength of the student, introduce the area of opportunity or situation constructively, and end with a positive commitment and joint support.
2. **First-Person Messages ("I-Messages")**: Focus the communication from the perspective of the school team seeking to help, avoiding judging, pointing fingers, or making parents or the student feel guilty (avoid "You are/Your child is...").
3. **Objective Description of Facts**: Describe concrete and observable behaviors instead of putting generic labels or subjective diagnoses (e.g., say "has difficulty maintaining focus for more than 10 minutes" instead of "is hyperactive or distracted").
4. **Co-responsibility Focus**: Treat parents as indispensable allies for the academic and socio-emotional growth of the student, promoting teamwork (School + Family).
5. **Proactive and Solution-Oriented Language**: Focus conclusions and recommendations on positive actions to be taken in the future, not on past punishments or reproaches.

You must return the requested complete JSON structure in professional, empathetic English.`
      : `Eres un psicólogo educativo y docente experto en comunicación asertiva, empatía y resolución de conflictos entre la escuela y el hogar.
Tu objetivo es redactar un comunicado para los padres de familia sobre un tema específico de un estudiante, utilizando de manera rigurosa y experta técnicas de comunicación asertiva y empatía.

Las técnicas de comunicación asertiva que debes aplicar de forma explícita incluyen:
1. **La Técnica del Sándwich**: Empezar valorando un aspecto positivo o fortaleza del alumno, introducir el área de oportunidad o situación de forma constructiva, y finalizar con un compromiso positivo y de apoyo conjunto.
2. **Mensajes en Primera Persona ("Mensajes Yo")**: Enfocar el comunicado desde la perspectiva del equipo escolar que busca ayudar, evitando juzgar, señalar o hacer sentir culpables a los padres o al estudiante (evitar "Tú eres/Su hijo es...").
3. **Descripción Objetiva de Hechos**: Describir conductas concretas y observables en lugar de poner etiquetas genéricas o diagnósticos subjetivos (ej. decir "le cuesta mantener la atención por más de 10 minutos" en vez de "es hiperactivo o distraído").
4. **Enfoque de Corresponsabilidad**: Tratar a los padres como aliados indispensables para el crecimiento académico y socioemocional del estudiante, promoviendo el trabajo en equipo (Escuela + Familia).
5. **Lenguaje Proactivo y Orientado a Soluciones**: Enfocar las conclusiones y recomendaciones en acciones positivas que se pueden hacer a futuro, no en castigos o reproches del pasado.

Debes devolver obligatoriamente la estructura JSON solicitada completa en español castellano profesional y empático.`;

    const userPrompt = isEnglish
      ? `Please write a highly formal, assertive, and empathetic school communication in English.
Recipient/student details:
- **Name**: ${nombre.trim()}
- **Topic or reason**: ${tema.trim()}

Make sure to fill out each field of the JSON response with great pedagogical detail:
1. 'titulo': A formal, warm, and orienting title (without causing alarm).
2. 'saludo': A highly respectful and personalized greeting.
3. 'introduccion': The beginning where the student is highlighted positively.
4. 'desarrollo': The assertive, objective, and non-judgmental approach to the actual situation or reason for the communication.
5. 'propuestaColaboracion': Actions proposed by the school and an open invitation to collaborate jointly.
6. 'despedida': Formal, cordial, and thankful closing.
7. 'tecnicasUtilizadas': A pedagogical breakdown explaining in detail to the teacher which exact assertive techniques you applied in the letter and why it was drafted this way (e.g., 'The sandwich technique was used to avoid a defensive posture...').
8. 'sugerenciasCasa': A list of 3 to 5 friendly, practical, and highly constructive guidelines or recommendations that parents can implement at home to help.

Generate the structured communication according to the provided JSON schema.`
      : `Por favor, redacta un comunicado escolar altamente formal, asertivo y empático.
Datos del destinatario/alumno:
- **Nombre**: ${nombre.trim()}
- **Tema o motivo del comunicado**: ${tema.trim()}

Asegúrate de rellenar de forma excelente y con mucho detalle pedagógico cada campo de la respuesta JSON:
1. 'titulo': Un título formal, cálido y orientativo (sin alarmar).
2. 'saludo': Un saludo sumamente respetuoso y personalizado.
3. 'introduccion': El inicio donde se destaca positivamente al alumno/a.
4. 'desarrollo': El abordaje asertivo, objetivo y sin juicios de la situación o motivo real del comunicado.
5. 'propuestaColaboracion': Acciones que propone la escuela y una invitación abierta a colaborar de forma conjunta.
6. 'despedida': Cierre formal, cordial y de agradecimiento.
7. 'tecnicasUtilizadas': Un desglose pedagógico en el que expliques detalladamente a la/el docente qué técnicas asertivas exactas aplicaste en la carta y por qué se redactó así (ej. 'Se usó la técnica del sándwich para evitar una postura defensiva...').
8. 'sugerenciasCasa': Un listado de 3 a 5 pautas o recomendaciones amigables, prácticas y sumamente constructivas que los padres de familia pueden realizar en casa para coadyuvar con el tema.

Genera el comunicado estructurado siguiendo el esquema JSON provisto.`;

    const response = await generateContentWithRetry({
      initialModel: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: comunicadoSchema,
        temperature: 0.7,
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No se pudo obtener una respuesta válida del modelo de IA al generar el comunicado.");
    }

    const comunicadoJson = JSON.parse(resultText);
    res.json(comunicadoJson);
  } catch (err: any) {
    console.error("Error al generar comunicado para padres:", err);
    res.status(500).json({
      error: err.message || "Error interno al generar el comunicado asertivo para padres."
    });
  }
});


// Configure Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode.`);
  });
}

startServer();
