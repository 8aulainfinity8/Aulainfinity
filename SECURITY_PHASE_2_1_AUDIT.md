# AUDITORÍA COMPLETA DE SEGURIDAD Y ARQUITECTURA — AULA INFINITY
## FASE 2.1 — MODELO RESTRIGIDO DE IDENTIDAD, AUTORIZACIÓN Y PROTECCIÓN DE COSTES

**Fecha de Auditoría:** 15 de Agosto de 2026  
**Auditor:** Arquitecto de Seguridad y CTO  
**Estado:** REVISIÓN COMPLETA REALIZADA — CÓDIGO NO MODIFICADO AÚN  

---

## 1. RESUMEN EJECUTIVO Y HALLAZGOS CRÍTICOS

Se ha realizado una auditoría profunda e exhaustiva del repositorio actual de **AulaInfinity**, contrastando el código fuente (`src/`, `server.ts`, `functions/`), las reglas de seguridad (`firestore.rules`, `storage.rules`) y los servicios de backend con el modelo de seguridad objetivo para la Fase 2.1.

### Vulnerabilidades y Deficiencias Principales Detectadas en el Código Actual:

1. **Duplicación Masiva y Sincronización Multi-Colección en el Cliente (`userService.ts`)**:
   - Actualmente, al crear o actualizar un usuario, la función cliente `initializeAndSyncUserDataInFirestore` realiza escrituras en paralelo a **hasta 5 colecciones distintas**: `users/{uid}`, `firestore_users/{uid}`, `students/{uid}`, `teachers/{uid}`, y `admins/{uid}`.
   - Esto genera **5x en costes de escritura Firestore** y duplica de forma ineficiente el almacenamiento de datos de usuario.

2. **Riesgo Severo de Escalada de Privilegios vía Cloud Function `syncUserRole`**:
   - La Cloud Function `syncUserRole` escucha cambios en `firestore_users/{userId}`. Cuando detecta un cambio en el campo `role`, ejecuta `admin.auth().setCustomUserClaims(userId, { role: newData.role })`.
   - Si un atacante o un cliente malicioso consigue crear o modificar su documento en `firestore_users/{userId}` con `role: "admin"` (por ejemplo durante la creación de cuenta o explotando una regla de Firestore imprecisa), la Cloud Function automáticamente le otorgará Custom Claims de Administrador en Firebase Auth.

3. **Ausencia de Validación de `email_verified` en Reglas de Seguridad y Backend**:
   - Ni `firestore.rules` ni `storage.rules` ni el middleware `authenticateUser` de `server.ts` verifican `request.auth.token.email_verified == true`.
   - Un usuario registrado con un correo falso o no verificado tiene acceso completo de lectura/escritura a las colecciones de la plataforma (chats, materiales, peticiones de tutoría, etc.).

4. **Mezcla de Conceptos entre Identidad Docente y Autorización (`isApprovedForTutoring`)**:
   - En las reglas actuales de Firestore (`isTeacher()`) y Storage (`isTeacher()`), la función auxiliar verifica únicamente si `request.auth.token.role == 'teacher'`.
   - **Fallo de Seguridad**: Un profesor recién registrado (`role: "teacher"` pero `isApprovedForTutoring: false`) obtiene acceso inmediato a subir materiales de cursos, acceder a todas las grabaciones de clases, crear salas de voz y gestionar contenido restringido sin haber sido aprobado previamente por un Administrador.

5. **Dependencia de Emails Hardcodeados en Múltiples Puntos del Código**:
   - El correo `8aulainfinity8@gmail.com` está explícitamente escrito en:
     - `firestore.rules` (`isAdmin()`)
     - `storage.rules` (`isAdmin()`)
     - `server.ts` (`isMasterAdmin = decodedToken.email === '8aulainfinity8@gmail.com'`)
     - `src/constants/auth.ts` (`DEFAULT_ADMIN_EMAILS`)
     - `src/services/userService.ts`
     - `src/components/AdminProtectedRoute.tsx`
   - Esto viola los principios de seguridad de JWT/Custom Claims y dificulta la revocación o delegación de administradores.

