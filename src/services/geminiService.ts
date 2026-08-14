import { httpsCallable } from "firebase/functions";
import { getAuth } from "firebase/auth";
import { functions } from "./firebase";
import { ChatMessage } from '../types';

/**
 * Sends chat history and an optional image to the Gemini API (via callTutorAI or askTutor Cloud Function)
 * with a graceful offline/mock fallback.
 * @param history The full chat history.
 * @param image An optional image to include with the user's message.
 * @param vibe Optional selector for Tutor Style ('socratic' | 'explanatory' | 'ebau').
 * @returns An async generator that yields response chunks.
 */
export async function* getStreamingResponse(history: ChatMessage[], image?: { mimeType: string, data: string }, vibe?: string) {
    // Detect key topics for context and recommend platform videos
    const lastUserMessage = history.filter(h => h.role === 'user').pop()?.text.toLowerCase() || "";
    let videoLinkText = "";
    if (lastUserMessage.includes("derivada") || lastUserMessage.includes("derivar") || lastUserMessage.includes("límite") || lastUserMessage.includes("limite")) {
        videoLinkText = "\n\n💡 **Vídeo Recomendado:** Para profundizar en este tema de forma interactiva, te sugiero ver el videoclase sobre [Derivadas: Reglas y Aplicaciones](/app/video/bach_c_m_2) o sobre el [Estudio de Funciones: Monotonía y Curvatura](/app/video/bach_c2_m_v8) directamente aquí en AulaInfinity.";
    } else if (lastUserMessage.includes("enlace") || lastUserMessage.includes("covalente") || lastUserMessage.includes("iónico") || lastUserMessage.includes("ionico") || lastUserMessage.includes("química") || lastUserMessage.includes("quimica")) {
        videoLinkText = "\n\n💡 **Vídeo Recomendado:** He encontrado un vídeo de nuestra plataforma muy útil sobre este tema: [Enlaces Químicos](/app/video/eso_4_fyq_v7) o también puedes repasar la [Estructura Atómica y Enlaces](/app/video/eso_3_fyq_b2_v3) directamente en la plataforma.";
    }

    const forcedSimulated = typeof window !== 'undefined' && localStorage.getItem('connection_mode') === 'simulated';

    let hasLoadedFromCloud = false;
    let responseText = "";

    try {
        const auth = getAuth();
        if (auth.currentUser && !forcedSimulated) {
            let attempt = 0;
            const maxAttempts = 3;

            while (attempt < maxAttempts && !hasLoadedFromCloud) {
                try {
                    attempt++;
                    const askTutorFn = httpsCallable<{ history: ChatMessage[], image?: { mimeType: string, data: string }, vibe?: string }, { text: string }>(functions, "askTutor");
                    const result = await askTutorFn({ history, image, vibe });
                    if (result.data?.text) {
                        responseText = result.data.text;
                        hasLoadedFromCloud = true;
                    }
                } catch (err) {
                    console.error(`Attempt ${attempt} calling askTutor failed:`, err);
                    if (attempt >= maxAttempts) {
                        // Throw to let outer try-catch trigger local fallback generator
                        throw err;
                    }
                    const delay = Math.pow(2, attempt) * 500; // Exponential delay: 1000ms, 2000ms...
                    await new Promise(r => setTimeout(r, delay));
                }
            }
        }
    } catch (error) {
        console.error("Gemini Cloud Function askTutor failed after retries, using local fallback:", error);
    }

    if (hasLoadedFromCloud && responseText) {
        if (videoLinkText) {
            responseText = responseText + videoLinkText;
        }
        // Stream text in small chunks (10-30 characters) with 30ms-50ms delay for smooth typing UX
        const chunks = responseText.match(/.{1,15}/g) || [responseText];
        for (const chunk of chunks) {
            await new Promise(resolve => setTimeout(resolve, 35));
            yield chunk;
        }
        return;
    }

    // Local simulation fallback if offline/error
    let responses = [
        "¡Entendido! ",
        "He analizado tu consulta en detalle. ",
        "Basándome en los datos de la asignatura, ",
        "la solución implica aplicar las fórmulas y conceptos clave de esta unidad. ",
        "¿Te gustaría que desglosemos el procedimiento paso a paso?"
    ];

    if (vibe === 'socratic') {
        responses = [
            "🧠 **Tutor Socrático:** ¡Hola! Esa es una pregunta magnífica. ",
            "Para ayudarte a asimilar este concepto a largo plazo, me gustaría que razonáramos juntos en lugar de darte la respuesta directa de inmediato. ",
            "¿Cuál crees que es la regla principal o fórmula que deberíamos aplicar primero a los datos del problema? ",
            "Respóndeme a esta pregunta inicial y lo construiremos paso a paso."
        ];
    } else if (vibe === 'explanatory') {
        responses = [
            "💡 **Tutor Explicativo:** ¡Hola! Vamos a desglosar este concepto usando una analogía muy intuitiva. ",
            "Piensa en este concepto académico como en un balancín de parque escolar: ",
            "para que todo funcione de manera estable y armónica, ambos lados de la ecuación deben estar en perfecto equilibrio de peso. ",
            "Si añadimos un elemento a la izquierda, necesitamos compensar a la derecha. ",
            "Vamos a aplicar este mismo equilibrio paso a paso a tu problema."
        ];
    } else if (vibe === 'ebau') {
        responses = [
            "🎯 **Modo Preparación EBAU:** Saludos. De cara a los exámenes oficiales de Selectividad (EBAU) en España, este tema es de vital importancia y suele penalizarse duramente. ",
            "Los correctores de la EBAU exigen el máximo rigor académico: citar los teoremas de forma matemática, enunciar los dominios e intervalos de continuidad y detallar cada paso del cálculo operacional. ",
            "Evita el error común de saltarte explicaciones teóricas, pues podría costarte hasta un 50% de la puntuación de la pregunta. ",
            "Desglosemos la rúbrica oficial de este tipo de ejercicio paso a paso para garantizar que consigas los 2.5 puntos íntegros de este bloque."
        ];
    }

    if (videoLinkText) {
        responses[responses.length - 1] = responses[responses.length - 1] + videoLinkText;
    }

    // Stream the fallback chunks smoothly
    for (const chunk of responses) {
        // Yield word-by-word or sentence chunks
        const parts = chunk.split(" ");
        for (const part of parts) {
            await new Promise(resolve => setTimeout(resolve, 45));
            yield part + " ";
        }
    }
}

