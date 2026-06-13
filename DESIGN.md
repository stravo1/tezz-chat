---
name: Tezz Chat
description: Open-source, multi-model AI chat for power users who value speed, control, and precise conversation workflows.
colors:
  signal-coral: '#ff7770'
  primary-foreground-light: '#ffffff'
  background-light: '#fcf8f8'
  foreground-light: '#2e201f'
  surface-light: '#f8f2f2'
  surface-foreground-light: '#1f1514'
  secondary-light: '#ebe1e0'
  secondary-foreground-light: '#3d2b29'
  muted-light: '#eee8e8'
  muted-foreground-light: '#705e5c'
  accent-light: '#fbdcda'
  accent-foreground-light: '#b81d14'
  border-light: '#e7dbda'
  sidebar-light: '#f8f2f2'
  background-dark: '#171211'
  foreground-dark: '#f1eeee'
  surface-dark: '#201918'
  primary-foreground-dark: '#1f1514'
  secondary-dark: '#2c2121'
  muted-dark: '#2f2423'
  muted-foreground-dark: '#af9e9d'
  accent-dark: '#352827'
  accent-foreground-dark: '#ff948f'
  border-dark: '#352827'
  sidebar-dark: '#120d0c'
  syntax-rose: '#ea9a97'
  syntax-iris: '#c4a7e7'
  syntax-foam: '#9ccfd8'
  syntax-gold: '#f6c177'
typography:
  display:
    fontFamily: 'Syne, Inter, ui-sans-serif, system-ui'
    fontSize: '1.5rem'
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: '-0.01em'
  headline:
    fontFamily: 'Inter, Geist, ui-sans-serif, system-ui'
    fontSize: '1.875rem'
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: '-0.01em'
  title:
    fontFamily: 'Inter, Geist, ui-sans-serif, system-ui'
    fontSize: '1rem'
    fontWeight: 500
    lineHeight: 1.35
  body:
    fontFamily: 'Inter, Geist, ui-sans-serif, system-ui'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: 'Inter, Geist, ui-sans-serif, system-ui'
    fontSize: '0.75rem'
    fontWeight: 500
    lineHeight: 1.25
rounded:
  sm: 'calc(0.6rem - 4px)'
  md: 'calc(0.6rem - 2px)'
  lg: '0.6rem'
  xl: 'calc(0.6rem + 4px)'
spacing:
  xs: '0.5rem'
  sm: '0.75rem'
  md: '1rem'
  lg: '1.5rem'
  xl: '2rem'
components:
  button-primary:
    backgroundColor: '{colors.signal-coral}'
    textColor: '{colors.primary-foreground-light}'
    rounded: '{rounded.md}'
    height: '2.25rem'
    padding: '0.5rem 1rem'
  button-outline:
    backgroundColor: '{colors.background-light}'
    textColor: '{colors.foreground-light}'
    rounded: '{rounded.md}'
    height: '2.25rem'
    padding: '0.5rem 1rem'
  input-field:
    backgroundColor: '{colors.background-light}'
    textColor: '{colors.foreground-light}'
    rounded: '{rounded.md}'
    height: '2.25rem'
    padding: '0.25rem 0.75rem'
  chat-composer:
    backgroundColor: '{colors.background-light}'
    textColor: '{colors.foreground-light}'
    rounded: '{rounded.lg}'
    padding: '0.5rem'
---

# Design System: Tezz Chat

## 1. Overview

**Creative North Star: "The Signal Deck"**

Tezz Chat should feel like a compact command surface for high-context AI work: model choice, chat state, files, branching, search, and sharing are close to the user's hands. The system carries open-source confidence: polished enough to trust, inspectable enough to feel practical, and never dressed up in generic AI theater.

The current interface is a dense Nuxt/Vue chat app built from shadcn-vue primitives, Tailwind 4 theme variables, Pinia state, Reka UI overlays, and a warm Signal Coral accent. Its brand work is not decorative; it is the disciplined presentation of control. The product should be compact, precise, and legible under sustained use.

It explicitly rejects generic SaaS landing-page polish, toy chatbot behavior, enterprise dashboard sameness, and overbuilt devtool cosplay. The interface can be visually distinctive, but every visual decision must support speed, confidence, and state clarity.

**Key Characteristics:**

- Dense AI-native workflow surface with minimal ceremony.
- Warm rose-tinted neutral shell with Signal Coral reserved for primary action and active state.
- Soft ambient lift for overlays, composer, popovers, and floating controls.
- Inter/Geist UI typography with Syne reserved for the tezz wordmark.
- Rose Pine syntax color only inside code and markdown output.

## 2. Colors

