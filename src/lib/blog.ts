// Posts do blog do colunista (WordPress), buscados na hora de montar o site.
// Se o blog não responder, devolve lista vazia e a capa usa a coluna local.
import { SITE } from "../config.js";

export interface PostBlog {
  titulo: string;
  link: string;
  data: Date;
  resumo: string;
  imagem?: string;
}

// O WordPress manda títulos com códigos como &#8211; no lugar de "–"
function limpar(html: string) {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&hellip;/g, "…")
    .replace(/\s*\[…\]\s*$/, "…")
    .trim();
}

type PostComCategorias = PostBlog & { categorias: number[]; tags: string[] };

// "#Inovação" -> "inovacao": sem #, sem acento, minúsculas
const semAcento = (texto: string) =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");

// As # (tags) do blog: número da tag -> nomes aceitos (o endereço curto e o nome sem acento)
async function tagsDoBlog(): Promise<Map<number, string[]>> {
  const resp = await fetch(SITE.blogApi.replace(/\/posts$/, "/tags") + "?per_page=100&_fields=id,name,slug", { signal: AbortSignal.timeout(15000) });
  if (!resp.ok) return new Map();
  const tags = (await resp.json()) as { id: number; name: string; slug: string }[];
  return new Map(tags.map((t) => [t.id, [semAcento(t.slug), semAcento(limpar(t.name))]]));
}

// O blog é consultado uma vez só, mesmo que várias páginas usem os posts
let consulta: Promise<PostComCategorias[]> | undefined;

function todosOsPosts() {
  consulta ??= (async () => {
    if (!SITE.blogApi) return [];
    try {
      const [resp, tags] = await Promise.all([
        fetch(`${SITE.blogApi}?per_page=30&_embed=wp:featuredmedia`, { signal: AbortSignal.timeout(15000) }),
        tagsDoBlog().catch(() => new Map<number, string[]>()),
      ]);
      if (!resp.ok) return [];
      return ((await resp.json()) as any[])
        .map((p) => ({
          categorias: (p.categories ?? []) as number[],
          tags: ((p.tags ?? []) as number[]).flatMap((id) => tags.get(id) ?? []),
          titulo: limpar(p.title?.rendered ?? ""),
          link: p.link as string,
          data: new Date(p.date_gmt ? p.date_gmt + "Z" : p.date),
          resumo: limpar(p.excerpt?.rendered ?? ""),
          imagem: p._embedded?.["wp:featuredmedia"]?.[0]?.source_url as string | undefined,
        }))
        .filter((p) => p.titulo && p.imagem);   // só posts com imagem de capa, como os cartões do blog
    } catch {
      return [];
    }
  })();
  return consulta;
}

// Uma seção pega os posts de uma seção do blog (categoria) ou os que têm alguma das # (tags)
export interface SecaoBlog { nome: string; categoria?: number; tags?: string[]; quantos: number }
export interface GrupoBlog { nome: string; posts: PostBlog[] }

// Os posts mais recentes de cada seção do blog, na ordem da lista.
// Um post que está em duas seções aparece só na primeira.
export async function gruposDoBlog(secoes: SecaoBlog[]): Promise<GrupoBlog[]> {
  const posts = await todosOsPosts();
  const usados = new Set<PostComCategorias>();
  return secoes
    .map((secao) => {
      const tagsAceitas = (secao.tags ?? []).map(semAcento);
      const combina = (p: PostComCategorias) =>
        (secao.categoria !== undefined && p.categorias.includes(secao.categoria)) || p.tags.some((t) => tagsAceitas.includes(t));
      const escolhidos = posts.filter((p) => combina(p) && !usados.has(p)).slice(0, secao.quantos);
      escolhidos.forEach((p) => usados.add(p));
      return { nome: secao.nome, posts: escolhidos.map(({ categorias, tags, ...p }) => p) };
    })
    .filter((g) => g.posts.length > 0);
}
