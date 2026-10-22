import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadPrefs, savePrefs, clampWaterGoal, clampSleepGoal, defaultPrefs, clearSession, subscribePrefs } from "@/lib/prefs";
import { loadDaily, saveDaily, playClick, playDroplet } from "@/lib/daily";

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("Profile persistence", () => {
  const prefs = { name: "Sagar", avatar: "🐳", email: "sagar@example.com", waterGoal: 2000, sleepGoal: 8 };

  it("keeps the chosen name and avatar when read again", () => {
    savePrefs(prefs);
    expect(loadPrefs()).toMatchObject({ name: "Sagar", avatar: "🐳" });
  });

  it("keeps an updated 2.5L water goal", () => {
    savePrefs(prefs);
    savePrefs({ ...prefs, waterGoal: 2500 });
    expect(loadPrefs()?.waterGoal).toBe(2500);
  });

  it("keeps an updated 9h sleep goal", () => {
    savePrefs(prefs);
    savePrefs({ ...prefs, sleepGoal: 9 });
    expect(loadPrefs()?.sleepGoal).toBe(9);
  });
});

function mockAudio() {
  const frequency = { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), value: 0 };
  const volume = { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
  const gain = { gain: volume, connect: vi.fn() };
  const oscillator = { type: "", frequency, connect: vi.fn(() => gain), start: vi.fn(), stop: vi.fn(), onended: null };
  const close = vi.fn();
  vi.stubGlobal("AudioContext", class {
    currentTime = 10;
    destination = {};
    createOscillator = () => oscillator;
    createGain = () => gain;
    close = close;
  });
  return { frequency, volume, oscillator };
}

describe("Water audio", () => {
  it("uses a low-volume 260–200Hz tap decaying over 60ms", () => {
    const { frequency, volume, oscillator } = mockAudio();
    playDroplet();
    expect(frequency.setValueAtTime).toHaveBeenCalledWith(260, 10);
    expect(frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(200, 10.06);
    expect(volume.setValueAtTime).toHaveBeenCalledWith(0.035, 10);
    expect(volume.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.0001, 10.06);
    expect(oscillator.stop).toHaveBeenCalledWith(10.06);
    vi.unstubAllGlobals();
  });

  it("leaves the existing settings click unchanged", () => {
    const { frequency, volume } = mockAudio();
    playClick();
    expect(frequency.value).toBe(880);
    expect(volume.setValueAtTime).toHaveBeenCalledWith(0.08, 10);
    vi.unstubAllGlobals();
  });
});

describe("Custom goals", () => {
  it("accepts a custom 2250ml water goal", () => {
    expect(clampWaterGoal(2250)).toBe(2250);
  });

  it("accepts a custom 7.5h sleep goal", () => {
    expect(clampSleepGoal(7.5)).toBe(7.5);
  });

  it("clamps water goals to 500–6000ml", () => {
    expect(clampWaterGoal(100)).toBe(500);
    expect(clampWaterGoal(9000)).toBe(6000);
  });

  it("clamps sleep goals to 3–12h in half-hour steps", () => {
    expect(clampSleepGoal(1)).toBe(3);
    expect(clampSleepGoal(15)).toBe(12);
    expect(clampSleepGoal(7.3)).toBe(7.5);
  });

  it("persists a custom goal so the dashboard reads it back", () => {
    savePrefs({ name: "Sagar", avatar: "🦊", email: "sagar@example.com", waterGoal: clampWaterGoal(2250), sleepGoal: clampSleepGoal(7.5) });
    expect(loadPrefs()).toMatchObject({ waterGoal: 2250, sleepGoal: 7.5 });
  });
});

describe("Mid-day goal changes", () => {
  it("keeps logged water untouched when the goal changes", () => {
    const d = loadDaily();
    saveDaily({ ...d, waterMl: 1750 });
    savePrefs({ name: "Sagar", avatar: "🦊", email: "sagar@example.com", waterGoal: 2000, sleepGoal: 8 });
    savePrefs({ name: "Sagar", avatar: "🦊", email: "sagar@example.com", waterGoal: 2500, sleepGoal: 8 });
    expect(loadDaily().waterMl).toBe(1750);
    expect(loadPrefs()?.waterGoal).toBe(2500);
  });
});

describe("Cross-tab preferences and fallbacks", () => {
  const prefs = { name: "Sagar", avatar: "🦊", email: "sagar@example.com", waterGoal: 2650, sleepGoal: 8.5 };
  const storageEvent = (key: string | null) => window.dispatchEvent(new StorageEvent("storage", { key, storageArea: localStorage }));

  it("round-trips an exact 2650ml custom water goal", () => {
    savePrefs(prefs);
    expect(loadPrefs()?.waterGoal).toBe(2650);
  });

  it("round-trips an exact 8.5h custom sleep goal", () => {
    savePrefs(prefs);
    expect(loadPrefs()?.sleepGoal).toBe(8.5);
  });

  it("notifies subscribers of another tab's goal changes without changing logged water", () => {
    saveDaily({ ...loadDaily(), waterMl: 1750 });
    const onChange = vi.fn();
    const unsubscribe = subscribePrefs(onChange);
    try {
      localStorage.setItem("nutrace.prefs", JSON.stringify(prefs));
      storageEvent("nutrace.prefs");
      expect(onChange).toHaveBeenLastCalledWith(prefs);
      expect(loadDaily().waterMl).toBe(1750);
    } finally { unsubscribe(); }
  });

  it("resets cleared storage to 2000ml water and 8h sleep", () => {
    savePrefs(prefs);
    let current = prefs;
    const unsubscribe = subscribePrefs((p) => { current = p ?? defaultPrefs(); });
    try {
      localStorage.clear();
      storageEvent(null);
      expect(current.waterGoal).toBe(2000);
      expect(current.sleepGoal).toBe(8);
    } finally { unsubscribe(); }
  });

  it("resets logout to default targets and removes daily logs", () => {
    savePrefs(prefs);
    saveDaily({ ...loadDaily(), waterMl: 1750, sleepHours: 8.5 });
    let current = prefs;
    const unsubscribe = subscribePrefs((p) => { current = p ?? defaultPrefs(); });
    try {
      clearSession();
      expect(current.waterGoal).toBe(2000);
      expect(current.sleepGoal).toBe(8);
      expect(loadDaily()).toMatchObject({ waterMl: 0, sleepHours: null });
    } finally { unsubscribe(); }
  });

  it("defaults missing and invalid stored targets safely", () => {
    localStorage.setItem("nutrace.prefs", JSON.stringify({ waterGoal: "2650", sleepGoal: null }));
    expect(loadPrefs()).toMatchObject({ waterGoal: 2000, sleepGoal: 8 });
    localStorage.setItem("nutrace.prefs", "broken json");
    expect(loadPrefs() ?? defaultPrefs()).toMatchObject({ waterGoal: 2000, sleepGoal: 8 });
  });

  it("ignores unrelated keys and stops updates after unsubscribing", () => {
    const onChange = vi.fn();
    const unsubscribe = subscribePrefs(onChange);
    storageEvent("unrelated");
    expect(onChange).not.toHaveBeenCalled();
    unsubscribe();
    storageEvent("nutrace.prefs");
    expect(onChange).not.toHaveBeenCalled();
  });
});