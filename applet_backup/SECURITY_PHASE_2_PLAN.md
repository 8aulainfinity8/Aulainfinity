# SECURITY_PHASE_2_PLAN.md — PLAN DE ARQUITECTURA DE AUTENTICACIÓN, CUSTOM CLAIMS Y MASTER ADMIN SECURITY

---

### 1. Estado Actual

1. **Gestión de Usuarios y Perfiles:**
   - La aplicación almacena la información del usuario en tres colecciones principales: `firestore_users/{userId}`, `students/{userId}` y `teachers/{userId}` / `admins/{userId}`.
   - El registro inicial realiza la creación del perfil en `firestore_users/{userId}` inmediatamente después de llamar a `createUserWithEmailAndPassword`.

2. **Sincronización de Roles (Cloud Functions):**
   - La función `syncUserRole` (`functions/index.ts`) escucha los cambios en `firestore_users/{userId}`.
   - Cuando detecta un cambio en el campo `role`, ejecuta:
     ```typescript
     await admin.auth().setCustomUserClaims(userId, { role: newData.role });
     ```

3. **Mecanismo de Master Admin:**
   - El acceso de Administrador Maestro está desacoplado y disperso en 4 capas distintas evaluando el email estático `8aulainfinity8@gmail.com`:
     - **Frontend:** `isAdminEmail(user.email)` en `src/constants/auth.ts`, `AdminProtectedRoute.tsx`, `userService.ts`, `api.ts`, `firebase.ts`.
     - **Server Express:** Middlewares `authenticateUser` y `requireRole` en `server.ts` fuerzan `decodedToken.role = 'admin'` si `email.toLowerCase() === '8aulainfinity8@gmail.com'`.
     - **Firestore Rules:** La función `isAdmin()` evalúa `request.auth.token.role == 'admin' || request.auth.token.email.lower() == '8aulainfinity8@gmail.com'`.
     - **Storage Rules:** La función `isAdmin()` evalúa la misma condición por email.

4. **Verificación de Email (`email_verified`):**
   - El frontend (`AuthContext.ts` y `api.ts`) bloquea el inicio de sesión y cierra la sesión si `!auth.currentUser.emailVerified`.
   - Las reglas de Firestore y Storage **NO** verifican `email_verified` en los tokens, confiando únicamente en `request.auth != null`.

---

### 2. Problemas Encontrados

1. **Sobrescritura de Custom Claims en `syncUserRole`:**
   - Al invocar `setCustomUserClaims(userId, { role: newData.role })`, se eliminan todos los demás custom claims asignados previamente al usuario en Firebase Auth (p. ej. `approved`, `permissions`, etc.).
2. **Duplicación de la Lógica de Master Admin:**
   - La dependencia directa de `8aulainfinity8@gmail.com` en 4 ubicaciones (Frontend, Express Server, Firestore Rules, Storage Rules) crea riesgos de inconsistencia si se agregan administradores o se modifica la dirección de correo.
3. **Brecha en Security Rules para Cuentas No Verificadas:**
   - Un usuario que cree una cuenta mediante la API de Firebase Auth sin validar su correo electrónico puede saltarse las restricciones de la interfaz cliente e interactuar directamente con los endpoints de Firestore y Storage, ya que las Security Rules solo comprueban `request.auth != null`.
4. **Desfase de Estado en JWT tras Cambio de Rol:**
   - Cuando un administrador modifica el rol de un usuario en `firestore_users/{userId}`, la Cloud Function actualiza los claims en Firebase Auth, pero el cliente del usuario mantiene la sesión con el token JWT antiguo hasta que se fuerza la actualización con `getIdToken(true)`.
5. **Riesgo de Auto-Escalado de Privilegios en Registro:**
   - Si un usuario enviara `role: "admin"` durante el `create` inicial en `firestore_users/{userId}`, la Cloud Function le otorgaría automáticamente el Custom Claim de administrador si la regla de seguridad no bloquea la asignación de roles privilegiados en el cliente.

---

### 3. Arquitectura Propuesta

