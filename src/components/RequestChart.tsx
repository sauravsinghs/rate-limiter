/**
 * RequestChart Component
 * Clean, modern visualization of request history with summary stats
 */

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { useMemo } from "react";
import { Bar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

export interface RequestHistoryItem {
  timestamp: number;
  allowed: number;
  blocked: number;
}

export interface RequestChartProps {
  history: RequestHistoryItem[];
  maxPoints?: number;
}

export function RequestChart({ history, maxPoints = 20 }: RequestChartProps) {
  // Take the most recent points
  const recentHistory = useMemo(
    () => history.slice(-maxPoints),
    [history, maxPoints],
  );

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalAllowed = recentHistory.reduce(
      (sum, item) => sum + item.allowed,
      0,
    );
    const totalBlocked = recentHistory.reduce(
      (sum, item) => sum + item.blocked,
      0,
    );
    const total = totalAllowed + totalBlocked;
    const successRate =
      total > 0 ? Math.round((totalAllowed / total) * 100) : 100;
    return { totalAllowed, totalBlocked, total, successRate };
  }, [recentHistory]);

  // Format timestamps for labels - show only time, simplified
  const labels = useMemo(() => {
    return recentHistory.map((item, index) => {
      // Show label every 5th point to reduce clutter
      if (index % 5 === 0 || index === recentHistory.length - 1) {
        const date = new Date(item.timestamp);
        return date.toLocaleTimeString("en-US", {
          hour12: false,
          minute: "2-digit",
          second: "2-digit",
        });
      }
      return "";
    });
  }, [recentHistory]);

  const data = {
    labels,
    datasets: [
      {
        label: "Allowed",
        data: recentHistory.map((item) => item.allowed),
        backgroundColor: "rgba(34, 197, 94, 0.8)",
        hoverBackgroundColor: "rgba(34, 197, 94, 1)",
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: "Blocked",
        data: recentHistory.map((item) => item.blocked),
        backgroundColor: "rgba(239, 68, 68, 0.8)",
        hoverBackgroundColor: "rgba(239, 68, 68, 1)",
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300,
    },
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
    plugins: {
      legend: {
        display: false, // We'll use custom legend
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleFont: {
          size: 13,
          weight: "bold" as const,
        },
        bodyFont: {
          size: 12,
        },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        boxPadding: 4,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          font: {
            size: 10,
          },
          color: "#94a3b8",
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          color: "rgba(148, 163, 184, 0.08)",
        },
        border: {
          display: false,
        },
        ticks: {
          stepSize: 1,
          font: {
            size: 10,
          },
          color: "#94a3b8",
          padding: 8,
        },
      },
    },
  };

  if (history.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-empty">
          <div className="chart-empty-visual">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                d="M3 3v18h18"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7 16l4-4 4 4 5-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="chart-empty-title">No request data yet</p>
          <p className="chart-empty-subtitle">
            Send some requests to see the visualization
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      {/* Summary Stats */}
      <div className="chart-summary">
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-dot allowed" />
            <span className="legend-label">Allowed</span>
            <span className="legend-value">{stats.totalAllowed}</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot blocked" />
            <span className="legend-label">Blocked</span>
            <span className="legend-value">{stats.totalBlocked}</span>
          </div>
        </div>
        <div className="chart-rate">
          <span className="rate-value">{stats.successRate}%</span>
          <span className="rate-label">recent {maxPoints}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="request-chart">
        <Bar data={data} options={options} />
      </div>

      {/* Timeline indicator */}
      <div className="chart-timeline">
        <span>Older</span>
        <div className="timeline-line" />
        <span>Newer</span>
      </div>
    </div>
  );
}

export default RequestChart;
