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
- [x] Puxar automaticamente os posts do blog para a coluna (os 3 mais recentes, com imagem, em cartões verticais).
- [ ] Montar o site de novo sozinho todo dia, para os posts novos do blog aparecerem sem precisar de um envio ao GitHub (junto com o robô de notícias).
- [ ] Colocar os cards reais da Archilly no lugar dos de exemplo.

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
- [ ] Versão em inglês (o site já está preparado para isso).
- [ ] Busca por palavra dentro do site.
- [ ] Página para cada região ou cidade.

**Sugestão:** ao retomar, resolver primeiro o item 1 (rápido, sem programação) e seguir direto para o item 2, que é o que faz o site ganhar vida com notícias reais.
