# Game design do KidsSchooling

> Documento vivo. Consolida o que já foi aprovado (visão, trilhas, estilo combinado e protótipos de cena) e propõe as regras do jogo.
> Leia junto com [`visao-e-trilhas.md`](visao-e-trilhas.md) e [`mundo-e-personagens.md`](mundo-e-personagens.md).
> Onde este documento decide algo que só o cliente pode confirmar, a opção recomendada já está aplicada e a pergunta aparece no fim.
> Decisões do cliente já aplicadas (ver [`decisoes.md`](decisoes.md)): lançamento em **Android e iPhone ao mesmo tempo**; cobrança por **assinatura familiar** (mensal ou anual) para o app, com **apostilas impressas vendidas à parte, por bloco**; na teologia, temas que dividem igrejas são apresentados com as principais visões evangélicas, destacando o consenso.

---

## 1. Fantasia central e tom

**A fantasia:** "Eu sou o herói que faz o bem, e o que eu sei muda o mundo."

- A criança é a protagonista. Ela chega à **Terra Clara**, um mundo de vilas, colinas, cavernas e portos.
- Partes do mundo estão cobertas pela **Névoa do Esquecimento**: pontes caídas, moinhos parados, mercados confusos. Ninguém é mau. As pessoas só esqueceram o que sabiam.
- Cada coisa que a criança aprende **conserta algo visível**: a ponte volta, o moinho gira, a barraca abre, a névoa some.
- **Quem sabe mais avança.** Não existe atalho comprado, sorte ou tempo de tela. O mapa só abre para quem prova que aprendeu.
- O herói **serve**: ajuda vizinhos, constrói, lidera, ensina os mais novos. Nunca luta. Os "chefões" são desafios de conhecimento, e o Guardião se curva quando o herói responde bem.

**Tom**

| Sim | Não |
|---|---|
| Aventura calorosa, humor leve, desafio de verdade | Narração de pré-escola para todas as idades |
| Mentores que respeitam a inteligência da criança | Personagens que bajulam ("você é incrível!" a cada clique) |
| Reverência e simplicidade no conteúdo cristão | Pregação forçada em toda tela |
| Problemas reais e concretos (ponte, troco, briga de vizinhos) | Ameaças, monstros, sustos, armas, violência |
| Erro como parte do caminho ("quase lá") | Punição, perda de progresso, vergonha |

**Regra de ouro do tom:** fofo o bastante para a criança de 6 anos, sério o bastante para o jovem de 15. Quando ficar fofo demais, acrescente desafio. Quando ficar sério demais, acrescente humor.

---

## 2. Os três loops do jogo

### 2.1 Loop da sessão (20 minutos)

Uma sessão tem começo, meio e fim claros. O jogo **termina a sessão com um ponto natural de parada**, nunca no meio de um suspense.

| Minuto | Etapa | O que acontece | Momento (seção 3) |
|---|---|---|---|
| 0–2 | **Chegada e revisão** | O mentor cumprimenta, lembra o que foi feito e faz 2 a 4 perguntas de revisão de selos vencidos (seção 4.5). | Diálogo |
| 2–4 | **Aventura** | Um problema aparece no mundo: "a viga da ponte cedeu", "a Dona Lia não sabe dividir o lucro". | Exploração |
| 4–8 | **Aula** | O mentor explica com exemplo, imagem e uma pergunta para a criança pensar antes da resposta. | Diálogo/aula |
| 8–16 | **Prática** | 6 a 10 exercícios curtos, adaptados pela IA ao nível da criança, misturando o tema novo com temas antigos. | Construção, investigação ou contemplação |
| 16–18 | **Consequência** | O que a criança aprendeu conserta o mundo: os blocos se encaixam, a névoa recua, o moinho gira. | Exploração |
| 18–20 | **Fechamento** | Resumo em uma frase, XP ganho por skill, ligação com a missão da semana ou a página da apostila. Botão "Até amanhã". | Diálogo |

- **Primeiros Passos (3–5 anos):** sessão de 5 a 10 minutos, com o responsável junto: 1 historinha, 3 a 5 brincadeiras de som ou número, 1 celebração.
- **Mestre (14–17):** pode juntar duas sessões (40 min) para projetos, com pausa obrigatória no meio.
- A IA tutora segue a política de conteúdo: se a criança perguntar sobre tema sensível, ela não explica, sugere conversar com o pai ou a mãe, volta para a aventura e avisa o responsável no painel.

### 2.2 Loop semanal

| Dia | O que a família faz |
|---|---|
| Seg a sex | 3 a 5 sessões de 20 min no app. |
| 2 ou 3 vezes na semana | 1 ou 2 páginas da **apostila física** do bloco (15 min), sem tela, para as famílias que a compraram. A página aprovada vale como exercício (seção 4.2) e o QR abre atividades complementares (seção 7.2.1). Sem apostila, esse tempo vira uma missão curta fora da tela. |
| Fim de semana | **Missão no mundo real** da semana, de preferência em família (seção 6). |
| Domingo à noite | O responsável recebe o **Resumo da semana**: o que foi aprendido, missões a validar, selos vencidos, tempo de uso, conversas com a IA e 3 perguntas para o jantar em família. |

- Toda semana tem uma **missão sugerida** ligada ao capítulo da história. A família pode trocar por outra do catálogo.
- O dia de descanso é opcional e configurado pelo responsável (sugestão: domingo). Nesse dia o app mostra só a vila da família e a apostila.

### 2.3 Loop de longo prazo

```
skills sobem de nível ──► chefão do nível da trilha ──► nova área da região + novo capítulo
        ▲                                                         │
        └────────── revisão espaçada mantém os selos vivos ◄──────┘

base de todas as trilhas (até o nível 5) ──► teste de interesse ──► 2 ou 3 trilhas de aprofundamento (níveis 6 e 7)
```

