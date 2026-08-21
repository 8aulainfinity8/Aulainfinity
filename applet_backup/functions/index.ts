/**
 * Backend Cloud Functions para AulaInfinity
 */

import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

if (!admin.apps.length) {
  admin.initializeApp();
}

// Inicializa Gemini con la clave desde la configuración segura de Firebase
const getAi = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || functions.config().gemini?.key || '' });

const systemInstruction = "Si generas contenido que involucre dinero, debes usar Euros (€) como la moneda. Para cualquier notación matemática, no uses LaTeX delimitado (como $...$ o \\(...\\)). En su lugar, usa caracteres Unicode (por ejemplo, x², √2, ≠) o MathML cuando sea apropiado para fórmulas complejas.";

/**
 * Función para sincronizar de forma segura el rol de usuario con Custom Claims.
 * Evita la escalación de privilegios impidiendo que cambios del cliente otorguen roles privilegiados o aprobación de tutoría.
 */
export const syncUserRole = functions.region("europe-west1").firestore.document("firestore_users/{userId}").onWrite(async (change, context) => {
  const userId = context.params.userId;
  const newData = change.after.exists ? change.after.data() : null;
  const oldData = change.before.exists ? change.before.data() : null;

  try {
    let userRecord: admin.auth.UserRecord;
    try {
      userRecord = await admin.auth().getUser(userId);
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found') {
        console.log(`[syncUserRole] Usuario ${userId} no existe en Auth.`);
        return;
      }
      throw authError;
    }

    const existingClaims = userRecord.customClaims || {};

    // Si el documento de usuario fue eliminado en Firestore, revocar/limpiar claims administrativas
    if (!newData) {
      console.log(`[syncUserRole] Documento firestore_users/${userId} eliminado. Revocando claims privilegiadas.`);
      const cleanedClaims = {
        ...existingClaims,
        role: 'student',
        isAdmin: false,
        isApprovedForTutoring: false
      };
      await admin.auth().setCustomUserClaims(userId, cleanedClaims);
      return;
    }

    let targetRole = newData.role || 'student';
    let isApprovedForTutoring = Boolean(newData.isApprovedForTutoring);
    let isAdmin = Boolean(newData.isAdmin);

    const wasAdmin = oldData?.role === 'admin' || oldData?.isAdmin === true || existingClaims.role === 'admin';
    const wasTeacher = oldData?.role === 'teacher' || existingClaims.role === 'teacher' || wasAdmin;
    const wasApproved = oldData?.isApprovedForTutoring === true || existingClaims.isApprovedForTutoring === true || wasAdmin;

    // 1. Protección contra escalación a admin desde escritura cliente
    if (targetRole === 'admin' || isAdmin) {
      if (!wasAdmin) {
        console.warn(`[syncUserRole] Bloqueada escalación no autorizada a admin para ${userId}`);
        targetRole = oldData?.role || existingClaims.role || 'student';
        isAdmin = false;
      } else {
        isAdmin = true;
      }
    }

    // 2. Protección contra escalación a teacher desde escritura cliente (student -> teacher requiere backend/Admin SDK)
    if (targetRole === 'teacher') {
      if (!wasTeacher) {
        console.warn(`[syncUserRole] Bloqueada escalación no autorizada a teacher para ${userId}. Debe ser aprobada por admin.`);
        targetRole = oldData?.role || existingClaims.role || 'student';
      }
    }

    // 3. Protección contra auto-aprobación de tutoría desde escritura cliente
    if (targetRole === 'teacher' && isApprovedForTutoring) {
      if (!wasApproved) {
        console.warn(`[syncUserRole] Bloqueada auto-aprobación de tutoría para ${userId}`);
        isApprovedForTutoring = false;
      }
    }

    const updatedClaims = {
      ...existingClaims,
      role: targetRole,
      isAdmin: targetRole === 'admin' || isAdmin,
      isApprovedForTutoring: targetRole === 'admin' ? true : (targetRole === 'teacher' ? isApprovedForTutoring : false)
    };

    await admin.auth().setCustomUserClaims(userId, updatedClaims);
    console.log(`[syncUserRole] Custom claims actualizados con éxito para ${userId}:`, updatedClaims);
  } catch (err) {
    console.error(`[syncUserRole] Error al actualizar custom claims para ${userId}:`, err);
  }
});

/**
 * Callable Function exclusiva para Administradores verificados para asignar roles o aprobar profesores.
 * La autorización depende estrictamente del Custom Claim role === 'admin'.
 */
export const adminSetUserClaims = functions.region("europe-west1").https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Se requiere autenticación.");
  }

  const callerClaims = (context.auth.token || {}) as any;
  const isCallerAdmin = callerClaims.role === 'admin';

  if (!isCallerAdmin) {
    console.warn(`[adminSetUserClaims] Intento de acceso no autorizado por UID: ${context.auth.uid}`);
    throw new functions.https.HttpsError("permission-denied", "Solo un administrador con claim verificado puede modificar permisos de usuario.");
  }

  const { targetUid, role, isApprovedForTutoring, isAdmin } = data;
  if (!targetUid || !role) {
    throw new functions.https.HttpsError("invalid-argument", "Se requiere targetUid y role.");
  }

  if (!['student', 'teacher', 'admin'].includes(role)) {
    throw new functions.https.HttpsError("invalid-argument", "Rol inválido especificado.");
  }

  try {
    const userRecord = await admin.auth().getUser(targetUid);
    const existingClaims = userRecord.customClaims || {};

    const newClaims = {
      ...existingClaims,
      role: role,
      isAdmin: role === 'admin' || Boolean(isAdmin),
      isApprovedForTutoring: role === 'admin' ? true : (role === 'teacher' ? Boolean(isApprovedForTutoring) : false)
    };

    await admin.auth().setCustomUserClaims(targetUid, newClaims);
    console.log(`[adminSetUserClaims] Admin ${context.auth.uid} actualizó claims para ${targetUid}:`, newClaims);

    // Sincronizar también en Firestore utilizando Admin SDK
    const db = admin.firestore();
    const updateData: any = {
      role: role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedByAdminUid: context.auth.uid
    };
    if (role === 'teacher') {
      updateData.isApprovedForTutoring = Boolean(isApprovedForTutoring);
    }
    if (role === 'admin') {
      updateData.isAdmin = true;
      updateData.isApprovedForTutoring = true;
    }

    await db.collection('firestore_users').doc(targetUid).set(updateData, { merge: true });
    await db.collection('users').doc(targetUid).set(updateData, { merge: true });

    return { success: true, targetUid, claims: newClaims, updatedBy: context.auth.uid };
  } catch (err: any) {
    console.error("[adminSetUserClaims] Error:", err);
    throw new functions.https.HttpsError("internal", err.message || "Error al actualizar permisos.");
  }
});

// Función para el Tutor IA (chat)
export const callTutorAI = functions.region("europe-west1").https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "El usuario debe estar autenticado para usar el Tutor IA.");
  }

  const history = data.history;
  const image = data.image;

  if (!history || !Array.isArray(history)) {
    throw new functions.https.HttpsError("invalid-argument", "El historial del chat es requerido.");
  }

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
  
  const contents = [...formattedHistory, { role: "user", parts: lastMessageParts }] as any;

  try {
    const ai = getAi();
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
        const ai = getAi();
        const result: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
            },
        });

        return { text: result.text };
    } catch (error) {
        console.error("Error llamando a la API de Gemini:", error);
        throw new functions.https.HttpsError("internal", "Error al procesar la solicitud con IA.");
    }
});
