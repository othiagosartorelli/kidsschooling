/* KidsSchooling — avaliador da resposta aberta do chefão (versão local, sem IA).

   >>> ONDE A IA TUTORA ENTRA <<<
   No app final, `avaliarResposta()` vira uma chamada ao servidor da IA tutora, que recebe:
   - o objetivo de aprendizagem (skill ENG-EST, nível 1), a pergunta e a rubrica abaixo;
   - a resposta da criança (texto ou transcrição da voz, com autorização do responsável);
   - a idade/faixa da criança, para ajustar a linguagem do retorno.
   A IA devolve o MESMO formato de objeto que esta função devolve hoje ({aprovado, pontos, criterios, mensagem, dica}),
   então o jogo não precisa mudar. A IA também aplica a política de conteúdo: se a criança perguntar algo fora do
   conteúdo do jogo, ela não explica, sugere conversar com o pai ou a mãe, volta para a aventura e avisa o
   responsável no painel. Aqui, sem IA, só fazemos a checagem simples por palavras-chave.
*/
(function () {
  'use strict';
  var KS = window.KS = window.KS || {};

  // tira acentos e põe em minúsculas, para comparar palavras
  function normalizar(txt) {
    return String(txt || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /* Rubrica do Nível 1 (6+ anos). Cada critério vale 1 ponto. Aprovado com 2 ou mais pontos,
     desde que a resposta fale de apoio OU dos dois lados (a ideia central). */
  var RUBRICA = [
    { id: 'apoio', rotulo: 'Fala do apoio', termos: ['apoi', 'pilar', 'sustent', 'segur', 'base', 'firme', 'descans', 'encost', 'pedra', 'margem', 'margens', 'suport'] },
    { id: 'lados', rotulo: 'Fala dos dois lados', termos: ['dois lados', 'os dois', 'duas pontas', 'as duas', 'ambos', 'ambas', 'cada lado', 'cada ponta', 'de um lado', 'outro lado', 'lado', 'lados', 'ponta', 'pontas', 'extremidade', 'margens', 'inicio e no fim', 'comeco e no fim'] },
    { id: 'peso', rotulo: 'Fala do peso', termos: ['peso', 'pesad', 'carga', 'forca', 'gravidade', 'empurr', 'pessoas', 'carro', 'passar', 'aguent', 'resist'] },
    { id: 'cair', rotulo: 'Diz o que acontece sem apoio', termos: ['cai', 'cair', 'caia', 'desab', 'quebr', 'afund', 'enverg', 'torta', 'tomb', 'despenc', 'desmoron', 'dobr', 'rach', 'solta', 'vira'] }
  ];

  /**
   * Avalia a resposta aberta da criança.
   * @param {string} texto  resposta digitada
   * @param {number} tentativa  1 = primeira tentativa, 2 = segunda...
   * @returns {{aprovado:boolean, pontos:number, total:number, criterios:Array<{id:string,rotulo:string,ok:boolean}>, mensagem:string, dica:string}}
   */
  function avaliarResposta(texto, tentativa) {
    var t = ' ' + normalizar(texto) + ' ';
    var palavras = t.trim() ? t.trim().split(' ').length : 0;
    var criterios = RUBRICA.map(function (c) {
      var ok = c.termos.some(function (termo) { return t.indexOf(termo) >= 0; });
      return { id: c.id, rotulo: c.rotulo, ok: ok };
    });
    var pontos = criterios.filter(function (c) { return c.ok; }).length;
    var central = criterios[0].ok || criterios[1].ok;
    var aprovado = palavras >= 3 && pontos >= 2 && central;

    var mensagem, dica = '';
    if (palavras < 3) {
      mensagem = 'Escreva um pouquinho mais, com suas palavras. Uma frase já é ótimo!';
      dica = 'Comece assim: "A viga precisa de apoio porque…"';
    } else if (aprovado && pontos >= 3) {
      mensagem = 'Excelente explicação! Você entendeu o segredo das pontes.';
    } else if (aprovado) {
      mensagem = 'Muito bem! Você explicou a ideia principal.';
    } else if (!criterios[0].ok && !criterios[1].ok) {
      mensagem = 'Boa tentativa! Mas onde a viga fica apoiada?';
      dica = 'Lembre do Mestre Tomé: a viga deita sobre os apoios. O que tem em cada ponta dela?';
    } else if (!criterios[3].ok) {
      mensagem = 'Você está no caminho! Agora diga o que acontece se faltar um apoio.';
      dica = 'Imagine a viga só com um lado apoiado. Ela fica firme ou…?';
    } else {
      mensagem = 'Quase lá! Fale também do peso que passa por cima da ponte.';
      dica = 'Quem passa pela ponte faz força para baixo. Quem segura essa força?';
    }
    if (!aprovado && tentativa >= 2) {
      dica = 'Dica do Guardião: use as palavras "apoio", "dois lados", "peso" e "cair" na sua frase.';
    }
    return { aprovado: aprovado, pontos: pontos, total: RUBRICA.length, criterios: criterios, mensagem: mensagem, dica: dica };
  }

  KS.avaliarResposta = avaliarResposta;
  KS.normalizar = normalizar;
})();
