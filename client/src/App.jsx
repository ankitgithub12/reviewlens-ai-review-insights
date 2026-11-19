import { useEffect, useState } from 'react';
import { analyzeCsv, getHealth } from './api.js';
import UploadPanel from './components/UploadPanel.jsx';
import SummaryCards from './components/SummaryCards.jsx';
import ThemesPanel from './components/ThemesPanel.jsx';
import ProductView from './components/ProductView.jsx';
import ReviewsTable from './components/ReviewsTable.jsx';
import RunStats from './components/RunStats.jsx';

const OVERVIEW = '__overview__';

export default function App() {
  const [health, setHealth] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState(OVERVIEW);

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setHealth({ ok: false }));
  }, []);

  async function handleUpload(file) {
    setLoading(true);
    setError('');
    try {
      setReport(await analyzeCsv(file));
      setView(OVERVIEW);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const product = report?.products.find((p) => p.product === view);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>ReviewLens</h1>
          <p className="muted">What customers love, what they complain about, and who needs a reply.</p>
        </div>
        <ServerStatus health={health} />
      </header>

      <UploadPanel onUpload={handleUpload} loading={loading} disabled={health?.llm_configured === false} />
      {error && <div className="banner banner-error">{error}</div>}

      {report && (
        <>
          {report.stats.errors.length > 0 && (
            <div className="banner banner-warn">
              <strong>Some AI requests failed.</strong> Affected reviews are marked "analysis failed"; upload again to
              retry them (successful results are cached).
              <ul>
                {report.stats.errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          <nav className="tabs" aria-label="Views">
            <button className={view === OVERVIEW ? 'tab active' : 'tab'} onClick={() => setView(OVERVIEW)}>
              All products
            </button>
            {report.products.map((p) => (
              <button
                key={p.product}
                className={view === p.product ? 'tab active' : 'tab'}
                onClick={() => setView(p.product)}
              >
                {p.product}
              </button>
            ))}
          </nav>

          {product ? (
            <ProductView product={product} reviews={report.reviews} />
          ) : (
            <>
              <SummaryCards summary={report.summary} agreement={report.rating_agreement} />
              <ThemesPanel themes={report.themes} reviews={report.reviews} />
              <ReviewsTable reviews={report.reviews} products={report.products.map((p) => p.product)} />
            </>
          )}

          <RunStats stats={report.stats} summary={report.summary} />
        </>
      )}
    </div>
  );
}

function ServerStatus({ health }) {
  if (!health) return <span className="pill">Checking server…</span>;
  if (!health.ok) return <span className="pill pill-negative">Server unreachable</span>;
  if (!health.llm_configured) return <span className="pill pill-negative">LLM_API_KEY missing on server</span>;
  return <span className="pill pill-positive">AI ready · {health.model}</span>;
}
