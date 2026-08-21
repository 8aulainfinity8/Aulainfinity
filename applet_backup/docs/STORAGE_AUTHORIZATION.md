# AULAINFINITY — MODELO DE AUTORIZACIÓN DE ALMACENAMIENTO SEGURO (FASE 7)

## 1. Arquitectura de Seguridad y Frontera Backend

AulaInfinity utiliza un modelo de autorización defensivo **Deny-by-Default** para el acceso a recursos privados en Firebase Storage (`course_materials`, `recordings`, `chat_attachments`).

### Flujo de Acceso:
```
[ Cliente React ] 
       │
       ▼ (1. Solicitud con Auth Bearer Token)
[ Backend Express (/api/storage/signed-url) ]
       │
       ▼ (2. Verificación de Token Firebase Auth + Custom Claims)
[ Admin Firebase SDK ]
       │
       ▼ (3. Comprobación de relación real en Firestore: enrolledCourseIds / taughtCourseIds / participants)
[ Firestore Database ]
       │
       ▼ (4. Generación de Signed URL temporal de v4 - expiración 15 min)
[ Firebase Storage Bucket ] ──► [ URL Firmada Segura devuelta al cliente ]
```

---

## 2. API Endpoints

### `POST /api/storage/signed-url`
- **Autenticación**: Obligatoria mediante middleware `authenticateUser` (Header `Authorization: Bearer <ID_TOKEN>`).
- **Body**:
  ```json
  {
    "path": "course_materials/math_101/syllabus.pdf",
    "action": "read",
    "contentType": "application/pdf"
  }
  ```
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "url": "https://storage.googleapis.com/...",
    "path": "course_materials/math_101/syllabus.pdf",
    "action": "read",
    "expiresAt": 1786940000000
  }
  ```
- **Respuesta de Rechazo (403 Forbidden)**:
  ```json
  {
    "success": false,
    "error": "Acceso denegado a este recurso de almacenamiento."
  }
  ```

---

## 3. Matriz de Reglas de Negocio por Recurso

| Recurso | Estudiante Matriculado | Estudiante NO Matriculado | Profesor Asignado & Aprobado | Profesor NO Asignado | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `course_materials/{courseId}/*` | **READ** | DENY | **READ / WRITE** | DENY | **ALL** |
| `recordings/{courseId}/*` | **READ** | DENY | **READ / WRITE** | DENY | **ALL** |
| `chat_attachments/{conversationId}/*` | **READ / WRITE** *(si participa)* | DENY | **READ / WRITE** *(si participa)* | DENY | **ALL** |
| `notes/{userId}/*` | **OWNER ONLY** | DENY | DENY | DENY | **ALL** |
| `receipts/{fileName}` | **OWNER ONLY** | DENY | DENY | DENY | **ALL** |

---

## 4. Prevención de Ataques e Inmunidad a Vulnerabilidades

1. **Ataques IDOR y Substring Matching**:
   - Queda estrictamente prohibida la verificación por coincidencia de subcadenas (`conversationId.includes(uid)` o `matches`).
   - El backend consulta autoritativamente el documento de la conversación en `firestore_conversations/{conversationId}` y verifica que el `uid` del token figure en el array `participants`.
2. **Protección contra Path Traversal**:
   - Todo path enviado a `canAccessStoragePath` que contenga `../`, `./`, `//` o `\` es rechazado inmediatamente (DENY).
3. **Inmunidad a Manipulación de Cliente**:
   - `role`, `uid`, `isApprovedForTutoring` y pertenencia a cursos se derivan **exclusivamente** del token autenticado y de Firestore en backend. El cliente no puede falsificar parámetros de autorización en el cuerpo de la petición.
4. **Deny-by-Default en Fallos**:
   - Ante cualquier excepción en Firestore, documento inexistente o estructura inválida de datos, el sistema devuelve `false` (Acceso Denegado).

---

## 5. Endurecimiento de `storage.rules`

Las reglas directas de Firebase Storage se han configurado para requerir autenticación de backend en recursos sensibles:

```rules
// Chat attachments: acceso restringido a Signed URLs emitidas por el backend
match /chat_attachments/{conversationId}/{fileName} {
  allow read, write: if isAdmin();
}

// Course materials: lectura restringida a Signed URLs de backend
match /course_materials/{courseId}/{fileName} {
  allow read: if isAdmin();
  allow write: if isApprovedTeacher() && maxFileSize(50);
}

// Class recordings: acceso restringido a Signed URLs de backend
match /recordings/{courseOrUserId}/{fileName} {
  allow read, write: if isAdmin();
}

// Resto del bucket: Deny by default
match /{allPaths=**} {
  allow read: if isAdmin();
  allow write: if false;
}
```
