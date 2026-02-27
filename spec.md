# Specification

## Summary
**Goal:** Apply a unique, distinctive visual design system across the FinMind AI platform, replacing the existing teal/gold dark-finance aesthetic with a deep indigo-black base and neon violet/electric lime accent palette.

**Planned changes:**
- Redefine the global CSS design system (`index.css` and `tailwind.config.js`) with a new signature color scheme using OKLCH custom properties, updated typography scale, spacing rhythm, and border-radius tokens; remap all existing color tokens automatically
- Redesign `GlassCard` component with layered frosted-glass panels, gradient border via pseudo-element/box-shadow, and a new `variant='aurora'` prop that triggers an animated gradient border shimmer
- Overhaul `TopNav` with a frosted-glass nav strip, pill-shaped tabs with an animated sliding active indicator, animated logo mark on the left, sticky behavior, and responsive hamburger menu on mobile
- Redesign the `HomePage` hero section with an animated SVG/CSS abstract data-visualization motif, gradient-clipped editorial headline, and feature cards using `GlassCard` aurora variant with 3D tilt hover micro-interactions
- Define and apply platform-wide CSS keyframe animation tokens: fade-slide-up enter for all `GlassCard` instances, glow-pulse for primary action buttons, and number-tick counter animation for numeric KPIs on Profile, Portfolio, and Prediction pages
- Replace logo mark, hero banner, and default avatar assets with new versions matching the new visual identity; update `TopNav` and `HomePage` to reference the new assets

**User-visible outcome:** The entire platform displays a visually distinctive premium aesthetic with indigo-black backgrounds, violet/lime accents, animated glassmorphism cards, a dynamic hero section, and fluid micro-interactions throughout all pages.
