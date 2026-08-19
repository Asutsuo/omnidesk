import TimerPanel from "../components/TimerPanel";
import type { TimerState } from "../data";
type Props = { timer?: TimerState; onStart: (timer: TimerState) => void; onUpdate: (timer: TimerState) => void; onDelete: (id: string) => void; onComplete: (timer: TimerState, seconds: number) => void };
function Timer(props: Props) { return <main className="page timer-page"><TimerPanel scope="global" label="Estudo geral" {...props} /></main>; }
export default Timer;
