/* eslint-disable @typescript-eslint/no-unused-expressions */
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileInput,
  Pause,
  Pencil,
  Play,
  Plus,
  Search,
  Shuffle,
  Sparkles,
  Timer,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  formatTimer,
  LIMITS,
  subjectName,
  type AppData,
  type Question,
  type SimulationAttempt,
  type SimulationMode,
} from "../data";
import {
  parseQuestionsText,
  QUESTION_IMPORT_EXAMPLE,
  type QuestionParseResult,
} from "../questionParser";
import { useDialog } from "../components/DialogModal";
import AiPromptModal from "../components/AiPromptModal";
import SimulationTimelineChart from "../components/SimulationTimelineChart";

type Props = {
  data: AppData;
  mutate: (updater: (data: AppData) => AppData) => void;
  fixedSubjectId?: string;
  embedded?: boolean;
  onContextChange?: (segments: string[]) => void;
};
type Tab = "bank" | "simulations" | "history";
const shuffled = <T,>(values: T[]) => {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
const now = () => new Date().toISOString();
const resultTone = (attempt: SimulationAttempt) =>
  attempt.status !== "completed"
    ? "pending"
    : (attempt.score ?? 0) < attempt.passingScore
      ? "failed"
      : (attempt.score ?? 0) < attempt.passingScore + 1
        ? "near"
        : "passed";

function Questoes({
  data,
  mutate,
  fixedSubjectId,
  embedded,
  onContextChange,
}: Props) {
  const dialog = useDialog();
  const [tab, setTab] = useState<Tab>("bank");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState(fixedSubjectId ?? "all");
  const [collection, setCollection] = useState("all");
  const [category, setCategory] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [alternatives, setAlternatives] = useState(["", "", "", ""]);
  const [editing, setEditing] = useState<Question>();
  const [importText, setImportText] = useState(QUESTION_IMPORT_EXAMPLE);
  const [preview, setPreview] = useState<QuestionParseResult>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeAttempt, setActiveAttempt] = useState<string>();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseReason, setPauseReason] = useState<
    "manual" | "inactivity" | "visibility"
  >("manual");
  const [formMode, setFormMode] = useState<SimulationMode>("fixacao");
  const [reviewing, setReviewing] = useState<string>();
  const [bulkSubject, setBulkSubject] = useState("");
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [importCollectionOverride, setImportCollectionOverride] = useState("");
  const [importSuccessInfo, setImportSuccessInfo] = useState<{
    count: number;
    collection: string;
    ids: string[];
  }>();
  const [builderTitle, setBuilderTitle] = useState("");

  const confirmBulk = async (count: number, action: string) =>
    await dialog.confirm({
      title: `${action} ${count} questões selecionadas?`,
      message: "Esta alteração em massa pode afetar modelos de simulados.",
      danger: /excluir/i.test(action),
      confirmText: action,
    });

  const normalizeCollectionTitle = (title: string) => {
    return title
      .trim()
      .replace(/\s+/g, " ")
      .split(" ")
      .map((word) => {
        if (
          word.length <= 2 &&
          /^(de|da|do|das|dos|e|em|na|no|nas|nos|para|por|com)$/i.test(word)
        ) {
          return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
  };

  const activeSubjectFilter = fixedSubjectId ?? subjectFilter;

  // Questions strictly within the current view scope (subject or all)
  const scopedQuestions = useMemo(
    () =>
      data.questions.filter(
        (item) => !fixedSubjectId || item.subjectId === fixedSubjectId,
      ),
    [data.questions, fixedSubjectId],
  );

  // In global view, further narrow by the subject filter dropdown
  const contextQuestions = useMemo(
    () =>
      scopedQuestions.filter(
        (item) =>
          fixedSubjectId
            ? true
            : activeSubjectFilter === "all"
              ? true
              : activeSubjectFilter === ""
                ? !item.subjectId
                : item.subjectId === activeSubjectFilter,
      ),
    [scopedQuestions, fixedSubjectId, activeSubjectFilter],
  );

  // Unique collections for current context, grouped case-insensitively
  const collections = useMemo(() => {
    const map = new Map<string, string>();
    for (const q of contextQuestions) {
      const col = q.collection?.trim();
      if (!col) continue;
      const key = col.toLowerCase();
      if (!map.has(key)) {
        map.set(key, col);
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.localeCompare(b, "pt-BR", { sensitivity: "base" }),
    );
  }, [contextQuestions]);

  // Unique categories for current context
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const q of contextQuestions) {
      for (const cat of q.categories) {
        if (cat.trim()) set.add(cat.trim());
      }
    }
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, "pt-BR", { sensitivity: "base" }),
    );
  }, [contextQuestions]);

  const effectiveCollection = useMemo(
    () =>
      collection === "all" ||
      collections.some(
        (c) =>
          c.localeCompare(collection, "pt-BR", { sensitivity: "base" }) === 0,
      )
        ? collection
        : "all",
    [collection, collections],
  );

  const effectiveCategory = useMemo(
    () =>
      category === "all" ||
      categories.some(
        (c) =>
          c.localeCompare(category, "pt-BR", { sensitivity: "base" }) === 0,
      )
        ? category
        : "all",
    [category, categories],
  );

  const questions = useMemo(
    () =>
      contextQuestions.filter((item) => {
        if (
          effectiveCollection !== "all" &&
          item.collection.localeCompare(effectiveCollection, "pt-BR", {
            sensitivity: "base",
          }) !== 0
        ) {
          return false;
        }
        if (
          effectiveCategory !== "all" &&
          !item.categories.some(
            (c) =>
              c.localeCompare(effectiveCategory, "pt-BR", {
                sensitivity: "base",
              }) === 0,
          )
        ) {
          return false;
        }
        if (search.trim()) {
          const q = search.toLocaleLowerCase("pt-BR");
          const haystack =
            `${item.statement} ${item.collection} ${item.categories.join(" ")} ${item.institution || ""}`.toLocaleLowerCase(
              "pt-BR",
            );
          if (!haystack.includes(q)) return false;
        }
        return true;
      }),
    [contextQuestions, effectiveCollection, effectiveCategory, search],
  );
  const attempts = data.simulationAttempts.filter(
    (item) =>
      !fixedSubjectId ||
      item.questions.some((question) => question.subjectId === fixedSubjectId),
  );
  const visibleSimulations = data.simulations.filter(
    (simulation) =>
      !fixedSubjectId ||
      simulation.questionIds.some(
        (id) =>
          data.questions.find((question) => question.id === id)?.subjectId ===
          fixedSubjectId,
      ),
  );
  const currentAttempt = data.simulationAttempts.find(
    (item) => item.id === activeAttempt && item.status === "in_progress",
  );
  useEffect(() => {
    const root =
      tab === "bank"
        ? "Banco de questões"
        : tab === "simulations"
          ? "Simulados"
          : "Histórico";
    onContextChange?.([
      root,
      ...(currentAttempt ? ["Em andamento"] : reviewing ? ["Revisão"] : []),
    ]);
  }, [tab, currentAttempt, reviewing, onContextChange]);

  const resetForm = () => {
    setEditing(undefined);
    setAlternatives(["", "", "", ""]);
    setFormOpen(false);
  };
  const saveQuestion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const clean = alternatives
      .map((text, index) => ({
        id: String.fromCharCode(65 + index),
        text: text.trim(),
      }))
      .filter((item) => item.text);
    if (clean.length < 2) return;
    if (!editing && data.questions.length >= LIMITS.questions) {
      void dialog.alert({
        title: "Limite do banco de questões atingido",
        message: `O limite de ${LIMITS.questions.toLocaleString("pt-BR")} questões foi atingido.`,
      });
      return;
    }
    const stamp = now();
    const question: Question = {
      id: editing?.id ?? crypto.randomUUID(),
      subjectId:
        fixedSubjectId || String(form.get("subjectId") || "") || undefined,
      collection: normalizeCollectionTitle(
        String(form.get("collection") || "Geral").trim() || "Geral",
      ),
      categories: String(form.get("categories") || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 12),
      statement: String(form.get("statement")).trim(),
      alternatives: clean,
      correctAlternativeId: String(form.get("answer")),
      explanation: String(form.get("explanation") || "").trim(),
      institution: String(form.get("institution") || "").trim(),
      year: Number(form.get("year")) || undefined,
      source: String(form.get("source") || "").trim(),
      createdAt: editing?.createdAt ?? stamp,
      updatedAt: stamp,
    };
    mutate((current) => ({
      ...current,
      questions: editing
        ? current.questions.map((item) =>
            item.id === question.id ? question : item,
          )
        : [question, ...current.questions],
    }));
    resetForm();
  };
  const editQuestion = (question: Question) => {
    setEditing(question);
    setAlternatives(question.alternatives.map((item) => item.text));
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const removeQuestion = async (id: string) => {
    if (
      !(await dialog.confirm({
        title: "Excluir esta questão do banco?",
        message: "Tentativas concluídas serão preservadas.",
        danger: true,
        confirmText: "Excluir questão",
      }))
    )
      return;
    mutate((current) => ({
      ...current,
      questions: current.questions.filter((item) => item.id !== id),
      simulations: current.simulations.map((item) => ({
        ...item,
        questionIds: item.questionIds.filter((questionId) => questionId !== id),
      })),
    }));
    setSelected((value) => new Set([...value].filter((item) => item !== id)));
  };
  const importQuestions = () => {
    if (!preview?.questions.length || preview.errors.length) return;
    if (data.questions.length + preview.questions.length > LIMITS.questions) {
      void dialog.alert({
        title: "Limite do banco de questões excedido",
        message: `O limite do banco é de ${LIMITS.questions.toLocaleString("pt-BR")} questões. Atualmente existem ${data.questions.length.toLocaleString("pt-BR")}.`,
      });
      return;
    }
    const stamp = now();
    const override = importCollectionOverride.trim()
      ? normalizeCollectionTitle(importCollectionOverride)
      : undefined;
    const newQuestions = preview.questions.map((item) => ({
      ...item,
      collection:
        override || normalizeCollectionTitle(item.collection) || "Geral",
      id: crypto.randomUUID(),
      createdAt: stamp,
      updatedAt: stamp,
    }));
    mutate((current) => ({
      ...current,
      questions: [...newQuestions, ...current.questions],
    }));
    const newIds = newQuestions.map((item) => item.id);
    setSelected(new Set(newIds));
    setImportSuccessInfo({
      count: newQuestions.length,
      collection: override || newQuestions[0]?.collection || "Geral",
      ids: newIds,
    });
    setImportOpen(false);
    setPreview(undefined);
    setImportCollectionOverride("");
  };

  const startSimulationFromSelection = (
    customIds?: string[],
    suggestedTitle?: string,
  ) => {
    const ids = customIds ?? Array.from(selected);
    if (!ids.length) return;
    if (ids.length > LIMITS.simulationQuestions) {
      void dialog.alert({
        title: "Limite de questões excedido",
        message: `Um simulado pode ter no máximo ${LIMITS.simulationQuestions} questões. Selecionadas: ${ids.length}.`,
      });
      return;
    }
    setSelected(new Set(ids));
    const title =
      suggestedTitle ||
      (collection !== "all"
        ? `Simulado - ${collection}`
        : fixedSubjectId
          ? `Simulado - ${subjectName(data, fixedSubjectId)}`
          : "Simulado Personalizado");
    setBuilderTitle(title);
    setTab("simulations");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const createSimulation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ids = selected.size
      ? [...selected]
      : questions.map((item) => item.id);
    if (!ids.length) {
      void dialog.alert({
        title: "Nenhuma questão selecionada",
        message: "Selecione pelo menos uma questão para criar o simulado.",
      });
      return;
    }
    if (ids.length > LIMITS.simulationQuestions) {
      void dialog.alert({
        title: "Limite de questões excedido",
        message: `Um simulado pode ter no máximo ${LIMITS.simulationQuestions} questões. Selecionadas: ${ids.length}.`,
      });
      return;
    }
    if (data.simulations.length >= LIMITS.simulations) {
      void dialog.alert({
        title: "Limite de simulados atingido",
        message: `O limite de ${LIMITS.simulations} simulados salvos foi atingido.`,
      });
      return;
    }
    const form = new FormData(event.currentTarget);
    const stamp = now();
    const mode = (form.get("mode") as SimulationMode) || "fixacao";
    const timeLimitMinutes =
      mode === "cronometrado"
        ? Math.max(1, Number(form.get("timeLimitMinutes")) || 45)
        : undefined;
    mutate((current) => ({
      ...current,
      simulations: [
        {
          id: crypto.randomUUID(),
          title: String(form.get("title")).trim(),
          questionIds: ids,
          shuffleQuestions: form.get("shuffleQuestions") === "on",
          shuffleAlternatives: form.get("shuffleAlternatives") === "on",
          passingScore: Number(form.get("passingScore")) || 5,
          mode,
          timeLimitMinutes,
          createdAt: stamp,
          updatedAt: stamp,
        },
        ...current.simulations,
      ],
    }));
    setSelected(new Set());
    setBuilderTitle("");
    event.currentTarget.reset();
    setFormMode("fixacao");
  };

  const startSimulation = (simulationId: string) => {
    const simulation = data.simulations.find(
      (item) => item.id === simulationId,
    );
    if (!simulation) return;
    let snapshot = simulation.questionIds
      .map((id) => data.questions.find((item) => item.id === id))
      .filter(Boolean) as Question[];
    if (simulation.shuffleQuestions) snapshot = shuffled(snapshot);
    if (simulation.shuffleAlternatives)
      snapshot = snapshot.map((item) => ({
        ...item,
        alternatives: shuffled(item.alternatives),
      }));
    if (!snapshot.length) return;
    const attempt: SimulationAttempt = {
      id: crypto.randomUUID(),
      simulationId,
      title: simulation.title,
      questions: structuredClone(snapshot),
      answers: {},
      passingScore: simulation.passingScore,
      status: "in_progress",
      mode: simulation.mode || "fixacao",
      timeLimitMinutes: simulation.timeLimitMinutes,
      startedAt: now(),
      totalElapsedSeconds: 0,
      questionTimeSeconds: {},
      excludedQuestionTimes: {},
    };
    mutate((current) => ({
      ...current,
      simulationAttempts: [attempt, ...current.simulationAttempts],
    }));
    setActiveAttempt(attempt.id);
    setQuestionIndex(0);
    setIsPaused(false);
    setPauseReason("manual");
  };

  const submitAttempt = async (
    attempt: SimulationAttempt,
    reason: "standard" | "time_limit" = "standard",
  ) => {
    const unanswered =
      attempt.questions.length - Object.keys(attempt.answers).length;
    if (
      reason === "standard" &&
      !(await dialog.confirm({
        title: unanswered
          ? `Finalizar com ${unanswered} questão(ões) sem resposta?`
          : "Finalizar e corrigir o simulado?",
        confirmText: "Finalizar simulado",
      }))
    )
      return;
    const correct = attempt.questions.filter(
      (item) => attempt.answers[item.id] === item.correctAlternativeId,
    ).length;
    const score = Number(
      ((correct / attempt.questions.length) * 10).toFixed(2),
    );
    mutate((current) => ({
      ...current,
      simulationAttempts: current.simulationAttempts.map((item) =>
        item.id === attempt.id
          ? {
              ...item,
              status: "completed",
              completedAt: now(),
              score,
              passed: score >= item.passingScore,
              completionReason: reason,
            }
          : item,
      ),
    }));
    setActiveAttempt(undefined);
    setIsPaused(false);
    setTab("history");
  };

  const submitMasteryEarly = async (attempt: SimulationAttempt) => {
    const totalQ = attempt.questions.length;
    const answered = Object.keys(attempt.answers).length;
    const neededCorrect = Math.ceil(totalQ * (attempt.passingScore / 10));

    if (
      !(await dialog.confirm({
        title: "Encerrar simulado por corte?",
        message: `Você respondeu ${answered} de ${totalQ} questões (mínimo para a meta: ${neededCorrect}). Deseja finalizar e corrigir o simulado agora por sua conta e risco?`,
        confirmText: "Encerrar e corrigir",
      }))
    )
      return;
    const correct = attempt.questions.filter(
      (item) => attempt.answers[item.id] === item.correctAlternativeId,
    ).length;
    const score = Number(
      ((correct / attempt.questions.length) * 10).toFixed(2),
    );
    const passed = score >= attempt.passingScore;
    mutate((current) => ({
      ...current,
      simulationAttempts: current.simulationAttempts.map((item) =>
        item.id === attempt.id
          ? {
              ...item,
              status: "completed",
              completedAt: now(),
              score,
              passed,
              completionReason: passed ? "mastery_cutoff" : "standard",
            }
          : item,
      ),
    }));
    setActiveAttempt(undefined);
    setIsPaused(false);
    setTab("history");
  };

  const toggleExcludeQuestionTime = (attemptId: string, questionId: string) => {
    mutate((current) => ({
      ...current,
      simulationAttempts: current.simulationAttempts.map((item) => {
        if (item.id !== attemptId) return item;
        const currentExcluded = { ...(item.excludedQuestionTimes || {}) };
        if (currentExcluded[questionId]) {
          delete currentExcluded[questionId];
        } else {
          currentExcluded[questionId] = true;
        }
        return {
          ...item,
          excludedQuestionTimes: currentExcluded,
        };
      }),
    }));
  };

  // 1-second ticker for active attempt
  useEffect(() => {
    if (!currentAttempt || currentAttempt.status !== "in_progress" || isPaused)
      return;

    const interval = window.setInterval(() => {
      const qId = currentAttempt.questions[questionIndex]?.id;
      mutate((current) => ({
        ...current,
        simulationAttempts: current.simulationAttempts.map((item) =>
          item.id === currentAttempt.id
            ? {
                ...item,
                totalElapsedSeconds: (item.totalElapsedSeconds || 0) + 1,
                questionTimeSeconds: qId
                  ? {
                      ...item.questionTimeSeconds,
                      [qId]: (item.questionTimeSeconds?.[qId] || 0) + 1,
                    }
                  : item.questionTimeSeconds,
              }
            : item,
        ),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentAttempt, mutate, isPaused, questionIndex]);

  // Page visibility listener: auto-pause on tab switch or screen lock
  useEffect(() => {
    if (!currentAttempt || currentAttempt.status !== "in_progress") return;
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        setIsPaused(true);
        setPauseReason("visibility");
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [currentAttempt]);

  // Inactivity auto-pause: pause after 7 minutes without user interaction
  useEffect(() => {
    if (!currentAttempt || currentAttempt.status !== "in_progress" || isPaused)
      return;
    let timerId: number;
    const resetTimer = () => {
      window.clearTimeout(timerId);
      timerId = window.setTimeout(
        () => {
          setIsPaused(true);
          setPauseReason("inactivity");
        },
        7 * 60 * 1000,
      );
    };
    resetTimer();
    const events = ["mousedown", "touchstart", "keydown", "scroll"];
    const handler = () => resetTimer();
    events.forEach((ev) =>
      window.addEventListener(ev, handler, { passive: true }),
    );
    return () => {
      window.clearTimeout(timerId);
      events.forEach((ev) => window.removeEventListener(ev, handler));
    };
  }, [currentAttempt, isPaused]);
  const selectVisible = () =>
    setSelected(new Set(questions.map((item) => item.id)));
  const editSelectedCollection = async () => {
    if (!selected.size) return;
    const value = (
      await dialog.prompt({
        title: "Alterar coleção das questões selecionadas",
        message: collections.length
          ? `Coleções nesta matéria: ${collections.slice(0, 6).join(", ")}${collections.length > 6 ? "..." : ""}`
          : undefined,
        placeholder: "Digite o nome da coleção de destino...",
        confirmText: "Salvar",
      })
    )?.trim();
    if (!value || !(await confirmBulk(selected.size, "Mover para"))) return;
    const normalized = normalizeCollectionTitle(value);
    const stamp = now();
    mutate((current) => ({
      ...current,
      questions: current.questions.map((item) =>
        selected.has(item.id)
          ? {
              ...item,
              collection: normalized.slice(0, 120),
              updatedAt: stamp,
            }
          : item,
      ),
    }));
  };

  const normalizeSelectedCollections = async () => {
    if (!selected.size) return;
    if (!(await confirmBulk(selected.size, "Padronizar maiúsculas de"))) return;
    const stamp = now();
    mutate((current) => ({
      ...current,
      questions: current.questions.map((item) =>
        selected.has(item.id)
          ? {
              ...item,
              collection: normalizeCollectionTitle(item.collection),
              updatedAt: stamp,
            }
          : item,
      ),
    }));
  };

  const normalizeAllSubjectCollections = async () => {
    const unnormalized = contextQuestions.filter(
      (q) => q.collection !== normalizeCollectionTitle(q.collection),
    );
    if (!unnormalized.length) {
      void dialog.alert({
        title: "Coleções padronizadas",
        message:
          "Todos os nomes de coleções desta matéria já estão no padrão correto.",
      });
      return;
    }
    if (
      !(await dialog.confirm({
        title: "Padronizar capitalização de coleções?",
        message: `${unnormalized.length} questões com divergências de maiúsculas/minúsculas serão ajustadas para o padrão Title Case (ex.: “Princípios Contábeis”), unificando coleções duplicadas.`,
        confirmText: "Padronizar",
      }))
    )
      return;
    const stamp = now();
    const ids = new Set(unnormalized.map((q) => q.id));
    mutate((current) => ({
      ...current,
      questions: current.questions.map((item) =>
        ids.has(item.id)
          ? {
              ...item,
              collection: normalizeCollectionTitle(item.collection),
              updatedAt: stamp,
            }
          : item,
      ),
    }));
  };
  const editSelectedCategories = async () => {
    const value = (
      await dialog.prompt({
        title: "Substitua as categorias selecionadas",
        placeholder: "Sintaxe, Regência (separe por vírgulas)",
        confirmText: "Salvar",
      })
    )?.trim();
    if (
      value === undefined ||
      !selected.size ||
      !(await confirmBulk(selected.size, "Editar"))
    )
      return;
    const values = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 12);
    const stamp = now();
    mutate((current) => ({
      ...current,
      questions: current.questions.map((item) =>
        selected.has(item.id)
          ? { ...item, categories: values, updatedAt: stamp }
          : item,
      ),
    }));
  };
  const moveSelectedSubject = async () => {
    if (
      !selected.size ||
      !bulkSubject ||
      !(await confirmBulk(selected.size, "Mover"))
    )
      return;
    const subjectId = bulkSubject === "general" ? undefined : bulkSubject;
    const stamp = now();
    mutate((current) => ({
      ...current,
      questions: current.questions.map((item) =>
        selected.has(item.id) ? { ...item, subjectId, updatedAt: stamp } : item,
      ),
    }));
    setBulkSubject("");
  };
  const deleteSelected = async () => {
    if (
      !selected.size ||
      !(await confirmBulk(selected.size, "Excluir permanentemente"))
    )
      return;
    mutate((current) => ({
      ...current,
      questions: current.questions.filter((item) => !selected.has(item.id)),
      simulations: current.simulations.map((item) => ({
        ...item,
        questionIds: item.questionIds.filter((id) => !selected.has(id)),
      })),
    }));
    setSelected(new Set());
  };

  const removeSimulation = async (id: string, title: string) => {
    if (
      !(await dialog.confirm({
        title: `Excluir o modelo “${title}”?`,
        message: "As tentativas já realizadas não serão perdidas.",
        danger: true,
        confirmText: "Excluir modelo",
      }))
    )
      return;
    mutate((current) => ({
      ...current,
      simulations: current.simulations.filter((item) => item.id !== id),
    }));
  };
  const removeAttempt = async (id: string) => {
    if (
      !(await dialog.confirm({
        title: "Excluir esta tentativa do histórico?",
        message: "Esta ação não pode ser desfeita.",
        danger: true,
        confirmText: "Excluir tentativa",
      }))
    )
      return;
    mutate((current) => ({
      ...current,
      simulationAttempts: current.simulationAttempts.filter(
        (item) => item.id !== id,
      ),
    }));
  };

  if (currentAttempt) {
    const question = currentAttempt.questions[questionIndex];
    const answered = Object.keys(currentAttempt.answers).length;
    const isCronometrado = currentAttempt.mode === "cronometrado";
    const totalSeconds = currentAttempt.totalElapsedSeconds || 0;
    const limitSeconds = (currentAttempt.timeLimitMinutes || 45) * 60;
    const remainingSeconds = Math.max(0, limitSeconds - totalSeconds);
    const isTimeOver = isCronometrado && remainingSeconds === 0;
    const currentQTime = currentAttempt.questionTimeSeconds?.[question.id] || 0;

    const totalQ = currentAttempt.questions.length;
    const neededCorrect = Math.ceil(
      totalQ * (currentAttempt.passingScore / 10),
    );
    const canEarlyExit = answered >= neededCorrect && answered < totalQ;

    return (
      <main className={`${embedded ? "" : "page "}question-area`}>
        <section className="panel attempt-runner">
          <div className="attempt-head">
            <div>
              <span className="eyebrow">
                {isCronometrado
                  ? "SIMULADO CRONOMETRADO"
                  : "SIMULADO EM FIXAÇÃO"}
              </span>
              <h2>{currentAttempt.title}</h2>
              <div className="attempt-meta-line">
                <small>
                  {answered} de {currentAttempt.questions.length} respondidas
                </small>
                <span className="meta-separator">·</span>
                <small>
                  Nesta questão: <strong>{formatTimer(currentQTime)}</strong>
                </small>
              </div>
            </div>
            <div className="attempt-head-actions">
              <div
                className={`attempt-timer-badge ${isCronometrado && remainingSeconds < 300 ? "warning" : ""} ${isTimeOver ? "danger" : ""}`}
                title={isCronometrado ? "Tempo restante" : "Tempo decorrido"}
              >
                <Timer size={15} />
                <strong>
                  {isCronometrado
                    ? isTimeOver
                      ? "00:00 (Esgotado)"
                      : formatTimer(remainingSeconds, true)
                    : formatTimer(totalSeconds, true)}
                </strong>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => {
                  setIsPaused((p) => !p);
                  setPauseReason("manual");
                }}
                title={isPaused ? "Retomar" : "Pausar"}
              >
                {isPaused ? <Play size={18} /> : <Pause size={18} />}
              </button>
              <button
                className="secondary-button"
                onClick={() => {
                  setActiveAttempt(undefined);
                  setIsPaused(false);
                }}
              >
                Salvar e sair
              </button>
            </div>
          </div>

          <progress
            value={questionIndex + 1}
            max={currentAttempt.questions.length}
          />

          {isPaused ? (
            <div className="attempt-paused-overlay">
              <div className="paused-card">
                <Pause size={28} />
                <h3>Simulado em pausa</h3>
                <p>
                  {pauseReason === "inactivity"
                    ? "Pausado automaticamente por inatividade."
                    : pauseReason === "visibility"
                      ? "Pausado automaticamente ao sair da tela."
                      : "O cronômetro está congelado."}
                </p>
                <button
                  className="primary-button"
                  onClick={() => {
                    setIsPaused(false);
                    setPauseReason("manual");
                  }}
                >
                  <Play size={15} /> Retomar simulado
                </button>
              </div>
            </div>
          ) : (
            <article className="attempt-question">
              <span>Questão {questionIndex + 1}</span>
              <h3>{question.statement}</h3>
              {question.alternatives.map((alternative) => (
                <label
                  className={
                    currentAttempt.answers[question.id] === alternative.id
                      ? "selected"
                      : ""
                  }
                  key={alternative.id}
                >
                  <input
                    type="radio"
                    name={question.id}
                    checked={
                      currentAttempt.answers[question.id] === alternative.id
                    }
                    onChange={() =>
                      mutate((current) => ({
                        ...current,
                        simulationAttempts: current.simulationAttempts.map(
                          (item) =>
                            item.id === currentAttempt.id
                              ? {
                                  ...item,
                                  answers: {
                                    ...item.answers,
                                    [question.id]: alternative.id,
                                  },
                                }
                              : item,
                        ),
                      }))
                    }
                  />
                  <strong>{alternative.id}</strong>
                  <span>{alternative.text}</span>
                </label>
              ))}
            </article>
          )}

          <div className="attempt-navigation">
            <button
              className="secondary-button"
              disabled={!questionIndex}
              onClick={() => setQuestionIndex((value) => value - 1)}
            >
              <ChevronLeft /> Anterior
            </button>
            <div className="attempt-nav-right">
              {canEarlyExit && (
                <button
                  type="button"
                  className="secondary-button mastery-button"
                  onClick={() => submitMasteryEarly(currentAttempt)}
                  title="Encerrar antecipadamente caso já tenha atingido a nota de corte nas questões respondidas"
                >
                  <Award size={15} /> Encerrar por corte
                </button>
              )}
              {questionIndex < currentAttempt.questions.length - 1 ? (
                <button
                  className="primary-button"
                  onClick={() => setQuestionIndex((value) => value + 1)}
                >
                  Próxima <ChevronRight />
                </button>
              ) : (
                <button
                  className="primary-button"
                  onClick={() =>
                    submitAttempt(
                      currentAttempt,
                      isTimeOver ? "time_limit" : "standard",
                    )
                  }
                >
                  <CheckCircle2 /> Finalizar
                </button>
              )}
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={`${embedded ? "" : "page "}question-area`}>
      <nav className="question-tabs">
        <button
          className={tab === "bank" ? "active" : ""}
          onClick={() => setTab("bank")}
        >
          Banco de questões
        </button>
        <button
          className={tab === "simulations" ? "active" : ""}
          onClick={() => setTab("simulations")}
        >
          Simulados
        </button>
        <button
          className={tab === "history" ? "active" : ""}
          onClick={() => setTab("history")}
        >
          Histórico
        </button>
      </nav>
      {tab === "bank" && (
        <>
          <div className="section-heading">
            <div>
              <span className="eyebrow">ACERVO PESSOAL</span>
              <h2>{questions.length} questões encontradas</h2>
            </div>
            <div className="heading-actions">
              <button
                className="secondary-button"
                onClick={() => setAiModalOpen(true)}
              >
                <Sparkles /> Gerar com IA
              </button>
              <button
                className="secondary-button"
                onClick={() => setImportOpen(!importOpen)}
              >
                <FileInput /> Importar texto
              </button>
              <button
                className="primary-button"
                onClick={() => {
                  setEditing(undefined);
                  setAlternatives(["", "", "", ""]);
                  setFormOpen(!formOpen);
                }}
              >
                <Plus /> Nova questão
              </button>
            </div>
          </div>
          {formOpen && (
            <form className="panel question-form" onSubmit={saveQuestion}>
              <label className="wide">
                Enunciado
                <textarea
                  name="statement"
                  defaultValue={editing?.statement}
                  maxLength={LIMITS.questionStatement}
                  required
                  autoFocus
                />
              </label>
              {alternatives.map((value, index) => (
                <label key={index}>
                  Alternativa {String.fromCharCode(65 + index)}
                  <input
                    value={value}
                    onChange={(event) =>
                      setAlternatives((items) =>
                        items.map((item, itemIndex) =>
                          itemIndex === index ? event.target.value : item,
                        ),
                      )
                    }
                    required={index < 2}
                  />
                </label>
              ))}
              <label>
                Gabarito
                <select
                  name="answer"
                  defaultValue={editing?.correctAlternativeId ?? "A"}
                >
                  {alternatives.map((_, index) => (
                    <option key={index}>
                      {String.fromCharCode(65 + index)}
                    </option>
                  ))}
                </select>
              </label>
              {!fixedSubjectId && (
                <label>
                  Matéria (opcional)
                  <select
                    name="subjectId"
                    defaultValue={editing?.subjectId ?? ""}
                  >
                    <option value="">Geral</option>
                    {data.subjects.map((item) => (
                      <option value={item.id} key={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Coleção
                <input
                  name="collection"
                  defaultValue={editing?.collection ?? "Geral"}
                />
              </label>
              <label>
                Categorias
                <input
                  name="categories"
                  defaultValue={editing?.categories.join(", ")}
                  placeholder="Sintaxe, ESA 2014"
                />
              </label>
              <label>
                Instituição
                <input name="institution" defaultValue={editing?.institution} />
              </label>
              <label>
                Ano
                <input
                  name="year"
                  type="number"
                  min="1900"
                  max="2200"
                  defaultValue={editing?.year}
                />
              </label>
              <label className="wide">
                Explicação do gabarito
                <textarea
                  name="explanation"
                  defaultValue={editing?.explanation}
                />
              </label>
              <label className="wide">
                Fonte
                <input name="source" defaultValue={editing?.source} />
              </label>
              <div className="form-actions wide">
                <button
                  type="button"
                  className="text-button"
                  onClick={resetForm}
                >
                  Cancelar
                </button>
                <button className="primary-button">
                  {editing ? "Salvar questão" : "Adicionar questão"}
                </button>
              </div>
            </form>
          )}
          {importOpen && (
            <section className="panel question-import">
              <div>
                <h3>Importação em texto</h3>
                <p>
                  Use diretivas entre colchetes, alternativas de A) a H),{" "}
                  <code>= B</code> para o gabarito e <code>---</code> entre
                  questões.
                </p>
              </div>
              <textarea
                value={importText}
                onChange={(event) => {
                  setImportText(event.target.value);
                  setPreview(undefined);
                }}
              />
              <div className="import-override-row">
                <label>
                  <span>Coleção de destino (opcional)</span>
                  <input
                    value={importCollectionOverride}
                    onChange={(event) =>
                      setImportCollectionOverride(event.target.value)
                    }
                    placeholder="Forçar todas as questões para esta coleção (ex: Princípios Contábeis)..."
                    list="import-existing-collections"
                  />
                  <datalist id="import-existing-collections">
                    {collections.map((col) => (
                      <option key={col} value={col} />
                    ))}
                  </datalist>
                </label>
              </div>
              <div className="import-actions">
                <button
                  className="secondary-button"
                  onClick={() => setAiModalOpen(true)}
                >
                  <Sparkles /> Prompt para IA
                </button>
                <button
                  className="secondary-button"
                  onClick={() => setImportOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  className="primary-button"
                  onClick={() =>
                    setPreview(
                      parseQuestionsText(
                        importText,
                        data.subjects,
                        fixedSubjectId,
                      ),
                    )
                  }
                >
                  Validar conteúdo
                </button>
              </div>
              {preview && (
                <div
                  className={`import-result ${preview.errors.length ? "has-errors" : ""}`}
                >
                  <strong>{preview.questions.length} questões válidas</strong>
                  {preview.errors.map((error) => (
                    <small key={error}>{error}</small>
                  ))}
                  {preview.questions.slice(0, 3).map((question, index) => (
                    <article className="import-preview" key={index}>
                      <b>
                        {index + 1}. {question.statement}
                      </b>
                      <span>
                        {importCollectionOverride.trim() || question.collection} ·{" "}
                        {question.alternatives.length} alternativas
                      </span>
                    </article>
                  ))}
                  {preview.questions.length > 3 && (
                    <small>
                      + {preview.questions.length - 3} questões reconhecidas
                    </small>
                  )}
                  {!preview.errors.length && !!preview.questions.length && (
                    <button
                      className="primary-button"
                      onClick={importQuestions}
                    >
                      Confirmar importação
                    </button>
                  )}
                </div>
              )}
            </section>
          )}
          {importSuccessInfo && (
            <div className="panel import-success-banner">
              <div className="banner-info">
                <CheckCircle2 size={18} />
                <span>
                  <strong>{importSuccessInfo.count} questões importadas</strong>{" "}
                  com sucesso na coleção “{importSuccessInfo.collection}”.
                </span>
              </div>
              <div className="banner-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() =>
                    startSimulationFromSelection(
                      importSuccessInfo.ids,
                      `Simulado - ${importSuccessInfo.collection}`,
                    )
                  }
                >
                  <Play size={14} /> Montar simulado com estas questões
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setImportSuccessInfo(undefined)}
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
          <section className="question-filters">
            <label className="search-box">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar enunciado, coleção ou categoria"
              />
            </label>
            {!fixedSubjectId && (
              <select
                value={subjectFilter}
                onChange={(event) => setSubjectFilter(event.target.value)}
              >
                <option value="all">
                  Todas as matérias [{data.subjects.length}]
                </option>
                <option value="">Geral</option>
                {data.subjects.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            )}
            <select
              value={effectiveCollection}
              onChange={(event) => setCollection(event.target.value)}
            >
              <option value="all">
                Todas as coleções [{collections.length}]
              </option>
              {collections.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={effectiveCategory}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="all">
                Todas as categorias [{categories.length}]
              </option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            {questions.length > 0 && (
              <button
                type="button"
                className="secondary-button"
                onClick={selectVisible}
                title="Selecionar questões visíveis no filtro atual"
              >
                <CheckCircle2 size={15} /> Selecionar visíveis [{questions.length}]
              </button>
            )}
            {collections.length > 1 && (
              <button
                type="button"
                className="secondary-button"
                onClick={normalizeAllSubjectCollections}
                title="Padronizar maiúsculas e unificar variações de nomes de coleções"
              >
                <Sparkles size={15} /> Padronizar coleções
              </button>
            )}
          </section>
          {selected.size > 0 && (
            <section className="panel bulk-manager question-bulk">
              <div className="bulk-manager-head">
                <div>
                  <strong>{selected.size} questões selecionadas</strong>
                  <small>Ações em lote para o banco de questões</small>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => startSimulationFromSelection()}
                  title="Criar um simulado com as questões selecionadas"
                >
                  <Play size={14} /> Montar simulado ({selected.size})
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={editSelectedCollection}
                >
                  <Pencil size={14} /> Mover coleção
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={editSelectedCategories}
                >
                  <Pencil size={14} /> Categorias
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={normalizeSelectedCollections}
                  title="Ajustar maiúsculas/minúsculas para padrão Title Case"
                >
                  <Sparkles size={14} /> Padronizar caixa
                </button>
                {!fixedSubjectId && (
                  <>
                    <select
                      value={bulkSubject}
                      onChange={(event) => setBulkSubject(event.target.value)}
                    >
                      <option value="">Mover para matéria...</option>
                      <option value="general">Geral</option>
                      {data.subjects.map((item) => (
                        <option value={item.id} key={item.id}>
                          {item.title}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={!bulkSubject}
                      onClick={moveSelectedSubject}
                    >
                      Mover
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="secondary-button danger-outline"
                  onClick={deleteSelected}
                >
                  <Trash2 size={14} /> Excluir
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setSelected(new Set())}
                >
                  Desmarcar todas
                </button>
              </div>
            </section>
          )}
          <div className={`question-list ${selected.size > 0 ? "has-selection" : ""}`}>
            {questions.map((question) => (
              <article className="panel question-card" key={question.id}>
                <button
                  className={`question-select ${selected.has(question.id) ? "active" : ""}`}
                  onClick={() =>
                    setSelected((value) => {
                      const next = new Set(value);
                      next.has(question.id)
                        ? next.delete(question.id)
                        : next.add(question.id);
                      return next;
                    })
                  }
                  aria-label="Selecionar questão"
                >
                  {selected.has(question.id) && <CheckCircle2 />}
                </button>
                <div>
                  <span>
                    {question.collection} ·{" "}
                    {subjectName(data, question.subjectId)}
                  </span>
                  <h3>{question.statement}</h3>
                  <small>
                    {question.categories.join(" · ") || "Sem categoria"}
                    {question.year ? ` · ${question.year}` : ""}
                  </small>
                </div>
                <div className="question-actions">
                  <button onClick={() => editQuestion(question)}>
                    <Pencil />
                  </button>
                  <button
                    className="danger"
                    onClick={() => removeQuestion(question.id)}
                  >
                    <Trash2 />
                  </button>
                </div>
              </article>
            ))}
            {!questions.length && (
              <div className="panel empty-state empty-wide">
                <CircleHelp />
                <h3>Nenhuma questão encontrada</h3>
                <p>Cadastre manualmente ou importe um bloco de texto.</p>
              </div>
            )}
          </div>
        </>
      )}
      {tab === "simulations" && (
        <>
          <form
            className="panel simulation-builder"
            onSubmit={createSimulation}
          >
            <div className="simulation-builder-header">
              <div>
                <span className="eyebrow">NOVO MODELO</span>
                <h2>Monte um simulado</h2>
              </div>
              <div
                className={`simulation-scope-badge ${selected.size > 0 ? "selected" : ""}`}
              >
                {selected.size > 0 ? (
                  <>
                    <span>
                      Usando <strong>{selected.size} questões selecionadas</strong> no acervo
                    </span>
                    <button
                      type="button"
                      className="scope-action-btn"
                      onClick={() => setSelected(new Set())}
                    >
                      Limpar seleção
                    </button>
                  </>
                ) : (
                  <>
                    <span>
                      Usando <strong>{questions.length} questões</strong> do filtro atual [{effectiveCollection === "all" ? "Todas as coleções" : effectiveCollection}]
                    </span>
                    <button
                      type="button"
                      className="scope-action-btn"
                      onClick={() => setTab("bank")}
                    >
                      Selecionar questões no acervo
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="simulation-builder-fields">
              <label className="field-title">
                Título
                <input
                  name="title"
                  required
                  value={builderTitle}
                  onChange={(e) => setBuilderTitle(e.target.value)}
                  placeholder="Ex.: Simulado ESA 2014"
                />
              </label>
              <label className="field-mode">
                Modo
                <select
                  name="mode"
                  value={formMode}
                  onChange={(e) => setFormMode(e.target.value as SimulationMode)}
                >
                  <option value="fixacao">Fixação (tempo progressivo)</option>
                  <option value="cronometrado">
                    Cronometrado (tempo regressivo)
                  </option>
                </select>
              </label>
              {formMode === "cronometrado" && (
                <label className="field-timelimit">
                  Tempo limite (minutos)
                  <input
                    name="timeLimitMinutes"
                    type="number"
                    min="1"
                    max="720"
                    defaultValue={Math.max(
                      5,
                      (selected.size || questions.length) * 3,
                    )}
                    required
                  />
                </label>
              )}
              <label className="field-score">
                Nota mínima (0–10)
                <input
                  name="passingScore"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  defaultValue="5"
                />
              </label>
            </div>

            <div className="simulation-builder-actions">
              <div className="simulation-builder-checks">
                <label className="check-label">
                  <input
                    name="shuffleQuestions"
                    type="checkbox"
                    defaultChecked
                  />
                  <Shuffle size={14} /> Embaralhar questões
                </label>
                <label className="check-label">
                  <input
                    name="shuffleAlternatives"
                    type="checkbox"
                    defaultChecked
                  />
                  <Shuffle size={14} /> Embaralhar alternativas
                </label>
              </div>
              <button
                className="primary-button"
                disabled={!selected.size && !questions.length}
              >
                Salvar modelo
              </button>
            </div>
          </form>
          <div className="simulation-list">
            {visibleSimulations.map((simulation) => {
              const ongoing = data.simulationAttempts.find(
                (item) =>
                  item.simulationId === simulation.id &&
                  item.status === "in_progress",
              );
              return (
                <article className="panel simulation-card" key={simulation.id}>
                  <div>
                    <span className="eyebrow">MODELO SALVO</span>
                    <h3>{simulation.title}</h3>
                    <p>
                      {simulation.questionIds.length} questões · meta{" "}
                      {simulation.passingScore.toLocaleString("pt-BR")} ·{" "}
                      {simulation.mode === "cronometrado"
                        ? `Cronometrado (${simulation.timeLimitMinutes || 45} min)`
                        : "Fixação"}
                    </p>
                  </div>
                  <div>
                    {ongoing && (
                      <button
                        className="secondary-button"
                        onClick={() => {
                          setActiveAttempt(ongoing.id);
                          setQuestionIndex(0);
                        }}
                      >
                        Continuar
                      </button>
                    )}
                    <button
                      className="primary-button"
                      onClick={() => startSimulation(simulation.id)}
                    >
                      <Play /> {ongoing ? "Nova tentativa" : "Iniciar"}
                    </button>
                    <button
                      className="icon-button danger"
                      onClick={() =>
                        removeSimulation(simulation.id, simulation.title)
                      }
                    >
                      <Trash2 />
                    </button>
                  </div>
                </article>
              );
            })}
            {!visibleSimulations.length && (
              <div className="panel empty-state">
                <Play />
                <h3>Nenhum modelo salvo</h3>
                <p>
                  Selecione questões no banco ou use os filtros atuais para
                  montar o primeiro.
                </p>
              </div>
            )}
          </div>
        </>
      )}
      {tab === "history" && (
        <div className="attempt-history">
          {attempts.map((attempt) => {
            const tone = resultTone(attempt);
            return (
              <article className="history-entry" key={attempt.id}>
                <div className="panel history-card">
                  <span className={`history-status ${tone}`}>
                    {tone === "failed" ? (
                      <XCircle />
                    ) : tone === "pending" ? (
                      <Play />
                    ) : (
                      <CheckCircle2 />
                    )}
                  </span>
                  <div>
                    <div className="history-badge-row">
                      <span className="mode-pill">
                        {attempt.mode === "cronometrado"
                          ? "Cronometrado"
                          : "Fixação"}
                      </span>
                      {attempt.completionReason === "mastery_cutoff" && (
                        <span className="mode-pill mastery">
                          Corte atingido ({Object.keys(attempt.answers).length}/
                          {attempt.questions.length})
                        </span>
                      )}
                      {attempt.completionReason === "time_limit" && (
                        <span className="mode-pill time-limit">
                          Tempo esgotado
                        </span>
                      )}
                      {attempt.totalElapsedSeconds ? (
                        <span className="history-meta-pill">
                          <Clock3 size={11} />{" "}
                          {formatTimer(attempt.totalElapsedSeconds, true)}
                        </span>
                      ) : null}
                    </div>
                    <h3>{attempt.title}</h3>
                    <p>
                      {attempt.status === "completed"
                        ? `${attempt.score?.toLocaleString("pt-BR")} de 10 · ${tone === "failed" ? "Abaixo da meta" : tone === "near" ? "Na faixa da meta" : "Meta atingida"}`
                        : `${Object.keys(attempt.answers).length} de ${attempt.questions.length} respondidas`}
                    </p>
                    <small>
                      Iniciado em{" "}
                      {new Date(attempt.startedAt).toLocaleString("pt-BR")}
                    </small>
                  </div>
                  {attempt.status === "in_progress" ? (
                    <button
                      className="primary-button"
                      onClick={() => {
                        setActiveAttempt(attempt.id);
                        setQuestionIndex(0);
                      }}
                    >
                      Continuar
                    </button>
                  ) : (
                    <button
                      className="secondary-button"
                      onClick={() =>
                        setReviewing(
                          reviewing === attempt.id ? undefined : attempt.id,
                        )
                      }
                    >
                      {reviewing === attempt.id
                        ? "Fechar revisão"
                        : "Revisar gabarito"}
                    </button>
                  )}
                  <button
                    className="icon-button danger"
                    onClick={() => removeAttempt(attempt.id)}
                  >
                    <Trash2 />
                  </button>
                </div>
                {reviewing === attempt.id && attempt.status === "completed" && (
                  <div className="panel attempt-review">
                    <SimulationTimelineChart attempt={attempt} />
                    {attempt.questions.map((question, index) => {
                      const answer = attempt.answers[question.id];
                      const correct = answer === question.correctAlternativeId;
                      const qTime =
                        attempt.questionTimeSeconds?.[question.id] || 0;
                      const isExcluded = Boolean(
                        attempt.excludedQuestionTimes?.[question.id],
                      );
                      return (
                        <article key={question.id}>
                          <div className="review-question-head">
                            <span>
                              Questão {index + 1} ·{" "}
                              {correct
                                ? "Acertou"
                                : answer
                                  ? "Errou"
                                  : "Não respondida"}
                              {" · "}
                              Tempo: {formatTimer(qTime)}
                              {isExcluded && (
                                <strong className="excluded-label">
                                  {" "}
                                  (tempo desconsiderado da média)
                                </strong>
                              )}
                            </span>
                            <button
                              type="button"
                              className="text-toggle-btn"
                              onClick={() =>
                                toggleExcludeQuestionTime(
                                  attempt.id,
                                  question.id,
                                )
                              }
                            >
                              {isExcluded
                                ? "Restaurar tempo na média"
                                : "Desconsiderar tempo da média"}
                            </button>
                          </div>
                          <h4>{question.statement}</h4>
                          {question.alternatives.map((alternative) => (
                            <p
                              className={`${alternative.id === question.correctAlternativeId ? "correct" : ""} ${alternative.id === answer && !correct ? "wrong" : ""}`}
                              key={alternative.id}
                            >
                              <b>{alternative.id}</b>
                              {alternative.text}
                              {alternative.id ===
                                question.correctAlternativeId && (
                                <small>Gabarito</small>
                              )}
                              {alternative.id === answer && (
                                <small>Sua resposta</small>
                              )}
                            </p>
                          ))}
                          {question.explanation && (
                            <aside>
                              <strong>Comentário</strong>
                              {question.explanation}
                            </aside>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}
          {!attempts.length && (
            <div className="panel empty-state">
              <CircleHelp />
              <h3>Nenhuma tentativa</h3>
              <p>Seus simulados iniciados e concluídos aparecerão aqui.</p>
            </div>
          )}
        </div>
      )}
      {aiModalOpen && (
        <AiPromptModal
          initialType="questions"
          subjectTitle={
            fixedSubjectId ? subjectName(data, fixedSubjectId) : undefined
          }
          onClose={() => setAiModalOpen(false)}
        />
      )}
    </main>
  );
}
export default Questoes;