6. **Consumo Ineficiente de Operaciones Firestore (Oyentes Globales Sin Filtrar)**:
   - La función `initFirestoreSync` en `src/services/firestoreSync.ts` inicia hasta 19 oyentes en tiempo real (`onSnapshot`) sobre colecciones completas como `students`, `teachers`, `admins`, `firestore_users`, `firestore_conversations`, etc., consumiendo lecturas masivas e innecesarias en cada sesión de usuario.

---

## 2. MATRIZ DE AUTORIZACIÓN Y MATRIZ DE PERMISOS POR OPERACIÓN

| RUTA / RECURSO / OPERACIÓN | ANONYMOUS | AUTH NO VERIFIED | AUTH VERIFIED STUDENT | AUTH UNAPPROVED TEACHER | AUTH APPROVED TEACHER | MASTER ADMIN |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Login / Registro (Auth)** | ✅ Acceso | ✅ Acceso | ✅ Acceso | ✅ Acceso | ✅ Acceso | ✅ Acceso |
| **Verificación Email Screen** | ❌ Denegado | ✅ Acceso | 🔄 Redirigido | 🔄 Redirigido | 🔄 Redirigido | 🔄 Redirigido |
| **Onboarding / Perfil propio (`firestore_users/{uid}`)** | ❌ Denegado | ⚠️ Solo Lectura / Edición Perfil Propio | ✅ Lectura / Edición Perfil Propio | ✅ Lectura / Edición Perfil Propio | ✅ Lectura / Edición Perfil Propio | ✅ Control Total |
| **Dashboard Estudiante (`/app`)** | ❌ Denegado | ❌ Bloqueado (Pide verificación) | ✅ Acceso | 🔄 Redirigido | 🔄 Redirigido | ✅ Acceso |
| **Cursos y Vídeos (Lectura)** | ❌ Denegado | ❌ Bloqueado | ✅ Acceso | ✅ Acceso | ✅ Acceso | ✅ Acceso |
| **Crear / Editar Cursos y Vídeos** | ❌ Denegado | ❌ Bloqueado | ❌ Denegado | ❌ Denegado | ✅ Acceso | ✅ Acceso |
| **Solicitar Tutorías (`firestore_tutoring_requests`)** | ❌ Denegado | ❌ Bloqueado | ✅ Crear / Ver Propias | ❌ Denegado | ✅ Ver / Responder | ✅ Control Total |
| **Crear / Unirse a Voice Rooms (`voiceRooms`)** | ❌ Denegado | ❌ Bloqueado | ✅ Solo Unirse como Participante | ❌ Denegado | ✅ Crear / Gestionar | ✅ Control Total |
| **Chat Directo / Soporte (`firestore_conversations`)** | ❌ Denegado | ❌ Bloqueado | ✅ Con su Docente / Soporte | ❌ Denegado | ✅ Con sus Estudiantes | ✅ Control Total |
| **Subir Adjuntos a Chat (`storage/chat_attachments`)** | ❌ Denegado | ❌ Bloqueado | ✅ Subir (Máx 20MB) | ❌ Denegado | ✅ Subir (Máx 20MB) | ✅ Control Total |
| **Subir Vídeos / Grabaciones (`storage/recordings`, `videos`)** | ❌ Denegado | ❌ Bloqueado | ❌ Denegado | ❌ Denegado | ✅ Subir (Máx 500MB) | ✅ Control Total |
| **Aprobar Profesores (`isApprovedForTutoring`)** | ❌ Denegado | ❌ Bloqueado | ❌ Denegado | ❌ Denegado | ❌ Denegado | ✅ Exclusivo Admin |
| **Panel de Administración (`/admin`)** | ❌ Denegado | ❌ Bloqueado | ❌ Denegado | ❌ Denegado | ❌ Denegado | ✅ Exclusivo Admin |

---

## 3. ANÁLISIS DETALLADO POR COMPONENTE Y ARQUITECTURA OBJETIVO

### A. Estructura Canónica de Usuarios
- **Colección Única Primaria**: `firestore_users/{userId}`.
- **Campos Controlados por Servidor/Admin**:
  - `role`: `'student' | 'teacher' | 'admin'`
  - `isApprovedForTutoring`: `boolean` (solo para profesores)
  - `isAdmin`: `boolean`
  - `emailVerified`: `boolean`
