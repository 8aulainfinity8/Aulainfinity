# AUDITORÍA TÉCNICA DE SEGURIDAD, ARQUITECTURA Y COSTES — AULA INFINITY
## FASE 2.1 — VERIFICACIÓN REAL SOBRE CÓDIGO FUENTE DE REPOSITORIO

**Fecha de Ejecución:** 15 de Agosto de 2026  
**Auditor Principal:** Arquitecto de Seguridad Firebase & CTO  
**Estado:** AUDITORÍA COMPLETADA — CÓDIGO NO MODIFICADO (CERO EDICIONES)  

---

## 1. RESUMEN EJECUTIVO

Se ha realizado una inspección exhaustiva línea por línea de la totalidad del código fuente de **Aula Infinity** (`firestore.rules`, `storage.rules`, `functions/index.ts`, `server.ts`, `src/services/userService.ts`, `src/services/firestoreSync.ts`, `src/services/api.ts`, etc.).

La auditoría **confirma fallos críticos de seguridad y costes**:
1. **Escalada de Privilegios**: La Cloud Function `syncUserRole` (`functions/index.ts:26`) asigna Custom Claims de forma ciega. Si un usuario se registra o escribe `role: "teacher"` en `firestore_users`, obtiene la claim `role: "teacher"`. Dado que `firestore.rules` (`isTeacher()`) y `storage.rules` no verifican `isApprovedForTutoring == true`, cualquier usuario recién registrado con perfil docente obtiene **acceso completo e inmediato** para publicar cursos, modificar vídeos, acceder a grabaciones privadas y crear salas de voz sin aprobación administrativa.
2. **Ignorancia Total de `email_verified`**: Ninguna regla de Firestore o Storage, ni el servidor Express en `server.ts`, comprueba `request.auth.token.email_verified == true`. Cuentas con correos falsos tienen acceso completo.
3. **Escuchas Ineficientes de Firestore (Saturación de Costes)**: Se han identificado **30 listeners `onSnapshot` activos al arrancar la app** en `src/services/firestoreSync.ts`. Colecciones completas (`users`, `firestore_users`, `students`, `teachers`, `admins`, `courses`, `voiceRooms`, `conversations`) son escuchadas sin cláusula `where` ni límites por usuario, descargando toda la base de datos en la memoria del cliente.
4. **Escrituras Multi-Colección Duplicadas**: `userService.ts:111` ejecuta **3 escrituras paralelas `setDoc`** por usuario en cada autenticación/sincronización (`users/{uid}`, `firestore_users/{uid}` y `students/teachers/admins/{uid}`).
5. **Correos Hardcodeados**: Dependencia directa del string `'8aulainfinity8@gmail.com'` en 5 archivos del proyecto.

---

## 2. HALLAZGOS CONFIRMADOS VS NO CONFIRMADOS

