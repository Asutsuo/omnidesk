import { SUBJECT_COLORS, createTimer, normalizeData, type AppData, type DailyStat, type Priority } from "../data";
import type { DemoContentProfile, DemoOptions } from "./demoScenarios";

const subjectNames = ["Matemática", "Português", "Direito Administrativo", "Informática", "Raciocínio Lógico", "Gestão de Pessoas", "Administração Pública", "Contabilidade", "Redação", "Atualidades", "Direito Constitucional", "Arquivologia"];
const workNames = ["Revisar o conteúdo do edital", "Resolver lista de exercícios", "Finalizar resumo da unidade", "Simulado completo", "Revisão dos tópicos críticos", "Preparar mapa mental", "Corrigir questões erradas", "Leitura da bibliografia", "Entrega do projeto prático", "Revisão cumulativa"];
const checklistNames = ["Conteúdo programático", "Revisão para a prova", "Trilha de fundamentos", "Ciclo semanal", "Pontos do edital", "Plano de aprofundamento"];
const sectionNames = ["Fundamentos", "Conteúdo essencial", "Prática e revisão", "Tópicos avançados"];
const itemNames = ["Conceitos introdutórios", "Princípios e definições", "Classificações principais", "Aplicações práticas", "Exercícios comentados", "Revisão espaçada", "Questões anteriores", "Resumo do conteúdo", "Pontos de atenção", "Simulado do módulo"];
const questions = ["Qual é o conceito central deste tópico?", "Como esse princípio é aplicado?", "Quais são as principais classificações?", "Que diferença existe entre os dois conceitos?", "Qual exceção costuma aparecer em provas?", "Como resolver este tipo de questão?", "Quais etapas formam o processo?", "Que exemplo ajuda a memorizar a regra?"];
const priorities: Priority[] = ["Baixa", "Média", "Alta"];
const catalogs: Record<Exclude<DemoContentProfile, "empty">, { subjects: string[]; works: string[]; checklists: string[]; course: string; objective: string }> = {
  light: { subjects: ["Inglês", "Finanças pessoais", "Programação"], works: ["Revisar anotações da semana", "Concluir módulo introdutório", "Praticar exercícios pendentes", "Organizar referências", "Revisão mensal"], checklists: ["Plano da semana", "Fundamentos", "Conteúdos para revisar"], course: "Estudos pessoais", objective: "Manter uma rotina de aprendizado sustentável" },
  contest: { subjects: ["Língua Portuguesa", "Raciocínio Lógico", "Direito Constitucional", "Direito Administrativo", "Informática", "Administração Geral", "Gestão de Pessoas", "Arquivologia", "Administração Pública", "Contabilidade Pública", "Atualidades", "Redação"], works: ["Primeira volta completa do edital", "Simulado geral do bloco I", "Revisar questões erradas do Cebraspe", "Fechar ciclo semanal de revisão", "Resolver prova anterior", "Revisar jurisprudência selecionada", "Treinar redação discursiva", "Consolidar pontos fracos do simulado", "Revisão de 24 horas", "Revisão acumulada do mês"], checklists: ["Conteúdo programático do edital", "Ciclo semanal de estudos", "Revisão pré-simulado", "Assuntos com maior incidência", "Questões erradas", "Leis para leitura seca"], course: "Preparação para concurso público", objective: "Concluir o edital e elevar o desempenho nos simulados" },
  college: { subjects: ["Estruturas de Dados", "Banco de Dados", "Engenharia de Software", "Redes de Computadores", "Cálculo II", "Estatística Aplicada", "Interação Humano-Computador", "Sistemas Operacionais", "Metodologia Científica", "Inteligência Artificial"], works: ["Entrega do projeto integrador", "Prova da segunda unidade", "Lista de exercícios avaliativa", "Apresentação do seminário", "Relatório da aula prática", "Implementar etapa do trabalho em grupo", "Revisar conteúdo da prova", "Preparar slides da apresentação", "Enviar atividade no ambiente virtual", "Reunião do projeto interdisciplinar"], checklists: ["Cronograma do projeto final", "Conteúdo da próxima prova", "Entregas do semestre", "Seminário em grupo", "Revisão da unidade", "Atividades complementares"], course: "Análise e Desenvolvimento de Sistemas", objective: "Concluir o semestre com todas as entregas em dia" },
  stress: { subjects: subjectNames, works: workNames, checklists: checklistNames, course: "Ambiente de teste de alto volume", objective: "Validar desempenho, navegação e limites visuais" },
};

