import { BarChart3, BookOpen, Clock3, GraduationCap, Home, Menu, Plus, Timer, UserRound, Users, X } from "lucide-react";
import "./Navbar.css";
export type PageId = "home" | "subjects" | "prazos" | "timer" | "flashcards" | "equipes" | "estatisticas" | "perfil";
const navItems = [{ id: "home", label: "Home", icon: Home }, { id: "subjects", label: "Matérias", icon: GraduationCap }, { id: "prazos", label: "Prazos", icon: Clock3 }, { id: "timer", label: "Timer", icon: Timer }, { id: "flashcards", label: "Flashcards", icon: BookOpen }, { id: "equipes", label: "Equipes", icon: Users }, { id: "estatisticas", label: "Estatísticas", icon: BarChart3 }, { id: "perfil", label: "Perfil", icon: UserRound }] as const;
type Props = { selected: PageId; onSelect: (page: PageId) => void; onQuickAction: () => void };
function Navbar({ selected, onSelect, onQuickAction }: Props) {
  const select = (id: PageId) => { onSelect(id); document.body.classList.remove("nav-open"); };
  return <aside id="navbar"><div className="nav-brand-row"><h3 id="nav-title"><span>Omni</span>Desk</h3><button className="icon-button nav-close" aria-label="Fechar menu" onClick={() => document.body.classList.remove("nav-open")}><X size={20} /></button></div><nav aria-label="Navegação principal">{navItems.map(({ id, label, icon: Icon }) => <button type="button" className={`nav-item ${selected === id ? "nav-item-selected" : ""}`} aria-current={selected === id ? "page" : undefined} onClick={() => select(id)} key={id}><Icon size={19} strokeWidth={1.8} /><span>{label}</span></button>)}</nav><button id="nav-button" onClick={onQuickAction}><Plus size={19} /> Nova ação</button><p className="nav-footer"><Menu size={14} /> Seu espaço de estudos</p></aside>;
}
export default Navbar;
