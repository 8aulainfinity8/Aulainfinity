# 🚀 Lista de Verificación Pre-Lanzamiento (Checklist de Producción) - AulaInfinity

Esta checklist contiene las tareas críticas requeridas para desplegar **AulaInfinity** a un entorno de producción de manera segura, performante y confiable.

---

## 🔐 1. Configuración de Seguridad y Autenticación

- [ ] **Consola de Firebase (Authentication)**
  - [ ] Verificar que el método de inicio de sesión **Google Sign-In** esté habilitado (*Authentication > Sign-in method > Google*).
  - [ ] Añadir los dominios autorizados de producción (*Authentication > Settings > Authorized domains*) incluyendo el dominio personalizado de AulaInfinity.
  - [ ] Deshabilitar o restringir proveedores de autenticación no utilizados.

- [ ] **Reglas de Seguridad de Firestore (`firestore.rules`)**
  - [ ] Revisar y desplegar la versión final de `firestore.rules` asegurando que solo usuarios autenticados puedan leer/escribir sus propios datos o los de sus cursos.
  - [ ] Verificar que las rutas administrativas (`/admin/...`) requieran validación de rol `admin` o email maestro.
  - [ ] Confirmar que las reglas prevengan la modificación no autorizada de saldos de créditos o roles de usuario.

- [ ] **Reglas de Firebase Storage (`storage.rules`)**
  - [ ] Configurar permisos de lectura pública únicamente para recursos estáticos o de cursos, restringiendo la subida de archivos a usuarios validados.
  - [ ] Limitar el tamaño máximo de archivo en las subidas desde el cliente.

---

## ⚙️ 2. Variables de Entorno y Claves API

- [ ] **Secretos de Servidor (Server-Side Secrets)**
  - [ ] `GEMINI_API_KEY`: Configurar la clave API de Gemini en las variables de entorno del servidor sin exponerla al cliente.
  - [ ] `FIREBASE_SERVICE_ACCOUNT` / Credentials: Asegurar que las credenciales de servicio de Firebase Admin estén configuradas adecuadamente en las variables del contenedor.

- [ ] **Variables de Cliente (`VITE_*`)**
  - [ ] Validar que ninguna clave secreta de API o token privado contenga el prefijo `VITE_`.
  - [ ] Verificar que las variables públicas apuntan a las URLs de producción correspondientes (`VITE_APP_URL`, `VITE_FIREBASE_API_KEY`, etc.).

---

## 📦 3. Rendimiento y Optimización de Bundles

- [ ] **Optimización del Build Frontend**
  - [ ] Ejecutar `npm run build` y comprobar que no existan advertencias críticas de tamaño de chunk.
  - [ ] Verificar el Lazy Loading y Code Splitting en rutas pesadas (`AdminUsersPage`, `AdminContentPage`, editor de videos, etc.).
  - [ ] Inspeccionar que los assets estáticos (imágenes, fuentes, iconos de Lucide) estén comprimidos y servidos eficientemente.

- [ ] **Servidor Backend y Cache**
  - [ ] Verificar que Express utilice compresión (`gzip` / `brotli`) para respuestas JSON y assets estáticos.
  - [ ] Confirmar encabezados HTTP de caché adecuados para archivos estáticos inmutables (`Cache-Control: public, max-age=31536000, immutable`).

---

## 🩺 4. Pruebas Funcionales y Validaciones

- [ ] **Pruebas de Flujo Completo de Usuario**
  - [ ] **Registro e Inicio de Sesión**: Probar Google Sign-In y Email/Password en cuentas de Estudiante, Profesor y Administrador.
  - [ ] **Suscripciones y Créditos**: Probar la lógica de cambio de planes y deducción/recarga de créditos de tutoría.
  - [ ] **Gestión de Alumnos**: Verificar la vista de administración de alumnos, asignación de cursos, filtros y paginación/scroll sin anomalías.
  - [ ] **Aprobación de Profesores**: Validar el flujo de solicitud, revisión y activación de docentes.

- [ ] **Verificación Técnica (Linter & Types)**
  - [ ] Executar `npm run lint` (validación de TypeScript sin errores) antes de cada pipeline de despliegue.
  - [ ] Confirmar la compatibilidad en dispositivos móviles y navegadores principales (Chrome, Safari, Firefox, Edge).

---

## 🌐 5. Infraestructura y Despliegue (Cloud Run / Hosting)

- [ ] **Puerto y Routing de Contenedor**
  - [ ] Verificar que el servidor escuche en el puerto `3000` y host `0.0.0.0`.
  - [ ] Confirmar la configuración del Reverse Proxy (Nginx / Cloud Run) para manejar fallback SPA (`index.html`) en rutas dinámicas de React Router.

- [ ] **Políticas de CORS**
  - [ ] Revisar la configuración de CORS (`cors.json` / Express CORS middleware) para restringir peticiones únicamente al dominio oficial de la aplicación.

- [ ] **Monitoreo y Registros**
  - [ ] Configurar Cloud Logging o monitoreo de errores (Sentry / Google Cloud Monitoring) para captura de excepciones en producción.
