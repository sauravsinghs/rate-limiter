/**
 * Navbar Component
 * Persistent top navigation with step progress indicator and theme toggle
 */

import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";

const STEPS = [
    { path: "/", label: "Book Ride", step: 1 },
    { path: "/processing", label: "Processing", step: 2 },
    { path: "/billing", label: "Billing", step: 3 },
];

export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, toggle } = useTheme();

    const currentStepIndex = STEPS.findIndex(
        (s) => s.path === location.pathname,
    );

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                {/* Brand */}
                <div className="navbar-brand" onClick={() => navigate("/")}>
                    <span className="brand-text">Ride</span>
                </div>

                {/* Step Indicators */}
                <div className="navbar-steps">
                    {STEPS.map((step, index) => {
                        const isActive = index === currentStepIndex;
                        const isCompleted = index < currentStepIndex;
                        return (
                            <div key={step.path} className="step-wrapper">
                                {index > 0 && (
                                    <div
                                        className={`step-line ${isCompleted ? "step-line-done" : ""}`}
                                    />
                                )}
                                <div
                                    className={`step-item ${isActive ? "step-active" : ""} ${isCompleted ? "step-completed" : ""}`}
                                >
                                    <span className="step-number">
                                        {isCompleted ? "✓" : step.step}
                                    </span>
                                    <span className="step-label">{step.label}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Theme Toggle */}
                <button
                    type="button"
                    className="theme-toggle"
                    onClick={toggle}
                    aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                    title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                >
                    <span className="theme-toggle-track">
                        <span className="theme-toggle-thumb" />
                        <span className="theme-icon theme-icon-sun">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="5" />
                                <line x1="12" y1="1" x2="12" y2="3" />
                                <line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" />
                                <line x1="21" y1="12" x2="23" y2="12" />
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                        </span>
                        <span className="theme-icon theme-icon-moon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        </span>
                    </span>
                </button>
            </div>
        </nav>
    );
}