- **Níveis:** cada skill sobe de 0 a 7. A trilha passa de nível quando todas as suas skills chegaram lá e o chefão foi vencido.
- **Regiões:** cada trilha é uma região do mapa. Cada chefão vencido abre a próxima área da região. Os níveis 6 e 7 ficam no **Alto** de cada região (ver `mundo-e-personagens.md`).
- **Temporadas de história:** a cada 3 ou 4 meses um novo arco junta várias regiões num problema maior.
- **Faixas:** Primeiros Passos (3–5), Aprendiz (6–9), Explorador (10–13), Mestre (14–17). O avatar cresce junto com a faixa.
- **Teste de interesse:** ao concluir a base, sugere 2 ou 3 trilhas para aprofundar (seção 10).
- **Na faixa Mestre**, o jovem também **ensina**: ajuda irmãos mais novos na vila da família, e isso vale XP em Comunicação e Liderança quando o responsável valida.

---

## 3. Tipos de momento: câmera, paleta e interface

Tudo isto já foi aprovado nos protótipos (`prototipos/variacoes/scenes/`). O mundo, os personagens, os blocos e os cartões da interface são **sempre os mesmos**. O que muda por momento é a **câmera**, a **luz** e os **elementos da interface**.

**Constantes em todos os momentos**
- Cartoon 3D estilizado, com contorno de luz suave nos personagens.
- Blocos de encaixe próprios: **pinos hexagonais baixos** e **travas laterais em forma de borboleta**. Nunca pino cilíndrico, minifigura ou a palavra LEGO.
- Interface em cartões creme (`#fffaf0`), títulos em Fredoka, texto em Nunito Sans, ícones SVG planos.
- Barra de topo: avatar, nível e título, barra de XP. "+XP" aparece no fim de cada atividade.
- Transições curtas e suaves. A câmera **sempre parte do enquadramento da exploração** e vai para o enquadramento do momento, para a criança entender onde está.

| Momento | Quando | Câmera | Paleta e luz | Interface | Protótipo |
|---|---|---|---|---|---|
| **Exploração** | Andar pelo mapa, falar com moradores, ver o efeito do que aprendeu | Alta e fixa, quase isométrica (azimute 35°, elevação 53°, lente fechada FOV 30) | Paleta e hora do dia da região. Na Vila do Riacho: dia claro, tons pastel | Mini mapa isométrico, cartão da missão, nome da região | `combinado` |
| **Diálogo / aula** | O mentor explica e faz perguntas | Desce do plano alto para um plano médio baixo, quase na altura dos olhos (elevação ~9°), fundo desfocado em névoa leve | Luz da região reforçada. No Mercado do Sol: fim de tarde dourado, sombras longas | Balão de fala do mentor com nome e ícone; cartão de pergunta com 2 a 4 opções ou microfone | `dialogo` |
| **Construção** | Montar pontes, torres, máquinas, circuitos | Zoom na bancada, mais perto e mais de cima (elevação ~58°) | Mundo levemente dessaturado e azulado; **grade técnica ciano** no chão, linhas de cota, peças fantasma, setas de força | Barra de ferramentas (peças, girar, apagar), cartão "Estrutura estável" | `construcao` |
| **Investigação** | Ciências, lógica, história: observar, levantar hipótese, testar | Desce do plano alto para um acompanhamento próximo do herói | Paleta própria do lugar. Na Caverna dos Cristais: noite azul-profunda, roxo e turquesa, cristais que brilham, **lanterna quente** do herói | Caderno de ciências (Hipótese → Experimento → Observação), carimbo "Observação ✓" | `caverna` |
| **Contemplação / Palavra** | Leitura bíblica, memorização, oração, reflexão de caráter | Desce devagar até um banco ou lugar tranquilo; movimentos lentos | Amanhecer: lilás → pêssego → dourado, névoa no vale, raios de sol, pássaros. Sem música agitada | Versículo com lacunas que se preenchem pela voz; botão de ouvir de novo | `santuario` |
| **Prova / chefão** | Teste final do nível | Baixa, olhando para cima, órbita lenta; vinheta e mais contraste | Entardecer roxo-alaranjado, poeira dourada, contraluz | **Moldura dourada do modo prova**, cadeado "tela travada", anel de tempo, microfone com onda sonora, selo de aprovação | `chefao` |
| **Primeiros Passos** | Toda a faixa de 3 a 5 anos | Mais perto e quase frontal (elevação ~6°, FOV 32), personagens maiores na tela | Manhã de cores vivas e primárias suaves (coral, amarelo, azul, verde) | **Só ícones**, sem texto para ler: estrelas, microfone grande, sílabas grandes ("BO-LA"), casinha para voltar | `primeirospassos` |

**Regras de uso**
1. Um momento por vez. Não misturar grade de construção com moldura de prova.
2. A moldura dourada e o cadeado aparecem **só** no modo prova. A criança aprende que aquela moldura significa "agora é sério".
3. A cor do momento nunca é a única pista: sempre há também um ícone e um texto (acessibilidade, seção 12).
4. Opção "reduzir movimento" troca zooms e órbitas por cortes simples.

---

## 4. Skills, XP e progresso

### 4.1 Base comum (adotada)

| Fonte de XP | XP | Observação |
|---|---|---|
| Exercício resolvido sem ajuda | **10** | Vai para a skill do exercício. |
| Exercício resolvido depois de uma dica | **5** | A dica ensina; o XP é menor, nunca zero por pedir ajuda. |
| Exercício errado | 0 | Sem perda. O mentor explica e oferece outro parecido. |
| Missão no mundo real validada | **50** | Vai para a skill principal da missão (seção 6). |
| Chefão do nível N vencido | **150 + 25 × N** | Dividido entre as skills avaliadas, conforme a nota de cada parte. |
| Pergunta de revisão acertada | **5** | Só quando o selo está vencido (seção 4.5). |

**Chefão por nível:** N0 = 150 · N1 = 175 · N2 = 200 · N3 = 225 · N4 = 250 · N5 = 275 · N6 = 300 · N7 = 325.

**XP necessário por nível de skill:** para completar o nível N, a skill precisa juntar **100 × (N + 1) XP dentro daquele nível**.

| Nível da skill | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| XP para completar | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 |
| XP acumulado (do 0 ao nível) | 100 | 300 | 600 | 1.000 | 1.500 | 2.100 | 2.800 | 3.600 |

