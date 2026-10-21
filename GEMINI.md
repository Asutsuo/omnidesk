# OmniDesk — Guia de Arquitetura e Contexto do Projeto

Este arquivo serve como base de contexto permanente para o assistente de IA (Antigravity/Gemini). Ele sintetiza a arquitetura, modelos de dados, fluxo de estado, convenções de código e detalhes dos módulos do OmniDesk.

---

## 1. Visão Geral e Filosofia

O **OmniDesk** é uma aplicação web local-first voltada para estudos de alto rendimento, preparação para concursos públicos e rotina acadêmica/universitária.
* **Privacidade e Dados Locais:** Não depende de servidores externos ou banco de dados na nuvem para funcionar. Todos os dados residem no navegador do usuário via **IndexedDB** (`omnidesk`, versão 7).
* **Foco no Usuário:** Interface minimalista, ágil, inspirada em ferramentas como Obsidian e Notion, com suporte nativo a LaTeX (MathLive), markdown live preview, cronômetros Pomodoro, banco de questões com telemetria e flashcards.
* **Deploy:** Aplicação estática gerada via Vite, pronta para hospedagem no Cloudflare Pages (`npm run deploy` via Wrangler).

---

## 2. Stack Tecnológica

* **Framework:** React 19 (`react`, `react-dom`) com TypeScript estrito (`tsc -b`).
* **Build Tool:** Vite 8 (`@vitejs/plugin-react`).
* **Editor Markdown & Live Preview:** CodeMirror 6 (`@codemirror/view`, `@codemirror/state`, `@codemirror/commands`, `@codemirror/lang-markdown`).
* **Equações Matemáticas:** MathLive (`mathlive`, `convertLatexToMarkup`) com fontes e estilos KaTeX.
* **Ícones:** Lucide React (`lucide-react`).
* **Markdown Secundário:** `react-markdown` + `remark-gfm` (usado em visualizações estáticas como `MarkdownView.tsx`).
* **Deploy/Infra:** Cloudflare Wrangler (`wrangler deploy`).
* **Linting:** ESLint 10 (`typescript-eslint`, `eslint-plugin-react-hooks`).

---

## 3. Arquitetura de Dados e Armazenamento (`src/data.ts`, `src/storage.ts`)

### 3.1 Camada de Persistência (IndexedDB)
O armazenamento principal é gerenciado em `src/storage.ts`:
* **Banco de Dados:** `omnidesk` (em desenvolvimento, usa `omnidesk-demo` se o modo de demonstração estiver ativo via `DEV_DEMO_KEY`).
* **Versão do Banco:** `7`.
* **Stores no IndexedDB:**
  * `meta`: Guarda configurações globais, perfil, tema, streak de acesso e flags gerais (`settings`).
  * `subjects`: Matérias cadastradas.
  * `assignments`: Tarefas e trabalhos com prazos.
  * `flashcards`: Cartões de memorização.
  * `notebooks`: Cadernos por matéria.
  * `notes`: Anotações em Markdown dentro de cadernos.
  * `checklists`, `checklistSections`, `checklistItems`: Listas hierárquicas.
  * `timers`: Estados de cronômetros e sessões.
  * `stats`: Estatísticas diárias de estudo (`DailyStat`).
  * `teams`: Grupos de estudo e reuniões.
  * `resources`: Links e materiais da Biblioteca.
  * `questions`: Banco de questões com alternativas e banca.
  * `simulations`: Configurações de simulados.
  * `simulationAttempts`: Tentativas e histórico detalhado de simulados.
  * `scheduleEntries`: Blocos do cronograma semanal/diário.
  * `quickNotes`, `noteGroups`: Notas rápidas e agrupamentos.
* **Índices Criados:** `subjectId` (na maioria das entidades) e `checklistId` (em seções e itens).

### 3.2 Estrutura do `AppData`
O estado global da aplicação é encapsulado pelo tipo `AppData`:
```ts
type AppData = {
  version: 7;
  onboarded: boolean;
  profile: Profile;
  subjects: Subject[];
  assignments: Assignment[];
  flashcards: Flashcard[];
  notebooks: Notebook[];
  notes: Note[];
  checklists: Checklist[];
  checklistSections: ChecklistSection[];
  checklistItems: ChecklistItem[];
  timers: TimerState[];
  stats: DailyStat[];
  teams: Team[];
  resources: StudyResource[];
  questions: Question[];
  simulations: Simulation[];
  simulationAttempts: SimulationAttempt[];
  scheduleEntries: ScheduleEntry[];
  focusMinutes: number;
  quickNotes: QuickNote[];
  noteGroups: NoteGroup[];
  noteWorkspace: NoteWorkspace;
  noteWidget: NoteWidgetState;
  noteSlideshow: NoteSlideshow;
  subjectView: "grid" | "list";
  homeShortcuts: HomeShortcut[];
  theme: ThemeId;
  accessStreak: AccessStreak;
  lastBackupAt?: string;
  backupReminderDismissedAt?: string;
};
```

