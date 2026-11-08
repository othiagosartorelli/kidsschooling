# Contrato das cenas animadas (leia inteiro)

Projeto: RPG educativo para crianças de famílias cristãs (KidsSchooling). O cliente está escolhendo o ESTILO VISUAL do jogo e quer ver cada estilo "como se estivesse dentro do jogo", numa tela cheia de celular, com uma animação curta em loop. A página-moldura já existe: `index.html` nesta pasta. Ela carrega o three.js r128 (global `THREE`, de https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js) e depois `scenes/<id>.js` para cada estilo. Você escreve SÓ os arquivos `scenes/<id>.js` que lhe foram atribuídos.

## Interface obrigatória
```js
(function(){
  window.SCENES = window.SCENES || {};
  window.SCENES['<id>'] = {
    mount: function (host) {   // host: div vazia, position:absolute; inset:0; overflow:hidden
      // ... cria canvas/DOM dentro de host, inicia o loop
      return { destroy: function () { /* cancelAnimationFrame, renderer.dispose(), geometrias/materiais, ResizeObserver.disconnect(), host.innerHTML='' */ } };
    }
  };
})();
```
- Um arquivo autocontido, JS puro (ES5/ES2015 sem módulos, sem import). Nada de rede: nenhuma imagem, textura ou fonte externa. Texturas, se precisar, geradas em canvas no código.
- `host` é retrato (portrait). Tamanhos variam: ~360x780 dentro da moldura, ~390x844 em tela cheia de celular, outros. Use ResizeObserver no host e refaça o layout/câmera. Limite devicePixelRatio a 2.
- Deve rodar liso em celular comum: poucos polígonos, sem sombras caras (no máximo uma shadow map pequena), sem pós-processamento pesado. Mire 60fps em celular médio.
- Fontes disponíveis (carregadas pela página): 'Fredoka', 'Nunito Sans', 'Pixelify Sans', 'Patrick Hand', 'Baloo 2', 'Lilita One'. Sempre com fallback (system-ui, sans-serif).
- Nunca use estilo/cor global da página; tudo dentro do host. CSS: use estilos inline ou um <style> criado dentro do host com classes prefixadas por `<id>-`.

## Roteiro (igual em TODAS as cenas, para comparação justa)
Loop contínuo e sem emenda de **3,6 segundos**:
- Cenário: uma vila pequena à beira de um riacho, de dia, céu bonito. Uma ponte de madeira sobre o riacho com UMA tábua/viga faltando. Árvores, uma casinha, detalhes do estilo.
- **Herói**: criança de uns 10 anos, simpática, roupa azul, mochila laranja. Design ORIGINAL (não copie nenhum personagem existente: nada de Steve, Mario, Link etc.).
- **Mentor "Mestre Tomé"**: senhor construtor sorridente, barba branca, capacete/chapéu amarelo, avental marrom. Original.
- 0,0–1,2s: herói caminha (anima pernas/balanço) em direção à ponte. Câmera com leve movimento (pan/dolly suave).
- ~0,8s: aparece o balão de fala do Mestre Tomé: "A viga precisa se apoiar dos dois lados!"
- ~1,6–2,4s: a peça que faltava surge/desce e se encaixa na ponte (com um efeitinho: brilho, poeira, estrelinhas).
- ~2,4s: "+50 XP" sobe e some; a barra de XP enche um pouco.
- 3,0–3,6s: tudo volta suavemente ao estado inicial para o loop fechar sem pulo (ex.: fade curto ou reposicionamento disfarçado).
- O PRIMEIRO quadro (t=0) já deve parecer uma tela de jogo bonita e completa (vira miniatura).

## HUD (interface do jogo, em DOM sobre o canvas, com o visual do estilo)
Mesmo conteúdo em todas as cenas, em português:
- Topo (respeite `env(safe-area-inset-top)` + uns 34px de folga para o entalhe do celular): avatar redondo do herói, "Nível 4 · Explorador", barra de XP (ex.: 620/1000) que enche no +50.
- Cartão de missão pequeno: ícone + "Missão: consertar a ponte da vila".
- Balão de fala do mentor com nome "Mestre Tomé".
- Base (respeite safe-area-inset-bottom + ~20px): 3 botões grandes de ação: "Construir", "Mochila", "Mapa" (só visuais).
- O HUD deve ter a cara do estilo (ex.: pixel art → fonte Pixelify Sans e bordas serrilhadas; papel → etiquetas de papel com sombra; flat → cantos arredondados e cores chapadas). Textos legíveis no celular (mínimo ~12px; títulos maiores). Escale com a largura do host (ex.: base = largura/390).
- Respeite `prefers-reduced-motion`: se ativo, pode reduzir movimento de câmera (mas mantenha a cena).

## Valores
Visual decente e acolhedor, sem violência, sem armas, sem nada assustador.

## Teste antes de entregar (obrigatório)
- Chromium + Playwright já estão instalados: `require('playwright')` funciona; `chromium.launch()` sem opções. Não reinstale.
- Abra `file://<pasta>/index.html#<id>` num viewport 390x844 (deviceScaleFactor 1). Se o CDN do three.js não carregar no teste local, baixe o three r128 (ex.: `npm pack three@0.128.0` numa pasta temporária SUA dentro do scratchpad, fora desta pasta anim) e, SÓ PARA O TESTE, intercepte a URL do CDN com `page.route` servindo o arquivo local. Não altere o index.html.
- Capture o console: zero erros. Tire screenshots em t≈0,2s, 1,0s, 2,0s, 2,6s e OLHE as imagens (ferramenta Read) para conferir que estão bonitas, legíveis, sem sobreposição feia, e que o HUD não fica sob o entalhe. Ajuste e repita até ficar bom (no máximo umas 3 rodadas).
- Teste também 360x780.
- Salve screenshots só no scratchpad, fora da pasta anim.

## Entrega
Na resposta final: lista dos arquivos escritos, 2–3 linhas por cena do que ela mostra, e qualquer limitação. Não edite o index.html nem arquivos de outras cenas.
