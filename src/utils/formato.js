// Formatação em português-BR para números, tempo e porcentagem.

function numero(n) {
  return new Intl.NumberFormat("pt-BR").format(Number(n) || 0);
}

// Converte milissegundos em algo legível: "4,2 s", "1 min 12 s", "2 h 05 min".
function duracao(ms) {
  const total = Math.max(0, Math.round(Number(ms) || 0));
  const seg = Math.round(total / 1000);
  if (seg < 60) {
    if (total < 10000) return `${(total / 1000).toFixed(1).replace(".", ",")} s`;
    return `${seg} s`;
  }
  const min = Math.floor(seg / 60);
  const restoSeg = seg % 60;
  if (min < 60) return `${min} min ${String(restoSeg).padStart(2, "0")} s`;
  const horas = Math.floor(min / 60);
  const restoMin = min % 60;
  return `${horas} h ${String(restoMin).padStart(2, "0")} min`;
}

// 0.052 -> "5,2%"
function porcentagem(fracao) {
  const pct = (Number(fracao) || 0) * 100;
  return `${pct.toFixed(1).replace(".", ",")}%`;
}

// Plural simples: palavra(1, "pessoa", "pessoas")
function palavra(n, singular, plural) {
  return Number(n) === 1 ? singular : plural;
}

module.exports = { numero, duracao, porcentagem, palavra };
