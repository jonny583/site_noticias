import pt from "./pt.json";

// Para um novo idioma: crie en.json com as mesmas chaves e acrescente aqui.
const DICIONARIOS = { pt } as const;
export type Idioma = keyof typeof DICIONARIOS;
export const IDIOMA_PADRAO: Idioma = "pt";

const LOCALE_DATA: Record<Idioma, string> = { pt: "pt-BR" };

export function textos(idioma: Idioma = IDIOMA_PADRAO) {
  return DICIONARIOS[idioma] ?? DICIONARIOS[IDIOMA_PADRAO];
}

export function localeData(idioma: Idioma = IDIOMA_PADRAO) {
  return LOCALE_DATA[idioma];
}
