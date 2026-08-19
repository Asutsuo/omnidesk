import { LIMITS, type TimerState } from "./data";
export const liveTimerSeconds = (timer: TimerState, now: number) => {
  const delta = timer.status === "running" && timer.startedAt ? Math.max(0, Math.floor((now - timer.startedAt) / 1000)) : 0;
  return timer.type === "pomodoro" ? Math.max(0, timer.remainingSeconds - delta) : Math.min(LIMITS.stopwatchSeconds, timer.elapsedSeconds + delta);
};
export function pauseTimer(timer: TimerState, now = Date.now()): TimerState {
  const current = liveTimerSeconds(timer, now);
  return { ...timer, remainingSeconds: timer.type === "pomodoro" ? current : timer.remainingSeconds, elapsedSeconds: timer.type === "stopwatch" ? current : timer.elapsedSeconds, status: "paused", startedAt: null, updatedAt: new Date(now).toISOString() };
}