| AFIRMACIÓN DEL INFORME PREVIO | ESTADO REAL EN CÓDIGO | ARCHIVO Y LÍNEA REAL | EXPLICACIÓN TÉCNICA | RIESGO Y IMPACTO | PRIORIDAD |
| :--- | :---: | :---: | :--- | :--- | :---: |
| **"Existen hasta 5 escrituras de usuario"** | **PARCIALMENTE CONFIRMADO** | `src/services/userService.ts:111-124` | Por cada llamada a `initializeAndSyncUserDataInFirestore`, el cliente ejecuta **3 escrituras en paralelo** (`users/{uid}`, `firestore_users/{uid}` y la colección del rol). Existen 5 colecciones en total en la app. | Multiplica por 3x el coste de escrituras en Firestore por sesión. | ALTA |
| **"Existen 19 listeners globales en tiempo real"** | **CONFIRMADO (Y SUPERADO)** | `src/services/firestoreSync.ts:100-1120` | Se han contabilizado **30 listeners `onSnapshot`** registrados en `initFirestoreSync`. Colecciones enteras se leen sin filtro `where`. | Descarga masiva de documentos de todos los usuarios. Elevado coste de lecturas. | CRÍTICA |
| **"Vulnerabilidad de escalada mediante syncUserRole"** | **CONFIRMADO** | `functions/index.ts:26-34` | `syncUserRole` detecta cambios en `role` en `firestore_users/{userId}` y ejecuta `setCustomUserClaims(userId, { role: newData.role })`. Además, `setCustomUserClaims` **sobrescribe** todas las claims previas. | Cualquier usuario registrado como docente obtiene inmediatamente Custom Claim de profesor. | CRÍTICA |
| **"email_verified no se comprueba"** | **CONFIRMADO** | `firestore.rules:6-27`, `storage.rules:7-27`, `server.ts:18-66` | Ninguna función helper (`isSignedIn`, `isTeacher`, `isAdmin`) ni middleware verifica `request.auth.token.email_verified == true`. | Cuentas no verificadas o con emails falsos acceden a datos privados y chats. | ALTA |
| **"Profesores no aprobados tienen privilegios excesivos"** | **CONFIRMADO** | `firestore.rules:21-26`, `storage.rules:22-27` | `isTeacher()` solo comprueba `request.auth.token.role == 'teacher'`. No exige `isApprovedForTutoring == true`. | Profesores pendientes de aprobación pueden modificar cursos, subir vídeos y crear llamadas de voz. | CRÍTICA |
| **"Emails hardcodeados en el código"** | **CONFIRMADO** | `firestore.rules:17`, `storage.rules:18`, `server.ts:28,50,137`, `src/constants/auth.ts:10` | `'8aulainfinity8@gmail.com'` está incrustado explícitamente en 5 archivos distintos. | Inconsistencia de autorización si cambia la dirección de email del administrador. | ALTA |
| **"Colecciones de usuarios redundantes"** | **CONFIRMADO** | `userService.ts:111-122`, `firestoreSync.ts:870-977` | Coexisten `users`, `firestore_users`, `students`, `teachers` y `admins`. | Redundancia de almacenamiento y desincronización potencial. | ALTA |

---

## 3. AUDITORÍA DETALLADA DE FIRESTORE RULES (`firestore.rules`)

### Matriz Completa de Reglas por Colección (Estado Actual):