**Como as peças se encaixam**
1. A skill enche a barra do nível N com exercícios, apostila, missões e revisões.
2. Quando **todas as skills da trilha** completaram o nível N, o **chefão do nível N** se abre.
3. Vencer o chefão confirma o nível da trilha, abre a próxima área da região e o XP do chefão já entra na barra do nível seguinte de cada skill.
4. **XP total do jogador = soma do XP de todas as skills.** Nunca diminui.

> Os protótipos mostram "+30" a "+60 XP" no fim de uma atividade. É a soma dos exercícios daquela atividade (3 a 6 exercícios de 10 XP), não um valor por exercício.

### 4.2 Regra dos 70%: o saber precisa sair da tela

- **No máximo 70% da barra de cada nível** pode vir de exercícios (app e apostila).
- **Os outros 30%** precisam vir de missão no mundo real, revisão espaçada ou do XP do chefão anterior.
- Exemplo, nível 1 (200 XP): até 140 XP de exercícios (14 acertos); os outros 60 XP vêm de uma missão (50) e de revisões ou do chefão anterior.
- Quando a parte de exercícios enche, o mentor diz: "Você já treinou bastante aqui. Agora mostre isso na vida real!" e sugere uma missão.

**Apostila:** cada página tem um código (QR). A criança fotografa a página (a foto é apagada logo após a correção) ou o responsável marca "conferi" no painel. Cada página aprovada vale como até 3 exercícios (30 XP) e entra nos limites diários.

### 4.3 Limites diários contra "farm"

O objetivo é impedir que alguém junte XP repetindo o fácil. Os limites são generosos para quem estuda de verdade.

| Faixa | XP máximo de exercícios por dia | Por skill por dia | Missões com XP por semana |
|---|---|---|---|
| Primeiros Passos | Sem número na tela (estrelas); 15 estrelas por dia | — | 2 |
| Aprendiz (6–9) | 120 | 50 | 3 |
| Explorador (10–13) | 160 | 60 | 4 |
| Mestre (14–17) | 200 | 80 | 5 |

Outras travas:
- **Exercício repetido não vale XP.** A IA gera sempre um item novo a partir do mesmo objetivo.
- **Resposta rápida demais** (padrão de chute): a IA pede "explique como chegou nisso" antes de dar o XP.
- **Mesma missão duas vezes** no mesmo nível não vale XP de novo.
- Quando o limite do dia acaba, o jogo **continua aberto** para explorar, construir na vila e ler, sem XP. Não há tela de bloqueio nem mensagem de culpa.
- XP de revisão: no máximo 30 por dia.

### 4.4 Ritmo esperado

Estimativa para um Aprendiz que joga 4 sessões por semana e faz 1 missão por semana:

| Item | Valor aproximado |
|---|---|
| XP por sessão (8 exercícios + revisão) | 80 a 100 |
| XP por semana | 400 a 500 |
| Trilha média (9 skills) no nível 1 | 9 × 200 = 1.800 XP |
| Tempo para o nível 1 em todas as trilhas ativas | cerca de 12 a 18 meses |

Isso combina com a escala aprovada (nível 1 aos 6 anos, nível 2 aos 8). Quem estuda mais avança mais rápido. Os números finais serão calibrados no teste com famílias.

### 4.5 Revisão espaçada: os selos

- Ao completar um nível numa skill, a criança ganha o **Selo do Nível N** daquela skill.
- O selo precisa ser **renovado** em intervalos que crescem: **3 dias → 2 semanas → 2 meses → 6 meses**.
- Renovar = acertar 3 a 5 perguntas rápidas de revisão no começo de uma sessão (cerca de 2 minutos).
- **Selo em dia:** brilhante. **Selo vencido:** desbotado, com um pouco de névoa por cima. **Depois de 4 renovações:** selo permanente, com borda dourada, e só uma checagem por ano.
- **Selo vencido nunca tira XP nem nível.** Ele só impede o distintivo ouro (seção 4.7) e aparece no resumo do responsável.
- Se a criança erra a revisão, a IA oferece 2 ou 3 exercícios de reforço e tenta de novo na próxima sessão.
- **Férias:** o responsável pode pausar o relógio dos selos (até 60 dias por ano).

### 4.6 Bônus de família e XP cruzado

**Bônus de família**
- Missão feita **junto com o responsável** (ele marca "fizemos juntos" na validação): **+20% de XP** (50 → 60).
- Desafio em família da semana (seção 9.4): não dá XP extra de skill, mas dá **peças de construção para a vila da família**.
- O bônus só vale para missões. Exercícios não têm bônus de família, para não virar atalho.

**XP cruzado entre trilhas**
- Muitas missões treinam duas áreas. Exemplo: a barraca de limonada usa Empreendedorismo, Finanças e Vida prática.
- Regra: **skill principal recebe 100%** do XP; **até 2 skills secundárias** de outras trilhas recebem **50% cada**.
- Exemplo: "Barraca de limonada" (Aprendiz) → Vendas e negociação +50; Poupar +25; Culinária +25. Se feita em família: +60, +30, +30.
- Entrevista com um missionário → Missões e igreja global +50; Comunicação do dia a dia +25.
- O XP cruzado também respeita a regra dos 70% e os limites semanais.

### 4.7 Distintivos bronze, prata e ouro

Inspirados nas especialidades dos Escoteiros e dos Desbravadores. Cada skill tem os três distintivos **em cada nível**.

| Distintivo | Como se ganha (no nível N daquela skill) | O que comprova |
|---|---|---|
| **Bronze** | Completou a barra do nível. | Estudou. |
| **Prata** | Bronze + 1 missão no mundo real daquela skill validada + chefão do nível vencido. | Aplicou na vida real. |
| **Ouro** | Prata + selo renovado 2 vezes + um **desafio de ouro**: explicar o tema para alguém da família (Aprendiz), resolver um problema novo e maior (Explorador) ou ensinar um mais novo (Mestre). | Ficou na memória e sabe ensinar. |

- O distintivo aparece como um **emblema de tecido na faixa de distintivos** do avatar e como adesivo na apostila seguinte.
- Exemplo de nome: "Orçamento · Nível 3 · Ouro".

### 4.8 Mestrados: combinar skills

