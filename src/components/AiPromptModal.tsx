import { useState } from "react";
import {
  BookOpen,
  Check,
  CheckSquare2,
  CircleHelp,
  Copy,
  FileText,
  ListChecks,
  Sparkles,
  X,
} from "lucide-react";

export type AiPromptType = "questions" | "flashcards" | "checklists";

type Props = {
  initialType?: AiPromptType;
  subjectTitle?: string;
  onClose: () => void;
};

export default function AiPromptModal({
  initialType = "questions",
  subjectTitle,
  onClose,
}: Props) {
  const [type, setType] = useState<AiPromptType>(initialType);
  const [subject, setSubject] = useState(subjectTitle || "");
  const [moduleTopic, setModuleTopic] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [quantity, setQuantity] = useState("5");
  const [attachNotes, setAttachNotes] = useState(true);
  const [checklistMode, setChecklistMode] = useState<"edital" | "cycle">(
    "edital",
  );
  const [editalTopics, setEditalTopics] = useState("");
  const [copied, setCopied] = useState(false);

  const cleanSubject =
    subject.trim() || (subjectTitle ? subjectTitle : "Geral");
  const cleanModule = moduleTopic.trim() || "Tópicos Fundamentais";
  const cleanCollection =
    collectionName.trim() || moduleTopic.trim() || "Simulado de Estudo";
  const numQty = Math.max(1, parseInt(quantity, 10) || 5);

  const attachmentInstruction = attachNotes
    ? `\nOBSERVAÇÃO IMPORTANTE:\nVou colar minhas anotações pessoais e/ou prints de questões de simulado que errei logo abaixo deste prompt. Use esses materiais como referência prioritária para direcionar o conteúdo e reforçar as minhas maiores dificuldades.\n`
    : "";

  const prompts: Record<AiPromptType, { title: string; prompt: string }> = {
    questions: {
      title: "Questões para Simulado",
      prompt: `Atue como um examinador e professor especialista. Crie exatamente ${numQty} questão(ões) de múltipla escolha para o módulo/tópico "${cleanModule}" da matéria "${cleanSubject}".${attachmentInstruction}
REGRAS CRÍTICAS DE FORMATAÇÃO DO OMNIDESK:
1. Toda a sua resposta DEVE ser entregue EXCLUSIVAMENTE dentro de um único bloco de código com a tag "text" (\`\`\`text ... \`\`\`).
2. NÃO use formatação markdown fora do bloco de código. NÃO escreva introduções, explicações ou saudações.
3. Cada questão DEVE ser obrigatoriamente separada da próxima por uma linha isolada contendo apenas três hífens: "---".
4. NÃO coloque as letras das alternativas em negrito (use apenas "A)", "B)", etc.).
5. O gabarito deve ser indicado na linha logo após as alternativas no formato "= LETRA" (ex: = B).
6. Abaixo do gabarito, adicione um comentário explicativo começando com "> ".

Exemplo exato do formato esperado:

\`\`\`text
[COLEÇÃO: ${cleanCollection}]
[MATÉRIA: ${cleanSubject}]
[CATEGORIA: ${cleanModule}]

1. Enunciado claro, completo e contextualizado da primeira questão?
A) Primeira alternativa
B) Segunda alternativa
C) Terceira alternativa
D) Quarta alternativa
E) Quinta alternativa
= B
> Comentário detalhado justificando a alternativa correta e pontuando os erros das demais alternativas.
---
2. Enunciado da segunda questão...
A) Primeira alternativa
B) Segunda alternativa
C) Terceira alternativa
D) Quarta alternativa
E) Quinta alternativa
= A
> Justificativa do gabarito.
---
\`\`\``,
    },
    flashcards: {
      title: "Flashcards de Revisão",
      prompt: `Atue como um especialista em memorização ativa e repetição espaçada. Crie exatamente ${numQty} flashcard(s) focado(s) nos pontos mais críticos do módulo/tópico "${cleanModule}" da matéria "${cleanSubject}".${attachmentInstruction}
REGRAS CRÍTICAS DE FORMATAÇÃO DO OMNIDESK:
1. Toda a sua resposta DEVE ser entregue EXCLUSIVAMENTE dentro de um único bloco de código com a tag "text" (\`\`\`text ... \`\`\`).
2. NÃO escreva saudações ou textos fora do bloco de código.
3. Separe OBRIGATORIAMENTE cada flashcard por uma linha isolada contendo apenas três hífens: "---".
4. Siga estritamente o formato "Pergunta ou Conceito :: Resposta objetiva e completa".

Exemplo exato do formato esperado:

\`\`\`text
[BLOCO: ${cleanModule}]
[MATÉRIA: ${cleanSubject}]

Qual é a definição central deste conceito? :: Explicação clara, direta e objetiva para fixação.
---
Qual a diferença fundamental entre X e Y? :: Comparação concisa destacando o ponto de divergência.
---
Qual o requisito essencial para a ocorrência desta regra? :: Lista sucinta dos requisitos necessários.
---
\`\`\``,
    },
    checklists: {
      title: "Checklist de Conteúdo / Edital",
      prompt:
        checklistMode === "edital"
          ? editalTopics.trim()
            ? `Atue como um mentor e estrategista de concursos públicos e vestibulares.
Crie um checklist estruturado no formato OmniDesk para a matéria "${cleanSubject}" (foco/edital: "${cleanModule}").
O aluno forneceu a seguinte lista de tópicos/módulos do edital a serem dominados:

${editalTopics.trim()}

DIRETRIZES ESSENCIAIS:
1. CADA item do checklist DEVE corresponder a um tópico/módulo fornecido, iniciando com "- [ ] " seguido do nome claro do tema a ser dominado conforme o aluno estuda.
2. Agrupe os tópicos em seções temáticas coerentes com a tag "[SEÇÃO: Nome da Seção]" (por exemplo: "[SEÇÃO: 1. Tópicos Iniciais]", "[SEÇÃO: 2. Tópicos Intermediários]", "[SEÇÃO: 3. Tópicos Avançados]").

REGRAS CRÍTICAS DE FORMATAÇÃO DO OMNIDESK:
1. Toda a sua resposta DEVE ser entregue EXCLUSIVAMENTE dentro de um único bloco de código com a tag "text" (\`\`\`text ... \`\`\`).
2. NÃO escreva textos ou explicações fora do bloco de código.
3. Indique cada seção com "[SEÇÃO: Nome da Seção]".
4. Cada item ou tarefa deve começar com "- [ ] ".

Exemplo exato do formato esperado:

\`\`\`text
[CHECKLIST: ${cleanModule}]
[MATÉRIA: ${cleanSubject}]

[SEÇÃO: 1. Módulos Fundamentais]
- [ ] Primeiro tópico do edital
- [ ] Segundo tópico do edital

[SEÇÃO: 2. Módulos Avançados]
- [ ] Terceiro tópico do edital
\`\`\``
            : `Atue como um mentor e estrategista de concursos públicos e vestibulares.
Crie um checklist de estudo para cobrir integralmente os tópicos/módulos do edital de "${cleanModule}" da matéria "${cleanSubject}".

DIRETRIZ CENTRAL DO CHECKLIST:
Cada item do checklist DEVE corresponder diretamente a um TEMA / MÓDULO / PONTO DO EDITAL que o aluno precisa estudar e dominar para o concurso (por exemplo: "- [ ] Teoria dos Conjuntos e Diagramas", "- [ ] Operações de União e Interseção", "- [ ] Princípio da Inclusão-Exclusão").
NÃO crie tarefas genéricas como "ler apostila" ou "fazer pausa". O checklist deve ser um mapa estruturado dos conteúdos programáticos do edital, agrupados em seções lógicas com "[SEÇÃO: Nome da Seção]".

REGRAS CRÍTICAS DE FORMATAÇÃO DO OMNIDESK:
1. Toda a sua resposta DEVE ser entregue EXCLUSIVAMENTE dentro de um único bloco de código com a tag "text" (\`\`\`text ... \`\`\`).
2. NÃO escreva textos ou explicações fora do bloco de código.
3. Indique cada seção com "[SEÇÃO: Nome da Seção]".
4. Cada item deve começar com "- [ ] ".

Exemplo exato do formato esperado:

\`\`\`text
[CHECKLIST: ${cleanModule}]
[MATÉRIA: ${cleanSubject}]

[SEÇÃO: 1. Fundamentos e Definições]
- [ ] Conceitos fundamentais de ${cleanModule}
- [ ] Regras operatórias e propriedades principais
- [ ] Casos especiais e exceções da matéria

[SEÇÃO: 2. Tópicos Práticos]
- [ ] Resolução de problemas clássicos de banca
- [ ] Aplicação prática em simulados

[SEÇÃO: 3. Tópicos Avançados]
- [ ] Pegadinhas e pontos de alta complexidade
\`\`\``
          : `Atue como um mentor e estrategista acadêmico. Crie um checklist estruturado por etapas de estudo (Teoria, Prática e Revisão) para dominar o módulo/tópico "${cleanModule}" da matéria "${cleanSubject}".
REGRAS CRÍTICAS DE FORMATAÇÃO DO OMNIDESK:
1. Toda a sua resposta DEVE ser entregue EXCLUSIVAMENTE dentro de um único bloco de código com a tag "text" (\`\`\`text ... \`\`\`).
2. NÃO escreva textos ou explicações fora do bloco de código.
3. Indique cada seção com "[SEÇÃO: Nome da Seção]".
4. Cada item ou tarefa deve começar com "- [ ] ".

Exemplo exato do formato esperado:

\`\`\`text
[CHECKLIST: ${cleanModule}]
[MATÉRIA: ${cleanSubject}]

[SEÇÃO: 1. Teoria e Fundamentos]
- [ ] Leitura da base teórica e conceitos essenciais
- [ ] Mapeamento das regras, exceções e fórmulas principais
- [ ] Elaboração de resumo esquemático do conteúdo

[SEÇÃO: 2. Prática e Fixação]
- [ ] Resolução de bateria de questões comentadas
- [ ] Identificação de pegadinhas e erros frequentes
- [ ] Revisão detalhada dos pontos de maior incidência

[SEÇÃO: 3. Revisão e Simulado]
- [ ] Autoexplicação dos tópicos mais complexos
- [ ] Mini-simulado de validação de aprendizado
\`\`\``,
    },
  };

  const currentPrompt = prompts[type].prompt;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(currentPrompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className="modal ai-prompt-modal"
        role="dialog"
        aria-modal="true"
      >
        <header className="modal-header">
          <div>
            <span className="eyebrow">
              <Sparkles size={14} /> GERAR COM IA
            </span>
            <h2>Prompts Prontos para Estudo</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>

        <p className="ai-modal-intro">
          Copie o prompt configurado abaixo e cole no <strong>Gemini</strong>,{" "}
          <strong>ChatGPT</strong> ou <strong>Claude</strong>. A IA receberá a
          instrução obrigatória de enviar o resultado em{" "}
          <strong>modo de código</strong> com separadores <code>---</code>,
          pronto para colar diretamente no OmniDesk!
        </p>

        <div className="action-tabs three ai-tabs">
          <button
            className={type === "questions" ? "active" : ""}
            onClick={() => setType("questions")}
          >
            <CircleHelp size={16} /> Questões
          </button>
          <button
            className={type === "flashcards" ? "active" : ""}
            onClick={() => setType("flashcards")}
          >
            <BookOpen size={16} /> Flashcards
          </button>
          <button
            className={type === "checklists" ? "active" : ""}
            onClick={() => setType("checklists")}
          >
            <CheckSquare2 size={16} /> Checklists
          </button>
        </div>

        <div className="ai-customizer-fields">
          <div className="ai-input-row">
            <label>
              Matéria
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex.: Finanças e Contabilidade, Português..."
                maxLength={80}
              />
            </label>
            <label>
              {type === "checklists" ? "Tema / Edital" : "Tema / Módulo"}
              <input
                value={moduleTopic}
                onChange={(e) => setModuleTopic(e.target.value)}
                placeholder={
                  type === "checklists"
                    ? "Ex.: Edital Concurso Caixa, Sintaxe..."
                    : "Ex.: Teoria dos conjuntos, Atos administrativos..."
                }
                maxLength={100}
                autoFocus
              />
            </label>
            {type === "questions" && (
              <label>
                Coleção de destino
                <input
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  placeholder="Ex.: Princípios Contábeis"
                  maxLength={100}
                />
              </label>
            )}
            {type !== "checklists" && (
              <label className="ai-qty-field">
                Quantidade
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Ex.: 5"
                />
              </label>
            )}
          </div>

          {type === "checklists" ? (
            <div className="ai-checklist-custom-controls">
              <div className="ai-pill-switch">
                <button
                  type="button"
                  className={checklistMode === "edital" ? "active" : ""}
                  onClick={() => setChecklistMode("edital")}
                >
                  <ListChecks size={14} /> Item por tema do edital
                </button>
                <button
                  type="button"
                  className={checklistMode === "cycle" ? "active" : ""}
                  onClick={() => setChecklistMode("cycle")}
                >
                  <Sparkles size={14} /> Ciclo de estudo (Teoria / Questões /
                  Revisão)
                </button>
              </div>
              {checklistMode === "edital" && (
                <div className="ai-edital-box">
                  <label>
                    <span>Colar tópicos do edital a dominar (opcional):</span>
                    <textarea
                      value={editalTopics}
                      onChange={(e) => setEditalTopics(e.target.value)}
                      placeholder="Cole a lista de tópicos do edital (um por linha) e a IA vai gerar a checklist pronta...&#10;Ex.:&#10;1. Compreensão de textos&#10;2. Ortografia oficial&#10;3. Emprego de crase&#10;4. Concordância verbal"
                      rows={3}
                    />
                  </label>
                </div>
              )}
            </div>
          ) : (
            <label className="ai-attachment-card">
              <input
                type="checkbox"
                checked={attachNotes}
                onChange={(e) => setAttachNotes(e.target.checked)}
              />
              <FileText size={15} className="ai-attachment-icon" />
              <span>
                Incluir instrução para analisar anotações ou prints de simulado
                que vou colar no chat
              </span>
            </label>
          )}
        </div>

        <div className="ai-prompt-box">
          <div className="ai-prompt-box-head">
            <small>Prévia do prompt configurado para copiar</small>
            <button className="text-button copy-prompt-btn" onClick={copy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}{" "}
              {copied ? "Copiado!" : "Copiar prompt"}
            </button>
          </div>
          <pre>{currentPrompt}</pre>
        </div>

        <footer className="ai-modal-footer">
          <div className="ai-footer-hint">
            <small>
              Basta copiar o prompt, enviar para a IA e colar o código gerado no
              OmniDesk.
            </small>
          </div>
          <div className="ai-footer-buttons">
            <button className="secondary-button" onClick={onClose}>
              Fechar
            </button>
            <button className="primary-button" onClick={copy}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Prompt copiado com sucesso!" : "Copiar prompt pronto"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
