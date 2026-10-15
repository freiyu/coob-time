interface DomTargetLike {
  tagName?: string;
  isContentEditable?: boolean;
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== "object") return false;
  const el = target as DomTargetLike;
  if (el.isContentEditable === true) return true;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

interface MenuClosest {
  closest?: (selector: string) => unknown;
}

export function isInsideMenu(target: EventTarget | null): boolean {
  if (!target || typeof target !== "object") return false;
  const el = target as MenuClosest;
  if (typeof el.closest !== "function") return false;
  return el.closest('[role="menu"]') !== null;
}

// True while a dialog is open, so Space/N/D/Esc act on the dialog instead
// of the timer (a click inside a dialog can leave focus on <body>).
export function isDialogOpen(root?: ParentNode): boolean {
  const scope = root ?? (typeof document !== "undefined" ? document : null);
  if (!scope || typeof scope.querySelector !== "function") return false;
  return scope.querySelector('[role="dialog"]') !== null;
}
