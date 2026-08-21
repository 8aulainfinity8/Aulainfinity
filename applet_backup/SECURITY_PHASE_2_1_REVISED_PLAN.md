# SECURITY_PHASE_2_1_REVISED_PLAN.md — PLAN DE ARQUITECTURA DE SEGURIDAD (FASE 2.1 - REVISADO)

---

### 1. Arquitectura Final Propuesta

La nueva arquitectura de seguridad de Aula Infinity separa estrictamente la **Identidad**, la **Verificación de Correo**, el **Rol Académico** y la **Autorización Docente Operativa**.

```
                         ┌──────────────────────────────────────────────┐
                         │          Firebase Auth (JWT Token)           │
                         │  - uid                                       │
                         │  - email_verified: true | false              │
                         │  - customClaims: {                           │
                         │      role: "student" | "teacher" | "admin",  │
                         │      isApprovedForTutoring: boolean          │
                         │    }                                         │
                         └──────────────────────┬───────────────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ▼                              ▼                              ▼
      ┌────────────────────┐         ┌────────────────────┐         ┌───────────────────┐
      │  Firestore Rules   │         │   Storage Rules    │         │   Express Server  │
      │  isVerifiedUser()  │         │  isVerifiedUser()  │         │  authenticateUser │
      │  isApprovedTeacher │         │  isApprovedTeacher │         │  requireRole()    │
      │  isAdmin()         │         │  isAdmin()         │         │                   │
      └────────────────────┘         └────────────────────┘         └───────────────────┘
```

---

### 2. Diferencia Entre Identidad (`role`) y Autorización (`isApprovedForTutoring`)

En Aula Infinity, la asignación del rol de profesor (`role: "teacher"`) **NO** otorga automáticamente permisos docentes ni acceso a las herramientas de interacción académica.

- **Identidad (`role`):** Define el tipo de cuenta (`student`, `teacher`, `admin`).
- **Autorización Docente (`isApprovedForTutoring`):** Indica si el profesor ha sido revisado y aprobado formalmente por un Administrador para impartir tutorías y gestionar grupos/salas/grabaciones.

Un usuario recién registrado como profesor posee:
- `role: "teacher"`
- `isApprovedForTutoring: false`

Mientras `isApprovedForTutoring == false`, el usuario no puede iniciar llamadas de voz, gestionar materiales, interactuar en tutorías privadas ni publicar grabaciones.

---

### 3. Estructura de Custom Claims

La estructura unificada de Custom Claims en el token JWT de Firebase Auth será:

```json
{
  "role": "student | teacher | admin",
  "isApprovedForTutoring": boolean
}
```

#### Ejemplos de Tokens por Estado de Usuario:

1. **Estudiante Verificado:**
   ```json
   { "role": "student", "isApprovedForTutoring": false }
   ```
2. **Profesor Pendiente de Aprobación:**
   ```json
   { "role": "teacher", "isApprovedForTutoring": false }
   ```
3. **Profesor Aprobado:**
   ```json
   { "role": "teacher", "isApprovedForTutoring": true }
   ```
4. **Administrador:**
   ```json
   { "role": "admin", "isApprovedForTutoring": true }
   ```

---

### 4. Definición de Helpers en Security Rules

#### En `firestore.rules` y `storage.rules`:

```javascript
// Usuario autenticado en Firebase Auth
function isSignedIn() {
  return request.auth != null;
}

// Usuario autenticado Y con correo verificado (base para todas las operaciones académicas/privadas)
function isVerifiedUser() {
  return isSignedIn() && request.auth.token.email_verified == true;
}

// Es el propietario del recurso (requiere email verificado)
function isOwner(userId) {
  return isVerifiedUser() && request.auth.uid == userId;
}

// Administrador verificado por Custom Claim
function isAdmin() {
  return isVerifiedUser() && request.auth.token.role == 'admin';
}

// Profesor verificado genérico (para vistas básicas de docentes)
function isTeacher() {
  return isVerifiedUser() && (
    request.auth.token.role == 'teacher' || 
    request.auth.token.role == 'admin'
  );
}

// Profesor APROBADO por un Administrador (requerido para crear salas, subir materiales, grabaciones y tutorías)
function isApprovedTeacher() {
  return isVerifiedUser() && (
    request.auth.token.role == 'admin' ||
    (request.auth.token.role == 'teacher' && request.auth.token.isApprovedForTutoring == true)
  );
}
```