- **Colecciones Secundarias Obsoletas**: Se eliminará la escritura cliente simultánea en `users`, `students`, `teachers` y `admins`. Únicamente se mantendrá `firestore_users/{userId}` como fuente de verdad.

### B. Separación de Identidad y Autorización Docente
- **Identidad**: Determinada por la Custom Claim `role` (`student`, `teacher`, `admin`).
- **Aprobación Docente**:
  - Un profesor registrado tendrá `role: "teacher"` y en `firestore_users/{userId}` el campo `isApprovedForTutoring: false`.
  - La función auxiliar en Firestore Rules `isApprovedTeacher()` exigirá:
    ```playground
    function isApprovedTeacher() {
      return isSignedIn() && isVerifiedUser() && (
        (request.auth.token.role == 'teacher' && 
         get(/databases/$(database)/documents/firestore_users/$(request.auth.uid)).data.isApprovedForTutoring == true) ||
        isAdmin()
      );
    }
    ```
  - Alternativamente, se agregará la Custom Claim `teacherApproved: true` cuando un Administrador apruebe al profesor.

### C. Eliminación de Emails Hardcodeados y Master Admin
- Se eliminará cualquier comparación directa con `'8aulainfinity8@gmail.com'` en las reglas de Firestore y Storage.
- En su lugar:
  - `isAdmin()` en Security Rules comprobará exclusivamente `request.auth.token.role == 'admin'`.
  - El usuario Administrador Maestro recibirá la Custom Claim `{ role: 'admin' }` mediante un script de inicialización Admin SDK o Cloud Function de bootstrap.
  - En `server.ts`, los middlewares `authenticateUser` y `requireRole` confiarán de forma estricta en `decodedToken.role === 'admin'`.

### D. Protección Contra Escalada de Privilegios en `syncUserRole`
- Se modificará `functions/index.ts` para que `syncUserRole`:
  1. No otorgue el rol `admin` a menos que sea activado por un Administrador autenticado o mediante un proceso de backend seguro.
  2. Valide que el rol que se sincroniza a las Custom Claims no pueda ser auto-asignado por un usuario no autorizado.
  3. Sincronice de forma coordinada las claims `role` e `isApprovedForTutoring` (o `teacherApproved`).

### E. Optimización de Costes e Invocaciones Firestore
- Se desestructurará `initFirestoreSync` para eliminar las escuchas globales sobre colecciones completas.
- Se aplicará filtrado estricto por `uid` (`where("studentId", "==", auth.currentUser.uid)`) en todas las consultas en tiempo real de chats, tutorías y progresos.

---

## 4. PLAN DE IMPLEMENTACIÓN RECOMENDADO PARA LA SIGUIENTE FASE

1. **Paso 1: Reglas de Seguridad de Firestore (`firestore.rules`)**
   - Incorporar validaciones auxiliares `isVerifiedUser()`, `isApprovedTeacher()`, e `isAdmin()` basadas estrictamente en Custom Claims y `email_verified`.
   - Proteger el documento `firestore_users/{userId}` prohibiendo al cliente modificar sus campos `role`, `isApprovedForTutoring`, `isAdmin`.

2. **Paso 2: Reglas de Seguridad de Cloud Storage (`storage.rules`)**
   - Actualizar los helpers de autenticación para requerir `request.auth.token.email_verified == true`.
   - Eliminar el correo hardcodeado `8aulainfinity8@gmail.com`.

3. **Paso 3: Servidor Backend (`server.ts`)**
   - Actualizar middlewares de autenticación para exigir token verificado y validar roles mediante Custom Claims.

4. **Paso 4: Cloud Functions (`functions/index.ts`)**
   - Refactorizar `syncUserRole` para validar de forma segura las actualizaciones de perfil sin permitir auto-escalada.

5. **Paso 5: Frontend y Servicios Client-Side (`userService.ts`, `api.ts`, `AuthContext.tsx`)**
   - Consolidar las escrituras en la colección única `firestore_users`.
   - Implementar el guardia de ruta `VerifiedEmailRoute` y adaptar la UI al estado de verificación.

---
*Este informe de auditoría certifica la revisión técnica del sistema y sirve como especificación formal antes de proceder con cualquier modificación de código.*
