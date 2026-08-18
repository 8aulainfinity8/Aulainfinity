# MATRIZ DE AUTORIZACIÓN Y MODELO DE SEGURIDAD DE AULAINFINITY
**Versión:** 1.0.0 — Fase 3  
**Documento Técnico Oficial de Referencia**

---

## 1. Roles del Sistema y Jerarquía de Claims

AulaInfinity define tres roles fundamentales y una condición de privilegio docente almacenados en **Custom Claims de Firebase Authentication** y reflejados en los documentos de usuario:

| Rol | Custom Claim `role` | Custom Claim `isApprovedForTutoring` | `isAdmin` | Descripción y Alcance |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | `'student'` | `false` | `false` | Alumno registrado. Accede a cursos matriculados, envía tareas/quiz_answers, interactúa en foros y solicita tutorías. |
| **Teacher (No Aprobado)** | `'teacher'` | `false` | `false` | Profesor registrado pendiente de validación administrativa. No puede impartir cursos ni aceptar tutorías remuneradas. |
| **Approved Teacher** | `'teacher'` | `true` | `false` | Profesor validado por administración. Puede impartir sus cursos asignados, aceptar tutorías y moderar sus grupos. |
| **Admin** | `'admin'` | `true` | `true` | Administrador total del sistema. Gestión de usuarios, claims, finanzas, cursos y configuraciones globales. |

> **Principio de Autoridad:** Las Custom Claims (`request.auth.token`) son la única fuente de verdad en tiempo de ejecución. Ningún usuario puede alterar su propio `role` o claim mediante escrituras directas en Firestore.

---

## 2. Relaciones y Ownership en el Modelo de Datos

| Relación | Entidad Origen | Campo Real | Entidad Destino | Regla de Validación |
| :--- | :--- | :--- | :--- | :--- |
| **Matrícula de Estudiante** | `users/{uid}` | `enrolledCourseIds: string[]` | `courses/{courseId}` | $C \in \text{student.enrolledCourseIds}$ |
| **Asignación Docente** | `teachers/{uid}` o `users/{uid}` | `taughtCourseIds: string[]` | `courses/{courseId}` | $C \in \text{teacher.taughtCourseIds}$ |
| **Autoría de Examen** | `quiz_answers/{answerId}` | `studentId: string` | `users/{uid}` | `request.resource.data.studentId == request.auth.uid` |
| **Solicitud de Tutoría** | `firestore_tutoring_requests/{id}`| `studentId: string`, `teacherId: string` | `users/{uid}` | `studentId == request.auth.uid` o `teacherId == request.auth.uid` |
| **Solicitud de Tema** | `firestore_topic_requests/{id}` | `studentId: string` | `users/{uid}` | `request.resource.data.studentId == request.auth.uid` |
| **Comentario / Valoración** | `firestore_comments/{id}` | `author.id` / `userId: string` | `users/{uid}` | `request.resource.data.author.id == request.auth.uid` |
| **Mensajes Directos** | `conversations/{id}` | `participants: string[]` | `users/{uid}` | `request.auth.uid in resource.data.participants` |
| **Mensajes P2P Alumnos** | `firestore_peer_conversations/{id}`| `participantIds: string[]` | `users/{uid}` | `request.auth.uid in resource.data.participantIds` |
| **Notas Personales** | Storage `/notes/{userId}/` | Path parameter `{userId}` | `users/{uid}` | `request.auth.uid == userId` |

---

## 3. Matriz de Autorización de Firestore