The palette is a warm, rose-tinted product shell with one decisive coral signal color and a separate Rose Pine syntax vocabulary for code.

### Primary

- **Signal Coral**: The action and current-state color. Use it for primary buttons, selected image mode, active model/provider states, focus rings, and small status signals. Its current token is `--primary` and it should stay rare enough to remain directional.
- **Signal Coral on Light**: White foreground reserved for text/icons on Signal Coral primary controls.
- **Signal Coral on Dark**: Near-ink foreground for Signal Coral controls in dark mode, preserving contrast without making the accent feel neon.

### Secondary

- **Rose Clay Secondary**: The low-emphasis control surface for secondary buttons, user message bubbles, and quiet toolbar controls.
- **Soft Blush Accent**: The hover and selected-state tint. Use it behind active controls or hover states; do not use it as decoration.

### Tertiary

- **Rose Pine Syntax Rose, Iris, Foam, and Gold**: Syntax-only colors imported from `rose-pine-combined.css`. These colors belong in code blocks, markdown highlighting, and technical output, not in general marketing or navigation decoration.

### Neutral

- **Warm Shell Light**: The app background and chat surface base.
- **Warm Ink Light**: Primary text on light surfaces.
- **Panel Rose Light**: Sidebar, card, and panel surface color.
- **Muted Rose Light**: Low-emphasis controls, disabled affordances, and background fills.
- **Muted Ink Light**: Secondary text. It must remain readable against Warm Shell Light; do not lighten it for elegance.
- **Deep Shell Dark**: The dark-mode page background.
- **Deep Ink Dark**: Primary text on dark surfaces.
- **Deep Panel Dark**: Dark-mode card and popover surface.
- **Border Rose**: Borders, dividers, input strokes, and the edge vocabulary that separates dense UI without heavy shadow.

### Named Rules

**The Signal Rarity Rule.** Signal Coral is for action, current selection, focus, and state. If more than one in ten visible elements is coral, the surface is shouting.

**The Syntax Containment Rule.** Rose Pine colors are for code intelligence and markdown output only. Do not leak syntax colors into general product chrome.

## 3. Typography

**Display Font:** Syne (with Inter and system fallbacks)  
**Body Font:** Inter / Geist (with ui-sans-serif and system fallbacks)  
**Label/Mono Font:** JetBrains Mono / Fira Code for code, shortcuts, environment keys, and compact technical labels only

**Character:** The typography is compact and utilitarian. Syne gives the tezz wordmark a sharp brand hook; the rest of the interface stays in Inter/Geist so dense chat, settings, menus, and model metadata remain readable.

### Hierarchy

- **Display** (900, 1.5rem, 1.1): Wordmark and rare brand moments only. Do not use Syne for dense controls or labels.
- **Headline** (600, 1.875rem, 1.2): Empty-chat greeting and major modal headings when a surface needs a clear anchor.
- **Title** (500, 1rem, 1.35): Modal section headings, provider names, chat titles, and grouped controls.
- **Body** (400, 0.875rem, 1.5): Chat metadata, settings prose, dropdown copy, and compact descriptions. Long prose should stay within 65-75ch.
- **Label** (500, 0.75rem, 1.25): Keyboard hints, counts, grouped menu labels, provider status, and secondary state copy.

### Named Rules

**The Wordmark-Only Display Rule.** Syne is a brand mark, not a UI font. Product surfaces should not become expressive at the cost of scan speed.

**The Mono Is Evidence Rule.** Monospace appears where the content is technical evidence: code, keyboard shortcuts, environment variables, and provider keys. Never use mono as a costume for "technical" brand flavor.

## 4. Elevation

Tezz Chat uses ambient lift: tonal layers and borders define most structure, while soft shadows and blur are reserved for overlays, the composer, popovers, dropdowns, dialogs, and floating controls. Depth should clarify interaction order, not decorate the page.

### Shadow Vocabulary

- **Low Ambient** (`0px 4px 10px 0px hsl(0, 0%, 0% / 0.05), 0px 1px 2px -1px hsl(0, 0%, 0% / 0.05)`): Default light-mode raised controls and composer edge.
- **Dark Ambient** (`0px 8px 15px 0px hsl(0, 0%, 0% / 0.4), 0px 1px 2px -1px hsl(0, 0%, 0% / 0.4)`): Dark-mode overlay and popover depth.
- **Overlay Lift** (`shadow-md` / `shadow-lg` plus `backdrop-blur` where already present): Dialogs, responsive popovers, dropdowns, and modals.

### Named Rules

**The Ambient-Only Rule.** Shadows may clarify stacking and focus, but they must stay soft. If the shadow becomes a visible design object, it is too heavy.

