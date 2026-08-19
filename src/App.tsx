import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "./components/Header";
import Navbar, { type PageId } from "./components/Navbar";
import Onboarding from "./components/Onboarding";
import QuickActionModal from "./components/QuickActionModal";
import { pauseTimer } from "./timerUtils";
import { emptyData, LIMITS, type AppData, type Assignment, type Checklist, type Flashcard, type Profile, type Subject, type Team, type TimerState } from "./data";
import { loadAppData, requestPersistentStorage, saveAppData } from "./storage";
import Equipes from "./pages/Equipes";
import Estatisticas from "./pages/Estatisticas";
import Flashcards from "./pages/Flashcards";
import Checklists from "./pages/Checklists";
import Home from "./pages/Home";
import Perfil from "./pages/Perfil";
import Prazos from "./pages/Prazos";
import Subjects from "./pages/Subjects";
import SubjectWorkspace from "./pages/SubjectWorkspace";
import Timer from "./pages/Timer";
import "./App.css";

const pageMeta: Record<PageId, { title: string; subtitle: string }> = {
  home: { title: "Olá", subtitle: "Aqui está o seu dia" }, subjects: { title: "Matérias", subtitle: "Seus espaços de aprendizagem" },
  prazos: { title: "Trabalhos", subtitle: "Projetos, entregas e prazos importantes" }, checklists: { title: "Checklists", subtitle: "Organize conteúdos e acompanhe cada etapa" }, timer: { title: "Timer", subtitle: "Uma sessão de estudo geral" },
  flashcards: { title: "Flashcards", subtitle: "Revise cartões de todas as matérias" }, equipes: { title: "Equipes", subtitle: "Organize seus grupos de estudo" },
  estatisticas: { title: "Estatísticas", subtitle: "Acompanhe sua evolução" }, perfil: { title: "Seu perfil", subtitle: "Preferências, dados e backup" },
};

const replaceTimer = (timers: TimerState[], timer: TimerState) => [...timers.filter((item) => item.id !== timer.id), timer];
const localDateKey = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; };
const recordTimerProgress = (data: AppData, timer: TimerState) => {
  const sessionSeconds = timer.type === "stopwatch" ? timer.elapsedSeconds : timer.mode === "focus" ? Math.max(0, timer.durationSeconds - timer.remainingSeconds) : 0;
  const addedSeconds = Math.max(0, sessionSeconds - timer.recordedSeconds); const updatedTimer = { ...timer, recordedSeconds: sessionSeconds };
  if (!addedSeconds) return { ...data, timers: replaceTimer(data.timers, updatedTimer) };
  const date = localDateKey(); const statId = `${date}:${timer.subjectId ?? "global"}`; const existing = data.stats.find((item) => item.id === statId);
  const stat = { id: statId, date, subjectId: timer.subjectId, focusedSeconds: (existing?.focusedSeconds ?? 0) + addedSeconds, pomodoroCycles: existing?.pomodoroCycles ?? 0 };
  return { ...data, timers: replaceTimer(data.timers, updatedTimer), stats: [...data.stats.filter((item) => item.id !== statId), stat], focusMinutes: data.focusMinutes + addedSeconds / 60 };
};
const pauseRunning = (data: AppData, except?: string) => {
  let next = data;
  data.timers.forEach((timer) => { if (timer.status === "running" && timer.id !== except) next = recordTimerProgress(next, pauseTimer(timer)); });
  return next;
};

