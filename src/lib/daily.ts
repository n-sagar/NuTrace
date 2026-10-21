export type SleepQuality = "rested" | "okay" | "tired";
export type SleepStages = { rem: number; core: number; deep: number; awake: number };

export type DailyState = {
  date: string; // YYYY-MM-DD, reset at midnight
  waterMl: number;
  syncOn: boolean;
  sleepHours: number | null;
  sleepQuality: SleepQuality | null;
};

const KEY = "nutrace.daily";

/** Hard cap on daily water logging (6.0L) */
export const MAX_WATER_ML = 6000;

export const SYNCED_SLEEP: { hours: number; minutes: number; stages: SleepStages } = {
  hours: 7,
  minutes: 45,
  stages: { rem: 22, core: 49, deep: 18, awake: 11 }, // percentages
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function fresh(): DailyState {
  return { date: todayKey(), waterMl: 0, syncOn: false, sleepHours: null, sleepQuality: null };
}

export function loadDaily(): DailyState {
  try {
    const r = localStorage.getItem(KEY);
    if (!r) return fresh();
    const d = JSON.parse(r) as DailyState;
    return d.date === todayKey() ? d : { ...fresh(), syncOn: d.syncOn };
  } catch {
    return fresh();
  }
}

export function saveDaily(d: DailyState) {
  localStorage.setItem(KEY, JSON.stringify(d));
}

/** "4h 12m" until next local midnight */
export function timeToMidnight(now = new Date()): string {
  const mid = new Date(now);
  mid.setHours(24, 0, 0, 0);
  const mins = Math.max(0, Math.round((mid.getTime() - now.getTime()) / 60000));
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

/** Subtle Web Audio click for button taps */
export function playClick() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.09);
    osc.onended = () => void ctx.close();
  } catch {
    /* audio unavailable */
  }
}

/** Crisp organic "pop" for tracker buttons */
export function playPop() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.11);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
    osc.onended = () => void ctx.close();
  } catch {
    /* audio unavailable */
  }
}
