import { useState } from "react";
import { formatTimer, type SimulationAttempt } from "../data";

type Props = {
  attempt: SimulationAttempt;
};

export default function SimulationTimelineChart({ attempt }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const questions = attempt.questions;
  const count = questions.length;
  if (!count) return null;

  const times = questions.map((q) => attempt.questionTimeSeconds?.[q.id] || 0);
  const maxTime = Math.max(15, ...times);

  // Compute average of non-excluded times
  const validIndices = questions
    .map((q, idx) => (!attempt.excludedQuestionTimes?.[q.id] ? idx : -1))
    .filter((idx) => idx !== -1);

  const avgTime = validIndices.length
    ? Math.round(
        validIndices.reduce((sum, idx) => sum + times[idx], 0) /
          validIndices.length,
      )
    : 0;

  // SVG dimensions
  const width = 640;
  const height = 180;
  const paddingLeft = 45;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 35;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const points = times.map((t, idx) => {
    const x =
      count === 1
        ? paddingLeft + plotWidth / 2
        : paddingLeft + (idx / (count - 1)) * plotWidth;
    const y = paddingTop + plotHeight - (t / maxTime) * plotHeight;
    return { x, y, time: t, index: idx, question: questions[idx] };
  });

  const avgY = paddingTop + plotHeight - (avgTime / maxTime) * plotHeight;

  // Build line path
  const linePath = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, "");

  // Build area path
  const firstPt = points[0];
  const lastPt = points[points.length - 1];
  const baselineY = paddingTop + plotHeight;
  const areaPath = `${linePath} L ${lastPt.x},${baselineY} L ${firstPt.x},${baselineY} Z`;

  // Y-axis tick intervals
  const yTicks = [0, Math.round(maxTime / 2), maxTime];

  const gradientId = `timeline-grad-${attempt.id}`;

  return (
    <div className="simulation-timeline-container">
      <div className="timeline-header">
        <div>
          <span className="eyebrow">RITMO POR QUESTÃO</span>
          <h4>Tempo de resolução</h4>
        </div>
        <div className="timeline-legend">
          <span>
            <i className="legend-dot correct" /> Acerto
          </span>
          <span>
            <i className="legend-dot wrong" /> Erro
          </span>
          <span>
            <i className="legend-line avg" /> Média: {formatTimer(avgTime)}
          </span>
        </div>
      </div>

      <div className="timeline-svg-wrapper">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="timeline-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--detail-color)"
                stopOpacity="0.35"
              />
              <stop
                offset="100%"
                stopColor="var(--detail-color)"
                stopOpacity="0.0"
              />
            </linearGradient>
          </defs>

          {/* Grid lines and Y axis ticks */}
          {yTicks.map((tickVal, i) => {
            const yPos =
              paddingTop + plotHeight - (tickVal / maxTime) * plotHeight;
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={yPos}
                  x2={width - paddingRight}
                  y2={yPos}
                  stroke="var(--border-color)"
                  strokeWidth="1"
                  strokeDasharray={i === 0 ? "none" : "2 2"}
                />
                <text
                  x={paddingLeft - 8}
                  y={yPos + 3}
                  textAnchor="end"
                  fill="var(--item-color)"
                  fontSize="10"
                >
                  {formatTimer(tickVal)}
                </text>
              </g>
            );
          })}

          {/* Average reference line */}
          {avgTime > 0 && (
            <g>
              <line
                x1={paddingLeft}
                y1={avgY}
                x2={width - paddingRight}
                y2={avgY}
                stroke="var(--detail-color)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.85"
              />
              <text
                x={width - paddingRight}
                y={avgY - 4}
                textAnchor="end"
                fill="var(--detail-color)"
                fontSize="9"
                fontWeight="600"
              >
                Média {formatTimer(avgTime)}
              </text>
            </g>
          )}

          {/* Gradient area underneath */}
          <path d={areaPath} fill={`url(#${gradientId})`} />

          {/* The line itself */}
          <path
            d={linePath}
            fill="none"
            stroke="var(--detail-color)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points for each question */}
          {points.map((pt, i) => {
            const answer = attempt.answers[pt.question.id];
            const isCorrect = answer === pt.question.correctAlternativeId;
            const isExcluded = Boolean(
              attempt.excludedQuestionTimes?.[pt.question.id],
            );
            const isHovered = hoveredIndex === i;

            const color = !answer
              ? "var(--item-color)"
              : isCorrect
                ? "var(--success)"
                : "var(--danger)";

            return (
              <g
                key={pt.question.id}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: "pointer" }}
              >
                {/* Visual indicator for excluded time */}
                {isExcluded && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={9}
                    fill="none"
                    stroke="var(--item-color)"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Point node */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6.5 : 4.5}
                  fill={color}
                  stroke="var(--surface)"
                  strokeWidth="2"
                  style={{ transition: "r 0.15s ease" }}
                />

                {/* X axis question number */}
                {(count <= 25 || i % 2 === 0 || i === count - 1) && (
                  <text
                    x={pt.x}
                    y={height - 12}
                    textAnchor="middle"
                    fill={isHovered ? "var(--text)" : "var(--item-color)"}
                    fontSize={isHovered ? "10" : "9"}
                    fontWeight={isHovered ? "700" : "400"}
                  >
                    Q{i + 1}
                  </text>
                )}

                {/* Tooltip on hover */}
                {isHovered && (
                  <g>
                    <rect
                      x={Math.min(width - 120, Math.max(10, pt.x - 45))}
                      y={Math.max(5, pt.y - 32)}
                      width="90"
                      height="24"
                      rx="4"
                      fill="var(--default-color)"
                      opacity="0.9"
                    />
                    <text
                      x={Math.min(width - 120, Math.max(10, pt.x - 45)) + 45}
                      y={Math.max(5, pt.y - 32) + 16}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize="10"
                      fontWeight="600"
                    >
                      Q{i + 1}: {formatTimer(pt.time)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
