import { CalendarDays, MessageCircle, Plus, Users } from "lucide-react";
import type { Team } from "../data";
function Equipes({ teams }: { teams: Team[] }) {
  return <main className="page"><div className="page-toolbar"><p className="muted">Troque materiais, organize encontros e avance com sua turma.</p><button className="primary-button"><Plus size={18} /> Criar equipe</button></div><section className="team-grid">{teams.map((team) => <article className="panel team-card" key={team.id}><div className="team-icon"><Users /></div><span className="eyebrow">{team.subject}</span><h3>{team.name}</h3><p><CalendarDays size={16} /> Próximo encontro: <strong>{team.nextMeeting}</strong></p><div className="team-footer"><div className="avatar-stack">{team.members.map((member) => <span key={member}>{member}</span>)}</div><button className="icon-button" aria-label="Abrir conversa"><MessageCircle size={19} /></button></div></article>)}<button className="new-team-card"><Plus /><strong>Nova equipe</strong><span>Convide seus colegas</span></button></section></main>;
}
export default Equipes;
