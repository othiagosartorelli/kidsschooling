# Mundo e personagens do KidsSchooling

> Documento vivo. Define o mapa, as 16 regiões, os personagens e o arco de história.
> Base: [`visao-e-trilhas.md`](visao-e-trilhas.md), [`game-design.md`](game-design.md), [`decisoes.md`](decisoes.md) e os protótipos aprovados em `prototipos/variacoes/scenes/`.
> Tudo aqui é original. Nenhum nome, personagem ou lugar copia outro jogo, desenho ou livro.

---

## 1. O mundo: Terra Clara

**Terra Clara** é uma grande ilha em forma de folha, cercada por ilhas menores. Um riacho nasce nas montanhas do oeste, atravessa a ilha e deságua no mar do leste, onde o sol nasce.

- **Sul (Terras Baixas):** vilas, mercado, pomares, sítios. É onde a aventura começa (Temporada 1).
- **Desfiladeiro da Ponte Antiga:** uma fenda de pedra que separa o sul do norte. Só se atravessa vencendo o desafio do Guardião.
- **Norte (Terras Altas e costa):** cidade histórica, mirante nas montanhas, porto e, no mar, a Ilha dos Faróis (Temporada 2).
- **Centro-norte:** as ruínas da **Grande Biblioteca**, que guardava os livros de todos os ofícios antes da Névoa. Reconstruí-la é a meta de longo prazo.
- **Alto de cada região:** a parte mais alta ou mais funda de cada lugar (o topo da torre, o pico do mirante, o salão mais fundo da caverna). Abre nos níveis 6 e 7, para as trilhas de aprofundamento.

**A Névoa do Esquecimento.** Uma névoa cinza-lilás, macia e sonolenta. Ela não tem rosto, não tem olhos, não faz barulho e não ataca ninguém. Ela aparece onde as pessoas pararam de praticar o que sabiam e de cuidar umas das outras. Onde ela pousa, as coisas ficam sem cor: ferramentas esquecidas, canções pela metade, contas erradas. Quando o herói aprende e aplica, a luz da sua lanterna aumenta e a névoa se desfaz em orvalho e flores.

No jogo, a névoa tem três papéis:
1. **Mapa:** cobre áreas ainda não exploradas.
2. **História:** é o problema de cada capítulo.
3. **Revisão:** um selo vencido (ver `game-design.md`, 4.5) ganha um pouco de névoa por cima. Renovar o selo limpa. Nada se perde.

---

## 2. Mapa

### 2.1 Diagrama

```
                                   NORTE
  ┌──────────────────┬───────────────────┬──────────────────┬──────────────────┐   ~~~~~~~~~~~~~~
  │ MIRANTE DOS      │  Montanhas Azuis   │ CIDADE DO        │ PORTO DOS        │ ~~ ILHA DOS    ~~
  │ VENTOS           │  (Grande Biblio-   │ RELÓGIO          │ NAVIOS           │═══ FARÓIS      ~~
  │ Geografia        │   teca em ruínas)  │ História e artes │ Inglês           │ ~~ Tecnologia  ~~
  ├────────┬─────────┴─────────┬─────────┴────────┬─────────┴────────┬─────────┘   ~~~~~~~~~~~~~~
  │ CAVERNA│  DESFILADEIRO DA  │ TORRE DAS        │ VALE DO ECO      │       ~~~~ mar ~~~~
  │ DOS    │  PONTE ANTIGA     │ PERGUNTAS        │ Comunicação      │
  │CRISTAIS│  (chefão)         │ Filosofia        │                  │
  │Ciências│                   │                  │                  │
O ├────────┼───────────────────┼──────────────────┼──────────────────┼──────────────────┐ L
E │ VALE   │  VILA DO RIACHO   │ MERCADO DO SOL   │ FEIRA DAS        │ COLINA DO        │ E
S │ DOS    │  Engenharia       │ Finanças         │ BANDEIRINHAS     │ SANTUÁRIO        │ S
T │MOINHOS │  (centro, início) │                  │ Empreendedorismo │ Teologia         │ T
E │Matemát.│ ≈≈≈≈ riacho ≈≈≈≈≈ │≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈│≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈│≈≈≈≈ foz ≈≈≈≈≈≈≈≈≈│ E
  ├────────┼───────────────────┼──────────────────┼──────────────────┼──────────────────┘
  │ SÍTIO  │  JARDIM DAS       │ ALDEIA DAS       │ POMAR DO         │   praia
  │ DAS    │  LETRAS           │ VARANDAS         │ BOM FRUTO        │
  │MANGUEI-│  Alfabetização    │ Relacionamentos  │ Emoções e caráter│
  │ RAS    │ (Primeiros Passos)│                  │                  │
  │Vida    │  + VILA DA FAMÍLIA│                  │                  │
  │prática │  (margem do riacho)                  │                  │
  └────────┴───────────────────┴──────────────────┴──────────────────┘
                                   SUL
```

### 2.2 Como as regiões se conectam

