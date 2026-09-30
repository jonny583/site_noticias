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

type PostComCategorias = PostBlog & { categorias: number[] };

// O blog é consultado uma vez só, mesmo que várias páginas usem os posts
let consulta: Promise<PostComCategorias[]> | undefined;

function todosOsPosts() {
  consulta ??= (async () => {
    if (!SITE.blogApi) return [];
    try {
      const resp = await fetch(`${SITE.blogApi}?per_page=30&_embed=wp:featuredmedia`, { signal: AbortSignal.timeout(15000) });
      if (!resp.ok) return [];
      return ((await resp.json()) as any[])
        .map((p) => ({
          categorias: (p.categories ?? []) as number[],
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

export interface SecaoBlog { nome: string; categoria: number; quantos: number }
export interface GrupoBlog { nome: string; posts: PostBlog[] }

// Os posts mais recentes de cada seção do blog, na ordem da lista.
// Um post que está em duas seções aparece só na primeira.
export async function gruposDoBlog(secoes: SecaoBlog[]): Promise<GrupoBlog[]> {
  const posts = await todosOsPosts();
  const usados = new Set<PostComCategorias>();
  return secoes
    .map((secao) => {
      const escolhidos = posts.filter((p) => p.categorias.includes(secao.categoria) && !usados.has(p)).slice(0, secao.quantos);
      escolhidos.forEach((p) => usados.add(p));
      return { nome: secao.nome, posts: escolhidos.map(({ categorias, ...p }) => p) };
    })
    .filter((g) => g.posts.length > 0);
}
