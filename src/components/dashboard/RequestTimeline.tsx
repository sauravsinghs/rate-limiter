import type { RequestEvent, SimulationMode } from "../../engine/types";

interface RequestTimelineProps {
  events: RequestEvent[];
  activeIndex: number;
  clockMs: number;
  mode: SimulationMode;
  divergentRequestIds: ReadonlySet<number>;
}

function formatSeconds(milliseconds: number): string {
  return `${(milliseconds / 1000).toFixed(2)}s`;
}

export default function RequestTimeline({
  events,
  activeIndex,
  clockMs,
  mode,
  divergentRequestIds,
}: RequestTimelineProps) {
  const total = events.length;
  const processed = Math.min(activeIndex, total);

  return (
    <div className="request-timeline">
      <div className="timeline-header">
        <div>
          <h2>Shared Request Timeline</h2>
          <p>
            Global clock: <strong>{formatSeconds(clockMs)}</strong>
          </p>
        </div>
        <div className="timeline-meta">
          <span className="timeline-chip">Mode: {mode}</span>
          <span className="timeline-chip">
            Processed: {processed}/{total}
          </span>
        </div>
      </div>

      <div className="timeline-track" role="list" aria-label="Request timeline">
        {events.map((event, index) => {
          const stateClass =
            index < activeIndex
              ? "is-processed"
              : index === activeIndex
                ? "is-active"
                : "is-pending";

          return (
            <span
              key={event.id}
              role="listitem"
              className={`timeline-dot ${stateClass} ${event.kind === "burst" ? "is-burst" : ""} ${divergentRequestIds.has(event.id) ? "is-divergent" : ""}`}
              title={`Request ${event.id} at ${formatSeconds(event.time)} (${event.kind})`}
            />
          );
        })}
      </div>
    </div>
  );
}