```
                  ┌──────────────────────────────────────────────┐
                  │          Firebase Auth (JWT Token)           │
                  │  - uid                                       │
                  │  - email_verified: true / false              │
                  │  - customClaims: { role: "admin"|"teacher" } │
                  └──────────────────────┬───────────────────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 ▼                       ▼                       ▼
      ┌────────────────────┐   ┌────────────────────┐  ┌───────────────────┐
      │  Firestore Rules   │   │   Storage Rules    │  │   Express Server  │
      │  isSignedIn()      │   │   isSignedIn()     │  │  authenticateUser │
      │  isAdmin()         │   │   isAdmin()        │  │  requireRole()    │
      └────────────────────┘   └────────────────────┘  └───────────────────┘
                 ▲                       ▲                       ▲
                 └───────────────────────┴───────────────────────┘
                              Fuente Única de Verdad:
                            request.auth.token.role
```

1. **Fuente Única de Autorización:**
   - El token JWT firmado por Firebase Auth con el claim `role` (`admin`, `teacher`, `student`) y la propiedad `email_verified` será la **única fuente de verdad** para todas las capas.
2. **Inmutabilidad y Fusión Aditiva de Claims:**
   - La Cloud Function `syncUserRole` leerá los claims existentes con `admin.auth().getUser(uid)` antes de asignar nuevos valores, realizando un *merge* seguro: `{ ...existingClaims, role: targetRole }`.
3. **Independencia del Email de Master Admin:**
   - El correo `8aulainfinity8@gmail.com` se utilizará **únicamente** en un proceso de *bootstrap* inicial para asignar el Custom Claim `{ role: "admin" }` en Firebase Auth. Una vez asignado, se retirará el chequeo por string de email de las Security Rules y del servidor Express.
4. **Verificación Estricta en Security Rules (`email_verified`):**
   - La función helper `isSignedIn()` exigirá `request.auth.token.email_verified == true` para todas las operaciones sobre datos académicos y privados, reservando una excepción controlada para la creación de su propio perfil de registro inicial en `firestore_users/{userId}`.

---

### 4. Archivos que Habría que Modificar

1. `functions/index.ts`
   - Actualizar `syncUserRole` para hacer un *merge* de claims preexistentes y validar que los roles asignados sean válidos (`student`, `teacher`, `admin`).
   - Agregar función/script de *bootstrap* para garantizar que el usuario Master Admin reciba el Custom Claim `{ role: "admin" }`.
2. `server.ts`
   - Actualizar middlewares `authenticateUser` y `requireRole` para confiar de forma primaria en `decodedToken.role` provisto por el JWT, eliminando la comprobación estática del correo `8aulainfinity8@gmail.com`.
3. `src/constants/auth.ts`
   - Mantener `isAdminEmail` como fallback secundario únicamente en modo desarrollo o para sugerencias UI, estableciendo la propiedad `user.role === 'admin'` como comprobación principal.
4. `src/components/AdminProtectedRoute.tsx`
   - Evaluar `user.role === 'admin'` de forma primaria.
5. `src/services/userService.ts`
   - Asegurar que la creación inicial en `firestore_users` fuerce un rol no privilegiado (`student` o `teacher` pendiente de aprobación) y maneje la re-sincronización.
6. `src/services/api.ts` e `src/contexts/AuthContext.ts`
   - Asegurar la llamada a `auth.currentUser.getIdTokenResult(true)` tras el login o la verificación por correo electrónico para refrescar los Custom Claims en el estado local.
7. `firestore.rules` y `storage.rules`
   - Actualizar las definiciones de `isSignedIn()` e `isAdmin()`.

---

### 5. Reglas que Habría que Modificar

#### `firestore.rules` (Propuestas)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null && (
        request.auth.token.email_verified == true || 
        request.auth.token.role == 'admin'
      );
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isAdmin() {
      return request.auth != null && request.auth.token.role == 'admin';
    }

    function isTeacher() {
      return request.auth != null && (
        request.auth.token.role == 'teacher' || 
        request.auth.token.role == 'admin'
      );
    }

    // Regla especial para perfil de registro inicial de un usuario no verificado aún
    match /firestore_users/{id} {
      allow read: if isSignedIn();
      allow create: if request.auth != null && request.auth.uid == id &&
                   (!("role" in request.resource.data) || request.resource.data.role != "admin");
      allow update: if isSignedIn() && (isOwner(id) || isAdmin()) &&
                   (!("role" in request.resource.data) || request.resource.data.role == resource.data.role || isAdmin());
      allow delete: if isAdmin();
    }

    // ... resto de reglas sin cambios en su lógica interna
  }
}
```

#### `storage.rules` (Propuestas)

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    
    function isSignedIn() {
      return request.auth != null && (
        request.auth.token.email_verified == true || 
        request.auth.token.role == 'admin'
      );
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isAdmin() {
      return request.auth != null && request.auth.token.role == 'admin';
    }

    function isTeacher() {
      return request.auth != null && (
        request.auth.token.role == 'teacher' || 
        request.auth.token.role == 'admin'
      );
    }

    // ... resto de reglas respetando las modificaciones de la Fase 1.5
  }
}
```

