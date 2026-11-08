# Variações do estilo aprovado (complemento ao contrato)

Leia PRIMEIRO o contrato base: /tmp/claude-0/-home-user-kidsschooling/cf3163ca-568f-5154-9311-fb9e0793a0c2/scratchpad/anim/SCENE_SPEC.md. Tudo dele vale (interface `window.SCENES[id].mount(host) -> {destroy}`, three.js r128 global, sem rede, fontes disponíveis, HUD em DOM, safe areas, desempenho de celular de entrada, testes com Playwright olhando screenshots), EXCETO o roteiro, que muda por cena, conforme abaixo.

## O estilo aprovado (não pode mudar)
O cliente APROVOU o estilo da cena `combinado`: /tmp/claude-0/-home-user-kidsschooling/cf3163ca-568f-5154-9311-fb9e0793a0c2/scratchpad/anim2/scenes/combinado.js. Estude esse arquivo a fundo e REAPROVEITE o código dele (copie para dentro do seu arquivo as funções de personagens, blocos de encaixe próprios com pinos hexagonais e travas borboleta, materiais com rim light, HUD em cartões creme com Fredoka/Nunito Sans e ícones SVG flat, transições). Os personagens Herói (10 anos, roupa azul, mochila laranja) e Mestre Tomé devem ser IDÊNTICOS aos de lá. Mentores novos seguem o mesmo traço e proporções.

O objetivo destas cenas é mostrar ao cliente que, dentro do mesmo estilo, a CÂMERA (zoom, ângulo) e a PALETA DE CORES/LUZ mudam conforme a região, a hora do dia e o tipo de exercício. Cada cena precisa ter uma paleta e luz claramente diferentes do dia pastel da vila, e um enquadramento de câmera próprio, mantendo a identidade (mesmos personagens, mesmo HUD, mesmos blocos).

## Ritmo
Loop sem emenda de **6 segundos** (pode ir até 7 s se precisar). O primeiro quadro (t=0) já é uma tela bonita e completa. Se a cena tiver um zoom, mostre a transição: começa no enquadramento alto padrão da exploração e aproxima (ou o contrário), para o cliente ver a mudança de câmera acontecendo.

## HUD
Mantenha a barra de topo (avatar, Nível, XP) e o padrão de cartões, mas adapte os elementos ao momento (cartão de exercício, barra de ferramentas de construção, modo prova etc.). Textos em português, legíveis no celular. "+XP" no fim de cada exercício.

## Valores
Visual acolhedor, sem violência, sem armas, nada assustador. Conteúdo cristão tratado com reverência e simplicidade. Personagens originais.

## Teste e entrega
Teste como no contrato base (390x844 e 360x780, tempos espalhados pelo loop, zero erros de console, troca de cena/destroy). Há um three r128 local em /tmp/claude-0/-home-user-kidsschooling/cf3163ca-568f-5154-9311-fb9e0793a0c2/scratchpad/threetmp/package/build/three.min.js para servir via page.route. A página de teste é /tmp/claude-0/-home-user-kidsschooling/cf3163ca-568f-5154-9311-fb9e0793a0c2/scratchpad/anim2/index.html (abra com #<id>; não edite). Screenshots só fora da pasta anim2. Faça pelo menos 3 rodadas de ajuste visual. Responda com o(s) arquivo(s) escrito(s) e um resumo curto.
