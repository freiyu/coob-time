"use client";

import { useState } from "react";
import { Box, HelpCircle, Monitor, Moon, Pencil, Plus, Settings, Sun, Trash2 } from "lucide-react";
import Dialog from "@/components/dialog";
import Menu, { type MenuItem } from "@/components/menu";
import {
  BUTTON_DESTRUCTIVE,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
} from "@/components/data-panel";
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
  onOpenDataPanel: () => void;
  theme: ThemeChoice;
  onThemeChange: (theme: ThemeChoice) => void;
  selectionLocked: boolean;
}

const KBD_CLS =
  "rounded-lg border border-border bg-muted px-2 py-0.5 text-sm font-semibold";

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
  onOpenDataPanel,
  theme,
  onThemeChange,
  selectionLocked,
}: TopBarProps) {
  const [dialog, setDialog] = useState<"rename" | "delete" | "help" | null>(
    null,
  );
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
          <button
            type="button"
            aria-label="Open data and settings"
            onClick={onOpenDataPanel}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-input bg-card text-secondary-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Settings aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Keyboard shortcuts"
            onClick={() => setDialog("help")}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-input bg-card text-secondary-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HelpCircle aria-hidden className="size-4" />
          </button>
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
                className={BUTTON_SECONDARY}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!draftName.trim()}
                className={BUTTON_PRIMARY}
              >
                Save
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {dialog === "help" && (
        <Dialog title="Keyboard shortcuts" onClose={() => setDialog(null)}>
          <ul className="space-y-2 p-4 text-sm">
            <li className="flex items-center justify-between gap-4">
              <span>Start / stop the timer</span>
              <kbd className={KBD_CLS}>Space</kbd>
            </li>
            <li className="flex items-center justify-between gap-4">
              <span>Generate a new scramble (not while running)</span>
              <kbd className={KBD_CLS}>N</kbd>
            </li>
            <li className="flex items-center justify-between gap-4">
              <span>Toggle DNF on the solve from your last timer stop</span>
              <kbd className={KBD_CLS}>D</kbd>
            </li>
            <li className="flex items-center justify-between gap-4">
              <span>Cancel the ready state / close a popup</span>
              <kbd className={KBD_CLS}>Esc</kbd>
            </li>
          </ul>
          <p className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
            In hold mode, press and hold Space until Ready, then release to
            start. Shortcuts are ignored while typing in a field or while a
            popup is open. +2 goes through the visible buttons in the history
            or under the timer.
          </p>
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
                className={BUTTON_SECONDARY}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteSession();
                  setDialog(null);
                }}
                className={BUTTON_DESTRUCTIVE}
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
