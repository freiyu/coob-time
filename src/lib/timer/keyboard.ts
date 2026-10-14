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
