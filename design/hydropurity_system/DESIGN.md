---
name: HydroPurity System
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#414751'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#717782'
  outline-variant: '#c1c7d2'
  surface-tint: '#0061a5'
  primary: '#00538f'
  on-primary: '#ffffff'
  primary-container: '#0a6cb5'
  on-primary-container: '#deebff'
  inverse-primary: '#9fcaff'
  secondary: '#3e6a00'
  on-secondary: '#ffffff'
  secondary-container: '#b2f26a'
  on-secondary-container: '#416e00'
  tertiary: '#3b5275'
  on-tertiary: '#ffffff'
  tertiary-container: '#536a8f'
  on-tertiary-container: '#e1eaff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e4ff'
  primary-fixed-dim: '#9fcaff'
  on-primary-fixed: '#001d36'
  on-primary-fixed-variant: '#00497e'
  secondary-fixed: '#b5f56c'
  secondary-fixed-dim: '#9ad853'
  on-secondary-fixed: '#0f2000'
  on-secondary-fixed-variant: '#2e5000'
  tertiary-fixed: '#d5e3ff'
  tertiary-fixed-dim: '#b0c7f1'
  on-tertiary-fixed: '#001b3c'
  on-tertiary-fixed-variant: '#30476a'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 3.5rem
    fontWeight: '800'
    lineHeight: 4rem
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.25rem
    fontWeight: '800'
    lineHeight: 2.75rem
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: 2.25rem
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: 2.25rem
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.375rem
    fontWeight: '600'
    lineHeight: 1.75rem
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
  body-lg:
    fontFamily: Manrope
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
  body-md:
    fontFamily: Manrope
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-sm:
    fontFamily: Manrope
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.6875rem
    fontWeight: '700'
    lineHeight: 0.875rem
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes a premium, reliable, and ecologically conscious digital presence for modern water supply and sanitation utilities. The interface communicates institutional stability, crystal-clear operational transparency, and environmental stewardship. 

The aesthetic is anchored in **Modern Corporate Minimalism with Tactile Hydro-Fluidity**. It balances crisp information architecture with clean surface layers, subtle aquatic-tinted backdrops, and refined physical interaction cues. The goal is to provide citizen-consumers and administrative operators with a frictionless, calming, and deeply trustworthy digital utility experience—reducing friction in account management, bill payments, infrastructure reporting, and consumption monitoring.

## Colors

The color architecture directly mirrors the corporate emblem: deep, vital cobalt water tones counterbalanced by vivid organic flora green.

- **Primary (`#0A6CB5`):** The signature hydro-blue conveying flow, clarity, and institutional trust. Used for dominant calls to action, brand touchpoints, active states, and focal metrics.
- **Secondary (`#6BA524`):** Ecological sprout green representing environmental sanitation, sustainability, conservation successes, and positive transactional feedback.
- **Tertiary (`#1D3557`):** Deep oceanic navy serving as an authoritative grounding tone for headers, hero navigation bars, and strong compositional anchors.
- **Neutral (`#1E293B`):** Deep slate grey optimized for crisp text legibility, balanced against ultra-subtle aquatic surfaces (`#F4F9FC` for canvas base layers and `#EAF3F8` for secondary card containers), avoiding stark monochrome grays in favor of an airy, hydrated environment.

## Typography

The pairing combines **Plus Jakarta Sans** for headlines and interactive elements with **Manrope** for body text and telemetry data. Plus Jakarta Sans brings friendly geometric precision, humanist terminals, and contemporary authority, echoing corporate infrastructure with approachable warmth. Manrope delivers exceptional numeric clarity and open counters, critical for billing amounts, cubic meter consumption rates, and technical utility reports.

All uppercase labels maintain a slight tracking expansion (`+0.05em`) for enhanced legibility, while large headings use tight tracking (`-0.02em`) to retain visual density.

## Layout & Spacing

The layout is built upon a balanced 12-column responsive fluid grid anchored by an 8pt base spacing rhythm:

- **Desktop (1200px+):** 12 columns, 1.5rem gutters, max container width of 1280px with 3rem safe outer margins.
- **Tablet (768px – 1199px):** 8 columns, 1.25rem gutters, 2rem margins. Complex meter tables shift to stacked card modules.
- **Mobile (< 768px):** 4 columns, 1rem gutters, 1.25rem margins. Primary interaction targets expand vertically to accommodate touch gestures.

