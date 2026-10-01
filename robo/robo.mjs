// Robô garimpeiro de notícias.
// 1. Lê os feeds de robo/fontes.json.
// 2. Separa o que é novo (não visto antes) e recente.
// 3. Manda para o Gemini, que escolhe o que interessa, dá nota, categoria e escreve o resumo.
// 4. Salva cada notícia escolhida como arquivo em src/content/noticias.
//
// Rodar no computador:  npm run robo           (salva as notícias)
//                       npm run robo -- --teste (só mostra, não salva nada)
// A chave fica no arquivo .env (no computador) ou no segredo GEMINI_API_KEY (no GitHub).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PASTA_NOTICIAS = path.join(RAIZ, "src/content/noticias");
const ARQ_FONTES = path.join(RAIZ, "robo/fontes.json");
const ARQ_VISTOS = path.join(RAIZ, "robo/vistos.json");
const CATEGORIAS = ["condominios-loteamentos", "edificios", "mercado", "mundo", "inovacao", "legislacao"];

// Regras do robô (dá para ajustar aqui)
const NOTA_PUBLICAR = 7;   // nota a partir da qual a notícia vai direto para o site
const NOTA_RASCUNHO = 5;   // entre esta e a de cima: salva escondida (rascunho), para aprovar depois
const MAX_POR_RODADA = 8;  // no máximo quantas notícias novas por vez
const MAX_PARA_IA = 60;    // no máximo quantos itens mandar para a IA de uma vez
const HORAS_RECENTE = 48;  // ignora notícias mais velhas que isso
const MAX_POR_FONTE = 8;   // de cada fonte, só as mais recentes (para nenhuma dominar)

const TESTE = process.argv.includes("--teste");

// No computador, a chave vem do .env. No GitHub, ela já chega pronta.
if (fs.existsSync(path.join(RAIZ, ".env"))) process.loadEnvFile(path.join(RAIZ, ".env"));
const CHAVE = process.env.GEMINI_API_KEY;
// Primeiro o modelo escolhido; se estiver sobrecarregado, os reservas.
const MODELOS = [...new Set([process.env.GEMINI_MODEL || "gemini-flash-latest", "gemini-flash-lite-latest", "gemini-2.5-flash"])];
if (!CHAVE) {
  console.error("Falta a chave: preencha GEMINI_API_KEY no arquivo .env (ou no segredo do GitHub).");
  process.exit(1);
}

// ---------- 1. Ler os feeds ----------

function limpar(txt = "") {
  return txt
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
    .replace(/\s+/g, " ").trim();
}

function campo(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? m[1] : "";
}

