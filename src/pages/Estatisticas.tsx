import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  GraduationCap,
  Search,
  Target,
  Timer,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useMemo, useState } from "react";
import { formatTimer, subjectName, type AppData } from "../data";
import SimulationDonutChart from "../components/SimulationDonutChart";

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const shortDay = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
    .format(date)
    .replace(".", "");

function Estatisticas({ data }: { data: AppData }) {
  const [pacingSearch, setPacingSearch] = useState("");
  const [pacingSort, setPacingSort] = useState<
    "slowest" | "fastest" | "accuracy" | "volume"
  >("slowest");

  const completed =
    data.checklistItems.filter((item) => item.completed).length +
    data.assignments.filter((item) => item.completed).length;
  const totalActivities = data.checklistItems.length + data.assignments.length;
  const mastered = data.flashcards.filter((card) => card.mastered).length;
  const totalSeconds = data.stats.reduce(
    (sum, item) => sum + item.focusedSeconds,
    0,
  );
  const activityProgress = totalActivities
    ? Math.round((completed / totalActivities) * 100)
    : 0;
  const cardProgress = data.flashcards.length
    ? Math.round((mastered / data.flashcards.length) * 100)
    : 0;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const daily = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (13 - index));
    const key = dateKey(date);
    return {
      key,
      date,
      seconds: data.stats
        .filter((item) => item.date === key)
        .reduce((sum, item) => sum + item.focusedSeconds, 0),
    };
  });
  const dailyMax = Math.max(1, ...daily.map((item) => item.seconds));
  const studiedDays = daily.filter((item) => item.seconds > 0).length;
  const weeks = Array.from({ length: 6 }, (_, index) => {
    const end = new Date(today);
    end.setDate(today.getDate() - (5 - index) * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    const seconds = data.stats
      .filter((item) => {
        const date = new Date(`${item.date}T12:00:00`);
        return date >= start && date <= end;
      })
      .reduce((sum, item) => sum + item.focusedSeconds, 0);
    return { label: index === 5 ? "Atual" : `S-${5 - index}`, seconds };
  });
  const weekMax = Math.max(1, ...weeks.map((item) => item.seconds));
  const general = {
    subject: {
      id: "general",
      title: "Geral",
      color: "var(--detail-color)",
      createdAt: "",
    },
    seconds: data.stats
      .filter((item) => !item.subjectId)
      .reduce((sum, item) => sum + item.focusedSeconds, 0),
    items:
      data.checklists.filter((item) => !item.subjectId).length +
      data.assignments.filter((item) => !item.subjectId).length +
      data.flashcards.filter((item) => !item.subjectId).length +
      data.resources.filter((item) => !item.subjectId).length,
  };
  const bySubject = [
    ...data.subjects.map((subject) => ({
      subject,
      seconds: data.stats
        .filter((item) => item.subjectId === subject.id)
        .reduce((sum, item) => sum + item.focusedSeconds, 0),
      items:
        data.checklists.filter((item) => item.subjectId === subject.id).length +
        data.assignments.filter((item) => item.subjectId === subject.id)
          .length +
        data.flashcards.filter((item) => item.subjectId === subject.id).length +
        data.resources.filter((item) => item.subjectId === subject.id).length,
    })),
    ...(general.seconds || general.items ? [general] : []),
  ].sort((a, b) => b.seconds - a.seconds || b.items - a.items);
  const biggest = Math.max(
    1,
    ...bySubject.map((item) => item.seconds || item.items),
  );
  const subjectTimers = data.timers.filter((item) => item.scope === "subject");
  const completedAttempts = useMemo(
    () => data.simulationAttempts.filter((item) => item.status === "completed"),
    [data.simulationAttempts],
  );
  const averageScore = completedAttempts.length
    ? completedAttempts.reduce((sum, item) => sum + (item.score ?? 0), 0) /
      completedAttempts.length
    : 0;
  const passRate = completedAttempts.length
    ? Math.round(
        (completedAttempts.filter((item) => item.passed).length /
          completedAttempts.length) *
          100,
      )
    : 0;
  const categoryResults = new Map<string, { correct: number; total: number }>();
  completedAttempts.forEach((attempt) =>
    attempt.questions.forEach((question) =>
      (question.categories.length
        ? question.categories
        : [subjectName(data, question.subjectId)]
      ).forEach((name) => {
        const value = categoryResults.get(name) ?? { correct: 0, total: 0 };
        value.total += 1;
        if (attempt.answers[question.id] === question.correctAlternativeId)
          value.correct += 1;
        categoryResults.set(name, value);
      }),
    ),
  );
  const categoryRanking = [...categoryResults]
    .map(([name, value]) => ({
      name,
      ...value,
      rate: Math.round((value.correct / value.total) * 100),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // Simulation time telemetry
  const totalSimSeconds = completedAttempts.reduce(
    (sum, a) => sum + (a.totalElapsedSeconds || 0),
    0,
  );

  let totalQuestionsWithTime = 0;
  let totalTimeForQuestions = 0;
  let countCronometrado = 0;
  let countMastery = 0;

  completedAttempts.forEach((attempt) => {
    if (attempt.mode === "cronometrado") countCronometrado += 1;
    if (attempt.completionReason === "mastery_cutoff") countMastery += 1;

    attempt.questions.forEach((q) => {
      const isExcluded = Boolean(attempt.excludedQuestionTimes?.[q.id]);
      if (!isExcluded) {
        const qTime =
          attempt.questionTimeSeconds?.[q.id] ||
          Math.round(
            (attempt.totalElapsedSeconds || 0) /
              Math.max(1, attempt.questions.length),
          );
        totalTimeForQuestions += qTime;
        totalQuestionsWithTime += 1;
      }
    });
  });

  const overallAvgPerQ = totalQuestionsWithTime
    ? Math.round(totalTimeForQuestions / totalQuestionsWithTime)
    : 0;

  // Per-subject pacing table calculations
  const subjectPacing = useMemo(() => {
    const map = new Map<
      string,
      {
        subjectId: string;
        title: string;
        color: string;
        totalQuestions: number;
        correctQuestions: number;
        seconds: number;
      }
    >();

    data.subjects.forEach((s) => {
      map.set(s.id, {
        subjectId: s.id,
        title: s.title,
        color: s.color,
        totalQuestions: 0,
        correctQuestions: 0,
        seconds: 0,
      });
    });
    map.set("general", {
      subjectId: "general",
      title: "Geral",
      color: "var(--detail-color)",
      totalQuestions: 0,
      correctQuestions: 0,
      seconds: 0,
    });

    completedAttempts.forEach((attempt) => {
      attempt.questions.forEach((q) => {
        const sId = q.subjectId || "general";
        const entry = map.get(sId) || {
          subjectId: sId,
          title: "Outros",
          color: "var(--detail-color)",
          totalQuestions: 0,
          correctQuestions: 0,
          seconds: 0,
        };
        entry.totalQuestions += 1;
        if (attempt.answers[q.id] === q.correctAlternativeId) {
          entry.correctQuestions += 1;
        }
        if (!attempt.excludedQuestionTimes?.[q.id]) {
          const qTime =
            attempt.questionTimeSeconds?.[q.id] ||
            Math.round(
              (attempt.totalElapsedSeconds || 0) /
                Math.max(1, attempt.questions.length),
            );
          entry.seconds += qTime;
        }
        map.set(sId, entry);
      });
    });

    return Array.from(map.values())
      .filter((item) => item.totalQuestions > 0)
      .map((item) => ({
        ...item,
        avgSeconds: item.totalQuestions
          ? Math.round(item.seconds / item.totalQuestions)
          : 0,
        accuracy: item.totalQuestions
          ? Math.round((item.correctQuestions / item.totalQuestions) * 100)
          : 0,
      }));
  }, [completedAttempts, data.subjects]);

  const filteredPacing = useMemo(() => {
    return subjectPacing
      .filter((item) =>
        item.title.toLowerCase().includes(pacingSearch.toLowerCase()),
      )
      .sort((a, b) => {
        if (pacingSort === "slowest") return b.avgSeconds - a.avgSeconds;
        if (pacingSort === "fastest") return a.avgSeconds - b.avgSeconds;
        if (pacingSort === "accuracy") return b.accuracy - a.accuracy;
        return b.totalQuestions - a.totalQuestions;
      });
  }, [subjectPacing, pacingSearch, pacingSort]);

  const slowestSubject = useMemo(() => {
    if (!subjectPacing.length) return null;
    return [...subjectPacing].sort((a, b) => b.avgSeconds - a.avgSeconds)[0];
  }, [subjectPacing]);

  const fastestSubject = useMemo(() => {
    if (!subjectPacing.length) return null;
    return [...subjectPacing].sort((a, b) => a.avgSeconds - b.avgSeconds)[0];
  }, [subjectPacing]);

  const PAGE_SIZE = 7;
  const [pacingPage, setPacingPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredPacing.length / PAGE_SIZE));
  const currentPage = Math.min(pacingPage, totalPages);
  const paginatedPacing = useMemo(() => {
    return filteredPacing.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE,
    );
  }, [filteredPacing, currentPage]);

  return (
    <main className="page stats-page">
      <section className="stats-grid streak-stats">
        <article className="stat-card">
          <span className="stat-icon blue">
            <Clock3 />
          </span>
          <div>
            <small>Tempo focado total</small>
            <strong>{formatTimer(totalSeconds, true)}</strong>
          </div>
        </article>
        <article className="stat-card">
          <span className="stat-icon green">
            <CheckCircle2 />
          </span>
          <div>
            <small>Atividades concluídas</small>
            <strong>
              {completed} de {totalActivities}
            </strong>
          </div>
        </article>
        <article className="stat-card">
          <span className="stat-icon orange">
            <BookOpen />
          </span>
          <div>
            <small>Cartões dominados</small>
            <strong>
              {mastered} de {data.flashcards.length}
            </strong>
          </div>
        </article>
        <article className="stat-card">
          <span className="stat-icon purple">
            <GraduationCap />
          </span>
          <div>
            <small>Matérias</small>
            <strong>{data.subjects.length}</strong>
          </div>
        </article>
        <article className="stat-card streak-card current">
          <span className="stat-icon streak-icon">
            <Flame className="streak-flame" />
          </span>
          <div>
            <small>Streak atual</small>
            <strong>
              {data.accessStreak.current}{" "}
              {data.accessStreak.current === 1 ? "dia" : "dias"}
            </strong>
          </div>
        </article>
        <article className="stat-card streak-card best">
          <span className="stat-icon trophy-icon">
            <Trophy />
          </span>
          <div>
            <small>Melhor streak</small>
            <strong>
              {data.accessStreak.best}{" "}
              {data.accessStreak.best === 1 ? "dia" : "dias"}
            </strong>
          </div>
        </article>
      </section>

      <section className="analytics-grid">
        <article className="panel activity-chart">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">ÚLTIMOS 14 DIAS</span>
              <h3>Constância de estudo</h3>
            </div>
            <span className="chart-summary">
              <CalendarDays size={16} /> {studiedDays} dias ativos
            </span>
          </div>
          <div className="daily-chart">
            {daily.map((item, index) => (
              <div className="daily-column" key={item.key}>
                <div className="bar-track">
                  <span
                    className={item.seconds ? "" : "zero"}
                    style={{
                      height: item.seconds
                        ? `${Math.max(8, (item.seconds / dailyMax) * 100)}%`
                        : "3px",
                    }}
                    title={`${item.date.toLocaleDateString("pt-BR")}: ${formatTimer(item.seconds, true)}`}
                  />
                </div>
                <strong>
                  {index % 2 === 1 || index === 13 ? item.date.getDate() : ""}
                </strong>
                <small>
                  {index === 13 || index % 3 === 1 ? shortDay(item.date) : ""}
                </small>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span>
              <i />
              Tempo registrado
            </span>
            <span>
              <i className="empty" />
              Sem estudo
            </span>
          </div>
        </article>

        <article className="panel weekly-chart">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">6 SEMANAS</span>
              <h3>Seu ritmo</h3>
            </div>
            <TrendingUp size={20} />
          </div>
          <div className="week-bars">
            {weeks.map((week) => (
              <div key={week.label}>
                <span
                  style={{
                    height: week.seconds
                      ? `${Math.max(7, (week.seconds / weekMax) * 100)}%`
                      : "2px",
                  }}
                  className={week.seconds ? "" : "zero"}
                />
                <small>{week.label}</small>
              </div>
            ))}
          </div>
          <p>
            {weeks[5].seconds ? (
              <>
                <strong>{formatTimer(weeks[5].seconds, true)}</strong> nesta
                semana
              </>
            ) : (
              "Nenhum estudo registrado nesta semana."
            )}
          </p>
        </article>
      </section>

      <section className="dashboard-grid stats-layout">
        <article className="panel progress-overview">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">PROGRESSO REAL</span>
              <h3>Visão geral</h3>
            </div>
          </div>
          <div className="metric-progress">
            <div>
              <strong>Trabalhos e checklists</strong>
              <span>{activityProgress}%</span>
            </div>
            <progress value={activityProgress} max="100" />
            <small>
              {totalActivities
                ? `${completed} itens concluídos`
                : "Cadastre trabalhos ou checklists para acompanhar seu progresso"}
            </small>
          </div>
          <div className="metric-progress">
            <div>
              <strong>Flashcards</strong>
              <span>{cardProgress}%</span>
            </div>
            <progress value={cardProgress} max="100" />
            <small>
              {data.flashcards.length
                ? `${mastered} cartões dominados`
                : "Crie flashcards para acompanhar seu domínio"}
            </small>
          </div>
          <div className="goal-line">
            <Target size={18} />
            <span>Meta semanal configurada</span>
            <strong>{data.profile.weeklyGoal}h</strong>
          </div>
        </article>

        <article className="panel subject-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">POR CONTEXTO</span>
              <h3>Distribuição</h3>
            </div>
          </div>
          <div className="subject-distribution">
            {bySubject.slice(0, 8).map(({ subject, seconds, items }) => (
              <div className="subject-progress" key={subject.id}>
                <div>
                  <strong>
                    <i style={{ background: subject.color }} />
                    {subject.title}
                  </strong>
                  <span>
                    {seconds ? formatTimer(seconds, true) : `${items} itens`}
                  </span>
                </div>
                <progress value={seconds || items} max={biggest} />
              </div>
            ))}
            {!bySubject.length && (
              <p className="empty-copy">
                Suas matérias e conteúdos gerais aparecerão aqui.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="panel simulation-metrics">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">QUESTÕES E SIMULADOS</span>
            <h3>Desempenho nas tentativas</h3>
          </div>
        </div>
        <div className="simulation-metric-grid">
          <div>
            <small>Tentativas concluídas</small>
            <strong>{completedAttempts.length}</strong>
          </div>
          <div>
            <small>Média de acertos</small>
            <strong>{Math.round(averageScore * 10)}%</strong>
          </div>
          <div>
            <small>Nota média</small>
            <strong>
              {averageScore.toLocaleString("pt-BR", {
                maximumFractionDigits: 1,
              })}
            </strong>
          </div>
          <div>
            <small>Metas atingidas</small>
            <strong>{passRate}%</strong>
          </div>
        </div>
        {categoryRanking.length > 0 ? (
          <div className="category-metrics">
            {categoryRanking.map((item) => (
              <div key={item.name}>
                <span>
                  <strong>{item.name}</strong>
                  <small>
                    {item.correct} de {item.total}
                  </small>
                </span>
                <progress value={item.rate} max="100" />
                <b>{item.rate}%</b>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-copy">
            Conclua um simulado para visualizar médias, acertos e desempenho por
            categoria.
          </p>
        )}
      </section>

      <section className="panel simulation-time-analytics">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">TELEMETRIA E RITMO</span>
            <h3>Velocidade e tempo de resolução</h3>
          </div>
        </div>
        <div className="simulation-metric-grid">
          <div>
            <small>Tempo em simulados</small>
            <strong>{formatTimer(totalSimSeconds, true)}</strong>
          </div>
          <div>
            <small>Ritmo médio geral</small>
            <strong>
              {overallAvgPerQ > 0
                ? `${formatTimer(overallAvgPerQ)} / q`
                : "Sem dados"}
            </strong>
          </div>
          <div>
            <small>Simulados cronometrados</small>
            <strong>{countCronometrado}</strong>
          </div>
          <div>
            <small>Cortes atingidos antecipadamente</small>
            <strong>{countMastery}</strong>
          </div>
        </div>

        <div className="time-analytics-grid">
          <div className="time-analytics-sidebar">
            <SimulationDonutChart data={data} />

            {slowestSubject && (
              <div className="pacing-highlights">
                <div className="pacing-highlight-card bottleneck">
                  <div className="highlight-tag">
                    <Flame size={12} />
                    <span>Maior gargalo</span>
                  </div>
                  <div className="highlight-body">
                    <span
                      className="legend-bullet"
                      style={{ background: slowestSubject.color }}
                    />
                    <strong title={slowestSubject.title}>
                      {slowestSubject.title}
                    </strong>
                    <span className="highlight-metric">
                      {formatTimer(slowestSubject.avgSeconds)} / q
                    </span>
                  </div>
                </div>

                {fastestSubject &&
                  fastestSubject.subjectId !== slowestSubject.subjectId && (
                    <div className="pacing-highlight-card fastest">
                      <div className="highlight-tag">
                        <TrendingUp size={12} />
                        <span>Mais rápida</span>
                      </div>
                      <div className="highlight-body">
                        <span
                          className="legend-bullet"
                          style={{ background: fastestSubject.color }}
                        />
                        <strong title={fastestSubject.title}>
                          {fastestSubject.title}
                        </strong>
                        <span className="highlight-metric">
                          {formatTimer(fastestSubject.avgSeconds)} / q
                        </span>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>

          <div className="pacing-table-container">
            <div className="pacing-table-controls">
              <div className="search-box">
                <Search size={14} />
                <input
                  type="search"
                  placeholder="Filtrar matérias..."
                  value={pacingSearch}
                  onChange={(e) => {
                    setPacingSearch(e.target.value);
                    setPacingPage(1);
                  }}
                />
              </div>
              <select
                className="pacing-sort-select"
                value={pacingSort}
                onChange={(e) => {
                  setPacingSort(
                    e.target.value as
                      | "slowest"
                      | "fastest"
                      | "accuracy"
                      | "volume",
                  );
                  setPacingPage(1);
                }}
              >
                <option value="slowest">Mais lentas (gargalo)</option>
                <option value="fastest">Mais rápidas</option>
                <option value="accuracy">Maior acurácia</option>
                <option value="volume">Mais questões</option>
              </select>
            </div>

            {filteredPacing.length > 0 ? (
              <div className="pacing-list-wrapper">
                <div className="pacing-list-header">
                  <span>Matéria</span>
                  <span>Tempo médio</span>
                  <span>Questões</span>
                  <span>Acurácia</span>
                </div>
                <div className="pacing-list">
                  {paginatedPacing.map((item) => (
                    <div className="pacing-row" key={item.subjectId}>
                      <div className="pacing-col-subject">
                        <span
                          className="legend-bullet"
                          style={{ background: item.color }}
                        />
                        <span className="pacing-subject-name" title={item.title}>
                          {item.title}
                        </span>
                      </div>
                      <div className="pacing-col-time">
                        <strong>{formatTimer(item.avgSeconds)}</strong>
                        <span className="pacing-unit"> / q</span>
                      </div>
                      <div className="pacing-col-questions">
                        <small>
                          {item.correctQuestions} de {item.totalQuestions} certas
                        </small>
                      </div>
                      <div className="pacing-col-accuracy">
                        <progress value={item.accuracy} max="100" />
                        <span>{item.accuracy}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="pacing-pagination">
                    <button
                      type="button"
                      className="pagination-btn"
                      onClick={() => setPacingPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      title="Página anterior"
                    >
                      <ChevronLeft size={15} />
                      <span>Anterior</span>
                    </button>
                    <span className="pagination-info">
                      {currentPage} de {totalPages}
                    </span>
                    <button
                      type="button"
                      className="pagination-btn"
                      onClick={() =>
                        setPacingPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      title="Próxima página"
                    >
                      <span>Próxima</span>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="empty-copy">
                Nenhuma matéria encontrada com questões resolvidas em simulados.
              </p>
            )}
          </div>
        </div>
      </section>

      {subjectTimers.length > 0 && (
        <section className="panel saved-sessions">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">SESSÕES SALVAS</span>
              <h3>Relógios por matéria</h3>
            </div>
            <span className="session-count">
              <Timer size={16} /> {subjectTimers.length}
            </span>
          </div>
          <div className="session-list">
            {subjectTimers.map((timer) => (
              <article key={timer.id}>
                <span
                  className="subject-dot"
                  style={
                    {
                      "--subject-color": data.subjects.find(
                        (item) => item.id === timer.subjectId,
                      )?.color,
                    } as React.CSSProperties
                  }
                />
                <div>
                  <strong>{subjectName(data, timer.subjectId)}</strong>
                  <small>
                    {timer.type === "pomodoro" ? "Pomodoro" : "Cronômetro"} ·{" "}
                    {timer.status === "running" ? "em andamento" : "pausado"}
                  </small>
                </div>
                <time>
                  {formatTimer(
                    timer.type === "pomodoro"
                      ? timer.remainingSeconds
                      : timer.elapsedSeconds,
                    timer.type === "stopwatch",
                  )}
                </time>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default Estatisticas;