---

### 5. Flujo de Registro de Estudiantes y Profesores

```
1. Formulario de Registro (Estudiante o Profesor)
        ↓
2. createUserWithEmailAndPassword() en Firebase Auth
        ↓
3. Escritura en firestore_users/{uid}:
   - Estudiante: { role: "student", isApprovedForTutoring: false }
   - Profesor:   { role: "teacher", isApprovedForTutoring: false }
   (Rule exige isApprovedForTutoring == false y role != "admin")
        ↓
4. Trigger onWrite -> Cloud Function syncUserRole:
   Genera Custom Claims:
   - Estudiante: { role: "student", isApprovedForTutoring: false }
   - Profesor:   { role: "teacher", isApprovedForTutoring: false }
        ↓
5. sendEmailVerification() enviado al correo del usuario
        ↓
6. Estado del Usuario: NO VERIFICADO (email_verified == false)
   - Acceso a datos académicos, chats, grabaciones, voz: DENEGADO
   - Acceso a su perfil inicial firestore_users/{uid}: PERMITIDO
        ↓
7. Usuario verifica su correo electrónico mediante el enlace enviado
        ↓
8. Inicio de sesión post-verificación -> getIdTokenResult(true)
   - Estudiante: Habilitado para navegación y cursos.
   - Profesor: Habilitado únicamente en modo de espera con aviso de aprobación pendiente.
```

---

### 6. Flujo de Aprobación Docente por Administrador

```
1. Administrador accede a AdminTeacherApprovalPage.tsx
        ↓
2. Administrador hace clic en "Aprobar Profesor"
        ↓
3. api.updateTeacherApproval(teacherId, true) escribe en Firestore:
   - firestore_users/{teacherId}: { isApprovedForTutoring: true }
   - teachers/{teacherId}: { isApprovedForTutoring: true }
   (Rule exige que solo isAdmin() pueda modificar isApprovedForTutoring)
        ↓
4. Trigger onWrite -> Cloud Function syncUserRole detecta cambio en isApprovedForTutoring
        ↓
5. Cloud Function actualiza Custom Claims del profesor:
   setCustomUserClaims(teacherId, { ...existingClaims, role: "teacher", isApprovedForTutoring: true })
        ↓
6. El cliente del profesor ejecuta getIdTokenResult(true) al detectar la aprobación
        ↓
7. Profesor Aprobado posee Custom Claim isApprovedForTutoring: true
   - Acceso a herramientas docentes, salas de voz y tutorías: PERMITIDO
```

---

### 7. Administración y Asignación de Roles Privilegiados

- Ningún usuario (estudiante o profesor) puede auto-asignarse el rol `admin` ni modificar su propio campo `isApprovedForTutoring` o `role`.
- Las reglas de Firestore rechazarán cualquier `create` o `update` proveniente del cliente que intente establecer `role: "admin"` o `isApprovedForTutoring: true`, excepto si la petición proviene de un usuario con el Custom Claim `role == "admin"`.
- La modificación del rol de un usuario se efectúa exclusivamente desde el panel de administración autorizado.

---

### 8. Estrategia de Migración del Master Admin (`8aulainfinity8@gmail.com`)

Actualmente, el correo `8aulainfinity8@gmail.com` está escrito en duro en 4 capas. El plan de desacoplamiento seguro consta de los siguientes pasos:

