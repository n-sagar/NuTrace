import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route } from "@/routes/dashboard";
import { loadDaily, saveDaily } from "@/lib/daily";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...await importOriginal<typeof import("@tanstack/react-router")>(),
  useNavigate: () => vi.fn(),
}));

function openDashboard() {
  const Component = Route.options.component;
  if (!Component) throw new Error("Dashboard component missing");
  render(<Component />);
}

describe("Dashboard water presets", () => {
  beforeEach(() => localStorage.clear());

  it.each([["+250ml", 250], ["+500ml", 500], ["+1L", 1000]] as const)("adds %s to the saved daily total", async (label, amount) => {
    openDashboard();
    fireEvent.click(await screen.findByRole("button", { name: label }));
    await waitFor(() => expect(loadDaily().waterMl).toBe(amount));
    expect(screen.getByText(`${(amount / 1000).toFixed(2)}L of 2L goal`)).toBeInTheDocument();
  });

  it("caps a 1L addition at 6000ml and disables all presets", async () => {
    saveDaily({ ...loadDaily(), waterMl: 5750 });
    openDashboard();
    fireEvent.click(await screen.findByRole("button", { name: "+1L" }));
    await waitFor(() => expect(loadDaily().waterMl).toBe(6000));
    for (const label of ["+250ml", "+500ml", "+1L"]) expect(screen.getByRole("button", { name: label })).toBeDisabled();
  });
});