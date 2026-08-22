import type { ScheduleCategory, ScheduleEntry, Subject } from "./data";

const DAY_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const CATEGORY_NAMES: Record<ScheduleCategory, string> = { study: "Estudo", review: "Revisão", assignment: "Outro", break: "Pausa", personal: "Pessoal", other: "Outro" };
const IMPORT_CATEGORIES: { id: Exclude<ScheduleCategory, "assignment">; aliases: string[] }[] = [
  { id: "study", aliases: ["estudo", "estudar"] }, { id: "review", aliases: ["revisao", "revisar"] },
  { id: "break", aliases: ["pausa", "intervalo"] }, { id: "personal", aliases: ["pessoal"] }, { id: "other", aliases: ["outro", "outra"] },
];
export const normalizeScheduleLabel = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLocaleLowerCase("pt-BR");
const field = (block: string, name: string) => block.match(new RegExp(`^\\[${name}\\s*:\\s*(.*?)\\]$`, "im"))?.[1]?.trim();
const distance = (left: string, right: string) => { const matrix = Array.from({ length: right.length + 1 }, (_, row) => [row]); for (let column = 0; column <= left.length; column += 1) matrix[0][column] = column; for (let row = 1; row <= right.length; row += 1) for (let column = 1; column <= left.length; column += 1) matrix[row][column] = Math.min(matrix[row - 1][column] + 1, matrix[row][column - 1] + 1, matrix[row - 1][column - 1] + Number(left[column - 1] !== right[row - 1])); return matrix[right.length][left.length]; };
const closestSubject = (name: string, subjects: Subject[]) => { const normalized = normalizeScheduleLabel(name); const ranked = subjects.map((subject) => ({ subject, score: 1 - distance(normalized, normalizeScheduleLabel(subject.title)) / Math.max(normalized.length, normalizeScheduleLabel(subject.title).length, 1) })).sort((a, b) => b.score - a.score); return ranked[0]?.score >= .78 && (ranked[0].score - (ranked[1]?.score ?? 0) >= .08) ? ranked[0].subject : undefined; };
const usesSubject = (category: ScheduleCategory) => category === "study" || category === "review";

export type ParsedScheduleBlock = { title: string; description: string; startTime: string; endTime: string; timeDefined: boolean; category: Exclude<ScheduleCategory, "assignment">; subjectId?: string; requestedSubject?: string; days: number[]; date?: string };
export type ScheduleSubjectIssue = { name: string; normalizedName: string; suggestionId?: string; occurrences: number };
export type ScheduleParseResult = { blocks: ParsedScheduleBlock[]; errors: string[]; warnings: string[]; subjectIssues: ScheduleSubjectIssue[]; automaticMatches: number };
export const SCHEDULE_IMPORT_EXAMPLE = `[TIPO: ÚNICO]
[TÍTULO: Revisar edital]
[DATA: 2026-09-04]
[HORÁRIO: 14:00-15:00]
[CATEGORIA: Estudo]
[MATÉRIA: Matemática]
[OBSERVAÇÕES: Revisar os tópicos da primeira volta]

---

[TIPO: RECORRENTE]
[TÍTULO: Pausa para almoço]
[DIAS: Segunda, Quarta, Sexta]
[HORÁRIO: 12:00-13:00]
[CATEGORIA: Pessoal]`;

export function exportScheduleText(entries: ScheduleEntry[], subjects: Subject[]) {
  return entries.map((entry) => {
    const category = entry.category === "assignment" ? "Outro" : CATEGORY_NAMES[entry.category]; const subject = subjects.find((item) => item.id === entry.subjectId)?.title ?? "Geral"; const description = entry.description.replace(/\s*\n\s*/g, " ").trim(); const subjectField = usesSubject(entry.category) ? `[MATÉRIA: ${subject}]` : "";
    return [`[TIPO: ${entry.date ? "ÚNICO" : "RECORRENTE"}]`, `[TÍTULO: ${entry.title}]`, entry.date ? `[DATA: ${entry.date}]` : `[DIAS: ${DAY_NAMES[entry.day]}]`, `[HORÁRIO: ${entry.timeDefined === false ? "A definir" : `${entry.startTime}-${entry.endTime}`}]`, `[CATEGORIA: ${category}]`, subjectField, description ? `[OBSERVAÇÕES: ${description}]` : ""].filter(Boolean).join("\n");
  }).join("\n\n---\n\n");
}

