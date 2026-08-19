import { Pause, Play, RotateCcw, SkipForward, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createTimer, formatTimer, LIMITS, type TimerState, type TimerType } from "../data";
import { liveTimerSeconds, pauseTimer } from "../timerUtils";

type Props = {
  scope: "global" | "subject"; subjectId?: string; timer?: TimerState; label?: string;
  onStart: (timer: TimerState) => void; onUpdate: (timer: TimerState) => void; onDelete: (id: string) => void;
  onComplete: (timer: TimerState, focusedSeconds: number) => void;
};

function TimerPanel({ scope, subjectId, timer, label, onStart, onUpdate, onDelete, onComplete }: Props) {
  const current = useMemo(() => timer ?? createTimer(scope, subjectId), [timer, scope, subjectId]);
  const [now, setNow] = useState(0);
  useEffect(() => { if (current.status !== "running") return; const interval = window.setInterval(() => setNow(Date.now()), 250); return () => clearInterval(interval); }, [current.status]);
  const seconds = liveTimerSeconds(current, now);

  useEffect(() => {
    if (current.status !== "running") return;
    const finished = (current.type === "pomodoro" && seconds <= 0) || (current.type === "stopwatch" && seconds >= LIMITS.stopwatchSeconds);
    if (!finished) return;
    const focused = current.type === "pomodoro" && current.mode === "focus" ? current.durationSeconds : current.type === "stopwatch" ? seconds : 0;
    onComplete(pauseTimer(current), focused);
  }, [seconds, current, onComplete]);

  const saveCurrentProgress = () => onUpdate(pauseTimer(current));
  const changeType = (type: TimerType) => { saveCurrentProgress(); onUpdate({ ...createTimer(scope, subjectId), type, durationSeconds: type === "pomodoro" ? 1500 : LIMITS.stopwatchSeconds, remainingSeconds: type === "pomodoro" ? 1500 : 0 }); };
  const reset = () => { saveCurrentProgress(); const paused = pauseTimer(current); onUpdate({ ...paused, status: "paused", startedAt: null, elapsedSeconds: 0, recordedSeconds: 0, remainingSeconds: current.type === "pomodoro" ? current.durationSeconds : 0, updatedAt: new Date().toISOString() }); };
  const toggle = () => current.status === "running" ? onUpdate(pauseTimer(current)) : onStart({ ...current, status: "running", startedAt: Date.now(), updatedAt: new Date().toISOString() });
  const nextPomodoro = () => { saveCurrentProgress(); const mode = current.mode === "focus" ? "break" : "focus"; const duration = (mode === "focus" ? current.focusMinutes : current.breakMinutes) * 60; onUpdate({ ...current, mode, durationSeconds: duration, remainingSeconds: duration, elapsedSeconds: 0, recordedSeconds: 0, status: "paused", startedAt: null, updatedAt: new Date().toISOString() }); };
  const deleteTimer = () => { saveCurrentProgress(); if (timer) onDelete(timer.id); };
  const configure = (field: "focusMinutes" | "breakMinutes", minutes: number) => { const bounded = field === "focusMinutes" ? Math.min(180, Math.max(5, minutes || 5)) : Math.min(60, Math.max(1, minutes || 1)); const applies = (field === "focusMinutes" && current.mode === "focus") || (field === "breakMinutes" && current.mode === "break"); onUpdate({ ...current, [field]: bounded, ...(applies ? { durationSeconds: bounded * 60, remainingSeconds: bounded * 60 } : {}), status: "paused", startedAt: null, updatedAt: new Date().toISOString() }); };
  const total = current.type === "pomodoro" ? current.durationSeconds : LIMITS.stopwatchSeconds;
  const progress = current.type === "pomodoro" ? Math.round((1 - seconds / total) * 360) : Math.min(360, Math.round(seconds / total * 360));

  return <section className="timer-workspace"><div className="timer-kind-switch"><button className={current.type === "pomodoro" ? "active" : ""} onClick={() => changeType("pomodoro")}>Pomodoro</button><button className={current.type === "stopwatch" ? "active" : ""} onClick={() => changeType("stopwatch")}>Cronômetro</button></div>{label && <div className="timer-context"><span style={{ background: "currentColor" }} />{label}</div>}<div className="timer-ring large" style={{ "--timer-progress": `${progress}deg` } as React.CSSProperties}><div><span className="timer-state">{current.status === "running" ? "EM ANDAMENTO" : "PAUSADO"}</span><strong>{formatTimer(seconds, current.type === "stopwatch")}</strong>{current.type === "pomodoro" && <small>{current.mode === "focus" ? `Ciclo de foco · ${current.focusMinutes} min` : `Intervalo · ${current.breakMinutes} min`}</small>}</div></div><div className="timer-controls"><button className="icon-button" onClick={reset} aria-label="Reiniciar"><RotateCcw /></button><button className="timer-main" onClick={toggle} aria-label={current.status === "running" ? "Pausar" : "Iniciar"}>{current.status === "running" ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}</button>{current.type === "pomodoro" ? <button className="icon-button" onClick={nextPomodoro} aria-label="Pular etapa"><SkipForward /></button> : <button className="icon-button danger" onClick={deleteTimer} aria-label="Excluir cronômetro"><Trash2 /></button>}</div>{current.type === "pomodoro" && current.status === "paused" && <div className="timer-settings"><label>Foco<input type="number" min="5" max="180" value={current.focusMinutes} onChange={(event) => configure("focusMinutes", Number(event.target.value))} /></label><label>Intervalo<input type="number" min="1" max="60" value={current.breakMinutes} onChange={(event) => configure("breakMinutes", Number(event.target.value))} /></label></div>}{timer && <button className="timer-delete-link" onClick={deleteTimer}><Trash2 size={14} /> Excluir relógio salvo</button>}</section>;
}

export default TimerPanel;
