# UI Rules

Behavioral rules and thresholds for the Rate Limiter visualization.

---

## Token Bucket Visualization

### Token Display Rules

| Capacity    | Display Mode            |
| ----------- | ----------------------- |
| 1-15 tokens | Visual tokens (circles) |
| 16+ tokens  | Numeric display only    |

**Maximum visual tokens:** 15

**Reason:** Beyond 15 tokens, the visual becomes cluttered and loses clarity. Numeric display provides better UX for high-capacity buckets.

### Token Arrangement

- Tokens arranged in a flex grid
- Fill from bottom to top
- Gap: 8px between tokens
- Padding: 24px top, 12px sides, 16px bottom

### Water Level

The water fill level directly corresponds to the token percentage:

```
fillPercentage = (current / capacity) * 100
```

---

## Color Coding Thresholds

### Bucket Status

| Status | Threshold | Token Count Color          | Capacity Fill Color  |
| ------ | --------- | -------------------------- | -------------------- |
| Full   | >= 70%    | Green (`--color-success`)  | `--gradient-success` |
| Medium | 30-70%    | Yellow (`--color-warning`) | Yellow gradient      |
| Low    | 1-30%     | Red (`--color-danger`)     | `--gradient-danger`  |
| Empty  | 0%        | Red                        | No fill bar          |

### Success Rate (Statistics Panel)

| Status  | Threshold | Color                   |
| ------- | --------- | ----------------------- |
| Success | >= 80%    | Green (`stat-success`)  |
| Warning | 50-79%    | Yellow (`stat-warning`) |
| Danger  | < 50%     | Red (`stat-danger`)     |

---

## Request Feedback

### Flash Effects

| Event           | Visual Effect             | Duration |
| --------------- | ------------------------- | -------- |
| Allowed request | Green border + glow       | 300ms    |
| Blocked request | Red border + glow + shake | 300ms    |

### Status Indicator

| State              | Dot Color | Animation  |
| ------------------ | --------- | ---------- |
| Idle (no requests) | Gray      | None       |
| Last allowed       | Green     | Pulse (2s) |
| Last blocked       | Red       | Pulse (2s) |

---

## Chart Behavior

### Data Points

| Setting              | Value           | Reason                |
| -------------------- | --------------- | --------------------- |
| Max visible points   | 20              | Prevents clutter      |
| Time label frequency | Every 5th point | Readable X-axis       |
| Animation duration   | 300ms           | Smooth but responsive |

### Success Rate Display

**Two success rates are shown intentionally:**

1. **Overall Success Rate** (Statistics Panel)
   - Shows all-time success percentage
   - Reflects total allowed/total requests

2. **Recent Success Rate** (Chart Header)
   - Shows last N requests (maxPoints)
   - Helps identify recent trends

---

## Burst Request Behavior

### Available Burst Counts

- 5 requests
- 10 requests (default)
- 20 requests
- 50 requests

### Timing

- Delay between requests: 50ms
- Each request updates `lastResponse` state
- Stats refresh after all requests complete

---

## Settings Constraints

### Bucket Capacity

| Property   | Value                 |
| ---------- | --------------------- |
| Minimum    | 1                     |
| Maximum    | 100                   |
| Default    | 10                    |
| Input type | Slider + number input |

### Refill Rate

| Property   | Value                 |
| ---------- | --------------------- |
| Minimum    | 0.1 tokens/sec        |
| Maximum    | 10 tokens/sec         |
| Step       | 0.1                   |
| Default    | 1.0                   |
| Input type | Slider + number input |

---

## Polling & Updates

### Auto-Polling

| Setting          | Value       |
| ---------------- | ----------- |
| Default interval | 500ms       |
| History limit    | 100 entries |

### State Updates

- Bucket stats and request stats fetch in parallel
- After any action (request, burst, reset), stats refresh immediately
- Polling continues in background

---

## Responsive Behavior

### Breakpoints

| Screen Size | Layout Changes                                       |
| ----------- | ---------------------------------------------------- |
| > 768px     | Two-column grid, horizontal controls                 |
| 480-768px   | Single column, full-width buttons, 3-column stats    |
| < 480px     | Single column, 1-column stats, stacked bucket header |

### Component Adjustments

| Component      | Mobile Changes             |
| -------------- | -------------------------- |
| BucketView     | 160x200px (smaller)        |
| Controls       | Stacked vertically         |
| Chart          | Summary stacks vertically  |
| Stats Grid     | Changes from 3 to 1 column |
| Settings Modal | Reduced border radius      |

---

## Accessibility Notes

### Interactive Elements

- All buttons have `type="button"` to prevent form submission
- Disabled states reduce opacity to 0.5
- Focus states follow browser defaults (can be enhanced)

### Animation Considerations

- Animations use `ease` and `ease-in-out` for natural feel
- No animations are essential for understanding
- Consider `prefers-reduced-motion` in future updates
