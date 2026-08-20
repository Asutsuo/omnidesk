import { Eye, EyeOff, GripVertical, Pause, Play, Timer as TimerIcon, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatTimer, LIMITS, subjectName, type AppData, type TimerState } from "../data";
import { liveTimerSeconds, pauseTimer } from "../timerUtils";

type Props = { data: AppData; timer?: TimerState; onStart: (timer: TimerState) => void; onUpdate: (timer: TimerState) => void; onDelete: (id: string) => void; onComplete: (timer: TimerState, seconds: number) => void; onOpen: (timer: TimerState) => void };
type Position = { side: "left" | "right"; top: number };
const readPosition = (): Position => { try { const value = JSON.parse(localStorage.getItem("omnidesk-timer-widget-position") ?? ""); if ((value.side === "left" || value.side === "right") && Number.isFinite(value.top)) return value; } catch { /* posição padrão */ } return { side: "right", top: 150 }; };

function FloatingTimer({ data, timer, onStart, onUpdate, onDelete, onComplete, onOpen }: Props) {
  const [clock, setClock] = useState(0); const [hidden, setHidden] = useState(false); const [position, setPosition] = useState<Position>(readPosition); const drag = useRef<{ offsetY: number } | undefined>(undefined);
  useEffect(() => { if (!timer || timer.status !== "running") return; const tick = window.setInterval(() => setClock(Date.now()), 250); return () => window.clearInterval(tick); }, [timer]);
  const seconds = timer ? liveTimerSeconds(timer, clock) : 0;
  useEffect(() => { if (!timer || timer.status !== "running") return; const ended = timer.type === "pomodoro" ? seconds <= 0 : seconds >= LIMITS.stopwatchSeconds; if (!ended) return; const focused = timer.type === "pomodoro" && timer.mode === "focus" ? timer.durationSeconds : timer.type === "stopwatch" ? seconds : 0; onComplete(timer, focused); }, [timer, seconds, onComplete]);
  if (!timer) return null;
  const total = timer.type === "pomodoro" ? Math.max(1, timer.durationSeconds) : LIMITS.stopwatchSeconds; const progress = timer.type === "pomodoro" ? Math.round((1 - seconds / total) * 360) : Math.round(seconds / total * 360);
  const style = { top: `${Math.min(position.top, Math.max(70, window.innerHeight - 170))}px`, [position.side]: hidden ? "8px" : "14px", "--widget-progress": `${progress}deg` } as React.CSSProperties;
  const move = (event: React.PointerEvent) => { if (!drag.current) return; setPosition({ side: event.clientX < window.innerWidth / 2 ? "left" : "right", top: Math.max(72, Math.min(window.innerHeight - 170, event.clientY - drag.current.offsetY)) }); };
  const release = (event: React.PointerEvent) => { if (!drag.current) return; event.currentTarget.releasePointerCapture(event.pointerId); drag.current = undefined; localStorage.setItem("omnidesk-timer-widget-position", JSON.stringify(position)); };
  if (hidden) return <button className="timer-widget-restore" style={style} onClick={() => setHidden(false)} title="Mostrar timer"><Eye /><span>{formatTimer(seconds, timer.type === "stopwatch")}</span></button>;
  return <aside className={`timer-widget ${position.side}`} style={style} onPointerMove={move} onPointerUp={release}>
    <button className="timer-widget-grip" aria-label="Arrastar timer" title="Arraste para reposicionar" onPointerDown={(event) => { drag.current = { offsetY: event.clientY - position.top }; event.currentTarget.setPointerCapture(event.pointerId); }}><GripVertical /></button>
    <div className="timer-widget-copy" onClick={() => onOpen(timer)}><span>{timer.type === "pomodoro" ? timer.mode === "focus" ? "Pomodoro · foco" : "Pomodoro · intervalo" : "Cronômetro"}</span><strong>{timer.scope === "global" ? "Estudo geral" : subjectName(data, timer.subjectId)}</strong></div>
    <button className="timer-widget-ring" style={{ "--widget-progress": `${progress}deg` } as React.CSSProperties} onClick={() => onOpen(timer)} aria-label="Abrir timer"><span><TimerIcon /><b>{formatTimer(seconds, timer.type === "stopwatch")}</b></span></button>
    <div className="timer-widget-actions">{timer.status === "running" ? <button onClick={() => { setHidden(true); onUpdate(pauseTimer(timer)); }} title="Pausar"><Pause /></button> : <button onClick={() => onStart({ ...timer, status: "running", startedAt: Date.now(), updatedAt: new Date().toISOString() })} title="Continuar"><Play /></button>}<button onClick={() => setHidden(true)} title="Ocultar"><EyeOff /></button><button className="danger" onClick={() => window.confirm("Excluir este relógio ativo?") && onDelete(timer.id)} title="Excluir"><Trash2 /></button></div>
  </aside>;
}
export default FloatingTimer;
