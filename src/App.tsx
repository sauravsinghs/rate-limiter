/**
 * Rate Limiter — Ride Booking Showcase
 * Main application with routing across 3 pages
 */

import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import BookRidePage from "./pages/BookRidePage";
import RideDashboardPage from "./pages/RideDashboardPage";
import BillingPage from "./pages/BillingPage";

const App = () => {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<BookRidePage />} />
          <Route path="/processing" element={<RideDashboardPage />} />
          <Route path="/billing" element={<BillingPage />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <p>
          <span className="footer-brand">Ride</span> — Token
          Bucket Rate Limiting Demo
        </p>
        <p className="footer-sub">
          Demonstrating how API rate limiting protects backend services.
        </p>
      </footer>
    </div>
  );
};

export default App;
