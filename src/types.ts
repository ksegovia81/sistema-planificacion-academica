export interface Activity {
  tipo: string;
  descripcion: string;
  recursos?: string;
}

export interface DidacticPhase {
  duracionEstimada: string;
  actividades: Activity[];
}

export interface LessonPlan {
  titulo: string;
  tema: string;
  nivel: string;
  duracion: string;
  enfoque: string;
  objetivos: {
    objetivoGeneral: string;
    objetivosEspecificos: string[];
    competencias: string[];
  };
  materiales: {
    docente: string[];
    estudiante: string[];
  };
  secuenciaDidactica: {
    inicio: DidacticPhase;
    desarrollo: DidacticPhase;
    cierre: DidacticPhase;
  };
  evaluacion: {
    criterios: string[];
    evidencia: string;
    instrumento: string;
  };
  fichaTrabajo: {
    tituloFicha: string;
    instrucciones: string;
    ejercicios: {
      enunciado: string;
      pistas?: string;
      solucionSugerida: string;
    }[];
  };
  sugerenciasDocente: {
    diferenciacion: string;
    preguntasClave: string[];
  };
  rubrica?: {
    tituloRubrica: string;
    criterios: {
      criterio: string;
      excelente: string;
      bueno: string;
      regular: string;
      insuficiente: string;
    }[];
  };
  includeRubric?: boolean;
  materialDidactico?: {
    titulo: string;
    tipo: string;
    contenido: string;
  };
}

export interface SavedLessonPlan {
  id: string;
  timestamp: number;
  data: LessonPlan;
}

export interface CustomQuestion {
  tipo: "opcion_multiple" | "verdadero_falso" | "juicio_critico" | string;
  enunciado: string;
  opciones?: string[]; // Solo para opción múltiple
  respuestaCorrecta: string;
  justificacion: string;
}

export interface CustomEvaluation {
  id?: string;
  titulo: string;
  documentoReferencia: string;
  dificultad: "Bajo" | "Medio" | "Alto" | string;
  cantidadPreguntas: number;
  tiposPreguntas: string[];
  instrucciones: string;
  preguntas: CustomQuestion[];
  timestamp?: number;
}

export interface ParentCommunication {
  titulo: string;
  saludo: string;
  introduccion: string;
  desarrollo: string;
  propuestaColaboracion: string;
  despedida: string;
  tecnicasUtilizadas: string[];
  sugerenciasCasa: string[];
}

export interface SavedParentCommunication {
  id: string;
  timestamp: number;
  nombre: string;
  tema: string;
  data: ParentCommunication;
}


