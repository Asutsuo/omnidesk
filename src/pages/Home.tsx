import { ArrowRight, BarChart3, BookOpen, BriefcaseBusiness, Check, CheckSquare2, Clock3, Flame, GraduationCap, Settings2, Timer, Users } from "lucide-react";
import { useState } from "react";
import type { PageId } from "../components/Navbar";
import { formatTimer, subjectName, type AppData, type HomeShortcut } from "../data";

type Props = { data: AppData; onNavigate: (page: PageId) => void; onOpenSubject: (id: string) => void; mutate: (updater: (data: AppData) => AppData) => void };
const shortcutOptions = [
  { id: "subjects", label: "Abrir matérias", description: "Continue uma matéria específica", icon: GraduationCap },
  { id: "prazos", label: "Ver trabalhos", description: "Acompanhe entregas e prazos", icon: BriefcaseBusiness },
  { id: "checklists", label: "Abrir checklists", description: "Acompanhe conteúdos e etapas", icon: CheckSquare2 },
  { id: "timer", label: "Iniciar foco", description: "Abra o timer de estudo geral", icon: Timer },
  { id: "flashcards", label: "Revisar cartões", description: "Veja todos os seus flashcards", icon: BookOpen },
  { id: "equipes", label: "Abrir equipes", description: "Consulte seus grupos de estudo", icon: Users },
  { id: "estatisticas", label: "Ver progresso", description: "Analise sua evolução recente", icon: BarChart3 },
] as const;

function Home({ data, onNavigate, onOpenSubject, mutate }: Props) {
  const [editingShortcuts, setEditingShortcuts] = useState(false);
  const pending = data.assignments.filter((item) => !item.completed).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const completedItems = data.checklistItems.filter((item) => item.completed).length;
  const progress = data.checklistItems.length ? Math.round(completedItems / data.checklistItems.length * 100) : 0;
  const globalTimer = data.timers.find((item) => item.scope === "global"); const totalSeconds = data.stats.reduce((sum, item) => sum + item.focusedSeconds, 0);
  const formatDate = (value: string) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(`${value}T12:00:00`));
  const toggleShortcut = (id: HomeShortcut) => mutate((current) => { const selected = current.homeShortcuts.includes(id); if (selected && current.homeShortcuts.length === 1) return current; if (!selected && current.homeShortcuts.length >= 4) return current; return { ...current, homeShortcuts: selected ? current.homeShortcuts.filter((item) => item !== id) : [...current.homeShortcuts, id] }; });
  const shortcuts = data.homeShortcuts.map((id) => shortcutOptions.find((item) => item.id === id)).filter((item) => item !== undefined);

  return <main className="page">
    {globalTimer && <button className="global-timer-strip" onClick={() => onNavigate("timer")}><Timer size={18} /><span><strong>{globalTimer.type === "pomodoro" ? "Sua sessão geral está pronta" : "Cronômetro geral salvo"}</strong><small>{formatTimer(globalTimer.type === "pomodoro" ? globalTimer.remainingSeconds : globalTimer.elapsedSeconds, globalTimer.type === "stopwatch")} · {globalTimer.status === "running" ? "em andamento" : "pausado"}</small></span><ArrowRight /></button>}
    <section className="welcome-card"><div><span className="eyebrow"><Flame size={15} /> SEU RITMO, DO SEU JEITO</span><h2>Um pouco de foco hoje<br />faz uma grande diferença.</h2><p>Você já registrou <strong>{Math.floor(totalSeconds / 3600)}h {Math.floor(totalSeconds % 3600 / 60)}min</strong> de estudo focado.</p><button className="primary-button" onClick={() => onNavigate("timer")}><Timer size={18} /> Estudar agora</button></div><div className="progress-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}><div><strong>{progress}%</strong><span>itens concluídos</span></div></div></section>
    <section className="stats-grid"><article className="stat-card"><span className="stat-icon orange"><Clock3 /></span><div><small>Próxima entrega</small><strong>{pending[0] ? formatDate(pending[0].dueDate) : "Tudo em dia"}</strong></div></article><article className="stat-card"><span className="stat-icon blue"><BookOpen /></span><div><small>Flashcards</small><strong>{data.flashcards.length} cartões</strong></div></article><article className="stat-card"><span className="stat-icon green"><GraduationCap /></span><div><small>Matérias</small><strong>{data.subjects.length} criadas</strong></div></article></section>
    {data.subjects.length > 0 && <section className="panel recent-subjects"><div className="panel-heading"><div><span className="eyebrow">SEUS ESPAÇOS</span><h3>Matérias recentes</h3></div><button className="text-button" onClick={() => onNavigate("subjects")}>Ver todas <ArrowRight size={16} /></button></div><div>{data.subjects.slice(-4).reverse().map((subject) => { const waiting = data.assignments.filter((item) => item.subjectId === subject.id && !item.completed).length; const lists = data.checklists.filter((item) => item.subjectId === subject.id).length; return <button style={{ "--subject-color": subject.color } as React.CSSProperties} onClick={() => onOpenSubject(subject.id)} key={subject.id}><span className="subject-dot" /><strong>{subject.title}</strong><small>{waiting} trabalhos · {lists} checklists</small><ArrowRight /></button>; })}</div></section>}
    <section className="dashboard-grid home-dashboard"><article className="panel"><div className="panel-heading"><div><span className="eyebrow">AGENDA</span><h3>Próximas entregas</h3></div><button className="text-button" onClick={() => onNavigate("prazos")}>Ver todas <ArrowRight size={16} /></button></div><div className="home-deadlines">{pending.slice(0, 3).map((item) => <button onClick={() => onNavigate("prazos")} key={item.id}><span className="stat-icon orange"><BriefcaseBusiness /></span><span><strong>{item.title}</strong><small>{subjectName(data, item.subjectId)} · {formatDate(item.dueDate)}</small></span><ArrowRight /></button>)}{!pending.length && <div className="empty-state"><BriefcaseBusiness /><p>Nenhum trabalho pendente.</p></div>}</div></article>
      <article className="panel quick-panel customizable"><div className="panel-heading"><div><span className="eyebrow">ATALHOS</span><h3>O que vamos fazer?</h3></div><button className={`shortcut-settings ${editingShortcuts ? "active" : ""}`} onClick={() => setEditingShortcuts(!editingShortcuts)} aria-label="Personalizar atalhos"><Settings2 size={17} /></button></div>{editingShortcuts ? <div className="shortcut-editor"><p>Escolha de 1 a 4 atalhos para a sua Home.</p><div>{shortcutOptions.map(({ id, label, icon: Icon }) => { const selected = data.homeShortcuts.includes(id); return <button className={selected ? "selected" : ""} onClick={() => toggleShortcut(id)} key={id}><Icon /><span>{label}</span>{selected && <Check />}</button>; })}</div><button className="primary-button" onClick={() => setEditingShortcuts(false)}>Concluir</button></div> : shortcuts.map(({ id, label, description, icon: Icon }) => <button onClick={() => onNavigate(id)} key={id}><Icon /><span><strong>{label}</strong><small>{description}</small></span><ArrowRight /></button>)}</article>
    </section>
  </main>;
}
export default Home;
