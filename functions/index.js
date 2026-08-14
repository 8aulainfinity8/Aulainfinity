const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenAI, Type } = require("@google/genai");

// --- INITIALIZATION ---

admin.initializeApp();
const db = admin.firestore();

// It's best practice to store API keys in environment variables.
// In Firebase, you can set this using the command:
// firebase functions:config:set gemini.key="YOUR_API_KEY"
const API_KEY = functions.config().gemini.key;

if (!API_KEY) {
  console.error("Gemini API Key is not set in Firebase Functions config.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = "gemini-2.5-flash";

// --- HELPER FUNCTIONS ---

const checkAuth = (context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "The function must be called while authenticated."
        );
    }
};

// --- CALLABLE CLOUD FUNCTIONS ---

/**
 * AI Tutor Chat: Securely gets a response from the AI tutor.
 */
exports.askTutor = functions.https.onCall(async (data, context) => {
  checkAuth(context);
  const { history, image, vibe } = data;

  if (!Array.isArray(history)) {
    throw new functions.https.HttpsError("invalid-argument", "The function requires a 'history' array.");
  }
  
  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  if (image && image.mimeType && image.data) {
    const lastUserMessage = contents[contents.length - 1];
    if (lastUserMessage && lastUserMessage.role === 'user') {
        lastUserMessage.parts.push({
            inlineData: { mimeType: image.mimeType, data: image.data }
        });
    }
  }

  const selectedVibe = vibe || 'socratic';
  const systemInstructions = {
    'socratic': "Actúa como tutor socrático: guía con preguntas cortas de forma incremental, no des la respuesta directa de inmediato al estudiante para que él mismo la deduzca.",
    'explanatory': "Actúa como tutor explicativo: enfócate primordialmente en analogías de la vida diaria, metáforas cotidianas y explicaciones sencillas e incrementales con ejemplos prácticos.",
    'ebau': "Actúa como tutor de preparación EBAU (Selectividad de España): máximo rigor académico, cita teoremas, sigue los criterios de corrección reales de selectividad y advierte sobre errores comunes."
  };

  const baseInstruction = systemInstructions[selectedVibe] || systemInstructions['socratic'];
  const fullInstruction = `${baseInstruction} Responde en español de forma amable y estructurada. No uses LaTeX delimitado (como $...$ o \\(...\\)); en su lugar usa caracteres Unicode legibles (por ejemplo x², √2, ≠, α) o MathML cuando corresponda.`;

  try {
    const response = await ai.models.generateContent({
        model,
        contents: contents,
        config: {
          systemInstruction: fullInstruction,
        }
    });
    return { text: response.text };
  } catch (error) {
    console.error("Gemini API Error in askTutor:", error);
    throw new functions.https.HttpsError("internal", "Failed to get response from AI tutor.");
  }
});

/**
 * Quiz Generation: Securely generates a quiz for a given topic.
 */
exports.generateQuiz = functions.https.onCall(async (data, context) => {
    checkAuth(context);
    const { topic } = data;
    if (!topic) {
        throw new functions.https.HttpsError("invalid-argument", "The function requires a 'topic' string.");
    }
    const prompt = `Generate a 3-question multiple-choice quiz about "${topic}". For each question, provide 4 options, indicate the correct answer index (0-3), and a brief explanation for the correct answer.`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        questions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    text: { type: Type.STRING },
                                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    correctAnswerIndex: { type: Type.INTEGER },
                                    explanation: { type: Type.STRING },
                                },
                            },
                        },
                    },
                },
            },
        });
        
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Gemini API Error in generateQuiz:", error);
        throw new functions.https.HttpsError("internal", "Failed to generate quiz.");
    }
});

/**
 * YouTube Search: Securely finds relevant YouTube videos.
 */
exports.searchYouTubeVideos = functions.https.onCall(async (data, context) => {
    checkAuth(context);
    const { query } = data;
    if (!query) {
        throw new functions.https.HttpsError("invalid-argument", "The function requires a 'query' string.");
    }
    const prompt = `Find 5 relevant educational YouTube videos in Spanish for the topic: "${query}". For each video, provide a concise, descriptive title and its YouTube video ID.`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        videos: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    youtubeId: { type: Type.STRING },
                                }
                            }
                        }
                    }
                }
            },
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Gemini API Error in searchYouTubeVideos:", error);
        throw new functions.https.HttpsError("internal", "Failed to search YouTube videos.");
    }
});

/**
 * Summary Generation with Caching: Gets a saved summary or generates a new one.
 */
exports.getOrGenerateSummary = functions.https.onCall(async (data, context) => {
    checkAuth(context);
    const { videoId, topic } = data;
    if (!videoId || !topic) {
        throw new functions.https.HttpsError("invalid-argument", "Missing videoId or topic.");
    }

    const videoRef = db.collection('videos').doc(videoId);

    try {
        const doc = await videoRef.get();
        if (doc.exists && doc.data().summary) {
            return { summary: doc.data().summary };
        }

        // Summary doesn't exist, generate it
        const prompt = `Summarize the key concepts of the following topic for a high school student: "${topic}". The summary should be concise and easy to understand.`;
        const response = await ai.models.generateContent({ model, contents: prompt });
        const newSummary = response.text;

        // Save the new summary to Firestore
        await videoRef.set({ summary: newSummary }, { merge: true });
        
        return { summary: newSummary };

    } catch (error) {
        console.error("Error in getOrGenerateSummary:", error);
        throw new functions.https.HttpsError("internal", "Could not get or generate summary.");
    }
});

/**
 * Simple AI Call: General-purpose text generation.
 */
exports.callSimpleAI = functions.https.onCall(async (data, context) => {
    checkAuth(context);
    const { prompt } = data;
    if (!prompt) {
        throw new functions.https.HttpsError("invalid-argument", "The function requires a 'prompt' string.");
    }

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: "You are a helpful educational assistant. Explain concepts clearly and concisely in Spanish.",
            }
        });
        return { text: response.text };
    } catch (error) {
        console.error("Gemini API Error in callSimpleAI:", error);
        throw new functions.https.HttpsError("internal", "Failed to get response from Gemini.");
    }
});

