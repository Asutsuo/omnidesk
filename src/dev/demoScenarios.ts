export type DemoScenarioId = "empty" | "light" | "contest" | "college" | "stress";
export type DemoContentProfile = DemoScenarioId;

export type DemoOptions = {
  profile: DemoContentProfile;
  seed: string;
  subjects: number;
  assignments: number;
  checklists: number;
  flashcards: number;
  notebooks: number;
  days: number;
  dateOffset: number;
  completion: number;
  intensity: number;
};

export const DEMO_SCENARIOS: Record<DemoScenarioId, { name: string; description: string; options: DemoOptions }> = {
  empty: {
    name: "Ambiente vazio",
    description: "Perfil criado, sem matérias ou conteúdos. Ideal para estados vazios.",
    options: { profile: "empty", seed: "omnidesk-vazio", subjects: 0, assignments: 0, checklists: 0, flashcards: 0, notebooks: 0, days: 14, dateOffset: 0, completion: 0, intensity: 0 },
  },
  light: {
    name: "Uso leve",
    description: "Uma rotina pessoal pequena, plausível e ainda no começo.",
    options: { profile: "light", seed: "omnidesk-uso-leve", subjects: 3, assignments: 5, checklists: 3, flashcards: 16, notebooks: 2, days: 14, dateOffset: 0, completion: 35, intensity: 30 },
  },
  contest: {
    name: "Concurso em andamento",
    description: "Edital em estudo, ciclos de revisão, simulados e matérias prioritárias.",
    options: { profile: "contest", seed: "omnidesk-concurso", subjects: 8, assignments: 20, checklists: 9, flashcards: 72, notebooks: 7, days: 42, dateOffset: 0, completion: 58, intensity: 72 },
  },
  college: {
    name: "Faculdade carregada",
    description: "Semestre intenso com provas, trabalhos, projetos e várias disciplinas.",
    options: { profile: "college", seed: "omnidesk-faculdade", subjects: 7, assignments: 28, checklists: 8, flashcards: 64, notebooks: 9, days: 56, dateOffset: 0, completion: 47, intensity: 80 },
  },
  stress: {
    name: "Stress test",
    description: "Alto volume para testar desempenho, limites visuais e navegação.",
    options: { profile: "stress", seed: "omnidesk-stress", subjects: 40, assignments: 280, checklists: 70, flashcards: 1_000, notebooks: 60, days: 180, dateOffset: 0, completion: 63, intensity: 95 },
  },
};

