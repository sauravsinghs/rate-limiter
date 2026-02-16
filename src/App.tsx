/**
 * Rate Limiter – Ride Booking Demo
 *
 * Routes:
 *   /            – Home (pick ride)
 *   /book        – Confirm ride
 *   /demo        – System Design Demo (token-bucket visualization)
 *   /bill        – Booking receipt
 *   /dashboard   – Legacy rate-limiter dashboard
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import BookRide from './pages/BookRide';
import SystemDesignDemo from './pages/SystemDesignDemo';
import Bill from './pages/Bill';
import Dashboard from './pages/Dashboard';
import DebugPanel from './components/DebugPanel';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/book" element={<BookRide />} />
        <Route path="/demo" element={<SystemDesignDemo />} />
        <Route path="/bill" element={<Bill />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>

      {/* Floating debug panel – visible on all pages */}
      <DebugPanel />
    </BrowserRouter>
  );
}