Um mestrado junta distintivos de trilhas diferentes. Dá um **título**, uma **construção especial na vila da família** e uma estrela na faixa de distintivos.

| Mestrado | Exige (no mesmo nível ou acima) |
|---|---|
| **Mordomo Fiel** | Doar ouro + Orçamento e registro prata + Ética e fé nos negócios prata |
| **Construtor de Pontes** | Estruturas ouro + Materiais prata + Trabalho em equipe prata |
| **Pacificador** | Perdão e pacificação ouro + Comunicação (Relacionamentos) prata + Autocontrole prata |
| **Bom Samaritano** | Primeiros socorros ouro + Empatia e bondade prata + Serviço prata |
| **Cientista Curioso** | Método científico ouro + Raciocínio e prova prata + História da ciência e fé prata |
| **Mensageiro** | Oratória ouro + Escrita clara prata + Leitura e compreensão prata |
| **Guardião Digital** | Segurança digital ouro + Privacidade prata + Domínio próprio digital prata |
| **Explorador do Mundo** | Cartografia ouro + Povos e culturas prata + Inglês prata |
| **Mão na Massa** | Culinária ouro + Ferramentas e consertos prata + Casa e organização prata |
| **Pequeno Empreendedor** | Vendas e negociação ouro + Contabilidade prata + Matemática financeira prata |
| **Defensor da Esperança** | Apologética ouro + Lógica informal e falácias prata + Debate e diálogo prata |

O mestrado tem a cor do menor nível exigido. Exemplo: "Mordomo Fiel · Explorador".

### 4.9 Perfil: gráfico de radar

- **Radar das 16 trilhas**, com eixos agrupados em 4 cores (Fé e caráter · Pensamento e cultura · Ciência e construção · Trabalho e vida). O valor de cada eixo é o nível da trilha mais a fração da barra (ex.: 3,4).
- Tocar num eixo abre o **radar da trilha**, com as skills dela.
- **Primeiros Passos:** o radar vira uma **flor** cujas pétalas crescem.
- O painel do responsável mostra a evolução do radar ao longo dos meses.
- O jogo **nunca** compara o radar de irmãos ou amigos na mesma tela.

### 4.10 Títulos

**Nível do herói** = média dos níveis das trilhas ativas, arredondada para baixo. Aparece na barra de topo ("Nível 4 · Explorador").

| Nível | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| Título do herói | Semente | Broto | Aprendiz | Escudeiro | Explorador | Sábio | Mestre | Mestre-Guia |

- **Títulos de trilha:** cada trilha usa os nomes das pesquisas (ex.: Finanças nível 1 "Três Cofrinhos", Engenharia civil nível 3 "Construtor", Teologia nível 7 "Mestre da Palavra"). Aparecem na placa da região.
- **Títulos de mestrado e de história** (ex.: "Amigo da Ponte", ganho na Temporada 1) podem ser escolhidos para aparecer sob o nome do herói.

---

## 5. Chefões

### 5.1 Tipos

| Tipo | Como funciona | Exemplos | Faixas |
|---|---|---|---|
| **Oral** | Conversa por voz com a IA. Perguntas abertas, geradas para cada criança a partir do mesmo objetivo. Avalia o raciocínio, não só a resposta. | Guardião da Ponte: "Explique com suas palavras por que uma viga precisa de apoio dos dois lados." Teologia N3: 7 perguntas, uma por parte de Grudem. | Todas. Até o nível 3, a maioria dos chefões é oral. |
| **Projeto** | Entrega de algo feito ao longo de dias, seguida de uma defesa oral curta. | Relatório de hábito de 6 semanas; plano de negócio; orçamento mensal; ensaio. | Explorador e Mestre |
| **Debate** | A IA defende, com respeito, a posição contrária em um tema curado. O jovem ouve, resume e responde. | Filosofia N5–6; Comunicação N6; Inglês N5 (em inglês). Temas sempre da lista aprovada pela curadoria, nunca pautas político-ideológicas. | Mestre |
| **Construção** | Montar no jogo com física simples e, às vezes, também em casa. | Torre com contraventamento que aguenta 3 caixotes; ponte de palitos que aguenta um livro; circuito que acende. | Todas (em PP, só no jogo) |
| **Simulação** | Encenação com personagens do jogo. | Amigo chateado (Relacionamentos N3); cliente difícil (Empreendedorismo); golpe do falso Pix (Tecnologia, Finanças); cena de engasgo (Vida prática). | Aprendiz em diante |
| **Celebração de leitura** | Só em Primeiros Passos e Alfabetização: leitura em voz alta, a IA confere a pronúncia, sempre com festa no fim. | "BO-LA": a criança lê, os blocos se encaixam, a bola aparece. | Primeiros Passos |

**Teologia e temas que dividem igrejas** (batismo, dons, governo da igreja, fim dos tempos; e, em Ciências e Teologia, Terra jovem e Terra antiga, sempre com Deus como Criador intencional): a aula mostra com respeito as principais visões evangélicas e destaca o que é consenso. No chefão, a criança é avaliada por **explicar as visões e os textos bíblicos de cada uma**, nunca por escolher a "certa". Esses temas nunca viram debate de um contra o outro. A família pode registrar no painel a visão da sua igreja, e o mentor passa a dizer "na sua igreja, a visão é...".

Muitos chefões combinam tipos. Exemplo: Engenharia civil N3 = construção (torre no jogo) + oral (explicar a solução).

### 5.2 Modo prova

