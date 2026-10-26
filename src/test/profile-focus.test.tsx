import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ProfileModal } from "@/components/ProfileModal";
import { defaultPrefs } from "@/lib/prefs";

function ProfileHarness() {
  const [open, setOpen] = useState(false);
  return <>
    <button id="profile-trigger" onClick={() => setOpen(true)}>Open account profile</button>
    {open && <ProfileModal prefs={defaultPrefs()} onSave={vi.fn()} onLogout={vi.fn()} onClose={() => setOpen(false)} />}
  </>;
}

describe("Profile keyboard workflow", () => {
  it("focuses Close when the profile opens", async () => {
    render(<ProfileHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Open account profile" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Close profile" })).toHaveFocus());
  });

  it("closes on Escape and restores focus to the avatar trigger", async () => {
    render(<ProfileHarness />);
    const trigger = screen.getByRole("button", { name: "Open account profile" });
    fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole("button", { name: "Close profile" })).toHaveFocus());
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});