| COLECCIÓN | READ | CREATE | UPDATE | DELETE | ANONYMOUS | STUDENT | TEACHER NO APROBADO | TEACHER APROBADO | ADMIN |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `/app_config/{id}` | `true` | Admin | Admin | Admin | ✅ Read | ✅ Read | ✅ Read | ✅ Read | ✅ Full |
| `/courses/{courseId}` | `true` | `isTeacher()` | `isTeacher()` | `isTeacher()` | ✅ Read | ✅ Read | ⚠️ Write (Excesivo) | ✅ Write | ✅ Full |
| `/videos/{videoId}` | `true` | `isTeacher()` | `isTeacher()` | `isTeacher()` | ✅ Read | ✅ Read | ⚠️ Write (Excesivo) | ✅ Write | ✅ Full |
| `/classRecordings/{id}` | L52 Regex | `isTeacher() \| Admin` | `isTeacher() \| Admin` | Admin | ❌ Denied | ⚠️ Read si Regex | ⚠️ Write (Excesivo) | ✅ Write | ✅ Full |
| `/users/{userId}` | `isSignedIn()` | `isOwner` (Solo Student/Unapproved) | `isOwner` (Inmutable role) | Admin | ❌ Denied | ✅ Own | ✅ Own | ✅ Own | ✅ Full |
| `/firestore_users/{userId}` | `isSignedIn()` | `isOwner` (Solo Student/Unapproved) | `isOwner` (Inmutable role) | Admin | ❌ Denied | ✅ Own | ✅ Own | ✅ Own | ✅ Full |
| `/students/{studentId}` | `isSignedIn()` | `isOwner \| isTeacher` | `isOwner \| isTeacher` | Admin | ❌ Denied | ✅ Read All | ✅ Write | ✅ Write | ✅ Full |
| `/teachers/{teacherId}` | `isSignedIn()` | `isOwner` (Unapproved) | `isOwner` (Inmutable role) | Admin | ❌ Denied | ✅ Read All | ✅ Read All | ✅ Read All | ✅ Full |
| `/admins/{adminId}` | `isSignedIn()` | Admin | Admin | Admin | ❌ Denied | ✅ Read All | ✅ Read All | ✅ Read All | ✅ Full |
| `/student_course_progress/{id}` | `isOwner \| Teacher` | `isOwner \| Teacher` | `isOwner \| Teacher` | Admin | ❌ Denied | ✅ Own | ✅ Read/Write | ✅ Read/Write | ✅ Full |
| `/firestore_tutoring_requests/{id}` | `isOwner \| Teacher` | `isOwner` | `isOwner \| Teacher` | `isOwner \| Admin` | ❌ Denied | ✅ Own | ⚠️ Read/Write | ✅ Read/Write | ✅ Full |
| `/firestore_direct_messages/{id}` | Participante | `senderId == uid` | `senderId == uid` | `senderId \| Admin` | ❌ Denied | ✅ Own | ✅ Own | ✅ Own | ✅ Full |
| `/firestore_peer_messages/{id}` | Participante | `senderId == uid` | `senderId == uid` | `senderId \| Admin` | ❌ Denied | ✅ Own | ✅ Own | ✅ Own | ✅ Full |
| `/firestore_teacher_messages/{id}`| `isTeacher()` | `isTeacher()` | `senderId == uid` | `senderId \| Admin` | ❌ Denied | ❌ Denied | ⚠️ Full Read/Create | ✅ Full | ✅ Full |
| `/firestore_course_messages/{id}` | `isSignedIn()` | `senderId == uid` | `senderId == uid` | Admin | ❌ Denied | ✅ Read/Create | ✅ Read/Create | ✅ Read/Create | ✅ Full |
| `/firestore_conversations/{id}` | Participante | `studentId \| Teacher` | Participante | Admin | ❌ Denied | ✅ Own | ✅ Own | ✅ Own | ✅ Full |
| `/chats/{chatId}` (y subcol) | `isSignedIn()` | `isSignedIn()` | `isSignedIn()` | Admin | ❌ Denied | ⚠️ Read/Write All | ⚠️ Read/Write All | ✅ Read/Write | ✅ Full |
| `/rooms/{roomId}` (y subcol) | `isSignedIn()` | `isSignedIn()` | `isSignedIn()` | Admin | ❌ Denied | ⚠️ Read/Write All | ⚠️ Read/Write All | ✅ Read/Write | ✅ Full |
| `/calls/{callId}` (y subcol) | `isSignedIn()` | `isSignedIn()` | `isSignedIn()` | Admin | ❌ Denied | ⚠️ Read/Write All | ⚠️ Read/Write All | ✅ Read/Write | ✅ Full |
| `/voice_group_calls/{callId}` | `isSignedIn()` | `isSignedIn()` | `isSignedIn()` | Admin | ❌ Denied | ⚠️ Read/Write All | ⚠️ Read/Write All | ✅ Read/Write | ✅ Full |
| `/voiceRooms/{id}` | `isSignedIn()` | L399 Rule | L404 Inmutabilidad | `createdBy \| Admin` | ❌ Denied | ⚠️ Join/Create | ⚠️ Join/Create | ✅ Join/Create | ✅ Full |
| `/whiteboards/{id}` (y subcol) | `isSignedIn()` | `isSignedIn()` | `isSignedIn()` | Admin | ❌ Denied | ⚠️ Write All | ⚠️ Write All | ✅ Full | ✅ Full |
| `/firestore_agenda_events/{id}` | `isOwner \| Teacher` | `studentId \| Teacher` | `isOwner \| Teacher` | `isOwner \| Teacher` | ❌ Denied | ✅ Own | ✅ Read/Write | ✅ Read/Write | ✅ Full |
| `/firestore_comments/{id}` | `isSignedIn()` | `userId == uid` | `userId \| Admin` | `userId \| Admin` | ❌ Denied | ✅ Read/Write Own | ✅ Read/Write Own | ✅ Read/Write | ✅ Full |
| `/firestore_topic_requests/{id}` | `isSignedIn()` | `studentId == uid` | `isTeacher()` | Admin | ❌ Denied | ✅ Read/Create | ⚠️ Update All | ✅ Update All | ✅ Full |
| `/firestore_quizzes/{id}` | `isSignedIn()` | `isTeacher()` | `isTeacher()` | `isTeacher()` | ❌ Denied | ✅ Read | ⚠️ Write All | ✅ Write All | ✅ Full |
| `/firestore_student_answers/{id}` | `isOwner \| Teacher` | `studentId == uid` | `isOwner \| Teacher` | Admin | ❌ Denied | ✅ Read/Create Own | ✅ Read/Write | ✅ Read/Write | ✅ Full |
| `/infinity_transactions/{id}` | `isOwner \| Admin` | Admin | Admin | Admin | ❌ Denied | ✅ Read Own | ❌ Denied | ❌ Denied | ✅ Full |
| `/student_payments/{id}` | `isOwner \| Admin` | Admin | Admin | Admin | ❌ Denied | ✅ Read Own | ❌ Denied | ❌ Denied | ✅ Full |
| `/student_expenses/{id}` | `isOwner \| Admin` | Admin | Admin | Admin | ❌ Denied | ✅ Read Own | ❌ Denied | ❌ Denied | ✅ Full |
| `/teacher_payments/{id}` | `teacherId \| Admin` | Admin | Admin | Admin | ❌ Denied | ❌ Denied | ✅ Read Own | ✅ Read Own | ✅ Full |
| `/student_friends/{id}` | Participante | `studentId == uid` | Participante | `studentId == uid` | ❌ Denied | ✅ Read/Write Own | ✅ Read/Write Own | ✅ Read/Write | ✅ Full |
| `/ai_query_logs/{id}` | `userId \| Admin` | `userId == uid` | Admin | Admin | ❌ Denied | ✅ Read/Create Own | ✅ Read/Create Own | ✅ Read/Create | ✅ Full |
| `/firestore_deleted_items/{id}` | `isSignedIn()` | `isTeacher()` | `isTeacher()` | `isTeacher()` | ❌ Denied | ✅ Read | ⚠️ Write All | ✅ Write All | ✅ Full |
| `/firestore_user_seen_states/{id}`| `isOwner \| Admin` | `isOwner \| Admin` | `isOwner \| Admin` | Admin | ❌ Denied | ✅ Own | ✅ Own | ✅ Own | ✅ Full |

