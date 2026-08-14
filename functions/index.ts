/**
 * ¡IMPORTANTE! Este es el código de tu backend.
 * Para que funcione, necesitas:
 * 1. Instalar la Firebase CLI: `npm install -g firebase-tools`
 * 2. Iniciar sesión: `firebase login`
 * 3. En la raíz de tu proyecto, ejecutar: `firebase init functions` (elige TypeScript)
 * 4. Copia este código en `functions/src/index.ts`.
 * 5. Instala las dependencias: `cd functions && npm install @google/genai`
 * 6. Configura tu clave API de forma segura:
 *    `firebase functions:config:set gemini.key="TU_CLAVE_API_DE_GEMINI_AQUI"`
 * 7. Despliega las funciones: `firebase deploy --only functions`
 */

import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

admin.initializeApp();

// Inicializa Gemini con la clave desde la configuración segura de Firebase
const ai = new GoogleGenAI({ apiKey: functions.config().gemini.key });

const systemInstruction = "Si generas contenido que involucre dinero, debes usar Euros (€) como la moneda. Para cualquier notación matemática, no uses LaTeX delimitado (como $...$ o \\(...\\)). En su lugar, usa caracteres Unicode (por ejemplo, x², √2, ≠) o MathML cuando sea apropiado para fórmulas complejas.";

// Función para sincronizar rol de usuario con Custom Claims
export const syncUserRole = functions.region("europe-west1").firestore.document("users/{userId}").onWrite(async (change, context) => {
  const userId = context.params.userId;
  const newData = change.after.exists ? change.after.data() : null;
  const oldData = change.before.exists ? change.before.data() : null;

  if (newData && (!oldData || newData.role !== oldData.role)) {
     await admin.auth().setCustomUserClaims(userId, { role: newData.role });
  }
});

// Función para el Tutor IA (chat)
export const callTutorAI = functions.region("europe-west1").https.onCall(async (data, context) => {
  // Opcional pero recomendado: Verifica que el usuario esté autenticado
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "El usuario debe estar autenticado para usar el Tutor IA.");
  }

  const history = data.history;
  const image = data.image;

  if (!history || !Array.isArray(history)) {
    throw new functions.https.HttpsError("invalid-argument", "El historial del chat es requerido.");
  }

  // Formatea la historia para la API de Gemini
  const formattedHistory = history.slice(0, -1).map((msg: any) => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));

  const lastMessage = history[history.length - 1];
  const lastMessageParts: any[] = [{ text: lastMessage.text }];

  if (image) {
    lastMessageParts.unshift({
      inlineData: {
        mimeType: image.mimeType,
        data: image.data,
      },
    });
  }
  
  // Cast `contents` to the correct type to satisfy the SDK
  const contents = [...formattedHistory, { role: "user", parts: lastMessageParts }] as any;

  try {
    // Para simplificar, usamos una respuesta no-streaming.
    // El streaming desde Cloud Functions v1 requiere una configuración más avanzada.
    const result: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
            systemInstruction,
        },
    });

    return { text: result.text };
  } catch (error) {
    console.error("Error llamando a la API de Gemini:", error);
    throw new functions.https.HttpsError("internal", "Error al comunicarse con el modelo de IA.");
  }
});


// Función para llamadas simples (resúmenes, preguntas, etc.)
export const callSimpleAI = functions.region("europe-west1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "El usuario debe estar autenticado.");
    }
    
    const prompt = data.prompt;
    if (!prompt || typeof prompt !== 'string') {
        throw new functions.https.HttpsError("invalid-argument", "Se requiere un prompt de texto.");
    }

    try {
        const result: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
            },
        });
        return { text: result.text };
    } catch (error) {
        console.error("Error en la llamada simple a la API de Gemini:", error);
        throw new functions.https.HttpsError("internal", "Error al comunicarse con el modelo de IA.");
    }
});