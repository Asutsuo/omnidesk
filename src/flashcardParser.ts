import { LIMITS, type Subject } from "./data";

export type ParsedFlashcard = {
  question: string;
  answer: string;
  subject: string;
  subjectId?: string;
  deck: string;
};

export type FlashcardParseResult = {
  cards: ParsedFlashcard[];
  errors: string[];
};

export function parseFlashcardsText(
  text: string,
  subjects: Subject[],
  fixedSubject?: Subject,
): FlashcardParseResult {
  const cards: ParsedFlashcard[] = [];
  const errors: string[] = [];

  let currentDeck = "Geral";
  let subjectId = fixedSubject?.id;
  let subjectTitle = fixedSubject?.title ?? "Geral";

  const lines = text.split(/\r?\n/);

  lines.forEach((raw, index) => {
    const lineNumber = index + 1;
    const line = raw.trim();

    // Ignorar linhas vazias, blocos de código e divisores ---
    if (
      !line ||
      /^```/.test(line) ||
      /^(?:---|---|\*\*\*|___)\s*$/.test(line)
    ) {
      return;
    }

    // Diretivas: [BLOCO: ...], [MATÉRIA: ...]
    const directiveMatch = line.match(
      /^\[(BLOCO|MATÉRIA|MATERIA):\s*(.+?)\]$/i,
    );
    if (directiveMatch) {
      const type = directiveMatch[1].toUpperCase();
      const val = directiveMatch[2].trim();
      if (type === "BLOCO") {
        currentDeck = val.slice(0, 80) || "Geral";
      } else {
        const found = subjects.find(
          (item) =>
            item.title.localeCompare(val, "pt-BR", { sensitivity: "base" }) ===
            0,
        );
        subjectId = fixedSubject?.id ?? found?.id;
        subjectTitle = fixedSubject?.title ?? found?.title ?? val;
      }
      return;
    }

    // Separador ::
    const separatorIdx = line.indexOf("::");
    if (separatorIdx === -1) {
      errors.push(
        `Linha ${lineNumber}: formato inválido. Use "Pergunta :: Resposta".`,
      );
      return;
    }

    let question = line
      .slice(0, separatorIdx)
      .replace(/^\s*(?:[-*]|\d+\.)\s*/, "")
      .trim();
    let answer = line.slice(separatorIdx + 2).trim();

    question = question.replace(/^\*\*(.+?)\*\*$/, "$1").trim();
    answer = answer.replace(/^\*\*(.+?)\*\*$/, "$1").trim();

    if (!question) {
      errors.push(`Linha ${lineNumber}: pergunta (frente do cartão) ausente.`);
      return;
    }
    if (!answer) {
      errors.push(`Linha ${lineNumber}: resposta (verso do cartão) ausente.`);
      return;
    }

    if (cards.length < LIMITS.flashcardsPerImport) {
      cards.push({
        question: question.slice(0, 1000),
        answer: answer.slice(0, 5000),
        subject: subjectTitle,
        subjectId,
        deck: currentDeck,
      });
    }
  });

  if (cards.length >= LIMITS.flashcardsPerImport) {
    errors.push(
      `Limite atingido: somente os primeiros ${LIMITS.flashcardsPerImport} cartões válidos foram considerados.`,
    );
  }

  return { cards, errors };
}

export const FLASHCARD_IMPORT_EXAMPLE = `[BLOCO: Vocabulário]\n[MATÉRIA: Português]\n\nO que é sujeito? :: Termo sobre o qual se faz uma declaração.\nO que é predicado? :: Tudo o que se declara sobre o sujeito.\n---\n[BLOCO: Sintaxe]\nComo ocorre crase antes de verbos? :: Nunca ocorre crase antes de verbos.\n---`;