| Região | Liga-se a | Caminho |
|---|---|---|
| Vila do Riacho (centro) | Jardim das Letras, Vale dos Moinhos, Mercado do Sol, Desfiladeiro | Estradas de terra e a ponte de blocos sobre o riacho |
| Jardim das Letras | Vila do Riacho, Aldeia das Varandas, Vila da Família | Trilha de pedrinhas coloridas |
| Vale dos Moinhos | Vila do Riacho, Caverna dos Cristais, Sítio das Mangueiras | Estrada dos carros de boi, canal d'água |
| Caverna dos Cristais | Vale dos Moinhos, Desfiladeiro (por um túnel no fim da temporada) | Boca da caverna atrás da cachoeira |
| Sítio das Mangueiras | Vale dos Moinhos, Jardim das Letras | Porteira e trilha entre mangueiras |
| Mercado do Sol | Vila do Riacho, Feira das Bandeirinhas, Aldeia das Varandas, Torre das Perguntas | Praça de paralelepípedos |
| Aldeia das Varandas | Jardim das Letras, Mercado do Sol, Pomar do Bom Fruto | Rua das casas com varanda |
| Pomar do Bom Fruto | Aldeia das Varandas, Feira das Bandeirinhas, praia | Caminho entre fileiras de árvores |
| Feira das Bandeirinhas | Mercado do Sol, Pomar, Colina do Santuário, Vale do Eco | Rua coberta de bandeirinhas |
| Colina do Santuário | Feira das Bandeirinhas, praia | Escadaria de pedra que sobe a colina |
| Torre das Perguntas | Mercado do Sol, Vale do Eco, Desfiladeiro | Labirinto de sebes na base da torre |
| Vale do Eco | Feira das Bandeirinhas, Torre das Perguntas, Porto dos Navios (após a Temporada 1) | Ponte de cordas sobre o vale |
| Desfiladeiro da Ponte Antiga | Vila do Riacho (sul) e Cidade do Relógio / Mirante (norte) | A Ponte Antiga de pedra |
| Cidade do Relógio | Desfiladeiro, Montanhas Azuis, Porto dos Navios | Ladeiras de pedra |
| Mirante dos Ventos | Desfiladeiro, Montanhas Azuis | Trilha de montanha e balões |
| Porto dos Navios | Cidade do Relógio, Vale do Eco, Ilha dos Faróis | Cais e barcos |
| Ilha dos Faróis | Porto dos Navios | Ponte de cabos sobre o mar e barcos |

### 2.3 Ordem sugerida de desbloqueio

As regiões abrem **em ondas, puxadas pela história**. O responsável pode abrir todo o mapa antes no painel.

| Onda | Quando | Regiões |
|---|---|---|
| **Primeiros Passos (3–5)** | Desde o início | Jardim das Letras + visitas curtas guiadas pelo Pipo a: Colina do Santuário (histórias bíblicas), Pomar (emoções), Aldeia (palavras mágicas), Vale dos Moinhos (números), Sítio (pequeno ajudante) |
| **Onda 1** | Semana 1 (Aprendiz em diante) | Vila do Riacho, Jardim das Letras (para quem ainda está se alfabetizando) |
| **Onda 2** | Semanas 2 a 6 | Mercado do Sol, Aldeia das Varandas, Pomar do Bom Fruto, Colina do Santuário |
| **Onda 3** | Semanas 6 a 10 | Vale dos Moinhos, Caverna dos Cristais, Torre das Perguntas, Vale do Eco, Sítio das Mangueiras, Feira das Bandeirinhas |
| **Onda 4** | Depois do capítulo da Ponte Antiga (fim da Temporada 1) | Cidade do Relógio, Mirante dos Ventos, Porto dos Navios, Ilha dos Faróis |
| **Alto das regiões** | Níveis 6 e 7 (aprofundamento) | O Alto das 2 ou 3 regiões escolhidas no teste de interesse |

- **Quem começa mais velho** (Explorador ou Mestre) passa pelas ondas 2 e 3 em poucos dias, porque o nivelamento abre as áreas que ele já domina.
- **Se a trilha de teologia estiver desligada**, a Colina do Santuário aparece como um mirante tranquilo, sem aulas, e a história usa a versão alternativa do capítulo 5 (seção 5.3).

---

## 3. As 16 regiões

Todas seguem o estilo aprovado. A paleta e a hora do dia de cada região valem para o momento de **exploração**; os momentos de diálogo, construção, investigação e prova ajustam a luz como descrito em `game-design.md`, seção 3. As cores são referências para o ilustrador.

