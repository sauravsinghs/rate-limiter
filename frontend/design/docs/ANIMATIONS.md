# Animation Specifications

Complete reference for all animations used in the Rate Limiter UI.

---

## Page Transitions

### fadeIn

**Purpose:** App entrance animation

**Timing:** 0.5s ease

**Properties:**

- Opacity: 0 -> 1
- Transform: translateY(10px) -> translateY(0)

**Usage:** Applied to `.app` container on mount

---

## Loading Animations

### spin

**Purpose:** Loading spinner rotation

**Timing:** 0.8s linear infinite

**Properties:**

- Transform: rotate(0deg) -> rotate(360deg)

**Usage:** `.spinner` elements for loading states

---

## Dropdown & Modal

### dropdownIn

**Purpose:** Dropdown menu entrance

**Timing:** 0.15s ease

**Properties:**

- Opacity: 0 -> 1
- Transform: translateY(-8px) -> translateY(0)

**Usage:** `.dropdown-menu` when opened

---

### modalIn

**Purpose:** Settings modal entrance

**Timing:** 0.3s ease

**Properties:**

- Opacity: 0 -> 1
- Transform: scale(0.95) translateY(10px) -> scale(1) translateY(0)

**Usage:** `.modal-content` when opened

---

## Token Bucket Animations

### pulse

**Purpose:** Algorithm badge indicator

**Timing:** 2s ease-in-out infinite

**Properties:**

- Opacity: 1 -> 0.5 -> 1

**Usage:** `.badge-icon` in BucketView header

---

### refillSpin

**Purpose:** Refill rate indicator rotation

**Timing:** 2s linear infinite

**Properties:**

- Transform: rotate(0deg) -> rotate(360deg)

**Usage:** `.refill-icon` SVG in BucketView header

---

### shake

**Purpose:** Bucket shake on blocked request

**Timing:** 0.3s ease-in-out

**Properties:**

```
0%:   translateX(0)
20%:  translateX(-6px)
40%:  translateX(6px)
60%:  translateX(-4px)
80%:  translateX(4px)
100%: translateX(0)
```

**Trigger:** When `lastRequestSuccess === false`

**Usage:** `.bucket-container.flash-blocked`

---

### consumePulse

**Purpose:** Bucket pulse when token consumed

**Timing:** 0.2s ease

**Properties:**

- Transform: scale(1) -> scale(0.98) -> scale(1)

**Usage:** `.bucket-container.consuming`

---

### wave

**Purpose:** Water wave movement

**Timing:** 3s ease-in-out infinite

**Properties:**

- Transform: translateX(0) -> translateX(-10%) -> translateX(0)

**Usage:** `.water-wave` elements (two layers with 1.5s delay offset)

---

## Token Animations

### tokenAppear

**Purpose:** New token entering bucket

**Timing:** 0.3s ease backwards

**Properties:**

- Opacity: 0 -> 1
- Transform: scale(0.5) translateY(20px) -> scale(1) translateY(0)

**Usage:** Each `.token` element with staggered delay

---

### tokenFloat

**Purpose:** Idle token floating effect

**Timing:** 2s ease-in-out infinite

**Properties:**

- Transform: translateY(0) -> translateY(-3px) -> translateY(0)

**Usage:** `.token-inner` elements

---

## Status Indicators

### statusPulse

**Purpose:** Status dot pulsing

**Timing:** 2s ease-in-out infinite

**Properties:**

- Transform: scale(1) -> scale(1.1) -> scale(1)
- Opacity: 1 -> 0.8 -> 1

**Usage:** `.status-dot` (except `.status-idle`)

---

## Animation Timing Summary

| Animation    | Duration | Easing      | Repeat   |
| ------------ | -------- | ----------- | -------- |
| fadeIn       | 500ms    | ease        | once     |
| spin         | 800ms    | linear      | infinite |
| dropdownIn   | 150ms    | ease        | once     |
| modalIn      | 300ms    | ease        | once     |
| pulse        | 2000ms   | ease-in-out | infinite |
| refillSpin   | 2000ms   | linear      | infinite |
| shake        | 300ms    | ease-in-out | once     |
| consumePulse | 200ms    | ease        | once     |
| wave         | 3000ms   | ease-in-out | infinite |
| tokenAppear  | 300ms    | ease        | once     |
| tokenFloat   | 2000ms   | ease-in-out | infinite |
| statusPulse  | 2000ms   | ease-in-out | infinite |

---

## CSS Transition Classes

For state changes (not keyframe animations):

| Property            | Variable              | Duration |
| ------------------- | --------------------- | -------- |
| Hover effects       | `--transition-fast`   | 150ms    |
| State changes       | `--transition-normal` | 300ms    |
| Complex transitions | `--transition-slow`   | 500ms    |

All use the easing curve: `cubic-bezier(0.4, 0, 0.2, 1)`