**The Blur Must Earn It Rule.** Backdrop blur is allowed on the composer and modal overlay because it preserves context while prioritizing the active layer. Do not add glassmorphism panels for decoration.

## 5. Components

Components should feel like a quiet shell with sharp actions: compact primitives, explicit state, and clear focus behavior.

### Buttons

- **Shape:** Gently compact rounded rectangle (`calc(0.6rem - 2px)` for default, `0.6rem` for larger controls).
- **Primary:** Signal Coral background with white or near-ink foreground, `2.25rem` height, `0.5rem 1rem` padding, small icon spacing, and `shadow-xs`.
- **Hover / Focus:** Hover reduces opacity through `hover:bg-primary/90`; focus uses a 3px ring through `focus-visible:ring-ring/50` and must remain visible on both themes.
- **Secondary / Ghost / Outline:** Secondary uses Rose Clay; ghost and outline are preferred for dense toolbar controls where primary would create too many competing signals.

### Chips

- **Style:** Model provider chips and mobile provider choices use full-pill or rounded controls with border, neutral background, provider logo, and compact text.
- **State:** Selected chips use Signal Coral border/text with a pale coral tint. Disabled providers keep muted text and show key/configuration state.

### Cards / Containers

- **Corner Style:** Rounded panels (`0.6rem`) for chat surface, composer, modals, and popovers.
- **Background:** Main chat surface uses Warm Shell; sidebar and panels use Panel Rose; popovers use background or popover tokens.
- **Shadow Strategy:** Ambient lift only for overlays and floating composer. Static dense content should lean on tonal layering and borders.
- **Border:** Border Rose is the default separator. Avoid heavy ruled grids.
- **Internal Padding:** Dense controls use `0.5rem-1rem`; modals and major containers use `1.5rem`.

### Inputs / Fields

- **Style:** Transparent or Warm Shell fill, Border Rose stroke, compact height (`2.25rem` for inputs, `44px` minimum for chat textarea), rounded corners, and no decorative inner shadow.
- **Focus:** Border shifts to Signal Coral/ring token with a 3px focus ring. Focus treatment is a usability requirement, not decoration.
- **Error / Disabled:** Error uses destructive red tokens; disabled inputs reduce opacity but must still communicate why they are unavailable when tied to provider configuration.

### Navigation

- **Style:** Sidebar navigation is dense, time-grouped, and history-first. Chat titles truncate, actions appear on hover/focus, and keyboard shortcuts are shown with small mono kbd marks.
- **Active State:** Prefer full-row background/tint selection for active chat and provider state. Do not add new colored side stripes as the selection grammar.
- **Mobile Treatment:** Sidebar collapses into drawer behavior and top-right actions condense into compact icon buttons and menus.

### Chat Composer

The composer is the signature component: a floating command strip with model selector, attachments, image mode, textarea, and send/stop action. It should feel like a small control deck, not a generic form. Keep the composer visually present, but do not let it overpower the message stream.

### Model Selector

The model selector is a dense decision panel. Desktop uses search plus provider rail plus model pane; mobile uses horizontal provider chips and drawer-like content. Provider availability, disabled models, and configuration paths must be explicit.

## 6. Do's and Don'ts

### Do:

- **Do** keep Signal Coral reserved for primary action, active state, focus, and provider/model selection.
- **Do** preserve strong contrast for muted text; `--muted-foreground` is informational text, not decorative gray.
- **Do** use Inter/Geist for dense UI and reserve Syne for the tezz wordmark or rare brand moments.
- **Do** keep chat, model selection, BYOK setup, branching, sharing, and attachments visibly first-class.
- **Do** use ambient lift for overlays, composer, dropdowns, and modals where depth clarifies interaction order.
- **Do** keep keyboard access, focus rings, reduced-motion alternatives, and readable density as production requirements.

### Don't:

- **Don't** make tezz.chat feel like a generic SaaS landing page with vague gradients, interchangeable feature cards, hero metrics, or buzzword polish.
- **Don't** make it feel like a toy chatbot with childish mascot energy, gimmicky bubbles, or unserious AI decoration.
- **Don't** make it feel like an enterprise dashboard with sterile blue-gray sameness, heavy admin scaffolding, or corporate compliance aesthetics.
- **Don't** make it feel like an overbuilt devtool through terminal cosplay, excessive monospace, or complexity that exists only to signal technical taste.
- **Don't** add gradient text, decorative glassmorphism, repeated tiny uppercase eyebrows, or hero-metric blocks.
- **Don't** add colored `border-left` or `border-right` stripes greater than 1px as card, list, callout, or active-row decoration; use full-row tint, full border, icon, or background state instead.
- **Don't** use Rose Pine syntax colors outside code/markdown contexts.