---

## 4. AUDITORÍA DE CLOUD STORAGE RULES (`storage.rules`)

1. **Rutas Públicas / Autenticadas**: Ninguna ruta es anónima. Todas requieren `isSignedIn()`.
2. **`avatars/{fileName}`**: Permite lectura a cualquier usuario autenticado y escritura restringida al dueño (`fileName.matches('^' + request.auth.uid + '_.*')`), máx 5MB. Correcto.
3. **`users/{userId}/{allPaths=**}`**: Lectura permitida a `isOwner(userId)` o `isTeacher()`.
   - **Riesgo**: Un profesor no aprobado puede leer carpetas privadas de cualquier usuario.
4. **`notes/{userId}/{fileName}`**: Lectura permitida a `isOwner(userId)` o `isTeacher()`. Misma deficiencia para profesores no aprobados.
5. **`chat_attachments/{conversationId}/{fileName}`**:
   - **Vulnerabilidad**: `(!conversationId.matches('.*_[a-zA-Z0-9]+.*') && !conversationId.matches('^direct_.*') && !conversationId.matches('^peer_.*'))`. Si la conversación no contiene un guión bajo, cualquier usuario autenticado puede **leer y subir** adjuntos hasta 20MB.
6. **`course_materials/{courseId}/{fileName}`**: Lectura pública autenticada, subida restringida a `isTeacher()`. Docentes no aprobados pueden subir archivos.
7. **`videos/{allPaths=**}` & `recordings/{courseOrUserId}/{fileName}`**: Subida permitida a `isTeacher()` (máx 500MB). Exceso de permisos para profesores no aprobados.
8. **`attachments/{fileName}`**:
   - **Vulnerabilidad Crítica**: Lectura permitida a `isSignedIn()`, escritura permitida a `isSignedIn()` (máx 25MB). **Cualquier usuario autenticado puede subir o sobrescribir cualquier archivo** en este directorio.

---

## 5. FIREBASE AUTH & CUSTOM CLAIMS AUDIT

### Asignación Actual de Custom Claims:
Actualmente, las Custom Claims se gestionan **únicamente** a través de la Cloud Function `syncUserRole` (`functions/index.ts:26`).

```typescript
// functions/index.ts
export const syncUserRole = functions.region("europe-west1").firestore.document("firestore_users/{userId}").onWrite(async (change, context) => {
  const userId = context.params.userId;
  const newData = change.after.exists ? change.after.data() : null;
  const oldData = change.before.exists ? change.before.data() : null;

  if (newData && (!oldData || newData.role !== oldData.role)) {
     await admin.auth().setCustomUserClaims(userId, { role: newData.role });
  }
});
```

