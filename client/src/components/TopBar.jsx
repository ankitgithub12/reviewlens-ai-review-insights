import Icon from './Icon.jsx';

export default function TopBar({ viewLabel, health, onMenu }) {
  const ready = health?.ok && health.llm_configured;
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button type="button" className="icon-btn menu-btn" onClick={onMenu} aria-label="Open menu">
          <Icon name="menu" />
        </button>
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <span className="crumb-muted">ReviewLens</span>
          <span className="crumb-sep">/</span>
          <span className="crumb-muted crumb-mid">Review analysis</span>
          <span className="crumb-sep crumb-mid">/</span>
          <span className="crumb-current">{viewLabel}</span>
        </nav>
      </div>
      <div className="topbar-right">
        {health && (
          <span className={`status-chip ${ready ? 'tone-positive' : 'tone-negative'}`}>
            <span className={`live-dot ${ready ? 'live-positive' : 'live-negative'}`} />
            {ready ? 'AI connected' : 'AI unavailable'}
          </span>
        )}
      </div>
    </header>
  );
}
