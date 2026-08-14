# 🚀 Guía de Migración y Despliegue de AulaInfinity (De AI Studio a Producción)
## — Edición Especial para Principiantes ("Para Dummies") —

¡Hola! Si estás leyendo esto, es porque tienes una aplicación increíble terminada en Google AI Studio y quieres dar el emocionante paso de **subirla a internet con tu propio enlace real** para que cualquier estudiante pueda ingresar.

No te preocupes si nunca has usado una línea de comandos, si no sabes qué es una base de datos o si te asusta la palabra "servidor". **Esta guía está escrita en cristiano y diseñada específicamente para personas que parten desde cero absoluto.** Iremos paso a paso, clic a clic y comando a comando.

---

## 🛠️ PASO 1: Descargar los programas que necesitas (Instalar el taller)

Para trabajar con la aplicación en tu ordenador personal, necesitas instalar tres programas gratuitos y de total confianza. Hazlo en este orden:

### 1. El editor de código: **Visual Studio Code (VS Code)**
Es el programa donde verás y editarás los archivos de tu web.
- **¿De dónde se descarga?** Entra en [https://code.visualstudio.com/](https://code.visualstudio.com/)
- **¿Cómo se instala?** Haz clic en el botón azul de descarga para tu sistema operativo (Windows o Mac), abre el instalador descargado y haz clic en "Siguiente" o "Siguiente" a todo. Deja las opciones por defecto y dale a "Finalizar".

### 2. El motor de ejecución: **Node.js**
Es el motor invisible que permite que tu ordenador entienda el código JavaScript/TypeScript y ejecute los comandos de desarrollo.
- **¿De dónde se descarga?** Entra en [https://nodejs.org/](https://nodejs.org/)
- **¿Qué versión elijo?** Descarga siempre la opción que tenga las siglas **LTS** (es la versión más estable y segura).
- **¿Cómo se instala?** Igual que el anterior, abre el instalador, haz clic en "Siguiente" a todo, dale permisos de administrador si te los pide y finaliza la instalación.

---

## 📦 PASO 2: Descargar el código de tu aplicación

Ahora que tienes los programas listos, descarguemos la aplicación desde el panel de AI Studio a tu ordenador.

1. **Exportar el proyecto:** En la barra superior o en el menú de ajustes de la aplicación en Google AI Studio, busca la opción **Export (Exportar)** o **GitHub/ZIP**. Selecciona **Download ZIP (Descargar archivo ZIP)**.
2. **Crear una carpeta limpia:** En el **Escritorio** de tu ordenador, crea una carpeta nueva y llámala exactamente `aulainfinity`.
3. **Extraer los archivos:** Ve a tu carpeta de descargas, abre el archivo `.zip` que acabas de descargar de AI Studio, copia todo su contenido y **pégalo dentro** de la carpeta `aulainfinity` que acabas de crear en tu escritorio.

---

## 🖥️ PASO 3: Abrir tu proyecto y entender "La Terminal"

Aquí es donde empezamos a sentirnos verdaderos programadores.

1. Abre el programa **Visual Studio Code** que instalamos en el Paso 1.
2. En la barra superior de VS Code, haz clic en **File** (Archivo) ➔ **Open Folder...** (Abrir carpeta).
3. Busca en tu escritorio la carpeta `aulainfinity`, haz clic sobre ella y presiona **Seleccionar carpeta**. Verás que en la barra izquierda aparece la lista con todos los archivos de tu aplicación.
4. **Abrir la Terminal:** La terminal (o consola) es una ventana donde escribimos instrucciones de texto directamente a tu ordenador. 
   - Para abrirla, ve al menú superior de VS Code y haz clic en **Terminal** ➔ **New Terminal** (Nueva terminal).
   - Se abrirá una sección negra en la parte inferior de VS Code con una línea de texto que termina en un símbolo `$` o `>`. ¡Ese es el sitio donde introduciremos todos los comandos!

---

## 🔥 PASO 4: Crear tu base de datos y servidor en la nube (Google Firebase)

Firebase es una plataforma de Google que nos dará alojamiento web gratuito y una base de datos segura en la nube.

1. Abre tu navegador web (Google Chrome, Edge, Safari...) e ingresa a [https://console.firebase.google.com/](https://console.firebase.google.com/).
2. Inicia sesión con tu cuenta de Gmail de siempre.
3. Haz clic en el botón grande que dice **Crear un proyecto** (o *Add project*).
   - Ponle como nombre `aulainfinity-app`.
   - Dale a "Continuar".
   - Desactiva la casilla de *Google Analytics* (no la necesitamos por ahora y simplificará la creación).
   - Haz clic en **Crear proyecto** y espera unos segundos. Cuando termine, pulsa **Continuar**.
4. **Habilitar Inicio de Sesión (Authentication):**
   - En el menú lateral izquierdo de Firebase, ve a **Compilación** (o *Build*) ➔ **Authentication**.
   - Haz clic en el botón **Comenzar** (*Get started*).
   - En la lista de métodos de inicio de sesión, haz clic en **Correo electrónico/Contraseña** (*Email/Password*).
   - Activa el primer interruptor (Habilitar) y haz clic en **Guardar**.
5. **Crear la Base de Datos Histórica (Firestore):**
   - En el menú lateral izquierdo de la consola de Firebase, haz clic en **Firestore Database**.
   - Haz clic en el botón **Crear base de datos** (*Create database*).
   - En el paso de ubicación geográfica de tu servidor, elige uno cercano (por ejemplo, `eur3 (europe-west)` si estás en España/Europa, o uno de USA si estás en América). Dale a Siguiente.
   - En la pestaña de seguridad, selecciona **Comenzar en modo de prueba** (*Start in test mode*). *(No te preocupes, esto es temporal para que puedas conectarte de inmediato, luego aplicaremos códigos de seguridad)*.
   - Haz clic en **Habilitar** (*Enable*).
6. **⚠️ IMPRESCINDIBLE: Cambiar al Plan Blaze (Pago por uso)**
   - Tu aplicación utiliza un "cerebro artificial" (el modelo Gemini). Para que tu web pueda comunicarse de forma ultrasegura con Gemini a través de métodos modernos de Firebase (Cloud Functions), **Google te exige de forma obligatoria que tu proyecto esté en el "Plan Blaze"**.
   - **No tengas miedo:** el Plan Blaze es de "pago por uso", pero Google te ofrece una **fórmula gratuita diaria gigantesca**. Para una web educativa pequeña o mediana de estudiantes, el coste mensual de Firebase suele ser de **0,00 €** (cero euros). Sin embargo, para evitar abusos corporativos, te pedirán que registres una tarjeta de débito/crédito.
   - **¿Cómo se activa?** En la esquina inferior izquierda de tu consola de Firebase, verás un texto que dice *Spark Plan (Gratis)*. Al lado de él hay un botón que dice **Upgrade** (Mejorar) o **Cambiar plan de precios**. Haz clic en él, selecciona el **Plan Blaze**, rellena los pasos de facturación segura de Google y confirma el cambio.
   - *Consejo pro:* Puedes configurar alertas de presupuesto en Google Cloud si quieres tener el 100% de la tranquilidad de que nunca pasarás de cierta cantidad (por ejemplo, enviar un correo si consumes más de 1€).

---

## 🔗 PASO 5: Conectar tu ordenador personal con tu cuenta de Firebase

Volvamos a la terminal negra que abrimos en VS Code (Paso 3, punto 4). Copiaremos y pegaremos los siguientes comandos uno por uno presionando la tecla **Enter** para ejecutarlos.

### 1. Instalar el asistente de Firebase en tu PC:
Copia y pega este comando en la terminal y pulsa Enter:
```bash
npm install -g firebase-tools
```
*Nota para Mac/Linux:* Si el comando anterior te da un error que menciona la palabra `permission` o `EACCES`, prueba ejecutándolo con permisos del sistema escribiendo esto en su lugar:
```bash
sudo npm install -g firebase-tools
```
*(Si te pide contraseña, escríbela. Es normal que en la terminal no se visualicen los caracteres de la contraseña mientras los escribes por seguridad, tú dale a Enter al terminar).*

### 2. Iniciar sesión en tu cuenta de Google:
Copia y pega este comando y presiona Enter:
```bash
firebase login
```
Esto abrirá automáticamente una pestaña en tu navegador web. Selecciona tu cuenta de Gmail (la misma donde creaste el proyecto de Firebase), acepta los permisos que te indica y una vez que veas un mensaje de éxito en verde de "Success!", puedes cerrar esa pestaña y volver a VS Code.

### 3. Vincular el proyecto:
Copia y pega este comando y presiona Enter:
```bash
firebase init
```
Esto iniciará un asistente con preguntas en inglés en tu consola. Sigue exactamente estas indicaciones:
1. **¿Qué servicios quieres configurar?** Verás una lista de opciones. Usa las **flechas arriba/abajo** de tu teclado para moverte por ella, y usa la **barra espaciadora** de tu teclado para seleccionar los siguientes (aparecerá un asterisco `*` cuando estén marcados):
   - `Firestore: Configure security rules and indexes...`
   - `Functions: Configure a Cloud Functions directory...`
   - `Hosting: Configure files for Firebase Hosting...`
   Una vez seleccionados esos 3, pulsa la tecla **Enter**.
2. **Project Setup:** Elige la opción `Use an existing project` (Usar un proyecto existente) y pulsa Enter.
3. Elige el proyecto que creaste en la consola de Firebase (`aulainfinity-app`) y pulsa Enter.
4. **Firestore Setup:**
   - ¿Qué archivo usar de reglas? Deja el valor por defecto (`firestore.rules`) y presiona Enter.
   - ¿Qué archivo usar de índices? Deja el valor por defecto y presiona Enter.
5. **Functions Setup:**
   - ¿Qué lenguaje quieres usar? Mueve la flecha para elegir **TypeScript** y presiona Enter.
   - ¿Usar ESLint? Escribe `Y` (Sí) o presiona Enter directamente.
   - ¿Sobrescribir el archivo `package.json` o `index.ts`? **⚠️MUY IMPORTANTE:** Si el asistente te pregunta si deseas sobrescribir (*Overwrite*) archivos de funciones que ya vienen en el proyecto original, escribe **`N`** (No) y dale a Enter. Queremos mantener las funciones de IA que la app ya tiene preparadas en el código.
   - ¿Instalar dependencias de inmediato con npm? Presiona `Y` (Sí) y presiona Enter. Tardará un minuto instalando los módulos de funciones.
6. **Hosting Setup:**
   - ¿Cuál es tu directorio público? Escribe **`dist`** y presiona Enter. (Esto es vital, no uses `public`).
   - ¿Configurar como single-page app? Escribe **`y`** (Sí) y presiona Enter.
   - ¿Configurar despliegues automáticos con GitHub? Escribe **`n`** (No) y presiona Enter.
   - ¿Sobrescribir `index.html`? **⚠️MUY IMPORTANTE:** Si te pregunta por sobrescribir `dist/index.html` o `index.html`, escribe **`n`** (No) y dale a Enter.

---

## 🔑 PASO 6: Configurar tu API Key de Gemini de manera segura

El "cerebro" de la inteligencia artificial de tu tutor no debe exponerse públicamente en el código de la web porque otras personas podrían robártela y gastar tus créditos gratuitos de Google. Firebase tiene una "caja fuerte" especial llamada configuración de entorno de Cloud Functions.

1. Consigue tu API Key de Gemini en Google AI Studio (donde diseñas los prompts, en la esquina superior izquierda hay un botón que dice **Get API Key**). Cópiala.
2. En tu terminal negra de VS Code, escribe el siguiente comando para entrar en la carpeta de las funciones de red:
   ```bash
   cd functions
   ```
3. Ahora, guarda tu clave ejecutando este comando (reemplaza `TU_CLAVE_DE_GEMINI` por la clave real que copiaste):
   ```bash
   firebase functions:config:set gemini.key="TU_CLAVE_DE_GEMINI"
   ```
4. Vuelve a la carpeta principal del proyecto ejecutando:
   ```bash
   cd ..
   ```

---

## 🔌 PASO 7: Cambiar los cables (Conectar la app real)

Tu proyecto ahora mismo utiliza un simulador offline (datos de prueba para que ruede rápido en AI Studio). Vamos a meter las llaves de tu Firebase real.

1. Ve a la consola web de Firebase en tu navegador.
2. En la barra izquierda, haz clic en el icono del **Engranaje de ajustes** (al lado de "Descripción general del proyecto") ➔ **Configuración del proyecto** (*Project settings*).
3. Baja por la pantalla hasta el final, en la sección **Tus aplicaciones** (*Your apps*). Haz clic en el círculo que tiene el icono de código web **`</>`**.
4. Ponle como nombre `aulainfinity-web`, activa la casilla de "Configurar Firebase Hosting también" y pulsa **Registrar app**.
5. Te aparecerá un bloque de código que contiene un objeto llamado `firebaseConfig`. Se verá más o menos así:
   ```javascript
   const firebaseConfig = {
     apiKey: "xxxxxxxxx",
     authDomain: "aulainfinity-app.firebaseapp.com",
     projectId: "aulainfinity-app",
     storageBucket: "aulainfinity-app.appspot.com",
     messagingSenderId: "xxxxxxxxx",
     appId: "xxxxxxxxx"
   };
   ```
6. **Edita el archivo en VS Code:**
   - En la lista de archivos de la izquierda en VS Code, navega hasta la carpeta `src` ➔ `services` ➔ y abre el archivo `firebase.ts` (haz clic para abrirlo en la pantalla principal).
   - Verás un bloque de código similar que contiene datos de relleno. Reemplaza el objeto `firebaseConfig` que tiene el archivo por el tuyo real que acabas de copiar de la consola web.
   - Guarda el archivo seleccionando **File** ➔ **Save** (o usa las teclas `Control + S` en Windows / `Command + S` en Mac).

---

## 🚀 PASO 8: ¡CONSTRUIR Y DESPLEGAR LA WEB AL MUNDO!

Hemos preparado el coche, configurado los servicios, guardado las contraseñas secretas y conectado los cables. Ahora viene la parte mágica: compilar tu aplicación para producción y subirla al servidor en directo.

En la terminal de VS Code, ejecuta los siguientes tres comandos uno a uno esperando a que termine cada uno:

### 1. Descargar las librerías necesarias en tu PC local:
```bash
npm install
```
*(Esto tardará un minuto. Instalará todos los componentes técnicos indispensables en tu carpeta temporal local).*

### 2. Preparar, optimizar y empaquetar la web en la carpeta `dist`:
```bash
npm run build
```
*(Este paso leerá todos tus componentes de React en TypeScript, los optimizará eliminando código innecesario y generará una carpeta superligera llamada `dist` que pesa muy poco y cargará súper rápido en los teléfonos y PCs de tus estudiantes).*

### 3. ¡Desplegar todo en internet!
```bash
firebase deploy
```
*(Este comando subirá tanto el código ultrarrápido de tu interfaz como tus funciones seguras en la nube de inteligencia artificial).*

Cuando termine de cargar todas las barras, verás un mensaje de éxito que dice:
**✔ Deploy complete!**

Y debajo verás una línea que dice:
👉 **Hosting URL: https://aulainfinity-app.web.app**

**¡Felicidades!** Haz clic en ese enlace o cópialo en tu teléfono móvil. Esa es la URL real de tu aplicación educativa AulaInfinity. ¡Ya está en vivo, segura y accesible para todo el planeta!

---

## 👑 PASO FINAL: Convertirte en Administrador en la Base de Datos Real

Cuando entres en tu nueva web real de producción por primera vez, verás que puedes registrarte normalmente como estudiante. Pero, ¿cómo accedes al panel de control de administración para subir vídeos reales, añadir lecciones, crear quizzes y gestionar las cuentas de tus alumnos? Es muy sencillo:

1. Entra a tu web real (`https://aulainfinity-app.web.app`), ve a la pantalla de registro y crea una cuenta usando tu correo electrónico real y una contraseña segura.
2. Al terminar de registrarte, estarás dentro de la plataforma con una cuenta estándar de estudiante. No verás el panel de profesores.
3. Abre tu consola web de **Firebase** en tu navegador.
4. En el menú izquierdo, haz clic en **Firestore Database**.
5. Verás que se ha creado de manera automática una lista llamada **`users`** (usuarios). Haz clic en ella.
6. En la lista verás una fila con un ID complejo (tu usuario). Haz clic en ella y a la derecha se abrirán tus campos personales (nombre, email, fecha de registro...).
7. Busca el campo que dice `role` (que por defecto estará configurado como `"student"`).
8. Haz doble clic en `"student"`, bórralo y escribe en su lugar exactamente la palabra **`"admin"`** (con minúsculas y sin comillas). Dale a guardar.
9. Vuelve a tu videoclub AulaInfinity real, refresca la página (F5 o botón de recargar), e inicia sesión nuevamente si es necesario.
10. ¡Magia! En la barra lateral habrá aparecido el botón **"Administración"** de manera permanente. Ya eres el propietario del ecosistema digital, listo para educar e inventar el futuro académico desde la nube de forma segura.

💡 **Consejo Pro para Administradores Múltiples (Opcional):**
Si tienes un equipo de profesores o quieres añadir varios administradores de golpe sin tener que editar la base de datos uno a uno, puedes hacerlo usando variables de entorno:
- En tu archivo `.env` o en la configuración de tu servidor, puedes añadir la variable `VITE_ADMIN_EMAILS` y escribir los correos de tus administradores separados por comas. Por ejemplo:
  `VITE_ADMIN_EMAILS=profesor1@gmail.com,tutor2@gmail.com`
- El sistema los reconocerá automáticamente como administradores en cuanto inicien sesión. Por defecto, tu correo `8aulainfinity8@gmail.com` siempre estará autorizado de forma segura como administrador maestro de respaldo.

---

*¡Disfruta de AulaInfinity al máximo! Ha sido un viaje increíble construir esto contigo.* 🎓✨
