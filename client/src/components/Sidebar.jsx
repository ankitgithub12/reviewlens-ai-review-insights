import { AnimatePresence, motion } from 'framer-motion';
import Icon from './Icon.jsx';
import { OVERVIEW } from '../constants.js';

/** Left navigation: switches between the overview and each product's page. A drawer on small screens. */
export default function Sidebar({ report, view, onSelect, health, open, onClose }) {
  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="drawer-backdrop"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Navigation">
        <div className="sidebar-top">
          <div className="brand">
            <span className="brand-mark">
              <Icon name="frame_inspect" />
            </span>
            <div className="brand-text">
              <span className="brand-name">ReviewLens</span>
              <span className="brand-sub">AI Review Insights</span>
            </div>
            <button type="button" className="icon-btn drawer-close" onClick={onClose} aria-label="Close menu">
              <Icon name="close" />
            </button>
          </div>

          <div className="nav-section">
            <span className="nav-label">Dashboard</span>
            <NavItem
              icon="space_dashboard"
              label="Overview"
              active={view === OVERVIEW}
              onClick={() => onSelect(OVERVIEW)}
              badge={report ? { text: report.summary.analyzed, tone: 'positive', title: 'reviews analysed' } : null}
            />
          </div>

          <div className="nav-section">
            <span className="nav-label">Products</span>
            {!report && <p className="nav-empty">Upload a CSV to see a page per product.</p>}
            {report?.products.map((p) => (
              <NavItem
                key={p.product}
                icon="inventory_2"
                label={p.product}
                active={view === p.product}
                onClick={() => onSelect(p.product)}
                badge={p.needs_reply > 0 ? { text: p.needs_reply, tone: 'warn', title: 'need a reply' } : null}
              />
            ))}
          </div>
        </div>

        <div className="sidebar-bottom">
          <EngineStatus health={health} />
          {report && (
            <div className="side-card side-stats">
              <span>
                <Icon name="bolt" /> {report.stats.ai_calls} AI calls
              </span>
              <span>
                <Icon name="cached" /> {report.stats.cache_hits} cached
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <button type="button" className={`nav-item ${active ? 'active' : ''}`} onClick={onClick} aria-current={active ? 'page' : undefined}>
      <span className="nav-item-main">
        <Icon name={icon} />
        <span className="nav-item-label" title={label}>
          {label}
        </span>
      </span>
      {badge && (
        <span className={`count-badge count-${badge.tone}`} title={`${badge.text} ${badge.title}`}>
          {badge.text}
        </span>
      )}
    </button>
  );
}

function EngineStatus({ health }) {
  let tone = 'neutral';
  let label = 'Checking…';
  if (health && !health.ok) [tone, label] = ['negative', 'Server offline'];
  else if (health && !health.llm_configured) [tone, label] = ['negative', 'API key missing'];
  else if (health) [tone, label] = ['positive', 'Ready'];

  return (
    <div className="side-card engine">
      <span className="engine-row">
        <span className={`live-dot live-${tone}`} />
        <span className="engine-label">AI engine</span>
        <span className={`engine-state tone-${tone}`}>{label}</span>
      </span>
      {health?.model && <code className="engine-model">{health.model}</code>}
    </div>
  );
}
