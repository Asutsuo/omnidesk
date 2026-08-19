import { Bell, Menu, Search } from "lucide-react";
import "./Header.css";
type HeaderProps = { title: string; subtitle: string; onMenu: () => void };
function Header({ title, subtitle, onMenu }: HeaderProps) {
  return <header className="header"><button className="icon-button mobile-menu" aria-label="Abrir menu" onClick={onMenu}><Menu /></button><div className="header-title-area"><h1 className="header-title">{title}</h1><p className="header-subtitle">{subtitle}</p></div><div className="header-actions"><label className="search-box"><Search size={18} /><input aria-label="Buscar" placeholder="Buscar..." /></label><button className="icon-button notification" aria-label="Notificações"><Bell size={20} /><span /></button><div className="avatar">DA</div></div></header>;
}
export default Header;
