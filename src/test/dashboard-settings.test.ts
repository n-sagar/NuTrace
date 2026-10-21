import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadPrefs, savePrefs } from "@/lib/prefs";
import { playClick, playDroplet } from "@/lib/daily";

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