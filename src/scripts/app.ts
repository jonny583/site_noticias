// Comportamentos da página no navegador: tema, datas, carrossel, janela da notícia.

const $ = <T extends Element = HTMLElement>(s: string, raiz: ParentNode = document) => raiz.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, raiz: ParentNode = document) => [...raiz.querySelectorAll<T>(s)];
const semMovimento = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Tema claro/escuro ----------
$("#tema")?.addEventListener("click", () => {
  const raiz = document.documentElement;
  const escuro = raiz.dataset.theme ? raiz.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  raiz.dataset.theme = escuro ? "light" : "dark";
  try { localStorage.setItem("tema", raiz.dataset.theme); } catch {}
});

// ---------- Datas relativas ("há 2 h"), calculadas na hora da visita ----------
function relativa(d: Date) {
  const horas = Math.floor((Date.now() - d.getTime()) / 3.6e6);
  if (horas < 1) return "agora";
  if (horas < 24) return `há ${horas} h`;
  if (horas < 48) return "ontem";
  return null; // mantém a data escrita
}
$$<HTMLTimeElement>("time[data-relativo]").forEach((el) => {
  const r = relativa(new Date(el.dateTime));
  if (r) el.textContent = r;
});

// ---------- Carrossel de destaques ----------
$$("[data-carrossel]").forEach((sec) => {
  const trilho = $("[data-trilho]", sec)!;
  const slides = $$(".slide", trilho);
  const pontos = $$("button", $("[data-pontos]", sec)!);
  if (slides.length < 2) { $(".setas", sec)?.remove(); $("[data-pontos]", sec)?.remove(); return; }
  const passo = () => slides[0].getBoundingClientRect().width + 16;
  const atual = () => Math.round(trilho.scrollLeft / passo());
  const irPara = (i: number) => {
    const n = slides.length;
    trilho.scrollTo({ left: (((i % n) + n) % n) * passo(), behavior: semMovimento ? "auto" : "smooth" });
  };
  const marcar = () => pontos.forEach((b, i) => b.setAttribute("aria-current", String(i === atual())));
  trilho.addEventListener("scroll", () => requestAnimationFrame(marcar), { passive: true });
  $("[data-ant]", sec)!.addEventListener("click", () => irPara(atual() - 1));
  $("[data-prox]", sec)!.addEventListener("click", () => irPara(atual() + 1));
  pontos.forEach((b, i) => b.addEventListener("click", () => irPara(i)));
  marcar();

  let pausa = false;
  ["mouseenter", "touchstart", "focusin"].forEach((ev) => trilho.addEventListener(ev, () => (pausa = true), { passive: true }));
  ["mouseleave", "focusout"].forEach((ev) => trilho.addEventListener(ev, () => (pausa = false)));
  if (!semMovimento) setInterval(() => { if (!pausa && !document.hidden) irPara(atual() + 1); }, 6000);
});

// ---------- Notícias numa linha só, com setas (páginas das abas) ----------
const linha = $(".grade.linha");
const setasLinha = $("[data-setas-linha]");
if (linha && setasLinha) {
  const cartoes = [...linha.children] as HTMLElement[];
  const ant = $<HTMLButtonElement>("[data-ant]", setasLinha)!;
  const prox = $<HTMLButtonElement>("[data-prox]", setasLinha)!;
  const contador = $("[data-contador]", setasLinha);
  const passo = () => cartoes[0].getBoundingClientRect().width + parseFloat(getComputedStyle(linha).columnGap || "0");
  const atualizar = () => {
    const cabe = Math.max(1, Math.round((linha.clientWidth + 1) / passo()));
    const primeiro = Math.round(linha.scrollLeft / passo());
    const noFim = linha.scrollLeft + linha.clientWidth >= linha.scrollWidth - 4;
    setasLinha.hidden = cartoes.length <= cabe;
    ant.style.visibility = primeiro > 0 ? "visible" : "hidden";   // o ← aparece depois de avançar
    prox.disabled = noFim;
    if (contador) contador.textContent = `${primeiro + 1}–${Math.min(primeiro + cabe, cartoes.length)} de ${cartoes.length}`;
  };
  const mover = (sentido: number) =>
    linha.scrollBy({ left: sentido * (linha.clientWidth + parseFloat(getComputedStyle(linha).columnGap || "0")), behavior: semMovimento ? "auto" : "smooth" });
  ant.addEventListener("click", () => mover(-1));
  prox.addEventListener("click", () => mover(1));
  linha.addEventListener("scroll", () => requestAnimationFrame(atualizar), { passive: true });
  addEventListener("resize", atualizar);
  atualizar();
}

// ---------- Últimas da capa: páginas de 8, com setas ----------
const paginasEl = $("[data-paginas]");
const setasPaginas = $("[data-setas-paginas]");
if (paginasEl && setasPaginas) {
  const total = Number(paginasEl.dataset.total);
  const porPagina = Number(paginasEl.dataset.porPagina);
  const quantas = paginasEl.children.length;
  const ant = $<HTMLButtonElement>("[data-ant]", setasPaginas)!;
  const prox = $<HTMLButtonElement>("[data-prox]", setasPaginas)!;
  const contador = $("[data-contador]", setasPaginas);
  const largura = () => paginasEl.clientWidth + parseFloat(getComputedStyle(paginasEl).columnGap || "0");
  const atual = () => Math.round(paginasEl.scrollLeft / largura());
  const atualizar = () => {
    const i = atual();
    setasPaginas.hidden = quantas <= 1;
    ant.style.visibility = i > 0 ? "visible" : "hidden";
    prox.disabled = i >= quantas - 1;
    if (contador) contador.textContent = `${i * porPagina + 1}–${Math.min((i + 1) * porPagina, total)} de ${total}`;
  };
  const irPara = (i: number) => {
    paginasEl.scrollTo({ left: Math.max(0, Math.min(i, quantas - 1)) * largura(), behavior: semMovimento ? "auto" : "smooth" });
    // ao voltar ou avançar, sobe até o título "Últimas" se ele saiu da tela
    const topo = setasPaginas.getBoundingClientRect().top;
    if (topo < 0) window.scrollBy({ top: topo - 80, behavior: semMovimento ? "auto" : "smooth" });
  };
  ant.addEventListener("click", () => irPara(atual() - 1));
  prox.addEventListener("click", () => irPara(atual() + 1));
  paginasEl.addEventListener("scroll", () => requestAnimationFrame(atualizar), { passive: true });
  addEventListener("resize", atualizar);
  atualizar();
}

