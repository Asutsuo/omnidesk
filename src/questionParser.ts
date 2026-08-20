import { LIMITS, type Question, type Subject } from "./data";

export type ParsedQuestion = Omit<Question, "id" | "createdAt" | "updatedAt">;
export type QuestionParseResult = { questions: ParsedQuestion[]; errors: string[] };

type Metadata = { collection: string; subject: string; categories: string[]; institution: string; year?: number; source: string };
const directivePattern = /^\[\s*(COLEÇÃO|COLECAO|MATÉRIA|MATERIA|CATEGORIA|INSTITUIÇÃO|INSTITUICAO|ANO|FONTE)\s*:\s*(.+)]$/i;

export function parseQuestionsText(text: string, subjects: Subject[], fixedSubjectId?: string): QuestionParseResult {
  const questions: ParsedQuestion[] = []; const errors: string[] = [];
  const metadata: Metadata = { collection: "Importação", subject: "", categories: [], institution: "", source: "" };
  let statement = ""; let alternatives: Array<{ id: string; text: string }> = []; let correct = ""; let explanation = ""; let startLine = 0;
  const subjectId = () => fixedSubjectId ?? subjects.find((item) => item.title.localeCompare(metadata.subject, "pt-BR", { sensitivity: "base" }) === 0)?.id;
  const reset = () => { statement = ""; alternatives = []; correct = ""; explanation = ""; startLine = 0; };
  const flush = () => {
    if (!statement && !alternatives.length) return;
    const prefix = startLine ? `Questão iniciada na linha ${startLine}` : "Questão";
    if (!statement) errors.push(`${prefix}: enunciado ausente.`);
    else if (alternatives.length < 2) errors.push(`${prefix}: informe ao menos duas alternativas.`);
    else if (!alternatives.some((item) => item.id === correct.toUpperCase())) errors.push(`${prefix}: gabarito “${correct || "ausente"}” não corresponde às alternativas.`);
    else if (questions.length < LIMITS.questionsPerImport) questions.push({ subjectId: subjectId(), collection: metadata.collection || "Importação", categories: metadata.categories, statement: statement.trim().slice(0, LIMITS.questionStatement), alternatives: alternatives.slice(0, LIMITS.questionAlternatives), correctAlternativeId: correct.toUpperCase(), explanation: explanation.trim().slice(0, LIMITS.questionExplanation), institution: metadata.institution, year: metadata.year, source: metadata.source });
    reset();
  };
  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim(); const lineNumber = index + 1;
    if (!line) return;
    if (line === "---") { flush(); return; }
    const directive = line.match(directivePattern);
    if (directive) {
      if (statement) flush(); const key = directive[1].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase(); const value = directive[2].trim();
      if (key === "COLECAO") metadata.collection = value;
      else if (key === "MATERIA") metadata.subject = value;
      else if (key === "CATEGORIA") metadata.categories = value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 12);
      else if (key === "INSTITUICAO") metadata.institution = value;
      else if (key === "ANO") metadata.year = /^\d{4}$/.test(value) ? Number(value) : undefined;
      else if (key === "FONTE") metadata.source = value;
      return;
    }
    if (line.startsWith("?")) { if (statement) flush(); statement = line.slice(1).trim(); startLine = lineNumber; return; }
    const alternative = line.match(/^([A-H])[).]\s*(.+)$/i);
    if (alternative) { if (!statement) errors.push(`Linha ${lineNumber}: alternativa encontrada antes do enunciado.`); alternatives.push({ id: alternative[1].toUpperCase(), text: alternative[2].trim().slice(0, LIMITS.questionStatement) }); return; }
    const answer = line.match(/^=\s*([A-H])\s*$/i); if (answer) { correct = answer[1].toUpperCase(); return; }
    if (line.startsWith(">")) { explanation += `${explanation ? "\n" : ""}${line.slice(1).trim()}`; return; }
    if (statement && !alternatives.length) statement += `\n${line}`;
    else if (explanation) explanation += `\n${line}`;
    else errors.push(`Linha ${lineNumber}: conteúdo não reconhecido.`);
  });
  flush();
  if (questions.length >= LIMITS.questionsPerImport) errors.push(`Somente as primeiras ${LIMITS.questionsPerImport} questões válidas foram consideradas.`);
  return { questions, errors };
}

export const QUESTION_IMPORT_EXAMPLE = `[COLEÇÃO: ESA 2014]\n[MATÉRIA: Português]\n[CATEGORIA: Sintaxe]\n[INSTITUIÇÃO: Exército Brasileiro]\n[ANO: 2014]\n\n? Assinale a alternativa correta.\nA) Primeira alternativa\nB) Segunda alternativa\nC) Terceira alternativa\nD) Quarta alternativa\n= B\n> Comentário opcional sobre o gabarito.\n---`;
