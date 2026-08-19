import { Pause, Play, RotateCcw, SkipForward, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
type Props = { onSessionComplete: (minutes: number) => void };
const durations = { Foco: 25, "Pausa curta": 5, "Pausa longa": 15 } as const;
type Mode = keyof typeof durations;
function Timer({ onSessionComplete }: Props) {
  const [mode, setMode] = useState<Mode>("Foco"); const [seconds, setSeconds] = useState(25 * 60); const [running, setRunning] = useState(false); const [cycles, setCycles] = useState(0);
  const reset = (nextMode = mode) => { setRunning(false); setSeconds(durations[nextMode] * 60); };
  useEffect(() => { if (!running) return; const interval = window.setInterval(() => setSeconds((value) => { if (value > 1) return value - 1; setRunning(false); if (mode === "Foco") { onSessionComplete(durations.Foco); setCycles((c) => c + 1); } return durations[mode] * 60; }), 1000); return () => clearInterval(interval); }, [running, mode, onSessionComplete]);
  const changeMode = (next: Mode) => { setMode(next); reset(next); }; const value = Math.round((1 - seconds / (durations[mode] * 60)) * 360);
  return <main className="page timer-page"><div className="mode-tabs">{(Object.keys(durations) as Mode[]).map((item) => <button className={mode === item ? "active" : ""} onClick={() => changeMode(item)} key={item}>{item}</button>)}</div><section className="timer-card"><span className="eyebrow">{mode === "Foco" ? "HORA DE CONCENTRAR" : "RESPIRE UM POUCO"}</span><div className="timer-ring" style={{ "--timer-progress": `${value}deg` } as React.CSSProperties}><div><strong>{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</strong><span>{running ? "em andamento" : "pronto para iniciar"}</span></div></div><div className="timer-controls"><button className="icon-button" onClick={() => reset()} aria-label="Reiniciar"><RotateCcw /></button><button className="timer-main" onClick={() => setRunning(!running)} aria-label={running ? "Pausar" : "Iniciar"}>{running ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}</button><button className="icon-button" onClick={() => setSeconds(1)} aria-label="Pular"><SkipForward /></button></div><p><Volume2 size={16} /> Som ambiente · Biblioteca silenciosa</p></section><div className="cycle-row">{[0, 1, 2, 3].map((item) => <span className={item < cycles % 4 ? "done" : ""} key={item} />)}<small>{cycles} ciclos concluídos hoje</small></div></main>;
}
export default Timer;