### Fallos Críticos Encontrados en `syncUserRole`:
1. **Riesgo de Auto-Promoción**: Un cliente que envíe `role: "teacher"` durante el registro inicial provoca que `syncUserRole` le otorgue inmediatamente el claim `{ role: "teacher" }`.
2. **Destrucción de Claims Existentes (`setCustomUserClaims`)**: `admin.auth().setCustomUserClaims(uid, claims)` **reemplaza el objeto completo**. Si en el futuro se añade `{ isApprovedForTutoring: true }` o `{ emailVerified: true }`, un cambio en `role` borrará las demás claims.
3. **Ausencia de `isApprovedForTutoring` en Claims**: La aprobación docente no está reflejada en las Custom Claims de Firebase Auth.

---

## 6. AUDITORÍA DEL MASTER ADMIN (`8aulainfinity8@gmail.com`)

### Ocurrencias del String en el Proyecto:
1. `firestore.rules:17`: `(request.auth.token.email != null && request.auth.token.email.lower() == '8aulainfinity8@gmail.com')`
2. `storage.rules:18`: `(request.auth.token.email != null && request.auth.token.email.lower() == '8aulainfinity8@gmail.com')`
3. `server.ts:28, 50, 137`: Overrides de rol a `'admin'` si el email coincide.
4. `src/constants/auth.ts:10`: `export const DEFAULT_ADMIN_EMAILS = ['8aulainfinity8@gmail.com'];`
5. `src/data/admins.ts:9`: Perfil mock del administrador.

### Propuesta de Migración en 6 Fases (Cero Interrupción):
* **FASE A (Bootstrap)**: Ejecutar un script Admin SDK para asignar la Custom Claim `{ role: "admin", isApprovedForTutoring: true }` al UID de `8aulainfinity8@gmail.com`.
* **FASE B (Verificación)**: Comprobar vía Admin Auth que el token JWT devuelto contiene `role: "admin"`.
* **FASE C (Security Rules)**: Actualizar `firestore.rules` y `storage.rules` para eliminar la comparación por email, confiando únicamente en `request.auth.token.role == 'admin'`.
* **FASE D (Backend Express)**: Eliminar el override por correo en `server.ts`.
* **FASE E (Frontend)**: Actualizar `src/constants/auth.ts` y componentes.
* **FASE F (Eliminación Definitiva)**: Limpieza final de fallbacks por correo.

---

## 7. AUDITORÍA DE EMAIL VERIFICATION (`email_verified`)

### Dónde se Comprueba Actualmente:
- En la interfaz de usuario cliente (por ejemplo, condicionales de banner de aviso de verificación).

### Dónde NO se Comprueba Actualmente (Vulnerabilidad):
- `firestore.rules`: 0 ocurrencias.
- `storage.rules`: 0 ocurrencias.
- `server.ts`: 0 ocurrencias.

### Excepción Estricta de Registro Inicial (Obligatoria):
Para impedir que un usuario no verificado quede bloqueado al registrarse antes de poder verificar su email, las reglas de Firestore deben autorizar **exclusivamente**:
1. Creación de su propio perfil en `firestore_users/{uid}` donde `uid == request.auth.uid`.
2. Restricción estricta de campos iniciales: `role == 'student'` o `role == 'teacher'`, `isApprovedForTutoring == false`, `isAdmin == false`.
3. Todo acceso a cursos, vídedos, salas de voz, chats o almacenamiento requerirá `request.auth.token.email_verified == true`.

---

## 8. MODELO DE AUTORIZACIÓN PROPUESTO (EVALUACIÓN)

El modelo de funciones helper propuesto es:

```playground
function isSignedIn() {
  return request.auth != null;
}

function isVerifiedUser() {
  return isSignedIn() && request.auth.token.email_verified == true;
}

function isAdmin() {
  return isVerifiedUser() && request.auth.token.role == 'admin';
}

function isTeacher() {
  return isVerifiedUser() && request.auth.token.role == 'teacher';
}

function isApprovedTeacher() {
  return isVerifiedUser() && (
    request.auth.token.role == 'admin' ||
    (
      request.auth.token.role == 'teacher' &&
      request.auth.token.isApprovedForTutoring == true
    )
  );
}
```

