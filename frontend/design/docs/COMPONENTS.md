# Component Specifications

Technical documentation for all UI components in the Rate Limiter Visualization.

---

## BucketView

**File:** `src/components/BucketView.tsx`

Visual representation of the token bucket with animated tokens.

### Props

| Prop                 | Type                                                                     | Default          | Description                           |
| -------------------- | ------------------------------------------------------------------------ | ---------------- | ------------------------------------- |
| `current`            | `number`                                                                 | Required         | Current number of tokens              |
| `capacity`           | `number`                                                                 | Required         | Maximum bucket capacity               |
| `refillRate`         | `number`                                                                 | Required         | Tokens added per second               |
| `algorithm`          | `'token-bucket' \| 'sliding-window' \| 'fixed-window' \| 'leaky-bucket'` | `'token-bucket'` | Algorithm type (for future expansion) |
| `lastRequestSuccess` | `boolean \| null`                                                        | `null`           | Whether last request was allowed      |

### Visual States

| State         | Trigger                        | Visual Effect             |
| ------------- | ------------------------------ | ------------------------- |
| Full          | `current >= 70% capacity`      | Green tokens, green count |
| Medium        | `current 30-70% capacity`      | Yellow count color        |
| Low           | `current < 30% capacity`       | Red count color           |
| Empty         | `current === 0`                | Shows "0" text, no tokens |
| Flash Success | `lastRequestSuccess === true`  | Green border glow         |
| Flash Blocked | `lastRequestSuccess === false` | Red border glow + shake   |

### Behavior

- Maximum 15 visual tokens displayed
- If `capacity > 15`, shows numeric display only
- Tokens animate in with `tokenAppear` animation
- Water level fills proportionally to token count
- Wave animation runs continuously on water

---

## RequestChart

**File:** `src/components/RequestChart.tsx`

Bar chart visualization of request history.

### Props

| Prop        | Type                   | Default  | Description                    |
| ----------- | ---------------------- | -------- | ------------------------------ |
| `history`   | `RequestHistoryItem[]` | Required | Array of history entries       |
| `maxPoints` | `number`               | `20`     | Maximum data points to display |

### RequestHistoryItem

```typescript
interface RequestHistoryItem {
  timestamp: number;
  allowed: number;
  blocked: number;
}
```

### Features

- Stacked bar chart (allowed + blocked)
- Custom legend with counts
- Success rate percentage for displayed range
- Timeline indicator (Older -> Newer)
- Empty state with icon when no data

### Chart Configuration

- Responsive with `maintainAspectRatio: false`
- Animation duration: 300ms
- Stacked bars with border radius
- Y-axis starts at zero with step size 1
- X-axis shows time labels every 5th point

---

## Controls

**File:** `src/components/Controls.tsx`

Action buttons for interacting with the rate limiter.

### Props

| Prop             | Type                                      | Description                    |
| ---------------- | ----------------------------------------- | ------------------------------ |
| `onSendRequest`  | `() => void`                              | Handler for single request     |
| `onSendBurst`    | `(count: number, delay?: number) => void` | Handler for burst requests     |
| `onReset`        | `() => void`                              | Handler to reset statistics    |
| `onOpenSettings` | `() => void`                              | Handler to open settings modal |
| `isLoading`      | `boolean`                                 | Shows loading state on buttons |

### Button Types

| Button       | Class                      | Behavior                |
| ------------ | -------------------------- | ----------------------- |
| Send Request | `btn-primary btn-large`    | Triggers single request |
| Burst        | `btn-secondary` + dropdown | Sends multiple requests |
| Reset        | `btn-outline`              | Clears all statistics   |
| Settings     | `btn-icon-only`            | Opens settings modal    |

### Burst Options

- 5, 10, 20, or 50 requests
- Default delay: 50ms between requests
- Dropdown for count selection

---

## StatsPanel

**File:** `src/components/StatsPanel.tsx`

Live statistics display for the rate limiter.

### Props

| Prop                 | Type                  | Description                         |
| -------------------- | --------------------- | ----------------------------------- |
| `total`              | `number`              | Total request count                 |
| `allowed`            | `number`              | Allowed request count               |
| `blocked`            | `number`              | Blocked request count               |
| `successRate`        | `string`              | Success percentage (e.g., "75.00%") |
| `lastRequestSuccess` | `boolean \| null`     | Last request status                 |
| `retryAfter`         | `number \| undefined` | Seconds until retry (if blocked)    |

### Display Elements

| Element              | Description                     |
| -------------------- | ------------------------------- |
| Overall Success Rate | Featured card with progress bar |
| Total Requests       | Plain count                     |
| Allowed              | Green count                     |
| Blocked              | Red count                       |
| Last Request         | Status indicator with dot       |

### Success Rate Color Coding

- **>= 80%**: Green (`stat-success`)
- **>= 50%**: Yellow (`stat-warning`)
- **< 50%**: Red (`stat-danger`)

---

## SettingsPanel

**File:** `src/components/SettingsPanel.tsx`

Modal for configuring rate limiter settings.

### Props

| Prop                | Type                             | Description             |
| ------------------- | -------------------------------- | ----------------------- |
| `isOpen`            | `boolean`                        | Modal visibility        |
| `onClose`           | `() => void`                     | Close handler           |
| `onApply`           | `(config: ConfigObject) => void` | Apply changes handler   |
| `currentCapacity`   | `number`                         | Current bucket capacity |
| `currentRefillRate` | `number`                         | Current refill rate     |

### Configuration Options

| Setting         | Range    | Default |
| --------------- | -------- | ------- |
| Bucket Capacity | 1 - 100  | 10      |
| Refill Rate     | 0.1 - 10 | 1.0     |

### Algorithm Selection

| Algorithm      | Status      |
| -------------- | ----------- |
| Token Bucket   | Available   |
| Sliding Window | Coming Soon |
| Fixed Window   | Coming Soon |
| Leaky Bucket   | Coming Soon |

### Modal Behavior

- Backdrop click closes modal
- Syncs local state with props on open
- Reset button restores current server values
- Hidden scrollbar with scroll functionality

---

## AlgorithmInfo

**File:** `src/components/AlgorithmInfo.tsx`

Educational content explaining rate limiting algorithms.

### Props

| Prop        | Type                                                                     | Default          | Description          |
| ----------- | ------------------------------------------------------------------------ | ---------------- | -------------------- |
| `algorithm` | `'token-bucket' \| 'sliding-window' \| 'fixed-window' \| 'leaky-bucket'` | `'token-bucket'` | Algorithm to display |

### Content Structure

- **Header**: Algorithm name with expand button
- **Short Description**: One-line summary
- **Expandable Details**:
  - How It Works (ordered list)
  - Pros (bullet list with green marker)
  - Cons (bullet list with red marker)
  - Use Cases (tag pills)

### Behavior

- Click header to toggle expanded state
- Default: collapsed
- Contains comprehensive info for all 4 algorithms
