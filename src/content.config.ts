import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { CATEGORIAS } from "./lib/categorias";

// Uma notícia garimpada pela IA: resumo próprio + crédito da fonte.
const noticias = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/noticias" }),
  schema: z.object({
    titulo: z.string(),
    resumo: z.string(),
    categoria: z.enum(CATEGORIAS),
    fonte: z.object({ nome: z.string(), url: z.url() }),
    publicadoEm: z.coerce.date(),
    imagem: z.url().optional(),
    creditoImagem: z.string().optional(),
    regiao: z.string().optional(),
    tags: z.array(z.string()).default([]),
    nota: z.number().min(0).max(10).optional(), // relevância dada pela IA
    destaque: z.boolean().default(false),
    lang: z.string().default("pt"),
    rascunho: z.boolean().default(false),
  }),
});

// Posts da coluna, importados do blog pessoal.
const coluna = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/coluna" }),
  schema: z.object({
    titulo: z.string(),
    resumo: z.string(),
    publicadoEm: z.coerce.date(),
    urlOriginal: z.url().optional(),
    imagem: z.url().optional(),
    lang: z.string().default("pt"),
  }),
});

// Cards patrocinados da Archilly que aparecem no meio do feed.
const archilly = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/archilly" }),
  schema: z.object({
    titulo: z.string(),
    resumo: z.string(),
    chamada: z.string().default("Conhecer"),
    // Pergunta curta que abre a chamada (ex.: "Estudando um terreno?")
    pergunta: z.string().optional(),
    // Abas em que este produto aparece no fim das notícias
    editorias: z.array(z.enum(CATEGORIAS)).default([]),
    url: z.url(),
    imagem: z.string().optional(),
    ativo: z.boolean().default(true),
    ordem: z.number().default(0),
  }),
});

export const collections = { noticias, coluna, archilly };