### 3.3 Fluxo de Mutação de Estado
No componente raiz (`src/App.tsx`):
* O estado é carregado com `loadAppData()` via IndexedDB na montagem.
* As alterações ocorrem através de uma função `mutate`:
  ```ts
  mutate((current: AppData) => AppData)
  ```
* Cada mutação aciona de forma atômica e assíncrona o `saveAppData()` para persistir no IndexedDB.
* Cópias de segurança (Backup/Restore) exportam e importam JSON validado por `isBackupData` e `normalizeData`.

### 3.4 Limites do Sistema (`LIMITS` em `src/data.ts`)
Constantes de segurança previnem estouro de cota e lentidão no IndexedDB:
* `subjects`: 250 | `flashcards`: 50.000 (10.000 por matéria)
* `questions`: 20.000 (5.000 por matéria) | `simulations`: 500 (200 questões por simulado)
* `simulationAttempts`: 5.000 | `notes`: 1.000 cadernos / 250.000 caracteres por nota
* `checklistItems`: 100.000 | `scheduleEntries`: 500

---

## 4. Módulos e Componentes Principais

### 4.1 Cadernos e Editor Markdown (`src/components/NotebookEditor.tsx`)
Implementa um editor Live Preview estilo Obsidian em cima do **CodeMirror 6**:
* **Decorações Visuais Dinâmicas (`buildLiveDecorations`):**
  * Títulos (`#` a `######`): Ocultam os marcadores `#` quando a linha não está em foco, exibindo tipografia serifada Fraunces (`.cm-heading`).
  * Listas não numeradas (`- `, `* `, `+ `): O traço cru é substituído por um ponto estético (`BulletWidget`, `<span class="cm-list-bullet">•</span>`) fora do foco.
  * Caixas de seleção (`- [ ]`, `- [x]`): Ocultam o prefixo `- ` e renderizam `CheckboxWidget` interativo com dispatch de alteração instantânea no documento.
  * Citações (`> `): Ocultam o marcador cru fora do foco e aplicam `.cm-blockquote-line` com borda lateral colorida.
  * Linhas divisórias (`---`, `***`): Renderizam `HrWidget` (`<hr class="cm-hr">`).
  * Fórmulas Matemáticas: Detecção de `$inline$` (com proteção contra valores monetários tipo `$10 e $20`) e `$$bloco$$` (incluindo suporte a blocos multi-linhas). Ambas utilizam `MathWidget` integrado ao MathLive para gerar marcação visual limpa.
  * Formatações inline: Negrito (`**`, `__`), itálico (`*`, `_`), tachado (`~~`) e código (`` ` ``) ocultam os delimitadores quando o cursor não está sobre a palavra.
* **Foco Inteligente:** A variável `hasFocus` garante que ao abrir qualquer nota ou alternar entre cadernos, nenhum símbolo cru (`#`) apareça vazado.
* **Teclas de Atalho Integradas:**
  * `markdownKeymap`: Continuação automática de listas ao teclar `Enter` e remoção automática de marcador ao teclar `Enter` em linha vazia.
  * `indentWithTab`: Indentação/desindentação de tópicos e sub-listas com `Tab` e `Shift+Tab`.
  * `Mod-b` (Ctrl+B/Cmd+B) para negrito e `Mod-i` (Ctrl+I/Cmd+I) para itálico via helper `toggleWrap`.
* **Inserção de Fórmulas:** Integrado com `src/components/FormulaComposer.tsx` (teclado virtual matemático MathLive).

### 4.2 Questões e Simulados (`src/pages/Questoes.tsx`, `src/pages/SubjectWorkspace.tsx`)
* **Banco de Questões:** Enunciado, alternativas (A a H), gabarito (`correctAlternativeId`), explicação detalhada, banca examinadora (`institution`), ano, fonte e tags/categorias.
* **Seleção em Lote:** Permite selecionar questões para criar simulados personalizados ou excluir/exportar em lote.
* **Modos de Simulado (`SimulationMode`):**
  * `fixacao`: Focado em aprendizado. Permite encerramento antecipado quando a nota de corte é atingida por proficiência (`mastery_cutoff`), calculando o aproveitamento com base nas questões efetivamente respondidas.
  * `cronometrado`: Simulação rígida de prova de concurso com contagem regressiva total e sem triggers antecipados de encerramento por acerto.
* **Telemetria de Desempenho:**
  * `SimulationTimelineChart.tsx`: Gráfico SVG que traça o tempo gasto em cada questão versus o tempo médio da tentativa.
  * `SimulationDonutChart.tsx`: Gráfico em rosca de acertos, erros e questões em branco.

### 4.3 Matérias e Workspace (`src/pages/SubjectWorkspace.tsx`, `src/pages/Subjects.tsx`)
A página central de cada disciplina oferece navegação em abas:
1. `overview`: Resumo da matéria, estatísticas rápidas e atalhos.
2. `assignments`: Trabalhos e entregas vinculadas.
3. `checklists`: Listas de tópicos da matéria.
4. `timer`: Cronômetro focado na disciplina com registro automático de horas.
5. `notebooks`: Cadernos de anotações com o `NotebookEditor`. Extrator automático de links (`extractUrls`) para salvar na Biblioteca com um clique.
6. `library`: Materiais e links específicos da matéria.
7. `flashcards`: Baralhos da matéria.
8. `questions`: Questões filtradas pela matéria em modo embarcado (`embedded`).

### 4.4 Flashcards (`src/pages/Flashcards.tsx`)
* Sistema de repetição espaçada simples com virada de cartão, marcação de domínio (`mastered`), baralhos (`decks`) e importação em massa via texto (`flashcardParser.ts`).

### 4.5 Checklists (`src/pages/Checklists.tsx`)
* Listas divididas em seções (`ChecklistSection`) e itens ordenáveis (`ChecklistItem`).
* Barra de progresso percentual dinâmica e importador rápido de texto com suporte a marcadores `□` e `☑`.

### 4.6 Cronograma (`src/pages/Cronograma.tsx`)
* Grade semanal (Segunda a Domingo) com blocos de tempo (`startTime` a `endTime`), categorias com cores semânticas (`study`, `review`, `assignment`, `break`, `personal`, `other`) e vínculo com matérias/trabalhos.

### 4.7 Biblioteca de Recursos (`src/pages/Biblioteca.tsx`)
* Gerenciador de links, PDFs, artigos, pastas e vídeos. Permite categorização em coleções e tags.

### 4.8 Notas Rápidas e Widgets Flutuantes (`src/pages/Anotacoes.tsx`)
* Sistema de post-its rápidos (`QuickNote`) com ordenação manual, fixação, cores e modo apresentação (`slideshow`).
* Widgets flutuantes arrastáveis na tela: `FloatingNote.tsx` e `FloatingTimer.tsx`.

### 4.9 Cronômetro & Pomodoro (`src/pages/Timer.tsx`, `src/components/TimerPanel.tsx`)
* Suporta modo Pomodoro (foco + pausa com contagem de ciclos) e Cronômetro progressivo.
* Vinculação de escopo: `global` ou associado a uma matéria (`subject`).
* Alimenta a store `stats` para geração de gráficos no módulo de Estatísticas.

---

## 5. Design System e Estilos (`src/App.css`)

* **Variáveis Semânticas de Cor:**
  * `--default-color`: Cor principal da ação / cabeçalho.
  * `--detail-color`: Cor de destaque, links, botões primários e marcadores de foco.
  * `--surface`: Cor de fundo dos cards e modais.
  * `--surface-muted`: Fundo secundário para painéis laterais e trilhas.
  * `--text`: Cor do texto principal.
  * `--item-color`: Cor do texto secundário, legendas e metadados.
  * `--border-color`: Borda suave entre elementos.
  * `--on-primary`: Cor do texto sobre botões ativos.
* **Temas Suportados (`ThemeId`):**
  * `omnidesk` (Padrão), `sage`, `aurora`, `dune`, `atlantic`, `plum`, `eclipse` (Dark).
  * A troca de tema aplica a classe correspondente no container principal (`#root` ou `body`), atualizando as variáveis CSS instantaneamente.
* **Regra Fundamental de Layout CSS (Grid & Flex):**
  * Em containers de duas colunas (como `.notebook-workspace`), **sempre usar `minmax(0, 1fr)`** em vez de `1fr` puro. Isso impede que elementos de largura intrínseca larga (CodeMirror, tabelas ou fórmulas MathLive) expandam o grid além da largura da viewport e quebrem a rolagem horizontal ou quebra de linha.
  * Elementos internos devem sempre conter `min-width: 0; max-width: 100%; box-sizing: border-box;`.

---

## 6. Diretrizes para o Desenvolvimento e Manutenção

1. **Integridade de Tipagem:** Sempre executar `npm run build` (`tsc -b && vite build`) e `npm run lint` após alterações. Não introduzir tipos `any` soltos nem ignorar warnings do TypeScript.
2. **Preservação de Dados do Usuário:** Nunca alterar o schema do IndexedDB de forma destrutiva. Ao introduzir novos campos no `AppData`, adicionar o valor padrão correspondente no `emptyData` e no `normalizeData` em `src/data.ts`.
3. **Padrão de Mutação Imutável:** Manter todas as atualizações de estado via `mutate((current) => ({ ...current, ... }))`.
4. **Respeito aos Componentes Existentes:** O OmniDesk possui alto refinamento estético. Modificações em botões, toolbars e editores devem respeitar o espaçamento, transições e variáveis CSS globais de `App.css`.
5. **Comentários e Documentação:** Preservar comentários e docstrings existentes ao editar arquivos.

