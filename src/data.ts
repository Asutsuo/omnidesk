export const LIMITS = {
  subjects: 250, assignments: 10_000,
  assignmentsPerSubject: 1_000, notebooks: 1_000, notebooksPerSubject: 100,
  flashcards: 50_000, flashcardsPerSubject: 10_000, flashcardsPerImport: 1_000, title: 160, subjectTitle: 80,
  noteContent: 250_000, teams: 200, teamMembers: 100, stopwatchSeconds: 12 * 60 * 60,
  checklists: 2_000, checklistsPerSubject: 200, checklistSections: 100,
  checklistItems: 100_000, checklistItemsPerList: 2_000, checklistItemText: 1_000,
  resources: 5_000, resourcesPerSubject: 1_000, resourceUrl: 2_048, resourceDescription: 2_000,
  questions: 20_000, questionsPerSubject: 5_000, questionsPerImport: 500,
  questionStatement: 10_000, questionExplanation: 20_000, questionAlternatives: 8,
  simulations: 500, simulationQuestions: 200, simulationAttempts: 5_000,
  pomodoroCycles: 12, scheduleEntries: 500, scheduleTitle: 120, scheduleDescription: 1_000,
} as const;

export const SUBJECT_COLORS = ["#6f98a8", "#e59a6f", "#728e78", "#87799b", "#c17c83", "#758eae", "#b19a67", "#5f8586"];
export type Priority = "Baixa" | "Média" | "Alta";
export type Subject = { id: string; title: string; color: string; createdAt: string };
export type Assignment = { id: string; subjectId?: string; title: string; description: string; dueDate: string; priority: Priority; completed: boolean };
export type Checklist = { id: string; subjectId?: string; title: string; description: string; createdAt: string; updatedAt: string };
export type ChecklistSection = { id: string; checklistId: string; title: string; order: number };
export type ChecklistItem = { id: string; checklistId: string; sectionId?: string; text: string; completed: boolean; order: number };
export type Flashcard = { id: string; question: string; answer: string; subject: string; subjectId?: string; deck: string; mastered: boolean };
export type Notebook = { id: string; subjectId: string; title: string; createdAt: string; updatedAt: string };
export type Note = { id: string; notebookId: string; subjectId: string; title: string; content: string; createdAt: string; updatedAt: string };
export type Team = { id: string; name: string; subject: string; members: string[]; nextMeeting: string };
export type ResourceType = "link" | "video" | "pdf" | "article" | "document" | "folder" | "other";
export type StudyResource = { id: string; subjectId?: string; title: string; url: string; type: ResourceType; description: string; tags: string[]; collection: string; createdAt: string; updatedAt: string };
export type QuestionAlternative = { id: string; text: string };
export type Question = { id: string; subjectId?: string; collection: string; categories: string[]; statement: string; alternatives: QuestionAlternative[]; correctAlternativeId: string; explanation: string; institution: string; year?: number; source: string; createdAt: string; updatedAt: string };
export type Simulation = { id: string; title: string; questionIds: string[]; shuffleQuestions: boolean; shuffleAlternatives: boolean; passingScore: number; createdAt: string; updatedAt: string };
export type SimulationAttempt = { id: string; simulationId: string; title: string; questions: Question[]; answers: Record<string, string>; passingScore: number; status: "in_progress" | "completed"; startedAt: string; completedAt?: string; score?: number; passed?: boolean };
export type ScheduleCategory = "study" | "review" | "assignment" | "break" | "personal" | "other";
export type ScheduleEntry = { id: string; title: string; description: string; day: number; startTime: string; endTime: string; category: ScheduleCategory; subjectId?: string; createdAt: string; updatedAt: string };
export type ThemeId = "omnidesk" | "sage" | "aurora" | "dune" | "atlantic" | "plum" | "eclipse";
export type Profile = { name: string; course: string; objective: string; weeklyGoal: number; avatar?: string; cover?: string };
export type AccessStreak = { current: number; best: number; lastVisitDate: string };
export type TimerType = "pomodoro" | "stopwatch";
export type TimerMode = "focus" | "break";
export type HomeShortcut = "subjects" | "prazos" | "checklists" | "timer" | "flashcards" | "library" | "questions" | "schedule" | "equipes" | "estatisticas";
export type TimerState = {
  id: string; scope: "global" | "subject"; subjectId?: string; type: TimerType; mode: TimerMode;
  durationSeconds: number; remainingSeconds: number; elapsedSeconds: number; recordedSeconds: number; focusMinutes: number; breakMinutes: number;
  cyclesTarget: number; completedCycles: number;
  status: "paused" | "running"; startedAt: number | null; updatedAt: string;
};
export type DailyStat = { id: string; date: string; subjectId?: string; focusedSeconds: number; pomodoroCycles: number };
export type AppData = {
  version: 6; onboarded: boolean; profile: Profile; subjects: Subject[];
  assignments: Assignment[]; flashcards: Flashcard[]; notebooks: Notebook[]; notes: Note[];
  checklists: Checklist[]; checklistSections: ChecklistSection[]; checklistItems: ChecklistItem[];
  timers: TimerState[]; stats: DailyStat[]; teams: Team[]; resources: StudyResource[];
  questions: Question[]; simulations: Simulation[]; simulationAttempts: SimulationAttempt[]; scheduleEntries: ScheduleEntry[]; focusMinutes: number;
  subjectView: "grid" | "list";
  homeShortcuts: HomeShortcut[];
  theme: ThemeId;
  accessStreak: AccessStreak;
};

