# CubeTime — Design Direction (green + blue, dark default, light and system)

This file is the reference for every UI decision and for the anti-slop reviewer.
PRD Section 6 (readable text, contrast, accessibility, visual states) always wins over this file.
Colors are a starting palette: edit the hex values to your taste, but keep the roles and the contrast rules.

## Character
Focused, quick, a little playful, never noisy. The timer is the visual centerpiece and everything else supports it.
Dark is the default (PRD 6.1), light and system are available. Light mode is fresh with green and blue.
Dark mode keeps the same two hues in soft pastel tones so it stays elegant and easy on the eyes.

## Principles
1. The timer comes first. Nothing on the screen competes with it while a solve is running.
2. **Blue means "you can act on this"** (buttons, links, focus, selected controls).
   **Green means identity and "good"** (brand mark, ready, saved, main chart series).
   Never use green for something clickable and never use blue for a state.
3. Neutrals carry the layout. Color is used sparingly and always with a reason.
4. Borders and spacing for structure. Shadows only for overlays (menus, dialogs, popovers).
5. If an element carries no information or action, remove it.
6. Motion only for meaningful feedback (state changes). Respect `prefers-reduced-motion`.
7. The same thing looks the same everywhere (one button style per role, one badge style).

## Color roles
| Role | Use |
|---|---|
| Primary (blue) | Primary buttons, links, focus ring, selected controls, info |
| Brand (green) | Logo mark, Ready state, Saved, chart series 2 |
| Neutral | Backgrounds, surfaces, borders, text (slightly green-tinted gray) |
| Warning (amber) | +2 penalty, "not enough data" hints |
| Danger (red) | Holding (not ready yet), DNF, errors, destructive actions |
| pb (red / orange) | Personal best: fastest time text + PB text-and-icon marker (`text-pb-foreground`) |

Large areas stay neutral. Do not flood pages with green or blue fills.

## Light mode tokens
| Token | Hex | Notes |
|---|---|---|
| background | `#F6F9F8` | Page background |
| card / popover | `#FFFFFF` | Surfaces |
| muted / secondary / accent | `#EDF3F1` | Hover, table header, subtle fills |
| border | `#D6E1DE` | Dividers, card borders |
| input | `#7A918C` | Control borders (3.4:1 on white) |
| foreground | `#12211D` | Body text and timer digits |
| muted-foreground | `#475B57` | Secondary text (7.2:1 on white) |
| primary | `#1B66D1` | Blue. White text on it is 5.4:1 |
| primary-hover | `#1556B3` | |
| primary-soft / fg | `#E4EEFC` / `#174A99` | Info badges, selected rows |
| brand | `#12A06E` | Graphics and decoration only (3.3:1 on white) |
| brand-strong | `#0B7D55` | Green text or icons on light surfaces (5.2:1) |
| brand-soft / fg | `#DDF3E9` / `#0A5F42` | Saved / success badge |
| warning bg / fg | `#FDF1D3` / `#8A4B06` | +2 |
| pb-foreground | `#D92D20` | Fastest solve / average time text (light: red) |
| danger bg / fg | `#FDE3E1` / `#A1261B` | DNF, errors |
| destructive | `#B42318` | Destructive buttons, white text on it is 6.6:1 |
| ring | `#1B66D1` | Focus ring, 2px with offset |

## Dark mode tokens (same hues, pastel)
| Token | Hex | Notes |
|---|---|---|
| background | `#0E1514` | Never pure black |
| card | `#151F1E` | Surfaces are lighter than the background |
| popover / muted / secondary / accent | `#1B2827` | Raised surfaces, hover, table header |
| border | `#2A3A38` | |
| input | `#6A827E` | Control borders (4.1:1 on card) |
| foreground | `#E7F0ED` | Never pure white. Body text and timer digits |
| muted-foreground | `#A2B6B1` | 7.9:1 on card |
| primary | `#8DB8FF` | Pastel blue. Text on it is `#0A1E3D` (8.2:1) |
| primary-hover | `#A8CAFF` | |
| primary-soft / fg | `#1B2B45` / `#BBD5FF` | Info badges, selected rows |
| brand | `#86D9B5` | Pastel green, readable as text on dark (10:1) |
| brand-soft / fg | `#153126` / `#A9EACD` | Saved / success badge |
| warning bg / fg | `#3A2D12` / `#F3CF8A` | +2 |
| pb-foreground | `#FF922B` | Fastest solve / average time text (dark: bright orange) |
| danger bg / fg | `#3E1C1A` / `#F4A9A2` | DNF, errors |
| destructive | `#F4A9A2` | Text on it is `#3A0F0C` (8.8:1) |
| ring | `#8DB8FF` | Focus ring |

