export const LIMITS = {
  subjects: 250, tasks: 20_000, tasksPerSubject: 2_000, assignments: 10_000,
  assignmentsPerSubject: 1_000, notebooks: 1_000, notebooksPerSubject: 100,
  flashcards: 50_000, flashcardsPerSubject: 10_000, title: 160, subjectTitle: 80,
  noteContent: 250_000, teams: 200, teamMembers: 100, stopwatchSeconds: 12 * 60 * 60,
} as const;

export const SUBJECT_COLORS = ["#6f98a8", "#e59a6f", "#728e78", "#87799b", "#c17c83", "#758eae", "#b19a67", "#5f8586"];
export type Priority = "Baixa" | "Média" | "Alta";
export type Subject = { id: string; title: string; color: string; createdAt: string };
export type Task = { id: string; title: string; subject: string; subjectId?: string; dueDate: string; priority: Priority; completed: boolean };
export type Assignment = { id: string; subjectId: string; title: string; description: string; dueDate: string; priority: Priority; completed: boolean };
export type Flashcard = { id: string; question: string; answer: string; subject: string; subjectId?: string; deck: string; mastered: boolean };
export type Notebook = { id: string; subjectId: string; title: string; createdAt: string; updatedAt: string };
export type Note = { id: string; notebookId: string; subjectId: string; title: string; content: string; createdAt: string; updatedAt: string };
export type Team = { id: string; name: string; subject: string; members: string[]; nextMeeting: string };
export type Profile = { name: string; course: string; weeklyGoal: number; email: string };
export type TimerType = "pomodoro" | "stopwatch";
export type TimerMode = "focus" | "break";
export type TimerState = {
  id: string; scope: "global" | "subject"; subjectId?: string; type: TimerType; mode: TimerMode;
  durationSeconds: number; remainingSeconds: number; elapsedSeconds: number; recordedSeconds: number; focusMinutes: number; breakMinutes: number;
  status: "paused" | "running"; startedAt: number | null; updatedAt: string;
};
export type DailyStat = { id: string; date: string; subjectId?: string; focusedSeconds: number; pomodoroCycles: number };
export type AppData = {
  version: 2; onboarded: boolean; profile: Profile; subjects: Subject[]; tasks: Task[];
  assignments: Assignment[]; flashcards: Flashcard[]; notebooks: Notebook[]; notes: Note[];
  timers: TimerState[]; stats: DailyStat[]; teams: Team[]; focusMinutes: number;
  subjectView: "grid" | "list";
};

export const emptyData: AppData = {
  version: 2, onboarded: false, profile: { name: "", course: "", weeklyGoal: 5, email: "" },
  subjects: [], tasks: [], assignments: [], flashcards: [], notebooks: [], notes: [], timers: [], stats: [], teams: [],
  focusMinutes: 0, subjectView: "grid",
};

export const createTimer = (scope: "global" | "subject", subjectId?: string): TimerState => ({
  id: scope === "global" ? "timer-global" : `timer-${subjectId}`, scope, subjectId, type: "pomodoro", mode: "focus",
  durationSeconds: 25 * 60, remainingSeconds: 25 * 60, elapsedSeconds: 0, recordedSeconds: 0, focusMinutes: 25, breakMinutes: 5, status: "paused", startedAt: null,
  updatedAt: new Date().toISOString(),
});

export function normalizeData(value: Partial<AppData> & { profile?: Profile }): AppData {
  const legacyTasks = Array.isArray(value.tasks) ? value.tasks : [];
  const legacyCards = Array.isArray(value.flashcards) ? value.flashcards : [];
  return {
    ...emptyData, ...value, version: 2,
    profile: { ...emptyData.profile, ...(value.profile ?? {}) },
    subjects: Array.isArray(value.subjects) ? value.subjects : [], tasks: legacyTasks,
    assignments: Array.isArray(value.assignments) ? value.assignments : [], flashcards: legacyCards.map((card) => ({ ...card, deck: card.deck || "Geral" })),
    notebooks: Array.isArray(value.notebooks) ? value.notebooks : [], notes: Array.isArray(value.notes) ? value.notes : [],
    timers: Array.isArray(value.timers) ? value.timers.map((timer) => ({ ...timer, recordedSeconds: timer.recordedSeconds || 0, focusMinutes: timer.focusMinutes || 25, breakMinutes: timer.breakMinutes || 5, status: "paused" as const, startedAt: null })) : [],
    stats: Array.isArray(value.stats) ? value.stats : [], teams: Array.isArray(value.teams) ? value.teams : [],
    subjectView: value.subjectView === "list" ? "list" : "grid",
  };
}

export function isBackupData(value: unknown): value is AppData {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<AppData>;
  return !!data.profile && typeof data.profile.name === "string" && Array.isArray(data.tasks) && Array.isArray(data.flashcards) &&
    (!data.subjects || Array.isArray(data.subjects)) && (!data.timers || Array.isArray(data.timers));
}

export const subjectName = (data: AppData, subjectId?: string) => data.subjects.find((item) => item.id === subjectId)?.title ?? "Geral";
export const formatTimer = (seconds: number, stopwatch = false) => {
  const safe = Math.max(0, Math.floor(seconds)); const hours = Math.floor(safe / 3600); const minutes = Math.floor((safe % 3600) / 60); const secs = safe % 60;
  return stopwatch || hours ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}` : `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};
