"use client";

import { Box, Monitor, Moon, Sun } from "lucide-react";
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
  theme: ThemeChoice;
  onThemeChange: (theme: ThemeChoice) => void;
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
  theme,
  onThemeChange,
}: TopBarProps) {
  const puzzleItems: MenuItem[] = PUZZLES.map((puzzle: Puzzle) => ({
    label: puzzle.label,
    value: puzzle.id,
    onSelect: () => onPuzzleChange(puzzle.id),
  }));

  const sessionItems: MenuItem[] = sessions.map((session) => ({
    label: `${session.name} (${session.count})`,
    value: session.id,
    onSelect: () => onSessionChange(session.id),
  }));

  const themeItems: MenuItem[] = themeOptions.map((option) => ({
    label: option.label,
    value: option.value,
    icon: option.icon,
    onSelect: () => onThemeChange(option.value),
  }));

  const activeSession = sessions.find((session) => session.id === sessionId);
  const activeTheme = themeOptions.find((option) => option.value === theme);

  return (
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
  );
}