Dark mode rules:
- Pastel colors are for accents, text, and small fills. Never make large areas pastel.
- Show elevation with lighter surfaces, not shadows.
- Badges use a dark tinted background with a pastel text color, not bright fills.
- Dark mode is not "invert the light theme". Check each screen in both modes.

## The timer
Every state needs a **text label** in addition to color (PRD 6.3, 6.4). Contrast of the state color as text is verified
at 4.8:1 or better on the page background and card in both themes.

| State | Digits | Label text | Color cue |
|---|---|---|---|
| Idle | `0.00` in foreground | "Hold Space to start" (keyboard only; mouse/tap does nothing) | none |
| Holding (hold-to-ready, not ready yet) | danger | "Hold…" | danger text color on the digits and label, thin danger ring on the card |
| Ready (release to start) | brand | "Ready" | brand text color on the digits and label, thin brand ring on the card |
| Running | foreground | "Running" (sr-only while focused) | none, keep the screen calm |
| Stopped, pending | foreground (effective time) | "Saving…" then "Saved" with a check icon | brand on "Saved" |
| +2 | foreground (effective time) | "+2" badge | warning badge |
| DNF | foreground, struck or labeled | "DNF" badge | danger badge |

Rules:
- **Running focus mode**: while running every other element fades out (300ms, opacity only) and the timer card animates to the center of the viewport (translate transition, no layout shift). On stop it reverses. All of it honors `prefers-reduced-motion`.
- Digits use **tabular figures** (`tabular-nums`) so the width never changes while counting. No layout shift between states.
- Weight 600 to 700, one font family, very large (use `clamp()` so it scales from a small phone to a wide monitor), never thin.
- Update the display smoothly, but never let the display rate affect the measured time.
- Start and stop are keyboard-only (Space), per the owner's decision overriding PRD FR-T04 touch controls: the timer is not a clickable control, and clicks/taps on it do nothing.
- Announce state changes ("Ready", "Saved") to assistive technology, never every tick.

## Scramble panel
- Selected puzzle name is always visible. Scramble text has high contrast, generous line height, and wraps cleanly.
- Use a monospace or tabular font for notation. Check 3×3 on a phone, and Megaminx and Square-1 on a narrow screen.
- Buttons **New Scramble** and **Copy Scramble** have text labels. Copy confirms with a short "Copied" message.
- A generation failure shows a clear error with a retry action. It never shows placeholder or fake notation.

## Layout (PRD 6.2)
- Desktop: top bar (name, puzzle selector, session selector, theme and settings), a large timer, the scramble panel,
  then statistics and history in tabs or two columns.
- Mobile: timer near the center, puzzle selector reachable without a cramped bar, history and statistics in tabs.
- Every interactive target is comfortable to tap.

## Statistics and history
- Show only numbers that mean something: count, best single, mean, Ao5, Ao12, best Ao5, best Ao12, and the trend chart.
- Show "Not enough solves" instead of a misleading value. Mark a personal best with text and an icon, not color alone.
- History rows: solve number, time, penalty badge, actions in a menu. Right-align numbers and use tabular figures.
- Clear empty states for new users, with a short sentence that data lives only in this browser.

## Chart series (at most 5; direct labels or a clear legend; no 3D, no gradients)
| Series | Light | Dark |
|---|---|---|
| 1 | `#1B66D1` | `#8DB8FF` |
| 2 | `#12A06E` | `#86D9B5` |
| 3 | `#BF7A06` | `#E8C170` |
| 4 | `#6B5BC7` | `#B3B9E8` |
| 5 | `#6B7F86` | `#9FB2BA` |

Never rely on color alone in a chart. Add labels or direct values.

## CSS variables (shadcn/Tailwind mapping)
Define tokens once as CSS variables and use them everywhere. Never hard-code hex values in components.
Convert the format if the project's shadcn setup uses HSL or OKLCH, but keep the values equivalent.

