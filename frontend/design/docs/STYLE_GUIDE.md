# Style Guide

Design system reference for the Rate Limiter Visualization UI.

## Color Palette

### Primary Colors

| Name          | Variable                | Value                     | Usage                        |
| ------------- | ----------------------- | ------------------------- | ---------------------------- |
| Primary       | `--color-primary`       | `#6366f1`                 | Main actions, links, accents |
| Primary Hover | `--color-primary-hover` | `#4f46e5`                 | Hover states                 |
| Primary Light | `--color-primary-light` | `rgba(99, 102, 241, 0.1)` | Subtle backgrounds           |

### Semantic Colors

| Name          | Variable                | Value                      | Usage                             |
| ------------- | ----------------------- | -------------------------- | --------------------------------- |
| Success       | `--color-success`       | `#10b981`                  | Allowed requests, positive states |
| Success Dark  | `--color-success-dark`  | `#059669`                  | Darker success variant            |
| Success Light | `--color-success-light` | `rgba(16, 185, 129, 0.15)` | Success backgrounds               |
| Danger        | `--color-danger`        | `#f43f5e`                  | Blocked requests, errors          |
| Danger Dark   | `--color-danger-dark`   | `#e11d48`                  | Darker danger variant             |
| Danger Light  | `--color-danger-light`  | `rgba(244, 63, 94, 0.15)`  | Error backgrounds                 |
| Warning       | `--color-warning`       | `#f59e0b`                  | Medium states, cautions           |
| Warning Light | `--color-warning-light` | `rgba(245, 158, 11, 0.15)` | Warning backgrounds               |

### Text Colors

| Name           | Variable                 | Value     | Usage           |
| -------------- | ------------------------ | --------- | --------------- |
| Text           | `--color-text`           | `#1e293b` | Primary text    |
| Text Secondary | `--color-text-secondary` | `#475569` | Secondary text  |
| Text Muted     | `--color-text-muted`     | `#94a3b8` | Disabled, hints |

### Background & Border Colors

| Name              | Variable               | Value     | Usage            |
| ----------------- | ---------------------- | --------- | ---------------- |
| Background        | `--color-bg`           | `#f8fafc` | Page background  |
| Background Subtle | `--color-bg-subtle`    | `#f1f5f9` | Card backgrounds |
| Card              | `--color-card`         | `#ffffff` | Card surfaces    |
| Border            | `--color-border`       | `#e2e8f0` | Standard borders |
| Border Light      | `--color-border-light` | `#f1f5f9` | Subtle borders   |

### Gradients

| Name    | Variable             | Value                                                                              |
| ------- | -------------------- | ---------------------------------------------------------------------------------- |
| Primary | `--gradient-primary` | `linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)`                                |
| Success | `--gradient-success` | `linear-gradient(135deg, #10b981 0%, #34d399 100%)`                                |
| Danger  | `--gradient-danger`  | `linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)`                                |
| Water   | `--gradient-water`   | `linear-gradient(180deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.5) 100%)` |

---

## Typography

### Font Family

```css
font-family:
  "Inter",
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  Roboto,
  Oxygen,
  Ubuntu,
  Cantarell,
  sans-serif;
```

### Font Sizes

| Element      | Size       | Weight | Usage            |
| ------------ | ---------- | ------ | ---------------- |
| H1 (Hero)    | `2rem`     | 700    | Page title       |
| H2 (Section) | `1rem`     | 600    | Section headers  |
| H3           | `0.9rem`   | 600    | Sub-sections     |
| Body         | `1rem`     | 400    | Default text     |
| Small        | `0.875rem` | 400    | Secondary info   |
| Caption      | `0.75rem`  | 600    | Labels, tags     |
| Tiny         | `0.7rem`   | 600    | Uppercase labels |

### Font Weights

- **400** - Regular (body text)
- **500** - Medium (buttons, labels)
- **600** - Semibold (headings, emphasis)
- **700** - Bold (hero, large numbers)

---

## Spacing

### Base Unit

The spacing system uses multiples of **4px**.

### Common Values

| Name | Value  | Usage            |
| ---- | ------ | ---------------- |
| XS   | `4px`  | Tight spacing    |
| SM   | `8px`  | Compact elements |
| MD   | `12px` | Default gaps     |
| LG   | `16px` | Section spacing  |
| XL   | `24px` | Card padding     |
| 2XL  | `32px` | Section margins  |
| 3XL  | `40px` | Page padding     |

---

## Border Radius

| Name        | Variable      | Value  | Usage            |
| ----------- | ------------- | ------ | ---------------- |
| Small       | `--radius-sm` | `8px`  | Buttons, inputs  |
| Medium      | `--radius-md` | `12px` | Cards, dropdowns |
| Large       | `--radius-lg` | `16px` | Sections         |
| Extra Large | `--radius-xl` | `24px` | Hero, modals     |

---

## Shadows

| Name         | Variable                | Usage         |
| ------------ | ----------------------- | ------------- |
| XS           | `--shadow-xs`           | Subtle depth  |
| Small        | `--shadow-sm`           | Cards         |
| Medium       | `--shadow-md`           | Hover states  |
| Large        | `--shadow-lg`           | Dropdowns     |
| Extra Large  | `--shadow-xl`           | Modals        |
| Glow Success | `--shadow-glow-success` | Success flash |
| Glow Danger  | `--shadow-glow-danger`  | Blocked flash |

---

## Transitions

| Name   | Variable              | Value                                | Usage              |
| ------ | --------------------- | ------------------------------------ | ------------------ |
| Fast   | `--transition-fast`   | `150ms cubic-bezier(0.4, 0, 0.2, 1)` | Hover, focus       |
| Normal | `--transition-normal` | `300ms cubic-bezier(0.4, 0, 0.2, 1)` | State changes      |
| Slow   | `--transition-slow`   | `500ms cubic-bezier(0.4, 0, 0.2, 1)` | Complex animations |

---

## Responsive Breakpoints

| Name    | Width              | Usage                 |
| ------- | ------------------ | --------------------- |
| Mobile  | `max-width: 480px` | Small phones          |
| Tablet  | `max-width: 768px` | Tablets, large phones |
| Desktop | `> 768px`          | Desktop screens       |

### Key Responsive Changes

- **< 768px**: Single column layout, full-width buttons
- **< 480px**: Simplified stats grid, stacked bucket header