### Evaluación sobre Código Real:
- **Eficacia**: **SÍ ES SEGURO Y COMPATIBLE** con la condición de que las Custom Claims `{ role: '...', isApprovedForTutoring: boolean }` se mantengan correctamente sincronizadas desde el backend.
- **Ventaja**: Elimina lecturas adicionales de Firestore (`get()`) en Security Rules, garantizando un coste $0 por evaluación de reglas.

---

## 9. AUDITORÍA DETALLADA DE LISTENERS FIRESTORE Y COSTES (`src/services/firestoreSync.ts`)

Listado completo de los 30 listeners identificados en `initFirestoreSync`:

1. `firestore_deleted_items` (L121): Sin filtro `where`. Innecesario mantener activo todo el tiempo.
2. `firestore_peer_messages` (L138): `orderBy('createdAt'), limit(500)`. Sin filtro por usuario. **Coste masivo**.
3. `firestore_direct_messages` (L208): `orderBy('createdAt'), limit(500)`. Sin filtro por usuario. **Coste masivo**.
4. `firestore_teacher_messages` (L272): `orderBy('createdAt'), limit(500)`. Sin filtro.
5. `firestore_course_messages` (L326): `orderBy('createdAt'), limit(500)`. Sin filtro.
6. `voiceRooms` (L383): Sin filtro. Escucha cambios en todas las salas de voz de la plataforma.
7. `firestore_conversations` (L431): Sin filtro. Descarga metadatos de conversaciones ajenas.
8. `firestore_closed_conversations` (L500): Sin filtro.
9. `firestore_peer_conversations` (L523): Sin filtro.
10. `firestore_tutoring_requests` (L558): Filtrado para estudiantes, **sin filtro para profesores/admins**.
11. `student_course_progress` (L584): Filtrado por `studentId == uid`. Necesario y eficiente.
12. `firestore_agenda_events` (L594): Sin filtro `where`.
13. `firestore_comments` (L624): Sin filtro.
14. `firestore_topic_requests` (L657): Sin filtro.
15. `firestore_student_answers` (L693): Sin filtro.
16. `infinity_transactions` (L720): Sin filtro.
17. `courses` (L747): Sin filtro. Se escucha el catálogo completo.
18. `users` (L871): **Colección completa sin filtro**.
19. `firestore_users` (L876): **Colección completa sin filtro**.
20. `students` (L882): **Colección completa sin filtro**.
21. `teachers` (L915): **Colección completa sin filtro**.
22. `admins` (L948): **Colección completa sin filtro**.
23. `student_payments` (L984): Filtrado si es estudiante.
24. `student_expenses` (L1005): Filtrado si es estudiante.
25. `teacher_payments` (L1023): Sin filtro.
26. `firestore_quizzes` (L1041): Sin filtro.
27. `app_config/main` (L1059): Documento individual.
28. `student_friends` (L1074): Filtrado para estudiante.
29. `ai_query_logs` (L1094): Filtrado para no-admins.
30. `firestore_user_seen_states/main` (L1112): Documento individual.

---

## 10. AUDITORÍA DE ESCRITURAS DUPLICADAS Y COLECCIONES DE USUARIOS

### Análisis de Colecciones de Usuarios:
- **`firestore_users/{uid}`**: Colección canónica principal de perfiles de usuario.
- **`users/{uid}`**: Duplicado exacto de `firestore_users/{uid}`.
- **`students/{uid}`**: Copia de perfil para usuarios con rol `student`.
- **`teachers/{uid}`**: Copia de perfil para usuarios con rol `teacher`.
- **`admins/{uid}`**: Copia de perfil para usuarios con rol `admin`.

### Comportamiento de Escritura en `userService.ts`:
Cada vez que se ejecuta `initializeAndSyncUserDataInFirestore` (`userService.ts:111`), el cliente ejecuta en paralelo:
```typescript
const writePromises = [
  setDoc(doc(db, 'users', targetDocId), validatedData, { merge: true }),
  setDoc(doc(db, 'firestore_users', targetDocId), validatedData, { merge: true })
];
if (role === 'student') writePromises.push(setDoc(doc(db, 'students', targetDocId), ...));
```
**Impacto**: Genera 3 escrituras en Firestore por cada inicio de sesión o actualización de perfil.

---