1. **Paso 1 (Bootstrap):** Ejecutar una script/función administrativa de bootstrap que asigne `{ role: "admin", isApprovedForTutoring: true }` en Firebase Auth al UID correspondiente al correo `8aulainfinity8@gmail.com`.
2. **Paso 2 (Validación Token):** Verificar que `auth.currentUser.getIdTokenResult(true)` retorne `claims.role === "admin"`.
3. **Paso 3 (Security Rules):** Actualizar `firestore.rules` y `storage.rules` sustituyendo el chequeo estático por email `request.auth.token.email.lower() == '8aulainfinity8@gmail.com'` por el helper `isAdmin()`.
4. **Paso 4 (Express Server):** Actualizar `server.ts` sustituyendo el chequeo estático de email en los middlewares por la validación de `decodedToken.role === 'admin'`.
5. **Paso 5 (Frontend):** Actualizar los guardias `AdminProtectedRoute.tsx` y `useAuthorization.ts` para que evalúen `user.role === 'admin'` / `token.claims.role === 'admin'`.

---

### 9. Token Refresh Strategy (`getIdToken(true)`)

El token JWT de Firebase Auth no refleja cambios en los Custom Claims inmediatamente a menos que se fuerce su actualización. Se implementará el refresco de token sin polling en los siguientes momentos clave:

1. **Al iniciar sesión:** Después de llamar a `signInWithEmailAndPassword` y verificar `emailVerified`.
2. **Post-Verificación de Email:** Cuando el usuario confirma su correo y vuelve a la app.
3. **Al detectar actualización de perfil en tiempo real:** Cuando la escucha en `firestore_users/{uid}` detecte un cambio en `role` o `isApprovedForTutoring`.

---

### 10. Optimización de la Cloud Function `syncUserRole`

#### Archivo: `functions/index.ts`

Se modificará la función para evitar ejecuciones o llamadas innecesarias a la API de Auth de Firebase:

```typescript
export const syncUserRole = functions.region("europe-west1").firestore
  .document("firestore_users/{userId}")
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const beforeData = change.before.exists ? change.before.data() : null;
    const afterData = change.after.exists ? change.after.data() : null;

    if (!afterData) {
      // Documento eliminado
      return null;
    }

    const newRole = afterData.role || 'student';
    const newApproval = newRole === 'teacher' ? (afterData.isApprovedForTutoring === true) : false;

    // 1. Optimización de Trigger: Si ni el rol ni la aprobación cambiaron, salir inmediatamente
    if (beforeData) {
      const oldRole = beforeData.role || 'student';
      const oldApproval = oldRole === 'teacher' ? (beforeData.isApprovedForTutoring === true) : false;
      if (oldRole === newRole && oldApproval === newApproval) {
        return null;
      }
    }

    // 2. Fusión aditiva (Merge) con Custom Claims preexistentes
    try {
      const userRecord = await admin.auth().getUser(userId);
      const existingClaims = userRecord.customClaims || {};

      // Si los claims ya coinciden exactamente, evitar llamada redundant
      if (existingClaims.role === newRole && existingClaims.isApprovedForTutoring === newApproval) {
        return null;
      }

      await admin.auth().setCustomUserClaims(userId, {
        ...existingClaims,
        role: newRole,
        isApprovedForTutoring: newApproval
      });
      console.log(`[syncUserRole] Custom claims actualizados para ${userId}: role=${newRole}, isApprovedForTutoring=${newApproval}`);
    } catch (err) {
      console.error(`[syncUserRole] Error actualizando custom claims para ${userId}:`, err);
    }
    return null;
  });
```

---

### 11. Modificaciones Propuestas en `firestore.rules`

