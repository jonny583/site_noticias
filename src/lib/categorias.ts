// Editorias do site. O código (slug) vai no endereço e nos arquivos;
// o nome exibido vem do dicionário de idioma (src/i18n).
export const CATEGORIAS = [
  "condominios-loteamentos",
  "edificios",
  "mercado",
  "mundo",
  "inovacao",
  "legislacao",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];