| # | Trilha | Região | Hora do dia | Paleta (referência) | Marcos visuais | Mentor | Palco do chefão |
|---|---|---|---|---|---|---|---|
| 1 | Alfabetização | **Jardim das Letras** | Manhã cedo, sol forte e alegre | Coral `#ff6b6b`, amarelo `#ffc93c`, azul `#4d9de0`, verde `#5cc970`, céu `#7cc8ff` | Torre de blocos com letras; canteiros em forma de letras; ninho do Pipo; Árvore das Letras, cujas folhas são letras | Tia Bel + Pipo | **Festa da Leitura** na Árvore das Letras (celebração, sem prova difícil) |
| 2 | Teologia | **Colina do Santuário** | Amanhecer | Lilás `#b9a6d9`, pêssego `#ffc6a5`, dourado `#ffd27a`, névoa `#ece4f4` | Capela simples com cruz discreta; oliveira; fonte de pedra; banco de blocos; **Sete Fontes**, uma para cada parte da teologia sistemática, que se acendem ao longo dos níveis | Vovô Elias | **Conversa na Fonte**, ao nascer do sol, com o Vovô Elias (sem guardião, por reverência) |
| 3 | Emoções, caráter e virtudes | **Pomar do Bom Fruto** | Meio da tarde, luz amena | Verde-folha `#6fbf5a`, laranja `#ff9f43`, goiaba `#e8545d`, céu `#a8dcff` | Nove árvores com frutos diferentes (o fruto do Espírito); o Poço da Calma, para respirar e pensar; escadas de colheita; a **Velha Figueira** | Dona Hana | Diante da **Velha Figueira**, guardiã de tronco e folhas, que conta situações e escuta as escolhas |
| 4 | Relacionamentos e convivência | **Aldeia das Varandas** | Começo da noite, varais de lâmpadas acesos | Azul-anoitecer `#5b6fb5`, amarelo-lâmpada `#ffd98a`, terracota `#d9774b`, branco-cal `#f6efe4` | Casas com varandas e redes; a Mesa Comprida da praça; caixas de correio coloridas; banco dos avós | Seu Bené | **Jantar da Mesa Comprida**: simulações de conversa com moradores (amigo chateado, briga de irmãos) |
| 5 | Filosofia, lógica e pensamento crítico | **Torre das Perguntas** | Tarde clara, céu azul-profundo, nuvens altas | Azul `#3d6fd1`, pedra-areia `#e8d9b8`, sálvia `#9bb88f`, vermelho `#c4473b` | Torre de pedra com escada em espiral; labirinto de sebes na base (lógica); relógio de sol; lanterna no topo | Professor Aurélio | **Escada das Razões**: cada degrau é um argumento; no topo, a **Coruja de Pedra** desperta e faz a pergunta final |
| 6 | Comunicação, oratória e escrita | **Vale do Eco** | Manhã luminosa | Verde-vale `#7cc47a`, pedra-clara `#efe6d2`, turquesa `#8fd8e8`, vermelho-rádio `#e2463f` | Anfiteatro natural de pedra; torre da **Rádio do Vale**; ponte de cordas; o eco do vale só repete frases ditas com clareza | Lúcia da Rádio | **Apresentação no Anfiteatro**: discurso, história ou debate, com o eco como plateia |
| 7 | História, civismo, artes e música | **Cidade do Relógio** | Meio-dia ensolarado | Branco-cal `#f7f1e3`, azul-colonial `#2f5d9e`, ocre `#e3b04b`, pedra-sabão `#9a8f7e` | Torre do relógio parado; coreto da banda; museu; Câmara da cidade (civismo); ladeiras de pedra; ateliê de pintura | Dona Conceição | **O Relógio Volta a Andar**: no salão do museu, a criança monta a linha do tempo e explica as causas |
| 8 | Inglês | **Porto dos Navios** | Manhã fresca de maré cheia | Azul-mar `#2e86c1`, branco-vela `#fdfaf2`, vermelho-boia `#e8544e`, madeira `#a8754a` | Cais com navios de vela; placas em duas línguas; Café do Cais; guindaste de madeira; navio do Capitão Joe | Capitão Joe | **Conversa no Convés**, em inglês, com a tripulação visitante |
| 9 | Geografia e culturas do mundo | **Mirante dos Ventos** | Fim de manhã com vento | Verde-serra `#5aa36b`, azul-montanha `#6b8fc7`, branco-nuvem `#ffffff`, laranja-balão `#ff8a2a` | Estação de balões; rosa dos ventos gigante no chão; luneta; maquete do mundo; bandeiras de muitos países | Tainá | **Voo de Balão**: navegar com mapa e bússola até um destino, explicando relevo, clima e povos |
| 10 | Matemática | **Vale dos Moinhos** | Tarde de colheita, luz dourada | Trigo `#e9c46a`, oliva `#8ab17d`, céu `#bfe3f5`, telha `#c8553d` | Moinhos de vento e de água com engrenagens; campos em formas geométricas; balança gigante; sacos numerados; ábaco de pedras | Seu Nico | **O Moinho Grande**: cada problema resolvido faz uma engrenagem girar |
| 11 | Ciências naturais | **Caverna dos Cristais** | Noite (subterrâneo) | Azul-profundo `#1b2a52`, roxo `#5b3c88`, turquesa `#2fd3c4`, lanterna `#ffb35c` | Cristais que brilham; lago com reflexo; cogumelos que brilham; bancada de pesquisa de blocos; observatório na boca da caverna | Professora Íris | **Laboratório do Lago**: experimento controlado e explicação do resultado |
| 12 | Engenharia (civil, mecânica, eletrônica e robótica, software) | **Vila do Riacho** | Dia claro, tons pastel | Grama `#9fd67c`, rio `#6cc3f0`, telha `#e98b5a`, madeira `#c98a4b` | Ponte de blocos sobre o riacho; Oficina do Mestre Tomé; roda d'água e serraria (mecânica); usina da cachoeira (eletrônica); Ateliê do Código (software e robôs) | Mestre Tomé e Nina | **Desfiladeiro da Ponte Antiga**, ao entardecer, com o **Guardião da Ponte Antiga** |
| 13 | Tecnologia e IA com responsabilidade | **Ilha dos Faróis** | Crepúsculo azul, feixes de luz | Azul-noite `#1f3360`, ciano `#46d9ff`, amarelo-farol `#ffd23f`, rocha `#7d8597` | Faróis que trocam mensagens de luz (como a internet); cabos sobre o mar; a Casa das Senhas, com cofres; oficina do Léo; o robozinho Bip | Léo e Bip | **Noite dos Sinais Trocados**: simulação de golpes, mensagens falsas e respostas erradas de IA para conferir |
| 14 | Empreendedorismo | **Feira das Bandeirinhas** | Manhã de sábado, festiva | Amarelo `#ffe08a`, rosa `#ff7aa2`, verde-água `#4fc3a1`, lona `#f2efe6` | Rua coberta de bandeirinhas; barracas de lona; carrinho de limonada; Balcão do Seu Kalil; quadro de pedidos; oficina de protótipos | Seu Kalil | **Dia de Feira**: apresentar a ideia (pitch), atender clientes simulados e fechar o caixa |
| 15 | Finanças pessoais | **Mercado do Sol** | Fim de tarde dourado | Laranja-céu `#f3a46c`, dourado `#ffd27a`, sombra violeta `#7a5c8f`, avental verde `#3aa565` | Praça de paralelepípedos; banca da Dona Lia com os potes **Poupar, Doar e Gastar**; o Cofre da Praça; balança de pesar | Dona Lia | **Balanço do Mês**: simulação de um mês de orçamento com imprevistos |
| 16 | Vida prática e saúde | **Sítio das Mangueiras** | Manhã de sol com orvalho | Verde-mangueira `#4f9d4a`, terra `#b5713f`, céu `#9fd8ff`, palha `#f1d38a` | Mangueiras enormes; horta em canteiros; fogão a lenha; galpão de ferramentas; área de acampamento com fogueira segura; posto do socorrista (coração com cruz verde, nunca a Cruz Vermelha) | Rute | **Grande Almoço** ou **Noite no Acampamento**: simulação no jogo + missão real em família |

