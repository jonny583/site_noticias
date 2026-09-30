// Dados gerais do site — mude aqui o nome, endereço e links.
export const SITE = {
  nome: "Radar Incorpora",
  nomeMarca: ["Radar", "Incorpora"], // exibido como "Radar.Incorpora" no cabeçalho
  url: "https://site-noticias-gules.vercel.app",
  archillyUrl: "https://archilly.com.br",
  colunista: "Jonny Stica",
  // Blog do colunista (WordPress): os posts mais recentes aparecem na Coluna da capa
  blogUrl: "https://stica.com.br/blog/",
  blogApi: "https://stica.com.br/wp-json/wp/v2/posts",
  // Quais seções do blog entram na Coluna, e quantos posts de cada.
  // "categoria" é o número da categoria no WordPress (8 = Incorporações, 10 = Arquitetura).
  // Na capa:
  blogCapa: [
    { nome: "Incorporações", categoria: 8, quantos: 2 },
    { nome: "Arquitetura e Urbanismo", categoria: 10, quantos: 1 },
  ],
  // No fim da página de cada aba (editoria). Aba que não está aqui fica sem Coluna.
  blogPorEditoria: {
    mundo: [{ nome: "Arquitetura e Urbanismo", categoria: 10, quantos: 3 }],
  },
  emailContato: "contato@archilly.com.br",
  // Formulário da newsletter (Brevo/Buttondown). Vazio = formulário de demonstração.
  newsletterAction: "",
  // A cada quantas notícias aparece um card Archilly no feed
  archillyACada: 6,
};