---

### 6. Flujo de Registro Propuesto

```
1. Usuario completa formulario de registro (Estudiante/Profesor)
   │
   ▼
2. createUserWithEmailAndPassword(auth, email, password)
   │
   ▼
3. Firestore create: firestore_users/{uid}
   (Role enviado: "student" o "teacher"; Regla de Firestore bloquea "admin")
   │
   ▼
4. Cloud Function syncUserRole se activa:
   Setea Custom Claim { role: "student" / "teacher" } preservando otros claims
   │
   ▼
5. sendEmailVerification(user)
   │
   ▼
6. Estado del Usuario: NO VERIFICADO (email_verified == false)
   - Acceso a datos académicos/privados: DENEGADO por Security Rules
   - Acceso a su propio documento en firestore_users/{uid}: PERMITIDO
   │
   ▼
7. Usuario hace clic en el enlace de verificación en su correo
   │
   ▼
8. Inicio de sesión post-verificación -> getIdTokenResult(true)
   - email_verified: true
   - token.role: "student" / "teacher"
   - Acceso a la plataforma: PERMITIDO
```

---

### 7. Flujo de Login Propuesto

1. `signInWithEmailAndPassword(auth, email, password)`.
2. `auth.currentUser.reload()`.
3. Si `!emailVerified` (y no posee claim `admin`):
   - Muestra mensaje en pantalla: *"Debes verificar tu correo electrónico para acceder."*
   - Cierra la sesión en Firebase Auth (`signOut()`).
4. Si `emailVerified == true`:
   - Ejecuta `auth.currentUser.getIdTokenResult(true)` para obtener los Custom Claims actualizados.
   - Establece el usuario en `AuthContext`.
   - Redirige según `token.claims.role`:
     - `'admin'` → Dashboard de Administración.
     - `'teacher'` → Dashboard de Docente.
     - `'student'` → Dashboard de Estudiante.

---

### 8. Flujo de Roles

1. **Creación de Rol:**
   - Un nuevo registro asigna `role: "student"` o `role: "teacher"` en `firestore_users/{uid}`.
   - Las Firestore Rules impiden que el cliente envíe `role: "admin"`.
2. **Sincronización:**
   - La Cloud Function `syncUserRole` detecta la escritura en `firestore_users/{userId}`.
   - Obtiene los claims preexistentes con `admin.auth().getUser(userId)`.
   - Fusiona los claims: `setCustomUserClaims(userId, { ...existingClaims, role: newRole })`.
3. **Aprobación de Profesores:**
   - Para profesores, el documento incluye `approved: false`. Un administrador cambia `approved: true` en Firestore.
4. **Promoción a Admin por un Administrador Existente:**
   - Un administrador legítimo modifica el campo `role` a `"admin"` en `firestore_users/{targetUserId}`.
   - La Cloud Function actualiza los Custom Claims a `{ role: "admin" }`.
   - La próxima llamada a `getIdTokenResult(true)` en el cliente del usuario promovido le otorga permisos de administrador.

---

### 9. Migración Master Admin

#### Paso 1: Asignación de Bootstrap
Ejecutar una función de administración (o script de inicialización con Firebase Admin SDK) que asegure que el usuario con email `8aulainfinity8@gmail.com` posea el Custom Claim de administrador:
```typescript
const user = await admin.auth().getUserByEmail('8aulainfinity8@gmail.com');
await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
```

#### Paso 2: Verificación de JWT
Verificar que el token JWT del usuario contenga `claims.role === 'admin'`.

#### Paso 3: Retiro de Comprobación Hardcoded en Backend y Reglas
- Eliminar `request.auth.token.email.lower() == '8aulainfinity8@gmail.com'` en `firestore.rules` y `storage.rules`.
- Eliminar la lógica condicional por correo en `server.ts`.

#### Paso 4: Actualización en Frontend
- Configurar `AdminProtectedRoute.tsx` y `AuthContext.ts` para verificar `user.role === 'admin'` / `token.claims.role === 'admin'`.

