import { useEffect, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion, MotionConfig } from 'framer-motion';
import { analyzeCsv, getHealth } from './api.js';
import UploadPanel from './components/UploadPanel.jsx';
import SummaryCards from './components/SummaryCards.jsx';
import ThemesPanel from './components/ThemesPanel.jsx';
import ProductView from './components/ProductView.jsx';
import ReviewsTable from './components/ReviewsTable.jsx';
import RunStats from './components/RunStats.jsx';
import { easeOut, fadeUp, stagger } from './components/motion.jsx';

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
    // reducedMotion="user": people who turned off animations in their OS get a static UI.
    <MotionConfig reducedMotion="user">
      <div className="backdrop" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <motion.div className="app" initial="hidden" animate="show" variants={stagger(0.1)}>
        <motion.header className="app-header" variants={fadeUp}>
          <div className="brand">
            <motion.div
              className="logo"
              initial={{ rotate: -20, scale: 0.6, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
            >
              <LensIcon />
            </motion.div>
            <div>
              <h1>
                Review<span className="gradient-text">Lens</span>
              </h1>
              <p className="muted">What customers love, what they complain about, and who needs a reply.</p>
            </div>
          </div>
          <ServerStatus health={health} />
        </motion.header>

        <motion.div variants={fadeUp}>
          <UploadPanel onUpload={handleUpload} loading={loading} disabled={health?.llm_configured === false} />
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              className="banner banner-error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {loading && <LoadingState key="loading" />}

          {!loading && report && (
            <motion.div
              key="report"
              className="report"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: easeOut }}
            >
              {report.stats.errors.length > 0 && (
                <div className="banner banner-warn">
                  <strong>Some AI requests failed.</strong> Affected reviews are marked "analysis failed"; upload
                  again to retry them (successful results are cached).
                  <ul>
                    {report.stats.errors.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </div>
              )}

              <ViewTabs products={report.products} view={view} onChange={setView} />

              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  className="view"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.3, ease: easeOut }}
                >
                  {product ? (
                    <ProductView product={product} reviews={report.reviews} />
                  ) : (
                    <>
                      <SummaryCards summary={report.summary} agreement={report.rating_agreement} />
                      <ThemesPanel themes={report.themes} reviews={report.reviews} />
                      <ReviewsTable reviews={report.reviews} products={report.products.map((p) => p.product)} />
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              <RunStats stats={report.stats} summary={report.summary} />
            </motion.div>
          )}

          {!loading && !report && <EmptyState key="empty" />}
        </AnimatePresence>
      </motion.div>
    </MotionConfig>
  );
}

function ViewTabs({ products, view, onChange }) {
  const tabs = [{ id: OVERVIEW, label: 'All products' }, ...products.map((p) => ({ id: p.product, label: p.product }))];
  return (
    <LayoutGroup>
      <nav className="tabs" aria-label="Views">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={view === tab.id ? 'tab active' : 'tab'}
            onClick={() => onChange(tab.id)}
            aria-pressed={view === tab.id}
          >
            {view === tab.id && (
              <motion.span
                layoutId="tab-indicator"
                className="tab-indicator"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </LayoutGroup>
  );
}

const LOADING_STEPS = ['Cleaning the CSV', 'Checking the cache', 'Asking the AI in batches', 'Validating every answer'];

function LoadingState() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStep((s) => (s + 1) % LOADING_STEPS.length), 1600);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      className="card loading-card"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
    >
      <div className="orbit">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="orbit-dot"
            animate={{ y: [0, -12, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          className="loading-text"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {LOADING_STEPS[step]}…
        </motion.p>
      </AnimatePresence>
      <div className="shimmer-grid">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="shimmer" />
        ))}
      </div>
    </motion.div>
  );
}

function EmptyState() {
  const features = [
    ['🧹', 'Cleans messy data', 'Empty rows, bad ratings, duplicates and HTML are handled for you.'],
    ['🧠', 'AI you can trust', 'Every AI answer is validated, retried once, and cached.'],
    ['💬', 'Replies on demand', 'Generate a polite reply for any review that needs one.'],
  ];
  return (
    <motion.div className="features" initial="hidden" animate="show" exit={{ opacity: 0 }} variants={stagger(0.1, 0.2)}>
      {features.map(([icon, title, text]) => (
        <motion.div key={title} className="card feature" variants={fadeUp} whileHover={{ y: -4 }}>
          <span className="feature-icon">{icon}</span>
          <h3>{title}</h3>
          <p className="muted small">{text}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}

function ServerStatus({ health }) {
  let tone = 'neutral';
  let label = 'Checking server…';
  if (health && !health.ok) [tone, label] = ['negative', 'Server unreachable'];
  else if (health && !health.llm_configured) [tone, label] = ['negative', 'LLM_API_KEY missing on server'];
  else if (health) [tone, label] = ['positive', `AI ready · ${health.model}`];

  return (
    <motion.span className={`status status-${tone}`} layout>
      <span className="status-dot" />
      {label}
    </motion.span>
  );
}

function LensIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 21 21" />
      <path d="M8 10.5h5M10.5 8v5" />
    </svg>
  );
}