export function parseScheduleText(text: string, subjects: Subject[]): ScheduleParseResult {
  const errors: string[] = []; const warningCounts = new Map<string, { subject: string; category: string; count: number }>(); const blocks: ParsedScheduleBlock[] = []; let automaticMatches = 0;
  text.split(/^\s*---\s*$/m).map((item) => item.trim()).filter(Boolean).forEach((raw, index) => {
    const number = index + 1; const title = field(raw, "T[ÍI]TULO"); const type = normalizeScheduleLabel(field(raw, "TIPO") ?? "único"); const date = field(raw, "DATA"); const daysText = field(raw, "DIAS?"); const time = field(raw, "HOR[ÁA]RIO") ?? "A definir"; const categoryText = field(raw, "CATEGORIA") ?? "Outro"; const subjectText = field(raw, "MAT[ÉE]RIA") ?? "Geral";
    if (!title) { errors.push(`Bloco ${number}: título ausente.`); return; }
    const recurring = type === "recorrente"; const days = recurring ? (daysText ?? "").split(",").map((item) => DAY_NAMES.findIndex((day) => normalizeScheduleLabel(day).startsWith(normalizeScheduleLabel(item)))).filter((day) => day >= 0) : [];
    if (recurring && !days.length) { errors.push(`Bloco ${number}: informe ao menos um dia da semana.`); return; }
    const dateParts = date?.match(/^(\d{4})-(\d{2})-(\d{2})$/); const parsedDate = dateParts ? new Date(Number(dateParts[1]), Number(dateParts[2]) - 1, Number(dateParts[3]), 12) : undefined; const validDate = !!dateParts && !!parsedDate && parsedDate.getFullYear() === Number(dateParts[1]) && parsedDate.getMonth() === Number(dateParts[2]) - 1 && parsedDate.getDate() === Number(dateParts[3]);
    if (!recurring && !validDate) { errors.push(`Bloco ${number}: use uma data válida no formato AAAA-MM-DD.`); return; }
    const undefinedTime = ["a definir", "sem horario"].includes(normalizeScheduleLabel(time)); const match = time.match(/^(\d{2}:\d{2})\s*[-–—]\s*(\d{2}:\d{2})$/); if (!undefinedTime && !match) { errors.push(`Bloco ${number}: use HH:MM-HH:MM ou “A definir”.`); return; }
    const clockMinutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3)); if (match && (Number(match[1].slice(0, 2)) > 23 || Number(match[1].slice(3)) > 59 || Number(match[2].slice(0, 2)) > 23 || Number(match[2].slice(3)) > 59 || clockMinutes(match[2]) - clockMinutes(match[1]) < 5)) { errors.push(`Bloco ${number}: informe um intervalo válido de pelo menos 5 minutos.`); return; }
    const normalizedCategory = normalizeScheduleLabel(categoryText); const category = IMPORT_CATEGORIES.find((item) => item.aliases.includes(normalizedCategory))?.id; if (!category) { if (normalizedCategory === "trabalho") errors.push(`Bloco ${number}: “Trabalho” é reservado à ferramenta Trabalhos. Use Estudo, Revisão, Pausa, Pessoal ou Outro.`); else errors.push(`Bloco ${number}: categoria “${categoryText}” não reconhecida.`); return; }
    let subjectId: string | undefined; let requestedSubject: string | undefined; const normalizedSubject = normalizeScheduleLabel(subjectText); if (usesSubject(category) && !["", "geral", "nenhuma", "sem materia"].includes(normalizedSubject)) { const exact = subjects.find((item) => normalizeScheduleLabel(item.title) === normalizedSubject); if (exact) { subjectId = exact.id; automaticMatches += 1; } else requestedSubject = subjectText; } else if (!usesSubject(category) && !["", "geral", "nenhuma", "sem materia"].includes(normalizedSubject)) { const key = `${category}:${normalizedSubject}`; const current = warningCounts.get(key); warningCounts.set(key, { subject: subjectText, category: CATEGORY_NAMES[category], count: (current?.count ?? 0) + 1 }); }
    blocks.push({ title: title.slice(0, 120), description: (field(raw, "OBSERVA[CÇ][ÕO]ES") ?? "").slice(0, 1_000), startTime: match?.[1] ?? "", endTime: match?.[2] ?? "", timeDefined: !undefinedTime, category, subjectId, requestedSubject, days: recurring ? [...new Set(days)] : [(parsedDate!.getDay() + 6) % 7], date: recurring ? undefined : date });
  });
  const grouped = new Map<string, ScheduleSubjectIssue>(); blocks.forEach((block) => { if (!block.requestedSubject) return; const normalizedName = normalizeScheduleLabel(block.requestedSubject); const current = grouped.get(normalizedName); if (current) current.occurrences += block.days.length; else grouped.set(normalizedName, { name: block.requestedSubject, normalizedName, suggestionId: closestSubject(block.requestedSubject, subjects)?.id, occurrences: block.days.length }); });
  const warnings = [...warningCounts.values()].map((warning) => `A matéria “${warning.subject}” foi ignorada em ${warning.count} ${warning.count === 1 ? "bloco" : "blocos"} da categoria ${warning.category}.`); return { blocks, errors, warnings, subjectIssues: [...grouped.values()], automaticMatches };
}