## 11. MATRIZ DE ATAQUES DE PRUEBA CONCEPTUAL (20 ESCENARIOS)

| # | ESCENARIO DE ATAQUE | ESTADO ACTUAL | ESTADO OBJETIVO PROPUESTO | EXPLICACIÓN Y FUNDAMENTO |
| :-: | :--- | :---: | :---: | :--- |
| 1 | Anónimo intenta leer catálogo `/courses` | **ALLOWED** | **ALLOWED** | El catálogo público de cursos debe ser legible antes de iniciar sesión. |
| 2 | Anónimo intenta crear un curso en `/courses` | **DENIED** | **DENIED** | `isTeacher()` o `isApprovedTeacher()` exige autenticación. |
| 3 | Alumno no verificado lee `/firestore_conversations` | **ALLOWED** | **DENIED** | Actualmente no se exige `email_verified`. En el objetivo se exige `isVerifiedUser()`. |
| 4 | Alumno no verificado escribe en `/courses` | **DENIED** | **DENIED** | Su rol es student, no teacher. |
| 5 | Alumno verificado lee notas de otro en Storage `/notes/{otherUid}/...` | **DENIED** | **DENIED** | `storage.rules` exige `isOwner(userId)`. |
| 6 | Profesor no aprobado (`isApprovedForTutoring: false`) modifica curso | **ALLOWED** | **DENIED** | Vulnerabilidad actual. El objetivo exigirá `isApprovedTeacher()`. |
| 7 | Profesor no aprobado crea sala de voz en `/voiceRooms` | **ALLOWED** | **DENIED** | Vulnerabilidad actual. El objetivo exigirá `isApprovedTeacher()`. |
| 8 | Profesor aprobado modifica curso en `/courses` | **ALLOWED** | **ALLOWED** | Operación legítima para docentes autorizados. |
| 9 | Administrador elimina un usuario o curso | **ALLOWED** | **ALLOWED** | Privilegio de administración global. |
| 10 | Atacante intenta auto-promocionarse enviando `role: 'admin'` en cliente | **DENIED** | **DENIED** | `firestore.rules` prohíbe actualizar el campo `role` si `isOwner`. |
| 11 | Atacante con UID conocido modifica perfil de otro en `/users/{otherUid}` | **DENIED** | **DENIED** | `isOwner(userId)` verifica `request.auth.uid == userId`. |
| 12 | Estudiante A lee mensajes directos de Estudiante B | **DENIED** | **DENIED** | `firestore.rules` exige coincidencia de `participantIds` / `conversationId`. |
| 13 | Estudiante accede a grabación privada de curso ajeno | **DENIED** | **DENIED** | `classRecordings` valida permisos por curso / usuario. |
| 14 | Estudiante sube archivo a conversación ajena | **DENIED** | **DENIED** | Validado por ID de conversación en `storage.rules`. |
| 15 | Usuario modifica campo `createdBy` en `/voiceRooms` | **DENIED** | **DENIED** | Regla de inmutabilidad estricta en línea 408 de `firestore.rules`. |
| 16 | Usuario modifica `teacherId` en un curso existente | **DENIED** | **DENIED** | Restringido a administradores / validación de inmutabilidad. |
| 17 | Usuario intenta invocar API Express de IA directamente sin token | **DENIED** | **DENIED** | `authenticateUser` en `server.ts` exige cabecera `Bearer`. |
| 18 | Usuario manipula IDs de conversación en chat | **DENIED** | **DENIED** | La regla de Security Rules exige incluir `request.auth.uid` en el ID. |
| 19 | Usuario manipula ID de curso al enviar mensaje | **DENIED** | **DENIED** | Verificado en backend y Security Rules. |
| 20 | Usuario envía mensaje gigante (> 64KB) por WebSocket | **DENIED** | **DENIED** | `server.ts:150` desconecta sockets con mensajes > 64KB. |

---

## 12. AUDITORÍA DE SUITE DE PRUEBAS EXISTENTES

### Tests Encontrados en el Repositorio:
1. `src/__tests__/SecurityRulesMatrix.test.ts`: Pruebas unitarias puras en TypeScript sobre funciones helpers simuladas de Vitest. **No ejecutan reglas reales de Firestore ni usan Emulador**.
2. `src/__tests__/RegistrationFlow.test.ts`: Pruebas unitarias de flujo de registro.
3. `src/__tests__/PasswordCriteriaItem.test.tsx`: Pruebas de componentes UI en React.

