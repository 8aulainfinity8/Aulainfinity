# Guía de Arquitectura y Despliegue: Aulainfinity

Este documento es una guía técnica completa que detalla la arquitectura de la aplicación, sus funcionalidades principales, y los pasos necesarios para configurar, migrar y desplegar Aulainfinity en un entorno de producción utilizando la suite de Firebase.

## 1. Visión General de la Aplicación y Funcionalidades

### Propósito

Aulainfinity es una plataforma de e-learning diseñada para estudiantes de ESO, Bachillerato y EBAU. Ofrece videotutoriales, herramientas de estudio basadas en IA, y soporte personalizado para ayudar a los estudiantes a alcanzar sus metas académicas en asignaturas clave como Matemáticas, Física y Química.

### Arquitectura Tecnológica

La aplicación se basa en un stack moderno y escalable:

-   **Frontend:** Una Single-Page Application (SPA) construida con **React** y **TypeScript**, utilizando **Vite** para el desarrollo y empaquetado. El enrutado se gestiona con `react-router-dom` y la gestión de estado del servidor con `@tanstack/react-query`.
-   **Backend y Base de Datos:** Se utiliza la suite de **Firebase** como BaaS (Backend as a Service):
    -   **Firebase Hosting:** Para el despliegue del frontend.
    -   **Firebase Authentication:** Para la gestión de usuarios (registro, inicio de sesión).
    -   **Cloud Firestore:** Como base de datos NoSQL para todos los datos de la aplicación.
    -   **Cloud Functions for Firebase:** Para ejecutar lógica de backend segura, principalmente para proteger las claves de API de la IA de Gemini.
-   **Inteligencia Artificial:** El modelo **Gemini** de Google se utiliza a través del SDK `@google/genai` en el backend para potenciar funcionalidades como el Tutor IA, resúmenes de vídeo y generación de quizzes.

### Flujo y Funcionalidades Principales

#### Flujo del Estudiante

1.  **Registro/Inicio de Sesión:** Los estudiantes se registran con su nombre, correo, teléfono y eligen su curso inicial. El sistema utiliza Firebase Auth para la seguridad.
2.  **Dashboard (Panel de Control):** Al iniciar sesión, el estudiante ve un resumen de su progreso, los vídeos vistos recientemente y las métricas clave. Si no está suscrito, se le presenta un panel con contenido gratuito y una llamada a la acción para suscribirse.
3.  **Navegación de Cursos:** A través de la barra lateral, el estudiante accede a los cursos en los que está matriculado, navega por asignaturas y bloques temáticos para encontrar los vídeos.
4.  **Página de Vídeo Interactiva:** Es el núcleo del aprendizaje. Aquí el estudiante puede:
    -   Visualizar el vídeo (o las partes de la lección).
    -   Generar un **resumen con IA** de los puntos clave.
    -   Hacer un **quiz** para autoevaluarse.
    -   Acceder a **recursos adicionales** (PDFs).
    -   Leer y escribir **comentarios**.
    -   Generar **preguntas de práctica** con IA.
5.  **Herramientas IA:**
    -   **Tutor IA:** Un chat conversacional donde el estudiante puede hacer preguntas, pedir explicaciones e incluso subir una foto de un ejercicio para obtener ayuda.
    -   **Planes de Estudio IA:** Desde la agenda, al añadir un examen y seleccionar los temas, la IA puede generar un plan de estudio personalizado y distribuido en el tiempo.
6.  **Organización y Progreso:**
    -   **Mi Agenda:** Un calendario para añadir fechas de exámenes y visualizar el plan de estudio.
    -   **Mi Progreso:** Una vista detallada de las estadísticas de aprendizaje, resultados de quizzes y las **insignias (gamificación)** obtenidas por alcanzar hitos.
7.  **Soporte y Comunidad:**
    -   **Chat con Admin:** Un chat directo con los administradores para resolver dudas sobre la plataforma.
    -   **Peticiones y Tutorías:** Formularios para solicitar nuevos temas de vídeo o pedir tutorías personalizadas.

#### Flujo del Administrador

