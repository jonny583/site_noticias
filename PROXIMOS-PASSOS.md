# Próximos passos do site

Site no ar: https://site-noticias-gules.vercel.app/ (atualiza sozinho a cada envio ao GitHub)

Para retomar com o Claude, diga: **"vamos continuar o site de notícias"**.

## 1. Definições suas (sem programar, destravam o resto)
- [ ] **Nome definitivo do site.** Com ele dá para comprar um domínio próprio (ex.: `.com.br`, cerca de R$ 40 por ano) e ligar à Vercel.
- [ ] **Cores e logo da Archilly**, para o selo e os cards.
- [ ] **Lista de produtos Archilly** para os cards do feed: imagem, uma frase e link de cada um.
- [x] **Endereço do seu blog pessoal**, para a coluna: stica.com.br/blog.
- [ ] **Seu nome, foto e uma frase de apresentação** para a coluna.

## 2. Robô de notícias (a parte principal)
- [ ] Criar a conta na Anthropic e gerar a chave da IA (custo estimado de US$ 5 a 20 por mês). Não colar a chave no chat: ela será guardada como "segredo" no GitHub.
- [ ] Montar a lista de fontes: portais brasileiros, sites internacionais e buscas no Google News.
- [ ] O robô busca as notícias 3 vezes por dia, tira as repetidas, dá uma nota de relevância e escreve o resumo com a fonte.
- [ ] Trocar as notícias fictícias (arquivos `exemplo-`) pelas reais.

## 3. Aprovação das notícias
- [ ] Criar um painel simples, que funciona no celular, para aprovar ou descartar notícias.
- [ ] Definir a regra do "misto": quais fontes são confiáveis e qual nota mínima deixa a notícia publicar sozinha.

## 4. Coluna e Archilly
- [x] Puxar automaticamente os posts do blog para a coluna (2 de Incorporações e 1 de Arquitetura, com imagem, em cartões verticais).
- [ ] Montar o site de novo sozinho todo dia, para os posts novos do blog aparecerem sem precisar de um envio ao GitHub (junto com o robô de notícias).
- [ ] **Opcional, com o amigo que cuida do servidor do blog:** o blog avisar o site na hora em que um post é publicado, para ele aparecer em cerca de 1 minuto. Ver "Pedido para o amigo do blog" abaixo.
- [ ] Colocar os cards reais da Archilly no lugar dos de exemplo.

### Pedido para o amigo do blog

**Situação:** hoje não é preciso mexer em nada no servidor do blog: o site já lê os posts. Este pedido só faz o post novo aparecer no site mais rápido.

**Antes de mandar:** criar na Vercel o "endereço de aviso" (Deploy Hook). Projeto site-noticias → Settings → Git → Deploy Hooks → nome `blog`, branch `main` → Create Hook. Copiar o endereço gerado e mandar ao amigo **só em mensagem particular**, nunca em grupo nem em público, porque quem tiver esse endereço consegue mandar o site ser montado de novo.

**Texto para mandar:**

> Oi! Estou fazendo um site de notícias do setor imobiliário (feito em Astro, publicado na Vercel) que mostra na capa os posts mais recentes do meu blog stica.com.br. Na hora de montar o site, ele lê a API do WordPress:
>
> `GET https://stica.com.br/wp-json/wp/v2/posts?per_page=30&_embed=wp:featuredmedia`
>
> (usa title, link, date_gmt, excerpt, categories e a imagem de destaque pelo _embed). Isso já funciona hoje. Queria te pedir duas coisas:
>
> 1. **Manter essa API aberta**: `/wp-json/wp/v2/posts` e `/wp-json/wp/v2/media` públicas, sem bloqueio de plugin de segurança, firewall ou cache para as requisições da Vercel.
> 2. **Avisar a Vercel quando um post for publicado, alterado ou despublicado**, chamando um Deploy Hook (um POST numa URL que te mando em particular). Assim o site é montado de novo na hora. Pensei em algo assim, num mu-plugin ou no functions.php do tema filho, com a URL guardada no wp-config.php (`define('VERCEL_DEPLOY_HOOK', '...');`) e não no código:
>
> ```
> add_action('transition_post_status', function ($novo, $antigo, $post) {
>     if ($post->post_type !== 'post' || !defined('VERCEL_DEPLOY_HOOK')) return;
>     if ($novo === 'publish' || $antigo === 'publish') {
>         wp_remote_post(VERCEL_DEPLOY_HOOK, ['blocking' => false, 'timeout' => 5]);
>     }
> }, 10, 3);
> ```
>
> Se preferir outro jeito (plugin de webhook, por exemplo), fica à vontade: o que importa é um POST nessa URL quando um post publicado mudar. Valeu!

## 5. Newsletter
- [ ] Criar a conta num serviço gratuito (Brevo ou Buttondown) e ligar o formulário do site.
- [ ] Depois, o resumo semanal com as melhores notícias e um destaque Archilly, montado automaticamente.

## 6. Acabamento e divulgação
- [ ] Fazer os ajustes de visual que ficaram pendentes.
- [ ] Indicadores reais na faixa do topo (Selic, INCC, IGP-M, dólar), atualizados automaticamente.
- [ ] Cadastrar o site no Google Search Console, para ele aparecer nas buscas.
- [ ] Contador de visitas (Vercel Analytics, grátis).
- [ ] Calibrar fontes e notas depois de 1 ou 2 semanas de uso.

## Mais para frente
- [ ] Revisar as categorias dos posts no blog (ex.: "Por que cidades bem planejadas geram mais valor" está só em Arquitetura). Por enquanto fica como está: 2 de Incorporações e 1 de Arquitetura.
- [ ] Versão em inglês (o site já está preparado para isso).
- [ ] Busca por palavra dentro do site.
- [ ] Página para cada região ou cidade.

**Sugestão:** ao retomar, resolver primeiro o item 1 (rápido, sem programação) e seguir direto para o item 2, que é o que faz o site ganhar vida com notícias reais.
