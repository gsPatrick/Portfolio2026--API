const analytics = require("../analytics/analytics.service");
const { numero, duracao, porcentagem, palavra } = require("../../utils/formato");

// Junta tudo que o painel precisa numa resposta só, com valores já formatados
// em português (o HTML só precisa desenhar).
async function montar({ days = 30 } = {}) {
  const dias = Number(days) || 30;

  const [resumo, secoes, cliques, sessoes, porDia, origens, dispositivos, engaj, ia] =
    await Promise.all([
      analytics.summary({ days: dias }),
      analytics.sections({ days: dias }),
      analytics.clicks({ days: dias, limit: 10 }),
      analytics.sessions({ limit: 12 }),
      analytics.daily({ days: dias }),
      analytics.sources({ days: dias }),
      analytics.devices({ days: dias }),
      analytics.engagement({ days: dias }),
      analytics.aiVisits({ days: dias }),
    ]);

  // "há 2 h", "há 3 dias" a partir de um epoch ms.
  const relativo = (ts) => {
    if (!ts) return null;
    const min = Math.round((Date.now() - Number(ts)) / 60000);
    if (min < 1) return "agora mesmo";
    if (min < 60) return `há ${min} min`;
    const h = Math.round(min / 60);
    if (h < 24) return `há ${h} h`;
    const d = Math.round(h / 24);
    return `há ${d} ${d === 1 ? "dia" : "dias"}`;
  };

  const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const graficoDiario = porDia.map((d) => {
    const [ano, mes, dia] = d.dia.split("-");
    return {
      dia: d.dia,
      rotulo: `${dia}/${MESES[Number(mes) - 1]}`,
      visitas: d.visitas,
      visitantes: d.visitantes,
      envios: d.envios,
    };
  });

  const kpis = [
    {
      chave: "visitantes",
      rotulo: "Visitantes",
      valor: numero(resumo.visitors),
      ajuda: "Pessoas diferentes que abriram sua página.",
    },
    {
      chave: "sessoes",
      rotulo: "Visitas",
      valor: numero(resumo.sessions),
      ajuda: "Cada vez que alguém acessa (a mesma pessoa pode voltar mais de uma vez).",
    },
    {
      chave: "formulario",
      rotulo: "Enviaram o formulário",
      valor: numero(resumo.formSubmits),
      ajuda: `${numero(resumo.formStarts)} ${palavra(resumo.formStarts, "começou", "começaram")} a preencher.`,
    },
    {
      chave: "conversao",
      rotulo: "Taxa de conversão",
      valor: porcentagem(resumo.conversionRate),
      ajuda: "Fatia das visitas que terminou enviando o formulário.",
    },
  ];

  const graficoSecoes = secoes.map((s) => ({
    rotulo: s.section,
    visitas: s.views,
    tempoMedioMs: s.avgDwellMs,
    tempoMedio: duracao(s.avgDwellMs),
    tempoTotal: duracao(s.totalDwellMs),
  }));

  const graficoCliques = cliques.map((c) => ({
    rotulo: c.label,
    secao: c.section || "—",
    cliques: c.count,
    quando: relativo(c.ultimoClique),
  }));

  const graficoOrigens = origens.map((o) => ({
    fonte: o.fonte,
    sessoes: o.sessoes,
    conversoes: o.conversoes,
    taxa: porcentagem(o.taxaConversao),
  }));

  const graficoDispositivos = dispositivos.map((d) => ({
    dispositivo: d.dispositivo,
    sessoes: d.sessoes,
    conversoes: d.conversoes,
    taxa: porcentagem(d.taxaConversao),
  }));

  const engajamento = {
    rolagemMediaPct: engaj.rolagemMediaPct,
    duracaoMedia: duracao(engaj.duracaoMediaMs),
  };

  const totalIA = ia.reduce((soma, x) => soma + x.sessoes, 0);
  const conversoesIA = ia.reduce((soma, x) => soma + x.conversoes, 0);
  const visitasIA = {
    total: totalIA,
    conversoes: conversoesIA,
    porMotor: ia.map((x) => ({
      motor: x.engine,
      sessoes: x.sessoes,
      conversoes: x.conversoes,
      taxa: porcentagem(x.taxaConversao),
    })),
  };

  const listaSessoes = sessoes.map((s) => ({
    visitante: String(s.visitorId || "").slice(0, 8),
    inicio: s.startedAt,
    duracao: duracao(s.durationMs),
    duracaoMs: s.durationMs,
    paginas: s.pages,
    eventos: s.events,
    dispositivo: s.device || "desconhecido",
    converteu: s.converted,
  }));

  const mensagemTopo =
    resumo.visitors === 0
      ? `Ainda não há visitas nos últimos ${dias} dias. Assim que alguém acessar sua página, tudo aparece aqui.`
      : `Nos últimos ${dias} dias, ${numero(resumo.visitors)} ${palavra(resumo.visitors, "pessoa visitou", "pessoas visitaram")} sua página. ` +
        `${numero(resumo.formSubmits)} ${palavra(resumo.formSubmits, "enviou", "enviaram")} o formulário.`;

  return {
    periodoDias: dias,
    mensagemTopo,
    kpis,
    engajamento,
    graficoDiario,
    graficoSecoes,
    graficoCliques,
    graficoOrigens,
    graficoDispositivos,
    visitasIA,
    sessoes: listaSessoes,
    resumoBruto: resumo,
  };
}

module.exports = { montar };