// ---------- Janela da notícia ----------
type DadosJanela = {
  id: string; titulo: string; resumo: string; categoria: string; tags: string[];
  fonte: { nome: string; url: string }; data: string; regiao: string; imagem: string; creditoImagem: string;
  cta?: { pergunta: string; resumo: string; chamada: string; url: string };
};
const modal = $("#modal");
const dadosEl = $("#dados-noticias");
if (modal && dadosEl) {
  const dados: Record<string, DadosJanela> = JSON.parse(dadosEl.textContent || "{}");
  const rotulos = JSON.parse($("#rotulos-janela")?.textContent || "{}");
  const urlInicial = location.pathname;
  let ultimoFoco: HTMLElement | null = null;
  let empurrou = false;

  const txt = (el: HTMLElement | null, v: string) => { if (el) el.textContent = v; };
  const etiqueta = (t: string, clara = false) => {
    const s = document.createElement("span");
    s.className = clara ? "etiqueta clara" : "etiqueta";
    s.textContent = t;
    return s;
  };

  function abrir(id: string, empurrar = true) {
    const n = dados[id];
    if (!n) return false;
    ultimoFoco = document.activeElement as HTMLElement;
    const img = $<HTMLImageElement>("#m-img")!;
    img.classList.remove("quebrada");
    img.onerror = () => img.classList.add("quebrada");
    if (n.imagem) { img.src = n.imagem; img.hidden = false; } else { img.removeAttribute("src"); img.hidden = true; }
    txt($("#m-rotulo"), n.categoria);
    $("#m-tags")!.replaceChildren(etiqueta(n.categoria), ...n.tags.map((t) => etiqueta(t, true)));
    txt($("#m-titulo"), n.titulo);
    txt($("#m-resumo"), n.resumo);
    const cred = $("#m-credito")!;
    cred.replaceChildren();
    const b = document.createElement("b");
    b.textContent = n.fonte.nome;
    cred.append(`${rotulos.fonte}: `, b, ` · ${n.data}${n.regiao ? " · " + n.regiao : ""}`, document.createElement("br"),
      `${rotulos.avisoIA} ${rotulos.foto}: ${n.creditoImagem}.`);
    $<HTMLAnchorElement>("#m-fonte")!.href = n.fonte.url;
    const cta = $("#m-cta");
    if (cta) {
      cta.hidden = !n.cta;
      if (n.cta) {
        txt($("#m-cta-pergunta"), n.cta.pergunta);
        txt($("#m-cta-resumo"), n.cta.resumo);
        const link = $<HTMLAnchorElement>("#m-cta-link")!;
        link.href = n.cta.url;
        link.textContent = n.cta.chamada;
      }
    }
    modal!.classList.add("aberto");
    document.body.classList.add("travado");
    $<HTMLButtonElement>(".fechar", modal!)!.focus();
    if (empurrar) { history.pushState({ janela: id }, "", `/noticia/${id}/`); empurrou = true; }
    return true;
  }

  function fechar(voltarHistorico = true) {
    if (!modal!.classList.contains("aberto")) return;
    modal!.classList.remove("aberto");
    document.body.classList.remove("travado");
    if (voltarHistorico && empurrou) { empurrou = false; history.back(); }
    ultimoFoco?.focus();
  }

  document.addEventListener("click", (e) => {
    const alvo = e.target as HTMLElement;
    const a = alvo.closest<HTMLElement>("[data-abrir]");
    if (a && !(e as MouseEvent).ctrlKey && !(e as MouseEvent).metaKey && !(e as MouseEvent).shiftKey) {
      if (abrir(a.dataset.abrir!)) e.preventDefault();
    }
    if (alvo.closest("[data-fechar]")) fechar();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") fechar(); });
  addEventListener("popstate", () => {
    const m = location.pathname.match(/^\/noticia\/([^/]+)\/?$/);
    if (m && location.pathname !== urlInicial) { abrir(m[1], false); empurrou = false; }
    else { empurrou = false; fechar(false); }
  });
}

// ---------- Compartilhar ----------
document.addEventListener("click", async (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-compartilhar]");
  if (!b) return;
  const titulo = $("#m-titulo")?.textContent || document.title;
  const url = location.href;
  try {
    if (navigator.share) await navigator.share({ title: titulo, url });
    else { await navigator.clipboard.writeText(url); b.textContent = b.dataset.copiado || "Link copiado ✓"; }
  } catch {}
});

// ---------- Newsletter (modo demonstração enquanto não há serviço ligado) ----------
$$<HTMLFormElement>("form[data-newsletter='demo']").forEach((f) =>
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    const b = $("button", f);
    if (b) b.textContent = f.dataset.ok || "✓";
  })
);