export const emptyData: AppData = {
  version: 6, onboarded: false, profile: { name: "", course: "", objective: "", weeklyGoal: 5 },
  subjects: [], assignments: [], flashcards: [], notebooks: [], notes: [], checklists: [], checklistSections: [], checklistItems: [], timers: [], stats: [], teams: [], resources: [], questions: [], simulations: [], simulationAttempts: [], scheduleEntries: [],
  focusMinutes: 0, subjectView: "grid", homeShortcuts: ["subjects", "checklists", "flashcards"], theme: "omnidesk", accessStreak: { current: 0, best: 0, lastVisitDate: "" },
};

export const createTimer = (scope: "global" | "subject", subjectId?: string): TimerState => ({
  id: scope === "global" ? "timer-global" : `timer-${subjectId}`, scope, subjectId, type: "pomodoro", mode: "focus",
  durationSeconds: 25 * 60, remainingSeconds: 25 * 60, elapsedSeconds: 0, recordedSeconds: 0, focusMinutes: 25, breakMinutes: 5, status: "paused", startedAt: null,
  cyclesTarget: 4, completedCycles: 0,
  updatedAt: new Date().toISOString(),
});

export function normalizeData(value: Partial<AppData> & { profile?: Profile }): AppData {
  const legacyCards = Array.isArray(value.flashcards) ? value.flashcards : [];
  const streakCurrent = Math.max(0, Math.floor(Number(value.accessStreak?.current) || 0));
  return {
    ...emptyData, ...value, version: 6,
    profile: { name: value.profile?.name ?? "", course: value.profile?.course ?? "", objective: value.profile?.objective ?? "", weeklyGoal: value.profile?.weeklyGoal ?? 5, ...(value.profile?.avatar ? { avatar: value.profile.avatar } : {}), ...(value.profile?.cover ? { cover: value.profile.cover } : {}) },
    subjects: Array.isArray(value.subjects) ? value.subjects : [],
    assignments: Array.isArray(value.assignments) ? value.assignments : [], flashcards: legacyCards.map((card) => ({ ...card, deck: card.deck || "Geral" })),
    notebooks: Array.isArray(value.notebooks) ? value.notebooks : [], notes: Array.isArray(value.notes) ? value.notes : [],
    checklists: Array.isArray(value.checklists) ? value.checklists : [], checklistSections: Array.isArray(value.checklistSections) ? value.checklistSections : [],
    checklistItems: Array.isArray(value.checklistItems) ? value.checklistItems : [],
    timers: Array.isArray(value.timers) ? value.timers.map((timer) => ({ ...timer, recordedSeconds: timer.recordedSeconds || 0, focusMinutes: timer.focusMinutes || 25, breakMinutes: timer.breakMinutes || 5, cyclesTarget: Math.max(1, Math.min(LIMITS.pomodoroCycles, Number(timer.cyclesTarget) || 4)), completedCycles: Math.max(0, Math.min(Number(timer.cyclesTarget) || 4, Number(timer.completedCycles) || 0)), status: timer.status === "running" && timer.startedAt ? "running" as const : "paused" as const, startedAt: timer.status === "running" && timer.startedAt ? timer.startedAt : null })) : [],
    stats: Array.isArray(value.stats) ? value.stats : [], teams: Array.isArray(value.teams) ? value.teams : [], resources: Array.isArray(value.resources) ? value.resources.filter((item) => typeof item?.url === "string" && /^https?:\/\//i.test(item.url)) : [],
    questions: Array.isArray(value.questions) ? value.questions : [], simulations: Array.isArray(value.simulations) ? value.simulations : [], simulationAttempts: Array.isArray(value.simulationAttempts) ? value.simulationAttempts : [],
    scheduleEntries: Array.isArray(value.scheduleEntries) ? value.scheduleEntries.filter((entry) => entry && Number.isInteger(entry.day) && entry.day >= 0 && entry.day <= 6 && /^\d{2}:\d{2}$/.test(entry.startTime) && /^\d{2}:\d{2}$/.test(entry.endTime)).slice(0, LIMITS.scheduleEntries) : [],
    subjectView: value.subjectView === "list" ? "list" : "grid",
    homeShortcuts: Array.isArray(value.homeShortcuts) ? value.homeShortcuts.filter((item): item is HomeShortcut => ["subjects", "prazos", "checklists", "timer", "flashcards", "library", "questions", "schedule", "equipes", "estatisticas"].includes(item)).slice(0, 4) : emptyData.homeShortcuts,
    theme: (["omnidesk", "sage", "aurora", "dune", "atlantic", "plum", "eclipse"] as const).includes(value.theme as ThemeId) ? value.theme as ThemeId : "omnidesk",
    accessStreak: { current: streakCurrent, best: Math.max(streakCurrent, Math.max(0, Math.floor(Number(value.accessStreak?.best) || 0))), lastVisitDate: typeof value.accessStreak?.lastVisitDate === "string" ? value.accessStreak.lastVisitDate : "" },
  };
}

export const localDayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function registerDailyAccess(data: AppData, date = new Date()): AppData {
  if (!data.onboarded) return data;
  const today = localDayKey(date); if (data.accessStreak.lastVisitDate === today) return data;
  const yesterday = new Date(date); yesterday.setHours(12, 0, 0, 0); yesterday.setDate(yesterday.getDate() - 1);
  const current = data.accessStreak.lastVisitDate === localDayKey(yesterday) ? data.accessStreak.current + 1 : 1;
  return { ...data, accessStreak: { current, best: Math.max(data.accessStreak.best, current), lastVisitDate: today } };
}

export function isBackupData(value: unknown): value is AppData {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<AppData>;
  return !!data.profile && typeof data.profile.name === "string" && Array.isArray(data.flashcards) &&
    (!data.subjects || Array.isArray(data.subjects)) && (!data.timers || Array.isArray(data.timers));
}

export const subjectName = (data: AppData, subjectId?: string) => data.subjects.find((item) => item.id === subjectId)?.title ?? "Geral";
export const formatTimer = (seconds: number, stopwatch = false) => {
  const safe = Math.max(0, Math.floor(seconds)); const hours = Math.floor(safe / 3600); const minutes = Math.floor((safe % 3600) / 60); const secs = safe % 60;
  return stopwatch || hours ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}` : `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};
