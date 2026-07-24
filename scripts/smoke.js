/* eslint-disable no-console */
// Smoke test: sobe o app, injeta um lote de eventos e lê o analytics.
// Requer o banco migrado e acessível (usa as mesmas envs do app).
const http = require("http");
const app = require("../app");

function request(server, method, path, body) {
  return new Promise((resolve, reject) => {
    const { port } = server.address();
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      { host: "127.0.0.1", port, method, path, headers: { "Content-Type": "application/json" } },
      (res) => {
        let buf = "";
        res.on("data", (c) => (buf += c));
        res.on("end", () => {
          let json = null;
          try {
            json = JSON.parse(buf);
          } catch (_) {
            json = buf;
          }
          resolve({ status: res.statusCode, body: json });
        });
      }
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

function assert(cond, msg) {
  if (!cond) throw new Error("FALHOU: " + msg);
  console.log("  ok:", msg);
}

async function main() {
  const server = app.listen(0);
  const now = Date.now();
  const visitorId = "smoke-visitor-" + now;
  const sessionId = "smoke-session-" + now;

  try {
    const ping = await request(server, "GET", "/api/v1/ping");
    assert(ping.status === 200 && ping.body.ok, "GET /ping responde 200");

    const ingest = await request(server, "POST", "/api/v1/events", {
      visitorId,
      sessionId,
      sentAt: now,
      events: [
        { type: "session_start", ts: now, path: "/" },
        { type: "page_view", ts: now, path: "/" },
        { type: "section_enter", ts: now, path: "/", section: "hero" },
        { type: "section_exit", ts: now + 4200, path: "/", section: "hero", dwellMs: 4200 },
        { type: "click", ts: now + 5000, path: "/", label: "Agenda aberta" },
        { type: "form_start", ts: now + 6000, path: "/" },
        { type: "form_submit", ts: now + 9000, path: "/" },
        { type: "session_end", ts: now + 9000, path: "/" },
      ],
    });
    assert(ingest.status === 202 && ingest.body.data.accepted === 8, "POST /events aceita 8 eventos");

    const summary = await request(server, "GET", "/api/v1/analytics/summary?days=1");
    assert(summary.status === 200 && summary.body.data.formSubmits >= 1, "summary contabiliza conversão");

    const sections = await request(server, "GET", "/api/v1/analytics/sections?days=1");
    assert(sections.status === 200 && Array.isArray(sections.body.data), "sections retorna lista");

    console.log("\nSMOKE OK ✔");
  } finally {
    server.close();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n" + err.message);
    process.exit(1);
  });