**Lugares que não são trilhas**
- **Vila da Família:** cada família tem a sua, na margem do riacho, entre a Vila do Riacho e o Jardim das Letras. Cresce com o que a família aprende.
- **Desfiladeiro da Ponte Antiga:** fenda de pedra ao entardecer (céu roxo-alaranjado, poeira dourada). Palco do primeiro grande chefão.
- **Montanhas Azuis e a Grande Biblioteca:** ruínas cobertas de névoa. Meta da faixa Mestre.

---

## 4. Bíblia de personagens

### 4.1 Regras de traço (valem para todos)

- Mesmo traço dos protótipos: formas arredondadas, cabeça grande sem exagero (adulto ~1/4 da altura; herói de 10 anos ~1/3,2), olhos grandes com brilho, bochechas rosadas leves, contorno de luz suave.
- Proporções de animação de cinema, nunca de bebê. Nada de cabeça cilíndrica, mãos em "C" ou rosto amarelo (nada que lembre minifigura).
- Cada personagem tem **uma cor-assinatura** e **um objeto-assinatura**, fáceis de reconhecer no plano alto da exploração.
- Roupas modestas e do dia a dia brasileiro. Diversidade natural: tons de pele, idades, sotaques e origens variados, sem caricatura.
- Mentores ensinam com respeito, erram às vezes e pedem desculpa, riem de si mesmos. Nenhum é perfeito; todos são bons.

### 4.2 O herói

| Item | Definição |
|---|---|
| Quem é | A própria criança. Chega à Terra Clara para ajudar e descobre que o que aprende conserta o mundo. |
| Idade visual | Cresce com a faixa: ~5 anos (Primeiros Passos, mais perto da câmera), ~8 (Aprendiz), **~10 (Explorador, o modelo dos protótipos)**, ~15 (Mestre, mais alto e com proporções de adolescente). |
| Customização | Menino ou menina; 10 tons de pele; cabelo crespo, cacheado, ondulado ou liso, curto, black, tranças, coque, rabo de cavalo ou longo solto; cores de cabelo naturais; cor dos olhos; sardas; óculos; aparelho auditivo; cadeira de rodas. |
| Roupa padrão | Camiseta azul com gola clara, calça azul-marinho (ou bermuda até o joelho, ou saia abaixo do joelho com legging), tênis brancos com sola vermelha, **mochila laranja com saco de dormir**. A mochila laranja é a marca do herói. |
| Roupas desbloqueáveis | Sempre modestas: colete de explorador, jaleco de cientista, avental de cozinha, capacete de obra, chapéu de palha, casaco de marinheiro, roupa de banda. |
| Objetos | **A lanterna** (recebida no capítulo 5), que fica mais bonita a cada nível do herói; a **faixa de distintivos**, com os emblemas de tecido. |
| Voz | A criança não tem voz gravada. Responde por botões, voz própria ou escrita. |

### 4.3 Companheiros

**Pipo, o passarinho guia** (já no protótipo de Primeiros Passos)
- Visual: passarinho redondo azul-céu, barriga creme, bico e pezinhos laranja, bochechas rosadas, três penas de topete.
- Personalidade: animado, curioso, um pouco desastrado; adora sons e rimas.
- Papel: guia e professor auxiliar dos 3 a 5 anos; nas outras faixas, mostra o caminho no mapa e traz os avisos. Para os mais velhos, pode ficar em "modo discreto" (só aparece quando chamado).
- Bordão: "Piu! Escuta só esse som!"

**Bip, o robozinho da Ilha dos Faróis**
- Visual: robô do tamanho de um gato, corpo de lanterna com tela de rosto simples, rodinhas e pinos hexagonais no topo.
- Personalidade: prestativo e confiante demais. Às vezes responde errado com toda a certeza.
- Papel: ensina que **IA ajuda, mas precisa ser conferida**. O herói aprende a checar o que o Bip diz.
- Bordão: "Tenho 100% de certeza!" (e o Léo responde: "Vamos conferir?")

**A Turma do Riacho** (crianças moradoras, que acompanham missões)
- **Lara** (7): curiosa, pergunta tudo, ainda está aprendendo a ler.
- **Caio** (11): inventor apressado; às vezes quer pular etapas e aprende com isso (inclusive a não colar).
- **Mel** (15): toca violão, ajuda os menores, mostra como é ser Mestre.

### 4.4 Mentores existentes (dos protótipos)

| Mentor | Trilha e região | Personalidade | Visual (traço aprovado) | Bordão | O que ensina |
|---|---|---|---|---|---|
| **Mestre Tomé** | Engenharia · Vila do Riacho | Construtor experiente, calmo, ri alto quando algo dá certo. Rege os blocos como um maestro. | ~65 anos, pele clara rosada, barba branca cheia, capacete amarelo, camisa de trabalho, avental marrom | "Primeiro o apoio, depois a altura!" | Estruturas, materiais, desenho técnico, máquinas simples |
| **Dona Lia** | Finanças · Mercado do Sol | Comerciante esperta e generosa, conhece todo mundo pelo nome, faz contas de cabeça. | ~50 anos, pele morena, cabelo grisalho nas têmporas, lenço vermelho de bolinhas, blusa amarela, saia vermelha, avental verde com uma moedinha no bolso, óculos | "Primeiro a gratidão: separe a parte de doar!" | Ganhar, poupar, doar, gastar com sabedoria, orçamento |
| **Professora Íris** | Ciências · Caverna dos Cristais | Pesquisadora encantada com tudo, anota cada detalhe, adora dizer "e se...?". | ~30 anos, pele parda, cabelo castanho-escuro em coque com elástico rosa, jaleco claro, óculos de proteção turquesa na testa, caderno azul e lápis | "Não adivinha: observa!" | Método científico, física, química, biologia, astronomia; a ordem e o ajuste fino do universo como sinais de um Criador |
| **Vovô Elias** | Teologia · Colina do Santuário | Idoso sereno, fala devagar, conta histórias, escuta mais do que fala. Reverente e caloroso. | ~80 anos, pele clara, topo calvo com cabelo branco dos lados, bigode branco, óculos redondos dourados, cardigã verde, bengala | "Guarde no coração e repita com calma." | Histórias bíblicas, leitura da Bíblia, as 7 partes da teologia sistemática, apologética, história da igreja. Nos temas que dividem igrejas, apresenta com respeito as principais visões evangélicas e destaca o consenso |
| **Guardião da Ponte Antiga** | Chefão · Desfiladeiro | Antigo, sereno, justo. Dorme até alguém chegar. Não luta: pergunta. | Gigante de pedra, madeira e musgo; pernas como pilares de ponte; peitoral de madeira com emblema de arco âmbar; olhos de luz âmbar; barba de musgo com flores; pinos hexagonais nos ombros | "Sábia resposta. Pode passar!" | Faz a pergunta final; curva-se e abre a passagem quando a criança demonstra o que sabe |

