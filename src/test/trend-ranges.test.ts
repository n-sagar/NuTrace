import { describe, expect, it } from "vitest";
import { comparisonRows, sampleConfidence, trendDates } from "@/lib/trend-ranges";
import { timezoneForCity } from "@/lib/timezones";
import { summarizeWeek, windDownInsight, type DaySnapshot } from "@/lib/weekly";
const now = new Date(2026, 10, 5, 12);
const today: DaySnapshot = { date: "2026-11-05", waterMl: 2500, sleepHours: 8, windDownMinutes: 15 };
describe("Timezone city matching", () => {
  it("assigns Los Angeles without underscores", () => { expect(timezoneForCity("Los Angeles")).toBe("America/Los_Angeles"); });
  it("assigns San Francisco without underscores", () => { expect(timezoneForCity("San Francisco")).toBe("America/Los_Angeles"); });
  it("normalizes case, separators and minor typos", () => {
    expect(timezoneForCity(" LOS_ANGELES ")).toBe("America/Los_Angeles");
    expect(timezoneForCity("San Francsco")).toBe("America/Los_Angeles");
  });
  it("does not infer an unknown or incomplete city", () => { expect(timezoneForCity("Springfield")).toBeNull(); expect(timezoneForCity("San")).toBeNull(); });
});
describe("Trend ranges", () => {
  it("includes exactly seven local days", () => { expect(trendDates("7", "", "", now)).toEqual(["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05"]); });
  it("includes exactly fourteen retained days", () => { const dates = trendDates("14", "", "", now); expect(dates).toHaveLength(14); expect(dates[0]).toBe("2026-10-23"); expect(dates[13]).toBe("2026-11-05"); });
  it("uses inclusive custom boundaries", () => { expect(trendDates("custom", "2026-11-01", "2026-11-03", now)).toEqual(["2026-11-01", "2026-11-02", "2026-11-03"]); });
  it("rejects reversed or unavailable ranges", () => { expect(trendDates("custom", "2026-11-03", "2026-11-01", now)).toEqual([]); expect(trendDates("custom", "2026-10-01", "2026-11-03", now)).toEqual([]); });
  it("excludes today outside the selected range", () => {
    const dates = trendDates("custom", "2026-11-01", "2026-11-02", now);
    const summary = summarizeWeek([{ ...today, date: "2026-11-01", waterMl: 1000 }], today, "water", 2, now, dates);
    expect(summary.average).toBe(1); expect(summary.loggedDays).toBe(1); expect(summary.days[1]?.value).toBeNull();
  });
  it("preserves actual values and independently scales comparison metrics", () => {
    const rows = comparisonRows([{ ...today, date: "2026-11-04", waterMl: 1250, sleepHours: 4, windDownMinutes: 30 }], today, ["2026-11-03", "2026-11-04", "2026-11-05"]);
    expect(rows[0]?.sleepRelative).toBeNull(); expect(rows[1]).toMatchObject({ water: 1.25, waterRelative: 50, sleep: 4, sleepRelative: 50, windDown: 30, windDownRelative: 100 });
  });
  it("keeps explicitly logged zero values visible in comparisons", () => {
    expect(comparisonRows([], { ...today, waterMl: 0, windDownMinutes: 0 }, [today.date])[0]).toMatchObject({ waterRelative: 0, windDownRelative: 0 });
  });
  it("counts only pairs whose sleep day is in the active range", () => {
    const history = [{ ...today, date: "2026-11-03", windDownMinutes: 30 }, { ...today, date: "2026-11-04", windDownMinutes: 5 }];
    expect(windDownInsight(history, today, now, ["2026-11-04"])).toMatchObject({ longerCount: 1, shorterCount: 0, differenceMinutes: null });
    expect(windDownInsight(history, today, now, ["2026-11-05"])).toMatchObject({ longerCount: 0, shorterCount: 1 });
  });
  it("keeps sample confidence conservative and bounded by both groups", () => {
    expect(sampleConfidence(5, 1)).toBe("Insufficient data");
    expect(sampleConfidence(5, 2)).toBe("Low confidence · small sample");
    expect(sampleConfidence(5, 5)).toBe("Moderate confidence · observational");
  });
});