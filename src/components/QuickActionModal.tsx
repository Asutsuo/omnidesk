import { BookOpen, BriefcaseBusiness, CheckSquare2, GraduationCap, Link2, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { SUBJECT_COLORS, type Assignment, type Checklist, type Flashcard, type StudyResource, type Subject } from "../data";
import { inferResourceType, normalizeResourceUrl } from "../resourceUtils";

type ActionType = "work" | "checklist" | "card" | "resource" | "subject";
type Props = {
  subjects: Subject[];
  onClose: () => void;
  onAddAssignment: (assignment: Omit<Assignment, "id" | "completed">) => void;
  onAddChecklist: (checklist: Pick<Checklist, "title" | "description" | "subjectId">) => void;
  onAddCard: (card: Omit<Flashcard, "id" | "mastered">) => void;
  onAddResource: (resource: Omit<StudyResource, "id" | "createdAt" | "updatedAt">) => void;
  onAddSubject: (subject: Omit<Subject, "id" | "createdAt">) => void;
};

function QuickActionModal({ subjects, onClose, onAddAssignment, onAddChecklist, onAddCard, onAddResource, onAddSubject }: Props) {
  const [type, setType] = useState<ActionType>("work"); const [color, setColor] = useState(SUBJECT_COLORS[0]); const [error, setError] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); const form = new FormData(event.currentTarget); const subjectId = String(form.get("subjectId") || "") || undefined; const name = subjects.find((item) => item.id === subjectId)?.title ?? "Geral";
    try {
      if (type === "work") onAddAssignment({ title: String(form.get("title")).trim(), description: String(form.get("description")).trim(), dueDate: String(form.get("dueDate")), priority: String(form.get("priority")) as Assignment["priority"], subjectId });
      else if (type === "checklist") onAddChecklist({ title: String(form.get("title")).trim(), description: String(form.get("description")).trim(), subjectId });
      else if (type === "card") onAddCard({ question: String(form.get("question")).trim(), answer: String(form.get("answer")).trim(), subject: name, subjectId, deck: String(form.get("deck")).trim() || "Geral" });
      else if (type === "resource") { const url = normalizeResourceUrl(String(form.get("url"))); onAddResource({ title: String(form.get("title")).trim(), url, type: inferResourceType(url), description: "", tags: [], collection: String(form.get("collection")).trim(), subjectId }); }
      else onAddSubject({ title: String(form.get("title")).trim(), color });
      onClose();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível adicionar este item."); }
  };
  const tabs: Array<{ id: ActionType; label: string; icon: typeof BookOpen }> = [{ id: "work", label: "Trabalho", icon: BriefcaseBusiness }, { id: "checklist", label: "Checklist", icon: CheckSquare2 }, { id: "card", label: "Flashcard", icon: BookOpen }, { id: "resource", label: "Link", icon: Link2 }, { id: "subject", label: "Matéria", icon: GraduationCap }];
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="quick-title"><div className="modal-header"><div><span className="eyebrow">AÇÃO RÁPIDA</span><h2 id="quick-title">Adicionar à sua rotina</h2></div><button className="icon-button" onClick={onClose} aria-label="Fechar"><X /></button></div><div className="action-tabs quick-action-tabs">{tabs.map(({ id, label, icon: Icon }) => <button className={type === id ? "active" : ""} onClick={() => { setType(id); setError(""); }} key={id}><Icon /> {label}</button>)}</div><form className="modal-form" onSubmit={submit}>{type === "work" && <><label>Título<input name="title" maxLength={160} autoFocus required /></label><label>Descrição <span className="optional">opcional</span><input name="description" maxLength={10_000} /></label><label>Entrega<input name="dueDate" type="date" required /></label><label>Prioridade<select name="priority"><option>Média</option><option>Alta</option><option>Baixa</option></select></label></>}{type === "checklist" && <><label>Título<input name="title" maxLength={160} autoFocus required /></label><label>Descrição <span className="optional">opcional</span><input name="description" maxLength={500} /></label></>}{type === "card" && <><label>Pergunta<input name="question" maxLength={1000} autoFocus required /></label><label>Resposta<textarea name="answer" maxLength={5000} required /></label><label>Bloco<input name="deck" placeholder="Geral" maxLength={80} /></label></>}{type === "resource" && <><label>Título<input name="title" maxLength={160} autoFocus required /></label><label>Endereço<input name="url" inputMode="url" placeholder="youtube.com/..." required /></label><label>Coleção <span className="optional">opcional</span><input name="collection" maxLength={80} placeholder="Ex.: Vídeos de revisão" /></label></>}{type === "subject" ? <><label>Nome da matéria<input name="title" maxLength={80} autoFocus required /></label><fieldset className="modal-colors"><legend>Cor</legend>{SUBJECT_COLORS.map((item) => <button type="button" className={color === item ? "selected" : ""} style={{ background: item }} onClick={() => setColor(item)} key={item} />)}</fieldset></> : <label>Matéria <span className="optional">opcional</span><select name="subjectId"><option value="">Geral / sem matéria</option>{subjects.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>}{error && <p className="resource-error" role="alert">{error}</p>}<button className="primary-button">Adicionar</button></form></section></div>;
}
export default QuickActionModal;
