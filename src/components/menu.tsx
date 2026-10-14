"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface MenuItem {
  label: string;
  value: string;
  onSelect: () => void;
  icon?: ReactNode;
  disabled?: boolean;
}

interface MenuProps {
  label: string;
  items: MenuItem[];
  activeValue?: string;
  ariaLabel: string;
  triggerIcon?: ReactNode;
  align?: "left" | "right";
}

const triggerClass =
  "flex h-10 items-center gap-2 rounded-lg border border-input bg-card px-3 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function menuButtons(list: HTMLUListElement | null): HTMLButtonElement[] {
  return Array.from(
    list?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [],
  );
}

export default function Menu({
  label,
  items,
  activeValue,
  ariaLabel,
  triggerIcon,
  align = "left",
}: MenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const menuId = useId();

  const focusItem = (index: number) => {
    const buttons = menuButtons(listRef.current);
    if (buttons.length === 0) return;
    const wrapped = ((index % buttons.length) + buttons.length) % buttons.length;
    buttons[wrapped]?.focus();
  };

  useEffect(() => {
    if (!open) return;
    menuButtons(listRef.current)[0]?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleListKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (
      event.key !== "ArrowDown" &&
      event.key !== "ArrowUp" &&
      event.key !== "Home" &&
      event.key !== "End"
    ) {
      return;
    }
    event.preventDefault();
    const buttons = menuButtons(listRef.current);
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "ArrowDown") focusItem(current + 1);
    else if (event.key === "ArrowUp") focusItem(current - 1);
    else if (event.key === "Home") focusItem(0);
    else focusItem(buttons.length - 1);
  };

  const handleListBlur = (event: React.FocusEvent<HTMLUListElement>) => {
    if (!rootRef.current?.contains(event.relatedTarget as Node | null)) {
      setOpen(false);
    }
  };

  const selectItem = (item: MenuItem) => {
    item.onSelect();
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className={triggerClass}
      >
        {triggerIcon}
        <span className="max-w-[8.5rem] truncate sm:max-w-none">{label}</span>
        <ChevronDown
          aria-hidden
          className={`size-4 text-muted-foreground transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul
          ref={listRef}
          id={menuId}
          role="menu"
          aria-label={ariaLabel}
          onKeyDown={handleListKeyDown}
          onBlur={handleListBlur}
          className={`absolute z-20 mt-1 min-w-48 rounded-lg border border-border bg-popover p-1 shadow-lg ${align === "right" ? "right-0" : "left-0"}`}
        >
          {items.map((item) => {
            const isActive = item.value === activeValue;
            return (
              <li key={item.value} role="none">
                <button
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  disabled={item.disabled}
                  onClick={() => selectItem(item)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isActive
                      ? "bg-muted font-medium text-primary"
                      : "text-popover-foreground hover:bg-muted"
                  } disabled:opacity-50`}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {isActive && <Check aria-hidden className="size-4" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