---

### 10. Riesgos de Compatibilidad

1. **Bloqueo del Registro Inicial por `email_verified`:**
   - *Riesgo:* Si la regla de `firestore_users/{uid}` exigiera `email_verified == true`, un usuario recién creado en Auth no podría guardar su nombre o perfil inicial antes de verificar el correo.
   - *Mitigación:* Se añade una excepción explícita en `firestore_users/{id}` permitiendo `create` al titular del UID (`request.auth.uid == id`) para datos no administrativos incluso antes de verificar el email.
2. **Desfase de Claims en el Navegador del Usuario:**
   - *Riesgo:* Si un administrador promueve a un profesor y el navegador del profesor no refresca el token JWT, el motor de Security Rules rechazará las peticiones del profesor.
   - *Mitigación:* Implementar refresco forzado del token (`getIdToken(true)`) al detectar cambios de perfil o al iniciar sesión.
3. **Pérdida de Acceso de Master Admin Durante la Transición:**
   - *Riesgo:* Desplegar las Security Rules sin antes haber asignado el Custom Claim a `8aulainfinity8@gmail.com`.
   - *Mitigación:* Asignar y verificar el Custom Claim en Firebase Auth **antes** de desplegar la actualización de Security Rules.

---

### 11. Tests Planificados

- **T01:** Anonymous → Intentar leer/escribir en datos privados → **EXPECTED DENIED**
- **T02:** Unverified Student → Intentar leer cursos/mensajes/grabaciones → **EXPECTED DENIED**
- **T03:** Unverified Student → Crear su propio perfil inicial en `firestore_users/{uid}` → **EXPECTED ALLOWED**
- **T04:** Verified Student → Leer/Escribir sus propios datos de estudiante → **EXPECTED ALLOWED**
- **T05:** Verified Student → Intentar acceder a datos de administración → **EXPECTED DENIED**
- **T06:** Verified Student → Intentar operación de profesor → **EXPECTED DENIED**
- **T07:** Verified Teacher → Operación de profesor → **EXPECTED ALLOWED**
- **T08:** Verified Teacher → Operación de administración → **EXPECTED DENIED**
- **T09:** Verified Admin → Operación de administración → **EXPECTED ALLOWED**
- **T10:** Student → Intentar asignarse `role="admin"` en `firestore_users/{uid}` → **EXPECTED DENIED**
- **T11:** Teacher → Intentar asignarse `role="admin"` en `firestore_users/{uid}` → **EXPECTED DENIED**
- **T12:** Admin → Modificar rol de otro usuario en `firestore_users` → **EXPECTED ALLOWED**
- **T13:** Cambio de rol en `firestore_users` → Custom Claim actualizado en Firebase Auth.
- **T14:** Cambio de rol en `firestore_users` → Claims preexistentes no relacionados conservados en Firebase Auth.

---

### 12. Impacto Esperado en Firebase

- Cero cambios en la cuota o infraestructura de Firestore.
- Invocación transparente de la Cloud Function `syncUserRole` únicamente cuando cambie el campo `role` en un perfil de usuario.
- Evaluación directa de claims en el token JWT por parte del motor de Security Rules de Firestore y Storage (evaluación en memoria a nivel de request sin consultas adicionales a la base de datos).

---

### 13. Impacto Esperado en Costes

- **Costes de Firestore:** **$0 costo incremental**. Al evaluar los permisos usando Custom Claims en el token JWT, se evitan lecturas secundarias `get(/databases/.../documents/users/...)` en las Security Rules.
- **Costes de Cloud Functions:** **$0 costo incremental** (mismo volumen de invocaciones asociadas al trigger `onWrite`).
- **Resumen:** Mantenimiento del modelo $0 de coste incremental.

---

### 14. Plan de Rollback

En caso de detectarse alguna anomalía durante la implementación o pruebas de la Fase 2:
1. **Paso 1:** Revertir `firestore.rules` y `storage.rules` a la versión aprobada en la Fase 1.5 (reincorporando temporalmente el chequeo por email `8aulainfinity8@gmail.com`).
2. **Paso 2:** Revertir `server.ts` para mantener la inyección condicional de rol por email en los middlewares Express.
3. **Paso 3:** Revertir `functions/index.ts` a la versión anterior en caso de falla en la función `syncUserRole`.
