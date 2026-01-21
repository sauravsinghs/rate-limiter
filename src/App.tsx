const App = () => {
  return (
    <div className="app">
      <header className="hero">
        <h1>Rate Limiter Visualization</h1>
        <p>
          Token Bucket simulation UI scaffold. Next: add controls, bucket view,
          and live chart.
        </p>
      </header>

      <section className="card">
        <h2>Controls</h2>
        <div className="controls">
          <button type="button">Send Request</button>
          <button type="button">Simulate Burst</button>
        </div>
        <p className="muted">Wire buttons to the token bucket engine.</p>
      </section>

      <section className="grid">
        <div className="card">
          <h2>Token Bucket</h2>
          <div className="bucket-placeholder">Bucket animation area</div>
        </div>
        <div className="card">
          <h2>Rate Limit Graph</h2>
          <div className="chart-placeholder">Chart.js area</div>
        </div>
      </section>
    </div>
  );
};

export default App;
