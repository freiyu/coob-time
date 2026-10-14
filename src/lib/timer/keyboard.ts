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