const hash = (value: string) => {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  return result >>> 0;
};

const randomFrom = (seed: string) => {
  let state = hash(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const shiftedDate = (days: number) => { const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() + days); return date; };
const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, Math.round(value)));

export function generateDemoData(raw: DemoOptions, namespace = "preview"): AppData {
  const options = {
    ...raw,
    subjects: clamp(raw.subjects, 0, 40), assignments: clamp(raw.assignments, 0, 300), checklists: clamp(raw.checklists, 0, 80),
    flashcards: clamp(raw.flashcards, 0, 1_000), notebooks: clamp(raw.notebooks, 0, 80), days: clamp(raw.days, 7, 180),
    completion: clamp(raw.completion, 0, 100), intensity: clamp(raw.intensity, 0, 100),
  };
  if (options.profile === "empty") return normalizeData({ version: 3, onboarded: true, profile: { name: "Daniel", course: "Meu espaço de estudos", objective: "", weeklyGoal: 5 }, theme: "omnidesk" });
  const catalog = catalogs[options.profile];
  const random = randomFrom(options.seed);
  const shift = (days: number) => shiftedDate(days + clamp(options.dateOffset, -365, 365));
  const prefix = `demo-${hash(`${options.seed}:${namespace}`).toString(36)}`;
  const id = (kind: string, index: number) => `${prefix}-${kind}-${index}`;
  const subjects = Array.from({ length: options.subjects }, (_, index) => ({
    id: id("subject", index), title: `${catalog.subjects[index % catalog.subjects.length]}${index >= catalog.subjects.length ? ` ${Math.floor(index / catalog.subjects.length) + 1}` : ""}`, color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
    createdAt: shift(-options.days - index).toISOString(),
  }));
  const subjectFor = (index: number) => index % 7 === 0 ? undefined : subjects[index % subjects.length];
  const assignments = Array.from({ length: options.assignments }, (_, index) => {
    const subject = subjectFor(index); const due = shift(Math.floor(random() * 42) - 12);
    return { id: id("work", index), subjectId: subject?.id, title: catalog.works[index % catalog.works.length], description: index % 4 === 0 ? "Etapa importante do planejamento atual, com revisão prevista após a conclusão." : "", dueDate: dateKey(due), priority: priorities[Math.floor(random() * priorities.length)], completed: random() * 100 < options.completion };
  });
  const checklists = Array.from({ length: options.checklists }, (_, index) => { const subject = subjectFor(index + 2); return { id: id("checklist", index), subjectId: subject?.id, title: `${catalog.checklists[index % catalog.checklists.length]}${index >= catalog.checklists.length ? ` ${Math.floor(index / catalog.checklists.length) + 1}` : ""}`, description: "Etapas organizadas para acompanhar o avanço real do conteúdo.", createdAt: shift(-options.days + index).toISOString(), updatedAt: shift(-index).toISOString() }; });
  const checklistSections = checklists.flatMap((list, listIndex) => Array.from({ length: 3 }, (_, sectionIndex) => ({ id: id(`section-${listIndex}`, sectionIndex), checklistId: list.id, title: sectionNames[sectionIndex], order: sectionIndex })));
  const checklistItems = checklists.flatMap((list, listIndex) => Array.from({ length: 12 }, (_, itemIndex) => ({ id: id(`item-${listIndex}`, itemIndex), checklistId: list.id, sectionId: checklistSections.find((section) => section.checklistId === list.id && section.order === Math.floor(itemIndex / 4))?.id, text: itemNames[(itemIndex + listIndex) % itemNames.length], completed: random() * 100 < options.completion, order: itemIndex })));
  const flashcards = Array.from({ length: options.flashcards }, (_, index) => { const subject = subjectFor(index + 1); return { id: id("card", index), subjectId: subject?.id, subject: subject?.title ?? "Geral", deck: index % 3 === 0 ? "Revisão" : index % 3 === 1 ? "Fundamentos" : "Questões", question: questions[index % questions.length], answer: `Resposta resumida e contextualizada para o cartão ${index + 1}.`, mastered: random() * 100 < options.completion }; });
  const notebooks = Array.from({ length: Math.min(options.notebooks, subjects.length * 2) }, (_, index) => ({ id: id("notebook", index), subjectId: subjects[index % subjects.length].id, title: index % 2 ? "Resumos e revisões" : `Anotações de ${subjects[index % subjects.length].title}`, createdAt: shift(-options.days + index).toISOString(), updatedAt: shift(-index).toISOString() }));
  const notes = notebooks.flatMap((notebook, index) => Array.from({ length: 2 }, (_, noteIndex) => ({ id: id(`note-${index}`, noteIndex), notebookId: notebook.id, subjectId: notebook.subjectId, title: noteIndex ? "Pontos para revisar" : "Resumo da aula", content: "Conceitos principais\n\n• Definições importantes\n• Exemplos de aplicação\n• Questões que merecem uma nova revisão", createdAt: notebook.createdAt, updatedAt: shift(-noteIndex).toISOString() })));
  const stats: DailyStat[] = [];
  for (let day = options.days - 1; day >= 0; day -= 1) {
    const activeChance = 0.25 + options.intensity / 140;
    if (random() > activeChance || day % 11 === 7) continue;
    const sessions = 1 + Math.floor(random() * Math.max(1, options.intensity / 20));
    for (let session = 0; session < sessions; session += 1) {
      const subject = random() < 0.16 ? undefined : subjects[Math.floor(random() * subjects.length)];
      const date = dateKey(shift(-day)); const existing = stats.find((entry) => entry.date === date && entry.subjectId === subject?.id);
      const seconds = (20 + Math.floor(random() * (25 + options.intensity))) * 60;
      if (existing) { existing.focusedSeconds += seconds; existing.pomodoroCycles += seconds >= 25 * 60 ? 1 : 0; }
      else stats.push({ id: id(`stat-${date}`, session), date, subjectId: subject?.id, focusedSeconds: seconds, pomodoroCycles: seconds >= 25 * 60 ? 1 : 0 });
    }
  }
  const timers = [createTimer("global"), ...subjects.slice(0, Math.min(4, subjects.length)).map((subject, index) => ({ ...createTimer("subject", subject.id), type: index % 2 ? "stopwatch" as const : "pomodoro" as const, elapsedSeconds: index % 2 ? (index + 1) * 1287 : 0, remainingSeconds: index % 2 ? 25 * 60 : 620 + index * 95, updatedAt: shift(-index).toISOString() }))];
  const teams = [{ id: id("team", 0), name: "Grupo de revisão", subject: "Preparação para o concurso", members: ["Ana Lima", "Bruno Alves", "Camila Rocha"], nextMeeting: "Sábado, 14h" }, { id: id("team", 1), name: "Estudos orientados", subject: subjects[0]?.title ?? "Geral", members: ["Daniel", "Marina"], nextMeeting: "Quarta-feira, 19h" }];
  return normalizeData({ version: 3, onboarded: true, profile: { name: "Daniel", course: catalog.course, objective: catalog.objective, weeklyGoal: options.profile === "light" ? 5 : 12 }, subjects, assignments, checklists, checklistSections, checklistItems, flashcards, notebooks, notes, timers, stats, teams, focusMinutes: stats.reduce((sum, entry) => sum + entry.focusedSeconds / 60, 0), subjectView: "grid", homeShortcuts: ["subjects", "prazos", "checklists", "estatisticas"], theme: options.profile === "college" ? "aurora" : "atlantic" });
}

export function mergeDemoData(current: AppData, demo: AppData): AppData {
  return normalizeData({ ...current, onboarded: true, subjects: [...current.subjects, ...demo.subjects], assignments: [...current.assignments, ...demo.assignments], checklists: [...current.checklists, ...demo.checklists], checklistSections: [...current.checklistSections, ...demo.checklistSections], checklistItems: [...current.checklistItems, ...demo.checklistItems], flashcards: [...current.flashcards, ...demo.flashcards], notebooks: [...current.notebooks, ...demo.notebooks], notes: [...current.notes, ...demo.notes], timers: [...current.timers, ...demo.timers.filter((timer) => timer.scope === "subject")], stats: [...current.stats, ...demo.stats], teams: [...current.teams, ...demo.teams], focusMinutes: current.focusMinutes + demo.focusMinutes });
}
