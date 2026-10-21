---
name: omnidesk-expert
description: >-
  Especialista na arquitetura, modelos de dados, interface e convenções do OmniDesk.
  Use esta skill para qualquer implementação, refatoração, correção de bugs ou adição de recursos no OmniDesk,
  garantindo a integridade do IndexedDB v7, CodeMirror 6, MathLive, CSS Grid responsivo e TypeScript estrito.
---

# OmniDesk Expert — Diretrizes de Engenharia e Arquitetura

Esta skill estabelece os padrões e regras obrigatórias para o desenvolvimento contínuo do **OmniDesk**, assegurando que toda modificação respeite a arquitetura local-first, a estabilidade dos dados do usuário e o refinamento estético da interface.

---

## 1. Persistência de Dados e Imutabilidade

### 1.1 IndexedDB v7 e Integridade do Schema
* O OmniDesk opera de forma **100% local-first** no navegador através do IndexedDB (`omnidesk`, versão `7`).
* Em ambiente de desenvolvimento, se `DEV_DEMO_KEY` estiver ativo, o banco utilizado é o `omnidesk-demo` (`src/storage.ts`).
* **Regra Inviolável:** Nunca realizar alterações destrutivas nas stores existentes (`meta`, `subjects`, `assignments`, `flashcards`, `notebooks`, `notes`, `checklists`, `checklistSections`, `checklistItems`, `timers`, `stats`, `teams`, `resources`, `questions`, `simulations`, `simulationAttempts`, `scheduleEntries`, `quickNotes`, `noteGroups`).
* Ao adicionar novos campos ao tipo `AppData`:
  1. Atualize o tipo `AppData` em `src/data.ts`.
  2. Forneça o valor padrão correspondente em `emptyData` (`src/data.ts`).
  3. Inclua o tratamento defensivo correspondente em `normalizeData` (`src/data.ts`) para garantir que dados de backups anteriores continuem compatíveis.

### 1.2 Padrão de Mutação Imutável
* Todas as alterações de estado devem ocorrer via despachos imutáveis através da função `mutate`:
  ```ts
  mutate((current: AppData) => ({
    ...current,
    entidade: current.entidade.map((item) =>
      item.id === id ? { ...item, ...changes } : item,
    ),
  }));
  ```
* Cada chamada a `mutate` aciona a persistência assíncrona atômica no IndexedDB através de `saveAppData()`.
* **Proibido:** Modificar arrays ou propriedades de objetos diretamente por mutação in-place (`current.items.push()`, `item.prop = valor`).

### 1.3 Limites do Sistema (`LIMITS`)
* Respeite sempre as constantes de cota definidas em `LIMITS` (`src/data.ts`) para evitar estouro de memória no navegador (ex.: `flashcardsPerSubject`, `questionsPerSubject`, `noteContent`, `simulations`, `checklistItems`).

---

## 2. Editor Markdown & Live Preview (`src/components/NotebookEditor.tsx`)

### 2.1 CodeMirror 6 e MathLive
* O editor de cadernos adota o padrão **Live Preview** (estilo Obsidian) implementado via extensão `livePreviewPlugin` e `buildLiveDecorations`.
* **Foco Inteligente (`hasFocus`):**
  * Toda decoração que oculta marcadores de sintaxe (`#`, `**`, `*`, `~~`, `>`) deve verificar `view.hasFocus`.
  * Se o editor estiver sem foco (`!view.hasFocus`), a sintaxe markdown crua **nunca** deve ser exibida. O documento deve renderizar limpo.
  * O plugin deve escutar `update.docChanged`, `update.selectionSet`, `update.viewportChanged`, `update.focusChanged` e `update.geometryChanged`.