| Recurso / Colección | Operación | Student | Teacher (No Aprobado) | Approved Teacher (Asignado) | Admin | Condición Técnica Exacta |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `app_config` | READ | ALLOW | ALLOW | ALLOW | ALLOW | `isVerifiedUser()` |
| | WRITE | DENY | DENY | DENY | ALLOW | `isAdmin()` |
| `users` / `firestore_users` | READ | ALLOW | ALLOW | ALLOW | ALLOW | `isVerifiedUser()` |
| | CREATE | ALLOW (cond) | DENY (vía cliente) | DENY (vía cliente) | ALLOW | `isOwner(userId)` con `role: 'student'` estricto |
| | UPDATE | ALLOW (cond) | ALLOW (cond) | ALLOW (cond) | ALLOW | `isOwner(userId)` manteniendo rol y claims inmutables |
| | DELETE | DENY | DENY | DENY | ALLOW | `isAdmin()` |
| `courses` / `course_levels` | READ | ALLOW | ALLOW | ALLOW | ALLOW | Catálogo público autenticado |
| | WRITE | DENY | DENY | ALLOW (cond) | ALLOW | `isAdmin()` o `isApprovedTeacher()` asignado |
| `quizzes` | READ | ALLOW | ALLOW | ALLOW | ALLOW | Preguntas didácticas visibles |
| | WRITE | DENY | DENY | ALLOW (cond) | ALLOW | `isAdmin()` o `isApprovedTeacher()` asignado |
| `quiz_answers` | CREATE | **ALLOW (cond)**| **DENY** | **DENY** | **ALLOW** | `request.resource.data.studentId == request.auth.uid` |
| | READ | ALLOW (cond) | DENY | ALLOW (cond) | ALLOW | `studentId == request.auth.uid` o Profesor asignado o Admin |
| | UPDATE / DELETE | DENY | DENY | DENY | ALLOW | Respuestas inmutables (solo Admin para soporte) |
| `firestore_tutoring_requests` | CREATE | **ALLOW (cond)**| **DENY** | **DENY** | **ALLOW** | `request.resource.data.studentId == request.auth.uid` |
| | READ | ALLOW (cond) | ALLOW (cond) | ALLOW (cond) | ALLOW | `studentId == request.auth.uid` o `teacherId == request.auth.uid` |
| | UPDATE | ALLOW (cond) | ALLOW (cond) | ALLOW (cond) | ALLOW | Alumno cancela; Profesor asignado acepta/reprograma |
| | DELETE | ALLOW (cond) | DENY | DENY | ALLOW | Alumno creador antes de confirmación o Admin |
| `firestore_topic_requests` | CREATE | **ALLOW (cond)**| **DENY** | **DENY** | **ALLOW** | `request.resource.data.studentId == request.auth.uid` |
| | READ | ALLOW | ALLOW | ALLOW | ALLOW | Tablón público para comunidad |
| | UPDATE / DELETE | ALLOW (cond) | DENY | ALLOW (cond) | ALLOW | Alumno creador, Approved Teacher o Admin |
| `conversations` / `direct_messages` | READ / WRITE | ALLOW (cond) | ALLOW (cond) | ALLOW (cond) | ALLOW | `request.auth.uid in resource.data.participants` |
| `peer_conversations` | READ / WRITE | ALLOW (cond) | DENY | DENY | ALLOW | `request.auth.uid in resource.data.participantIds` |
| `course_group_messages` | READ / WRITE | ALLOW (cond) | DENY | ALLOW (cond) | ALLOW | Alumno matriculado o Profesor asignado al curso |
| `rooms` / `calls` / `voice_group_calls`| READ / WRITE | ALLOW (cond) | DENY | ALLOW (cond) | ALLOW | Participante del chat o Miembro del curso |
| `whiteboards` / `strokes` | READ / WRITE | ALLOW (cond) | DENY | ALLOW (cond) | ALLOW | Miembro autorizado del curso/sala |
| `student_course_progress` | READ | ALLOW (cond) | DENY | ALLOW (cond) | ALLOW | `id.startsWith(request.auth.uid)` o Profesor asignado |
| | WRITE | ALLOW (cond) | DENY | DENY | ALLOW | `id.startsWith(request.auth.uid)` (Solo el propio alumno) |
| `firestore_comments` | CREATE | **ALLOW (cond)**| **ALLOW (cond)** | **ALLOW (cond)** | **ALLOW** | `request.resource.data.author.id == request.auth.uid` |
| | UPDATE / DELETE | ALLOW (cond) | ALLOW (cond) | ALLOW (cond) | ALLOW | Propietario del comentario o Admin |
| `payments` / `transactions` | READ | ALLOW (cond) | DENY | DENY | ALLOW | `studentId == request.auth.uid` o Admin |
| | WRITE | DENY | DENY | DENY | ALLOW | Exclusivo Backend / Pasarela de Pagos / Admin |

---

## 4. Matriz de Autorización de Firebase Storage

