---
name: Unlighthouse
description: A focused developer tool interface with soft violet accents, dense technical content, and clear light and dark surfaces.
colors:
  primary: "#7C3AED"
  neutral: "#6F6A75"
  success: "#10B981"
typography:
  display:
    fontFamily: Hubot Sans
    fontSize: 3rem
    fontWeight: 700
    lineHeight: 1.1
  body:
    fontFamily: Nunito Sans
    fontSize: 1rem
    lineHeight: 1.5
  mono:
    fontFamily: Fira Code
    fontSize: 0.875rem
rounded:
  sm: 0.5rem
  md: 0.75rem
  lg: 1rem
spacing:
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 3rem
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: 0.75rem
  button-primary-hover:
    backgroundColor: "#6D28D9"
  card-default:
    backgroundColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: 1.5rem
---

# Design: Unlighthouse

> This file records the existing design system so future work stays consistent. Front matter contains machine readable tokens. The sections below explain when and why to use them.

## Aesthetic Direction

- **Theme**: Soft violet devtool
- **Mode**: Light and dark
- **Vibe**: Technical, friendly, focused
- **Influences**: Nuxt UI documentation, terminal interfaces, and the Unlighthouse report UI
- **Design principle**: We prioritize readable technical information over decorative novelty.
- **Personality of motion**: Quick and useful. Transitions finish within 200ms for routine navigation. Reduced motion removes spatial movement.

## Color Decisions

| Role | Value | Why |
|------|-------|-----|
| Primary | Violet 600 | Identifies calls to action and active navigation with AA contrast against white text. |
| Neutral | Mauve | Adds a slight violet tint to technical gray surfaces. |
| Success | Emerald 500 | Reserved for successful scans, passing checks, and positive metrics. |
| Extended | Amber, red, blue | Used only for warning, error, and informational states. |

- **Neutral tinting**: Nuxt UI mauve supplies the shared warm violet tint.
- **60, 30, 10 split**: Neutral surfaces dominate, text and borders provide structure, violet marks actions and focus.

### Contrast and Accessibility

- **Body text contrast**: Default and muted text must meet WCAG AA on their assigned surfaces.
- **Dark mode adjustments**: Dark surfaces use neutral 900 rather than pure black. Violet accents use the lighter 400 step.
- **Known risks**: Muted neutral text, violet text on tinted surfaces, and icon only controls require browser checks.

## Typography

| Role | Font | Why |
|------|------|-----|
| Body (`--font-sans`) | Nunito Sans | Friendly shapes keep long documentation approachable. |
| Display (`--font-display`) | Hubot Sans | Technical letterforms give headings a distinct developer tool voice. |
| Mono (`--font-mono`) | Fira Code | Commands, paths, metrics, and code remain easy to scan. |

- **Type system**: Responsive Tailwind scale with a 1rem body minimum.
- **OpenType features**: Use tabular numbers for aligned metrics when available.

## Icons

- **Collection**: Carbon for interface controls, named brand collections for product logos
- **Why**: Carbon matches the geometric display type and existing application shell.
- **Color rule**: Interface icons inherit text color. Color is reserved for status meaning and branded logos.

## Component Rules

- Buttons use Nuxt UI variants. Primary actions use solid violet; secondary actions use neutral ghost or outline.
- Cards use existing default, muted, or elevated surfaces with one border and no nested card decoration.
- Radius follows the existing medium to large scale. Pills are limited to badges and compact status controls.
- Inputs always have visible labels, a minimum 44px mobile target, and a visible focus ring.
- Every icon only control has an accessible name.
- Navigation landmarks have short unique names when more than one appears.

## Spatial and Motion

- **Spacing system**: 4px base grid, favoring 8, 12, 16, 24, 32, 48, and 64px.
- **Spacing philosophy**: Documentation stays compact. Marketing sections gain wider vertical separation.
- **Transition speed**: 150ms to 200ms with ease out for routine feedback.
- **Animation style**: Small fades and short translations only when they clarify state changes.
- **Reduced motion**: Remove transforms, blur, and nonessential animation when `prefers-reduced-motion: reduce` is active.

## Responsive Strategy

- **Approach**: Mobile first at 375px, then tablet at 768px and desktop at 1024px.
- **Input method**: Interactive targets remain at least 44px on touch layouts. Hover styling supplements focus styling.
- **Navigation adaptation**: Compact menu on mobile, horizontal product navigation on larger screens.

## Voice and Tone

- **Button labels**: Short verb phrases such as “Run audit”, “Open report”, and “Copy command”.
- **Error style**: State what failed, why when known, and the next action.
- **Empty states**: Explain what belongs in the space and provide one useful action.

## Avoid

- Decorative sections without product or documentation value
- New gradient meshes beyond the existing restrained background glow
- Unlabelled icon buttons or hint only form labels
- Low contrast muted text on tinted backgrounds
- Positive `tabindex` values or visual ordering that differs from DOM order
- Pure black page backgrounds
- New color systems outside Nuxt UI semantic tokens
- Long, elastic, or bouncing motion for routine actions

## Custom Utilities

| Class or token | What it does | When to use |
|----------------|--------------|-------------|
| `.gradient` | Places the existing soft violet background glow behind a page. | Sparse landing and release page backgrounds. |
| `--container-width` | Caps the widest content shell at 90rem. | Shared layouts and large report surfaces. |
| `--font-display` | Applies Hubot Sans to headings. | Page and section headings. |

## Design Decisions

- The embedded report remains the homepage product proof. It loads near the viewport to protect initial performance.
- Feature content may become contextual links, but its existing compact card rhythm stays.
- Accessibility repairs use semantic HTML and Nuxt UI primitives without changing the visual hierarchy.