1.  **Inicio de Sesión Seguro:** Acceso a través de una ruta y credenciales separadas.
2.  **Dashboard de Admin:** Vista general de las métricas de la plataforma: nuevos registros, suscripciones, peticiones pendientes, etc.
3.  **Gestión de Contenido:** Una interfaz visual para añadir, editar y eliminar cursos, asignaturas, bloques temáticos y vídeos. Permite gestionar los quizzes de cada vídeo.
4.  **Gestión de Usuarios:** Listado de todos los estudiantes, con la capacidad de buscar, ver su progreso, y activar/desactivar sus suscripciones.
5.  **Comunicación y Soporte:**
    -   **Chat con Estudiantes:** Interfaz para gestionar todas las conversaciones con los estudiantes.
    -   **Revisión de Peticiones:** Paneles para gestionar las solicitudes de contenido y de tutorías.
6.  **Configuración General:** Panel para modificar ajustes de la aplicación como el precio de la suscripción, el número de Bizum o el horario de tutorías.

---

## 2. Optimizaciones de Seguridad y Rendimiento para Producción

Para garantizar una transición robusta y segura hacia entornos de producción, la arquitectura incluye las siguientes medidas:

### Control de Visibilidad de Herramientas de Desarrollo
La herramienta visual de depuración `FirestoreTestViewer` se ha configurado para renderizarse **únicamente** en modo de desarrollo:
```tsx
{import.meta.env.DEV && <FirestoreTestViewer />}
```
Esto garantiza que las interfaces de prueba y depuración queden completamente excluidas en el build de producción.

### Optimización y Truncado de Logs de Datos
Para evitar la saturación de la consola del navegador y fugas involuntarias de información en entornos productivos, se ha implementado una función de formateo y truncado para la serialización de detalles en logs de APIs:
```typescript
export const formatDetailsForLog = (details: any, maxChars: number = 150): string => {
    if (!details) return '';
    const rawStr = JSON.stringify(details);
    if (rawStr.length > maxChars) {
        return `${rawStr.substring(0, maxChars)}... [Truncado, longitud total: ${rawStr.length} chars]`;
    }
    return rawStr;
};
```
Esta función se aplica automáticamente en `logApiFlow` dentro de `src/services/api.ts`.

### Configuración Avanzada de Administradores por Entorno
La asignación de correos con rol de administrador se gestiona de forma centralizada y transparente mediante la constante `ADMIN_EMAILS` en `src/constants/auth.ts`:
- **Variable de Entorno (`VITE_ADMIN_EMAILS`):** Permite especificar múltiples administradores separados por comas (ej. `email1@gmail.com,email2@gmail.com`) en tu configuración de producción.
- **Fallback Automático:** Si no se define la variable de entorno, el sistema utiliza por defecto el correo master: `8aulainfinity8@gmail.com`.

---

## 3. Guía de Migración y Despliegue (Paso a Paso)

Esta sección detalla los pasos para llevar la aplicación desde un entorno de desarrollo local con datos simulados a un entorno de producción completamente funcional.

### Fase 0: Entorno de Desarrollo Local

**Objetivo:** Configurar el proyecto para poder ejecutarlo localmente.

1.  **Instalar Dependencias:**
    -   Abre una terminal en la raíz del proyecto y ejecuta:
        ```bash
        npm install
        ```

2.  **Configurar Variables de Entorno:**
    -   Crea una copia del archivo `vite-env.d.ts` y renómbrala a `.env`.
    -   Abre el nuevo archivo `.env` y rellena las variables `VITE_FIREBASE_*` con las credenciales de tu proyecto de Firebase (ver Fase 1).

3.  **Ejecutar el Servidor de Desarrollo:**
    -   Ejecuta el siguiente comando para iniciar la aplicación en modo de desarrollo:
        ```bash
        npm run dev
        ```
    -   La aplicación estará disponible en `http://localhost:5173` (o el puerto que indique Vite).

### Fase 1: Configuración del Proyecto Firebase

**Objetivo:** Crear y configurar el proyecto de Firebase que alojará todos los servicios.

