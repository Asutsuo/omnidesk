Claro. Fiz a edição como um README inteiro, preservando a parte técnica boa, mas removendo as repetições sobre “usar online”, condensando algumas explicações e deixando a progressão mais natural: **o que é → demonstração → recursos → funcionamento → privacidade → desenvolvimento**. Mantive também as regras global/matéria e timers porque agora elas servem como documentação de domínio, não apenas divulgação. 

<div align="center">
  <img src="public/omnidesk.svg" width="76" alt="Símbolo do OmniDesk" />

# OmniDesk

**Seu espaço de estudos, organizado do seu jeito.**

Uma plataforma acadêmica local-first para planejar conteúdos, manter o foco e acompanhar sua evolução — sem conta, assinatura ou servidor.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react\&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript\&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite\&logoColor=white)](https://vite.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-ec996a.svg)](LICENSE)

### [Abrir o OmniDesk](https://omnidesk.asutsuo.workers.dev)

[Conhecer os recursos](#principais-recursos) · [Privacidade e armazenamento](#privacidade-e-armazenamento)

</div>

---

<div align="center">
  <img src="docs/assets/platform-tour.gif" width="900" alt="Demonstração das principais áreas do OmniDesk" />
</div>

## Sobre o projeto

O OmniDesk reúne matérias, trabalhos, checklists, sessões de foco, flashcards, cadernos e estatísticas em uma interface limpa e responsiva.

A organização é baseada em **matérias**, que funcionam como espaços independentes de estudo. Ao mesmo tempo, as ferramentas também possuem visões globais, permitindo organizar conteúdos que pertencem a uma disciplina específica ou objetivos mais amplos sem impor uma única forma de estudo.

Os dados permanecem no próprio navegador por padrão. A aplicação funciona sem autenticação, pode continuar disponível offline depois do primeiro acesso e oferece backup completo em JSON para transferência ou recuperação.

## Principais recursos

| Área               | O que oferece                                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **Matérias**       | Espaços independentes com cor, trabalhos, checklists, timer, cadernos e flashcards próprios.                               |
| **Trabalhos**      | Projetos gerais ou vinculados a uma matéria, com descrição, prazo, prioridade, edição e conclusão.                         |
| **Checklists**     | Listas gerais ou por matéria, seções reordenáveis, movimentação de itens, inclusão em massa e acompanhamento de progresso. |
| **Foco**           | Pomodoro configurável e cronômetro, tanto no contexto global quanto em cada matéria.                                       |
| **Cadernos**       | Cadernos por matéria, múltiplas anotações, salvamento automático, renomeação e exclusão.                                   |
| **Flashcards**     | Cartões organizados por blocos, revisão interativa e controle dos cartões dominados.                                       |
| **Estatísticas**   | Histórico diário, evolução semanal, distribuição por contexto, metas e sessões de estudo.                                  |
| **Personalização** | Atalhos configuráveis e cinco temas pastéis — três claros e dois escuros.                                                  |
| **Dados**          | IndexedDB, funcionamento offline e importação/exportação de backups locais.                                                |

## Visão da interface

### Checklists estruturados

Crie seções, reorganize grupos, mova itens e transforme várias linhas de texto em uma checklist estruturada de uma só vez.

<div align="center">
  <img src="docs/assets/checklists.png" width="1000" alt="Checklist estruturada no OmniDesk" />
</div>

<table>
  <tr>
    <td width="50%" align="center"><strong>Timer de foco</strong></td>
    <td width="50%" align="center"><strong>Equipes de estudo</strong></td>
  </tr>
  <tr>
    <td><img src="docs/assets/timer.png" alt="Pomodoro do OmniDesk" /></td>
    <td><img src="docs/assets/teams.png" alt="Equipes de estudo no OmniDesk" /></td>
  </tr>
</table>

<details>
  <summary><strong>Ver painel completo de estatísticas</strong></summary>
  <br />
  <div align="center">
    <img src="docs/assets/statistics.png" width="780" alt="Painel completo de estatísticas do OmniDesk" />
  </div>
</details>

## Uma plataforma, cinco atmosferas

Os temas alteram a atmosfera visual sem abandonar a identidade do OmniDesk.

Estão disponíveis:

* **OmniDesk Clássico**
* **Sálvia Serena**
* **Aurora Pastel**
* **Noite Atlântica**
* **Ameixa Noturna**

<div align="center">
  <img src="docs/assets/themes-tour.gif" width="900" alt="Alternância entre os cinco temas visuais do OmniDesk" />
</div>

## Organização global e por matéria

As ferramentas da barra lateral funcionam como visões gerais e não dependem da existência de uma matéria.

Trabalhos, checklists e outros conteúdos compatíveis podem ser criados como **Geral** ou associados opcionalmente a uma matéria.

Quando existe um vínculo, o mesmo conteúdo fica disponível nos dois contextos:

```text
Visão global da ferramenta
└── reúne conteúdos gerais e de todas as matérias

Espaço de uma matéria
└── exibe apenas o conteúdo vinculado àquela matéria
```

Isso permite, por exemplo, registrar um projeto amplo como **“Concluir primeira volta do edital”** sem inventar uma matéria artificial, enquanto atividades específicas continuam organizadas junto às respectivas disciplinas.

Em termos de organização:

```text
Global = todos os conteúdos
Matéria = subconjunto associado àquela matéria
Geral = conteúdo sem associação com matéria
```

## Sistema de timers

O OmniDesk possui um timer global e permite que cada matéria preserve seu próprio estado de timer.

Existem dois modos:

* **Pomodoro**, configurado inicialmente com 25 minutos de foco e 5 minutos de intervalo;
* **Cronômetro progressivo**, limitado a 12 horas por sessão.

Vários timers podem permanecer salvos e pausados, mas **somente um pode executar por vez**, inclusive entre diferentes abas do navegador.

O sistema segue algumas regras para preservar a consistência das sessões:

* O timer global representa estudos sem contexto específico.
* Cada matéria pode preservar seu último Pomodoro ou cronômetro pausado.
* Iniciar outro timer pausa automaticamente o que estiver em execução.
* Trocar de matéria, ocultar ou fechar a aba tenta pausar e registrar a sessão imediatamente.
* Checkpoints periódicos reduzem a perda de progresso em encerramentos inesperados.
* O cálculo utiliza timestamps em vez de depender apenas dos intervalos visuais do navegador.
* Timers carregados ou restaurados de backups são normalizados para o estado pausado.

## Checklists e inclusão em massa

Checklists podem ser gerais ou vinculadas a uma matéria e são organizadas em **seções e itens**.

Além da criação manual, o OmniDesk permite inserir vários conteúdos de uma vez. Linhas em **CAIXA ALTA** são interpretadas como novas seções e as linhas seguintes como itens.

Por exemplo:

```text
RECURSOS HUMANOS
Recrutamento
Seleção
Treinamento

MANUTENÇÃO
Manutenção preventiva
Manutenção corretiva
Manutenção preditiva
```

é convertido automaticamente em duas seções com seus respectivos itens.

Também são reconhecidos formatos comuns de checkbox, como `□`, `☐` e `- [ ]`.

Itens podem ser concluídos, editados, reordenados e movidos entre seções, enquanto o progresso total da checklist é atualizado automaticamente.

## Estatísticas

O OmniDesk registra o progresso de estudo ao longo do tempo e diferencia, quando aplicável, atividades gerais das vinculadas a matérias.

O painel acompanha informações como:

* Tempo total de foco;
* Ciclos Pomodoro;
* Atividades concluídas;
* Flashcards dominados;
* Meta semanal;
* Constância nos últimos 14 dias;
* Evolução ao longo de seis semanas;
* Distribuição do estudo por matéria;
* Conteúdos e sessões gerais;
* Dias com e sem registro de estudo.

O tempo é contabilizado progressivamente para evitar que períodos já registrados sejam somados novamente quando uma sessão é pausada e retomada.

## Privacidade e armazenamento

O OmniDesk é uma aplicação **local-first**. Não existe conta remota, rastreamento do conteúdo ou sincronização automática com um servidor.

Os dados são armazenados no **IndexedDB** do navegador e separados em coleções para matérias, trabalhos, checklists, cadernos, anotações, flashcards, timers, estatísticas e outros recursos.

A aplicação também solicita armazenamento persistente ao navegador quando essa funcionalidade está disponível, reduzindo a possibilidade de remoção automática dos dados.

> [!IMPORTANT]
> Os dados pertencem ao navegador e ao dispositivo utilizados. Limpar os dados do site ou utilizar uma janela privativa pode removê-los. Para manter uma cópia externa ou transferir o ambiente entre dispositivos, exporte um backup pela página de perfil.

### Backup e restauração

O ambiente completo pode ser exportado em um arquivo JSON contendo:

* Identificação da aplicação;
* Versão do esquema;
* Data da exportação;
* Perfil e configurações;
* Matérias;
* Trabalhos;
* Checklists;
* Cadernos e anotações;
* Flashcards;
* Timers;
* Estatísticas e demais dados relacionados.

Na restauração, o OmniDesk valida e normaliza o conteúdo antes de substituir o ambiente local.

Isso permite guardar o backup em qualquer local escolhido pelo usuário e posteriormente restaurá-lo em outro navegador ou dispositivo sem depender de uma conta online.

## Funcionamento offline

O build de produção registra um Service Worker responsável por manter os recursos necessários da aplicação disponíveis após o primeiro carregamento bem-sucedido.

Como a persistência também é local, o OmniDesk pode continuar sendo utilizado sem conexão com a internet depois que seus arquivos estiverem armazenados pelo navegador.

## Executando localmente

Para estudar, modificar ou contribuir com o código, execute o OmniDesk localmente.

### Requisitos

* Node.js 20 ou superior
* npm

### Instalação

```bash
git clone https://github.com/Asutsuo/omnidesk.git
cd omnidesk
npm install
npm run dev
```

Abra o endereço informado pelo Vite, normalmente:

```text
http://localhost:5173
```

### Scripts

| Comando           | Finalidade                                       |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | Inicia o ambiente de desenvolvimento.            |
| `npm run lint`    | Executa as verificações do ESLint.               |
| `npm run build`   | Valida o TypeScript e gera o bundle de produção. |
| `npm run preview` | Serve localmente o bundle de produção.           |
| `npm run deploy`  | Compila e publica usando o Wrangler.             |

## Ferramentas de demonstração

O ambiente iniciado com `npm run dev` inclui um gerador exclusivo para desenvolvimento, QA, screenshots e GIFs.

Ele permite carregar cenários coerentes e reproduzíveis:

* **Ambiente vazio**
* **Uso leve**
* **Concurso em andamento**
* **Faculdade carregada**
* **Stress test**

Cada cenário pode ser personalizado através de parâmetros como:

* Quantidade de matérias;
* Trabalhos;
* Checklists;
* Flashcards;
* Cadernos;
* Período histórico;
* Percentual de conclusão;
* Intensidade de atividade;
* Deslocamento das datas.

Uma **semente** permite reproduzir posteriormente exatamente a mesma configuração e os mesmos dados, facilitando testes de regressão e comparações visuais.

O gerador também possui:

* Prévia da quantidade de dados que será criada;
* Geração substituindo o cenário atual;
* Combinação com cenários existentes;
* Exportação da prévia;
* Limpeza do ambiente de demonstração;
* Modo apresentação para screenshots e gravações.

Use `Ctrl + Shift + D` para abrir o painel ou encerrar o modo apresentação.

### Isolamento dos dados

As ferramentas de desenvolvimento utilizam um banco IndexedDB separado:

```text
omnidesk-demo
```

O perfil normal e seus dados permanecem intactos.

Essas ferramentas existem apenas no ambiente de desenvolvimento e são eliminadas do bundle de produção.

## Deploy no Cloudflare

O projeto utiliza **Cloudflare Workers com Static Assets** e contém o fallback necessário para funcionar como uma SPA em `wrangler.jsonc`.

Para gerar o build e realizar o deploy:

```bash
npm run deploy
```

Ao conectar o repositório pelo painel do Cloudflare, utilize:

* **Comando de build:** `npm run build`
* **Comando de implantação:** `npx wrangler deploy`
* **Caminho raiz:** vazio, salvo quando o repositório estiver dentro de outra pasta

Nenhum banco remoto precisa ser provisionado para o deploy, já que a persistência dos ambientes de estudo ocorre localmente no navegador de cada usuário.

## Estrutura do projeto

```text
src/
├── components/     # navegação e componentes reutilizáveis
├── dev/            # ferramentas e cenários exclusivos de desenvolvimento
├── pages/          # páginas e ferramentas da plataforma
├── App.tsx         # estado, navegação e regras compartilhadas
├── data.ts         # entidades, normalização e limites do domínio
├── storage.ts      # IndexedDB, migração e backups
├── timerUtils.ts   # cálculos e transições seguras dos timers
└── index.css       # temas e variáveis globais
```

## Tecnologias

* [React 19](https://react.dev/)
* [TypeScript](https://www.typescriptlang.org/)
* [Vite](https://vite.dev/)
* [Lucide React](https://lucide.dev/)
* [IndexedDB](https://developer.mozilla.org/docs/Web/API/IndexedDB_API)
* [Cloudflare Workers](https://developers.cloudflare.com/workers/)
* CSS responsivo sem biblioteca visual

## Limitações atuais

A arquitetura atual prioriza simplicidade, privacidade e independência de infraestrutura remota. Como consequência:

* Não há autenticação ou sincronização automática entre dispositivos;
* O espaço disponível depende da política de armazenamento do navegador;
* Backups precisam ser exportados manualmente para transferência ou recuperação externa;
* A colaboração em equipes é organizacional e local, sem edição compartilhada em tempo real.

## Contribuindo

Issues e pull requests são bem-vindos.

Antes de enviar uma alteração, execute:

```bash
npm run lint
npm run build
```

Descreva objetivamente o problema resolvido e as decisões adotadas. Para alterações visuais, inclua capturas comparativas quando possível.

## Licença

Distribuído sob a [licença MIT](LICENSE).

## Autor

Desenvolvido por [Asutsuo](https://github.com/Asutsuo).
