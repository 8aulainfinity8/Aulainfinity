# SECURITY_PHASE_1_5_REPORT.md — INFORME DE SEGURIDAD Y VALIDACIÓN (FASE 1.5)

---

### 1. Archivos Modificados
- `firestore.rules`
- `storage.rules`

---

### 2. Reglas Modificadas
- **`firestore.rules` (`voiceRooms/{id}`):**
  - Se eliminó la autorización derivada del campo enviado por el cliente (`"participants" in request.resource.data`).
  - Se eliminó la wildcard genérica `match /{allSubcollections=**}` bajo `voiceRooms/{id}`.
  - Se estableció autorización por identidad (creador `createdBy`, docente asignado `teacherId`, rol docente o ID de sala/curso correspondiente al UID del usuario).
  - Se impuso la inmutabilidad de campos estructurales (`createdBy`, `createdAt`, `courseId`, `teacherId`, `roomId`).
- **`storage.rules` (`chat_attachments/{conversationId}/{fileName}`):**
  - Se eliminó `allow write: if isSignedIn() && maxFileSize(20)` global.
  - Se condicionó el permiso de escritura (`allow write`) a los participantes autorizados en la conversación manteniendo el límite estricto de 20 MB.
- **`storage.rules` (`recordings/{courseOrUserId}/{fileName}` y `recordings/{fileName}`):**
  - Se restringió la lectura para evitar que `Student A` descargue grabaciones o materiales privados pertenecientes a `Student B`.

---

### 3. Subcolecciones Reales Encontradas
- **`voiceRooms`:** NINGUNA.
  - Se inspeccionó todo el proyecto (`VoiceGroupCall.tsx`, `useVoiceCall.ts`, `StudentChatPage.tsx`, `firestoreSync.ts`).
  - No existen subcolecciones hijas bajo `voiceRooms/{roomId}` en el código fuente.
  - La wildcard `match /{allSubcollections=**}` fue eliminada.

---

### 4. Rutas Storage Reales Encontradas
1. `/users/{userId}/avatars/{fileName}` (Avatares de usuario)
2. `/course_materials/{courseId}/{fileName}` (Materiales de cursos)
3. `/chat_attachments/{conversationId}/{fileName}` (Archivos adjuntos en conversaciones)
4. `/videos/{allPaths=**}` (Vídeos de cursos subidos por docentes)
5. `/recordings/{courseOrUserId}/{fileName}` (Grabaciones de clases/pizarras por curso o usuario — Formato Actual)
6. `/recordings/{fileName}` (Formato Legacy de grabaciones)

---

### 5. VoiceRoom Authorization
- **Mecanismo de Autorización:**
  - `create`: Creador legítimo (`request.resource.data.createdBy == request.auth.uid`), docente o administrador.
  - `update`: Requiere que el usuario sea administrador, docente, creador (`resource.data.createdBy == request.auth.uid`), docente asignado (`resource.data.teacherId == request.auth.uid`) o participante cuyo UID concuerda con la conversación/curso (`id == request.auth.uid` o subcadena UID).
  - `update` no permite la alteración de campos estructurales: `createdBy`, `createdAt`, `courseId`, `teacherId` y `roomId` son inmutables.
  - Se eliminó expresamente la vulnerabilidad que permitía a un estudiante no autorizado modificar la sala simplemente agregando el campo `participants` a la petición.

---

### 6. ClassRecordings Authorization
- **Comportamiento en `classRecordings` (Firestore):**
  - `isAdmin()`: Acceso administrativo total.
  - `isTeacher()`: **Decisión Funcional:** Los profesores tienen acceso global a las grabaciones de clases en `classRecordings` para fines de gestión académica, revisión docente y control de calidad educativo de Aula Infinity.
  - `Estudiantes`: Tienen lectura únicamente en grabaciones de sus cursos matriculados o grabaciones privadas donde su UID está codificado en `courseId`, `studentId` o `participants`.

---

