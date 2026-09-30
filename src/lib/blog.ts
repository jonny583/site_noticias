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

export async function postsDoBlog(quantos = 3): Promise<PostBlog[]> {
  if (!SITE.blogApi) return [];
  try {
    const resp = await fetch(`${SITE.blogApi}?per_page=10&_embed=wp:featuredmedia`, { signal: AbortSignal.timeout(15000) });
    if (!resp.ok) return [];
    const posts: any[] = await resp.json();
    return posts
      .map((p) => ({
        titulo: limpar(p.title?.rendered ?? ""),
        link: p.link,
        data: new Date(p.date_gmt ? p.date_gmt + "Z" : p.date),
        resumo: limpar(p.excerpt?.rendered ?? ""),
        imagem: p._embedded?.["wp:featuredmedia"]?.[0]?.source_url,
      }))
      .filter((p) => p.titulo && p.imagem)   // só posts com imagem de capa, como os cartões do blog
      .slice(0, quantos);
  } catch {
    return [];
  }
}