function App() {
  const [page, setPage] = useState<PageId>("home"); const [subjectId, setSubjectId] = useState<string>();
  const [data, setData] = useState<AppData>(emptyData); const [loading, setLoading] = useState(true); const [storageError, setStorageError] = useState(""); const [quickActionOpen, setQuickActionOpen] = useState(false);
  const loaded = useRef(false); const dataRef = useRef(data); const tabId = useRef(crypto.randomUUID()); const suppressNextSave = useRef(false);
  useEffect(() => { dataRef.current = data; }, [data]);
  useEffect(() => { if (!loaded.current) return; document.documentElement.dataset.theme = data.theme; localStorage.setItem("omnidesk-theme", data.theme); const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]'); if (meta) meta.content = getComputedStyle(document.documentElement).getPropertyValue("--default-color").trim(); }, [data.theme]);
  useEffect(() => { loadAppData().then((stored) => { setData(stored); loaded.current = true; setLoading(false); }).catch(() => { setStorageError("Não foi possível acessar o armazenamento deste navegador."); setLoading(false); }); }, []);
  useEffect(() => { if (!loaded.current) return; if (suppressNextSave.current) { suppressNextSave.current = false; return; } const timeout = window.setTimeout(() => saveAppData(data).catch(() => setStorageError("Não foi possível salvar a última alteração.")), 180); return () => clearTimeout(timeout); }, [data]);

  // Checkpoints reduzem perda de tempo em encerramentos abruptos sem gravar a cada segundo.
  useEffect(() => { const interval = window.setInterval(() => setData((current) => { if (!current.timers.some((timer) => timer.status === "running")) return current; const now = Date.now(); return { ...current, timers: current.timers.map((timer) => timer.status === "running" ? { ...pauseTimer(timer, now), status: "running", startedAt: now } : timer) }; }), 5000); return () => clearInterval(interval); }, []);
  useEffect(() => {
    const pauseAndSave = () => { const paused = pauseRunning(dataRef.current); dataRef.current = paused; setData(paused); void saveAppData(paused); };
    const visibility = () => { if (document.visibilityState === "hidden") pauseAndSave(); };
    const anotherTabStarted = (event: StorageEvent) => { if (event.key === "omnidesk-active-timer" && event.newValue && !event.newValue.startsWith(tabId.current)) { suppressNextSave.current = true; setData((current) => pauseRunning(current)); } };
    document.addEventListener("visibilitychange", visibility); window.addEventListener("pagehide", pauseAndSave); window.addEventListener("storage", anotherTabStarted);
    return () => { document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pagehide", pauseAndSave); window.removeEventListener("storage", anotherTabStarted); };
  }, []);

  const mutate = useCallback((updater: (data: AppData) => AppData) => setData(updater), []);
  const updateData = useCallback((next: AppData) => { const paused = pauseRunning(next); setData(paused); void saveAppData(paused).catch(() => setStorageError("Não foi possível salvar os dados.")); }, []);
  const addSubject = useCallback((subject: Omit<Subject, "id" | "createdAt">) => setData((current) => current.subjects.length >= LIMITS.subjects ? current : ({ ...current, subjects: [...current.subjects, { ...subject, id: crypto.randomUUID(), createdAt: new Date().toISOString() }] })), []);
  const removeSubject = useCallback((id: string) => setData((current) => { const checklistIds = new Set(current.checklists.filter((item) => item.subjectId === id).map((item) => item.id)); return { ...current, subjects: current.subjects.filter((item) => item.id !== id), assignments: current.assignments.filter((item) => item.subjectId !== id), checklists: current.checklists.filter((item) => item.subjectId !== id), checklistSections: current.checklistSections.filter((item) => !checklistIds.has(item.checklistId)), checklistItems: current.checklistItems.filter((item) => !checklistIds.has(item.checklistId)), flashcards: current.flashcards.filter((item) => item.subjectId !== id), notebooks: current.notebooks.filter((item) => item.subjectId !== id), notes: current.notes.filter((item) => item.subjectId !== id), timers: current.timers.filter((item) => item.subjectId !== id), stats: current.stats.filter((item) => item.subjectId !== id) }; }), []);
  const timerUpdate = useCallback((timer: TimerState) => setData((current) => timer.status === "paused" ? recordTimerProgress(current, timer) : ({ ...current, timers: replaceTimer(current.timers, timer) })), []);
  const timerStart = useCallback((timer: TimerState) => { localStorage.setItem("omnidesk-active-timer", `${tabId.current}:${timer.id}:${Date.now()}`); setData((current) => { const paused = pauseRunning(current, timer.id); return { ...paused, timers: replaceTimer(paused.timers, timer) }; }); }, []);
  const timerDelete = useCallback((id: string) => setData((current) => ({ ...current, timers: current.timers.filter((item) => item.id !== id) })), []);
  const timerComplete = useCallback((timer: TimerState, seconds: number) => setData((current) => { const date = localDateKey(); const statId = `${date}:${timer.subjectId ?? "global"}`; const existing = current.stats.find((item) => item.id === statId); const addedSeconds = Math.max(0, seconds - timer.recordedSeconds); const stat = { id: statId, date, subjectId: timer.subjectId, focusedSeconds: (existing?.focusedSeconds ?? 0) + addedSeconds, pomodoroCycles: (existing?.pomodoroCycles ?? 0) + (timer.type === "pomodoro" && timer.mode === "focus" ? 1 : 0) }; const nextMode = timer.type === "pomodoro" && timer.mode === "focus" ? "break" : "focus"; const duration = (nextMode === "break" ? timer.breakMinutes : timer.focusMinutes) * 60; const nextTimer = timer.type === "pomodoro" ? { ...timer, mode: nextMode as "focus" | "break", durationSeconds: duration, remainingSeconds: duration, recordedSeconds: 0, status: "paused" as const, startedAt: null } : { ...pauseTimer(timer), recordedSeconds: seconds }; return { ...current, timers: replaceTimer(current.timers, nextTimer), stats: [...current.stats.filter((item) => item.id !== statId), stat], focusMinutes: current.focusMinutes + addedSeconds / 60 }; }), []);
  const navigate = (next: PageId) => { setData((current) => pauseRunning(current)); setSubjectId(undefined); setPage(next); document.body.classList.remove("nav-open"); };

  const actions = useMemo(() => ({
    addAssignment: (assignment: Omit<Assignment, "id" | "completed">) => setData((current) => current.assignments.length >= LIMITS.assignments || (assignment.subjectId && current.assignments.filter((item) => item.subjectId === assignment.subjectId).length >= LIMITS.assignmentsPerSubject) ? current : ({ ...current, assignments: [{ ...assignment, id: crypto.randomUUID(), completed: false }, ...current.assignments] })),
    addChecklist: (checklist: Pick<Checklist, "title" | "description" | "subjectId">) => setData((current) => current.checklists.length >= LIMITS.checklists || (checklist.subjectId && current.checklists.filter((item) => item.subjectId === checklist.subjectId).length >= LIMITS.checklistsPerSubject) ? current : ({ ...current, checklists: [{ ...checklist, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...current.checklists] })),
    addCard: (card: Omit<Flashcard, "id" | "mastered">) => setData((current) => current.flashcards.length >= LIMITS.flashcards || (card.subjectId && current.flashcards.filter((item) => item.subjectId === card.subjectId).length >= LIMITS.flashcardsPerSubject) ? current : ({ ...current, flashcards: [...current.flashcards, { ...card, id: crypto.randomUUID(), mastered: false }] })), toggleCard: (id: string) => setData((current) => ({ ...current, flashcards: current.flashcards.map((card) => card.id === id ? { ...card, mastered: !card.mastered } : card) })), removeCard: (id: string) => setData((current) => ({ ...current, flashcards: current.flashcards.filter((card) => card.id !== id) })),
    addTeam: (team: Omit<Team, "id">) => setData((current) => current.teams.length >= LIMITS.teams ? current : ({ ...current, teams: [...current.teams, { ...team, members: team.members.slice(0, LIMITS.teamMembers), id: crypto.randomUUID() }] })), removeTeam: (id: string) => setData((current) => ({ ...current, teams: current.teams.filter((team) => team.id !== id) })),
  }), []);

  if (loading) return <div className="app-loading"><span className="loader" /><strong>OmniDesk</strong><p>Preparando seu espaço...</p></div>;
  if (!data.onboarded) return <Onboarding error={storageError} onComplete={(profile: Profile) => { const next = { ...data, profile, onboarded: true as const }; loaded.current = true; updateData(next); void requestPersistentStorage(); }} onImport={updateData} />;
  const currentSubject = subjectId ? data.subjects.find((item) => item.id === subjectId) : undefined;
  if (currentSubject) return <SubjectWorkspace data={data} subjectId={currentSubject.id} mutate={mutate} onBack={() => { setData((current) => pauseRunning(current)); setSubjectId(undefined); }} onTimerStart={timerStart} onTimerUpdate={timerUpdate} onTimerDelete={timerDelete} onTimerComplete={timerComplete} />;

  const meta = page === "home" ? { ...pageMeta.home, title: `Olá, ${data.profile.name.split(" ")[0]}` } : pageMeta[page]; const globalTimer = data.timers.find((item) => item.scope === "global");
  const content: Record<PageId, React.ReactNode> = {
    home: <Home data={data} onNavigate={navigate} onOpenSubject={setSubjectId} mutate={mutate} />,
    subjects: <Subjects data={data} onOpen={setSubjectId} onAdd={addSubject} onRemove={removeSubject} onViewChange={(subjectView) => setData((current) => ({ ...current, subjectView }))} />,
    prazos: <Prazos data={data} mutate={mutate} />,
    checklists: <Checklists data={data} mutate={mutate} />,
    timer: <Timer timer={globalTimer} onStart={timerStart} onUpdate={timerUpdate} onDelete={timerDelete} onComplete={timerComplete} />,
    flashcards: <Flashcards cards={data.flashcards} subjects={data.subjects} onAdd={actions.addCard} onToggleMastered={actions.toggleCard} onRemove={actions.removeCard} />,
    equipes: <Equipes teams={data.teams} onAdd={actions.addTeam} onRemove={actions.removeTeam} />, estatisticas: <Estatisticas data={data} />,
    perfil: <Perfil data={data} onSave={(profile) => setData((current) => ({ ...current, profile }))} onTheme={(theme) => setData((current) => ({ ...current, theme }))} onImport={updateData} />,
  };
  return <div id="app"><Navbar selected={page} onSelect={navigate} onQuickAction={() => setQuickActionOpen(true)} /><section id="content-area"><Header {...meta} initials={data.profile.name.slice(0, 2).toUpperCase()} avatar={data.profile.avatar} onMenu={() => document.body.classList.toggle("nav-open")} />{storageError && <button className="storage-alert" onClick={() => setStorageError("")}>{storageError} ×</button>}{content[page]}</section>{quickActionOpen && <QuickActionModal subjects={data.subjects} onClose={() => setQuickActionOpen(false)} onAddAssignment={actions.addAssignment} onAddChecklist={actions.addChecklist} onAddCard={actions.addCard} onAddSubject={addSubject} />}</div>;
}
export default App;