| Regra | Como funciona |
|---|---|
| **Entrada consciente** | Antes de começar, o app mostra o que vai acontecer, quanto tempo leva e pede um "Estou pronto". Nunca começa de surpresa. |
| **Tela travada** | O app fixa a tela (fixação de tela do Android, Acesso Guiado do iPhone, com passo a passo para os pais). Notificações bloqueadas. Sair do app pausa a prova e fica registrado. |
| **Câmera opcional** | Só se o responsável autorizou. Ela confere que a criança está sozinha e sem outra tela. A análise é feita preferencialmente no próprio aparelho. **As imagens são apagadas logo após a validação. Nenhum vídeo é guardado.** Fica só o resultado em texto. |
| **Sem câmera: prova com fiscal** | O responsável fica por perto e confirma com seu PIN no começo e no fim: "estive presente". A prova vale igual. |
| **Microfone** | Necessário nos chefões orais, com autorização. O áudio é apagado depois da avaliação; fica a transcrição resumida e o comentário da IA. |
| **Tempo** | PP: sem relógio. Aprendiz: 10 a 15 min. Explorador: 20 a 30 min. Mestre: 30 a 60 min. Projetos: entrega ao longo de dias + defesa de 15 a 20 min. O anel de tempo é generoso e não pisca em vermelho. |
| **Variação** | Cada criança recebe perguntas diferentes. Irmãos não recebem a mesma prova. |
| **Interrupção** | Botão "Preciso do meu responsável" pausa a prova. Ela recomeça com perguntas novas, sem penalidade. |
| **Resultado** | Rubrica clara por critério, comentário da IA em texto, selo de aprovação. O Guardião se curva e abre a passagem. |

### 5.3 Segunda chance e reforço

1. Se não passar, a tela diz **"Quase lá!"**, nunca "Reprovado". Mostra 2 ou 3 pontos para reforçar, em linguagem simples.
2. O mentor monta um **plano de reforço**: 3 a 5 sessões com exercícios focados nesses pontos e, se fizer sentido, uma mini missão.
3. Nova tentativa só **depois de 48 horas** e com perguntas novas.
4. **Aprovação parcial:** se o projeto passou e a parte oral não, refaz só a parte oral.
5. Tentativas ilimitadas. A partir da **3ª tentativa**, o app sugere uma sessão de estudo com o responsável e envia a ele um guia de 1 página.
6. Nenhuma perda de XP. A tentativa honesta ganha um carimbo cosmético "Coragem" (sem XP).

### 5.4 Papel dos pais nos chefões

- Autorizam câmera e microfone (uma vez ou a cada prova, à escolha deles).
- Podem ser o **fiscal** da prova.
- **Validam a parte física** de chefões de construção ou projeto (ex.: a ponte de palitos aguentou o livro), com rubrica de 3 critérios.
- Recebem o relatório completo: perguntas feitas, resumo das respostas, rubrica e comentário da IA.
- Podem **pedir revisão humana** de um resultado. A equipe de curadoria responde.
- Em Primeiros Passos, o responsável está sempre junto e celebra junto.

---

## 6. Missões no mundo real

### 6.1 Fluxo de validação

| Passo | Quem | O que acontece |
|---|---|---|
| 1. Escolher | Criança | Escolhe a missão no app ou na apostila. A missão mostra objetivo, tempo, material e **cor de segurança**. |
| 2. Aceitar | Responsável | Recebe o aviso e aprova o início. Obrigatório nas missões amarelas e vermelhas. |
| 3. Fazer | Criança (e família) | Faz ao longo de dias, com checklist na apostila ou no app. Ex.: 7 dias de gratidão antes do jantar. |
| 4. Concluir | Criança | Marca "concluída". Pode anexar foto ou áudio, se autorizado. A foto deve mostrar o resultado, de preferência sem rostos. |
| 5. Validar | Responsável | Abre a **ficha de 3 critérios** com 1 a 3 estrelas cada (pais não precisam ser especialistas). Marca "fizemos juntos", se for o caso. Pode validar sem foto: "vi com meus olhos". |
| 6. Refletir | Criança + IA | 2 ou 3 perguntas por voz: "O que você aprendeu? O que foi difícil? Quem foi ajudado?" Isso comprova o aprendizado. |
| 7. XP | Sistema | Com 2 ou mais estrelas em cada critério: 50 XP (60 em família), mais XP cruzado. Senão: "Refazer", com uma dica, sem perder nada. **Fotos e áudios são apagados logo após a validação.** |
| 8. Celebrar | Jogo | Algo muda no mundo ou na vila da família (uma árvore nova, uma barraca aberta). |

Se o responsável não validar em 7 dias, ele recebe um lembrete. A missão não expira.

### 6.2 Segurança das missões

| Cor | Significado | Exemplos |
|---|---|---|
| **Verde** | A criança pode fazer sozinha, em casa. | Arrumar a cama, ler para alguém, separar os três cofrinhos. |
| **Amarela** | Adulto por perto. | Cozinhar no micro-ondas, plantar no quintal, entrevistar um avô. |
| **Vermelha** | Adulto junto do começo ao fim, e ele confirma isso. | Fogão, faca de ponta, ferramentas elétricas, fogueira, barraca na feira da igreja. |

Regras fixas:
- Nenhuma missão envolve contato com desconhecidos sem um adulto, sair sozinho, compartilhar localização, dados pessoais ou postar em redes sociais.
- Vendas, só em contexto educativo e supervisionado (família, feira da escola, bazar da igreja), nunca como trabalho regular.
- O responsável cadastra **alergias e restrições** no painel. Missões com comida se adaptam.
- A IA **nunca inventa missões do zero**. Ela só varia modelos aprovados pela curadoria.
- Toda missão tem uma versão para famílias com pouco espaço ou pouco dinheiro.
- A sinalização de primeiros socorros usa um coração com cruz verde própria, **nunca o emblema da Cruz Vermelha** (protegido por lei).

### 6.3 Exemplos

