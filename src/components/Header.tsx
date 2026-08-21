import { Flame, Menu } from "lucide-react";
import "./Header.css";
type HeaderProps = { title: string; subtitle: string; initials: string; avatar?: string; streak: number; onMenu: () => void };
function Header({ title, subtitle, initials, avatar, streak, onMenu }: HeaderProps) {
  return <header className="header"><button className="icon-button mobile-menu" aria-label="Abrir menu" onClick={onMenu}><Menu /></button><div className="header-title-area"><h1 className="header-title">{title}</h1><p className="header-subtitle">{subtitle}</p></div><div className="header-actions"><div className="header-streak" title={`${streak} ${streak === 1 ? "dia seguido" : "dias seguidos"}`} aria-label={`Sequência atual: ${streak} dias`}><Flame className="streak-flame" /><strong>{streak}</strong></div><div className="avatar" aria-label="Perfil do usuário">{avatar ? <img src={avatar} alt="" /> : initials}</div></div></header>;
}
export default Header;
