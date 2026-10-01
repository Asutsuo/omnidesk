import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  CheckSquare2,
  ChevronRight,
  Copy,
  ListChecks,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import {
  CHECKLIST_IMPORT_EXAMPLE,
  LIMITS,
  subjectName,
  type AppData,
  type Checklist,
  type ChecklistItem,
  type ChecklistSection,
} from "../data";
import { useDialog } from "../components/DialogModal";
import AiPromptModal from "../components/AiPromptModal";

type Props = {
  data: AppData;
  mutate: (updater: (data: AppData) => AppData) => void;
  fixedSubjectId?: string;
};

const now = () => new Date().toISOString();

const getSectionTitle = (line: string): string | null => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("```")) return null;
  const directiveMatch = trimmed.match(/^\[(?:SEÇÃO|SECAO|BLOCO):\s*(.+?)\]$/i);
  if (directiveMatch) return directiveMatch[1].trim();
  const mdHeadingMatch = trimmed.match(/^#{1,4}\s+(.+)$/);
  if (mdHeadingMatch) return mdHeadingMatch[1].trim();
  if (
    trimmed.length > 1 &&
    trimmed === trimmed.toLocaleUpperCase("pt-BR") &&
    /[A-ZÀ-Ú]/.test(trimmed) &&
    !/^(?:[□☐☑✓]|\d+\.|[-*])/.test(trimmed)
  ) {
    return trimmed;
  }
  return null;
};

const cleanItem = (line: string) =>
  line
    .replace(/^\s*(?:[□☐☑✓]|\d+\.|\*|[-*]\s*\[[ xX]\]|[-*])\s*/, "")
    .replace(/^\*\*(.+?)\*\*$/, "$1")
    .trim();