| Trilha | Faixa | Missão | Cor | XP cruzado |
|---|---|---|---|---|
| Alfabetização | PP | Caça ao som: achar em casa 5 objetos que começam com /m/ | Verde | — |
| Teologia | Aprendiz | Orar em família antes de uma refeição por 7 dias, com 1 motivo de gratidão por dia | Verde | Gratidão e contentamento |
| Emoções e caráter | Aprendiz | 30 dias com 2 tarefas de casa fixas, sem precisar lembrar duas vezes | Verde | Casa e organização |
| Relacionamentos | Aprendiz | 5 atos secretos de serviço para alguém da família em 1 semana | Verde | Serviço |
| Filosofia | Explorador | Mesa socrática no jantar: a família discute uma pergunta e a criança conduz | Verde | Comunicação |
| Comunicação | Explorador | Contar uma história de 3 minutos para os avós (presencial ou chamada) | Verde | Narração |
| História | Explorador | Entrevistar o avô ou a avó sobre como era a vida aos 10 anos | Amarela | Comunicação |
| Inglês | Aprendiz | Teatrinho de lanchonete em casa: pedir o lanche em inglês | Verde | Etiqueta |
| Geografia | Explorador | Desenhar o mapa do bairro em escala, com rosa dos ventos | Amarela | Geometria e medidas |
| Matemática | Aprendiz | Medir os ingredientes de um bolo com a família e dobrar a receita | Vermelha | Culinária |
| Ciências | Aprendiz | Feijão no algodão: observar e desenhar por 10 dias | Verde | Método científico |
| Engenharia | Explorador | Ponte de palitos que aguenta um livro | Amarela | Estruturas |
| Tecnologia e IA | Explorador | Criar com os pais as regras de tela da casa e cumprir por 2 semanas | Verde | Domínio próprio digital |
| Empreendedorismo | Aprendiz | Barraca de limonada no bazar da igreja ou da escola | Vermelha | Poupar, Culinária |
| Finanças | Aprendiz | Três cofrinhos: dividir a mesada por 4 semanas | Verde | Doar |
| Vida prática | Mestre | Cozinhar para 10 pessoas num evento da igreja | Vermelha | Liderança, Orçamento |

---

## 7. Recompensas

### 7.1 Permitidas (sempre ganhas por mérito)

- **Cosméticos do avatar:** roupas modestas, cores de mochila, chapéus, lenços, acessórios do companheiro Pipo, emblemas na faixa de distintivos. Cada um vem de uma conquista ("Chapéu de palha: complete o nível 1 em Vida prática").
- **Construções na vila da família:** blocos novos liberados pelo que se aprende; prédios especiais por mestrados e desafios em família (celeiro, biblioteca, horta, capela, oficina, coreto).
- **Lembranças das regiões:** um objeto de cada região para decorar a casa do herói (cristal da caverna, moinho em miniatura).
- **Títulos** de nível, trilha, mestrado e história.
- **A lanterna do herói** fica mais bonita a cada nível do herói.
- **Carta do mentor:** ao vencer um nível, o mentor escreve uma carta personalizada, que pode ser impressa.
- **Certificado imprimível** por nível de trilha.
- **Recompensas da família:** o responsável pode definir prêmios da vida real no painel ("ao terminar o nível 2 de Finanças, passeio no parque"). O app só lembra; quem dá é a família.

### 7.2 Proibidas

| Proibido | Por quê |
|---|---|
| Loot boxes, baús, roletas ou cartas com raridade aleatória (pagos ou grátis) | Mecânica de aposta. |
| Comprar XP, níveis, atalhos, vidas ou "pular etapa" | Quebra a regra de ouro. |
| Moeda premium, loja ou qualquer compra dentro do app da criança | Nada é vendido para a criança. A assinatura familiar e as apostilas por bloco são compradas só pelo responsável (seção 7.2.1). |
| Publicidade de qualquer tipo | Criança não é público de anúncio. |
| Sequência diária que zera ("streak" punitivo) | Gera ansiedade e culpa. |
| Prêmio por entrar no app todo dia | Premia tempo de tela, não aprendizado. |
| Eventos que somem ("só hoje!"), contagem regressiva para comprar | Medo de perder. |
| Energia ou vidas que obrigam a esperar ou pagar | Mecânica de vício e de cobrança. |
| Notificações de pressão para a criança | Avisos vão para o responsável. |
| Ranking aberto ou comparação pública | Ver seção 9. |
| Rolagem infinita, vídeo em sequência automática | Sem fim natural. |

### 7.2.1 Como a cobrança aparece no jogo

- **Assinatura familiar** (mensal ou anual), paga pelo responsável no painel ou na loja do Android/iPhone. Ela libera **o app inteiro**: todas as trilhas, regiões, níveis, chefões e a vila da família, para todos os filhos da conta.
- **Apostila impressa por bloco**, vendida à parte, também só para o responsável. Ela **complementa** o app:
  - suas páginas valem como exercícios (seção 4.2), dentro dos mesmos limites diários;
  - o QR de cada apostila **desbloqueia atividades complementares** daquele bloco: missões de papel, desafios extras de construção, uma mini aventura da região e a página de adesivos dos distintivos;
  - **nunca** desbloqueia XP extra, níveis, chefões ou atalhos. Uma família sem apostila consegue completar toda a trilha só com o app (as missões do mundo real cobrem a parte fora da tela).
- **Dentro do app da criança não existe nenhuma compra**: nenhuma loja, botão de comprar, preço ou oferta. Qualquer tela de pagamento fica atrás do PIN do responsável e nunca aparece no meio da aventura.
- Se a assinatura vencer, o progresso fica guardado. A criança vê a vila e o perfil, mas não ganha XP novo, e o aviso vai só para o responsável, nunca para a criança.

**Constância sem punição:** o **Calendário da semana** marca os dias estudados. Com 4 dias na semana, a semana fica "completa" e ganha um carimbo cosmético. Faltou? Nada se perde, e o calendário não zera.

### 7.3 Bem-estar

| Faixa | Sessão padrão | Máximo diário padrão | Pausa sugerida |
|---|---|---|---|
| Primeiros Passos | 5–10 min | 20 min | Ao fim de cada sessão |
| Aprendiz | 20 min | 40 min | A cada 20 min |
| Explorador | 20–30 min | 60 min | A cada 25 min |
| Mestre | 20–45 min | 90 min | A cada 30 min |

- O responsável muda tudo no painel.
- **Pausa ativa:** o mentor sugere esticar o corpo, beber água e olhar para longe por 20 segundos.
- **Hora de dormir:** o app fecha no horário que o responsável definir. Também não abre nos horários de escola, se ele quiser.
- **Fim de tempo gentil:** quando o tempo do dia acaba, o jogo termina a atividade atual, salva e se despede. Nunca corta no meio de uma frase.
- O jogo sempre empurra para fora da tela: missões, apostila, leitura de livros físicos.

---

## 8. Conta familiar (resumo do que já está aprovado)

