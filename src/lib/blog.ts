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

// Quantos posts de cada seção do blog vão para a capa (SITE.blogSecoes),
// na ordem da lista. Um post que está em duas seções conta só uma vez.
export async function postsDoBlog(): Promise<PostBlog[]> {
  if (!SITE.blogApi) return [];
  try {
    const resp = await fetch(`${SITE.blogApi}?per_page=30&_embed=wp:featuredmedia`, { signal: AbortSignal.timeout(15000) });
    if (!resp.ok) return [];
    const posts = ((await resp.json()) as any[])
      .map((p) => ({
        categorias: (p.categories ?? []) as number[],
        titulo: limpar(p.title?.rendered ?? ""),
        link: p.link as string,
        data: new Date(p.date_gmt ? p.date_gmt + "Z" : p.date),
        resumo: limpar(p.excerpt?.rendered ?? ""),
        imagem: p._embedded?.["wp:featuredmedia"]?.[0]?.source_url as string | undefined,
      }))
      .filter((p) => p.titulo && p.imagem);   // só posts com imagem de capa, como os cartões do blog

    const escolhidos: typeof posts = [];
    for (const secao of SITE.blogSecoes) {
      posts
        .filter((p) => p.categorias.includes(secao.categoria) && !escolhidos.includes(p))
        .slice(0, secao.quantos)
        .forEach((p) => escolhidos.push(p));
    }
    return escolhidos
      .sort((a, b) => b.data.getTime() - a.data.getTime())
      .map(({ categorias, ...p }) => p);
  } catch {
    return [];
  }
}