### 4.5 Mentores novos

| Mentor | Trilha e região | Personalidade | Visual | Bordão | O que ensina |
|---|---|---|---|---|---|
| **Tia Bel** (Isabel) | Alfabetização · Jardim das Letras | Professora jovem, musical, paciente. Transforma tudo em canção e palma. | ~25 anos, pele negra, cabelo black com faixa amarela, vestido azul até o joelho, avental cheio de bolsos com letras de madeira | "Cada letra tem um som. Vamos ouvir?" | Sons, letras, sílabas, leitura em voz alta, traçado; amor pela leitura |
| **Dona Hana** | Emoções e caráter · Pomar do Bom Fruto | Jardineira tranquila e firme. Fala pouco e certo. Sabe esperar a fruta amadurecer. | ~45 anos, nipo-brasileira, cabelo preto curto com franja, chapéu de palha de aba larga, camisa verde-folha, luvas de jardim, tesoura de poda no cinto | "Respira, pensa, escolhe." | Nomear emoções, autocontrole, honestidade, diligência, perseverança, gratidão, hábitos |
| **Seu Bené** (Benedito) | Relacionamentos · Aldeia das Varandas | Carteiro da aldeia. Conhece todas as famílias, junta quem está brigado, adora um cafezinho na varanda. | ~50 anos, pele negra, bigode grisalho, boné azul de carteiro, camisa clara de manga curta, bolsa de couro cheia de cartas | "Ouvir primeiro, falar depois." | Honra à família, comunicação, perdão e pacificação, amizade, empatia, serviço, liderança servidora |
| **Professor Aurélio** | Filosofia e lógica · Torre das Perguntas | Pensador bem-humorado. Responde pergunta com pergunta, mas sempre leva a uma resposta. | ~40 anos, pele parda, cabelo grisalho cacheado, óculos quadrados, colete xadrez, gravata-borboleta, lanterna antiga e caderno de perguntas | "Boa pergunta! Mas o que você quer dizer com isso?" | Perguntar e definir, lógica, falácias, como sabemos o que sabemos, ética, cosmovisão, resolução de problemas |
| **Lúcia da Rádio** | Comunicação · Vale do Eco | Locutora da Rádio do Vale. Voz clara, animada, corrige com carinho. | ~35 anos, pele morena clara, cabelo ondulado preso com lenço laranja, fones de ouvido no pescoço, camisa listrada, microfone antigo | "Fala devagar, que o vale inteiro escuta!" | Leitura, gramática, escrita clara, narração, oratória, retórica, debate respeitoso |
| **Dona Conceição** | História, civismo, artes e música · Cidade do Relógio | Guia do museu e regente da banda do coreto. Conta história como quem conta causo. | ~60 anos, pele negra, cabelo grisalho curto, chapéu de aba curta com broche de relógio, blazer azul-colonial, saia abaixo do joelho, batuta no bolso | "Quem conhece o caminho de ontem anda melhor hoje." | Linha do tempo, história do mundo e do Brasil, fontes, civismo e governo, artes, música |
| **Capitão Joe** (Joseph) | Inglês · Porto dos Navios | Marinheiro de fala inglesa que adotou a Terra Clara. Fala inglês devagar e um português engraçado. | ~45 anos, pele clara com sardas, cabelo e barba ruivos curtos, boné de capitão, suéter listrado azul e branco, cachecol vermelho | "Let's try! Vamos tentar!" | Ouvir, falar, ler e escrever em inglês, do "hello" a conversas de 10 minutos |
| **Tainá** | Geografia · Mirante dos Ventos | Balonista e cartógrafa, aventureira e cuidadosa. Ama mapas antigos e povos do mundo. | ~28 anos, brasileira de origem indígena do Norte, cabelo preto liso em trança longa, jaqueta mostarda de aviadora, óculos de voo na testa, mapas enrolados na mochila, bússola no pescoço | "Lá de cima, tudo faz mais sentido!" | Mapas, relevo, clima e biomas, países, povos e culturas, Brasil, missões e igreja global, cuidado com a criação |
| **Seu Nico** | Matemática · Vale dos Moinhos | Moleiro de origem italiana, conta tudo: sacos, passos, dentes de engrenagem. Paciente com quem erra. | ~50 anos, pele clara, bigode farto, boina, camisa branca com mangas dobradas, avental sujo de farinha, lápis atrás da orelha | "Conta de novo, sem pressa: número não mente!" | Aritmética, frações, geometria, álgebra, funções, probabilidade, estatística, matemática financeira, raciocínio |
| **Nina** | Engenharia (eletrônica, robótica e software) · Ateliê do Código, na Vila do Riacho | Neta do Mestre Tomé. Rápida, criativa, ensina como irmã mais velha. Mostra que um jovem pode ensinar. | ~16 anos, pele clara morena, cabelo castanho em rabo de cavalo, macacão jeans, camiseta amarela, cinto de ferramentas, óculos de leitura | "Se deu erro, ótimo: agora a gente sabe onde olhar!" | Circuitos, robótica, programação em blocos e em texto, algoritmos |
| **Léo** | Tecnologia e IA · Ilha dos Faróis | Faroleiro jovem e cuidadoso. Desconfia de mensagens estranhas. Domina a tecnologia sem ser dominado. | ~25 anos, nipo-brasileiro, cabelo liso escuro com topete, colete de muitos bolsos, fone de ouvido, crachá de faroleiro | "Antes de clicar, pensa!" | Como as máquinas funcionam, internet, segurança, privacidade, ética digital, domínio próprio, checagem, IA e seu uso sábio |
| **Seu Kalil** | Empreendedorismo · Feira das Bandeirinhas | Comerciante de família sírio-libanesa, dono do armarinho da feira. Atende todos como amigos e nunca engana no troco. | ~55 anos, pele clara azeitonada, bigode grisalho, colete marrom, camisa social, fita métrica no pescoço | "Cliente bem atendido volta, e volta com amigos!" | Vendas, divulgação, custos e lucro, processos, projetos, liderança, ética nos negócios, inovação |
| **Rute** | Vida prática e saúde · Sítio das Mangueiras | Sitiante nordestina e socorrista voluntária. Prática, divertida, exigente com segurança. | ~35 anos, pele parda, cabelo cacheado preso, chapéu de palha, camisa xadrez, calça de brim, botas, pochete de primeiros socorros (coração com cruz verde) | "Mão na massa, mas com cuidado!" | Culinária, casa, ferramentas, horta, primeiros socorros, nutrição, atividade física, acampamento, boas maneiras |

