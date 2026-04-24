import type { SimulationMode } from "../../engine/types";

interface SimulationControlsProps {
  mode: SimulationMode;
  isPlaying: boolean;
  canStep: boolean;
  speed: number;
  predictionEnabled: boolean;
  onModeChange: (mode: SimulationMode) => void;
  onTogglePlay: () => void;
  onStep: () => void;
  onReset: () => void;
  onBurst: () => void;
  onSpeedChange: (speed: number) => void;
  onTogglePrediction: () => void;
}

export default function SimulationControls({
  mode,
  isPlaying,
  canStep,
  speed,
  predictionEnabled,
  onModeChange,
  onTogglePlay,
  onStep,
  onReset,
  onBurst,
  onSpeedChange,
  onTogglePrediction,
}: SimulationControlsProps) {
  return (
    <div className="simulation-controls">
      <div className="simulation-buttons">
        <button type="button" className="btn btn-primary" onClick={onTogglePlay} disabled={!canStep}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button type="button" className="btn btn-outline" onClick={onStep} disabled={!canStep || isPlaying}>
          Step
        </button>
        <button type="button" className="btn btn-outline" onClick={onReset}>
          Reset
        </button>
        <button type="button" className="btn btn-outline" onClick={onBurst}>
          Burst +6
        </button>
      </div>

      <div className="simulation-tuning">
        <label className="simulation-field">
          <span>Traffic Mode</span>
          <select
            className="form-select"
            value={mode}
            onChange={(event) => onModeChange(event.target.value as SimulationMode)}
          >
            <option value="random">Random</option>
            <option value="burst">Burst</option>
          </select>
        </label>

        <label className="simulation-field speed-field">
          <span>Speed: {speed.toFixed(2)}x</span>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.25}
            value={speed}
            onChange={(event) => onSpeedChange(Number(event.target.value))}
          />
        </label>

        <button type="button" className="btn btn-outline" onClick={onTogglePrediction}>
          {predictionEnabled ? "Hide Prediction" : "Show Prediction"}
        </button>
      </div>
    </div>
  );
}