/**
 * Sends a simple prompt to Gemini API (via callSimpleAI Cloud Function) with a graceful fallback.
 * @param prompt The user's text prompt.
 * @returns The model's response text.
 */
export const getSimpleResponse = async (prompt: string): Promise<string> => {
    try {
        const auth = getAuth();
        if (auth.currentUser) {
            // Llama a la Cloud Function de forma segura ocultando la API Key en el backend
            const callSimpleAIFn = httpsCallable<{ prompt: string }, { text: string }>(functions, "callSimpleAI");
            const result = await callSimpleAIFn({ prompt });
            if (result.data?.text) {
                return result.data.text;
            }
        }
    } catch (error) {
        console.warn("Cloud Function callSimpleAI falló, usando simulación local:", error);
    }

    // Respuestas simuladas basadas en palabras clave para que la demo funcione sin conexión
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    if (prompt.includes("resumen") || prompt.includes("Resume")) {
        return "## Resumen del Tema\n\n*   **Concepto Clave 1**: Definición y propiedades fundamentales.\n*   **Concepto Clave 2**: Aplicaciones prácticas en la resolución de problemas.\n*   **Conclusión**: La importancia de este tema radica en su utilidad para conectar diferentes áreas del conocimiento.\n\nRecuerda revisar los ejemplos del vídeo para una comprensión completa.";
    } else if (prompt.includes("pregunta") || prompt.includes("Genera")) {
        return "¿Cuál es la característica principal que diferencia este concepto de los estudiados anteriormente?";
    } else if (prompt.includes("respuesta") || prompt.includes("explicación")) {
        return "La respuesta correcta se basa en la aplicación directa de la fórmula general. Al sustituir los valores dados, obtenemos el resultado esperado, confirmando la hipótesis inicial.";
    } else if (prompt.includes("plan")) {
        return "## Plan de Estudio Personalizado\n\n### Día 1: Fundamentos\n*   Repasar vídeo introductorio.\n*   Hacer esquema de conceptos clave.\n\n### Día 2: Práctica\n*   Resolver ejercicios del 1 al 5.\n*   Revisar soluciones y corregir errores.\n\n### Día 3: Repaso Final\n*   Realizar quiz de autoevaluación.\n*   Consultar dudas pendientes con el tutor.";
    }

    return "Esta es una respuesta simulada de la IA. En el modo de producción, esto conecta de forma segura con Gemini en Cloud Functions sin exponer tus claves de acceso.";
};