### 2.2 Decorações Dinâmicas Suportadas
1. **Títulos (`#` a `######`):** Marcadores `#` ocultos fora do foco, linha decorada com `cm-heading cm-heading-${level}` (fonte serifada Fraunces).
2. **Listas Não Numeradas (`- `, `* `, `+ `):** Marcador cru substituído pelo widget visual `BulletWidget` (`<span class="cm-list-bullet">•</span>`) fora do foco.
3. **Caixas de Tarefas (`- [ ]`, `- [x]`):** Marcador `- ` oculto fora do foco e `[ ]`/`[x]` substituído por `CheckboxWidget` com dispatch de clique interativo.
4. **Citações (`> `):** Marcador `> ` oculto fora do foco e linha decorada com `cm-blockquote-line` (borda lateral colorida).
5. **Divisores Horizontais (`---`, `***`):** Linha substituída por `HrWidget` (`<hr class="cm-hr">`) fora do foco.
6. **Expressões Matemáticas:**
   * Inline: `$latex$` (com proteção contra valores monetários tipo `$10 e $20`).
   * Bloco multi-linhas: `$$latex$$`.
   * Ambos renderizados via `MathWidget` integrado ao MathLive (`convertLatexToMarkup`).

### 2.3 Teclas de Atalho e Produtividade
* `markdownKeymap`: Mantém a continuação automática de listas ao teclar `Enter` e remove o marcador ao dar `Enter` em linha vazia.
* `indentWithTab`: Permite indentação e desindentação de tópicos e listas com `Tab` e `Shift+Tab`.
* `Mod-b` (Ctrl+B/Cmd+B) para negrito e `Mod-i` (Ctrl+I/Cmd+I) para itálico via helper `toggleWrap`.

---

## 3. Diretrizes de Layout e CSS (`src/App.css`)

### 3.1 Prevenção de Estouro de Grid (`minmax(0, 1fr)`)
* **Regra Fundamental de Layout:** Em containers de duas colunas (como `.notebook-workspace`), **nunca use `1fr` puro**. Use sempre:
  ```css
  grid-template-columns: 250px minmax(0, 1fr);
  ```
* O valor `1fr` padrão em CSS Grid assume `minmax(auto, 1fr)`, o que faz o container estourar a largura da tela quando elementos internos possuem largura intrínseca larga (CodeMirror, tabelas ou fórmulas MathLive), quebrando a quebra de linha e a rolagem horizontal.
* Aplique sempre limites estritos nos containers internos:
  ```css
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  ```

### 3.2 Rolagem no CodeMirror
* O container `.cm-scroller` deve conter `overflow-x: auto !important; max-width: 100% !important;`.
* O conteúdo `.cm-content` e `.cm-line` deve usar `overflow-wrap: anywhere !important; word-break: break-word !important; max-width: 100% !important;`.

### 3.3 Variáveis Semânticas e Temas
* Respeite sempre as variáveis globais do Design System:
  * `--default-color`: Cor primária e títulos.
  * `--detail-color`: Destaques, botões ativos e marcadores.
  * `--surface`: Fundo dos cards e modais.
  * `--surface-muted`: Fundo secundário / laterais.
  * `--text`: Texto principal.
  * `--item-color`: Legendas e metadados.
  * `--border-color`: Bordas suaves.
* Os 7 temas (`omnidesk`, `sage`, `aurora`, `dune`, `atlantic`, `plum`, `eclipse`) aplicam as variáveis na raiz da aplicação. Não utilize cores fixas quando houver variável semântica disponível.

---

## 4. Tipagem TypeScript Estrita e Qualidade de Código

### 4.1 Tolerância Zero a Tipos Imprecisos
* O projeto opera com TypeScript estrito (`tsc -b`).
* **Proibido usar `any` solto.** Crie ou reutilize os tipos definidos em `src/data.ts`.
* Utilize asserções de tipo (`as`) e non-null assertions (`!`) apenas quando a lógica de validação anterior garantir estritamente a existência do dado.

### 4.2 Verificação Obrigatória pós-alteração
* Sempre execute os comandos de verificação após qualquer alteração:
  ```bash
  npm run lint
  npm run build
  ```
* Ambos os comandos devem passar limpos, sem erros nem warnings de ESLint ou compilação.
* Preserve todos os comentários e documentações existentes não relacionados à alteração atual.