- O responsável é verificado (identidade e maioridade) antes de criar contas de filhos.
- Ele vê **absolutamente tudo**: conversas com a IA, respostas, provas, missões, conquistas, tempo de uso e interações com amigos.
- Controles: tempo de tela, trilhas ativas, trilha de teologia (ligada por padrão, pode desligar), câmera e microfone, amizades, recompensas da família, dia de descanso, pausa dos selos nas férias.

---

## 9. Social seguro

### 9.1 Amigos

- Só entre crianças cujos **dois responsáveis aprovaram**.
- Como: o responsável A gera um **código de amizade** (ou QR, para trocar em pessoa). O responsável B aceita no painel dele. Só então as crianças se veem.
- O jogo incentiva amizades da vida real (escola, igreja, vizinhos). Não há busca de jogadores nem sugestão de amigos.
- Nome visível: só o apelido aprovado pelo responsável. Nunca sobrenome, escola, cidade ou foto real.

### 9.2 Frases prontas

Sem texto livre, sem voz, sem foto entre crianças. Só frases prontas e figurinhas, por exemplo:

- "Bom dia!" · "Boa noite!" · "Obrigado pela ajuda!"
- "Parabéns pelo distintivo!" · "Que construção bonita!" · "Boa sorte no chefão!"
- "Vamos construir juntos?" · "Vem visitar minha vila!" · "Sim!" · "Agora não, obrigado."
- "Estou orando por você." (aparece só se a teologia estiver ligada nas duas contas)

Tudo fica registrado e visível para os dois responsáveis.

### 9.3 Vila da família

- Cada família tem a sua vila, à beira do riacho (ver `mundo-e-personagens.md`).
- Cada filho tem a sua casa e o seu lote. O responsável pode ter um **avatar opcional** e uma casa também.
- A vila cresce com o que a família aprende: blocos, prédios de mestrados, lembranças das regiões.
- Amigos aprovados podem **visitar** a vila (sem estar lá ao mesmo tempo), deixar uma frase pronta e um **presente** feito por eles (um bloco decorativo que construíram).

### 9.4 Desafios em família

- Toda semana há um **desafio da família**, ligado ao capítulo da história. Exemplo: "Semana dos Três Cofrinhos" (cada filho faz a missão de Finanças do seu nível e o responsável marca uma tarefa simples no painel).
- Recompensa: peças para um prédio coletivo na vila da família.
- **Irmão mais velho como mentor:** um Mestre (14+) pode ajudar o irmão mais novo numa atividade. Com validação do responsável, ganha XP em Comunicação ou Liderança servidora.

### 9.5 Ranking

- Só dentro da família ou entre amigos aprovados. O responsável pode desligar.
- **Não compara XP bruto.** Compara o **percentual da meta pessoal da semana** (cada um tem a sua meta, ajustada à idade). Assim, uma criança de 7 anos e uma de 14 competem em pé de igualdade.
- Existe também a **meta da família**: uma barra coletiva que todos enchem juntos.

---

## 10. Teste de interesse e aprofundamento

### 10.1 Quando

| Momento | O que é |
|---|---|
| Fim da faixa Aprendiz | **Sondagem leve**: só mostra "o que você parece gostar". Sugere missões extras. Não muda trilhas. |
| Fim da faixa Explorador | **Sondagem média**: sugere 1 projeto extra numa trilha favorita. |
| Conclusão da base (nível 5 em todas as trilhas ativas) | **Teste de interesse oficial**: sugere 2 ou 3 trilhas para os níveis 6 e 7. |

Um jovem que se destaca muito numa trilha pode começar o aprofundamento dela mais cedo, com aprovação do responsável.

### 10.2 Como

Três fontes, como já aprovado:

| Fonte | Peso sugerido | O que se olha |
|---|---|---|
| Desempenho | 40% | Nível, distintivos ouro, notas de chefão, facilidade de cada trilha. |
| Escolhas livres | 30% | Missões opcionais escolhidas, construções feitas por gosto, regiões revisitadas, perguntas espontâneas à IA. (Isso não dá XP; só informa.) |
| Questionário | 30% | 15 a 20 perguntas com imagens: "O que você faria num sábado livre?", "Qual problema da vila você gostaria de resolver?" |

**Resultado:** o **Mapa de Talentos**, conversa com os mentores das trilhas sugeridas e um relatório para o responsável. **O responsável aprova** as trilhas. O jovem pode trocar uma trilha depois de 3 meses, com nova aprovação.

### 10.3 Trilhas de aprofundamento

- Ficam no **Alto** de cada região (ex.: Alto da Torre das Perguntas, Pico do Mirante).
- Têm missões maiores, projetos reais com mentor adulto da família ou da igreja, e chefões de nível quase universitário.
- Exemplos: Engenharia de software (um app útil para a igreja ou a família); Empreendedorismo (um pequeno negócio familiar com contabilidade real); Teologia (ensaio e defesa oral de uma doutrina); Comunicação (série de palestras).
- As outras trilhas continuam em **modo manutenção**: só revisões de selos, para não esquecer.

---

## 11. Onboarding: a primeira hora

### 11.1 Responsável (cerca de 15 minutos antes da criança)

| Passo | Tempo | O que acontece |
|---|---|---|
| 1. Boas-vindas | 1 min | O que é o jogo, em 3 frases: aventura, aprender de verdade, família no controle. |
| 2. Verificação | 3–5 min | Identidade e maioridade. |
| 3. Filhos | 2 min | Nome, apelido e idade de cada filho. A faixa é sugerida pela idade. |
| 4. Escolhas | 3 min | Trilhas ativas (teologia ligada por padrão, com botão para desligar), tempo de tela, hora de dormir, dia de descanso. Câmera e microfone começam **desligados**; o app pede quando forem necessários pela primeira vez. |
| 5. Tour do painel | 3 min | Onde ver tudo, onde validar missões, onde aprovar amizades. |
| 6. Acordo da família | 2 min | Um "pacto" curto para ler com a criança: horários, honestidade nas provas, missões juntos. |
| 7. Assinatura e apostila | 1–2 min | Escolha do plano (mensal ou anual) e, se quiser, pedido da apostila do primeiro bloco, com o nome e o avatar da criança. |

### 11.2 Criança (as 3 primeiras sessões de 20 minutos)