/**
 * Genera un quiz usando la Cloud Function de Firebase de forma segura.
 * @param topic Tema del quiz.
 */
export const generateQuizFromAI = async (topic: string): Promise<{ questions: any[] }> => {
    try {
        const auth = getAuth();
        if (auth.currentUser) {
            const generateQuizFn = httpsCallable<{ topic: string }, { questions: any[] }>(functions, "generateQuiz");
            const result = await generateQuizFn({ topic });
            if (result?.data?.questions && Array.isArray(result.data.questions)) {
                // Las Cloud Functions por convención pueden usar índices basados en 0 (0 a 3).
                // Mapeamos el correctAnswerIndex a 1-based (1 a 4) para ser compatible con la interfaz del cliente.
                const mappedQuestions = result.data.questions.map((q: any) => ({
                    ...q,
                    correctAnswerIndex: q.correctAnswerIndex !== undefined ? q.correctAnswerIndex + 1 : 1
                }));
                return { questions: mappedQuestions };
            }
        }
    } catch (error) {
        console.warn("Cloud Function generateQuiz falto, usando simulación local:", error);
    }

    // Fallback local simulado en caso de fallar o no estar autenticado
    return {
        questions: [
            {
                text: `¿Cuál de los siguientes describe mejor el tema principal de: ${topic}?`,
                options: ["Definición y bases teóricas", "Análisis avanzado y fórmulas complejas", "Práctica de laboratorio interactiva", "Ninguna de las anteriores"],
                correctAnswerIndex: 1,
                explanation: "Las bases teóricas son esenciales para asentar el conocimiento general del tema."
            },
            {
                text: `Al resolver problemas prácticos de ${topic}, ¿qué aspecto es el más crítico?`,
                options: ["Memoria repetitiva", "Entendimiento conceptual e incremental", "Velocidad de cálculo mental", "Uso exclusivo de herramientas externas"],
                correctAnswerIndex: 2,
                explanation: "El entendimiento conceptual e incremental permite extrapolar y resolver problemas nuevos."
            }
        ]
    };
};

/**
 * Busca videos relevantes de YouTube usando la Cloud Function de Firebase de forma segura.
 * @param query Consulta de búsqueda.
 */
export const searchYouTubeVideosFromAI = async (query: string): Promise<{ title: string, videoId: string }[]> => {
    try {
        const auth = getAuth();
        if (auth.currentUser) {
            const searchFn = httpsCallable<{ query: string }, { videos: any[] }>(functions, "searchYouTubeVideos");
            const result = await searchFn({ query });
            if (result.data?.videos && Array.isArray(result.data.videos)) {
                return result.data.videos;
            }
        }
    } catch (error) {
        console.warn("Cloud Function searchYouTubeVideos falto, usando simulación local:", error);
    }

    // Fallback local en caso de error
    return [
        { title: `Introducción interactiva a ${query}`, videoId: "dQw4w9WgXcQ" },
        { title: `Conceptos clave avanzados sobre ${query}`, videoId: "dQw4w9WgXcQ" }
    ];
};