**Equilíbrio do elenco:** 17 mentores, 9 mulheres e 8 homens; idades de 16 a 80 anos; origens africana, europeia, indígena, japonesa, árabe e mestiça, como no Brasil.

### 4.6 Guardiões e palcos de chefão

Nem todo chefão precisa de um guardião. Onde há, ele é **antigo, sereno e feito do material da região**: nunca assusta, nunca luta, sempre se curva ao fim.

| Guardião | Região | Visual |
|---|---|---|
| Guardião da Ponte Antiga | Desfiladeiro (Engenharia) | Pedra, madeira, musgo, olhos âmbar (protótipo aprovado) |
| Velha Figueira | Pomar do Bom Fruto | Árvore com rosto suave no tronco, olhos de folha, voz lenta |
| Coruja de Pedra | Torre das Perguntas | Estátua de coruja que desperta, olhos de cristal azul |
| Árvore das Letras | Jardim das Letras | Árvore baixa cujas folhas são letras que caem e formam palavras |
| Os demais | Outras regiões | O chefão é conduzido pelo próprio mentor, num lugar especial da região (tabela da seção 3) |

---

## 5. Arco de história

### 5.1 O problema do mundo

Antes, a Terra Clara era cheia de gente que sabia construir, contar, plantar, cantar e cuidar uns dos outros. Os saberes ficavam na **Grande Biblioteca**. Com o tempo, as pessoas passaram a "deixar para depois": pararam de praticar, de ensinar os filhos e de visitar os vizinhos. Onde o cuidado acabou, veio a **Névoa do Esquecimento**.

**Não há vilão.** Há esquecimento, preguiça que todos podemos ter, e desafios naturais (tempestade, rio que sobe, colheita que atrasa). O herói não derrota ninguém: **aprende, aplica e serve**. Cada saber recuperado acende a lanterna e afasta a névoa.

**O fio da fé** (com a trilha de teologia ligada): a lanterna do herói lembra o Salmo 119:105, "Lâmpada para os meus pés é a tua palavra". O saber é bom e vem de Deus, que criou um mundo ordenado; a sabedoria verdadeira começa no temor do Senhor. A história nunca diz que conhecimento salva: ela mostra o conhecimento usado para amar a Deus e ao próximo.

### 5.2 Temporadas

A história cresce com a criança. Cada temporada dura de 3 a 4 meses. A mesma temporada serve a todas as faixas a partir dos 6 anos; o que muda é a profundidade do conteúdo (como nas trilhas).

| Ciclo | Temporada | Problema | Regiões principais |
|---|---|---|---|
| Primeiros Passos | **O Ninho do Pipo** (curta, em 6 episódios) | O vento espalhou as letras do ninho do Pipo pelo jardim. | Jardim das Letras + visitas |
| Aprendiz e todos | **T1 · A Lanterna e a Névoa** | A ponte caiu e a vila está isolada do mercado. | Terras do Sul (seção 5.3) |
| | **T2 · Os Faróis Apagados** | Os faróis pararam e nenhum navio chega. O relógio da cidade parou e ninguém lembra a própria história. | Norte: Cidade do Relógio, Mirante, Porto, Ilha dos Faróis |
| | **T3 · A Grande Feira das Ilhas** | Uma tempestade atingiu uma ilha vizinha. A Terra Clara organiza uma feira para ajudar. | Feira, Mercado, Sítio, Aldeia |
| Explorador | **T4 · As Expedições** | Barcos e balões levam o herói a ilhas novas, com outros povos e culturas, para levar ajuda e aprender com eles. | Porto, Mirante, ilhas novas |
| Mestre | **T5 · A Grande Biblioteca** | Reconstruir a biblioteca nas Montanhas Azuis. O jovem vira **Guia** e ensina a Turma do Riacho e os mais novos. | Montanhas Azuis e todas as regiões |
| Aprofundamento | **T6 · As Terras Altas** | Cada trilha escolhida abre o seu Alto, com projetos reais. | O Alto das regiões escolhidas |
| Especiais anuais | **Natal** e **Páscoa** (com teologia ligada) | Arcos curtos de 3 a 4 capítulos com a história bíblica, contada com reverência. | Colina do Santuário e a vila toda |