### 7. Recording Authorization
- **Comportamiento en Storage (`/recordings/...`):**
  - Formato Actual (`/recordings/{courseOrUserId}/{fileName}`): Exige que el usuario sea docente/admin o que su UID concuerde con la carpeta o archivo del usuario.
  - Formato Legacy (`/recordings/{fileName}`): Exige que el UID del usuario concuerde con la estructura del archivo o que sea docente/admin.
  - `Student A` intentando leer grabaciones privadas de `Student B`: **DENEGADO**.

---

### 8. Chat Attachment Authorization
- **Comportamiento en Storage (`/chat_attachments/{conversationId}/{fileName}`):**
  - **Read:** Permitido solo si el usuario es Admin, Teacher o si el `conversationId` contiene o concuerda con `request.auth.uid` (o es un canal general de curso público).
  - **Write:** Permitido solo si el usuario es Admin, Teacher o participante directo de la conversación, respetando el límite estricto de **20 MB**.
  - `Student C` intentando subir o descargar adjuntos de la conversación entre `Student A` y `Student B`: **DENEGADO**.

---

### 9. Tests
Resultados de la suite automatizada (`npm test -- --run` con Vitest):
- `src/__tests__/RegistrationFlow.test.ts` (4 tests) — **PASS**
- `src/__tests__/SecurityRulesMatrix.test.ts` (13 tests) — **PASS**
- `src/__tests__/PasswordCriteriaItem.test.tsx` (2 tests) — **PASS**
- TypeScript Type Check (`tsc --noEmit`) — **0 ERRORES**
- Production Build (`npm run build`) — **EXITOSO**

---

### 10. Emulator Status
> **NO VERIFICADO MEDIANTE FIREBASE EMULATOR.**
> 
> No se dispone de instancia ejecutándose de Firebase Local Emulator Suite en el contenedor. La validación de Security Rules se ha realizado mediante análisis formal estático del árbol AST de reglas y verificación del flujo de tipos de Firestore/Storage SDK.
>
> **Resultados esperados por diseño del AST:**
> - **T01:** Student A → update voiceRoom de Teacher B: **EXPECTED DENIED**
> - **T02:** Student A → update voiceRoom propia: **EXPECTED ALLOWED**
> - **T03:** Student A → update voiceRoom añadiendo participants sin ser parte de la sala/curso: **EXPECTED DENIED**
> - **T04:** Student A → cambiar createdBy en voiceRoom: **EXPECTED DENIED**
> - **T05:** Student A → cambiar teacherId en voiceRoom: **EXPECTED DENIED**
> - **T06:** Student A → escribir en subcolección de room ajena: **EXPECTED DENIED** (Wildcard eliminada)
> - **T07:** Teacher A → recording Teacher B: **EXPECTED ALLOWED** (Decisión funcional docente)
> - **T08:** Student A → recording privado de Student B: **EXPECTED DENIED**
> - **T09:** Student C → attachment conversación A-B: **EXPECTED DENIED**
> - **T10:** Student A → attachment conversación propia: **EXPECTED ALLOWED**

---

### 11. Coste Firebase
- **Consultas Adicionales:** 0
- **Cloud Functions Adicionales:** 0
- **Listeners / Polling Adicionales:** 0
- **Costo operacional:** **IDÉNTICO ($0 incremental)**.

---

### 12. Riesgos Residuales
1. **Autenticación sin Email Verificado:** Las reglas que evalúan `isSignedIn()` dependen de `request.auth != null`. Si un usuario no verifica su email en Auth, podrá ejecutar lecturas donde `isSignedIn()` sea la única exigencia.
2. **Atribución de Master Admin en Reglas:** Persiste la verificación por correo estático (`8aulainfinity8@gmail.com`) en lugar de depender únicamente de Custom Claims en JWT.

---

### 13. Qué Queda para la Fase 2
1. Refuerzo de `email_verified` en el helper `isSignedIn()`.
2. Migración completa de roles y Master Admin a Custom Claims centralizados.
3. Actualización de `syncUserRole` para preservar claims preexistentes (`existingClaims`).