```css
:root {
  --background: #F6F9F8;        --foreground: #12211D;
  --card: #FFFFFF;              --card-foreground: #12211D;
  --popover: #FFFFFF;           --popover-foreground: #12211D;
  --primary: #1B66D1;           --primary-foreground: #FFFFFF;
  --secondary: #EDF3F1;         --secondary-foreground: #12211D;
  --muted: #EDF3F1;             --muted-foreground: #475B57;
  --accent: #EDF3F1;            --accent-foreground: #12211D;
  --destructive: #B42318;       --destructive-foreground: #FFFFFF;
  --border: #D6E1DE;            --input: #7A918C;            --ring: #1B66D1;

  --brand: #12A06E;             --brand-strong: #0B7D55;
  --brand-soft: #DDF3E9;        --brand-soft-foreground: #0A5F42;
  --info: #E4EEFC;              --info-foreground: #174A99;
  --warning: #FDF1D3;           --warning-foreground: #8A4B06;
  --danger: #FDE3E1;            --danger-foreground: #A1261B;

  --chart-1: #1B66D1; --chart-2: #12A06E; --chart-3: #BF7A06; --chart-4: #6B5BC7; --chart-5: #6B7F86;
}

.dark {
  --background: #0E1514;        --foreground: #E7F0ED;
  --card: #151F1E;              --card-foreground: #E7F0ED;
  --popover: #1B2827;           --popover-foreground: #E7F0ED;
  --primary: #8DB8FF;           --primary-foreground: #0A1E3D;
  --secondary: #1B2827;         --secondary-foreground: #E7F0ED;
  --muted: #1B2827;             --muted-foreground: #A2B6B1;
  --accent: #1B2827;            --accent-foreground: #E7F0ED;
  --destructive: #F4A9A2;       --destructive-foreground: #3A0F0C;
  --border: #2A3A38;            --input: #6A827E;            --ring: #8DB8FF;

  --brand: #86D9B5;             --brand-strong: #86D9B5;
  --brand-soft: #153126;        --brand-soft-foreground: #A9EACD;
  --info: #1B2B45;              --info-foreground: #BBD5FF;
  --warning: #3A2D12;           --warning-foreground: #F3CF8A;
  --danger: #3E1C1A;            --danger-foreground: #F4A9A2;

  --chart-1: #8DB8FF; --chart-2: #86D9B5; --chart-3: #E8C170; --chart-4: #B3B9E8; --chart-5: #9FB2BA;
}
```

## Theme behavior
- Options: **Dark** (default), **Light**, **System** (PRD 5.6). IndexedDB settings are the source of truth.
- Mirror the choice in localStorage only to apply the right theme before the first paint, so the page never flashes the wrong theme
  (PRD allows localStorage for small, non-critical UI preferences).
- Every component, chart, and state (hover, focus, disabled, error, empty) must work in both themes.

## Contrast rules
- Body and label text: at least 4.5:1. Large text and UI or graphic elements (icons, chart series, control borders): at least 3:1.
- Do not put `brand` (light) or `primary` (dark) text on a colored fill without checking the pair in this file.
- State is never color alone: a text label always accompanies it.

## Type, spacing, shape
- Type: body 15 to 16px, never below 14px; weights 400 body, 500 to 600 labels and headings. One sans family plus one monospace for scrambles.
  Fonts are self-hosted at build time (for example with `next/font`). No thin weights.
- Spacing: 4px base scale (4, 8, 12, 16, 24, 32, 48). Do not invent other values.
- Radius: one value for controls and one for containers (for example 8px and 14px).
- Icons: Lucide only, 16 to 20px, paired with text on actions. Icon-only buttons need an accessible name.
- Motion: 150ms or less, only for state changes (including the theme switch). No decorative animation.

## Copy
- Plain, specific, short. Sentence case. No exclamation marks. No marketing words.
- Errors say what happened and what to do: "Could not save this solve. Export a backup, then try again."
- One term per concept (solve, session, puzzle, scramble). Say clearly that data is stored only in this browser and is not synced.

## Sample data (prototype only)
Realistic solve times for the puzzle (for example 3×3 between about 9 and 16 seconds, with believable variation),
a few DNF and +2 entries, and scramble text that really looks like valid notation. Label it as sample data in the UI.
Never present sample text as a generated scramble.

## Offline and third parties
No runtime requests to third parties: no CDN, remote fonts, remote icons, or analytics.
The timer must keep working if the network drops (PRD Section 1, rule 3).
