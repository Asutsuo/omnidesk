import { Eye, EyeOff, GripVertical, Pause, Play, Timer as TimerIcon, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatTimer, LIMITS, subjectName, type AppData, type TimerState } from "../data";
import { liveTimerSeconds, pauseTimer } from "../timerUtils";

type Props = { data: AppData; timer?: TimerState; onStart: (timer: TimerState) => void; onUpdate: (timer: TimerState) => void; onDelete: (id: string) => void; onComplete: (timer: TimerState, seconds: number) => void; onOpen: (timer: TimerState) => void };
type Position = { side: "left" | "right"; top: number };
type DragState = { offsetY: number; startX: number; startY: number; moved: boolean; compact: boolean };
const readPosition = (): Position => { try { const value = JSON.parse(localStorage.getItem("omnidesk-timer-widget-position") ?? ""); if ((value.side === "left" || value.side === "right") && Number.isFinite(value.top)) return value; } catch { /* padrão */ } return { side: "right", top: 150 }; };

function FloatingTimer({ data, timer, onStart, onUpdate, onDelete, onComplete, onOpen }: Props) {
  const [clock, setClock] = useState(0); const [hidden, setHidden] = useState(false); const [position, setPosition] = useState<Position>(readPosition);
  const drag = useRef<DragState | undefined>(undefined); const positionRef = useRef(position); useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => { if (!timer || timer.status !== "running") return; const tick = window.setInterval(() => setClock(Date.now()), 250); return () => window.clearInterval(tick); }, [timer]);
  const seconds = timer ? liveTimerSeconds(timer, clock) : 0;
  useEffect(() => { if (!timer || timer.status !== "running") return; const ended = timer.type === "pomodoro" ? seconds <= 0 : seconds >= LIMITS.stopwatchSeconds; if (!ended) return; const focused = timer.type === "pomodoro" && timer.mode === "focus" ? timer.durationSeconds : timer.type === "stopwatch" ? seconds : 0; onComplete(timer, focused); }, [timer, seconds, onComplete]);
  if (!timer) return null;
  const total = timer.type === "pomodoro" ? Math.max(1, timer.durationSeconds) : LIMITS.stopwatchSeconds; const progress = timer.type === "pomodoro" ? Math.round((1 - seconds / total) * 360) : Math.round(seconds / total * 360);
  const compact = hidden; const widgetHeight = compact ? 52 : 108; const top = Math.max(72, Math.min(position.top, window.innerHeight - widgetHeight - 12));
  const style = { top: `${top}px`, [position.side]: compact ? "8px" : "14px", "--widget-progress": `${progress}deg` } as React.CSSProperties;
  const begin = (event: React.PointerEvent, isCompact: boolean) => { drag.current = { offsetY: event.clientY - top, startX: event.clientX, startY: event.clientY, moved: false, compact: isCompact }; event.currentTarget.setPointerCapture(event.pointerId); };
  const move = (event: React.PointerEvent) => { if (!drag.current) return; if (Math.hypot(event.clientX - drag.current.startX, event.clientY - drag.current.startY) > 5) drag.current.moved = true; const height = drag.current.compact ? 52 : 108; setPosition({ side: event.clientX < window.innerWidth / 2 ? "left" : "right", top: Math.max(72, Math.min(window.innerHeight - height - 12, event.clientY - drag.current.offsetY)) }); };
  const release = (event: React.PointerEvent) => { const state = drag.current; if (!state) return; event.currentTarget.releasePointerCapture(event.pointerId); drag.current = undefined; localStorage.setItem("omnidesk-timer-widget-position", JSON.stringify(positionRef.current)); if (state.compact && !state.moved) setHidden(false); };
  const cycleLabel = timer.type === "pomodoro" ? `${timer.completedCycles}/${timer.cyclesTarget}` : undefined;
  if (compact) return <button className="timer-widget-restore" style={style} onPointerDown={(event) => begin(event, true)} onPointerMove={move} onPointerUp={release} title="Segure para mover ou toque para mostrar"><Eye /><span>{formatTimer(seconds, timer.type === "stopwatch")}</span>{cycleLabel && <small>{cycleLabel}</small>}</button>;
  return <aside className={`timer-widget ${position.side}`} style={style} onPointerMove={move} onPointerUp={release}>
    <button className="timer-widget-grip" aria-label="Arrastar timer" title="Arraste para reposicionar" onPointerDown={(event) => begin(event, false)}><GripVertical /></button>
    <div className="timer-widget-copy" onClick={() => onOpen(timer)}><span>{timer.type === "pomodoro" ? timer.mode === "focus" ? "Pomodoro · foco" : "Pomodoro · intervalo" : "Cronômetro"}</span><strong>{timer.scope === "global" ? "Estudo geral" : subjectName(data, timer.subjectId)}</strong>{cycleLabel && <small>Ciclo {cycleLabel}</small>}</div>
    <button className="timer-widget-ring" style={{ "--widget-progress": `${progress}deg` } as React.CSSProperties} onClick={() => onOpen(timer)} aria-label="Abrir timer"><span><TimerIcon /><b>{formatTimer(seconds, timer.type === "stopwatch")}</b></span></button>
    <div className="timer-widget-actions">{timer.status === "running" ? <button onClick={() => { setHidden(true); onUpdate(pauseTimer(timer)); }} title="Pausar"><Pause /></button> : <button disabled={timer.type === "pomodoro" && timer.completedCycles >= timer.cyclesTarget} onClick={() => onStart({ ...timer, status: "running", startedAt: Date.now(), updatedAt: new Date().toISOString() })} title="Continuar"><Play /></button>}<button onClick={() => setHidden(true)} title="Ocultar"><EyeOff /></button><button className="danger" onClick={() => window.confirm("Excluir este relógio ativo?") && onDelete(timer.id)} title="Excluir"><Trash2 /></button></div>
  </aside>;
}
export default FloatingTimer;
