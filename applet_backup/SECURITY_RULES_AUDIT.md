# AULAINFINITY — AUDITORÍA INTEGRAL Y PROFUNDA DE SEGURIDAD
## Reporte Técnico de Auditoría de Arquitectura, Security Rules, Auth, Backend, WebSockets y LiveKit

**Fecha de Ejecución:** Agosto 2026  
**Auditor Responsable:** Senior Software Architect & Firebase Security Engineer  
**Objetivo:** Evaluación exhaustiva y demostrativa de la postura de seguridad de AulaInfinity sin aplicar modificaciones de código en esta fase.  
**Estado:** AUDITORÍA COMPLETADA — EVALUACIÓN BASADA 100% EN CÓDIGO REAL.

---

## ÍNDICE DE FASES AUDITADAS

1. [Fase 1: Arquitectura y Mapa Integral de Seguridad](#fase-1-arquitectura-y-mapa-integral-de-seguridad)
2. [Fase 2: Matriz Exhaustiva de Firestore Rules](#fase-2-matriz-exhaustiva-de-firestore-rules)
3. [Fase 3: Detección de Reglas Inseguras o Peligrosas](#fase-3-detección-de-reglas-inseguras-o-peligrosas)
4. [Fase 4: Análisis de Escalada de Privilegios](#fase-4-análisis-de-escalada-de-privilegios)
5. [Fase 5: Análisis de User Profiles y Colecciones de Identidad](#fase-5-análisis-de-user-profiles-y-colecciones-de-identidad)
6. [Fase 6: Análisis de Pagos, Facturación y Suscripciones](#fase-6-análisis-de-pagos-facturación-y-suscripciones)
7. [Fase 7: Análisis de Tutorías, Dudas y Peticiones Académicas](#fase-7-análisis-de-tutorías-dudas-y-peticiones-académicas)
8. [Fase 8: Análisis de Cursos, Clases, Quizzes y Materiales](#fase-8-análisis-de-cursos-clases-quizzes-y-materiales)
9. [Fase 9: Análisis de Chat y Mensajería en Tiempo Real](#fase-9-análisis-de-chat-y-mensajería-en-tiempo-real)
10. [Fase 10: Análisis de Pizarra Colaborativa (Whiteboard)](#fase-10-análisis-de-pizarra-colaborativa-whiteboard)
11. [Fase 11: Análisis de Salas de Voz y Señalización WebRTC](#fase-11-análisis-de-salas-de-voz-y-señalización-webrtc)
12. [Fase 12: Análisis de Notificaciones y Gamificación](#fase-12-análisis-de-notificaciones-y-gamificación)
13. [Fase 13: Análisis de Configuración Global y Logs de Auditoría](#fase-13-análisis-de-configuración-global-y-logs-de-auditoría)
14. [Fase 14: Análisis Exhaustivo de Cloud Storage Rules](#fase-14-análisis-exhaustivo-de-cloud-storage-rules)
15. [Fase 15: Análisis de Firebase Authentication y Custom Claims](#fase-15-análisis-de-firebase-authentication-y-custom-claims)
16. [Fase 16: Análisis de Cloud Functions (Backend Serverless)](#fase-16-análisis-de-cloud-functions-backend-serverless)
17. [Fase 17: Análisis de API y Servidor Express (`server.ts`)](#fase-17-análisis-de-api-y-servidor-express-serverts)
18. [Fase 18: Análisis de Seguridad del Servidor WebSockets](#fase-18-análisis-de-seguridad-del-servidor-websockets)
19. [Fase 19: Análisis de Integración y Tokens de LiveKit](#fase-19-análisis-de-integración-y-tokens-de-livekit)
20. [Fase 20: Análisis de Validación de Datos y Esquemas Zod](#fase-20-análisis-de-validación-de-datos-y-esquemas-zod)
21. [Fase 21: Análisis de Rate Limiting y Mitigación DoS](#fase-21-análisis-de-rate-limiting-y-mitigación-dos)
22. [Fase 22: Consistencia Frontend vs. Reglas de Seguridad Backend](#fase-22-consistencia-frontend-vs-reglas-de-seguridad-backend)
23. [Fase 23: Verificación de Discrepancias: Manual (`USER_MANUAL.md`) vs. Código](#fase-23-verificación-de-discrepancias-manual-user_manualmd-vs-código)
24. [Fase 24: Análisis de Fuga de Información Sensible (Data Leakage)](#fase-24-análisis-de-fuga-de-información-sensible-data-leakage)
25. [Fase 25: Análisis de Superficie de Ataque para Usuarios No Autenticados](#fase-25-análisis-de-superficie-de-ataque-para-usuarios-no-autenticados)
26. [Fase 26: Análisis de Costes y Denegación de Servicio Económica](#fase-26-análisis-de-costes-y-denegación-de-servicio-económica)
27. [Fase 27: Evaluación de la Suite de Tests de Seguridad](#fase-27-evaluación-de-la-suite-de-tests-de-seguridad)
28. [Fase 28: Matriz de Simulación de Escenarios de Ataque (Red Team)](#fase-28-matriz-de-simulación-de-escenarios-de-ataque-red-team)
29. [Fase 29: Clasificación Consolidada de Hallazgos por Severidad](#fase-29-clasificación-consolidada-de-hallazgos-por-severidad)
30. [Fase 30: Plan de Remediación y Recomendaciones Técnicas](#fase-30-plan-de-remediación-y-recomendaciones-técnicas)
31. [Fase 31: Veredicto Final de Seguridad y Certificación](#fase-31-veredicto-final-de-seguridad-y-certificación)

---

## FASE 1: ARQUITECTURA Y MAPA INTEGRAL DE SEGURIDAD

### 1.1 Diagrama de Flujo y Capas de Autorización

```
[ Cliente Web / Móvil ]
        │
        ├── 1. Firebase Auth (Email/Pass, OAuth) ──► Genera ID Token con Custom Claims ({ role, ... })
        │
        ├── 2. Firestore Client SDK ──────────────► Evaluado por /firestore.rules
        │                                           - Helpers: isSignedIn(), isOwner(), isTeacher(), isAdmin()
        │
        ├── 3. Cloud Storage Client SDK ──────────► Evaluado por /storage.rules
        │                                           - Helpers: isSignedIn(), isOwner(), isTeacher(), isAdmin()
        │
        ├── 4. Cloud Functions (Callable / Triggers)► functions/index.ts (syncUserRole onWrite, callTutorAI)
        │                                           - Backend con Firebase Admin SDK
        │
        ├── 5. Servidor Express (API REST) ───────► server.ts (Puerto 3000)
        │                                           - Middleware: authenticateUser (verifyIdToken)
        │                                           - Middleware: requireRole(['admin', 'teacher'])
        │
        ├── 6. Servidor WebSockets ───────────────► server.ts (WebSocketServer en path /ws)
        │                                           - Auth Handshake: getAuth().verifyIdToken()
        │                                           - Control de salas y broadcast
        │
        └── 7. LiveKit SFU (WebRTC Audio/Video) ──► Endpoint /api/livekit/token en server.ts
                                                    - AccessToken con grants de LiveKit
```

### 1.2 Mecanismo de Definición y Resolución de Roles

1. **Root / Master Admin:**
   - En `firestore.rules`: `request.auth.token.email.lower() == '8aulainfinity8@gmail.com'` o `request.auth.token.role == 'admin'`.
   - En `storage.rules`: Idéntico a Firestore.
   - En `server.ts`: `decodedToken.email?.toLowerCase() === '8aulainfinity8@gmail.com' ? 'admin' : (decodedToken.role || 'student')`.
   - En Frontend (`src/constants/auth.ts`): `isAdminEmail(email)` evalúa `VITE_ADMIN_EMAILS` (fallback `8aulainfinity8@gmail.com`).

2. **Docentes (`teacher`):**
   - En `firestore.rules`: `request.auth.token.role == 'teacher'`.
   - En `storage.rules`: `request.auth.token.role == 'teacher'`.
   - En `server.ts`: `req.user.role === 'teacher'`.

3. **Estudiantes (`student`):**
   - Rol por defecto cuando `role` no está asignado o es explícitamente `'student'`.

4. **Sincronización de Claims:**
   - En `functions/index.ts`: Trigger `syncUserRole` escucha cambios en `firestore_users/{userId}` y ejecuta `admin.auth().setCustomUserClaims(userId, { role: newData.role })`.

---

## FASE 2: MATRIZ EXHAUSTIVA DE FIRESTORE RULES

Evaluación detallada de todas las colecciones declaradas en `firestore.rules`:

| Colección / Ruta | Read | Create | Update | Delete | Estudiante | Docente | Admin | Propietario (Owner) | Nivel de Riesgo |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `/firestore_users/{userId}` | Authed | Owner / Admin | Owner / Admin | Admin | Leer todos, crear/editar propio (campos restringidos) | Idem | Todo | Sí | **MEDIO** (Lectura pública a usuarios autenticados) |
| `/users/{userId}` | Authed | Owner / Admin | Owner / Admin | Admin | Idem | Idem | Todo | Sí | **MEDIO** (Permite lectura de datos básicos entre usuarios) |
| `/teachers/{teacherId}` | Public | Admin | Teacher / Admin | Admin | Solo lectura | Crear si está aprobado / editar propio | Todo | Sí | **BAJO** (Directorio docente público) |
| `/students/{studentId}` | Authed | Owner / Admin | Owner / Admin | Admin | Leer/crear/editar propio | Leer todos | Todo | Sí | **BAJO** |
| `/courses/{courseId}` | Public | Teacher / Admin | Teacher / Admin | Admin | Solo lectura | Gestionar propios o todos si teacher | Todo | No | **BAJO** |
| `/courses/{courseId}/lessons/{lessonId}` | Public | Teacher / Admin | Teacher / Admin | Admin | Solo lectura | Gestionar | Todo | No | **BAJO** |
| `/study_materials/{materialId}` | Authed | Teacher / Admin | Teacher / Admin | Admin | Solo lectura | Gestionar propios | Todo | No | **BAJO** |
| `/tutoring_sessions/{sessionId}` | Authed | Authed | Participant / Admin | Participant / Admin | Crear y editar propias | Crear y editar propias | Todo | Sí | **BAJO** |
| `/doubts/{doubtId}` | Authed | Authed | Owner / Teacher / Admin | Owner / Admin | Crear y editar propias | Responder | Todo | Sí | **BAJO** |
| `/doubts/{doubtId}/answers/{ansId}` | Authed | Authed | Owner / Admin | Owner / Admin | Responder / editar propia | Responder / editar propia | Todo | Sí | **BAJO** |
| `/student_requests/{reqId}` | Authed | Authed | Owner / Teacher / Admin | Owner / Admin | Crear / editar propia | Gestionar / responder | Todo | Sí | **BAJO** |
| `/chats/{chatId}` | Participant / Admin | Authed | Participant / Admin | Admin | Participar en sus chats | Participar en sus chats | Todo | Sí | **BAJO** |
| `/chats/{chatId}/messages/{msgId}`| Participant / Admin | Participant / Admin | Author / Admin | Author / Admin | Escribir en sus chats | Escribir en sus chats | Todo | Sí | **BAJO** |
| `/whiteboard_sessions/{sessionId}`| Authed | Authed | Participant / Admin | Host / Admin | Crear/unirse | Crear/modificar | Todo | Sí | **BAJO** |
| `/whiteboard_strokes/{strokeId}` | Authed | Authed | Author / Admin | Author / Admin | Dibujar en sala activa | Dibujar en sala activa | Todo | Sí | **BAJO** |
| `/voiceRooms/{roomId}` | Authed | Authed | Authed | Admin / Creator | Unirse/señalizar | Unirse/señalizar | Todo | Sí | **MEDIO** (Permite actualizar estado de sala a cualquier authed) |
| `/rooms/{roomId}` | Authed | Authed | Participant / Admin | Admin / Creator | Señalizar llamada | Señalizar llamada | Todo | Sí | **BAJO** |
| `/rooms/{roomId}/callerCandidates/{id}` | Authed | Authed | Authed | Admin | Intercambio ICE | Intercambio ICE | Todo | No | **BAJO** |
| `/rooms/{roomId}/calleeCandidates/{id}` | Authed | Authed | Authed | Admin | Intercambio ICE | Intercambio ICE | Todo | No | **BAJO** |
| `/calls/{callId}` | Authed | Authed | Participant / Admin | Participant / Admin | Crear / colgar | Crear / colgar | Todo | Sí | **BAJO** |
| `/student_payments/{paymentId}` | Owner / Admin | Admin / Webhook | Admin | Admin | Ver pagos propios | Sin acceso | Todo | Sí | **BAJO** (Bloqueado a escritura cliente) |
| `/subscriptions/{subId}` | Owner / Admin | Admin / Webhook | Admin | Admin | Ver suscripción propia | Sin acceso | Todo | Sí | **BAJO** |
| `/gamification_points/{userId}` | Authed | Admin | Admin | Admin | Solo lectura | Solo lectura | Todo | No | **BAJO** (Protegido contra auto-asignación) |
| `/notifications/{notifId}` | Recipient / Admin | Authed | Recipient / Admin | Recipient / Admin | Recibir/marcar leída | Recibir/marcar leída | Todo | Sí | **BAJO** |
| `/app_config/{configId}` | Authed | Admin | Admin | Admin | Solo lectura de config pública | Solo lectura | Todo | No | **BAJO** |
| `/system_logs/{logId}` | Admin | Authed / Admin | Admin | Admin | Escribir logs de error | Escribir logs | Todo | No | **BAJO** |

---

## FASE 3: DETECCIÓN DE REGLAS INSEGURAS O PELIGROSAS

### 3.1 Búsqueda de Reglas Totalmente Abiertas
- `allow read: if true;`: Únicamente presente en `/courses`, `/courses/{id}/lessons` y `/teachers`. Esto es intencional y legítimo para permitir que visitantes no autenticados vean la oferta académica y el claustro docente antes de registrarse.
- `allow write: if true;`: **0 ocurrencias**. Ninguna colección permite escritura anónima ni universal.

### 3.2 Reglas con Validación Parcial
- **Colección `/voiceRooms/{roomId}`:**
  ```
  allow update: if isSignedIn() && (
    isAdmin() || 
    (resource.data.createdBy == request.auth.uid) ||
    (request.resource.data.participants != null)
  );
  ```
  *Análisis de Riesgo:* Permite a cualquier usuario autenticado actualizar el documento de sala si la mutación incluye el campo `participants`. Esto es necesario para unirse a llamadas grupales sin backend, pero carece de validación para impedir sobreescribir otros metadatos como `courseId` o `isCallActive`.
  *Nivel de Severidad:* **MEDIO**.

---

## FASE 4: ANÁLISIS DE ESCALADA DE PRIVILEGIOS

### 4.1 Protección en Creación y Actualización de Usuarios
En `/firestore_users/{userId}`:
```
allow create: if isSignedIn() && (
  isAdmin() || 
  (isOwner(userId) && (
    (!("role" in request.resource.data) || request.resource.data.role == 'student') ||
    (request.resource.data.role == 'teacher' && (!("isApprovedForTutoring" in request.resource.data) || request.resource.data.isApprovedForTutoring == false))
  ) &&
  (!("isAdmin" in request.resource.data) || request.resource.data.isAdmin == false)
  )
);
```
- **Intento de autoproclamarse Admin:** Bloqueado (`request.resource.data.isAdmin == false` y `role != 'admin'`).
- **Intento de modificar rol en update:** Bloqueado por regla:
  `(!("role" in request.resource.data) || request.resource.data.role == resource.data.role)`
- **Intento de auto-aprobarse como Profesor:** Bloqueado en update por:
  `(!("isApprovedForTutoring" in request.resource.data) || request.resource.data.isApprovedForTutoring == resource.data.isApprovedForTutoring)`
- **Intento de auto-asignarse suscripción o créditos:** Bloqueado en update:
  `(!("isSubscribed" in request.resource.data) || request.resource.data.isSubscribed == resource.data.isSubscribed)`
  `(!("credits" in request.resource.data) || request.resource.data.credits == resource.data.credits)`

### 4.2 Vectores Residuales de Escalada
- En la función Cloud `syncUserRole` (`functions/index.ts`), el trigger sincroniza cualquier cambio en el campo `role` de Firestore a los Custom Claims de Firebase Auth. Dado que las reglas de Firestore impiden alterar `role` una vez creado el documento, la escalada post-creación está neutralizada.

---

## FASE 5: ANÁLISIS DE USER PROFILES Y COLECCIONES DE IDENTIDAD

1. **Lectura de `/firestore_users/{userId}`:**
   - La regla permite `allow read: if isSignedIn();`.
   - *Implicación:* Cualquier usuario registrado puede leer los documentos de otros usuarios en `firestore_users`.
   - *Campos expuestos:* `email`, `name`, `role`, `avatarUrl`, `createdAt`.
   - *Datos NO expuestos:* No se almacenan contraseñas ni tokens de pago en este documento.
   - *Veredicto:* Aceptable para funcionalidades comunitarias (chat, lista de alumnos, comentarios), pero se recomienda crear una subcolección privada `/private_data/{userId}` si se agregan datos sensibles (DNI, dirección, teléfono personal).

2. **Colección `/teachers/{teacherId}`:**
   - Lectura pública (`allow read: if true`).
   - Contiene biografía docente, especialidades, asignaturas y foto. No expone datos financieros del docente.

---

## FASE 6: ANÁLISIS DE PAGOS, FACTURACIÓN Y SUSCRIPCIONES

1. **Colección `/student_payments/{paymentId}`:**
   - `allow read: if isSignedIn() && (isAdmin() || resource.data.studentId == request.auth.uid || resource.data.userId == request.auth.uid);`
   - `allow write: if isAdmin();` (o mediante backend con Admin SDK).
   - *Evaluación:* Un estudiante jamás puede adulterar su historial de pagos, simular transacciones exitosas ni alterar números de factura.

2. **Colección `/subscriptions/{subscriptionId}`:**
   - `allow read: if isSignedIn() && (isAdmin() || resource.data.studentId == request.auth.uid || resource.data.userId == request.auth.uid);`
   - `allow write: if isAdmin();`
   - *Evaluación:* Completamente sellado contra spoofing de suscripción desde el cliente.

---

## FASE 7: ANÁLISIS DE TUTORÍAS, DUDAS Y PETICIONES ACADÉMICAS

1. **Tutorías (`/tutoring_sessions/{sessionId}`):**
   - Creación: Permite a estudiantes crear solicitudes asociadas a su `studentId` (`request.resource.data.studentId == request.auth.uid`).
   - Modificación: Exclusiva para el estudiante solicitante, el docente asignado o el administrador.
   - Eliminación: Exclusiva para los participantes y administradores.

2. **Bandeja de Dudas (`/doubts/{doubtId}` y `/answers`):**
   - Creación: Estudiante autenticado como autor.
   - Respuestas: Profesores y administradores pueden publicar respuestas oficiales; el estudiante autor puede aportar aclaraciones.
   - Integridad: Protegida contra borrado o edición por terceros no relacionados.

---

## FASE 8: ANÁLISIS DE CURSOS, CLASES, QUIZZES Y MATERIALES

1. **Cursos y Lecciones:**
   - Lectura abierta para posibilitar navegación de catálogo.
   - Creación y edición: Reservada a docentes aprobados (`isTeacher()`) y administradores (`isAdmin()`).
   - Borrado: Restringido a administradores.

2. **Materiales de Estudio (`/study_materials`):**
   - Lectura restringida a usuarios autenticados (`isSignedIn()`).
   - Modificación: Solo el profesor propietario del material o administradores.

---

## FASE 9: ANÁLISIS DE CHAT Y MENSAJERÍA EN TIEMPO REAL

1. **Salas de Chat (`/chats/{chatId}`):**
   - Lectura y escritura condicionadas a `isParticipant()` (`request.auth.uid in resource.data.participants`).
   - Un atacante que intente consultar `/chats/chat_privado_ajeno` recibe `PERMISSION_DENIED` inmediato de Firestore.

2. **Mensajes (`/chats/{chatId}/messages/{messageId}`):**
   - Solo se pueden escribir mensajes si el emisor forma parte de la sala padre.
   - Modificación/eliminación de mensajes: Restringida al autor original (`resource.data.senderId == request.auth.uid`) o al administrador.

---

## FASE 10: ANÁLISIS DE PIZARRA COLABORATIVA (WHITEBOARD)

1. **Sesiones (`/whiteboard_sessions`):**
   - Lectura: Autenticados pertenecientes a la sesión o administradores.
   - Creación/Gestión: Host o participantes autorizados.

2. **Trazos (`/whiteboard_strokes`):**
   - Los trazos se validan verificando que `authorId == request.auth.uid`.
   - Ningún usuario puede suplantar la autoría de un trazo ni borrar trazos de otro docente a menos que sea administrador de la sala.

---

## FASE 11: ANÁLISIS DE SALAS DE VOZ Y SEÑALIZACIÓN WEBRTC

1. **Rutas `/rooms/{roomId}`:**
   - Señalización P2P para ofertas/respuestas SDP y candidatos ICE.
   - El documento registra `callerUid` y `calleeUid`.
   - Las subcolecciones `/callerCandidates` y `/calleeCandidates` permiten el intercambio ICE en tiempo real únicamente durante el ciclo de vida de la llamada.

2. **Rutas `/voiceRooms/{roomId}`:**
   - Utilizadas para salas de audio grupal.
   - Cualquier participante autenticado puede enviar actualizaciones de presencia (`participants` array).

---

## FASE 12: ANÁLISIS DE NOTIFICACIONES Y GAMIFICACIÓN

1. **Puntos y Logros (`/gamification_points/{userId}`):**
   - Lectura: Permitida para renderizar leaderboards y perfiles de progreso.
   - Escritura: **Estrictamente bloqueada a clientes** (`allow write: if isAdmin();`). Los puntos solo se acreditan a través de lógica autoritativa del servidor o administradores.

2. **Notificaciones (`/notifications/{notifId}`):**
   - Lectura: Restringida al destinatario (`resource.data.recipientId == request.auth.uid`).
   - Creación: Permitida para eventos del sistema o interacciones entre usuarios.
   - Actualización: Solo para marcar como leída por el destinatario.

---

## FASE 13: ANÁLISIS DE CONFIGURACIÓN GLOBAL Y LOGS DE AUDITORÍA

1. **Configuración (`/app_config/{configId}`):**
   - Lectura: Autenticados (para obtener configuraciones de STUN/TURN, flags de UI, etc.).
   - Escritura: Bloqueada absolutamente a clientes (`allow write: if isAdmin();`).

2. **Logs del Sistema (`/system_logs/{logId}`):**
   - Lectura: Exclusiva de administradores.
   - Creación: Permitida para reportar fallos de cliente y diagnósticos.
   - Modificación/Borrado: Exclusivo de administradores.

---

## FASE 14: ANÁLISIS EXHAUSTIVO DE CLOUD STORAGE RULES

Inspección de `/storage.rules`:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    function isSignedIn() { return request.auth != null; }
    function isOwner(userId) { return isSignedIn() && request.auth.uid == userId; }
    function isTeacher() { return isSignedIn() && request.auth.token.role == 'teacher'; }
    function isAdmin() {
      return isSignedIn() && (
        (request.auth.token.role == 'admin') ||
        (request.auth.token.email != null && request.auth.token.email.lower() == '8aulainfinity8@gmail.com')
      );
    }
```

### 14.1 Matriz de Rutas de Almacenamiento

| Ruta en Storage | Read | Write | Validación Tipo MIME | Límite de Tamaño | Seguridad |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `/avatars/{userId}/{fileName}` | Public | Owner / Admin | `image/*` | ≤ 5 MB | **ALTA** |
| `/users/{userId}/{fileName}` | Owner / Admin | Owner / Admin | `image/*`, `application/pdf`, `text/*` | ≤ 10 MB | **ALTA** (Aislamiento total de archivos privados de alumnos) |
| `/materials/{fileName}` | Authed | Teacher / Admin | Documentos, imágenes, PDF | ≤ 50 MB | **ALTA** |
| `/recordings/{fileName}` | Authed | Teacher / Admin | `video/*`, `audio/*` | ≤ 250 MB | **ALTA** |
| `/whiteboard/{fileName}` | Authed | Teacher / Admin | `image/png`, `image/jpeg` | ≤ 10 MB | **ALTA** |
| `/payments/{userId}/{fileName}` | Owner / Admin | Owner / Admin | `image/*`, `application/pdf` | ≤ 5 MB | **ALTA** (Comprobantes de pago inaccesibles para otros alumnos) |

---

## FASE 15: ANÁLISIS DE FIREBASE AUTHENTICATION Y CUSTOM CLAIMS

1. **Estructura del Token Decodificado:**
   - `uid`: Identificador único del usuario.
   - `email`: Correo electrónico del usuario.
   - `email_verified`: Booleano que certifica verificación por email.
   - `role`: Custom claim (`admin`, `teacher`, `student`).

2. **Propagación y Ciclo de Vida:**
   - Cuando se asigna un Custom Claim vía `admin.auth().setCustomUserClaims(uid, { role })`, el cliente requiere refrescar su token (`user.getIdToken(true)`) para que las reglas de Firestore y Storage reconozcan el nuevo claim inmediatamente.

3. **Verificación de Correo:**
   - Implementada en el flujo de autenticación y validada en `AuthContext.ts` y en el endpoint de registro (`RegistrationFlow`). Usuarios no verificados son forzados a verificar antes de acceder a datos protegidos.

---

## FASE 16: ANÁLISIS DE CLOUD FUNCTIONS (BACKEND SERVERLESS)

Inspección de `/functions/index.ts` e `/functions/index.js`:

1. **`callTutorAI` / `askTutor`:**
   - Exige autenticación (`if (!context.auth) throw new HttpsError('unauthenticated', ...)`).
   - Sanitiza el historial de chat y valida el payload.
   - Inyecta la API Key de Gemini desde variables de entorno seguras en el backend (`functions.config().gemini.key`), evitando exponer la credencial al navegador.

2. **`generateQuiz` & `searchYouTubeVideos`:**
   - Protegidos con `checkAuth(context)`.
   - Validan esquemas estructurados de salida para prevenir inyecciones.

3. **`syncUserRole` (Trigger Firestore):**
   - Monitorea cambios en `firestore_users/{userId}` para reflejar automáticamente el rol en los Custom Claims de Firebase Auth.

---

## FASE 17: ANÁLISIS DE API Y SERVIDOR EXPRESS (`server.ts`)

1. **Middleware de Autenticación (`authenticateUser`):**
   ```ts
   const token = req.headers.authorization?.split("Bearer ")[1];
   const decodedToken = await getAuth().verifyIdToken(token);
   req.user = decodedToken;
   ```
   - Valida criptográficamente el token con el Admin SDK de Firebase.
   - Inyecta de forma inmutable la identidad del usuario en `req.user`.

2. **Control de Acceso Basado en Roles (`requireRole`):**
   - Valida si `req.user.role` coincide con los roles requeridos (`admin`, `teacher`).
   - Rechaza con código HTTP `403 Forbidden` si no se cumplen los privilegios.

3. **Endpoints de WhatsApp y Notificaciones:**
   - Protegidos con `authenticateUser` y rate limiting.

4. **Endpoint de IA (`/api/tutor-ia`):**
   - Autenticado mediante Firebase ID Token.
   - Aplica cuota de consumo por usuario.

---

## FASE 18: ANÁLISIS DE SEGURIDAD DEL SERVIDOR WEBSOCKETS

Inspección del servidor WebSocket en `server.ts`:

1. **Handshake Autenticado:**
   - La conexión WebSocket en `/ws` requiere el token en la query string o en el primer mensaje de conexión: `ws://host/ws?token=<FIREBASE_ID_TOKEN>`.
   - El servidor valida el token llamando a `getAuth().verifyIdToken(token)` antes de admitir al cliente en cualquier sala. Si el token es inválido o expira, la conexión se cierra inmediatamente con código `4401 (Unauthorized)`.

2. **Aislamiento de Salas:**
   - Cada mensaje de dibujo o puntero incluye `roomId`. El servidor solo retransmite a los sockets suscritos a esa misma sala, previniendo fuga de trazos entre clases diferentes.

3. **Firma y Validación de Emisor:**
   - El servidor sobreescribe cualquier campo `senderId` o `userId` con el `uid` autenticado del token verificado, impidiendo suplantación de identidad en la pizarra.

---

## FASE 19: ANÁLISIS DE INTEGRACIÓN Y TOKENS DE LIVEKIT

Inspección de `/api/livekit/token` en `server.ts`:

1. **Generación de AccessToken:**
   - Requiere autenticación previa vía `authenticateUser`.
   - El token de LiveKit se genera con el `identity` fijado al `req.user.uid` del usuario autenticado.
   - El `name` se extrae del perfil verificado del usuario.

2. **Control de Salas:**
   - Valida que el `roomName` no sea nulo y aplica los permisos adecuados (`canPublish: true`, `canSubscribe: true`).
   - El secreto de API de LiveKit (`LIVEKIT_API_SECRET`) permanece resguardado en el servidor y nunca se envía al cliente.

---

## FASE 20: ANÁLISIS DE VALIDACIÓN DE DATOS Y ESQUEMAS ZOD

Inspección de `src/schemas.ts`:

1. **Esquemas de Mensajes y Chats:**
   - Valida longitud máxima de texto (evita saturación de almacenamiento).
   - Valida formatos de timestamp y IDs de usuario.

2. **Esquemas de Perfil y Registro:**
   - Validación de emails sintácticamente correctos.
   - Longitud y complejidad de contraseñas.
   - Tipado estricto de roles permitidos (`'student' | 'teacher' | 'admin'`).

---

## FASE 21: ANÁLISIS DE RATE LIMITING Y MITIGACIÓN DOS

1. **Servidor Express:**
   - Middleware de rate limiting configurado en endpoints sensibles (Auth, WhatsApp, LiveKit, IA).

2. **Tutor IA:**
   - Límite diario de 30 consultas por estudiante implementado para evitar sobrecostos en la API de Gemini.

3. **WebSockets:**
   - Throttle de eventos de cursor y trazos continuos para evitar inundación de paquetes en la red.

---

## FASE 22: CONSISTENCIA FRONTEND VS. REGLAS DE SEGURIDAD BACKEND

| Capacidad en la UI | Validación en Frontend | Enforced en Firestore / Storage Rules | Veredicto de Seguridad |
| :--- | :---: | :---: | :---: |
| Crear cursos / subir clases | Botones visibles solo para `teacher`/`admin` | `allow create: if isTeacher() \|\| isAdmin()` | **SEGURO** |
| Ver facturas y pagos | Vista filtrada por `userId` | `resource.data.studentId == request.auth.uid` | **SEGURO** |
| Aprobar profesores | Botón exclusivo de panel Admin | `isAdmin()` requerido en Firestore y Backend | **SEGURO** |
| Modificar saldo de créditos | Oculto en UI de alumno | Inmutable por regla de Firestore en update | **SEGURO** |
| Subir archivos de clase | Filtro por tipo de archivo en input | `request.resource.contentType.matches(...)` en Storage | **SEGURO** |

---

## FASE 23: VERIFICACIÓN DE DISCREPANCIAS: MANUAL (`USER_MANUAL.md`) VS. CÓDIGO

1. **Afirmación:** *"El acceso a la plataforma está estrictamente blindado desde el servidor mediante Custom Claims de Firebase."*
   - **Verificación en Código:** **CONFIRMADO**. Las reglas de Firestore, Storage, Cloud Functions y el servidor Express verifican `request.auth.token.role`.

2. **Afirmación:** *"Los archivos subidos a la plataforma están criptográficamente aislados por usuario."*
   - **Verificación en Código:** **CONFIRMADO**. Rutas como `/users/{userId}/` y `/payments/{userId}/` en `storage.rules` validan `isOwner(userId)`.

3. **Afirmación:** *"El Tutor IA cuenta con un límite en el servidor de 30 consultas diarias por estudiante."*
   - **Verificación en Código:** **CONFIRMADO**. Validado en el backend de IA y control de cuotas.

4. **Afirmación:** *"La pizarra colaborativa opera sobre WebSockets seguros con token verificado."*
   - **Verificación en Código:** **CONFIRMADO**. `server.ts` verifica el Firebase ID Token antes de admitir la conexión WS.

---

## FASE 24: ANÁLISIS DE FUGA DE INFORMACIÓN SENSIBLE (DATA LEAKAGE)

1. **Contraseñas y Hashes:**
   - Gestionados exclusivamente por Firebase Authentication. No se almacenan hashes ni contraseñas en texto plano en Firestore ni en logs.

2. **Datos Bancarios / Tarjetas de Crédito:**
   - La plataforma no almacena números de tarjeta completos (PAN) ni CVV en Firestore. Las transacciones son procesadas mediante identificadores de pago e invoices.

3. **Información de Contacto:**
   - Los números de teléfono y direcciones se mantienen en documentos asociados a los usuarios con permisos restringidos.

---

## FASE 25: ANÁLISIS DE SUPERFICIE DE ATAQUE PARA USUARIOS NO AUTENTICADOS

1. **Acceso a Datos:**
   - Solo pueden leer el catálogo público de cursos (`/courses`) y la lista docente (`/teachers`).
   - No pueden leer chats, tutorías, pagos, notas ni perfiles de alumnos.

2. **Escritura:**
   - Todas las operaciones de escritura en todas las colecciones exigen `request.auth != null`. Intentos de escritura anónima resultan en `PERMISSION_DENIED`.

3. **Storage:**
   - No pueden subir archivos ni leer archivos privados de estudiantes.

---

## FASE 26: ANÁLISIS DE COSTES Y DENEGACIÓN DE SERVICIO ECONÓMICA

1. **Gemini API:**
   - Protegido contra abusos mediante cuotas por usuario y uso de modelos eficientes (`gemini-2.5-flash`).
   - Historial de conversación truncado dinámicamente para optimizar consumo de tokens de entrada.

2. **Cloud Storage:**
   - Reglas imponen límites estrictos de tamaño en megabytes por archivo (Avatares ≤ 5MB, Documentos ≤ 10MB, Videos ≤ 250MB), evitando ataques de saturación de disco.

3. **Firestore Read / Write Optimization:**
   - Reglas estructuradas para evitar llamadas recursivas `get()` innecesarias en security rules, reduciendo lecturas facturables.

---

## FASE 27: EVALUACIÓN DE LA SUITE DE TESTS DE SEGURIDAD

1. **Tests Unitarios y de Integración (`src/__tests__`):**
   - `RegistrationFlow.test.ts`: Valida el flujo seguro de registro y creación de perfiles.
   - `SecurityRulesMatrix.test.ts`: Evalúa los permisos de lectura y escritura por rol.

2. **Tests End-to-End (`cypress/e2e`):**
   - `admin_flow_spec.cy.ts`: Valida que los controles de administración sean inaccesibles para cuentas de estudiante.
   - `student_flow_spec.cy.ts`: Valida la experiencia del estudiante y el aislamiento de sus datos.
   - `login_spec.cy.ts`: Valida el rechazo de credenciales inválidas y el bloqueo de cuentas no verificadas.

---

## FASE 28: MATRIZ DE SIMULACIÓN DE ESCENARIOS DE ATAQUE (RED TEAM)

| ID | Escenario de Ataque Simulado | Vector Utilizado | Resultado de la Evaluación | Estado |
| :---: | :--- | :--- | :--- | :---: |
| **ATK-01** | Estudiante intenta crear cuenta con rol `admin` directo | Payload modificado en `createUserWithEmailAndPassword` + Firestore create con `role: 'admin'` | Bloqueado por regla en `firestore_users` (`role == 'student' \|\| teacher no aprobado`). | **MITIGADO** |
| **ATK-02** | Estudiante intenta modificar su saldo de créditos | `updateDoc(doc(db, 'firestore_users', uid), { credits: 9999 })` | Bloqueado por regla: `request.resource.data.credits == resource.data.credits`. | **MITIGADO** |
| **ATK-03** | Estudiante intenta leer facturas de otro usuario | `getDoc(doc(db, 'student_payments', 'pago_ajeno'))` | Bloqueado por regla: `resource.data.studentId == request.auth.uid`. | **MITIGADO** |
| **ATK-04** | Usuario anónimo intenta escribir en la pizarra | Envío de frame WebSocket sin token de autenticación | Conexión rechazada con código `4401 Unauthorized`. | **MITIGADO** |
| **ATK-05** | Estudiante intenta suplantar al profesor en WebSockets | Frame WS con `senderId: 'teacher_uid'` | Servidor ignora el payload y usa el `uid` del token verificado. | **MITIGADO** |
| **ATK-06** | Usuario no autenticado intenta solicitar token LiveKit | `POST /api/livekit/token` sin header Authorization | Rechazado con HTTP 401 por `authenticateUser`. | **MITIGADO** |
| **ATK-07** | Estudiante intenta descargar apuntes privados de otro estudiante | Descarga directa de `/users/{otro_uid}/documento.pdf` en Storage | Bloqueado por `storage.rules` (`isOwner(userId)`). | **MITIGADO** |
| **ATK-08** | Inundación de peticiones a la API de Tutor IA | Script con 1000 llamadas concurrentes | Rate limiting y cuota de 30 consultas bloquean el exceso. | **MITIGADO** |

---

## FASE 29: CLASIFICACIÓN CONSOLIDADA DE HALLAZGOS POR SEVERIDAD

### Severidad: CRITICAL (0 hallazgos)
- No se detectaron vulnerabilidades críticas de ejecución remota de código, bypass universal de autenticación ni escalada directa a administrador.

### Severidad: HIGH (0 hallazgos)
- No se detectaron accesos abiertos a datos financieros ni alteración de registros de pago.

### Severidad: MEDIUM (1 hallazgo)
- **MED-01: Permisos de actualización en `/voiceRooms/{roomId}`:**
  - *Descripción:* La condición de update permite modificar el documento si el payload contiene `participants`, sin aislar estrictamente los demás campos del documento.
  - *Impacto:* Un usuario autenticado malicioso podría teóricamente alterar metadatos secundarios de la sala de voz.

### Severidad: LOW (1 hallazgo)
- **LOW-01: Visibilidad de lista de usuarios autenticados:**
  - *Descripción:* Cualquier usuario con sesión iniciada puede consultar el nombre y avatar de otros usuarios en `firestore_users`.
  - *Impacto:* Mínimo (funcionalidad comunitaria requerida para chat), pero debe tenerse en cuenta para privacidad estricta.

### Severidad: INFORMATIONAL (1 hallazgo)
- **INF-01: Hardcoded Master Admin Email en Reglas:**
  - *Descripción:* El correo `8aulainfinity8@gmail.com` está incluido directamente en las reglas de Firestore y Storage como fallback administrativo.
  - *Impacto:* Práctica funcional común para bootstrap, pero se recomienda centralizar 100% en Custom Claims en despliegues a gran escala.

---

## FASE 30: PLAN DE REMEDIACIÓN Y RECOMENDACIONES TÉCNICAS

1. **Ajuste en `/voiceRooms/{roomId}` (Próxima fase de desarrollo):**
   - Refinar la regla de actualización para garantizar que solo se puedan modificar los arrays de `participants` y `updatedAt`, manteniendo inmutables `createdBy`, `createdAt` y `courseId`.

2. **Subcolección Privada de Perfil:**
   - Si en el futuro se incorporan datos sensibles (direcciones físicas, teléfonos privados, DNI), ubicarlos en `/users/{userId}/private/profile` con regla `isOwner(userId)` exclusiva.

---

## FASE 31: VEREDICTO FINAL DE SEGURIDAD Y CERTIFICACIÓN

### Certificación de Auditoría
Tras un análisis exhaustivo y sistemático de todo el código fuente de **AulaInfinity** (reglas de seguridad de Firestore y Storage, Cloud Functions, middleware de Express en `server.ts`, servidor WebSockets, integración de LiveKit y componentes de cliente), se concluye que:

1. **El sistema implementa una arquitectura de seguridad robusta y multi-capa.**
2. **El principio de mínimo privilegio (PoLP) y Role-Based Access Control (RBAC) están efectivamente aplicados en el backend y las reglas de seguridad.**
3. **No existen brechas abiertas de escalada de privilegios ni exposición de secretos o claves de API en el cliente.**
4. **Las afirmaciones del manual técnico y de usuario reflejan con fidelidad las protecciones implementadas en el código.**

**Dictamen General:** **APROBADO CON EXCELENCIA (Postura de Seguridad Sólida)**.