### 5.3 Temporada 1: A Lanterna e a Névoa (roteiro em 10 capítulos)

Cada capítulo leva de 1 a 2 semanas, com 4 a 8 sessões, uma missão no mundo real e um momento-chave. Os chefões de nível das trilhas seguem em paralelo; o capítulo só exige concluir as sessões dele.

---

**Capítulo 1 · Chegada à Vila do Riacho**
- **Região:** Vila do Riacho. **Mentor:** Mestre Tomé, com Pipo.
- **Problema:** o herói chega de barco pelo riacho. A ponte que ligava a vila ao Mercado do Sol caiu. Há uma névoa cinza no leito do rio, e os moradores estão desanimados.
- **O que se aprende:** andar, conversar, encaixar blocos (pino hexagonal em cima, trava borboleta dos lados). Engenharia civil: o que é apoio.
- **Momento-chave:** a primeira viga se encaixa e a névoa recua um palmo (exploração → construção).
- **Missão:** arrumar o próprio quarto como "base do herói" (verde).
- **Gancho:** "A ponte precisa de mais do que blocos. Precisa de quem saiba por que ela fica em pé."

**Capítulo 2 · A Ponte de Blocos**
- **Região:** Vila do Riacho. **Mentores:** Mestre Tomé e Nina.
- **Problema:** a ponte nova balança. Caio quer terminar logo e pula etapas, e uma parte cai (sem ninguém se machucar).
- **O que se aprende:** vigas, apoio dos dois lados, triângulos que deixam tudo mais firme. Caráter: fazer bem feito, mesmo quando ninguém olha.
- **Momento-chave:** modo construção com grade ciano e setas de força; a torre com contraventamento em X aguenta 3 caixotes.
- **Missão:** construir em casa uma ponte de papel ou palitos que aguente um livro (amarela; XP cruzado em Matemática).
- **Gancho:** a ponte fica pronta. Do outro lado, o Mercado do Sol está em silêncio.

**Capítulo 3 · O Mercado sem Troco**
- **Região:** Mercado do Sol. **Mentora:** Dona Lia.
- **Problema:** a névoa fez os vendedores esquecerem como contar o troco e dividir o que ganham. As barracas estão fechando.
- **O que se aprende:** moedas e cédulas, troco, os três potes **Poupar, Doar e Gastar**; necessidade e desejo.
- **Momento-chave:** fim de tarde dourado; a câmera desce para o diálogo com Dona Lia: "Você ganhou R$ 20 vendendo limonada. Como vai dividir?"
- **Missão:** três cofrinhos em casa por 4 semanas (verde).
- **Gancho:** duas vizinhas do mercado brigaram por causa de uma barraca de frutas.

**Capítulo 4 · A Briga das Frutas**
- **Regiões:** Aldeia das Varandas e Pomar do Bom Fruto. **Mentores:** Seu Bené e Dona Hana.
- **Problema:** Dona Zica e Dona Ivone, vizinhas de varanda, pararam de se falar. Cada uma acha que a outra pegou as frutas do seu pé. Ninguém está totalmente certo.
- **O que se aprende:** nomear o que se sente, respirar antes de falar, ouvir, pedir desculpa com frase completa ("Desculpa por ___. Você me perdoa?"), perdoar.
- **Momento-chave:** no Poço da Calma, o herói ajuda as duas a respirar e conversar; à noite, a Mesa Comprida da aldeia volta a ser posta.
- **Missão:** 5 atos secretos de serviço para alguém da família em 1 semana (verde).
- **Gancho:** Seu Bené entrega uma carta: "O Vovô Elias quer te ver ao amanhecer, lá na colina."

**Capítulo 5 · A Lanterna do Vovô Elias**
- **Região:** Colina do Santuário. **Mentor:** Vovô Elias.
- **Problema:** a névoa está mais grossa à noite, e o herói não consegue enxergar o caminho para a caverna do oeste.
- **O que se aprende:** a Bíblia como a Palavra de Deus; o Salmo 119:105 memorizado; gratidão e oração simples.
- **Momento-chave:** amanhecer lilás e dourado; no banco ao lado da oliveira, o versículo se completa pela voz da criança, e o Vovô Elias entrega a **lanterna**. A primeira das Sete Fontes se acende.
- **Missão:** orar em família antes de uma refeição por 7 dias, com 1 motivo de gratidão por dia (verde).
- **Versão sem teologia:** o Vovô Elias entrega a lanterna como "presente de avô" e ensina a gratidão (trilha de Emoções e caráter). Nenhum conteúdo bíblico aparece.
- **Gancho:** "Dizem que lá na caverna há pedras que guardam a luz."

**Capítulo 6 · O Segredo dos Cristais**
- **Região:** Caverna dos Cristais. **Mentora:** Professora Íris.
- **Problema:** os cristais da caverna poderiam iluminar o caminho, mas ninguém sabe como funcionam.
- **O que se aprende:** método científico: observar, levantar hipótese, testar, anotar. "O cristal brilha mais no escuro ou na luz?" Os cristais guardam a luz que recebem e a devolvem no escuro. A Professora Íris comenta a ordem do mundo criado: as coisas funcionam por leis que podemos descobrir.
- **Momento-chave:** noite azul e turquesa; o herói apaga a lanterna, observa, e o carimbo "Observação ✓" aparece no caderno de ciências.
- **Missão:** feijão no algodão: observar e desenhar por 10 dias (verde).
- **Gancho:** com cristais carregados de luz, dá para levar luz ao Vale dos Moinhos, que está parado.

