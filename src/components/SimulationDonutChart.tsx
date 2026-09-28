import { useMemo } from "react";
import { formatTimer, type AppData, type Subject } from "../data";

type Props = {
  data: AppData;
};

export default function SimulationDonutChart({ data }: Props) {
  const completedAttempts = useMemo(
    () => data.simulationAttempts.filter((a) => a.status === "completed"),
    [data.simulationAttempts],
  );

  const { totalSeconds, subjectBreakdown } = useMemo(() => {
    let total = 0;
    const timeBySubject = new Map<string, number>();

    completedAttempts.forEach((attempt) => {
      // Sum question times or fallback to totalElapsedSeconds
      let attemptCalculatedSeconds = 0;
      attempt.questions.forEach((q) => {
        const isExcluded = Boolean(attempt.excludedQuestionTimes?.[q.id]);
        if (!isExcluded) {
          const qTime =
            attempt.questionTimeSeconds?.[q.id] ||
            Math.round(
              (attempt.totalElapsedSeconds || 0) /
                Math.max(1, attempt.questions.length),
            );
          const sId = q.subjectId || "general";
          timeBySubject.set(sId, (timeBySubject.get(sId) || 0) + qTime);
          attemptCalculatedSeconds += qTime;
        }
      });
      total += attemptCalculatedSeconds;
    });

    // Map into displayable slices
    const subjectsMap = new Map<string, Subject>(
      data.subjects.map((s) => [s.id, s]),
    );

    const breakdown = Array.from(timeBySubject.entries())
      .map(([id, seconds]) => {
        if (id === "general") {
          return {
            id,
            title: "Geral",
            color: "var(--detail-color)",
            seconds,
            percentage: total > 0 ? (seconds / total) * 100 : 0,
          };
        }
        const s = subjectsMap.get(id);
        return {
          id,
          title: s?.title || "Outras",
          color: s?.color || "var(--detail-color)",
          seconds,
          percentage: total > 0 ? (seconds / total) * 100 : 0,
        };
      })
      .filter((item) => item.seconds > 0)
      .sort((a, b) => b.seconds - a.seconds);

    return { totalSeconds: total, subjectBreakdown: breakdown };
  }, [completedAttempts, data.subjects]);

  const radius = 68;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className="donut-chart-container">
      <div className="donut-svg-wrapper">
        <svg
          viewBox="0 0 200 200"
          className="donut-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background base circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth={strokeWidth}
            opacity="0.4"
          />

          {/* Slices */}
          {totalSeconds > 0 &&
            subjectBreakdown.map((slice) => {
              const sliceLength = (slice.percentage / 100) * circumference;
              const strokeDasharray = `${sliceLength} ${circumference - sliceLength}`;
              const strokeDashoffset = -currentOffset;
              currentOffset += sliceLength;

              return (
                <circle
                  key={slice.id}
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 100 100)"
                  style={{
                    transition:
                      "stroke-dasharray 0.4s ease, stroke-dashoffset 0.4s ease",
                  }}
                />
              );
            })}

          {/* Inner labels */}
          <text
            x="100"
            y="94"
            textAnchor="middle"
            fill="var(--text)"
            fontSize="18"
            fontFamily="Fraunces, serif"
            fontWeight="600"
          >
            {formatTimer(totalSeconds, true)}
          </text>
          <text
            x="100"
            y="112"
            textAnchor="middle"
            fill="var(--item-color)"
            fontSize="9"
            fontWeight="500"
          >
            {totalSeconds > 0 ? "Tempo em simulados" : "Sem dados de tempo"}
          </text>
        </svg>
      </div>

      <div className="donut-legend">
        {subjectBreakdown.length > 0 ? (
          <>
            {subjectBreakdown.slice(0, 5).map((item) => (
              <div className="donut-legend-item" key={item.id}>
                <span
                  className="legend-bullet"
                  style={{ background: item.color }}
                />
                <span className="legend-label" title={item.title}>
                  {item.title}
                </span>
                <strong className="legend-time">
                  {formatTimer(item.seconds, true)}
                </strong>
                <small className="legend-percent">
                  {Math.round(item.percentage)}%
                </small>
              </div>
            ))}
            {subjectBreakdown.length > 5 && (
              <div className="donut-legend-footer">
                <small>+{subjectBreakdown.length - 5} outras matérias</small>
              </div>
            )}
          </>
        ) : (
          <p className="empty-copy">
            Nenhum tempo computado em simulados até o momento.
          </p>
        )}
      </div>
    </div>
  );
}
