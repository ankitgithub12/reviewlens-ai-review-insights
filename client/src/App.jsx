import { useEffect, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { analyzeCsv, getHealth } from './api.js';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import ScopeBar from './components/ScopeBar.jsx';
import SummaryCards from './components/SummaryCards.jsx';
import ThemesPanel from './components/ThemesPanel.jsx';
import ProductView from './components/ProductView.jsx';
import ReviewsTable from './components/ReviewsTable.jsx';
import RunStats from './components/RunStats.jsx';
import Icon from './components/Icon.jsx';
import { easeOut, fadeUp, stagger } from './components/motion.jsx';

import { OVERVIEW } from './constants.js';

export default function App() {
  const [health, setHealth] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState(OVERVIEW);
  const [menuOpen, setMenuOpen] = useState(false);

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

  function selectView(nextView) {
    setView(nextView);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const product = report?.products.find((p) => p.product === view);

  return (
    // reducedMotion="user": people who turned off animations in their OS get a static UI.
    <MotionConfig reducedMotion="user">
      <div className="shell">
        <Sidebar
          report={report}
          view={view}
          onSelect={selectView}
          health={health}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
        />

        <div className="shell-main">
          <TopBar viewLabel={product ? product.product : 'Overview'} health={health} onMenu={() => setMenuOpen(true)} />

          <main className="content">
            <ScopeBar
              onUpload={handleUpload}
              loading={loading}
              disabled={health?.llm_configured === false}
              report={report}
            />

            <AnimatePresence>
              {error && (
                <motion.div
                  className="banner banner-error"
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <span className="banner-icon">
                    <Icon name="error" />
                  </span>
                  <div>
                    <span className="banner-title">Upload failed</span>
                    <p>{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* No exit animations here on purpose: the next state renders immediately instead of
                waiting for the previous one to animate out (which stalls in background tabs). */}
            {loading && <LoadingState />}

            {!loading && report && (
              <motion.div
                key={`report-${view}`}
                className="report"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: easeOut }}
              >
                {report.stats.errors.length > 0 && <AiErrorBanner errors={report.stats.errors} />}

                {product ? (
                  <ProductView product={product} reviews={report.reviews} />
                ) : (
                  <>
                    <SummaryCards summary={report.summary} agreement={report.rating_agreement} themes={report.themes} />
                    <ThemesPanel themes={report.themes} reviews={report.reviews} analyzedCount={report.summary.analyzed} />
                    <ReviewsTable reviews={report.reviews} products={report.products.map((p) => p.product)} />
                  </>
                )}

                <RunStats stats={report.stats} summary={report.summary} />
              </motion.div>
            )}

            {!loading && !report && <EmptyState />}
          </main>
        </div>
      </div>
    </MotionConfig>
  );
}

function AiErrorBanner({ errors }) {
  return (
    <div className="banner banner-warn" role="status">
      <span className="banner-icon">
        <Icon name="speed" />
      </span>
      <div>
        <span className="banner-title">Some AI requests failed</span>
        <p>Affected reviews are marked "analysis failed". Upload again to retry them — successful results are cached.</p>
        <ul>
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const LOADING_STEPS = ['Cleaning the CSV', 'Checking the cache', 'Asking the AI in batches of 5', 'Validating every answer'];

function LoadingState() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStep((s) => (s + 1) % LOADING_STEPS.length), 1600);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      className="panel loading-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="loading-head">
        <span className="spinner" />
        <AnimatePresence mode="wait">
          <motion.span
            key={step}
            className="loading-text"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {LOADING_STEPS[step]}…
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="kpi-grid">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton" />
        ))}
      </div>
    </motion.div>
  );
}

const FEATURES = [
  ['cleaning_services', 'Cleans messy data', 'Empty rows, invalid ratings, duplicates and HTML are flagged instead of crashing the run.'],
  ['verified_user', 'AI you can trust', 'Every AI answer is schema-validated, retried once, and cached by review text.'],
  ['shield', 'Injection resistant', 'Review text is sent as data, never as instructions — R012 cannot flip its own label.'],
  ['forum', 'Replies on demand', 'Generate a polite, specific reply for any review that needs one, only when you click.'],
];

function EmptyState() {
  return (
    <motion.div className="feature-grid" initial="hidden" animate="show" variants={stagger(0.07, 0.1)}>
      {FEATURES.map(([icon, title, text]) => (
        <motion.div key={title} className="panel feature" variants={fadeUp}>
          <span className="icon-box">
            <Icon name={icon} />
          </span>
          <h3>{title}</h3>
          <p>{text}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
