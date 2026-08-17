import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin (Only if not already initialized)
if (!getApps().length) {
  try {
    initializeApp();
  } catch (e) {
    console.error("Firebase admin init error", e);
  }
}

// authenticateUser Middleware - Authoritative Custom Claims Verification
export const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    decodedToken.role = decodedToken.role || 'student';
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying auth token', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// requireVerifiedUser Middleware
export const requireVerifiedUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req as any).user;
  if (!user || !user.email_verified) {
    return res.status(403).json({ error: 'Forbidden: Correo electrónico no verificado. Por favor verifica tu email.' });
  }
  next();
};

// requireRole Middleware - Strict Custom Claims Authorization (No Email Bypass)
export const requireRole = (allowedRoles: string[]) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      const role = decodedToken.role || 'student';
      
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      }
      
      decodedToken.role = role;
      (req as any).user = decodedToken;
      next();
    } catch (error) {
      console.error('Error verifying auth token', error);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  };
};

// In production, Vite is not installed as a dependency, so we dynamically import it inside the development block below

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // --- In-Memory Zero-Cost Rate Limiter & Abuse Protection ---
  const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();
  const rateLimit = (maxRequests: number, windowMs: number) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "anonymous";
      const now = Date.now();
      const userRecord = ipRequestCounts.get(ip);

      if (!userRecord || now > userRecord.resetTime) {
        ipRequestCounts.set(ip, { count: 1, resetTime: now + windowMs });
        return next();
      }

      if (userRecord.count >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: "RATE_LIMIT_EXCEEDED",
          message: "Demasiadas solicitudes. Por seguridad y control de costes, espera unos momentos antes de reintentar."
        });
      }

      userRecord.count++;
      return next();
    };
  };

  // Clean old rate-limit entries every 10 minutes to maintain near-zero memory footprint
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipRequestCounts.entries()) {
      if (now > record.resetTime) {
        ipRequestCounts.delete(ip);
      }
    }
  }, 10 * 60 * 1000);

  // Create HTTP server
  const server = http.createServer(app);

  // Initialize WebSocket Server
  const wss = new WebSocketServer({ server });

  // Keep track of connections inside rooms (courseId -> Set of WebSockets)
  const rooms = new Map<string, Set<{ ws: WebSocket; isTeacher: boolean }>>();

  wss.on("connection", async (ws, req) => {
    let activeCourseId: string | null = null;
    let isTeacher = false;
    let userId = "anonymous";
    let messageCount = 0;
    let lastReset = Date.now();

    try {
      const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
      const token = url.searchParams.get("token");
      if (!token) {
        ws.close(1008, "Token required");
        return;
      }
      const decodedToken = await getAuth().verifyIdToken(token);
      if (!decodedToken.email_verified) {
        ws.close(1008, "Email verification required");
        return;
      }
      userId = decodedToken.uid;
      isTeacher = decodedToken.role === "teacher" || decodedToken.role === "admin";
    } catch (err) {
      console.error("WebSocket auth error:", err);
      ws.close(1008, "Invalid token");
      return;
    }

    ws.on("message", (messageData) => {
      try {
        // 1. Abuse Protection: Drop oversized messages (> 64KB)
        const buffer = Buffer.isBuffer(messageData) ? messageData : Buffer.from(messageData as any);
        if (buffer.length > 65536) {
          console.warn(`[WS ABUSE] Dropping oversized message (${buffer.length} bytes) from user ${userId}`);
          return;
        }

        // 2. Abuse Protection: Rate limit per connection (max 60 msg/s)
        const now = Date.now();
        if (now - lastReset > 1000) {
          messageCount = 0;
          lastReset = now;
        }
        messageCount++;
        if (messageCount > 60) {
          // Drop message exceeding rate limit
          return;
        }

        const message = JSON.parse(buffer.toString("utf-8"));
        
        if (message.type === "join") {
          const { courseId } = message;
          if (!courseId || typeof courseId !== "string" || courseId.length > 128) return;

          activeCourseId = courseId;

          // Initialize room if not exists
          if (!rooms.has(courseId)) {
            rooms.set(courseId, new Set());
          }

          // Add this client to the room
          rooms.get(courseId)!.add({ ws, isTeacher });
        }

        if (message.type === "cursor") {
          const { courseId, x, y, active } = message;
          if (!courseId || typeof courseId !== "string" || courseId !== activeCourseId) return;
          
          // Coordinate sanitization
          const safeX = typeof x === "number" && Number.isFinite(x) ? Math.max(-10000, Math.min(10000, x)) : 0;
          const safeY = typeof y === "number" && Number.isFinite(y) ? Math.max(-10000, Math.min(10000, y)) : 0;
          const safeActive = active !== false;

          const roomClients = rooms.get(courseId);
          if (roomClients) {
            const broadcastPayload = JSON.stringify({
              type: "cursor",
              courseId,
              userId,
              isTeacher,
              x: safeX,
              y: safeY,
              active: safeActive,
              updatedAt: Date.now()
            });

            // Broadcast to all OTHER clients in the room
            for (const client of roomClients) {
              if (client.ws !== ws && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(broadcastPayload);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error processing WebSocket message:", err);
      }
    });

    ws.on("close", () => {
      if (activeCourseId) {
        const roomClients = rooms.get(activeCourseId);
        if (roomClients) {
          // Find and remote client
          for (const client of roomClients) {
            if (client.ws === ws) {
              roomClients.delete(client);
              
              // If teacher disconnected, broadcast inactive cursor
              if (client.isTeacher) {
                const broadcastPayload = JSON.stringify({
                  type: "cursor",
                  courseId: activeCourseId,
                  x: 0,
                  y: 0,
                  active: false,
                  updatedAt: Date.now()
                });
                for (const other of roomClients) {
                  if (other.ws.readyState === WebSocket.OPEN) {
                    other.ws.send(broadcastPayload);
                  }
                }
              }
              break;
            }
          }

          // Delete room if empty
          if (roomClients.size === 0) {
            rooms.delete(activeCourseId);
          }
        }
      }
    });
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", ws_rooms: rooms.size });
  });

  // WhatsApp notification endpoint (Protected: Teachers/Admins only with rate limiting)
  app.post("/api/send-whatsapp", rateLimit(20, 60 * 1000), requireRole(['admin', 'teacher', 'profesor']), async (req, res) => {
    const { 
      to, 
      message, 
      whatsappMode,
      twilioAccountSid, 
      twilioAuthToken, 
      twilioWhatsappFrom,
      metaPhoneNumberId,
      metaAccessToken,
      evolutionInstanceUrl,
      evolutionApiKey,
      greenapiIdInstance,
      greenapiApiTokenInstance,
      greenapiApiUrl
    } = req.body;

    if (!to || !message) {
      return res.status(400).json({ success: false, error: "Missing 'to' or 'message' field." });
    }

    const mode = whatsappMode || "twilio";

    // --- OPCIÓN 1: META CLOUD API OFICIAL (WhatsApp Business Platform) ---
    if (mode === "meta") {
      const phoneNumberId = process.env.META_PHONE_NUMBER_ID || metaPhoneNumberId;
      const accessToken = process.env.META_ACCESS_TOKEN || metaAccessToken;

      if (!phoneNumberId || !accessToken) {
        console.log(`[SIMULATED META WHATSAPP] (No Credentials Set) To: ${to} | Message: ${message}`);
        return res.json({
          success: true,
          simulated: true,
          message: "WhatsApp simulado correctamente (Modo Meta Cloud API). Configura el Phone Number ID y Access Token en Ajustes para envíos reales.",
          details: { to, message }
        });
      }

      const cleanPhone = to.replace(/[^0-9]/g, "");
      const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: cleanPhone,
            type: "text",
            text: { body: message }
          })
        });

        const data = await response.json() as any;

        if (response.ok) {
          console.log(`[REAL META WHATSAPP] Sent to ${to} successfully via Meta Cloud API. ID: ${data.messages?.[0]?.id}`);
          return res.json({
            success: true,
            simulated: false,
            message: "Mensaje de WhatsApp enviado correctamente vía Meta Cloud API Oficial.",
            sid: data.messages?.[0]?.id
          });
        } else {
          console.error("[META CLIENT ERROR]", data);
          return res.status(response.status).json({
            success: false,
            error: data.error?.message || "La API de Meta devolvió un error.",
            details: data
          });
        }
      } catch (err: any) {
        console.error("[META CALL EXCEPTION]", err);
        return res.status(500).json({
          success: false,
          error: err.message || "Error al conectar con la API de Meta."
        });
      }
    }

    // --- OPCIÓN 2: EVOLUTION API / ULTRAMSG / BAILEYS (Conexión QR Web Instancia) ---
    if (mode === "evolution") {
      const instanceUrl = (process.env.EVOLUTION_INSTANCE_URL || evolutionInstanceUrl || "").trim();
      const apiKey = (process.env.EVOLUTION_API_KEY || evolutionApiKey || "").trim();

      if (!instanceUrl || !apiKey) {
        console.log(`[SIMULATED EVOLUTION WHATSAPP] (No Credentials Set) To: ${to} | Message: ${message}`);
        return res.json({
          success: true,
          simulated: true,
          message: "WhatsApp simulado correctamente (Modo Evolution API / QR Web). Configura la URL de instancia y API Key en Ajustes para envíos reales.",
          details: { to, message }
        });
      }

      const cleanPhone = to.replace(/[^0-9]/g, "");
      // Aseguramos formato internacional para servicios que requieren @c.us o código de país
      const formattedChatId = cleanPhone.includes("@") ? cleanPhone : `${cleanPhone}@c.us`;

      // 1. Construimos lista de URLs alternativas para auto-reparar el Error 404
      const targetUrls: string[] = [instanceUrl];
      const cleanBaseUrl = instanceUrl.replace(/\/$/, "");
      
      if (cleanBaseUrl.includes("/instance/")) {
        // Auto-reparamos error común de Evolution API (de /instance/nombre a /message/sendText/nombre)
        targetUrls.push(cleanBaseUrl.replace("/instance/", "/message/sendText/"));
      } else if (!cleanBaseUrl.includes("/sendText") && !cleanBaseUrl.includes("/messages/chat") && !cleanBaseUrl.includes("/sendMessage")) {
        // Si pusieron solo el host y el nombre de la instancia (ej: https://server.com/mi-instancia)
        const parts = cleanBaseUrl.split("/");
        const lastSeg = parts[parts.length - 1];
        if (lastSeg && lastSeg !== "sendText" && lastSeg !== "chat") {
          const baseDomain = parts.slice(0, -1).join("/");
          // Patrón estándar Evolution API v1 / v2
          targetUrls.push(`${baseDomain}/message/sendText/${lastSeg}`);
          // Patrón estándar UltraMsg
          targetUrls.push(`${cleanBaseUrl}/messages/chat`);
        }
      }

      let lastStatus = 400;
      let lastData: any = {};
      let lastTestedUrl = instanceUrl;

      for (const urlTarget of targetUrls) {
        lastTestedUrl = urlTarget;
        try {
          const response = await fetch(urlTarget, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": apiKey,
              "Authorization": `Bearer ${apiKey}`,
              "token": apiKey
            },
            body: JSON.stringify({
              number: cleanPhone,
              to: cleanPhone,
              phone: cleanPhone,
              chatId: formattedChatId,
              token: apiKey,
              text: message,
              message: message,
              body: message,
              textMessage: {
                text: message
              }
            })
          });

          let data: any = {};
          const resText = await response.text();
          try { data = JSON.parse(resText); } catch (e) { data = { rawText: resText }; }
          lastStatus = response.status;
          lastData = data;

          if (response.ok && (data.status !== "error" && !data.error && data.error !== true)) {
            console.log(`[REAL EVOLUTION WHATSAPP] Sent to ${to} successfully via QR Instance URL: ${urlTarget}`);
            return res.json({
              success: true,
              simulated: false,
              message: `Mensaje de WhatsApp enviado correctamente (Vía: ${urlTarget}).`,
              sid: data.key?.id || data.id || data.id_str || "evolution_ok"
            });
          }

          // Si el servidor devolvió un código distinto de 404 (ej: 401 Auth o 400 Bad Request legítimo), detenemos reintentos de URL
          if (response.status !== 404 && response.status !== 405 && response.status !== 502) {
            break;
          }
        } catch (err: any) {
          console.error(`[EVOLUTION NETWORK ERROR on ${urlTarget}]`, err.message);
          lastData = { error: err.message };
        }
      }

      console.error("[EVOLUTION FAILED ALL URLS]", lastStatus, lastData);
      let errorMsg = lastData.error || lastData.message || lastData.reason || `Error HTTP ${lastStatus}`;
      if (lastStatus === 404) {
        errorMsg = `Error 404 (Ruta no encontrada): El servidor no reconoció el endpoint ni al intentar auto-reparar. Última URL probada: ${lastTestedUrl}. En Evolution API verifica que tu instancia esté conectada y que la URL termine en /message/sendText/NOMBRE_INSTANCIA. O si prefieres, usa la opción '🔥 Cola en Firebase' o 'Redirección del Navegador'.`;
      } else if (lastStatus === 401 || lastStatus === 403) {
        errorMsg = `Error de Autenticación (${lastStatus}): API Key o Token inválido para la instancia en ${lastTestedUrl}.`;
      } else if (typeof errorMsg === 'object') {
        errorMsg = JSON.stringify(errorMsg);
      }

      return res.status(lastStatus || 400).json({
        success: false,
        error: errorMsg,
        details: lastData
      });
    }

    // --- OPCIÓN 3: TWILIO API ---
    if (mode === "twilio" || mode === "direct") {
      const accountSid = process.env.TWILIO_ACCOUNT_SID || twilioAccountSid;
      const authToken = process.env.TWILIO_AUTH_TOKEN || twilioAuthToken;
      const fromNumber = process.env.TWILIO_WHATSAPP_FROM || twilioWhatsappFrom;

      if (!accountSid || !authToken || !fromNumber) {
        console.log(`[SIMULATED SERVER WHATSAPP] (No Credentials Set) To: ${to} | Message: ${message}`);
        return res.json({
          success: true,
          simulated: true,
          message: "WhatsApp simulado correctamente en consola. Configura las credenciales de Twilio para envíos reales.",
          details: { to, message }
        });
      }

      const formattedFrom = fromNumber.startsWith("whatsapp:") ? fromNumber : `whatsapp:${fromNumber}`;
      const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const authString = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

      const params = new URLSearchParams();
      params.append("From", formattedFrom);
      params.append("To", formattedTo);
      params.append("Body", message);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${authString}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: params.toString()
        });

        const data = await response.json() as any;

        if (response.ok) {
          console.log(`[REAL SERVER WHATSAPP] Sent to ${to} successfully via Twilio. SID: ${data.sid}`);
          return res.json({
            success: true,
            simulated: false,
            message: "Mensaje de WhatsApp enviado correctamente vía Twilio.",
            sid: data.sid
          });
        } else {
          console.error("[TWILIO CLIENT ERROR]", data);
          return res.status(response.status).json({
            success: false,
            error: data.message || "La API de Twilio devolvió un error.",
            details: data
          });
        }
      } catch (err: any) {
        console.error("[TWILIO CALL EXCEPTION]", err);
        return res.status(500).json({
          success: false,
          error: err.message || "Error al conectar con la API de Twilio."
        });
      }
    }

    // --- OPCIÓN 4: GREEN API ---
    if (mode === "greenapi") {
      const idInstance = process.env.GREENAPI_ID_INSTANCE || greenapiIdInstance;
      const apiTokenInstance = process.env.GREENAPI_API_TOKEN_INSTANCE || greenapiApiTokenInstance;
      const baseUrl = process.env.GREENAPI_API_URL || greenapiApiUrl || "https://api.green-api.com";

      if (!idInstance || !apiTokenInstance) {
        console.log(`[SIMULATED GREEN API WHATSAPP] (No Credentials Set) To: ${to} | Message: ${message}`);
        return res.json({
          success: true,
          simulated: true,
          message: "WhatsApp simulado correctamente (Modo Green API). Configura el Id Instance y API Token Instance en Ajustes para envíos reales.",
          details: { to, message }
        });
      }

      const cleanPhone = to.replace(/[^0-9]/g, "");
      const formattedChatId = cleanPhone.includes("@") ? cleanPhone : `${cleanPhone}@c.us`;

      // Remove trailing slash if present
      const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const url = `${cleanBaseUrl}/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            chatId: formattedChatId,
            message: message
          })
        });

        const data = await response.json() as any;

        if (response.ok && data.idMessage) {
          console.log(`[REAL GREEN API WHATSAPP] Sent to ${to} successfully. MsgID: ${data.idMessage}`);
          return res.json({
            success: true,
            simulated: false,
            message: "Mensaje de WhatsApp enviado correctamente vía Green API.",
            sid: data.idMessage
          });
        } else {
          console.error("[GREEN API CLIENT ERROR]", data);
          return res.status(response.status || 400).json({
            success: false,
            error: data.message || data.error || "La API de Green API devolvió un error.",
            details: data
          });
        }
      } catch (err: any) {
        console.error("[GREEN API CALL EXCEPTION]", err);
        return res.status(500).json({
          success: false,
          error: err.message || "Error al conectar con Green API."
        });
      }
    }
  });

  // --- LIVEKIT TOKEN GENERATION ENDPOINT (Protected: Authenticated users only, rate limiting: max 30 tokens / min per IP) ---
  app.get("/api/livekit/token", rateLimit(30, 60 * 1000), authenticateUser, async (req, res) => {
    const { room } = req.query;
    const user = (req as any).user;
    const username = user?.name || user?.email?.split('@')[0] || user?.uid || req.query.username;
    
    if (!room) {
      return res.status(400).json({ success: false, error: "Falta el parámetro 'room'." });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      return res.json({
        success: false,
        error: "MISSING_KEYS",
        message: "Faltan las credenciales de LiveKit (LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL) en las variables de entorno."
      });
    }

    try {
      const { AccessToken } = await import("livekit-server-sdk");
      const at = new AccessToken(apiKey, apiSecret, {
        identity: String(username),
      });

      at.addGrant({
        roomJoin: true,
        room: String(room),
        canPublish: true,
        canSubscribe: true,
      });

      const token = await at.toJwt();
      return res.json({
        success: true,
        token,
        url: livekitUrl
      });
    } catch (error: any) {
      console.error("[LIVEKIT TOKEN ERROR]", error);
      return res.status(500).json({
        success: false,
        error: "LiveKit SDK no disponible o error al generar el token."
      });
    }
  });

  // --- IN-MEMORY TUTOR AI COST CONTROL (Protected: Authenticated users only) ---
  const DAILY_MSG_LIMIT_PER_USER = 30; // Max 30 questions per student/day
  const userDailyUsage = new Map<string, { count: number; lastReset: string }>();

  app.post('/api/tutor-ia/chat', rateLimit(15, 60000), authenticateUser, async (req, res) => {
    try {
      const { message, history, subject } = req.body || {};
      const user = (req as any).user;
      const uid = user?.uid || 'anonymous_user';

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'El mensaje es obligatorio' });
      }

      // 1. Cost Control: Daily usage quota check derived from verified user UID
      const today = new Date().toISOString().split('T')[0];
      const usage = userDailyUsage.get(uid) || { count: 0, lastReset: today };

      if (usage.lastReset !== today) {
        usage.count = 0;
        usage.lastReset = today;
      }

      if (usage.count >= DAILY_MSG_LIMIT_PER_USER) {
        return res.status(429).json({
          error: `Has alcanzado el límite diario de ${DAILY_MSG_LIMIT_PER_USER} consultas al Tutor IA para controlar el uso de la plataforma. Inténtalo de nuevo mañana.`
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: 'Servicio de IA no disponible en este momento.' });
      }

      // 2. Cost Control: Truncate history to last 6 messages to cap input token cost
      const truncatedHistory = Array.isArray(history) ? history.slice(-6) : [];

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });

      // 3. Cost Control: Efficient Model Selection & Token Capping
      const systemInstruction = `Eres un Tutor Pedagógico de Inteligencia Artificial para la plataforma educativa "AulaInfinity". Materia actual: ${subject || 'General'}. Tu objetivo es guiar al estudiante paso a paso de forma clara, motivadora y concisa. Responde en español usando formato Markdown claro. Limita tus respuestas a un máximo de 250-300 palabras para facilitar la lectura.`;

      const formattedContents = [
        ...truncatedHistory.map((h: any) => ({
          role: h.sender === 'user' || h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text || '' }]
        })),
        { role: 'user', parts: [{ text: message }] }
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Efficient cost-optimized flash model
        contents: formattedContents,
        config: {
          systemInstruction,
          maxOutputTokens: 800, // Cost Control: Cap output length to prevent runaway token costs
          temperature: 0.6
        }
      });

      // Increment user usage counter upon successful generation
      usage.count += 1;
      userDailyUsage.set(uid, usage);

      const replyText = response.text || 'No se pudo generar una respuesta. Por favor, reintenta.';
      return res.json({ reply: replyText, remainingQuota: DAILY_MSG_LIMIT_PER_USER - usage.count });
    } catch (error: any) {
      console.error('Error en Tutor IA API:', error);
      return res.status(503).json({ error: 'Servicio temporalmente no disponible. Por favor, reintenta en unos momentos.' });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[FULL-STACK] Server running on http://0.0.0.0:${PORT}`);
  });

  // Simulated Reminder System
  setInterval(async () => {
    console.log("[REMINDER SYSTEM] Checking for tutoring sessions starting in 30 minutes...");
    // Database query here
  }, 60000);
}

startServer().catch((error) => {
  console.error("Critical error while starting up server:", error);
});
