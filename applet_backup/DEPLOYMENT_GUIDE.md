# Guía de Despliegue a Producción: AulaInfinity

Esta guía detalla los pasos para llevar esta aplicación desde el entorno de desarrollo (Mock Data) a un entorno real de producción usando **Firebase** y **Google Cloud**.

## Requisitos Previos

1.  Una cuenta de Google.
2.  Node.js instalado en tu ordenador.
3.  Una **API Key de Gemini** válida (obtenida en Google AI Studio).

---

## Paso 1: Configuración en Firebase Console

1.  Ve a [Firebase Console](https://console.firebase.google.com/).
2.  Crea un nuevo proyecto (ej. `aulainfinity-prod`).
3.  **Authentication:**
    *   Ve al menú "Authentication" > "Sign-in method".
    *   Habilita **Correo electrónico/Contraseña**.
4.  **Firestore Database:**
    *   Ve al menú "Firestore Database".
    *   Crea una base de datos (comienza en modo de prueba o producción).
    *   Selecciona una ubicación geográfica cercana a tus usuarios (ej. `eur3` para Europa).
5.  **Storage (Opcional):** Si planeas permitir subir imágenes reales de perfil o archivos.
6.  **Plan de Precios (Blaze):**
    *   Para usar **Cloud Functions** (necesario para proteger tu API Key de Gemini), debes cambiar el plan del proyecto a **Blaze (Pago por uso)**. *Nota: Google ofrece una capa gratuita generosa, pero se requiere tarjeta para activar las funciones.*

---

## Paso 2: Configuración del Entorno Local

1.  Instala las herramientas de Firebase:
    ```bash
    npm install -g firebase-tools
    ```
2.  Inicia sesión en Firebase:
    ```bash
    firebase login
    ```
3.  Inicializa Firebase en la raíz del proyecto:
    ```bash
    firebase init
    ```
    *   Selecciona: **Firestore**, **Functions**, **Hosting**, **Emulators** (opcional).
    *   Usa el proyecto que creaste en el paso 1.
    *   **Firestore rules:** Acepta los valores por defecto (`firestore.rules`).
    *   **Functions:** Selecciona "TypeScript" (recomendado) o "JavaScript". Si usas el código existente en la carpeta `functions/`, selecciona "No" a sobrescribir si ya tienes el código.
    *   **Hosting:**
        *   Directorio público: `dist`
        *   Configurar como SPA (Single Page App): **Sí**
        *   Deploy automático con GitHub: (Opcional).

---

## Paso 3: Configuración de Secretos (API Key)

Para proteger tu clave de Gemini, no debes incluirla en el código del frontend. Debes configurarla en el entorno de Cloud Functions.

```bash
cd functions
firebase functions:config:set gemini.key="TU_API_KEY_DE_GOOGLE_AI_STUDIO"
```

---

## Paso 4: Migración de Datos (Seed Database)

Actualmente, la app usa datos falsos (`src/data/`). Debes subir estos datos a Firestore.

1.  Crea un script temporal (ej. `scripts/uploadData.js`) usando `firebase-admin`.
2.  Lee los archivos de `src/data/` e insértalos en las colecciones correspondientes (`users`, `courses`, `videos`, etc.).
3.  Ejecuta el script una vez para poblar tu base de datos real.

---

## Paso 5: Actualizar el Código Frontend (`src/services/api.ts`)

Actualmente, `src/services/api.ts` usa `mockDatabase`. Debes cambiarlo para usar Firestore y Cloud Functions.

1.  Abre `src/services/firebase.ts` y reemplaza `firebaseConfig` con la configuración real de tu proyecto (disponible en la consola de Firebase > Configuración del proyecto).
2.  Abre `src/services/api.ts`:
    *   Elimina o comenta la línea: `const mockApi = await import('./mockDatabase');`
    *   Reescribe las funciones para usar `db.collection(...)` y `functions.httpsCallable(...)`.

**Ejemplo de cambio en `api.ts`:**

*Antes (Mock):*
```typescript
export const getTutorResponse = async (history, image) => {
   // Lógica cliente insegura con API Key expuesta
}
```

*Después (Producción):*
```typescript
import { functions } from './firebase';

export const getTutorResponse = async (history, image) => {
    const askTutor = functions.httpsCallable('askTutor');
    const result = await askTutor({ history, image });
    return result.data.text;
}
```

---

## Paso 6: Despliegue

1.  **Construir el Frontend:**
    ```bash
    npm run build
    ```
    Esto creará la carpeta `dist` optimizada.

2.  **Desplegar Funciones y Hosting:**
    ```bash
    firebase deploy
    ```

3.  Firebase te dará una URL (ej. `https://aulainfinity-prod.web.app`). ¡Tu app ya está en vivo!

---

## Resumen de Archivos Clave a Modificar

*   `src/services/firebase.ts`: Poner credenciales reales.
*   `src/services/api.ts`: Cambiar lógica Mock -> Firebase SDK.
*   `functions/index.js`: Asegurarse de que las funciones coincidan con lo que espera el frontend.
