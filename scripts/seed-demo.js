/* eslint-disable no-console */
// Gera dados de DEMONSTRAÇÃO para você visualizar o painel cheio.
// NÃO use em produção com tráfego real — rode `npm run db:limpar` antes de ir ao ar.
const { sequelize, Visitor, Event } = require("../src/models");

const SECOES = ["hero", "servicos", "sobre", "tecnologias", "comparacao", "faq", "contato"];
const CLIQUES = ["Agenda aberta", "WhatsApp", "Ver projetos", "Enviar mensagem", "Ver currículo", "E-mail"];
const PATHS = ["/", "/", "/", "/carreira"];
const DISPOSITIVOS = ["celular", "celular", "celular", "computador", "computador", "tablet"];
// Mistura de origens: pagas (utm) e orgânicas (referrer).
const ORIGENS = [
  { utm: { source: "google", medium: "cpc", campaign: "sites-sob-medida" } },
  { utm: { source: "instagram", medium: "paid", campaign: "saas-startups" } },
  { utm: { source: "meta", medium: "cpc", campaign: "automacao" } },
  { referrer: "https://www.workana.com/" },
  { referrer: "https://www.99freelas.com.br/" },
  { referrer: "https://www.google.com/" },
  { referrer: null }, // acesso direto
];

function escolhe(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function entre(min, max) { return Math.floor(min + Math.random() * (max - min)); }

async function main() {
  await sequelize.authenticate();

  const agora = Date.now();
  const DIA = 24 * 60 * 60 * 1000;
  const totalVisitantes = 46;
  let eventos = [];
  let visitantes = [];

  for (let v = 0; v < totalVisitantes; v++) {
    const visitorId = "demo-" + (10000 + v);
    const sessoes = entre(1, 3);
    let primeiro = agora;
    let ultimo = 0;

    for (let s = 0; s < sessoes; s++) {
      const sessionId = "demo-s-" + v + "-" + s;
      let t = agora - entre(0, 30) * DIA - entre(0, 20) * 60 * 60 * 1000;
      const path = escolhe(PATHS);
      const device = escolhe(DISPOSITIVOS);
      const origem = escolhe(ORIGENS);
      primeiro = Math.min(primeiro, t);

      eventos.push({
        visitorId, sessionId, type: "session_start", ts: t, path,
        meta: Object.assign({ device, entryPath: path }, origem),
      });
      eventos.push({ visitorId, sessionId, type: "page_view", ts: t, path });

      // navega por algumas seções
      const nSecoes = entre(2, SECOES.length);
      for (let i = 0; i < nSecoes; i++) {
        const secao = SECOES[i];
        const dwell = entre(1500, 12000);
        eventos.push({ visitorId, sessionId, type: "section_enter", ts: t, path, section: secao });
        t += dwell;
        eventos.push({ visitorId, sessionId, type: "section_exit", ts: t, path, section: secao, dwellMs: dwell });
      }

      // alguns cliques
      const nCliques = entre(0, 3);
      for (let c = 0; c < nCliques; c++) {
        t += entre(500, 3000);
        eventos.push({ visitorId, sessionId, type: "click", ts: t, path, label: escolhe(CLIQUES), section: escolhe(SECOES) });
      }

      // ~14% começam o formulário; dos que começam, ~40% enviam
      if (Math.random() < 0.14) {
        t += entre(1000, 4000);
        eventos.push({ visitorId, sessionId, type: "form_start", ts: t, path });
        if (Math.random() < 0.4) {
          t += entre(3000, 20000);
          eventos.push({ visitorId, sessionId, type: "form_submit", ts: t, path });
        }
      }

      t += entre(500, 2000);
      eventos.push({ visitorId, sessionId, type: "session_end", ts: t, path, meta: { maxScrollPct: entre(35, 100) } });
      ultimo = Math.max(ultimo, t);
    }

    visitantes.push({
      visitorId,
      firstSeen: new Date(primeiro),
      lastSeen: new Date(ultimo),
      sessionsCount: sessoes,
    });
  }

  // Garante algumas visitas RECENTES que converteram, para o painel exibir
  // os selos "Enviou o formulário" já na lista das últimas visitas.
  for (let r = 0; r < 4; r++) {
    const visitorId = "demo-recente-" + r;
    const sessionId = "demo-sr-" + r;
    let t = agora - entre(1, 40) * 60 * 60 * 1000; // nas últimas ~40h
    const path = "/";
    const inicio = t;
    eventos.push({
      visitorId, sessionId, type: "session_start", ts: t, path,
      meta: Object.assign({ device: escolhe(DISPOSITIVOS), entryPath: path }, escolhe(ORIGENS)),
    });
    eventos.push({ visitorId, sessionId, type: "page_view", ts: t, path });
    for (let i = 0; i < 4; i++) {
      const dwell = entre(3000, 12000);
      eventos.push({ visitorId, sessionId, type: "section_enter", ts: t, path, section: SECOES[i] });
      t += dwell;
      eventos.push({ visitorId, sessionId, type: "section_exit", ts: t, path, section: SECOES[i], dwellMs: dwell });
    }
    t += entre(500, 2000);
    eventos.push({ visitorId, sessionId, type: "click", ts: t, path, label: "Enviar mensagem", section: "contato" });
    t += entre(1000, 3000);
    eventos.push({ visitorId, sessionId, type: "form_start", ts: t, path });
    t += entre(4000, 15000);
    eventos.push({ visitorId, sessionId, type: "form_submit", ts: t, path });
    t += entre(500, 1500);
    eventos.push({ visitorId, sessionId, type: "session_end", ts: t, path, meta: { maxScrollPct: entre(70, 100) } });
    visitantes.push({ visitorId, firstSeen: new Date(inicio), lastSeen: new Date(t), sessionsCount: 1 });
  }

  await sequelize.transaction(async (tx) => {
    await Visitor.bulkCreate(visitantes, { transaction: tx, ignoreDuplicates: true });
    await Event.bulkCreate(eventos, { transaction: tx });
  });

  console.log(`Pronto! Inseri ${visitantes.length} visitantes e ${eventos.length} eventos de demonstração.`);
  console.log("Abra o painel para ver e rode `npm run db:limpar` quando quiser zerar.");
  await sequelize.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
