import {
  Check,
  CheckCircle2,
  FileInput,
  Layers3,
  Pencil,
  Plus,
  RotateCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { LIMITS, type Flashcard, type Subject } from "../data";
import { useDialog } from "../components/DialogModal";
import AiPromptModal from "../components/AiPromptModal";
import {
  parseFlashcardsText,
  FLASHCARD_IMPORT_EXAMPLE,
  type FlashcardParseResult,
} from "../flashcardParser";

type NewCard = Omit<Flashcard, "id" | "mastered">;
type BulkChanges = {
  deck?: string;
  subjectId?: string;
  subject?: string;
  mastered?: boolean;
};
type Props = {
  cards: Flashcard[];
  subjects: Subject[];
  fixedSubject?: Subject;
  onAdd: (card: NewCard) => void;
  onAddMany: (cards: NewCard[]) => void;
  onToggleMastered: (id: string) => void;
  onUpdateMany: (ids: string[], changes: BulkChanges) => void;
  onRemove: (id: string) => void;
  onRemoveMany: (ids: string[]) => void;
};
const EXAMPLE = FLASHCARD_IMPORT_EXAMPLE;

function Flashcards({
  cards,
  subjects,
  fixedSubject,
  onAdd,
  onAddMany,
  onToggleMastered,
  onUpdateMany,
  onRemove,
  onRemoveMany,
}: Props) {
  const dialog = useDialog();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [preview, setPreview] = useState<FlashcardParseResult | undefined>();
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [deck, setDeck] = useState("Todos");
  const [bulkText, setBulkText] = useState(EXAMPLE);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectDeck, setSelectDeck] = useState("");
  const [editDeck, setEditDeck] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const decks = useMemo(
    () => ["Todos", ...new Set(cards.map((item) => item.deck || "Geral"))],
    [cards],
  );
  const visible =
    deck === "Todos"
      ? cards
      : cards.filter((item) => (item.deck || "Geral") === deck);
  const card = visible[index % Math.max(visible.length, 1)];
  const next = () => {
    if (visible.length) setIndex((value) => (value + 1) % visible.length);
    setFlipped(false);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const subjectId =
      fixedSubject?.id || String(form.get("subjectId") || "") || undefined;
    const subject =
      fixedSubject?.title ||
      subjects.find((item) => item.id === subjectId)?.title ||
      "Geral";
    onAdd({
      question: String(form.get("question")).trim(),
      answer: String(form.get("answer")).trim(),
      subject,
      subjectId,
      deck: String(form.get("deck")).trim() || "Geral",
    });
    event.currentTarget.reset();
    setShowForm(false);
  };
  const validate = () => {
    setPreview(parseFlashcardsText(bulkText, subjects, fixedSubject));
  };
  const confirmImport = () => {
    if (!preview?.cards.length || preview.errors.length) return;
    const available = Math.max(
      0,
      (fixedSubject ? LIMITS.flashcardsPerSubject : LIMITS.flashcards) -
        cards.length,
    );
    onAddMany(preview.cards.slice(0, available));
    setShowImport(false);
    setPreview(undefined);
  };
  const selectVisible = () =>
    setSelected(new Set(visible.map((item) => item.id)));
  const selectByDeck = () =>
    setSelected(
      new Set(
        cards.filter((item) => item.deck === selectDeck).map((item) => item.id),
      ),
    );
  const clearSelection = () => setSelected(new Set());
  const confirmBulk = async (count: number, action: string) =>
    await dialog.confirm({
      title: `${action} ${count} cartões selecionados?`,
      message: "Esta alteração em massa não poderá ser desfeita.",
      danger: /excluir/i.test(action),
      confirmText: action,
    });
  const applyBulk = async () => {
    if (!selected.size) return;
    const changes: BulkChanges = {};
    if (editDeck.trim()) changes.deck = editDeck.trim().slice(0, 80);
    if (!fixedSubject && editSubject) {
      const target = subjects.find((item) => item.id === editSubject);
      changes.subjectId = editSubject === "general" ? undefined : editSubject;
      changes.subject = target?.title ?? "Geral";
    }
    if (
      !Object.keys(changes).length ||
      !(await confirmBulk(selected.size, "Editar"))
    )
      return;
    onUpdateMany([...selected], changes);
    setEditDeck("");
    clearSelection();
  };
  const removeSelected = async () => {
    if (
      !selected.size ||
      !(await confirmBulk(selected.size, "Excluir permanentemente"))
    )
      return;
    onRemoveMany([...selected]);
    clearSelection();
    setIndex(0);
  };
  return (
    <main className={fixedSubject ? "cards-content" : "page flashcards-page"}>
      <div className="page-toolbar">
        <div>
          <span className="eyebrow">
            {fixedSubject
              ? `FLASHCARDS · ${fixedSubject.title.toUpperCase()}`
              : "TODOS OS FLASHCARDS"}
          </span>
          <p className="muted">
            {cards.filter((item) => item.mastered).length} de {cards.length}{" "}
            dominados
          </p>
        </div>
        <div className="heading-actions">
          <button
            className="secondary-button ai-trigger-btn"
            onClick={() => setAiModalOpen(true)}
          >
            <Sparkles /> Gerar com IA
          </button>
          <button
            className="secondary-button"
            onClick={() => setShowImport(!showImport)}
          >
            <FileInput /> Importar vários
          </button>
          <button
            className="primary-button"
            disabled={
              cards.length >=
              (fixedSubject ? LIMITS.flashcardsPerSubject : LIMITS.flashcards)
            }
            onClick={() => setShowForm(!showForm)}
          >
            <Plus /> Novo cartão
          </button>
        </div>
      </div>
      {decks.length > 1 && (
        <div className="deck-filter">
          <Layers3 />
          {decks.map((item) => (
            <button
              className={deck === item ? "active" : ""}
              onClick={() => {
                setDeck(item);
                setIndex(0);
              }}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
      )}
      {showForm && (
        <form
          className="inline-form panel card-form advanced"
          onSubmit={submit}
        >
          {!fixedSubject && (
            <label>
              Matéria
              <select name="subjectId">
                <option value="">Geral</option>
                {subjects.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Bloco
            <input name="deck" maxLength={80} placeholder="Geral" />
          </label>
          <label>
            Pergunta
            <input name="question" maxLength={1000} required />
          </label>
          <label>
            Resposta
            <input name="answer" maxLength={5000} required />
          </label>
          <button className="primary-button">Criar cartão</button>
        </form>
      )}
      {showImport && (
        <section className="panel flashcard-import">
          <div>
            <h3>Importar flashcards</h3>
            <p>
              Use <code>Pergunta :: Resposta</code>. Diretivas de bloco e
              matéria organizam os cartões seguintes.
            </p>
          </div>
          <textarea
            value={bulkText}
            onChange={(event) => {
              setBulkText(event.target.value);
              setPreview(undefined);
            }}
          />
          <div className="import-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setAiModalOpen(true)}
            >
              <Sparkles size={14} /> Prompt para IA
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setShowImport(false);
                setPreview(undefined);
              }}
            >
              Cancelar
            </button>
            <button type="button" className="primary-button" onClick={validate}>
              Validar cartões
            </button>
          </div>
          {preview && (
            <div
              className={`import-result ${preview.errors.length ? "has-errors" : ""}`}
            >
              <strong>
                {preview.cards.length}{" "}
                {preview.cards.length === 1
                  ? "cartão válido reconhecido"
                  : "cartões válidos reconhecidos"}
              </strong>
              {preview.errors.map((error) => (
                <small key={error}>{error}</small>
              ))}
              {preview.cards.slice(0, 3).map((item, idx) => (
                <article className="import-preview" key={idx}>
                  <b>
                    {idx + 1}. {item.question}
                  </b>
                  <span>
                    Bloco: {item.deck} · Matéria: {item.subject}
                  </span>
                </article>
              ))}
              {preview.cards.length > 3 && (
                <small>+ {preview.cards.length - 3} cartões reconhecidos</small>
              )}
              {!preview.errors.length && !!preview.cards.length && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={confirmImport}
                >
                  Importar {preview.cards.length} cartões
                </button>
              )}
            </div>
          )}
        </section>
      )}
      {!!cards.length && (
        <section className="panel bulk-manager">
          <div className="bulk-manager-head">
            <div>
              <strong>Gerenciar cartões</strong>
              <small>{selected.size} selecionados</small>
            </div>
            <button className="secondary-button" onClick={selectVisible}>
              <Check /> Selecionar visíveis
            </button>
            <select
              value={selectDeck}
              onChange={(event) => setSelectDeck(event.target.value)}
            >
              <option value="">Selecionar por bloco</option>
              {decks
                .filter((item) => item !== "Todos")
                .map((item) => (
                  <option key={item}>{item}</option>
                ))}
            </select>
            <button
              className="secondary-button"
              disabled={!selectDeck}
              onClick={selectByDeck}
            >
              Selecionar bloco
            </button>
            <button className="text-button" onClick={clearSelection}>
              Limpar
            </button>
          </div>
          {selected.size > 0 && (
            <div className="bulk-edit-row">
              <input
                value={editDeck}
                onChange={(event) => setEditDeck(event.target.value)}
                placeholder="Mover para o bloco..."
              />
              {!fixedSubject && (
                <select
                  value={editSubject}
                  onChange={(event) => setEditSubject(event.target.value)}
                >
                  <option value="">Manter matéria</option>
                  <option value="general">Geral</option>
                  {subjects.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              )}
              <button className="secondary-button" onClick={applyBulk}>
                <Pencil /> Aplicar edição
              </button>
              <button
                className="secondary-button danger-outline"
                onClick={removeSelected}
              >
                <Trash2 /> Excluir selecionados
              </button>
            </div>
          )}
          <div className="bulk-card-list">
            {visible.map((item) => (
              <label key={item.id}>
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() =>
                    setSelected((current) => {
                      const nextSet = new Set(current);
                      if (nextSet.has(item.id)) nextSet.delete(item.id);
                      else nextSet.add(item.id);
                      return nextSet;
                    })
                  }
                />
                <span>
                  <strong>{item.question}</strong>
                  <small>
                    {item.subject} · {item.deck}
                  </small>
                </span>
              </label>
            ))}
          </div>
        </section>
      )}
      {card ? (
        <section className="study-area">
          <button
            className={`flashcard ${flipped ? "flipped" : ""}`}
            onClick={() => setFlipped(!flipped)}
          >
            <span className="eyebrow">
              {flipped
                ? "RESPOSTA"
                : `${card.subject.toUpperCase()} · ${(card.deck || "Geral").toUpperCase()}`}
            </span>
            <strong>{flipped ? card.answer : card.question}</strong>
            <small>
              <RotateCw /> Clique para virar
            </small>
          </button>
          <div className="study-actions">
            <button
              className="secondary-button danger-outline"
              onClick={async () => {
                if (
                  await dialog.confirm({
                    title: "Excluir este cartão?",
                    danger: true,
                    confirmText: "Excluir",
                  })
                ) {
                  onRemove(card.id);
                  setIndex(0);
                }
              }}
            >
              <Trash2 /> Excluir
            </button>
            <button className="secondary-button" onClick={next}>
              Ainda estudando
            </button>
            <button
              className="primary-button"
              onClick={() => {
                onToggleMastered(card.id);
                next();
              }}
            >
              <CheckCircle2 /> {card.mastered ? "Revisar novamente" : "Já sei"}
            </button>
          </div>
          <p className="card-position">
            Cartão {index + 1} de {visible.length}
          </p>
        </section>
      ) : (
        <div className="empty-state panel">
          <Sparkles />
          <h3>Nenhum flashcard</h3>
          <p>Crie ou importe cartões para começar a revisar.</p>
        </div>
      )}
      {aiModalOpen && (
        <AiPromptModal
          initialType="flashcards"
          subjectTitle={fixedSubject?.title}
          onClose={() => setAiModalOpen(false)}
        />
      )}
    </main>
  );
}
export default Flashcards;
