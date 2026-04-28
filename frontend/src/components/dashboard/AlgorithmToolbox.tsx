import type { Algorithm } from "../../services/api";

export interface DashboardConfigDraft {
  tb_capacity: number;
  tb_refillRate: number;
  sw_maxRequests: number;
  sw_windowSize: number;
  lb_capacity: number;
  lb_leakRate: number;
}

export const DEFAULT_DASHBOARD_CONFIG_DRAFT: DashboardConfigDraft = {
  tb_capacity: 10,
  tb_refillRate: 1,
  sw_maxRequests: 10,
  sw_windowSize: 5000,
  lb_capacity: 1,
  lb_leakRate: 1,
};

interface FieldConfig {
  key: keyof DashboardConfigDraft;
  label: string;
  tooltip: string;
  min: number;
  step: number;
}

const TOOLBOX_FIELDS: Record<Algorithm, FieldConfig[]> = {
  "token-bucket": [
    { key: "tb_capacity", label: "Capacity", tooltip: "Maximum tokens the bucket can hold. This determines the maximum burst size allowed.", min: 1, step: 1 },
    { key: "tb_refillRate", label: "Refill Rate (tokens/sec)", tooltip: "Rate at which tokens are steadily added back to the bucket.", min: 0.1, step: 0.1 },
  ],
  "sliding-window": [
    { key: "sw_maxRequests", label: "Max Requests", tooltip: "Maximum number of requests allowed within the sliding window duration.", min: 1, step: 1 },
    { key: "sw_windowSize", label: "Window Size (ms)", tooltip: "The time duration of the sliding window in milliseconds.", min: 100, step: 100 },
  ],
  "leaky-bucket": [
    { key: "lb_capacity", label: "Queue Capacity", tooltip: "Maximum number of requests that can wait in the queue. Requests beyond this are dropped.", min: 1, step: 1 },
    { key: "lb_leakRate", label: "Leak Rate (req/sec)", tooltip: "The constant, steady rate at which requests are processed from the queue.", min: 0.1, step: 0.1 },
  ],
};

interface AlgorithmToolboxProps {
  isOpen: boolean;
  selectedAlgo: Algorithm;
  draft: DashboardConfigDraft;
  isApplying: boolean;
  onToggleOpen: () => void;
  onClose: () => void;
  onDraftChange: (key: keyof DashboardConfigDraft, value: number) => void;
  onApply: () => void;
  onApplyAndRerun: () => void;
  onRerun: () => void;
  onSyncFromLive: () => void;
  onScenarioSelect: (scenario: "flash-sale" | "ddos" | "steady") => void;
}

export default function AlgorithmToolbox({
  isOpen,
  selectedAlgo,
  draft,
  isApplying,
  onToggleOpen,
  onClose,
  onDraftChange,
  onApply,
  onApplyAndRerun,
  onRerun,
  onSyncFromLive,
  onScenarioSelect,
}: AlgorithmToolboxProps) {
  const fields = TOOLBOX_FIELDS[selectedAlgo];

  return (
    <>
      <button
        type="button"
        className="toolbox-fab"
        aria-label="Open algorithm toolbox"
        onClick={onToggleOpen}
      >
        Tune
      </button>

      {isOpen && (
        <aside className="toolbox-panel card">
          <div className="toolbox-header">
            <h3>Algorithm Toolbox</h3>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="toolbox-fields">
            {fields.map((field) => (
              <label key={field.key} className="toolbox-field" title={field.tooltip}>
                <span>{field.label} <span className="tooltip-icon">ⓘ</span></span>
                <input
                  type="number"
                  min={field.min}
                  step={field.step}
                  value={draft[field.key]}
                  onChange={(event) => {
                    const nextRaw = Number(event.target.value);
                    const nextValue = Number.isFinite(nextRaw)
                      ? Math.max(field.min, nextRaw)
                      : field.min;
                    onDraftChange(field.key, nextValue);
                  }}
                />
              </label>
            ))}
          </div>

          <div className="toolbox-scenarios">
            <h4 style={{ fontSize: "0.85rem", marginTop: "16px", marginBottom: "8px", color: "var(--color-text-secondary)" }}>Interactive Scenarios</h4>
            <div className="scenario-buttons" style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => onScenarioSelect("flash-sale")} title="Simulate a sudden burst of traffic with bursty settings.">
                Flash Sale
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => onScenarioSelect("ddos")} title="Simulate overwhelming, sustained traffic with tight rate limits.">
                DDoS Attack
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => onScenarioSelect("steady")} title="Simulate smooth, predictable traffic.">
                Steady Traffic
              </button>
            </div>
          </div>

          <div className="toolbox-actions">
            <button type="button" className="btn btn-primary" onClick={onApply} disabled={isApplying}>
              {isApplying ? "Applying..." : "Apply"}
            </button>
            <button type="button" className="btn btn-outline" onClick={onApplyAndRerun} disabled={isApplying}>
              Apply + Re-run
            </button>
          </div>

          <div className="toolbox-actions">
            <button type="button" className="btn btn-outline" onClick={onRerun} disabled={isApplying}>
              Re-run Demo
            </button>
            <button type="button" className="btn btn-outline" onClick={onSyncFromLive} disabled={isApplying}>
              Use Live Values
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