Se sustituirán las funciones de autorización globales y se aplicarán los nuevos helpers `isVerifiedUser()` e `isApprovedTeacher()` en los recursos correspondientes:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isVerifiedUser() {
      return isSignedIn() && request.auth.token.email_verified == true;
    }

    function isOwner(userId) {
      return isVerifiedUser() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isVerifiedUser() && request.auth.token.role == 'admin';
    }

    function isTeacher() {
      return isVerifiedUser() && (
        request.auth.token.role == 'teacher' || 
        request.auth.token.role == 'admin'
      );
    }

    function isApprovedTeacher() {
      return isVerifiedUser() && (
        request.auth.token.role == 'admin' ||
        (request.auth.token.role == 'teacher' && request.auth.token.isApprovedForTutoring == true)
      );
    }

    // Registro e información del usuario
    match /firestore_users/{id} {
      allow read: if isVerifiedUser();
      // Registro inicial: Permite a un usuario no verificado crear su perfil inicial con rol student/teacher no aprobado
      allow create: if isSignedIn() && request.auth.uid == id &&
                   (!("role" in request.resource.data) || request.resource.data.role in ['student', 'teacher']) &&
                   (!("isApprovedForTutoring" in request.resource.data) || request.resource.data.isApprovedForTutoring == false);
      allow update: if isVerifiedUser() && (
        isAdmin() ||
        (isOwner(id) &&
         (!("role" in request.resource.data) || request.resource.data.role == resource.data.role) &&
         (!("isApprovedForTutoring" in request.resource.data) || request.resource.data.isApprovedForTutoring == resource.data.isApprovedForTutoring))
      );
      allow delete: if isAdmin();
    }

    // voiceRooms: Requiere ser Profesor APROBADO o Administrador para crear salas
    match /voiceRooms/{id} {
      allow read: if isVerifiedUser();
      allow create: if isApprovedTeacher() || (isVerifiedUser() && request.resource.data.createdBy == request.auth.uid);
      allow update: if isVerifiedUser() && (
        isAdmin() ||
        (
          (!("createdBy" in resource.data) || !("createdBy" in request.resource.data) || request.resource.data.createdBy == resource.data.createdBy) &&
          (!("teacherId" in resource.data) || !("teacherId" in request.resource.data) || request.resource.data.teacherId == resource.data.teacherId) &&
          (
            (resource != null && "createdBy" in resource.data && resource.data.createdBy == request.auth.uid) ||
            (resource != null && "teacherId" in resource.data && resource.data.teacherId == request.auth.uid) ||
            isApprovedTeacher() ||
            (id == request.auth.uid || id.matches('.*' + request.auth.uid + '.*'))
          )
        )
      );
      allow delete: if isAdmin() || (resource != null && "createdBy" in resource.data && resource.data.createdBy == request.auth.uid);
    }

    // classRecordings: Requiere Profesor APROBADO o Administrador para publicar
    match /classRecordings/{id} {
      allow read: if isVerifiedUser() && (
        isAdmin() ||
        isApprovedTeacher() ||
        (resource != null && (
          resource.data.courseId == request.auth.uid ||
          resource.data.courseId.matches('.*' + request.auth.uid + '.*') ||
          resource.data.recordedBy == request.auth.uid ||
          ("studentId" in resource.data && resource.data.studentId == request.auth.uid) ||
          ("participants" in resource.data && request.auth.uid in resource.data.participants) ||
          (!resource.data.courseId.matches('.*_[a-zA-Z0-9]+.*') && !resource.data.courseId.matches('^direct_.*') && !resource.data.courseId.matches('^peer_.*'))
        ))
      );
      allow create, update: if isApprovedTeacher();
      allow delete: if isAdmin();
    }
  }
}
```

---

### 12. Modificaciones Propuestas en `storage.rules`

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {

    function isSignedIn() {
      return request.auth != null;
    }

    function isVerifiedUser() {
      return isSignedIn() && request.auth.token.email_verified == true;
    }

    function isOwner(userId) {
      return isVerifiedUser() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isVerifiedUser() && request.auth.token.role == 'admin';
    }

    function isApprovedTeacher() {
      return isVerifiedUser() && (
        request.auth.token.role == 'admin' ||
        (request.auth.token.role == 'teacher' && request.auth.token.isApprovedForTutoring == true)
      );
    }

    match /chat_attachments/{conversationId}/{fileName} {
      allow read, write: if isVerifiedUser() && maxFileSize(20) && (
        isAdmin() ||
        isApprovedTeacher() ||
        conversationId == request.auth.uid ||
        conversationId.matches('^direct_' + request.auth.uid + '(_.*)?$') ||
        conversationId.matches('^peer_' + request.auth.uid + '(_.*)?$') ||
        conversationId.matches('^' + request.auth.uid + '_.*') ||
        conversationId.matches('.*_' + request.auth.uid + '$') ||
        conversationId.matches('.*_' + request.auth.uid + '_.*') ||
        (!conversationId.matches('.*_[a-zA-Z0-9]+.*') && !conversationId.matches('^direct_.*') && !conversationId.matches('^peer_.*'))
      );
    }

    match /recordings/{courseOrUserId}/{fileName} {
      allow read: if isVerifiedUser() && (
        isAdmin() ||
        isApprovedTeacher() ||
        courseOrUserId == request.auth.uid ||
        courseOrUserId.matches('^direct_' + request.auth.uid + '(_.*)?$') ||
        courseOrUserId.matches('^peer_' + request.auth.uid + '(_.*)?$') ||
        courseOrUserId.matches('^' + request.auth.uid + '_.*') ||
        courseOrUserId.matches('.*_' + request.auth.uid + '$') ||
        courseOrUserId.matches('.*_' + request.auth.uid + '_.*') ||
        (!courseOrUserId.matches('.*_[a-zA-Z0-9]+.*') && !courseOrUserId.matches('^direct_.*') && !courseOrUserId.matches('^peer_.*'))
      );
      allow write: if isApprovedTeacher() && maxFileSize(500);
    }
  }
}
```

