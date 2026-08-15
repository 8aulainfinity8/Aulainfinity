# Modelo de Datos Definitivo — Aula Infinity

Este documento establece el **modelo de datos canónico y consolidado** de Aula Infinity en Firebase Firestore, eliminando duplicidades y definiendo con exactitud los esquemas, relaciones, roles y niveles de acceso.

---

## 1. Colecciones de Usuarios y Roles

### `firestore_users/{userId}` (Colección Principal de Usuarios)
Colección canónica de perfiles de usuario. Se sincroniza con colecciones de rol (`students`, `teachers`, `admins`) para consultas optimizadas.
- **`id` / `uid`**: `string` (UID de Firebase Auth).
- **`firebaseUid`**: `string` (UID de Firebase Auth).
- **`name`**: `string` (Nombre y apellidos del usuario).
- **`email`**: `string` (Correo electrónico registrado).
- **`role`**: `'student' | 'teacher' | 'admin'` (Rol del usuario, validado por Custom Claims en servidor).
- **`subscriptionStatus`**: `'active' | 'inactive' | 'past_due' | 'canceled'`
- **`credits`**: `number` (Créditos / Monedas Infinity disponibles).
- **`assignedTeacherId`**: `string | null` (ID del profesor asignado al estudiante).
- **`assignedTeacherName`**: `string | null` (Nombre del profesor asignado).
- **`enrolledCourseIds`**: `string[]` (IDs de cursos en los que está matriculado).
- **`coursesTaughtIds`**: `string[]` (IDs de cursos que imparte, si es profesor).
- **`watchedVideos`**: `string[]` (IDs de vídeos completados o vistos).
- **`favoriteVideos`**: `string[]` (IDs de vídeos marcados como favoritos).
- **`createdAt`**: `string | Timestamp` (Fecha de registro en ISO o Timestamp).
- **`updatedAt`**: `Timestamp` (Última actualización de perfil).

---

## 2. Cursos, Asignaturas y Contenido Educativo

### `courses/{courseId}`
Cursos formativos y materias principales (Matemáticas, Física, Química, etc.).
- **`id`**: `string` (ID único del curso).
- **`title`**: `string` (Título descriptivo).
- **`subject`**: `string` (Asignatura o especialidad).
- **`level`**: `string` (Nivel educativo: 1º Bachillerato, 2º Bachillerato, EBAU, ESO).
- **`description`**: `string` (Descripción del contenido).
- **`teacherId`**: `string` (UID del docente titular).
- **`teacherName`**: `string` (Nombre del docente titular).
- **`isPublished`**: `boolean` (Estado de publicación).
- **`modules`**: `Array<{ id: string, title: string, order: number }>`
- **`lessons`**: `Array<{ id: string, title: string, moduleId: string, videoUrl?: string, duration?: number }>`

### `student_course_progress/{progressId}`
Almacena el avance y porcentaje completado por cada alumno en cada curso/materia.
- **ID de Documento**: `{studentId}_{courseId}`
- **`studentId`**: `string` (UID del estudiante).
- **`courseId`**: `string` (ID del curso).
- **`completedLessonIds`**: `string[]` (IDs de lecciones completadas).
- **`progressPercentage`**: `number` (0 a 100).
- **`lastAccessedLessonId`**: `string` (Última lección vista).
- **`lastUpdated`**: `Timestamp | string`.

---

## 3. Tutorías y Agenda

### `firestore_tutoring_requests/{requestId}`
Solicitudes de tutorías 1 a 1 entre estudiantes y profesores.
- **`id`**: `string` (ID único de la solicitud).
- **`studentId`**: `string` (UID del alumno solicitante).
- **`studentName`**: `string` (Nombre del alumno).
- **`studentEmail`**: `string` (Correo del alumno).
- **`teacherId`**: `string | null` (UID del profesor asignado).
- **`teacherName`**: `string | null` (Nombre del profesor).
- **`subject`**: `string` (Materia de la consulta).
- **`topic`**: `string` (Tema o problema a resolver).
- **`description`**: `string` (Detalle de la duda planteada).
- **`status`**: `'pending' | 'accepted' | 'scheduled' | 'completed' | 'rejected'`
- **`preferredTime`**: `string` (Franja horaria preferida por el alumno).
- **`scheduledAt`**: `Timestamp | string | null` (Fecha y hora confirmada para la sesión).
- **`notes`**: `string` (Notas o retroalimentación del docente).
- **`createdAt`**: `Timestamp | string`.

