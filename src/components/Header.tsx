import { Menu } from "lucide-react";
import "./Header.css";
type HeaderProps = { title: string; subtitle: string; initials: string; onMenu: () => void };
function Header({ title, subtitle, initials, onMenu }: HeaderProps) {
  return <header className="header"><button className="icon-button mobile-menu" aria-label="Abrir menu" onClick={onMenu}><Menu /></button><div className="header-title-area"><h1 className="header-title">{title}</h1><p className="header-subtitle">{subtitle}</p></div><div className="header-actions"><div className="avatar" aria-label="Perfil do usuário">{initials}</div></div></header>;
}
export default Header;
