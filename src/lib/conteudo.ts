import { getCollection, type CollectionEntry } from "astro:content";
import { localeData, textos, type Idioma, IDIOMA_PADRAO } from "../i18n";
import type { Categoria } from "./categorias";

export type Noticia = CollectionEntry<"noticias">;
export type Coluna = CollectionEntry<"coluna">;
export type CardArchilly = CollectionEntry<"archilly">;

const maisNovas = <T extends { data: { publicadoEm: Date } }>(a: T, b: T) =>
  b.data.publicadoEm.getTime() - a.data.publicadoEm.getTime();

export async function noticiasPublicadas(idioma: Idioma = IDIOMA_PADRAO) {
  const todas = await getCollection("noticias", ({ data }) => !data.rascunho && data.lang === idioma);
  return todas.sort(maisNovas);
}

export async function colunas(idioma: Idioma = IDIOMA_PADRAO) {
  const todas = await getCollection("coluna", ({ data }) => data.lang === idioma);
  return todas.sort(maisNovas);
}

/** Produto Archilly para o fim de uma notícia: o ligado à aba dela; se nenhum for, o primeiro. */
export function produtoPara(categoria: string, produtos: CardArchilly[]) {
  return produtos.find((p) => (p.data.editorias as string[]).includes(categoria)) ?? produtos[0];
}

export async function cardsArchilly() {
  const todos = await getCollection("archilly", ({ data }) => data.ativo);
  return todos.sort((a, b) => a.data.ordem - b.data.ordem);
}

/** Destaques do carrossel: os marcados como destaque; se faltar, completa com as de maior nota. */
export function escolherDestaques(lista: Noticia[], quantos = 5) {
  const marcados = lista.filter((n) => n.data.destaque).slice(0, quantos);
  if (marcados.length >= quantos) return marcados;
  const recentes = lista.slice(0, 20).filter((n) => !marcados.includes(n) && n.data.imagem);
  recentes.sort((a, b) => (b.data.nota ?? 0) - (a.data.nota ?? 0));
  return [...marcados, ...recentes.slice(0, quantos - marcados.length)];
}

export function nomeCategoria(c: Categoria, idioma: Idioma = IDIOMA_PADRAO) {
  return textos(idioma).categorias[c];
}

/** "há 2 h", "ontem", "12 de set." */
export function dataRelativa(d: Date, agora = new Date(), idioma: Idioma = IDIOMA_PADRAO) {
  const horas = Math.floor((agora.getTime() - d.getTime()) / 3.6e6);
  if (horas < 1) return "agora";
  if (horas < 24) return `há ${horas} h`;
  if (horas < 48) return "ontem";
  return d.toLocaleDateString(localeData(idioma), { day: "numeric", month: "short" });
}

export function dataCompleta(d: Date, idioma: Idioma = IDIOMA_PADRAO) {
  return d.toLocaleDateString(localeData(idioma), { day: "numeric", month: "long", year: "numeric" });
}

/** Dados enxutos de cada notícia, entregues ao navegador para abrir a janela sem recarregar. */
export function paraJanela(n: Noticia, idioma: Idioma = IDIOMA_PADRAO) {
  const d = n.data;
  return {
    id: n.id,
    titulo: d.titulo,
    resumo: d.resumo,
    categoria: nomeCategoria(d.categoria, idioma),
    tags: d.tags,
    fonte: d.fonte,
    data: dataCompleta(d.publicadoEm, idioma),
    regiao: d.regiao ?? "",
    imagem: d.imagem ?? "",
    creditoImagem: d.creditoImagem ?? d.fonte.nome,
  };
}
