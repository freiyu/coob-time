"use client";

import { useState } from "react";
import { Box, Monitor, Moon, Pencil, Plus, Sun, Trash2 } from "lucide-react";
import Dialog from "@/components/dialog";
import Menu, { type MenuItem } from "@/components/menu";
import { PUZZLES, type Puzzle, type PuzzleId } from "@/lib/puzzles";

export type ThemeChoice = "dark" | "light" | "system";

interface SessionOption {
  id: string;
  name: string;
  count: number;
}

interface TopBarProps {
  puzzleId: PuzzleId;
  onPuzzleChange: (puzzleId: PuzzleId) => void;
  sessions: SessionOption[];
  sessionId: string;
  onSessionChange: (sessionId: string) => void;
  onNewSession: () => void;
  onRenameSession: (name: string) => void;
  onDeleteSession: () => void;
  theme: ThemeChoice;
  onThemeChange: (theme: ThemeChoice) => void;
  selectionLocked: boolean;
}

const themeOptions: { value: ThemeChoice; label: string; icon: React.ReactNode }[] = [
  { value: "dark", label: "Dark", icon: <Moon aria-hidden className="size-4" /> },
  { value: "light", label: "Light", icon: <Sun aria-hidden className="size-4" /> },
  { value: "system", label: "System", icon: <Monitor aria-hidden className="size-4" /> },
];

export default function TopBar({
  puzzleId,
  onPuzzleChange,
  sessions,
  sessionId,
  onSessionChange,
  onNewSession,
  onRenameSession,
  onDeleteSession,
  theme,
  onThemeChange,
  selectionLocked,
}: TopBarProps) {
  const [dialog, setDialog] = useState<"rename" | "delete" | null>(null);
  const [draftName, setDraftName] = useState("");

  const activeSession = sessions.find((session) => session.id === sessionId);
  const canDeleteSession = sessions.length > 1;

  const puzzleItems: MenuItem[] = PUZZLES.map((puzzle: Puzzle) => ({
    label: puzzle.label,
    value: puzzle.id,
    disabled: selectionLocked && puzzle.id !== puzzleId,
    onSelect: () => onPuzzleChange(puzzle.id),
  }));

  const sessionItems: MenuItem[] = [
    ...sessions.map((session) => ({
      label: `${session.name} (${session.count})`,
      value: session.id,
      disabled: selectionLocked && session.id !== sessionId,
      onSelect: () => onSessionChange(session.id),
    })),
    {
      label: "+ New session",
      value: "new-session",
      icon: <Plus aria-hidden className="size-4" />,
      disabled: selectionLocked,
      onSelect: onNewSession,
    },
    {
      label: "Rename session",
      value: "rename-session",
      icon: <Pencil aria-hidden className="size-4" />,
      disabled: selectionLocked,
      onSelect: () => {
        setDraftName(activeSession?.name ?? "");
        setDialog("rename");
      },
    },
    {
      label: "Delete session",
      value: "delete-session",
      icon: <Trash2 aria-hidden className="size-4" />,
      disabled: selectionLocked || !canDeleteSession,
      onSelect: () => setDialog("delete"),
    },
  ];

  const themeItems: MenuItem[] = themeOptions.map((option) => ({
    label: option.label,
    value: option.value,
    icon: option.icon,
    onSelect: () => onThemeChange(option.value),
  }));

  const activeTheme = themeOptions.find((option) => option.value === theme);

  return (
    <>
      <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex flex-1 items-center gap-2">
          <Box aria-hidden className="size-5 text-brand-strong" />
          <h1 className="text-base font-semibold">CubeTime</h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Menu
            label={
              PUZZLES.find((puzzle) => puzzle.id === puzzleId)?.label ?? puzzleId
            }
            items={puzzleItems}
            activeValue={puzzleId}
            ariaLabel="Select puzzle"
          />
          <Menu
            label={activeSession?.name ?? "No session"}
            items={sessionItems}
            activeValue={sessionId}
            ariaLabel="Select session"
          />
          <Menu
            label={activeTheme?.label ?? "Theme"}
            items={themeItems}
            activeValue={theme}
            ariaLabel="Select theme"
            triggerIcon={activeTheme?.icon}
            align="right"
          />
        </div>
      </div>
    </header>
    {dialog === "rename" && activeSession && (
        <Dialog
          title="Rename session"
          onClose={() => setDialog(null)}
        >
          <form
            className="space-y-3 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              const name = draftName.trim();
              if (!name) return;
              onRenameSession(name);
              setDialog(null);
            }}
          >
            <label className="block text-sm font-medium">
              Session name
              <input
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                autoFocus
                maxLength={80}
                className="mt-1.5 h-10 w-full rounded-lg border border-input bg-card px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-secondary-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!draftName.trim()}
                className="h-10 rounded-lg bg-brand px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {dialog === "delete" && activeSession && (
        <Dialog
          title="Delete session"
          onClose={() => setDialog(null)}
        >
          <div className="space-y-3 p-4">
            <p className="text-sm">
              Delete <span className="font-semibold">{activeSession.name}</span>{" "}
              and its {activeSession.count}{" "}
              {activeSession.count === 1 ? "solve" : "solves"}? This cannot be
              undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-secondary-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteSession();
                  setDialog(null);
                }}
                className="h-10 rounded-lg bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors duration-150 hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Delete
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
