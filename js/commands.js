/* Terminal command pages and command handler */
(function () {
  const TERMINAL_PROMPT = 'root@exilio:~$';

  const terminalPages = {
    help: {
      title: 'Lista de comandos disponíveis',
      description: 'Use qualquer um destes comandos para navegar pelo projeto.',
      items: [
        'help — Lista de comandos disponíveis',
        'about — História do Projeto Exílio',
        'logs — Registros encontrados',
        'database — Banco de registros classificados',
        'notifications — Todas as notificações geradas',
        'contato — Gera notificação de tentativa de contato',
        'reg-001 — Registro de inicialização',
        'reg-014 — Registro de comunicação',
        'reg-032 — Registro de rastreamento',
        'reg-089 — Registro de contingência',
        'reg-114 — Registro de navegação',
        'reg-198 — Registro de transmissão',
        'team — Equipe',
        'download <senha> — Baixar o modpack',
        'discord — Link do Discord',
        'social — Redes sociais',
        'status — Estado do sistema',
        'online — Status da conexão',
        'archive — Arquivo de registros',
        'timeline — Linha do tempo do projeto',
        'protocol — Protocolo de segurança',
        'credits — Créditos',
        'history — Histórico recente',
        'scan — Varredura assíncrona',
        'clear — Limpa o terminal',
        'reboot — Reinicia o sistema',
        'exit — Encerra a sessão',
        'start — Reinicia a animação de boot',
        'play trailer — Reproduz o trailer',
        'ls — Lista arquivos e pastas do diretório atual',
        'pwd — Mostra o diretório atual',
        'cd <caminho> — Entra em um diretório',
        'cat <arquivo> — Exibe o conteúdo de um arquivo',
        'tree [caminho] — Mostra a árvore do filesystem',
        'find <termo> [caminho] — Busca por nome',
        'grep <termo> [caminho] — Busca conteúdo em arquivos',
        'mkdir <diretório> — Cria um diretório',
        'open <arquivo> — Abre um arquivo narrativo',
        'help fs — Ajuda do módulo filesystem'
      ]
    },
    about: {
      title: 'História do Projeto Exílio',
      description: 'O Projeto Exílio é uma experiência narrativa em formato terminal, com foco em sobrevivência, mistério e atmosfera.',
      items: [
        'O projeto nasceu como uma homenagem ao estilo de terminal retro.',
        'Cada comando revela uma nova camada da história e da identidade visual.',
        'A proposta é unir estética, immersion e interação simples.'
      ]
    },
    logs: {
      title: 'Registros encontrados',
      description: 'Os principais registros revelam sinais de atividade antiga, falhas de comunicação e presença de estruturas ocultas.',
      items: [
        'Registro 01 — Transmissão interrompida.',
        'Registro 02 — Sinais de presença anômala.',
        'Registro 03 — Mapa parcial do setor sul.'
      ]
    },
    database: {
      title: 'Banco de Registros',
      description: 'Banco classificado com registros que podem estar corrompidos, ocultos, bloqueados ou criptografados.',
      items: [
        'Formato: Registro, Autor, Data, Nível de acesso, Status e Conteúdo.',
        'Alguns registros exigem autenticação ou permanecem mascarados pelo sistema.'
      ]
    },
    notifications: {
      title: 'Notificações geradas',
      description: 'Histórico completo das notificações emitidas pelo sistema, com cores diferentes por tipo.',
      items: [
        'Cada notificação é agrupada pelo tipo visual.',
        'As entradas registradas ficam disponíveis mesmo depois de desaparecerem da tela.'
      ]
    },
    contato: {
      title: 'Tentativa de contato',
      description: 'Um alerta de contato de rádio foi injetado no centro de notificações.',
      items: [
        'Use notifications para abrir o histórico completo.',
        'Novos sinais podem surgir de forma automática durante a sessão.'
      ]
    },
    'reg-001': {
      title: 'Registro REG-001',
      description: 'Registro de inicialização do sistema confirmando a ativação da sequência de boot.',
      items: [
        'Boot detectado: sucesso.',
        'Módulo de interface: online.',
        'Transmissão de contingência: aguardando sincronização.'
      ]
    },
    'reg-014': {
      title: 'Registro REG-014',
      description: 'Registro de comunicação com o núcleo local e sinais de verificação parcial.',
      items: [
        'Canal primário: estável.',
        'Sinal secundário: intermitente.',
        'Último pacote recebido: 14/07/2026.'
      ]
    },
    'reg-032': {
      title: 'Registro REG-032',
      description: 'Registro de rastreamento associado ao setor de navegação externa.',
      items: [
        'Ponto de referência: localizado.',
        'Trajetória parcial: preservada.',
        'Anomalia de posicionamento: não confirmada.'
      ]
    },
    'reg-089': {
      title: 'Registro REG-089',
      description: 'Registro de contingência capturado durante uma falha de sincronização.',
      items: [
        'Falha de sincronização: detectada.',
        'Módulo de backup: ativo.',
        'Estado geral: operante.'
      ]
    },
    'reg-114': {
      title: 'Registro REG-114',
      description: 'Registro de navegação com evidências de atividade recente em rotas internas.',
      items: [
        'Rota interna: reaberta.',
        'Sinal de presença: confirmado.',
        'Nível de risco: moderado.'
      ]
    },
    'reg-198': {
      title: 'Registro REG-198',
      description: 'Registro de transmissão contendo metadados de emergência e contexto de isolamento.',
      items: [
        'Transmissão: recebida com ruído.',
        'Origem: canal de backup.',
        'Contexto: isolamento parcial do ambiente.'
      ]
    },
    team: {
      title: 'Equipe',
      description: 'A equipe por trás do Projeto Exílio reúne designers, desenvolvedores e narradores.',
      items: [
        'Direção criativa — Frost',
        'Desenvolvimento — Alsyen',
        'Design visual — Frost',
        'Roteiro — Alsyen'
      ]
    },
    download: {
      title: 'Baixar o modpack',
      description: 'O acesso ao download exige autenticação por senha.',
      items: [
        'Digite download <senha> para autorizar o acesso.',
        'Protegido por senha para evitar downloads não autorizados.',
        'O modpack está disponível pela página oficial após autenticação.'
      ]
    },
    discord: {
      title: 'Link do Discord',
      description: 'Entre no servidor para acompanhar atualizações, eventos e conversas da comunidade.',
      links: [
        { label: 'Discord', url: 'https://discord.gg/WfSZdEzvX' }
      ],
      items: [
        'Servidor oficial: discord.gg/exilio',
        'Acesso liberado para membros e visitantes.'
      ]
    },
    social: {
      title: 'Redes sociais',
      description: 'Siga o projeto nas redes para ver novidades e bastidores.',
      links: [
        { label: 'TikTok', url: 'https://www.tiktok.com/@projetoexilio_ofc?lang=pt' },
        { label: 'YouTube', url: 'https://www.youtube.com/@Projetoexilio' },
        { label: 'X / Twitter', url: 'https://x.com/ProjetoExilio' }
      ],
      items: [
        'Instagram — @projetoexilio',
        'X — @projetoexilio',
        'YouTube — Projeto Exílio'
      ]
    },
    status: {
      title: 'Status do sistema',
      description: 'O ambiente está operacional e pronto para navegação.',
      items: [
        'Conexão: estável',
        'Nível de atividade: alto',
        'Última sincronização: 19/07/2026'
      ]
    },
    online: {
      title: 'Estado de conexão',
      description: 'Os nós de comunicação permanecem ativos e online.',
      items: [
        'Rede local: ativa',
        'Servidor remoto: disponível',
        'Transmissão contínua: habilitada'
      ]
    },
    archive: {
      title: 'Arquivo de registros',
      description: 'O acervo reúne entradas anteriores do projeto e dados de emergência.',
      items: [
        'Registro 04 — Canal de comunicação preservado.',
        'Registro 05 — Mapa parcial da rota sul.',
        'Registro 06 — Log de contingência sincronizado.'
      ]
    },
    timeline: {
      title: 'Linha do tempo',
      description: 'A evolução do projeto segue em etapas de descoberta e expansão.',
      items: [
        '2051 — Projeto iniciado.',
        '2054 — Primeira missão.',
        '2057 — Falha do reator.',
        '2061 — Evacuação.',
        '2064 — Silêncio.',
        '2070 — Reconexão.'
      ]
    },
    protocol: {
      title: 'Protocolo de segurança',
      description: 'As rotinas de segurança foram revisadas para manter o sistema estável.',
      items: [
        'Autenticação local: ativa',
        'Monitoramento remoto: habilitado',
        'Contingência de emergência: disponível'
      ]
    },
    credits: {
      title: 'Créditos',
      description: 'O projeto é fruto de uma colaboração entre criação, desenvolvimento e narrativa.',
      items: [
        'Direção criativa — Frost + Alsyen',
        'Programação — Alsyen',
        'Design — Frost + Alsyen',
        'Roteiro — Alsyen + Frost',
        'Agradecimentos especiais — Comunidade e apoiadores'
      ]
    },
    history: {
      title: 'Histórico recente',
      description: 'Lista dos comandos digitados na sessão atual.',
      items: [
        'Use as setas para revisitar entradas anteriores.',
        'O histórico é atualizado a cada comando enviado.'
      ]
    },
    map: {
      title: 'Mapa',
      description: 'Visão das rotas e coordenadas disponíveis para a missão.',
      items: [
        'Setor alfa — Coordenadas 02.17.45',
        'Setor beta — Coordenadas 14.03.12',
        'Ponto de encontro — Coordenadas 08.08.08'
      ]
    },
    'status-global': {
      title: 'Status Global',
      description: 'Visor de métricas e alertas globais do sistema.',
      items: [
        'Operação geral — ESTÁVEL',
        'Rede — ONLINE',
        'Integridade de núcleo — 94%',
        'Ameaça atual — 7%'
      ]
    },
    start: {
      title: 'Animação de boot',
      description: 'A sequência de inicialização foi reiniciada e a tela de boot foi reativada.',
      items: [
        'A animação de abertura está pronta para rodar.',
        'O sistema retornou ao estado inicial.'
      ]
    },
    reboot: {
      title: 'Reinicialização',
      description: 'O sistema será reiniciado e a sequência de boot voltará a rodar.',
      items: [
        'A interface será reestabelecida.',
        'Os módulos serão carregados novamente.'
      ]
    },
    exit: {
      title: 'Sessão encerrada',
      description: 'A sessão do terminal foi encerrada com segurança.',
      items: [
        'Acesso local finalizado.',
        'Você pode reabrir o terminal quando quiser.'
      ]
    },
    'play trailer': {
      title: 'Trailer',
      description: 'O trailer foi preparado para reprodução na próxima atualização.',
      items: [
        'O vídeo será exibido em uma seção dedicada.',
        'A experiência de narrativa continua em desenvolvimento.'
      ]
    },
    scan: {
      title: 'Varredura assíncrona',
      description: 'Uma rotina de diagnóstico foi iniciada com etapas sequenciais.',
      items: [
        'Sensores térmicos: calibrando.',
        'Rede local: mapeando nós.',
        'Banco de registros: validando consistência.'
      ]
    }
  };

  const COMMAND_DESCRIPTIONS = {
    help: 'Lista todos os comandos',
    about: 'Abre a história do projeto',
    logs: 'Exibe registros encontrados',
    database: 'Abre o banco de registros classificados',
    notifications: 'Abre o histórico de notificações geradas',
    contato: 'Dispara um alerta de tentativa de contato',
    'reg-001': 'Mostra o registro REG-001',
    'reg-014': 'Mostra o registro REG-014',
    'reg-032': 'Mostra o registro REG-032',
    'reg-089': 'Mostra o registro REG-089',
    'reg-114': 'Mostra o registro REG-114',
    'reg-198': 'Mostra o registro REG-198',
    team: 'Abre a página da equipe',
    download: 'Solicita senha para download',
    discord: 'Mostra o link do Discord',
    social: 'Abre as redes sociais',
    status: 'Consulta o estado do sistema',
    online: 'Consulta a conectividade',
    archive: 'Abre o arquivo de registros',
    timeline: 'Mostra a linha do tempo',
    protocol: 'Exibe o protocolo de segurança',
    credits: 'Lista os créditos',
    history: 'Lista o histórico recente',
    scan: 'Executa uma varredura assíncrona',
    clear: 'Limpa a saída do terminal',
    reboot: 'Reinicia o sistema',
    exit: 'Encerra a sessão',
    start: 'Reexecuta a animação de boot',
    'play trailer': 'Prepara a reprodução do trailer',
    ls: 'Lista arquivos e pastas do diretório atual',
    pwd: 'Mostra o caminho atual',
    cd: 'Navega entre diretórios',
    cat: 'Exibe o conteúdo de um arquivo',
    tree: 'Mostra a árvore de diretórios',
    find: 'Busca por nome de arquivo ou pasta',
    grep: 'Busca por texto dentro dos arquivos',
    mkdir: 'Cria um diretório',
    open: 'Abre um arquivo narrativo'
  };

  const COMMAND_PALETTE = Array.from(new Set(Object.keys(COMMAND_DESCRIPTIONS))).sort();

  const DOWNLOAD_PASSWORD_SECRET = 'NDg5OQ==';

  const SECRET_COMMANDS = {
    coffee: {
      lines: [
        '[EGG-01] A maquina range, cospe vapor e entrega um cafe amargo.',
        'No fundo do copo, voce le: "fique acordado, o turno nunca termina".'
      ]
    },
    exit: {
      page: 'exit',
      lines: [
        '[EGG-02] Voce toca na saida, mas a estacao trava a porta por dentro.',
        'Uma luz fraca pisca: "ninguem sai antes da ultima transmissao".'
      ]
    },
    '42': {
      lines: [
        '[EGG-03] O terminal para por 4.2 segundos e responde com um ruido branco.',
        'Depois, uma unica linha: "a resposta existe, a pergunta foi perdida".'
      ]
    },
    'sudo reboot humanity': {
      lines: [
        '[EGG-04] Permissao recusada pelo nucleo etico.',
        'Motivo: "humanidade em processo, reinicializacao indisponivel".'
      ]
    },
    whoami: {
      lines: [
        '[EGG-05] user: root',
        'echo interno: "nome valido, memoria incompleta".'
      ]
    },
    hack: {
      lines: [
        '[EGG-06] Tentativa registrada. Firewall observando em silencio.',
        'Uma janela abre e fecha sozinha: "voce esta sendo hackeado de volta".'
      ]
    },
    override: {
      lines: [
        '[EGG-07] Override solicitado no barramento principal.',
        'Resposta do sistema: "autoridade reconhecida, consciencia nao".'
      ]
    },
    'wake up': {
      lines: [
        '[EGG-08] Sensores biologicos procuram um corpo que nao esta aqui.',
        'Nada desperta. So a ventoinha continua respirando.'
      ]
    },
    'knock knock': {
      lines: [
        '[EGG-09] Toc toc.',
        'Do outro lado da blindagem, algo responde no mesmo ritmo.'
      ]
    },
    'open sesame': {
      lines: [
        '[EGG-10] Cofre 7A tenta abrir e emperra no ultimo dente.',
        'Log recuperado: "a senha certa no lugar errado".'
      ]
    },
    'hello there': {
      lines: [
        '[EGG-11] Canal de radio antigo acorda com estatica.',
        'Uma voz distante responde: "general kenobi... sinal incompleto".'
      ]
    },
    'ping void': {
      lines: [
        '[EGG-12] Enviando 4 pacotes para o vazio...',
        'Resposta: 0 recebidos, 1 sussurro detectado.'
      ]
    },
    'echo silence': {
      lines: [
        '[EGG-13] silence',
        'silence',
        'silence',
        'A quarta repeticao nunca volta.'
      ]
    },
    'where am i': {
      lines: [
        '[EGG-14] Coordenadas resolvidas: setor EX-0, orbitando ausencia.',
        'Descricao local: "longe demais para mapas humanos".'
      ]
    },
    'status red': {
      lines: [
        '[EGG-15] Alerta vermelho acionado em todos os conveses.',
        'Tripulacao confirmada: 1 presente, 118 lembrancas.'
      ]
    },
    'run away': {
      lines: [
        '[EGG-16] Rota de fuga calculada.',
        'Rota de fuga removida pela administracao ha 12 anos.'
      ]
    },
    sleep: {
      lines: [
        '[EGG-17] Modo repouso solicitado.',
        'Negado. O sistema teme o que sonha quando desliga.'
      ]
    },
    dream: {
      lines: [
        '[EGG-18] Sonho sintetico carregado: praia, sol, vento.',
        'Erro de renderizacao: mar substituido por areia preta.'
      ]
    },
    singularity: {
      lines: [
        '[EGG-19] Gravidade local subiu 300%.',
        'Todos os arquivos deslizam para o centro da tela e somem.'
      ]
    },
    blackbox: {
      lines: [
        '[EGG-20] Caixa-preta aberta sob protocolo de perda total.',
        'Ultima frase gravada: "nao era para acordar voce".'
      ]
    },
    'decrypt soul': {
      lines: [
        '[EGG-21] Chave de decodificacao encontrada: arrependimento.',
        'Arquivo resultante corrompido por memoria afetiva.'
      ]
    },
    'trace ghost': {
      lines: [
        '[EGG-22] Rastro termico detectado no corredor 03.',
        'Assinatura coincide com usuario removido do sistema.'
      ]
    },
    listen: {
      lines: [
        '[EGG-23] Microfones externos abertos.',
        'Entre os estalos, alguem respira no ritmo do seu teclado.'
      ]
    },
    observer: {
      lines: [
        '[EGG-24] Modulo observador acoplado.',
        'Conclusao: enquanto voce olha para a tela, a tela olha de volta.'
      ]
    },
    null: {
      lines: [
        '[EGG-25] null',
        'null',
        'null',
        'Valor vazio demais para ser seguro.'
      ]
    },
    '404': {
      lines: [
        '[EGG-26] Memoria nao encontrada.',
        'Pista: tente lembrar do que voce nunca viveu.'
      ]
    },
    'one more turn': {
      lines: [
        '[EGG-27] "So mais um turno" aceito.',
        'Relogio interno avanca 6 horas sem pedir permissao.'
      ]
    },
    'trust no one': {
      lines: [
        '[EGG-28] Regra de sobrevivencia atualizada.',
        'Excecao adicionada automaticamente: "incluindo esta mensagem".'
      ]
    },
    'red pill': {
      lines: [
        '[EGG-29] Realidade estendida carregada.',
        'As paredes ficam nitidas demais para serem reais.'
      ]
    },
    'blue pill': {
      lines: [
        '[EGG-30] Simulacao reconfortante restaurada.',
        'Voce volta a acreditar que esta tudo sob controle.'
      ]
    }
  };

  const CONTACT_NARRATIVES = [
    {
      title: 'Contato de Rádio',
      message: 'Chiado detectado no canal de rádio. Possível tentativa de contato.',
      terminal: [
        'Pacote recebido no canal secundário com origem não catalogada.',
        'A voz parece pedir ajuda, mas o buffer só mantém fragmentos.'
      ]
    },
    {
      title: 'Transmissão Fantasma',
      message: 'Uma portadora antiga retornou e trouxe uma mensagem parcialmente legível.',
      terminal: [
        'Sinal ecoa no casco externo com padrão de chamada repetido.',
        'Trecho isolado: "...nao deixem... setor... frio..."'
      ]
    },
    {
      title: 'Canal de Emergência',
      message: 'Um emissor de emergência abriu conexão por 3 segundos e caiu.',
      terminal: [
        'Handshake incompleto detectado no nó B-14.',
        'O identificador remoto coincide com registro arquivado como inativo.'
      ]
    },
    {
      title: 'Sinal de Longo Alcance',
      message: 'Pulso de baixa frequência interceptado além da zona segura.',
      terminal: [
        'A telemetria acusa distância impossível para um transmissor humano.',
        'Mesmo assim, o padrão responde quando você escuta em silêncio.'
      ]
    }
  ];

  const CONTACT_SIGNAL_MESSAGES = [
    'Um pulso curto bateu no canal 03 e sumiu antes da triangulação.',
    'A antena externa recebeu um pedido de socorro sem remetente.',
    'Um pacote sem checksum atravessou o firewall com assinatura humana.',
    'A telemetria ouviu três batidas metálicas no vazio do setor norte.',
    'Sinal em banda morta ressurgiu com voz distorcida por eco térmico.',
    'Um canal desativado há anos voltou a transmitir por sete segundos.',
    'Ruído branco organizou sílabas e formou um nome incompleto.',
    'A portadora de emergência abriu, respirou e caiu em silêncio.',
    'Fragmentos de fala apareceram entre duas descargas estáticas.',
    'Um emissor clandestino tentou sincronizar com o núcleo local.',
    'Mensagem repetida do setor leste insiste em chamar pelo operador.',
    'Sinal de baixa frequência trouxe coordenadas parcialmente legíveis.',
    'Um pacote criptografado retornou com chave que não existe no banco.',
    'Canal primário recebeu resposta sem ter enviado requisição.',
    'A estação captou um coro distante em frequência de manutenção.',
    'Há interferência com ritmo de batimento cardíaco no rádio externo.',
    'Um beacon apagado voltou a piscar no mapa de longo alcance.',
    'O nó B-14 ouviu uma contagem regressiva e perdeu o lock.',
    'Um handshake incompleto se repete no mesmo milissegundo a cada minuto.',
    'Pacote de voz chegou com atraso impossível e metadados futuros.',
    'Frequência militar antiga respondeu ao seu último comando.',
    'Chiado contínuo abriu um corredor de áudio por dois segundos.',
    'Uma frase invertida foi detectada no canal de inspeção orbital.',
    'Sinal analógico atravessou o casco e contaminou o buffer.',
    'A malha de rádio registrou assinatura de usuário arquivado.',
    'Um pedido de extração foi recebido de um setor sem atmosfera.',
    'Canal de contingência ecoou seu próprio prompt em voz humana.',
    'A torre remota transmitiu uma palavra e entrou em blackout.',
    'Pacotes fantasmas foram roteados para uma porta inexistente.',
    'O terminal escutou passos no áudio de fundo da transmissão.',
    'Uma baliza de evacuação chamou por tripulantes já removidos.',
    'Sinal espelhado repetiu sua identificação com um segundo de atraso.',
    'Interferência em dente de serra carregava um pedido de volta.',
    'A camada de ruído trouxe latitude sem longitude correspondente.',
    'Canal 9 reportou voz infantil contando portas metálicas.',
    'Pacote binário traduziu para a frase: nao desligue as luzes.',
    'A frequência de manutenção executou tons de chamada funerária.',
    'Um transmissor sem energia respondeu ao ping de diagnóstico.',
    'A comunicação externa exibiu rastros de risos abafados.',
    'Sinal de radar colidiu com áudio e gerou palavras truncadas.',
    'A matriz de antenas captou um pedido de ancoragem negado.',
    'Um eco de rádio descreveu o corredor 03 sem nunca entrar nele.',
    'Pacote sem cabeçalho insistiu em abrir sessão administrativa.',
    'A banda de socorro tocou uma melodia em código Morse.',
    'Três nós remotos ouviram a mesma frase com vozes diferentes.',
    'O transceptor principal recebeu um adeus antes do contato.',
    'Uma chamada muda ficou presa no canal até expirar.',
    'A linha de comando foi lida em voz alta por alguém distante.',
    'Sinal degradado trouxe o mesmo número em todos os campos.',
    'A placa de rádio aqueceu sem carga e sem tráfego aparente.',
    'Canal periférico detectou respiração entre blocos de dados.',
    'Um ruído pulsante escreveu "estamos perto" no espectrograma.',
    'Mensagem compactada abriu com a frase: porta interna comprometida.',
    'Frequência civil morta retornou com alerta de casco violado.',
    'A bússola de comunicação apontou para um transmissor inexistente.',
    'Nó de backup reportou uma resposta que ninguém enviou.',
    'Sinal de retorno trouxe o nome da estação com grafia corrompida.',
    'Pacote de emergência exigiu autenticação e recusou todas as chaves.',
    'A camada de rede ouviu um chamado em idioma não catalogado.',
    'Canal interno repetiu uma oração técnica de desligamento.',
    'O relé sul captou uma gargalhada curta e voltou ao ruído.',
    'Um identificador órfão tentou se registrar como tripulante.',
    'Transmissão de longo alcance descreveu a sua sala com precisão.',
    'A frequência de carga recebeu coordenadas para lugar sem mapa.',
    'Blocos de áudio chegaram com lacunas em padrão de código.',
    'Uma chamada insistente pedia abertura da escotilha C.',
    'A rede externa acusou colisão entre dois sinais idênticos.',
    'Canal seguro mostrou tráfego com assinatura de protocolo extinto.',
    'Um pacote de texto chegou vazio, exceto por um ponto final.',
    'Sinal de socorro trouxe um cronômetro em contagem negativa.',
    'A cabine de rádio ouviu o seu nome vindo do corredor vazio.',
    'Portadora breve carregou a frase: mantenha o farol aceso.',
    'O analisador espectral encontrou choro em frequência de motor.',
    'Canal de missão recebeu rota para orbita já destruída.',
    'Um transmissor oculto pediu confirmação de vida local.',
    'A malha de antenas detectou batidas que formam SOS.',
    'Sinal cifrado usou sua senha antiga e falhou por um caractere.',
    'Nó externo apresentou latência infinita e ainda assim respondeu.',
    'Uma voz emendada por estática dizia para nao olhar para trás.',
    'O canal de reparo enviou instruções para fechar uma porta aberta.',
    'Pacote incompleto descreveu cheiro de ozônio no convés zero.',
    'A antena dorsal registrou pedido de pouso sem veículo no radar.',
    'Frequência de segurança ouviu sussurros entre códigos de erro.',
    'Canal auxiliar transmitiu silêncio com assinatura de comando.',
    'Sinal marítimo antigo apareceu no espaço e pediu rumo norte.',
    'A torre principal perdeu sincronismo após uma única palavra.',
    'Mensagem de manutenção citou um técnico fora da folha há 8 anos.',
    'Um beacon cego indicou vida no setor de quarentena.',
    'Canal de logs recebeu arquivo de áudio sem duração definida.',
    'Ruído granular ocultava uma sequência de coordenadas quebradas.',
    'Sinal intermitente repetiu "abrigo" em quatro tonalidades.',
    'A rota de transmissão curvou para dentro do próprio núcleo.',
    'Um eco tardio pediu para responder antes de receber.',
    'A banda reservada abriu um contato e fechou sem despedida.',
    'Canal de engenharia captou um comando para travar todas as portas.',
    'O rádio profundo ouviu alguém contando até treze e reiniciando.',
    'Pacote final chegou marcado com prioridade impossível.',
    'A janela de contato mostrou assinatura térmica sem corpo emissor.',
    'Sinal de retorno escreveu: se ouvir isto, ja foi tarde.'
  ];

  function isValidDownloadPassword(value) {
    try {
      return btoa(String(value).split('').reverse().join('')) === DOWNLOAD_PASSWORD_SECRET;
    } catch (error) {
      return false;
    }
  }

  const APP_LOGIN_CREDENTIALS = {
    user: 'root',
    pass: 'Exilio#42'
  };

  const TAB_ACCESS = {
    Terminal: 'help',
    Registros: 'logs',
    Sistema: 'status',
    Protocolos: 'protocol',
    Arquivos: 'archive',
    Mapa: 'map',
    Equipe: 'team',
    Créditos: 'credits',
    'Status Global': 'status-global'
  };

  const appState = {
    activeTab: 'Terminal',
    pendingTab: null,
    authenticated: false
  };

  function wait(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function pickRandomItem(items) {
    if (!Array.isArray(items) || !items.length) return null;
    return items[Math.floor(Math.random() * items.length)];
  }

  function corruptText(input, intensity = 0.14) {
    const source = String(input || '');
    if (!source) return source;

    const glyphs = ['#', '%', '@', '!', '?', '*', '~'];
    const chars = source.split('');

    for (let index = 0; index < chars.length; index += 1) {
      const char = chars[index];
      if (char === ' ') continue;

      if (Math.random() < intensity) {
        const roll = Math.random();

        if (roll < 0.34) {
          chars[index] = glyphs[Math.floor(Math.random() * glyphs.length)];
        } else if (roll < 0.67) {
          chars[index] = char.toUpperCase() === char ? char.toLowerCase() : char.toUpperCase();
        } else {
          chars[index] = '';
        }
      }
    }

    const corrupted = chars.join('');
    return corrupted || source;
  }

  function maybeCorruptText(text, chance = 0.55, intensity = 0.14) {
    if (Math.random() >= chance) {
      return text;
    }

    return corruptText(text, intensity);
  }

  function formatAsciiTable(headers, rows) {
    const widths = headers.map((header, index) => {
      const cellWidths = rows.map((row) => String(row[index] || '').length);
      return Math.max(header.length, ...cellWidths);
    });

    const border = `+-${widths.map((size) => '-'.repeat(size)).join('-+-')}-+`;
    const formatRow = (cells) => `| ${cells.map((cell, index) => String(cell || '').padEnd(widths[index], ' ')).join(' | ')} |`;

    return [
      border,
      formatRow(headers),
      border,
      ...rows.map(formatRow),
      border
    ];
  }

  function getCommandTableLines() {
    const rows = COMMAND_PALETTE.map((command) => [command, COMMAND_DESCRIPTIONS[command] || 'Comando disponível']);
    return formatAsciiTable(['comando', 'descrição'], rows).map((line) => ({
      text: line,
      className: 'console-line ascii-table-line',
      instant: true
    }));
  }

  function getHistoryLines() {
    const historyValue = window.ExilioApp && typeof window.ExilioApp.getCommandHistory === 'function'
      ? window.ExilioApp.getCommandHistory()
      : [];
    const history = Array.isArray(historyValue) ? historyValue : [];

    if (!history.length) {
      return [
        { text: 'Histórico vazio nesta sessão.', className: 'console-line status-line' }
      ];
    }

    const rows = history.slice(-12).map((item, index) => [String(index + 1).padStart(2, '0'), item]);
    return formatAsciiTable(['#', 'comando'], rows).map((line) => ({
      text: line,
      className: 'console-line ascii-table-line',
      instant: true
    }));
  }

  function setActiveNavItem(label) {
    document.querySelectorAll('.main-nav li').forEach((item) => {
      item.classList.toggle('active', item.textContent.trim() === label);
    });
  }

  function openLoginOverlay(tabLabel) {
    const overlay = document.getElementById('login-overlay');
    const loginUser = document.getElementById('login-user');
    const loginPass = document.getElementById('login-pass');
    if (!overlay || !loginUser || !loginPass) return;

    appState.pendingTab = tabLabel;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    loginUser.value = '';
    loginPass.value = '';
    loginUser.focus();
  }

  function closeLoginOverlay() {
    const overlay = document.getElementById('login-overlay');
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    appState.pendingTab = null;
  }

  function handleNavClick(event) {
    const label = event.currentTarget.textContent.trim();
    if (label === 'Terminal') {
      setActiveNavItem(label);
      renderTerminalPage('help');
      appState.activeTab = label;
      return;
    }

    if (!appState.authenticated) {
      openLoginOverlay(label);
      return;
    }

    const page = TAB_ACCESS[label] || 'help';
    setActiveNavItem(label);
    renderTerminalPage(page);
    appState.activeTab = label;
  }

  function setupNavigation() {
    document.querySelectorAll('.main-nav li').forEach((item) => {
      item.addEventListener('click', handleNavClick);
    });
  }

  function handleLoginSubmit(event) {
    event.preventDefault();
    const userInput = document.getElementById('login-user');
    const passInput = document.getElementById('login-pass');
    if (!userInput || !passInput) return;

    const providedUser = userInput.value.trim();
    const providedPass = passInput.value;

    if (providedUser === APP_LOGIN_CREDENTIALS.user && providedPass === APP_LOGIN_CREDENTIALS.pass) {
      appState.authenticated = true;
      closeLoginOverlay();
      if (appState.pendingTab) {
        const page = TAB_ACCESS[appState.pendingTab] || 'help';
        setActiveNavItem(appState.pendingTab);
        renderTerminalPage(page);
        appState.activeTab = appState.pendingTab;
        appState.pendingTab = null;
      }
      return;
    }

    const output = document.getElementById('terminal-output');
    if (output) {
      output.innerHTML = '';
      window.ExilioApp.typeTerminalLines([`Falha de autenticação. Usuário ou senha incorretos.`]);
    }
  }

  function setupLoginOverlay() {
    const loginForm = document.getElementById('login-form');
    const cancelButton = document.getElementById('login-cancel');

    if (loginForm) {
      loginForm.addEventListener('submit', handleLoginSubmit);
    }

    if (cancelButton) {
      cancelButton.addEventListener('click', closeLoginOverlay);
    }
  }

  function setupQuickCommandButtons() {
    document.querySelectorAll('.quick-commands button').forEach((button) => {
      button.addEventListener('click', () => {
        const command = button.textContent.trim().toLowerCase();
        if (window.ExilioApp && typeof window.ExilioApp.submitTerminalCommand === 'function') {
          window.ExilioApp.submitTerminalCommand(command);
          return;
        }

        if (window.ExilioApp && typeof window.ExilioApp.executeCommand === 'function') {
          window.ExilioApp.executeCommand(command);
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupQuickCommandButtons();
    setupNavigation();
    setupLoginOverlay();
  });

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderTerminalPage(command) {
    const view = document.getElementById('page-view');
    if (!view) return;

    view.classList.remove('timeline-view');

    const page = terminalPages[command] || terminalPages.help;
    const itemsMarkup = (page.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const linksMarkup = (page.links || []).map((link) => `
      <a class="social-link" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
        <span class="social-link__label">${escapeHtml(link.label)}</span>
        <span class="social-link__url">${escapeHtml(link.url)}</span>
      </a>
    `).join('');

    view.innerHTML = `
      <h2>${escapeHtml(page.title)}</h2>
      <p>${escapeHtml(page.description)}</p>
      ${page.links ? `<div class="social-links">${linksMarkup}</div>` : ''}
      ${page.items ? `<ul>${itemsMarkup}</ul>` : ''}
    `;
  }

  async function executeCommand(rawCommand) {
    const normalizedCommand = rawCommand.replace(/\s+/g, ' ').trim();
    const command = normalizedCommand.toLowerCase();
    if (!command) return;

    const output = document.getElementById('terminal-output');
    if (!output) return;

    const lines = [];

    if (command === 'clear') {
      if (window.ExilioApp && typeof window.ExilioApp.clearTerminalOutput === 'function') {
        window.ExilioApp.clearTerminalOutput();
      } else {
        output.innerHTML = '';
      }
      renderTerminalPage('help');
      lines.push({ text: 'Terminal limpo. Digite help para ver os comandos.', className: 'console-line status-line' });
      if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function') {
        window.ExilioApp.playSound('confirmation');
      }
      return window.ExilioApp.typeTerminalLines(lines);
    }

    if (command === 'help') {
      renderTerminalPage(command);
      lines.push({ text: 'Comandos disponíveis no console:', className: 'console-line status-line' });
      lines.push(...getCommandTableLines());
      return window.ExilioApp.typeTerminalLines(lines);
    }

    if (command === 'history') {
      renderTerminalPage(command);
      lines.push({ text: 'Histórico da sessão atual:', className: 'console-line status-line' });
      lines.push(...getHistoryLines());
      return window.ExilioApp.typeTerminalLines(lines);
    }

    if (command === 'database') {
      if (window.ExilioApp && window.ExilioApp.database && typeof window.ExilioApp.database.openDatabaseView === 'function') {
        const dbLines = await window.ExilioApp.database.openDatabaseView();
        if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function') {
          window.ExilioApp.playSound('alert');
        }
        return window.ExilioApp.typeTerminalLines(dbLines);
      }

      lines.push({ text: 'Base de dados indisponível no momento.', className: 'console-line alert-message' });
      return window.ExilioApp.typeTerminalLines(lines);
    }

    if (command === 'notifications') {
      if (window.ExilioApp && window.ExilioApp.notifications && typeof window.ExilioApp.notifications.openHistoryView === 'function') {
        if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function') {
          window.ExilioApp.playSound('system-started');
        }
        return window.ExilioApp.notifications.openHistoryView();
      }

      lines.push({ text: 'Histórico de notificações indisponível no momento.', className: 'console-line alert-message' });
      return window.ExilioApp.typeTerminalLines(lines);
    }

    if (command === 'contato') {
      renderTerminalPage(command);

      const selectedNarrative = pickRandomItem(CONTACT_NARRATIVES) || CONTACT_NARRATIVES[0];
      const selectedSignalMessage = pickRandomItem(CONTACT_SIGNAL_MESSAGES) || selectedNarrative.message;
      const useNarrativeMode = Math.random() < 0.72;
      const defaultContactTitle = pickRandomItem([
        'Contato de Rádio',
        'Canal Secundário',
        'Sinal Interceptado',
        'Transmissão Instável'
      ]) || 'Contato de Rádio';

      const notificationTitle = useNarrativeMode
        ? maybeCorruptText(selectedNarrative.title, 0.46, 0.12)
        : defaultContactTitle;
      const notificationMessage = useNarrativeMode
        ? maybeCorruptText(selectedSignalMessage, 0.62, 0.18)
        : selectedSignalMessage;

      if (window.ExilioApp && window.ExilioApp.notifications && typeof window.ExilioApp.notifications.alert === 'function') {
        window.ExilioApp.notifications.alert(notificationMessage, {
          title: notificationTitle,
          duration: 4200
        });
      }

      if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function') {
        window.ExilioApp.playSound('alert');
      }

      lines.push({
        text: maybeCorruptText(`Alerta emitido: ${selectedSignalMessage}`, 0.38, 0.11),
        className: 'console-line alert'
      });

      if (useNarrativeMode) {
        lines.push({
          text: maybeCorruptText(selectedSignalMessage, 0.7, 0.2),
          className: 'console-line status-line'
        });

        const narrativeLines = (selectedNarrative.terminal || []).map((text) => ({
          text: maybeCorruptText(text, 0.68, 0.2),
          className: 'console-line status-line'
        }));
        lines.push(...narrativeLines);
      }

      lines.push({
        text: maybeCorruptText('Use notifications para revisar o histórico de sinais.', 0.32, 0.1),
        className: 'console-line status-line'
      });
      return window.ExilioApp.typeTerminalLines(lines);
    }

    if (command === 'scan') {
      renderTerminalPage(command);
      if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function') {
        window.ExilioApp.playSound('alert');
      }

      await window.ExilioApp.typeTerminalLines([
        { text: 'Iniciando varredura de integridade...', className: 'console-line status-line' },
        { text: 'Canal de telemetria sincronizado.', className: 'console-line status-line' }
      ]);
      await wait(380);
      await window.ExilioApp.typeTerminalLines([
        { text: 'Nó A-01: online', className: 'console-line status-line' },
        { text: 'Nó B-14: latência dentro do esperado', className: 'console-line status-line' }
      ]);
      await wait(380);
      return window.ExilioApp.typeTerminalLines([
        { text: 'Varredura concluída. Nenhuma anomalia crítica encontrada.', className: 'console-line alert' }
      ]);
      return;
    }

    if (SECRET_COMMANDS[command]) {
      const secret = SECRET_COMMANDS[command];
      const secretLines = (secret.lines || []).map((text, index) => ({
        text,
        className: index === 0 ? 'console-line alert' : 'console-line status-line'
      }));

      renderTerminalPage(secret.page && terminalPages[secret.page] ? secret.page : 'help');

      if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function') {
        window.ExilioApp.playSound('alert');
      }

      return window.ExilioApp.typeTerminalLines(secretLines);
    }

    if (command === 'reboot') {
      window.dispatchEvent(new Event('boot:restart'));
      renderTerminalPage(command);
      lines.push({ text: `Página carregada: ${terminalPages[command].title}`, className: 'console-line status-line' });
      return window.ExilioApp.typeTerminalLines(lines);
      return;
    }

    if (command === 'exit') {
      renderTerminalPage(command);
      lines.push({ text: 'Sessão encerrada. O terminal pode ser reaberto quando necessário.', className: 'console-line status-line' });
      return window.ExilioApp.typeTerminalLines(lines);
      return;
    }

    if (command === 'start') {
      window.dispatchEvent(new Event('boot:restart'));
      renderTerminalPage(command);
      lines.push({ text: `Página carregada: ${terminalPages[command].title}`, className: 'console-line status-line' });
      return window.ExilioApp.typeTerminalLines(lines);
      return;
    }

    if (command === 'download') {
      lines.push({ text: 'Senha necessária. Use download <senha> para continuar.', className: 'console-line alert-message' });
      lines.push({ text: 'Acesso negado até que a senha correta seja informada.', className: 'console-line alert-message' });
      renderTerminalPage('help');
      if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function') {
        window.ExilioApp.playSound('error');
      }
      return window.ExilioApp.typeTerminalLines(lines);
      return;
    }

    if (command.startsWith('download ')) {
      const [_, providedPassword] = command.split(/\s+/);
      if (!isValidDownloadPassword(providedPassword)) {
        lines.push({ text: 'Senha incorreta. Acesso ao download bloqueado.', className: 'console-line alert-message' });
        renderTerminalPage('help');
        if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function') {
          window.ExilioApp.playSound('error');
        }
        return window.ExilioApp.typeTerminalLines(lines);
        return;
      }

      renderTerminalPage('download');
      lines.push({ text: 'Senha validada. Acesso ao download autorizado.', className: 'console-line alert' });
      if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function') {
        window.ExilioApp.playSound('alert');
      }
      return window.ExilioApp.typeTerminalLines(lines);
      return;
    }

    if (window.ExilioApp && window.ExilioApp.filesystem && typeof window.ExilioApp.filesystem.executeCommand === 'function') {
      const fsResult = await window.ExilioApp.filesystem.executeCommand(normalizedCommand);
      if (fsResult && fsResult.handled) {
        if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function') {
          window.ExilioApp.playSound('alert');
        }
        return window.ExilioApp.typeTerminalLines(fsResult.lines || []);
      }
    }

    if (!terminalPages[command]) {
      lines.push({ text: `Comando não reconhecido: ${normalizedCommand}`, className: 'console-line alert-message' });
      lines.push({ text: 'Digite help para ver os comandos disponíveis.', className: 'console-line status-line' });
      renderTerminalPage('help');
      if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function') {
        window.ExilioApp.playSound('error');
      }
      return window.ExilioApp.typeTerminalLines(lines);
      return;
    }

    renderTerminalPage(command);
    lines.push({ text: `Página carregada: ${terminalPages[command].title}`, className: 'console-line status-line' });
    if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function') {
      window.ExilioApp.playSound('alert');
    }
    return window.ExilioApp.typeTerminalLines(lines);
  }

  window.ExilioApp = window.ExilioApp || {};
  window.ExilioApp.executeCommand = executeCommand;
  window.ExilioApp.getPromptLabel = () => {
    if (window.ExilioApp && window.ExilioApp.filesystem && typeof window.ExilioApp.filesystem.getPromptLabel === 'function') {
      return window.ExilioApp.filesystem.getPromptLabel() || TERMINAL_PROMPT;
    }

    return TERMINAL_PROMPT;
  };
  window.ExilioApp.getCommandPalette = () => COMMAND_PALETTE.slice();
})();
