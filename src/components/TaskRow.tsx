import { CalendarDays, Check, Trash2 } from "lucide-react";
import type { Task } from "../data";
const formatDate = (value: string) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(`${value}T12:00:00`));
type Props = { task: Task; onToggle: (id: string) => void; onRemove?: (id: string) => void; compact?: boolean };
export function TaskRow({ task, onToggle, onRemove, compact }: Props) {
  return <div className={`task-row ${task.completed ? "completed" : ""}`}><button className="check-button" aria-label={task.completed ? "Marcar como pendente" : "Concluir tarefa"} onClick={() => onToggle(task.id)}>{task.completed && <Check size={14} />}</button><div className="task-info"><strong>{task.title}</strong><span>{task.subject}</span></div><span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span><span className="task-date"><CalendarDays size={15} /> {formatDate(task.dueDate)}</span>{onRemove && !compact && <button className="icon-button danger" aria-label="Excluir tarefa" onClick={() => onRemove(task.id)}><Trash2 size={17} /></button>}</div>;
}