Whitespace is deliberately generous around critical actions (payment checkout, reporting leaks), ensuring clarity without cognitive overload.

## Elevation & Depth

Visual hierarchy employs **Tonal Layering combined with Hydrated Ambient Shadows**. Instead of harsh, opaque dropshadows, depth is achieved by stacking translucent white and aquatic surfaces over subtle tinted backdrops.

- **Level 0 (Base canvas):** Tinted soft wash (`#F4F9FC`), zero shadow.
- **Level 1 (Cards, structural modules):** Pure white background (`#FFFFFF`) with a hair-thin perimeter boundary (`rgba(10, 108, 181, 0.08)`) and an ultra-diffused shadow: `0 4px 20px -2px rgba(10, 108, 181, 0.06)`.
- **Level 2 (Hovered cards, dropdown panels):** Elevated with `0 12px 32px -4px rgba(10, 108, 181, 0.10)`.
- **Level 3 (Modals, alert dialogs, critical alerts):** Backdrop blur of `12px` over a deep navy scrim (`rgba(29, 53, 87, 0.40)`), with elevation `0 24px 48px -8px rgba(17, 34, 51, 0.16)`.
- **Scrollbars:** Stylized 6px pill bars rendered in `rgba(10, 108, 181, 0.2)` on transparent tracks, transitioning to `rgba(10, 108, 181, 0.45)` upon hover.

## Shapes

The geometric framework uses intentional soft radii that echo the organic curve of water droplets and plant leaves found in the corporate emblem. 

- Interactive controls, buttons, and input fields use a standard radius of `0.5rem` (`rounded-md`).
- Content cards, dashboard panels, and banners adopt `1rem` (`rounded-lg`) and `1.5rem` (`rounded-xl`), creating a modern, friendly, yet structurally dependable envelope.
- Pills and operational badges utilize full radial curvature (`9999px`) to distinguish metric values and dynamic status flags from rectangular structural cards.

## Components

### Buttons
- **Primary:** Filled `#0A6CB5` with white text, font weight 600, height 44px, padding 0 20px. Hover introduces a subtle scale transformation (`1.01`) and background shift to `#005A9C`.
- **Secondary (Eco/Action):** Filled `#6BA524` with white text for ecological programs, bill settlements, or positive service confirmations.
- **Tertiary / Ghost:** Transparent surface with a 1px border of `rgba(10, 108, 181, 0.25)` and text `#0A6CB5`.

### Chips & Badges
- Pill-shaped (`rounded-full`), height 28px, font size `0.75rem`.
- **Water Quality Normal:** Background `#EAF7E8`, text `#2E7D32`.
- **Maintenance / Alert:** Background `#FFF7ED`, text `#C2410C`.
- **Account Status Active:** Background `#EAF3F8`, text `#0A6CB5`.

### Input Fields & Selects
- Height 48px, background `#FFFFFF`, border 1px solid `rgba(30, 41, 59, 0.15)`.
- Focus state activates a 2px outer ring in `#0A6CB5` with 15% opacity and a border tint of `#0A6CB5`.
- Floating labels using `Plus Jakarta Sans` in slate muted tone (`#64748B`).

### Checkboxes & Radios
- Size 20px with 6px border-radius for checkboxes, fully circular for radios.
- Unchecked: 1.5px border `#CBD5E1`, background white.
- Checked: Background `#0A6CB5` with a smooth checkmark micro-animation (scale and stroke-dashoffset transition in 180ms).

### Cards & Telemetry Surfaces
- Structured with `#FFFFFF` surfaces, rounded corners (`1rem` to `1.5rem`), and 1.5rem internal padding.
- Consumption charts (m³ usage) feature a gradient fill from `rgba(10, 108, 181, 0.25)` tapering to transparent, separated by clean grid-lines at `#E2E8F0`.

### Microinteractions
- Transition durations are calibrated between 150ms and 220ms with a custom cubic bezier (`cubic-bezier(0.16, 1, 0.3, 1)`), providing a responsive, liquid feel to all click, hover, and expansion gestures.