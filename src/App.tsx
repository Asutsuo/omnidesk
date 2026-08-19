import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import Navbar, { type PageId } from "./components/Navbar";
import QuickActionModal from "./components/QuickActionModal";
import { defaultData, type AppData, type Flashcard, type Task } from "./data";
import Equipes from "./pages/Equipes";
import Estatisticas from "./pages/Estatisticas";
import Flashcards from "./pages/Flashcards";
import Home from "./pages/Home";
import Perfil from "./pages/Perfil";
import Prazos from "./pages/Prazos";
import Timer from "./pages/Timer";
import "./App.css";

const pageMeta: Record<PageId, { title: string; subtitle: string }> = {
  home: { title: "Olá, Daniel", subtitle: "Aqui está o seu dia" }, prazos: { title: "Prazos", subtitle: "Organize suas entregas" },
  timer: { title: "Timer", subtitle: "Mantenha o foco" }, flashcards: { title: "Flashcards", subtitle: "Revise e memorize" },
  equipes: { title: "Equipes", subtitle: "Aprenda em conjunto" }, estatisticas: { title: "Estatísticas", subtitle: "Acompanhe sua evolução" },
  perfil: { title: "Seu perfil", subtitle: "Preferências e objetivos" },
};

function loadData(): AppData {
  try { const stored = localStorage.getItem("omnidesk-data"); return stored ? { ...defaultData, ...JSON.parse(stored) } : defaultData; }
  catch { return defaultData; }
}

function App() {
  const [page, setPage] = useState<PageId>("home");
  const [data, setData] = useState<AppData>(loadData);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  useEffect(() => { localStorage.setItem("omnidesk-data", JSON.stringify(data)); }, [data]);

  const actions = useMemo(() => ({
    addTask: (task: Omit<Task, "id" | "completed">) => setData((current) => ({ ...current, tasks: [{ ...task, id: crypto.randomUUID(), completed: false }, ...current.tasks] })),
    toggleTask: (id: string) => setData((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === id ? { ...task, completed: !task.completed } : task) })),
    removeTask: (id: string) => setData((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== id) })),
    addCard: (card: Omit<Flashcard, "id" | "mastered">) => setData((current) => ({ ...current, flashcards: [...current.flashcards, { ...card, id: crypto.randomUUID(), mastered: false }] })),
    toggleCard: (id: string) => setData((current) => ({ ...current, flashcards: current.flashcards.map((card) => card.id === id ? { ...card, mastered: !card.mastered } : card) })),
    addFocusMinutes: (minutes: number) => setData((current) => ({ ...current, focusMinutes: current.focusMinutes + minutes })),
  }), []);

  const content: Record<PageId, React.ReactNode> = {
    home: <Home data={data} onNavigate={setPage} onToggleTask={actions.toggleTask} />,
    prazos: <Prazos tasks={data.tasks} onAdd={actions.addTask} onToggle={actions.toggleTask} onRemove={actions.removeTask} />,
    timer: <Timer onSessionComplete={actions.addFocusMinutes} />,
    flashcards: <Flashcards cards={data.flashcards} onAdd={actions.addCard} onToggleMastered={actions.toggleCard} />,
    equipes: <Equipes teams={data.teams} />,
    estatisticas: <Estatisticas data={data} />,
    perfil: <Perfil profile={data.profile} onSave={(profile) => setData((current) => ({ ...current, profile }))} />,
  };

  return <div id="app"><Navbar selected={page} onSelect={setPage} onQuickAction={() => setQuickActionOpen(true)} /><section id="content-area"><Header {...pageMeta[page]} onMenu={() => document.body.classList.toggle("nav-open")} />{content[page]}</section>{quickActionOpen && <QuickActionModal onClose={() => setQuickActionOpen(false)} onAddTask={actions.addTask} onAddCard={actions.addCard} />}</div>;
}

export default App;