| Ruta de Storage | Lectura | Escritura | Regla de Autorización Técnica |
| :--- | :--- | :--- | :--- |
| `/users/{userId}/avatars/*` | ALLOW (Público/Autenticado) | ALLOW (Solo propietario: `auth.uid == userId`) | Imagen de perfil editable por el usuario |
| `/notes/{userId}/*` | **Solo Propietario y Admin** | **Solo Propietario y Admin** | **Privacidad Estricta**: `auth.uid == userId \|\| isAdmin()` |
| `/chat_attachments/{conversationId}/*` | Participantes de la conversación | Participantes de la conversación | `auth.uid in conversation.participants` |
| `/course_materials/{courseId}/*` | Alumnos matriculados y Docentes | Profesor asignado y Admin | Materiales oficiales del curso |
| `/recordings/{courseId}/*` | Alumnos matriculados y Docentes | Profesor asignado y Admin | Grabaciones de clases y tutorías |
| `/receipts/{userId}/*` | Propietario y Admin | Propietario y Admin | Comprobantes de pago y facturación |

---

## 5. Modelo de Autorización de WebSocket (`server.ts`)

En el servicio WebSocket (`server.ts`):

```
Cliente -> ws.send({ type: 'join', courseId: 'C1' })
                │
                ▼
        ¿Token verificado? ─── NO ───► Cerrar / Error
                │ SÍ
                ▼
       ¿Rol del Usuario?
        ├── Admin ────────► ALLOW (Unir al room C1)
        ├── Student ──────► ¿C1 ∈ student.enrolledCourseIds? ── SÍ ──► ALLOW
        │                                                     └── NO ──► DENY (Error: Not enrolled)
        └── Teacher ──────► ¿C1 ∈ teacher.taughtCourseIds? ──── SÍ ──► ALLOW
                                                              └── NO ──► DENY (Error: Not assigned)
```

* **Transmisión de Eventos:**
  - `cursor`: Solo los sockets autorizados en la sala `courseId` reciben y emiten cursores.
  - `message`: Solo sockets autorizados en la sala emiten y reciben mensajes de chat en tiempo real.

---

## 6. Modelo de Autorización de LiveKit (`/api/livekit/token`)

### 6.1. Identificación y Tipología de Salas
Las salas (`room`) en AulaInfinity se estructuran bajo tres taxonomías:
1. **Salas de Curso / Clase Grupal:** Formato `course_<courseId>` o `<courseId>`.
2. **Salas de Tutoría 1 a 1:** Formato `tutoring_<requestId>` o `room_<requestId>`.
3. **Salas de Chat Directo / Soporte:** Formato `direct_<conversationId>`.

### 6.2. Lógica Conceptual de Autorización (`canAccessLiveKitRoom`)
```typescript
async function canAccessLiveKitRoom(uid: string, claims: CustomClaims, roomName: string): Promise<boolean> {
    if (claims.role === 'admin') return true;

    // 1. Salas de Curso
    if (roomName.startsWith('course_') || isCourseId(roomName)) {
        const courseId = roomName.replace(/^course_/, '');
        if (claims.role === 'teacher') {
            return claims.isApprovedForTutoring && isTeacherAssignedToCourse(uid, courseId);
        }
        return isStudentEnrolledInCourse(uid, courseId);
    }

    // 2. Salas de Tutoría o Chat Directo
    if (roomName.startsWith('tutoring_') || roomName.startsWith('room_') || roomName.startsWith('direct_')) {
        const resourceId = roomName.replace(/^(tutoring_|room_|direct_)/, '');
        return isUserParticipantInResource(uid, resourceId);
    }

    return false;
}
```

---

## 7. Decisiones Pendientes y Casos Ambiguos

1. **Acceso de Profesores Aprobados a Notas Personales de Alumnos (`/notes/{userId}/`):**
   - *Decisión Documentada:* **DENY por defecto**. Las notas son privadas del estudiante. Si un alumno desea compartir una nota con su profesor, debe adjuntarla a una conversación o tutoría específica.
2. **Inmutabilidad de Exámenes (`quiz_answers`):**
   - *Decisión Documentada:* Una vez que un estudiante envía sus respuestas (`create`), no puede modificarlas (`update: DENY`) ni borrarlas (`delete: DENY`) para evitar fraudes en calificaciones. Solo el Administrador puede reabrir un intento.