### `firestore_agenda_events/{eventId}`
Eventos de calendario académico, clases en vivo, exámenes y entregas.
- **`id`**: `string`.
- **`userId`**: `string` (UID del creador o asignatario).
- **`title`**: `string`.
- **`description`**: `string`.
- **`date`**: `string` (Formato YYYY-MM-DD).
- **`time`**: `string` (Formato HH:mm).
- **`type`**: `'exam' | 'tutoring' | 'live_class' | 'assignment' | 'reminder'`
- **`courseId`**: `string | null`.
- **`createdAt`**: `Timestamp | string`.

---

## 4. Mensajería y Conversaciones

### `firestore_direct_messages/{messageId}`
Mensajes directos entre alumnos y profesores o soporte.
- **`id`**: `string`.
- **`conversationId`**: `string`.
- **`senderId`**: `string` (UID del emisor).
- **`senderName`**: `string`.
- **`senderRole`**: `'student' | 'teacher' | 'admin'`.
- **`recipientId`**: `string` (UID del receptor).
- **`text`**: `string`.
- **`attachmentUrl`**: `string | null`.
- **`read`**: `boolean`.
- **`timestamp`**: `Timestamp | string`.

### `firestore_peer_messages/{messageId}`
Mensajes dentro de comunidades de estudio entre compañeros.
- **`id`**: `string`.
- **`senderId`**: `string`.
- **`senderName`**: `string`.
- **`subjectId`**: `string` (ID de la asignatura o sala).
- **`text`**: `string`.
- **`timestamp`**: `Timestamp | string`.

### `chats/{chatId}/messages/{messageId}`
Subcolección en tiempo real para sesiones de chat y señalización WebRTC.
- **`id`**: `string`.
- **`senderId`**: `string`.
- **`text`**: `string`.
- **`timestamp`**: `Timestamp`.

---

## 5. Pizarra Colaborativa y Sesiones

### `whiteboards/{courseId}` (Metadatos)
- **`courseId`**: `string`.
- **`title`**: `string`.
- **`activeTeacherId`**: `string | null`.
- **`updatedAt`**: `Timestamp`.

### `whiteboards/{courseId}/strokes/{strokeId}`
Trazos vectoriales sincronizados en tiempo real.
- **`id`**: `string`.
- **`type`**: `'pen' | 'highlighter' | 'eraser' | 'text' | 'shape'`
- **`points`**: `Array<{ x: number, y: number, pressure?: number }>`
- **`color`**: `string`.
- **`size`**: `number`.
- **`zIndex`**: `number` (Los elementos de texto siempre se renderizan en capas superiores).
- **`userId`**: `string` (UID del creador del trazo).
- **`createdAt`**: `Timestamp`.

---

## 6. Transacciones Financieras y Auditoría

### `infinity_transactions/{txId}`
Registro inmutable de movimientos económicos y de créditos. **Solo escribible desde Backend/Admin**.
- **`id`**: `string`.
- **`studentId`**: `string` (UID del estudiante).
- **`amount`**: `number` (Monto o créditos).
- **`type`**: `'purchase' | 'spend' | 'refund' | 'bonus'`
- **`description`**: `string`.
- **`status`**: `'completed' | 'pending' | 'failed'`
- **`timestamp`**: `Timestamp | string`.

### `student_payments/{paymentId}`
Comprobantes de pago de suscripciones y cursos.
- **`id`**: `string`.
- **`studentId`**: `string`.
- **`amount`**: `number`.
- **`currency`**: `'EUR' | 'USD'`.
- **`planId`**: `string`.
- **`paymentMethod`**: `'stripe' | 'card' | 'transfer'`.
- **`receiptUrl`**: `string | null`.
- **`createdAt`**: `Timestamp | string`.

---

## 7. Tutor IA y Auditoría de Costes

### `ai_query_logs/{logId}`
Registro de interacciones con el Tutor IA Gemini para control de cuotas y costes.
- **`id`**: `string`.
- **`studentId`**: `string` (UID verificado por token).
- **`date`**: `string` (Formato YYYY-MM-DD para control atómico de cuota diaria).
- **`promptLength`**: `number`.
- **`responseTokens`**: `number`.
- **`mode`**: `'socratic' | 'explanatory' | 'ebau'`
- **`timestamp`**: `Timestamp`.

---

## 8. Notificaciones y WhatsApp

### `whatsapp_logs/{logId}`
Registro de notificaciones enviadas por WhatsApp vía backend.
- **`id`**: `string`.
- **`recipient`**: `string`.
- **`message`**: `string`.
- **`status`**: `'sent' | 'failed'`.
- **`sentBy`**: `string` (UID del remitente).
- **`timestamp`**: `Timestamp`.
