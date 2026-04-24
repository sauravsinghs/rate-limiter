import type { Algorithm } from "../../services/api";
import { ALGORITHM_LABELS, ALGORITHM_ORDER } from "./algorithmMeta";

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
  lb_capacity: 10,
  lb_leakRate: 1,
};

interface FieldConfig {
  key: keyof DashboardConfigDraft;
  label: string;
  min: number;
  step: number;
}

const TOOLBOX_FIELDS: Record<Algorithm, FieldConfig[]> = {
  "token-bucket": [
    { key: "tb_capacity", label: "Capacity", min: 1, step: 1 },
    { key: "tb_refillRate", label: "Refill Rate (tokens/sec)", min: 0.1, step: 0.1 },
  ],
  "sliding-window": [
    { key: "sw_maxRequests", label: "Max Requests", min: 1, step: 1 },
    { key: "sw_windowSize", label: "Window Size (ms)", min: 100, step: 100 },
  ],
  "leaky-bucket": [
    { key: "lb_capacity", label: "Queue Capacity", min: 1, step: 1 },
    { key: "lb_leakRate", label: "Leak Rate (req/sec)", min: 0.1, step: 0.1 },
  ],
};

interface AlgorithmToolboxProps {
  isOpen: boolean;
  selectedAlgo: Algorithm;
  draft: DashboardConfigDraft;
  isApplying: boolean;
  onToggleOpen: () => void;
  onClose: () => void;
  onSelectAlgo: (algorithm: Algorithm) => void;
  onDraftChange: (key: keyof DashboardConfigDraft, value: number) => void;
  onApply: () => void;
  onApplyAndRerun: () => void;
  onRerun: () => void;
  onSyncFromLive: () => void;
}

export default function AlgorithmToolbox({
  isOpen,
  selectedAlgo,
  draft,
  isApplying,
  onToggleOpen,
  onClose,
  onSelectAlgo,
  onDraftChange,
  onApply,
  onApplyAndRerun,
  onRerun,
  onSyncFromLive,
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

          <div className="form-group">
            <label className="form-label">Choose Algorithm</label>
            <select
              className="form-select"
              value={selectedAlgo}
              onChange={(event) => onSelectAlgo(event.target.value as Algorithm)}
            >
              {ALGORITHM_ORDER.map((algorithm) => (
                <option key={algorithm} value={algorithm}>
                  {ALGORITHM_LABELS[algorithm]}
                </option>
              ))}
            </select>
          </div>

          <div className="toolbox-fields">
            {fields.map((field) => (
              <label key={field.key} className="toolbox-field">
                <span>{field.label}</span>
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
