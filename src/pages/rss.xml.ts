import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { noticiasPublicadas, nomeCategoria } from "../lib/conteudo";
import { SITE } from "../config.js";
import { textos } from "../i18n";

export async function GET(context: APIContext) {
  const noticias = (await noticiasPublicadas()).slice(0, 50);
  return rss({
    title: SITE.nome,
    description: textos().lema,
    site: context.site!,
    trailingSlash: true,
    items: noticias.map((n) => ({
      title: n.data.titulo,
      description: `${n.data.resumo} (Fonte: ${n.data.fonte.nome})`,
      pubDate: n.data.publicadoEm,
      link: `/noticia/${n.id}/`,
      categories: [nomeCategoria(n.data.categoria), ...n.data.tags],
    })),
  });
}