---

### 13. Modificaciones Propuestas en Servidor Express (`server.ts`)

Los middlewares de autorización en Express utilizarán la información del token JWT decodificado por `admin.auth().verifyIdToken(token)`:

```typescript
// server.ts
function requireAdmin(req, res, next) {
  const user = req.user;
  if (!user || !user.email_verified || user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de Administrador verificado.' });
  }
  next();
}

function requireApprovedTeacher(req, res, next) {
  const user = req.user;
  if (!user || !user.email_verified) {
    return res.status(403).json({ error: 'Debes verificar tu correo electrónico.' });
  }
  if (user.role === 'admin') return next();
  if (user.role === 'teacher' && user.isApprovedForTutoring === true) return next();
  return res.status(403).json({ error: 'Acceso restringido a profesores aprobados.' });
}
```

---

### 14. Modificaciones Propuestas en Frontend

- `src/hooks/useAuthorization.ts`:
  ```typescript
  export function useAuthorization() {
    const { user, claims } = useAuth();
    const isVerified = user?.emailVerified === true;
    const isAdmin = isVerified && (claims?.role === 'admin' || user?.role === 'admin');
    const isTeacher = isVerified && (claims?.role === 'teacher' || user?.role === 'teacher');
    const isApprovedTeacher = isAdmin || (isTeacher && (claims?.isApprovedForTutoring === true || user?.isApprovedForTutoring === true));

    return { isVerified, isAdmin, isTeacher, isApprovedTeacher };
  }
  ```

---

### 15. Matriz Completa de Tests (17 Casos)