function Checklists({ data, mutate, fixedSubjectId }: Props) {
  const dialog = useDialog();
  const [openId, setOpenId] = useState<string>();
  const [showCreate, setShowCreate] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [copiedModel, setCopiedModel] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectionSection, setSelectionSection] = useState("all");
  const [targetSection, setTargetSection] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const lists = useMemo(
    () =>
      data.checklists
        .filter((list) =>
          fixedSubjectId ? list.subjectId === fixedSubjectId : true,
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [data.checklists, fixedSubjectId],
  );
  const open = data.checklists.find(
    (list) =>
      list.id === openId &&
      (!fixedSubjectId || list.subjectId === fixedSubjectId),
  );

  const touch = (current: AppData, checklistId: string) => ({
    ...current,
    checklists: current.checklists.map((list) =>
      list.id === checklistId ? { ...list, updatedAt: now() } : list,
    ),
  });
  const create = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subjectCount = data.checklists.filter(
      (list) => list.subjectId === fixedSubjectId,
    ).length;
    if (data.checklists.length >= LIMITS.checklists) {
      void dialog.alert({
        title: "Limite de checklists atingido",
        message: `O limite de ${LIMITS.checklists.toLocaleString("pt-BR")} checklists foi atingido.`,
      });
      return;
    }
    if (fixedSubjectId && subjectCount >= LIMITS.checklistsPerSubject) {
      void dialog.alert({
        title: "Limite de checklists da matéria atingido",
        message: `O limite de ${LIMITS.checklistsPerSubject.toLocaleString("pt-BR")} checklists para esta matéria foi atingido.`,
      });
      return;
    }
    const form = new FormData(event.currentTarget);
    const id = crypto.randomUUID();
    const createdAt = now();
    const subjectId =
      fixedSubjectId ?? (String(form.get("subjectId") || "") || undefined);
    const list: Checklist = {
      id,
      subjectId,
      title: String(form.get("title")).trim(),
      description: String(form.get("description")).trim(),
      createdAt,
      updatedAt: createdAt,
    };
    mutate((current) => ({
      ...current,
      checklists: [list, ...current.checklists],
    }));
    setOpenId(id);
    setShowCreate(false);
  };
  const rename = async (list: Checklist) => {
    const title = (
      await dialog.prompt({
        title: "Renomear checklist",
        defaultValue: list.title,
        confirmText: "Salvar",
      })
    )?.trim();
    if (title)
      mutate((current) => ({
        ...current,
        checklists: current.checklists.map((item) =>
          item.id === list.id
            ? { ...item, title: title.slice(0, LIMITS.title), updatedAt: now() }
            : item,
        ),
      }));
  };
  const removeList = async (list: Checklist) => {
    if (
      !(await dialog.confirm({
        title: `Excluir “${list.title}”?`,
        message:
          "Todos os itens e seções desta checklist serão removidos permanentemente.",
        danger: true,
        confirmText: "Excluir checklist",
      }))
    )
      return;
    mutate((current) => ({
      ...current,
      checklists: current.checklists.filter((item) => item.id !== list.id),
      checklistSections: current.checklistSections.filter(
        (section) => section.checklistId !== list.id,
      ),
      checklistItems: current.checklistItems.filter(
        (item) => item.checklistId !== list.id,
      ),
    }));
    setOpenId(undefined);
  };
  const addSection = async () => {
    if (!open) return;
    const sections = data.checklistSections.filter(
      (section) => section.checklistId === open.id,
    );
    if (sections.length >= LIMITS.checklistSections) {
      void dialog.alert({
        title: "Limite de seções atingido",
        message: `Um checklist pode ter no máximo ${LIMITS.checklistSections} seções.`,
      });
      return;
    }
    const title = (
      await dialog.prompt({
        title: "Nova seção",
        placeholder: "Ex.: Leitura e Teoria",
        confirmText: "Adicionar seção",
      })
    )?.trim();
    if (!title) return;
    mutate((current) =>
      touch(
        {
          ...current,
          checklistSections: [
            ...current.checklistSections,
            {
              id: crypto.randomUUID(),
              checklistId: open.id,
              title: title.slice(0, 120),
              order: sections.length,
            },
          ],
        },
        open.id,
      ),
    );
  };
  const addItem = async (sectionId?: string) => {
    if (!open) return;
    const items = data.checklistItems.filter(
      (item) => item.checklistId === open.id,
    );
    if (items.length >= LIMITS.checklistItemsPerList) {
      void dialog.alert({
        title: "Limite de itens do checklist atingido",
        message: `Um checklist pode ter no máximo ${LIMITS.checklistItemsPerList.toLocaleString("pt-BR")} itens.`,
      });
      return;
    }
    if (data.checklistItems.length >= LIMITS.checklistItems) {
      void dialog.alert({
        title: "Limite global de itens atingido",
        message: `O limite de ${LIMITS.checklistItems.toLocaleString("pt-BR")} itens foi atingido.`,
      });
      return;
    }
    const text = (
      await dialog.prompt({
        title: "Novo item",
        placeholder: "Ex.: Resolver exercícios da lista",
        confirmText: "Adicionar item",
      })
    )?.trim();
    if (!text) return;
    mutate((current) =>
      touch(
        {
          ...current,
          checklistItems: [
            ...current.checklistItems,
            {
              id: crypto.randomUUID(),
              checklistId: open.id,
              sectionId,
              text: text.slice(0, LIMITS.checklistItemText),
              completed: false,
              order: items.filter((item) => item.sectionId === sectionId)
                .length,
            },
          ],
        },
        open.id,
      ),
    );
  };
  const importItems = () => {
    if (!open) return;
    let currentSectionId: string | undefined;
    const createdSections = [...data.checklistSections];
    const createdItems = [...data.checklistItems];
    let sectionOrder = createdSections.filter(
      (section) => section.checklistId === open.id,
    ).length;
    const itemCounts = new Map<string, number>();

    bulkText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("```"))
      .forEach((line) => {
        const sectionTitle = getSectionTitle(line);
        if (sectionTitle && sectionOrder < LIMITS.checklistSections) {
          currentSectionId = crypto.randomUUID();
          createdSections.push({
            id: currentSectionId,
            checklistId: open.id,
            title: sectionTitle.slice(0, 120),
            order: sectionOrder++,
          });
          return;
        }
        const cleaned = cleanItem(line);
        if (!cleaned) return;
        const total = createdItems.filter(
          (item) => item.checklistId === open.id,
        ).length;
        if (
          total >= LIMITS.checklistItemsPerList ||
          createdItems.length >= LIMITS.checklistItems
        )
          return;
        const key = currentSectionId ?? "root";
        const order =
          itemCounts.get(key) ??
          createdItems.filter(
            (item) =>
              item.checklistId === open.id &&
              item.sectionId === currentSectionId,
          ).length;
        itemCounts.set(key, order + 1);
        createdItems.push({
          id: crypto.randomUUID(),
          checklistId: open.id,
          sectionId: currentSectionId,
          text: cleaned.slice(0, LIMITS.checklistItemText),
          completed: /^[☑✓]|^[-*]\s*\[[xX]\]/i.test(line),
          order,
        });
      });
    mutate((current) =>
      touch(
        {
          ...current,
          checklistSections: createdSections,
          checklistItems: createdItems,
        },
        open.id,
      ),
    );
    setBulkText("");
  };
  const toggle = (id: string) =>
    open &&
    mutate((current) =>
      touch(
        {
          ...current,
          checklistItems: current.checklistItems.map((item) =>
            item.id === id ? { ...item, completed: !item.completed } : item,
          ),
        },
        open.id,
      ),
    );
  const editItem = async (item: ChecklistItem) => {
    const text = (
      await dialog.prompt({
        title: "Editar item",
        defaultValue: item.text,
        confirmText: "Salvar",
      })
    )?.trim();
    if (text && open)
      mutate((current) =>
        touch(
          {
            ...current,
            checklistItems: current.checklistItems.map((entry) =>
              entry.id === item.id
                ? { ...entry, text: text.slice(0, LIMITS.checklistItemText) }
                : entry,
            ),
          },
          open.id,
        ),
      );
  };
  const deleteItem = (id: string) =>
    open &&
    mutate((current) =>
      touch(
        {
          ...current,
          checklistItems: current.checklistItems.filter(
            (item) => item.id !== id,
          ),
        },
        open.id,
      ),
    );
  const moveItem = (item: ChecklistItem, direction: -1 | 1) => {
    if (!open) return;
    const group = data.checklistItems
      .filter(
        (entry) =>
          entry.checklistId === open.id && entry.sectionId === item.sectionId,
      )
      .sort((a, b) => a.order - b.order);
    const index = group.findIndex((entry) => entry.id === item.id);
    const other = group[index + direction];
    if (!other) return;
    mutate((current) =>
      touch(
        {
          ...current,
          checklistItems: current.checklistItems.map((entry) =>
            entry.id === item.id
              ? { ...entry, order: other.order }
              : entry.id === other.id
                ? { ...entry, order: item.order }
                : entry,
          ),
        },
        open.id,
      ),
    );
  };
  const removeSection = async (id: string) => {
    if (
      !open ||
      !(await dialog.confirm({
        title: "Excluir seção?",
        message: "Todos os itens desta seção serão removidos permanentemente.",
        danger: true,
        confirmText: "Excluir seção",
      }))
    )
      return;
    mutate((current) =>
      touch(
        {
          ...current,
          checklistSections: current.checklistSections.filter(
            (section) => section.id !== id,
          ),
          checklistItems: current.checklistItems.filter(
            (item) => item.sectionId !== id,
          ),
        },
        open.id,
      ),
    );
  };
  const renameSection = async (section: ChecklistSection) => {
    const title = (
      await dialog.prompt({
        title: "Renomear seção",
        defaultValue: section.title,
        confirmText: "Salvar",
      })
    )?.trim();
    if (title && open)
      mutate((current) =>
        touch(
          {
            ...current,
            checklistSections: current.checklistSections.map((item) =>
              item.id === section.id
                ? { ...item, title: title.slice(0, 120) }
                : item,
            ),
          },
          open.id,
        ),
      );
  };
  const moveSection = (section: ChecklistSection, direction: -1 | 1) => {
    if (!open) return;
    const sections = data.checklistSections
      .filter((item) => item.checklistId === open.id)
      .sort((a, b) => a.order - b.order);
    const index = sections.findIndex((item) => item.id === section.id);
    const other = sections[index + direction];
    if (!other) return;
    mutate((current) =>
      touch(
        {
          ...current,
          checklistSections: current.checklistSections.map((item) =>
            item.id === section.id
              ? { ...item, order: other.order }
              : item.id === other.id
                ? { ...item, order: section.order }
                : item,
          ),
        },
        open.id,
      ),
    );
  };
  const moveToSection = (item: ChecklistItem, sectionId: string) => {
    if (!open) return;
    const nextSectionId = sectionId || undefined;
    const order = data.checklistItems.filter(
      (entry) =>
        entry.checklistId === open.id && entry.sectionId === nextSectionId,
    ).length;
    mutate((current) =>
      touch(
        {
          ...current,
          checklistItems: current.checklistItems.map((entry) =>
            entry.id === item.id
              ? { ...entry, sectionId: nextSectionId, order }
              : entry,
          ),
        },
        open.id,
      ),
    );
  };
  const clearCompleted = async () => {
    if (
      !open ||
      !(await dialog.confirm({
        title: "Limpar itens concluídos?",
        message: "Todos os itens marcados como feitos serão removidos.",
        danger: true,
        confirmText: "Limpar concluídos",
      }))
    )
      return;
    mutate((current) =>
      touch(
        {
          ...current,
          checklistItems: current.checklistItems.filter(
            (item) => item.checklistId !== open.id || !item.completed,
          ),
        },
        open.id,
      ),
    );
  };
  const selectChecklistItems = () => {
    if (!open) return;
    setSelectedItems(
      new Set(
        data.checklistItems
          .filter(
            (item) =>
              item.checklistId === open.id &&
              (selectionSection === "all" ||
                (selectionSection === "root"
                  ? !item.sectionId
                  : item.sectionId === selectionSection)),
          )
          .map((item) => item.id),
      ),
    );
  };
  const confirmChecklistBulk = async (count: number, action: string) =>
    await dialog.confirm({
      title: `${action} ${count} itens selecionados?`,
      danger: /excluir/i.test(action),
      confirmText: action,
    });
  const setSelectedStatus = async (completed: boolean) => {
    if (
      !open ||
      !selectedItems.size ||
      !(await confirmChecklistBulk(
        selectedItems.size,
        completed ? "Concluir" : "Reabrir",
      ))
    )
      return;
    mutate((current) =>
      touch(
        {
          ...current,
          checklistItems: current.checklistItems.map((item) =>
            selectedItems.has(item.id) ? { ...item, completed } : item,
          ),
        },
        open.id,
      ),
    );
  };
  const moveSelectedItems = async () => {
    if (
      !open ||
      !selectedItems.size ||
      !targetSection ||
      !(await confirmChecklistBulk(selectedItems.size, "Mover"))
    )
      return;
    const sectionId = targetSection === "root" ? undefined : targetSection;
    mutate((current) => {
      let order = current.checklistItems.filter(
        (item) =>
          item.checklistId === open.id &&
          item.sectionId === sectionId &&
          !selectedItems.has(item.id),
      ).length;
      return touch(
        {
          ...current,
          checklistItems: current.checklistItems.map((item) =>
            selectedItems.has(item.id)
              ? { ...item, sectionId, order: order++ }
              : item,
          ),
        },
        open.id,
      );
    });
    setTargetSection("");
  };
  const deleteSelectedItems = async () => {
    if (
      !open ||
      !selectedItems.size ||
      !(await confirmChecklistBulk(
        selectedItems.size,
        "Excluir permanentemente",
      ))
    )
      return;
    mutate((current) =>
      touch(
        {
          ...current,
          checklistItems: current.checklistItems.filter(
            (item) => !selectedItems.has(item.id),
          ),
        },
        open.id,
      ),
    );
    setSelectedItems(new Set());
  };

  const isOrganizing = bulkMode || selectedItems.size > 0;

  const renderItems = (sectionId?: string) =>
    !open
      ? null
      : data.checklistItems
          .filter(
            (item) =>
              item.checklistId === open.id && item.sectionId === sectionId,
          )
          .sort((a, b) => a.order - b.order)
          .map((item) => (
            <div
              className={`checklist-item ${item.completed ? "completed" : ""} ${selectedItems.has(item.id) ? "bulk-selected" : ""} ${isOrganizing ? "is-organizing" : ""}`}
              key={item.id}
            >
              {isOrganizing && (
                <input
                  className="bulk-check"
                  type="checkbox"
                  checked={selectedItems.has(item.id)}
                  onChange={() =>
                    setSelectedItems((current) => {
                      const next = new Set(current);
                      if (next.has(item.id)) next.delete(item.id);
                      else next.add(item.id);
                      return next;
                    })
                  }
                  aria-label="Selecionar item"
                />
              )}
              <button
                className="checklist-check"
                onClick={() => toggle(item.id)}
                aria-label={item.completed ? "Desmarcar item" : "Concluir item"}
              >
                {item.completed && <Check size={14} />}
              </button>
              <button
                className="checklist-item-text"
                onDoubleClick={() => editItem(item)}
              >
                {item.text}
              </button>
              {isOrganizing && (
                <select
                  className="checklist-move-select"
                  value={item.sectionId ?? ""}
                  onChange={(event) => moveToSection(item, event.target.value)}
                  aria-label="Mover para seção"
                >
                  <option value="">Itens gerais</option>
                  {data.checklistSections
                    .filter((section) => section.checklistId === open.id)
                    .sort((a, b) => a.order - b.order)
                    .map((section) => (
                      <option value={section.id} key={section.id}>
                        {section.title}
                      </option>
                    ))}
                </select>
              )}
              <div className="checklist-item-actions">
                <button
                  onClick={() => moveItem(item, -1)}
                  aria-label="Mover para cima"
                >
                  <ArrowUp />
                </button>
                <button
                  onClick={() => moveItem(item, 1)}
                  aria-label="Mover para baixo"
                >
                  <ArrowDown />
                </button>
                <button onClick={() => editItem(item)} aria-label="Editar">
                  <Pencil />
                </button>
                <button
                  className="danger"
                  onClick={() => deleteItem(item.id)}
                  aria-label="Excluir"
                >
                  <Trash2 />
                </button>
              </div>
            </div>
          ));

  if (open) {
    const items = data.checklistItems.filter(
      (item) => item.checklistId === open.id,
    );
    const done = items.filter((item) => item.completed).length;
    const sections = data.checklistSections
      .filter((section) => section.checklistId === open.id)
      .sort((a, b) => a.order - b.order);
    return (
      <div className="checklist-editor">
        <div className="checklist-editor-header">
          <button className="text-button" onClick={() => setOpenId(undefined)}>
            <ArrowLeft size={17} /> Checklists
          </button>
          <div>
            <span className="eyebrow">
              {subjectName(data, open.subjectId).toUpperCase()}
            </span>
            <h2>{open.title}</h2>
            <p>
              {open.description ||
                "Organize os itens e acompanhe seu progresso."}
            </p>
          </div>
          <div className="checklist-editor-actions">
            <button
              className={`secondary-button ${isOrganizing ? "active" : ""}`}
              onClick={() => {
                if (isOrganizing) {
                  setBulkMode(false);
                  setSelectedItems(new Set());
                } else {
                  setBulkMode(true);
                }
              }}
              title="Organizar e mover itens em lote"
            >
              <ListChecks size={16} /> {isOrganizing ? "Sair da organização" : "Organizar em lote"}
            </button>
            {done > 0 && (
              <button className="secondary-button" onClick={clearCompleted}>
                <Check size={16} /> Limpar concluídos
              </button>
            )}
            <button className="secondary-button" onClick={() => rename(open)}>
              <Pencil size={16} /> Renomear
            </button>
            <button
              className="icon-button danger"
              onClick={() => removeList(open)}
              aria-label="Excluir checklist"
            >
              <Trash2 />
            </button>
          </div>
        </div>
        <div className="checklist-progress">
          <div>
            <strong>
              {done} de {items.length} concluídos
            </strong>
            <span>
              {items.length ? Math.round((done / items.length) * 100) : 0}%
            </span>
          </div>
          <progress
            max="100"
            value={items.length ? (done / items.length) * 100 : 0}
          />
        </div>
        {isOrganizing && (
          <section className="panel bulk-manager checklist-bulk">
            <div className="bulk-manager-head">
              <div>
                <strong>Gerenciar itens</strong>
                <small>{selectedItems.size} selecionados</small>
              </div>
              <select
                value={selectionSection}
                onChange={(event) => setSelectionSection(event.target.value)}
              >
                <option value="all">Todos os itens</option>
                <option value="root">Itens gerais</option>
                {sections.map((section) => (
                  <option value={section.id} key={section.id}>
                    {section.title}
                  </option>
                ))}
              </select>
              <button className="secondary-button" onClick={selectChecklistItems}>
                <CheckSquare2 /> Selecionar
              </button>
              <button
                className="text-button"
                onClick={() => setSelectedItems(new Set())}
              >
                Limpar
              </button>
            </div>
            {selectedItems.size > 0 && (
              <div className="bulk-edit-row">
                <button
                  className="secondary-button"
                  onClick={() => setSelectedStatus(true)}
                >
                  Concluir
                </button>
                <button
                  className="secondary-button"
                  onClick={() => setSelectedStatus(false)}
                >
                  Reabrir
                </button>
                <select
                  value={targetSection}
                  onChange={(event) => setTargetSection(event.target.value)}
                >
                  <option value="">Mover para...</option>
                  <option value="root">Itens gerais</option>
                  {sections.map((section) => (
                    <option value={section.id} key={section.id}>
                      {section.title}
                    </option>
                  ))}
                </select>
                <button
                  className="secondary-button"
                  disabled={!targetSection}
                  onClick={moveSelectedItems}
                >
                  Mover
                </button>
                <button
                  className="secondary-button danger-outline"
                  onClick={deleteSelectedItems}
                >
                  <Trash2 /> Excluir selecionados
                </button>
              </div>
            )}
          </section>
        )}
        <section className="checklist-group ungrouped">
          <div className="checklist-group-title">
            <h3>Itens gerais</h3>
            <button onClick={() => addItem()}>
              <Plus size={15} /> Item
            </button>
          </div>
          {renderItems(undefined)}
        </section>
        {sections.map((section) => (
          <section className="checklist-group" key={section.id}>
            <div className="checklist-group-title">
              <h3>{section.title}</h3>
              <div>
                <button
                  onClick={() => moveSection(section, -1)}
                  aria-label="Mover seção para cima"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  onClick={() => moveSection(section, 1)}
                  aria-label="Mover seção para baixo"
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  onClick={() => renameSection(section)}
                  aria-label="Renomear seção"
                >
                  <Pencil size={15} />
                </button>
                <button onClick={() => addItem(section.id)}>
                  <Plus size={15} /> Item
                </button>
                <button
                  className="danger"
                  onClick={() => removeSection(section.id)}
                  aria-label="Excluir seção"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            {renderItems(section.id)}
          </section>
        ))}
        <div className="checklist-tools panel">
          <div>
            <h3>Adicionar vários itens</h3>
            <p>
              Use uma linha por item. Seções podem usar{" "}
              <code>[SEÇÃO: Nome]</code>, <code>## Nome</code> ou texto em{" "}
              <code>CAIXA ALTA</code>.
            </p>
            <div className="checklist-model-actions">
              <button
                type="button"
                className="text-button"
                onClick={() => setBulkText(CHECKLIST_IMPORT_EXAMPLE)}
              >
                Preencher exemplo
              </button>
              <button
                type="button"
                className="text-button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      CHECKLIST_IMPORT_EXAMPLE,
                    );
                    setCopiedModel(true);
                    setTimeout(() => setCopiedModel(false), 2000);
                  } catch {
                    setBulkText(CHECKLIST_IMPORT_EXAMPLE);
                  }
                }}
              >
                <Copy size={13} /> {copiedModel ? "Copiado!" : "Copiar modelo"}
              </button>
              <button
                type="button"
                className="secondary-button ai-trigger-btn"
                onClick={() => setAiModalOpen(true)}
              >
                <Sparkles size={14} /> Gerar com IA
              </button>
            </div>
          </div>
          <textarea
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
            placeholder={
              "[SEÇÃO: Leitura e Teoria]\n- [ ] Ler capítulo 1\n- [ ] Sublinhar conceitos fundamentais\n\n[SEÇÃO: Prática]\n- [ ] Resolver 10 exercícios"
            }
          />
          <div>
            <button className="secondary-button" onClick={addSection}>
              <Plus size={16} /> Nova seção
            </button>
            <button
              className="primary-button"
              disabled={!bulkText.trim()}
              onClick={importItems}
            >
              Adicionar conteúdo
            </button>
          </div>
        </div>
        {aiModalOpen && (
          <AiPromptModal
            initialType="checklists"
            subjectTitle={open ? subjectName(data, open.subjectId) : undefined}
            onClose={() => setAiModalOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={fixedSubjectId ? "checklists-content" : "page checklists-page"}
    >
      <div className="page-toolbar">
        <div>
          <span className="eyebrow">
            {fixedSubjectId ? "ORGANIZAÇÃO DA MATÉRIA" : "TODAS AS CHECKLISTS"}
          </span>
          <p className="muted">
            {lists.length} {lists.length === 1 ? "checklist" : "checklists"}
          </p>
        </div>
        <div className="heading-actions">
          <button
            className="secondary-button ai-trigger-btn"
            onClick={() => setAiModalOpen(true)}
          >
            <Sparkles size={16} /> Gerar com IA
          </button>
          <button
            className="primary-button"
            onClick={() => setShowCreate(!showCreate)}
          >
            <Plus size={18} /> Nova checklist
          </button>
        </div>
      </div>
      {showCreate && (
        <form className="checklist-create panel" onSubmit={create}>
          <label>
            Título
            <input name="title" maxLength={LIMITS.title} required autoFocus />
          </label>
          <label>
            Descrição <span className="optional">opcional</span>
            <input name="description" maxLength={500} />
          </label>
          {!fixedSubjectId && (
            <label>
              Matéria
              <select name="subjectId">
                <option value="">Geral</option>
                {data.subjects.map((subject) => (
                  <option value={subject.id} key={subject.id}>
                    {subject.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button className="primary-button">Criar</button>
        </form>
      )}
      <div className="checklist-grid">
        {lists.map((list) => {
          const items = data.checklistItems.filter(
            (item) => item.checklistId === list.id,
          );
          const done = items.filter((item) => item.completed).length;
          const percentage = items.length
            ? Math.round((done / items.length) * 100)
            : 0;
          return (
            <article className="checklist-card" key={list.id}>
              <button onClick={() => setOpenId(list.id)}>
                <span className="checklist-card-icon">
                  <ListChecks />
                </span>
                <div>
                  <small>{subjectName(data, list.subjectId)}</small>
                  <h3>{list.title}</h3>
                  <p>
                    {items.length
                      ? `${done} de ${items.length} itens`
                      : "Nenhum item ainda"}
                  </p>
                  <progress max="100" value={percentage} />
                </div>
                <ChevronRight />
              </button>
            </article>
          );
        })}
        {!lists.length && (
          <div className="empty-state panel empty-wide">
            <CheckSquare2 />
            <h3>Nenhuma checklist</h3>
            <p>Crie listas com seções e acompanhe cada etapa do seu estudo.</p>
            <button
              className="primary-button"
              onClick={() => setShowCreate(true)}
            >
              <Plus size={18} /> Criar checklist
            </button>
          </div>
        )}
      </div>
      {aiModalOpen && (
        <AiPromptModal
          initialType="checklists"
          subjectTitle={
            fixedSubjectId ? subjectName(data, fixedSubjectId) : undefined
          }
          onClose={() => setAiModalOpen(false)}
        />
      )}
    </div>
  );
}

export default Checklists;
