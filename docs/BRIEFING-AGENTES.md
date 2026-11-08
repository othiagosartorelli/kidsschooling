# Briefing comum para quem desenvolve o KidsSchooling

Leia antes de qualquer tarefa:
- `docs/visao-e-trilhas.md` (visão, 16 trilhas, faixas etárias, escala de níveis 0–7, modelo de skills e XP, teste de interesse, chefões e antitrapaça, conta familiar supervisionada, política de conteúdo, política de mídia, cronograma, direção de arte aprovada).
- Pesquisas por trilha em `docs/trilhas/` (A, B, C, D).
- Relatório de estilo em `reports/Estilo gráfico para todas as idades.md`.
- Decisões do cliente em `docs/decisoes.md` (prevalecem sobre qualquer outra orientação).
- Protótipos visuais aprovados em `prototipos/variacoes/` (cenas three.js; `scenes/combinado.js` é o estilo aprovado; personagens: Herói, Mestre Tomé (engenharia), Dona Lia (finanças/mercado), Professora Íris (ciências), Vovô Elias (teologia), Guardião da Ponte Antiga (chefão)).

Regras fixas do cliente (não negociáveis):
- Famílias cristãs (aberto a todos). A Bíblia é soberana. Valores: decência, honestidade, família, serviço.
- Fora do conteúdo: qualquer tema sexual, ideologia de gênero, pautas político-ideológicas contrárias à família. Nada no jogo leva a esses temas; se a criança perguntar à IA, ela não explica, sugere conversar com os pais, volta à aventura e avisa o responsável no painel.
- Conta de criança só dentro de conta familiar com responsável verificado, que vê absolutamente tudo. Sem chat aberto entre crianças.
- Câmera, microfone e fotos só com autorização do responsável; mídia usada só para validar e apagada logo depois; nunca armazenar vídeo.
- XP só por habilidade comprovada (exercícios < missões no mundo real < chefões). XP total = soma das skills.
- Trilha de teologia ligada por padrão, o responsável pode desligar. Estrutura de Wayne Grudem (7 partes).
- Estilo visual aprovado: cartoon 3D estilizado (não infantilizado) + câmera alta quase isométrica + blocos de encaixe próprios (pinos hexagonais, travas borboleta; nunca imitar LEGO) + interface/apostila em ilustração 2D limpa + mapas isométricos. Câmera e paleta mudam por momento/região.

Forma de trabalhar:
- Escreva em português do Brasil, frases curtas e claras, para um empreendedor não técnico ler.
- NÃO rode git (commit/push); o coordenador faz isso.
- Escreva apenas nos caminhos que lhe foram atribuídos.
- Quando houver decisão que só o cliente pode tomar, NÃO trave: siga a opção recomendada e registre no fim do seu documento uma seção "## Perguntas para o cliente" no formato:
  - **Pergunta:** ... | **Opções:** A) ... (recomendada) B) ... C) ... | **Por que importa:** ...
  Máximo 6 perguntas, só as que realmente mudam o trabalho.