**Sessão 1: Chegada à Vila do Riacho**
- 0–4 min: com o responsável ao lado, **monta o herói** (menino ou menina, tom de pele, cabelo, roupa).
- 4–8 min: o herói chega à vila. O passarinho **Pipo** ensina a andar e a falar com as pessoas. A ponte do riacho caiu e há névoa no leito do rio.
- 8–16 min: o **Mestre Tomé** ensina a encaixar blocos: pino hexagonal em cima, trava borboleta dos lados. Primeira construção guiada.
- 16–20 min: a primeira viga se encaixa, a névoa recua um pouco. Primeiros "+XP". Fechamento: "Amanhã a gente termina a ponte."

**Sessão 2: Nivelamento escondido na aventura**
- O herói visita 3 ou 4 regiões vizinhas em "missões de reconhecimento". Cada uma tem 5 minutos de perguntas adaptativas, que parecem conversa com os mentores.
- O nivelamento das 16 trilhas se espalha pela **primeira semana**, no máximo 5 minutos por sessão.

**Sessão 3: Primeira missão no mundo real**
- A ponte fica pronta. O Mestre Tomé desafia: "Agora construa uma ponte em casa!" (ponte de papel ou palitos, verde ou amarela).
- O responsável recebe a primeira missão para aprovar.

**Quem começa tarde (ex.: 15 anos):** o nivelamento oferece **chefões de nivelamento**. Quem vence o chefão de um nível pula aquele nível na trilha e recebe o XP das barras puladas, porque provou o conhecimento em prova supervisionada.

**Primeiros Passos (3 a 5 anos):** primeira sessão de 10 minutos, no colo do responsável, no **Jardim das Letras**. Pipo apresenta 2 sons de letras, a criança fala ao microfone, os blocos com letras pulam e se encaixam, e tudo termina com estrelas e confete.

---

## 12. Acessibilidade

| Necessidade | O que o jogo faz |
|---|---|
| **Leitura ainda fraca ou dislexia** | Todo texto tem botão de ouvir. Opção de fonte para dislexia. Tamanho de letra ajustável (mínimo 16 px no celular). |
| **Daltonismo** | Cor nunca é a única pista: sempre ícone e forma junto. Paletas testadas para os tipos mais comuns. |
| **Audição** | Legenda em toda fala. Pistas visuais para todo som importante. |
| **Fala** (gagueira, atraso de fala, timidez extrema) | **Modo de resposta alternativo**, ligado pelo responsável: responder escrevendo, apontando ou montando, inclusive nos chefões orais. A IA dá mais tempo e não interrompe. |
| **Motora** | Tudo funciona com toques simples. Nada exige reflexo rápido ou arrastar com precisão. Botões grandes. |
| **Atenção (TDAH)** | Etapas curtas, um objetivo por tela, "modo foco" que esconde enfeites da interface. |
| **Tempo de prova** | O responsável pode ativar **tempo estendido** (+50%) no modo prova. |
| **Sensibilidade a movimento** | "Reduzir movimento" troca zooms e órbitas por cortes. |
| **Epilepsia fotossensível** | Nenhum flash acima de 3 por segundo. Os brilhos de celebração são suaves. |
| **Android e iPhone** | Lançamento nas duas plataformas ao mesmo tempo, com as mesmas funções. O modo prova usa a fixação de tela de cada sistema. |
| **Celular simples e internet fraca** | Seletor de qualidade gráfica. Download inicial abaixo de 150–200 MB. Apostila e parte das atividades funcionam sem internet. |
| **Representação** | O herói pode usar óculos, aparelho auditivo ou cadeira de rodas. A cadeira anda pelo mapa como qualquer herói, com rampas nas construções. |

---

## Perguntas para o cliente

- **Pergunta:** O bônus de família deve dar XP extra? | **Opções:** A) Sim, +20% de XP só em missões feitas junto com o responsável (recomendada) B) Não, o bônus vira só peças para a vila da família C) +20% em tudo que for feito junto, inclusive exercícios | **Por que importa:** XP é a moeda mais séria do jogo. A opção A premia o tempo em família sem criar atalho; a C abre brecha para inflar XP.
- **Pergunta:** Como deve ser o ranking entre amigos e irmãos? | **Opções:** A) Por percentual da meta pessoal da semana, com meta da família coletiva (recomendada) B) Por XP bruto da semana C) Sem ranking nenhum, só meta da família | **Por que importa:** XP bruto faz o irmão mais velho sempre ganhar e desanima o mais novo. Sem ranking perde-se um motivador que muitas crianças gostam.
- **Pergunta:** A câmera no chefão pode ser substituída pelo responsável como fiscal? | **Opções:** A) Sim, câmera opcional; sem ela, o responsável confirma presença com PIN (recomendada) B) Câmera obrigatória a partir dos 10 anos C) Nunca usar câmera, só fiscal | **Por que importa:** Câmera aumenta a segurança contra cola, mas muitos pais não querem câmera ligada. Muda o fluxo da prova e a política de mídia.
- **Pergunta:** O dia de descanso deve ser fixo para todos? | **Opções:** A) Opcional, configurado pelo responsável, com domingo como sugestão (recomendada) B) O app fecha no domingo para todas as famílias C) Não oferecer dia de descanso | **Por que importa:** Toca em convicção (guarda do domingo ou do sábado) e afeta o ritmo de XP e as missões de fim de semana.
- **Pergunta:** Os limites diários e a regra dos 70% estão no ritmo certo? | **Opções:** A) Usar os valores deste documento e calibrar no teste com famílias (recomendada) B) Limites mais folgados (o dobro) C) Sem limite diário, só a regra dos 70% | **Por que importa:** Define em quanto tempo a criança completa cada nível (hoje estimado em 12 a 18 meses para o nível 1) e se combina com as idades da escala aprovada.
- **Pergunta:** O responsável deve ter um avatar e jogar na vila da família? | **Opções:** A) Sim, avatar opcional com casa na vila e participação nos desafios em família (recomendada) B) Não, o responsável só usa o painel | **Por que importa:** Avatar do responsável reforça o "jogar junto" (73% dos pais brasileiros jogam com os filhos), mas aumenta o escopo de arte e de interface.