1.  **Crear Proyecto en Firebase:**
    -   Visita [Firebase Console](https://console.firebase.google.com/).
    -   Crea un nuevo proyecto (e.g., `aulainfinity-prod`).

2.  **Añadir Aplicación Web:**
    -   En el panel de tu proyecto, haz clic en el ícono `</>` para "Añadir aplicación".
    -   Registra la aplicación con un apodo (e.g., `aulainfinity-web`).
    -   Firebase te proporcionará un objeto `firebaseConfig`. **Copia sus valores**.

3.  **Integrar `firebaseConfig` en el Entorno:**
    -   **ACCIÓN:** Abre tu archivo `.env` (creado en la Fase 0) y pega los valores correspondientes de `firebaseConfig` en las variables `VITE_FIREBASE_*`. No guardes estas claves en el código fuente.

4.  **Activar Servicios en la Consola de Firebase:**
    -   **Authentication:**
        -   Ve a la pestaña `Authentication` -> `Sign-in method`.
        -   Habilita el proveedor **Correo electrónico/Contraseña**.
    -   **Firestore:**
        -   Ve a `Firestore Database` -> `Crear base de datos`.
        -   Inicia en **modo de prueba**. (La seguridad se configurará en la Fase 5).
        -   Selecciona tu región de servidor (e.g., `europe-west`).

### Fase 2: Migración de Datos y Lógica a Firestore

**Objetivo:** Reemplazar toda la lógica de la base de datos simulada con llamadas reales a Cloud Firestore. El punto central de esta migración es el archivo `src/services/api.ts`.

1.  **Estructura de Datos en Firestore:**
    -   La aplicación utiliza un modelo de **colecciones de nivel superior** para cada tipo de dato principal:
        -   `users`: Almacena los perfiles de los estudiantes. El ID de cada documento será el `uid` de Firebase Authentication.
        -   `courses`: Almacena la estructura de cursos, asignaturas y vídeos.
        -   `comments`, `topicRequests`, `tutoringRequests`, etc.: Colecciones separadas para cada tipo de contenido dinámico.

2.  **Reescritura de `src/services/api.ts`:**
    -   El archivo ha sido modificado para importar y utilizar las funciones del SDK de Firestore (`getDocs`, `getDoc`, `addDoc`, `updateDoc`, `deleteDoc`, `arrayUnion`, etc.).

    -   **Lógica para Datos Anidados (Ej. `addVideo`):** Firestore no permite modificar elementos de un array anidado directamente. La estrategia implementada es:
        1.  Leer el documento principal (el curso).
        2.  Modificar el array de asignaturas/bloques/vídeos en memoria.
        3.  Escribir el array completo de vuelta al documento con `updateDoc`.
        Esta operación es atómica a nivel de documento.

### Fase 3: Migración de Autenticación a Firebase Auth

**Objetivo:** Reemplazar el sistema de inicio de sesión simulado por el servicio seguro de Firebase Authentication.

1.  **Contexto de Autenticación (`src/contexts/AuthContext.ts`):**
    -   El componente `AuthProvider` utiliza `onAuthStateChanged` para escuchar los cambios de estado de autenticación de Firebase en tiempo real.
    -   Cuando un usuario inicia sesión, `onAuthStateChanged` devuelve el `FirebaseUser`. Se utiliza su `uid` para hacer una consulta a la colección `users` en Firestore y obtener el perfil completo del estudiante.

2.  **Página de Inicio de Sesión (`src/components/LoginPage.tsx`):**
    -   **Inicio de Sesión:** La función `onStudentLoginSubmit` ahora llama a `signInWithEmailAndPassword(auth, email, password)`.
    -   **Registro:** El registro es un proceso de dos pasos:
        1.  `onRegister` primero llama a `createUserWithEmailAndPassword(auth, email, password)` para crear el usuario en Firebase Authentication.
        2.  Si tiene éxito, utiliza el `uid` del nuevo usuario para llamar a `api.createUserProfile()`, que crea el documento correspondiente en la colección `users` de Firestore.
    -   **Recuperación:** Se utiliza `sendPasswordResetEmail(auth, email)`.

### Fase 4: Despliegue del Backend Seguro (Cloud Functions)

**Objetivo:** Proteger la clave de API de Gemini para que nunca se exponga en el frontend.

1.  **Inicializar Firebase Functions:**
    -   Abre una terminal en la raíz del proyecto.
    -   Ejecuta `firebase init functions`.
    -   Elige **TypeScript**, y **sí** a instalar dependencias.

2.  **Configurar la Clave API de Gemini:**
    -   Ejecuta el siguiente comando en tu terminal, reemplazando el placeholder con tu clave real. Esto la almacena de forma segura en el entorno de Google Cloud.
        ```bash
        firebase functions:config:set gemini.key="TU_CLAVE_API_DE_GEMINI_AQUI"
        ```

3.  **Desplegar el Código de la Función:**
    -   Copia el código del archivo `functions/index.ts` de este proyecto en el archivo `functions/src/index.ts` que se ha creado.
    -   Navega a la carpeta de funciones: `cd functions`.
    -   Instala las dependencias necesarias: `npm install @google/genai`.
    -   Vuelve a la raíz del proyecto: `cd ..`.
    -   Despliega únicamente las funciones con el comando:
        ```bash
        firebase deploy --only functions
        ```

4.  **Verificar el Frontend:**
    -   El archivo `src/services/geminiService.ts` ya está configurado para llamar a estas Cloud Functions desplegadas. No se requieren más cambios en el código del cliente.

### Fase 5: Despliegue del Frontend y Pasos Finales

**Objetivo:** Publicar la aplicación web y aplicar las reglas de seguridad finales.

1.  **Inicializar Firebase Hosting:**
    -   En la raíz del proyecto, ejecuta `firebase init hosting`.
    -   Directorio público: **`dist`**.
    -   Configurar como "single-page app": **Sí**.
    -   No sobrescribir `index.html`.

2.  **Construir el Frontend para Producción:**
    -   Ejecuta el comando de build para generar la carpeta `dist` optimizada:
        ```bash
        npm run build
        ```

3.  **Desplegar la Aplicación:**
    -   Ejecuta el comando de despliegue final:
        ```bash
        firebase deploy
        ```
    -   Firebase te proporcionará la URL pública de tu aplicación.

4.  **¡CRÍTICO! Configurar Reglas de Seguridad de Firestore:**
    -   Ve a tu consola de Firebase -> `Firestore Database` -> Pestaña `Reglas`.
    -   Reemplaza las reglas de prueba por unas reglas de producción. Un punto de partida seguro es:
        ```
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            // Los usuarios solo pueden leer/escribir sus propios datos de perfil.
            match /users/{userId} {
              allow read, write: if request.auth.uid == userId;
            }

            // Todos los usuarios autenticados pueden leer los cursos.
            match /courses/{courseId} {
              allow read: if request.auth != null;
            }

            // Los usuarios autenticados pueden leer y crear comentarios,
            // pero solo pueden editar o borrar los suyos.
            match /comments/{commentId} {
              allow read, create: if request.auth != null;
              allow update, delete: if request.auth.uid == resource.data.author.id;
            }
            
            // Reglas para el resto de colecciones. Sé tan restrictivo como sea posible.
            match /topicRequests/{docId} {
                allow read, create: if request.auth != null;
                // Solo los admins pueden modificar o borrar
                allow update, delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
            }
            
            match /tutoringRequests/{docId} {
                allow read, create: if request.auth != null;
                allow update, delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
            }
            
            match /agendaEvents/{docId} {
                allow read, write: if request.auth.uid == resource.data.studentId;
            }
            
            // Los quizzes solo los pueden leer los usuarios autenticados. La escritura se hace desde el panel de admin (backend).
            match /quizzes/{docId} {
                allow read: if request.auth != null;
            }
            
            match /studentAnswers/{docId} {
                allow read, create: if request.auth.uid == resource.data.studentId;
            }
            
            // Solo los usuarios autenticados pueden leer la config. Solo los admins la pueden escribir.
            match /config/main {
                allow read: if request.auth != null;
                allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
            }
          }
        }
        ```
    -   **Publica** estas reglas. Tu base de datos ahora está protegida.

Tu aplicación Aulainfinity está ahora migrada y desplegada en un entorno de producción.
