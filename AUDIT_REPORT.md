# Informe de Auditoría de Aula Infinity (FASE 0)

**Fecha de la Auditoría:** 14 de agosto de 2026
**Estado:** Congelado para auditoría (Sin refactorización aún).

De acuerdo con las instrucciones de la FASE 0 del Roadmap Técnico, se ha realizado una inspección detallada del código fuente actual. A continuación, se detallan los hallazgos:

## 1. Inventario de Módulos
*   **Frontend:** React 19, Vite, Tailwind CSS, TypeScript.
*   **Backend / API:** Node.js con Express (`server.ts`).
*   **Cloud Functions:** Firebase Functions (`functions/index.ts`).
*   **Base de datos / Auth:** Firebase Firestore, Firebase Authentication.
*   **Almacenamiento:** Firebase Storage.
*   **WebSockets:** Implementación nativa con `ws` en `server.ts` (usada para la pizarra/cursores).
*   **RTC / Voz y Vídeo:** LiveKit Server SDK (`server.ts`).
*   **Tutor IA:** Gemini (`@google/genai`), implementado tanto en Cloud Functions (`callTutorAI`, `callSimpleAI`) como en Express (`/api/tutor-ia/chat`).
*   **Pagos:** Referenciados en el modelo de datos y reglas, aparentemente integrados desde el cliente hacia Firestore.

## 2. Identificación de Colecciones Firestore
Existe una **duplicación masiva** de colecciones, lo cual es un riesgo arquitectónico grave (mencionado en FASE 8):
*   `users` / `firestore_users`
*   `students`, `teachers`, `admins` (potencial solapamiento con users)
*   `app_config`, `courses` (y subcolecciones), `videos`, `classRecordings`
*   `student_course_progress`
*   `firestore_tutoring_requests`, `firestore_topic_requests`
*   `firestore_direct_messages`, `firestore_peer_messages`, `firestore_teacher_messages`, `firestore_course_messages`, `firestore_course_group_messages`
*   `firestore_conversations`, `firestore_closed_conversations`, `firestore_peer_conversations`
*   `chats`, `rooms`, `calls`, `voice_group_calls`, `voiceRooms`
*   `whiteboards`, `whiteboardCursors`, `whiteboardMeta`, `whiteboardDocs`, `whiteboardStrokes`
*   `firestore_agenda_events`, `firestore_comments`, `firestore_quizzes`, `firestore_student_answers`
*   `infinity_transactions`, `firestore_infinity_transactions`
*   `student_payments`, `firestore_student_payments`, `student_expenses`, `firestore_student_expenses`
*   `teacher_payments`, `firestore_teacher_payments`
*   `student_friends`, `ai_query_logs`, `firestore_deleted_items`, `firestore_user_seen_states`, `whatsapp_queue`, `whatsapp_logs`

## 3. Identificación de Reglas Firestore (Seguridad)
**CRÍTICO:** Múltiples colecciones usan el patrón genérico e inseguro:
`allow read, write: if isSignedIn();`
*   Esto afecta a: `student_course_progress`, `firestore_tutoring_requests`, todas las colecciones de mensajes y chats, salas (rooms, calls), la pizarra (whiteboards y derivadas), comentarios, respuestas de alumnos (`firestore_student_answers`), y lo más crítico: `infinity_transactions`.
*   Cualquier usuario autenticado puede leer, modificar o borrar información privada de otros, incluyendo transacciones financieras.

## 4. Identificación de Reglas Storage (Seguridad)
*   **Seguras:** `/avatars/`, `/users/`, `/notes/` están restringidas por el ID del usuario (`isOwner`).
*   **Inseguras:** 
    *   `/chat_attachments/`, `/course_materials/`: `allow write: if isSignedIn()`. Cualquier alumno podría subir materiales de cursos o saturar el storage.
    *   `/videos/`, `/recordings/`: `allow write: if isSignedIn()`. Cualquier usuario puede subir vídeos de hasta 500MB, no restringido a profesores.
    *   `/receipts/`: Cualquier usuario autenticado puede leer comprobantes (potencial fuga de datos financieros).

## 5. Identificación de Endpoints HTTP (`server.ts`)
1.  `GET /api/health`
2.  `POST /api/send-whatsapp` (Con Rate Limiting en memoria)
3.  `GET /api/livekit/token` (Con Rate Limiting en memoria)
4.  `POST /api/tutor-ia/chat` (Control de cuota local en memoria)

## 6. Identificación de WebSockets (`server.ts`)
*   Servidor en el puerto 3000 con validación de ID Token al inicio.
*   **Falta de Aislamiento:** Al enviar `type: "join"` con un `courseId`, el servidor mete al usuario en la sala y empieza a emitir (broadcasting). No comprueba en Firebase si el usuario tiene permiso para estar en ese curso/sala.

## 7. Identificación de Operaciones Administrativas
*   El frontend (`AdminProtectedRoute.tsx`) bloquea las rutas validando el `role` del documento Firestore o el `email` directamente. 
*   Sin embargo, dado que muchas colecciones de la base de datos están abiertas (`allow write: if isSignedIn()`), un usuario malintencionado no necesita la interfaz de admin para alterar datos sensibles.

## 8. Identificación de Operaciones Financieras
*   Las colecciones `infinity_transactions` y `firestore_infinity_transactions` permiten la escritura a cualquier usuario autenticado (`allow write: if isSignedIn();`). 
*   Falta webhook seguro para validación de pasarelas de pago. La lógica recae fuertemente en el cliente.

## 9. Puntos de Inyección de Datos Sensibles por el Cliente
1.  **Pagos/Créditos/Roles:** El cliente puede crear un registro en `infinity_transactions`. 
2.  **Mensajería / Pizarra:** El cliente puede leer mensajes de otros interceptando el ID de la conversación y consultando Firestore directamente.
3.  **Tutorías:** Cualquier estudiante puede borrar o editar las solicitudes de tutoría.

## Conclusión y Recomendación
La arquitectura contiene **vulnerabilidades críticas de seguridad**, especialmente en las reglas de Firestore que permiten modificaciones horizontales en transacciones y chats. Además, existe una deuda técnica notable en la duplicación del modelo de datos (`firestore_*`).

Se aprueba la finalización de la FASE 0. Según el "ORDEN ABSOLUTO" del Roadmap, **NO DEBEMOS CREAR FUNCIONALIDADES NUEVAS** y la FASE 1 obligatoria debe ser: **SEGURIDAD Y AUTORIZACIÓN (1.1 RBAC)**.

Por favor, confirme la lectura para proceder de inmediato con la **FASE 1**.