| ID | Condición del Usuario | Acción Intentada | Resultado Esperado |
|---|---|---|---|
| **T01** | Anónimo | Acceso a datos privados de Firestore/Storage | **DENIED** |
| **T02** | Estudiante No Verificado | Intentar leer/escribir mensajes o cursos | **DENIED** |
| **T03** | Estudiante No Verificado | Crear su perfil inicial en `firestore_users/{uid}` | **ALLOWED** |
| **T04** | Estudiante Verificado | Leer/Escribir sus propios datos de estudiante | **ALLOWED** |
| **T05** | Estudiante Verificado | Intentar acceder a panel o datos de administración | **DENIED** |
| **T06** | Profesor Verificado (`isApprovedForTutoring=false`) | Intentar crear sala de voz o tutoría | **DENIED** |
| **T07** | Profesor Verificado (`isApprovedForTutoring=true`) | Crear sala de voz o publicar clase grabada | **ALLOWED** |
| **T08** | Profesor Verificado (`isApprovedForTutoring=false`) | Intentar cambiar su propio `isApprovedForTutoring=true` | **DENIED** |
| **T09** | Estudiante Verificado | Intentar escribir `role="teacher"` o `role="admin"` | **DENIED** |
| **T10** | Estudiante Verificado | Intentar auto-promoverse a `role="admin"` | **DENIED** |
| **T11** | Profesor Verificado | Intentar auto-promoverse a `role="admin"` | **DENIED** |
| **T12** | Administrador Verificado | Aprobar profesor (`isApprovedForTutoring=true`) | **ALLOWED** |
| **T13** | Administrador Verificado | Promover usuario a `role="admin"` | **ALLOWED** |
| **T14** | Administrador Verificado | Revocar aprobación a un profesor | **ALLOWED** |
| **T15** | Usuario con Custom Claims preexistentes | Ejecución de `syncUserRole` tras cambio de rol | **Claims conservados (Merge)** |
| **T16** | Administrador No Verificado | Intentar acción administrativa | **DENIED** |
| **T17** | Administrador Verificado | Ejecutar acción administrativa completa | **ALLOWED** |

---

### 16. Impacto Esperado en Firebase

- Cero cambios estructurales en el esquema de base de datos.
- Sincronización transparente de Custom Claims en Firebase Auth mediante `syncUserRole`.
- El motor de Security Rules evalúa Custom Claims en memoria mediante la firma del token JWT recibido en la cabecera del request.

---

### 17. Impacto Esperado en Costes

> **Sin lecturas Firestore adicionales para autorización y sin incremento arquitectónico previsto de consultas/listeners.**

Dado que la validación de `role`, `isApprovedForTutoring` y `email_verified` se realiza a través de los metadatos integrados en el token JWT (`request.auth.token`), las Security Rules no requieren ejecutar funciones `get()` para consultar documentos de usuario en Firestore, manteniendo el coste operacional en el mínimo absoluto.

---

### 18. Estado de Verificación Dinámica y Firebase Emulator

> **NO VERIFICADO MEDIANTE FIREBASE EMULATOR.**

El contenedor de desarrollo no dispone del paquete `firebase-tools` ni de Java Runtime para ejecutar Firebase Local Emulator Suite. Las Security Rules propuestas se basan en la auditoría formal estática del árbol de sintaxis abstracta (AST) de Firebase Security Rules y la verificación de tipos de TypeScript.

---

### 19. Riesgos y Medidas de Mitigación

1. **Riesgo:** Desfase temporal entre la aprobación en Firestore y la disponibilidad del Custom Claim en el navegador del profesor.
   - *Mitigación:* Forzar `auth.currentUser.getIdTokenResult(true)` tras el cambio de estado.
2. **Riesgo:** Bloqueo accidental de administradores si el claim `admin` no se ha inicializado antes del despliegue de reglas.
   - *Mitigación:* Ejecutar el script de bootstrap para el Master Admin antes de aplicar la actualización de las Security Rules.

---

### 20. Plan de Rollback

En caso de cualquier eventualidad durante la futura implementación:
1. Revertir `firestore.rules` y `storage.rules` a la versión aprobada en la Fase 1.5.
2. Mantener la compatibilidad en `server.ts` con el chequeo secundario por email durante el periodo de prueba.
3. Desactivar temporalmente la exigencia de `isApprovedForTutoring` en el frontend utilizando la configuración de fallback en `src/constants/auth.ts`.
