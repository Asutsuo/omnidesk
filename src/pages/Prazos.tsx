import { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarPlus,
  CheckCircle2,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Assignment, AppData } from "../data";
import { LIMITS, subjectName } from "../data";

type Props = {
  data: AppData;
  mutate: (updater: (data: AppData) => AppData) => void;
};

export default function Prazos({ data, mutate }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Assignment>();
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const assignments = useMemo(() => {
    const filtered = filter === "pending"
      ? data.assignments.filter((item) => !item.completed)
      : filter === "completed"
        ? data.assignments.filter((item) => item.completed)
        : data.assignments;
    return filtered.slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [data.assignments, filter]);

  const closeForm = () => {
    setEditing(undefined);
    setShowForm(false);
  };

  const openNew = () => {
    if (showForm && !editing) {
      closeForm();
      return;
    }

    setEditing(undefined);
    setShowForm(true);
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const subjectId = String(form.get("subjectId") || "") || undefined;

    if (!editing && data.assignments.length >= LIMITS.assignments) return;
    if (
      !editing &&
      subjectId &&
      data.assignments.filter((item) => item.subjectId === subjectId).length >=
        LIMITS.assignmentsPerSubject
    ) {
      return;
    }

    const values = {
      title: String(form.get("title") || "").trim(),
      description: String(form.get("description") || "").trim(),
      subjectId,
      dueDate: String(form.get("dueDate") || ""),
      priority: String(form.get("priority") || "Média") as Assignment["priority"],
    };

    if (!values.title || !values.dueDate) return;

    const nextAssignments = editing
      ? data.assignments.map((item) =>
          item.id === editing.id ? { ...item, ...values } : item,
        )
      : [
          ...data.assignments,
          { id: crypto.randomUUID(), completed: false, ...values },
        ];

    mutate((current) => ({ ...current, assignments: nextAssignments }));
    closeForm();
  };

  const startEditing = (assignment: Assignment) => {
    setEditing(assignment);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleCompleted = (id: string) => {
    mutate((current) => ({
      ...current,
      assignments: current.assignments.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    }));
  };

  const remove = (id: string) => {
    if (!window.confirm("Excluir este trabalho?")) return;
    mutate((current) => ({
      ...current,
      assignments: current.assignments.filter((item) => item.id !== id),
    }));
    if (editing?.id === id) closeForm();
  };

  return (
    <main className="page prazos-page">
      <section className="page-toolbar">
        <div>
          <span className="eyebrow">Projetos e entregas</span>
          <p>{data.assignments.length} trabalhos cadastrados</p>
        </div>
        <button
          className="primary-button"
          type="button"
          onClick={openNew}
          disabled={!showForm && data.assignments.length >= LIMITS.assignments}
        >
          <CalendarPlus size={18} />
          {showForm && !editing ? "Cancelar" : "Novo trabalho"}
        </button>
      </section>

      {showForm && (
        <form key={editing?.id ?? "new"} className="inline-form panel global-deadline-form" onSubmit={submit}>
          <label>
            Título
            <input
              name="title"
              defaultValue={editing?.title}
              placeholder="Ex.: Primeira volta completa do edital"
              maxLength={LIMITS.title}
              required
              autoFocus
            />
          </label>
          <label>
            Matéria opcional
            <select name="subjectId" defaultValue={editing?.subjectId ?? ""}>
              <option value="">Geral / sem matéria</option>
              {data.subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Descrição
            <input
              name="description"
              defaultValue={editing?.description}
              placeholder="Contexto ou resultado esperado"
              maxLength={10_000}
            />
          </label>
          <label>
            Entrega
            <input name="dueDate" type="date" defaultValue={editing?.dueDate} required />
          </label>
          <label>
            Prioridade
            <select name="priority" defaultValue={editing?.priority ?? "Média"}>
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
            </select>
          </label>
          <div className="form-actions">
            <button className="primary-button" type="submit">
              {editing ? "Salvar alterações" : "Adicionar"}
            </button>
            {editing && (
              <button className="text-button" type="button" onClick={closeForm}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Visão geral</span>
            <h2>{assignments.length} trabalhos</h2>
          </div>
          <div className="simple-filters" aria-label="Filtrar trabalhos">
            <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
              Todos
            </button>
            <button
              className={filter === "pending" ? "active" : ""}
              onClick={() => setFilter("pending")}
            >
              Pendentes
            </button>
            <button
              className={filter === "completed" ? "active" : ""}
              onClick={() => setFilter("completed")}
            >
              Concluídos
            </button>
          </div>
        </div>

        {assignments.length === 0 ? (
          <div className="empty-state">
            <BriefcaseBusiness size={30} />
            <h3>Nenhum trabalho por aqui</h3>
            <p>Crie um projeto geral ou vincule-o a uma matéria quando fizer sentido.</p>
          </div>
        ) : (
          <div className="task-list full">
            {assignments.map((item) => (
              <article key={item.id} className={`assignment-row ${item.completed ? "completed" : ""}`}>
                <button
                  className="check-button"
                  type="button"
                  onClick={() => toggleCompleted(item.id)}
                  aria-label={item.completed ? "Reabrir trabalho" : "Concluir trabalho"}
                >
                  {item.completed && <CheckCircle2 size={17} />}
                </button>
                <div>
                  <strong>{item.title}</strong>
                  <small>
                    {subjectName(data, item.subjectId)} · {item.description || "Sem descrição"}
                  </small>
                </div>
                <span className={`priority priority-${item.priority.toLowerCase()}`}>
                  {item.priority}
                </span>
                <time dateTime={item.dueDate}>
                  {new Date(`${item.dueDate}T12:00:00`).toLocaleDateString("pt-BR")}
                </time>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => startEditing(item)}
                  aria-label={`Editar ${item.title}`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="icon-button danger"
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label={`Excluir ${item.title}`}
                >
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