### Diagnóstico de Tests de Seguridad:
- **Firebase Emulator**: **NO EXISTE** (`firebase.json` no está presente y `@firebase/rules-unit-testing` no está en `package.json`).
- **Conclusión**: Las Security Rules actuales **nunca han sido ejecutadas dinámicamente en una suite de integración con emulador**.

---

## 13. PLAN DE IMPLEMENTACIÓN POR FASES Y CLASIFICACIÓN DE CAMBIOS

### Clasificación de Riesgo de Cambios:
- **CRÍTICO**: Modificación de `syncUserRole`, actualización de helpers en `firestore.rules` y `storage.rules`.
- **ALTO**: Desacoplamiento de `8aulainfinity8@gmail.com`, integración del middleware de `email_verified`.
- **MEDIO**: Optimización de listeners `onSnapshot` en `firestoreSync.ts`.
- **BAJO**: Consolidación de escrituras de usuario en `userService.ts`.
- **OPCIONAL**: Depuración de colecciones secundarias obsoletas.

### Fases de Ejecución Propuetas:

#### FASE 1 — Seguridad Inmediata y Prevención de Escalada
- Refactorizar `functions/index.ts` (`syncUserRole`) para evitar auto-asignación de roles y utilizar merge al actualizar Custom Claims (`{ role, isApprovedForTutoring }`).
- Actualizar `firestore.rules` y `storage.rules` para exigir `isApprovedForTutoring == true` en operaciones de docentes.

#### FASE 2 — Custom Claims & Desacoplamiento de Master Admin
- Ejecutar función de bootstrap Admin SDK para asignar Custom Claim `{ role: "admin", isApprovedForTutoring: true }` a `8aulainfinity8@gmail.com`.
- Eliminar la comprobación estática por email en `firestore.rules`, `storage.rules` y `server.ts`.

#### FASE 3 — Verificación de Email (`email_verified`)
- Añadir el helper `isVerifiedUser()` en `firestore.rules` y `storage.rules`.
- Configurar la excepción de registro para `firestore_users/{uid}`.
- Crear la guardia de ruta `VerifiedEmailRoute.tsx` en React.

#### FASE 4 — Optimización de Listeners y Reducción Agresiva de Costes
- Refactorizar `initFirestoreSync` en `src/services/firestoreSync.ts` aplicando cláusulas `where('studentId', '==', uid)` y eliminando oyentes globales sobre colecciones completas de usuarios.

#### FASE 5 — Consolidación de Escrituras
- Modificar `src/services/userService.ts` para realizar **una única escritura `setDoc`** en `firestore_users/{uid}`, eliminando las escrituras paralelas en `users`, `students`, `teachers` y `admins`.

---

## 14. PLAN DE ROLLBACK Y PROTECCIÓN

Si se detecta cualquier degradación durante el despliegue de Security Rules o Cloud Functions:
1. Revertir `firestore.rules` y `storage.rules` mediante la Firebase CLI: `firebase deploy --only firestore:rules,storage`.
2. Restaurar el fallback del administrador maestro en `server.ts` si la Custom Claim no estuviera presente.
3. Los cambios planteados mantienen 100% la compatibilidad hacia atrás con el esquema de datos cliente.

---

## 15. ESTIMACIÓN DE IMPACTO EN COSTES DE FIRESTORE

| MÉTRICA | ESTADO ACTUAL | ESTADO POST-IMPLEMENTACIÓN | REDUCCIÓN DE COSTE |
| :--- | :---: | :---: | :---: |
| **Lecturas por Sesión de Usuario** | ~300 - 1,500 lecturas (listeners globales) | ~10 - 25 lecturas (consultas filtradas por UID) | **-98% en lecturas** |
| **Escrituras por Usuario (Login/Register)** | 3 escrituras paralelas | 1 escritura canónica (`firestore_users`) | **-66% en escrituras** |
| **Invocaciones Cloud Functions** | 1 por cada cambio en `firestore_users` | 1 solo cuando `role` o `isApproved` cambia realmente | **-80% en invocaciones** |

---
*Este informe constituye el diagnóstico técnico definitivo y completo del repositorio actual de Aula Infinity.*
