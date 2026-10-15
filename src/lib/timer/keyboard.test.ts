import { describe, expect, it } from "vitest";
import { isDialogOpen, isInsideMenu, isTypingTarget } from "./keyboard";

describe("isTypingTarget", () => {
  it("detects text-entry elements", () => {
    expect(isTypingTarget({ tagName: "INPUT" } as unknown as EventTarget)).toBe(true);
    expect(isTypingTarget({ tagName: "TEXTAREA" } as unknown as EventTarget)).toBe(true);
    expect(isTypingTarget({ tagName: "SELECT" } as unknown as EventTarget)).toBe(true);
    expect(
      isTypingTarget({ tagName: "DIV", isContentEditable: true } as unknown as EventTarget),
    ).toBe(true);
  });

  it("ignores everything else", () => {
    expect(isTypingTarget({ tagName: "BUTTON" } as unknown as EventTarget)).toBe(false);
    expect(isTypingTarget({ tagName: "DIV" } as unknown as EventTarget)).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});

describe("isInsideMenu", () => {
  it("detects targets inside an open menu", () => {
    const target = {
      closest: (selector: string) => (selector === '[role="menu"]' ? {} : null),
    } as unknown as EventTarget;
    expect(isInsideMenu(target)).toBe(true);
  });

  it("ignores targets outside menus and objects without closest", () => {
    const outside = {
      closest: () => null,
    } as unknown as EventTarget;
    expect(isInsideMenu(outside)).toBe(false);
    expect(isInsideMenu({ tagName: "BUTTON" } as unknown as EventTarget)).toBe(false);
    expect(isInsideMenu(null)).toBe(false);
  });
});

describe("isDialogOpen", () => {
  it("detects an open dialog in the given root", () => {
    const open = {
      querySelector: (selector: string) =>
        selector === '[role="dialog"]' ? {} : null,
    } as unknown as ParentNode;
    const closed = {
      querySelector: () => null,
    } as unknown as ParentNode;
    expect(isDialogOpen(open)).toBe(true);
    expect(isDialogOpen(closed)).toBe(false);
  });

  it("is false without a document or querySelector", () => {
    expect(isDialogOpen({} as unknown as ParentNode)).toBe(false);
    expect(isDialogOpen(undefined)).toBe(false); // node env: no document
  });
});