function imagemDoItem(xml) {
  const m =
    xml.match(/<media:content[^>]*url="([^"]+)"/i) ||
    xml.match(/<media:thumbnail[^>]*url="([^"]+)"/i) ||
    xml.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/i) ||
    xml.match(/<enclosure[^>]*type="image[^>]*url="([^"]+)"/i);
  return m ? m[1].replace(/&amp;/g, "&") : undefined;
}

async function lerFeed(fonte) {
  const resp = await fetch(fonte.url, { headers: { "User-Agent": "Mozilla/5.0 (RadarIncorpora robo)" }, signal: AbortSignal.timeout(20000) });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const xml = await resp.text();
  const itens = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  return itens.map((it) => {
    const doGoogle = fonte.url.includes("news.google.com");
    let titulo = limpar(campo(it, "title"));
    let nomeFonte = fonte.nome;
    if (doGoogle) {
      // No Google News, a fonte real vem em <source> e também no fim do título ("... - Nome")
      nomeFonte = limpar(campo(it, "source")) || nomeFonte;
      titulo = titulo.replace(new RegExp(`\\s+-\\s+${nomeFonte.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), "");
    }
    const texto = limpar(campo(it, "content:encoded")) || limpar(campo(it, "description"));
    return {
      titulo,
      url: limpar(campo(it, "link")),
      data: new Date(limpar(campo(it, "pubDate")) || Date.now()),
      fonte: nomeFonte,
      texto: doGoogle ? "" : texto.slice(0, 1200),
      imagem: imagemDoItem(it),
    };
  }).filter((i) => i.titulo && i.url);
}

// ---------- 2. O que já foi visto ----------

const normalizar = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

function lerVistos() {
  try { return JSON.parse(fs.readFileSync(ARQ_VISTOS, "utf8")); } catch { return { urls: [], titulos: [] }; }
}

function titulosJaPublicados() {
  return fs.readdirSync(PASTA_NOTICIAS)
    .filter((a) => a.endsWith(".md") && !a.startsWith("exemplo-"))
    .map((a) => fs.readFileSync(path.join(PASTA_NOTICIAS, a), "utf8").match(/^titulo:\s*"(.*)"/m)?.[1])
    .filter(Boolean);
}

// ---------- 3. Perguntar ao Gemini ----------

const INSTRUCOES = `Você é o editor do "Radar Incorpora", um portal brasileiro de notícias para quem trabalha com
incorporação imobiliária, loteamentos, condomínios, arquitetura e urbanismo.

Você recebe uma lista de notícias (id, título, fonte, data e, às vezes, um trecho do texto).
Escolha só as que interessam a esse público: lançamentos e projetos imobiliários, loteamentos e condomínios,
bairros planejados, mercado imobiliário e crédito, custos de construção (INCC), legislação urbana
(plano diretor, zoneamento, Reurb, licenciamento), inovação na construção e grandes projetos de
arquitetura e urbanismo no mundo. Descarte política geral, crimes, anúncios de imóvel à venda,
notas de serviço sem interesse para o setor, sites de fofoca/entretenimento ou de origem duvidosa e notícias repetidas (mesmo fato em fontes diferentes:
fique com a mais completa). Descarte também o que repetir um destes assuntos já publicados:
{{JA_PUBLICADOS}}

Para cada notícia escolhida, devolva:
- id: o id recebido
- nota: de 0 a 10, quanto interessa ao público (10 = imperdível)
- categoria: uma destas: ${CATEGORIAS.join(", ")}
  (mundo = arquitetura/urbanismo fora do Brasil; edificios = prédios e incorporação vertical)
- titulo: título próprio em português, claro e curto (até 90 caracteres), sem sensacionalismo
- resumo: 2 a 3 frases em português, com suas palavras (não copie o texto da fonte). Use só o que está
  no título e no trecho; não invente números, nomes nem fatos, nem acrescente adjetivos
  ("nobre", "de destaque", "bilhões") que não estejam lá. Se só houver o título, faça 1 frase que diga
  apenas o que o título diz.
- regiao: cidade/estado, "Brasil" ou o país, se der para saber; senão deixe vazio
- tags: de 1 a 3 palavras-chave curtas

Devolva no máximo ${MAX_POR_RODADA} notícias, as de nota mais alta. Se nada interessar, devolva uma lista vazia.`;

const ESQUEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      id: { type: "INTEGER" },
      nota: { type: "INTEGER" },
      categoria: { type: "STRING", enum: CATEGORIAS },
      titulo: { type: "STRING" },
      resumo: { type: "STRING" },
      regiao: { type: "STRING" },
      tags: { type: "ARRAY", items: { type: "STRING" } },
    },
    required: ["id", "nota", "categoria", "titulo", "resumo"],
  },
};

async function perguntarAoGemini(itens, jaPublicados) {
  const lista = itens.map((it, id) => ({
    id, titulo: it.titulo, fonte: it.fonte, data: it.data.toISOString().slice(0, 10), trecho: it.texto || undefined,
  }));
  const instrucoes = INSTRUCOES.replace("{{JA_PUBLICADOS}}", jaPublicados.length ? jaPublicados.map((t) => `- ${t}`).join("\n") : "(nenhum ainda)");

  const corpo = JSON.stringify({
    systemInstruction: { parts: [{ text: instrucoes }] },
    contents: [{ role: "user", parts: [{ text: JSON.stringify(lista) }] }],
    generationConfig: { responseMimeType: "application/json", responseSchema: ESQUEMA, temperature: 0.3 },
  });

  // Se o modelo estiver sobrecarregado (acontece no plano grátis), espera e tenta de novo; depois tenta os reservas.
  let ultimoErro;
  for (const modelo of MODELOS) {
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": CHAVE },
        body: corpo,
        signal: AbortSignal.timeout(180000),
      }).catch((e) => ({ ok: false, status: 0, text: async () => e.message }));
      if (resp.ok) {
        const json = await resp.json();
        const texto = json.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "[]";
        console.log(`(respondido pelo ${modelo})`);
        return JSON.parse(texto);
      }
      ultimoErro = `${modelo} respondeu ${resp.status}: ${(await resp.text()).slice(0, 300)}`;
      if (![0, 429, 500, 503].includes(resp.status)) throw new Error(ultimoErro); // erro de verdade (ex.: chave errada)
      console.log(`${modelo} ocupado (${resp.status}), tentativa ${tentativa} de 3...`);
      if (tentativa < 3) await new Promise((r) => setTimeout(r, 20000 * tentativa));
    }
  }
  throw new Error(`Nenhum modelo do Gemini respondeu. Último erro: ${ultimoErro}`);
}

// ---------- 4. Imagem e arquivo ----------

// Se o feed não trouxe imagem, tenta a imagem de capa da própria página (og:image).
async function buscarImagem(url) {
  if (url.includes("news.google.com")) return undefined; // links do Google News não abrem fora do navegador
  try {
    const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(15000) });
    const html = (await resp.text()).slice(0, 200000);
    const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return m && /^https?:\/\//.test(m[1]) ? m[1].replace(/&amp;/g, "&") : undefined;
  } catch { return undefined; }
}

const slug = (t) => normalizar(t).split(" ").slice(0, 8).join("-");

function salvarNoticia(it, n) {
  const dia = it.data.toISOString().slice(0, 10);
  let nome = `${dia}-${slug(n.titulo)}`;
  for (let i = 2; fs.existsSync(path.join(PASTA_NOTICIAS, `${nome}.md`)); i++) nome = `${dia}-${slug(n.titulo)}-${i}`;
  const s = (v) => JSON.stringify(v); // texto entre aspas, com acentos e aspas internas protegidos
  const linhas = [
    "---",
    `titulo: ${s(n.titulo)}`,
    `resumo: ${s(n.resumo)}`,
    `categoria: ${n.categoria}`,
    "fonte:",
    `  nome: ${s(it.fonte)}`,
    `  url: ${s(it.url)}`,
    `publicadoEm: ${it.data.toISOString()}`,
    it.imagem && `imagem: ${s(it.imagem)}`,
    it.imagem && `creditoImagem: ${s(`Imagem: ${it.fonte}`)}`,
    n.regiao && `regiao: ${s(n.regiao)}`,
    `tags: ${s((n.tags || []).slice(0, 3))}`,
    `nota: ${n.nota}`,
    `destaque: ${n.nota >= 9}`,
    `rascunho: ${n.nota < NOTA_PUBLICAR}`,
    "---",
    "",
  ].filter(Boolean);
  fs.writeFileSync(path.join(PASTA_NOTICIAS, `${nome}.md`), linhas.join("\n"));
  return nome;
}

// ---------- Rodada ----------

const { fontes } = JSON.parse(fs.readFileSync(ARQ_FONTES, "utf8"));
const vistos = lerVistos();
const urlsVistas = new Set(vistos.urls);
const titulosVistos = new Set(vistos.titulos);
const limite = Date.now() - HORAS_RECENTE * 3600 * 1000;

let novos = [];
for (const fonte of fontes.filter((f) => f.ativa)) {
  try {
    const itens = await lerFeed(fonte);
    const frescos = itens.filter((i) => i.data.getTime() >= limite && !urlsVistas.has(i.url) && !titulosVistos.has(normalizar(i.titulo)));
    console.log(`${fonte.nome}: ${itens.length} no feed, ${frescos.length} novos`);
    novos.push(...frescos.sort((a, b) => b.data - a.data).slice(0, MAX_POR_FONTE));
  } catch (e) {
    console.log(`${fonte.nome}: não consegui ler (${e.message})`);
  }
}

// Tira repetidos entre fontes (mesmo título) e fica com os mais recentes
const porTitulo = new Map();
for (const it of novos) if (!porTitulo.has(normalizar(it.titulo))) porTitulo.set(normalizar(it.titulo), it);
novos = [...porTitulo.values()].sort((a, b) => b.data - a.data).slice(0, MAX_PARA_IA);

if (!novos.length) {
  console.log("Nada novo desta vez.");
  process.exit(0);
}

console.log(`\nMandando ${novos.length} itens para o Gemini (${MODELOS[0]})...`);
const escolhidas = (await perguntarAoGemini(novos, titulosJaPublicados().slice(-40)))
  .filter((n) => novos[n.id] && n.nota >= NOTA_RASCUNHO && CATEGORIAS.includes(n.categoria))
  .sort((a, b) => b.nota - a.nota)
  .slice(0, MAX_POR_RODADA);

console.log(`O Gemini escolheu ${escolhidas.length}:\n`);
for (const n of escolhidas) {
  const it = novos[n.id];
  if (!it.imagem) it.imagem = await buscarImagem(it.url);
  const situacao = n.nota >= NOTA_PUBLICAR ? "publica" : "rascunho";
  console.log(`[${n.nota} ${situacao}] ${n.categoria} | ${n.titulo}\n   ${n.resumo}\n   fonte: ${it.fonte}${it.imagem ? " (com imagem)" : ""}\n`);
  if (!TESTE) salvarNoticia(it, n);
}

// Guarda tudo o que foi mandado para a IA, para não mandar de novo (e não gastar à toa)
if (!TESTE) {
  const urls = [...vistos.urls, ...novos.map((i) => i.url)].slice(-3000);
  const titulos = [...vistos.titulos, ...novos.map((i) => normalizar(i.titulo))].slice(-3000);
  fs.writeFileSync(ARQ_VISTOS, JSON.stringify({ urls, titulos }, null, 0) + "\n");
  console.log("Pronto: notícias salvas em src/content/noticias.");
} else {
  console.log("Modo teste: nada foi salvo.");
}