**Capítulo 7 · Os Moinhos Parados**
- **Regiões:** Vale dos Moinhos e Sítio das Mangueiras. **Mentores:** Seu Nico e Rute.
- **Problema:** as engrenagens dos moinhos travaram e a farinha acabou. Ninguém lembra as medidas certas.
- **O que se aprende:** contar, medir, dobrar e dividir; formas dos campos; engrenagens grandes e pequenas. No sítio, a receita certa do pão com medidas.
- **Momento-chave:** cada conta certa faz uma engrenagem girar; o Moinho Grande volta a moer.
- **Missão:** medir os ingredientes de um bolo com a família e dobrar a receita (vermelha; XP cruzado em Vida prática).
- **Gancho:** na vila, começa um boato: "A névoa é um monstro que come pontes!" As crianças ficam com medo.

**Capítulo 8 · O Boato e o Eco**
- **Regiões:** Torre das Perguntas e Vale do Eco. **Mentores:** Professor Aurélio e Lúcia da Rádio.
- **Problema:** o boato se espalhou. As famílias não querem ir à festa que vai celebrar a ponte.
- **O que se aprende:** fato ou opinião? Como saber se algo é verdade (quem viu? como sabe?). Contar uma notícia com clareza e sem exagero.
- **Momento-chave:** o herói investiga e mostra que a névoa não come nada: ela só aparece onde as coisas foram esquecidas. Depois fala na Rádio do Vale, e o eco repete as frases ditas com clareza.
- **Missão:** contar uma história ou notícia de 2 minutos para a família no jantar (verde).
- **Gancho:** com a verdade dita, todos se lembram da Ponte Antiga do desfiladeiro, que liga o sul ao norte. Só passa quem convence o Guardião.

**Capítulo 9 · A Ponte Antiga** (chefão da temporada)
- **Região:** Desfiladeiro da Ponte Antiga. **Guardião:** Guardião da Ponte Antiga.
- **Problema:** a passagem para o norte está fechada há muitos anos.
- **O desafio:** modo prova, adaptado à faixa. O Guardião acorda e faz perguntas que juntam o que foi aprendido na temporada ("Explique com suas palavras por que uma viga precisa de apoio dos dois lados", "Como você dividiria R$ 20?", "Como saber se um boato é verdade?"). Em Primeiros Passos, não há este chefão.
- **Momento-chave:** entardecer roxo-alaranjado, câmera baixa, moldura dourada; "Sábia resposta. Pode passar!"; o Guardião se curva e a passagem iluminada se abre.
- **Segunda chance:** se não passar, o Guardião diz "Volte quando estiver pronto. Eu espero" e o mentor monta o reforço.
- **Recompensa:** título "Amigo da Ponte" e a passagem para o norte.

**Capítulo 10 · A Festa da Vila**
- **Regiões:** Vila do Riacho, Feira das Bandeirinhas e a Vila da Família. **Todos os mentores.**
- **Problema:** nenhum; é hora de celebrar e servir. A Feira das Bandeirinhas abre e Seu Kalil convida o herói a ter uma barraca.
- **O que se aprende:** planejar uma pequena barraca (empreendedorismo básico) e receber visitas (boas maneiras).
- **Momento-chave:** a vila inteira colorida, sem névoa; a Vila da Família ganha o primeiro prédio coletivo; a Turma do Riacho dança no coreto improvisado.
- **Missão em família:** preparar um lanche e contar para a família o que aprendeu na temporada (vermelha; XP cruzado em Comunicação).
- **Epílogo:** à noite, o Pipo voa até o alto da ponte e vê, no mar do norte, **os faróis apagados**. Começa a Temporada 2.

---

## Perguntas para o cliente

- **Pergunta:** Qual nome para o mundo do jogo? | **Opções:** A) Terra Clara (recomendada) B) Ilhas da Aurora C) Outro nome sugerido pelo cliente | **Por que importa:** O nome aparece em todo o jogo, na apostila e na loja de apps, e precisa passar pela busca no INPI antes da arte final.
- **Pergunta:** As regiões abrem em ondas, puxadas pela história, ou todas desde o início? | **Opções:** A) Em ondas; o responsável pode abrir tudo no painel (recomendada) B) Todas abertas desde o início, com a história como guia opcional C) Em ondas, sem opção de abrir antes | **Por que importa:** Em ondas, História, Inglês, Geografia e Tecnologia só começam depois de cerca de 10 semanas. Isso muda a ordem das apostilas e o ritmo de conteúdo.
- **Pergunta:** A história deve ter algum antagonista? | **Opções:** A) Não; só a Névoa do Esquecimento, sem rosto, e desafios naturais (recomendada) B) Um personagem trapalhão e preguiçoso que causa problemas e se arrepende C) Só desafios naturais, sem névoa | **Por que importa:** Define o tom de todas as temporadas. Um personagem trapalhão dá humor, mas pode virar alvo de zombaria entre crianças.
- **Pergunta:** O mentor de Inglês deve ser estrangeiro? | **Opções:** A) Sim, Capitão Joe, falante nativo de inglês (recomendada) B) Uma brasileira que morou fora e ensina em inglês e português | **Por que importa:** Afeta voz, sotaque, contratação de dublador e a sensação de "falar com alguém de fora", que motiva a prática.
- **Pergunta:** O avatar deve crescer com a faixa etária? | **Opções:** A) Sim, quatro idades visuais: 5, 8, 10 e 15 anos (recomendada) B) Um único herói de cerca de 10 anos para todos | **Por que importa:** Crescer ajuda os adolescentes a não acharem o jogo infantil, mas exige 4 modelos e animações em vez de 1.
- **Pergunta:** Os chefões de teologia ficam sem guardião, só com o Vovô Elias? | **Opções:** A) Sim, conversa reverente na Fonte, sem criatura (recomendada) B) Ter um guardião próprio, como nas outras regiões | **Por que importa:** Uma criatura fantástica no lugar sagrado pode soar estranha para algumas igrejas; a conversa com o Vovô Elias mantém a reverência.
