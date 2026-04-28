# Design System

Rate Limiter Visualization design system and documentation.

## Overview

This folder contains the complete design system including:

- CSS stylesheets (variables, animations, component styles)
- Design documentation (style guide, component specs, animation specs, UI rules)

## Folder Structure

```
design/
├── README.md                    # This file
├── styles/
│   ├── variables.css            # CSS custom properties (colors, spacing, etc.)
│   ├── animations.css           # @keyframes definitions
│   └── main.css                 # Component styles (imports variables & animations)
└── docs/
    ├── STYLE_GUIDE.md           # Color palette, typography, spacing reference
    ├── COMPONENTS.md            # Component specifications and props
    ├── ANIMATIONS.md            # Animation timing and behavior
    └── UI_RULES.md              # Visualization rules and thresholds
```

## Quick Links

### Styles

- **[variables.css](styles/variables.css)** - Design tokens: colors, gradients, shadows, spacing, transitions
- **[animations.css](styles/animations.css)** - All keyframe animations
- **[main.css](styles/main.css)** - Component styles (entry point)

### Documentation

- **[Style Guide](docs/STYLE_GUIDE.md)** - Color palette, typography, spacing, responsive breakpoints
- **[Components](docs/COMPONENTS.md)** - Component props, states, and behavior
- **[Animations](docs/ANIMATIONS.md)** - Animation specifications and timing
- **[UI Rules](docs/UI_RULES.md)** - Token visualization rules, color thresholds, behavioral rules

## Usage

The main stylesheet is imported in `src/main.tsx`:

```typescript
import "../design/styles/main.css";
```

The `main.css` file imports `variables.css` and `animations.css` automatically.

## Key Design Decisions

### Color Palette

- **Primary**: Indigo/Purple gradient (`#6366f1` to `#8b5cf6`)
- **Success**: Emerald green (`#10b981`)
- **Danger**: Rose red (`#f43f5e`)
- **Warning**: Amber (`#f59e0b`)

### Component Architecture

| Component     | Purpose                                          |
| ------------- | ------------------------------------------------ |
| BucketView    | Token bucket visualization with glass effect     |
| RequestChart  | Bar chart for request history                    |
| Controls      | Action buttons (request, burst, reset, settings) |
| StatsPanel    | Live statistics display                          |
| SettingsPanel | Configuration modal                              |
| AlgorithmInfo | Educational algorithm details                    |

### Key Files (Source)

| File                               | Description                |
| ---------------------------------- | -------------------------- |
| `src/components/BucketView.tsx`    | Token bucket visualization |
| `src/components/RequestChart.tsx`  | Chart.js bar chart         |
| `src/components/Controls.tsx`      | Action buttons             |
| `src/components/StatsPanel.tsx`    | Statistics display         |
| `src/components/SettingsPanel.tsx` | Settings modal             |
| `src/components/AlgorithmInfo.tsx` | Algorithm explainer        |
| `src/hooks/useRateLimiter.ts`      | State management hook      |
| `src/services/api.ts`              | API client                 |

### Backend Integration

| Endpoint                  | Purpose              |
| ------------------------- | -------------------- |
| `POST /api/test`          | Send test request    |
| `GET /api/stats/bucket`   | Get bucket state     |
| `GET /api/stats/requests` | Get request history  |
| `POST /api/stats/reset`   | Reset statistics     |
| `POST /api/stats/config`  | Update configuration |

## Contributing

When making design changes:

1. Update CSS variables in `variables.css` for new tokens
2. Add keyframes to `animations.css` for new animations
3. Add component styles to appropriate section in `main.css`
4. Update relevant documentation in `docs/`
