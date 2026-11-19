const SOURCE_NOTE = {
  ai: 'Grouped by AI from the analysed reviews',
  cache: 'Grouped by AI (cached)',
  fallback: 'AI grouping unavailable — ranked by topic counts',
  none: 'No analysed reviews yet',
};

export default function ThemesPanel({ themes, reviews }) {
  const summaryById = new Map(reviews.filter((r) => r.analysis).map((r) => [r.review_id, r.analysis.summary]));
  return (
    <section className="themes">
      <ThemeList title="Top complaints" items={themes.complaints} tone="negative" summaryById={summaryById} />
      <ThemeList title="Top praises" items={themes.praises} tone="positive" summaryById={summaryById} />
      <p className="muted small themes-note">{SOURCE_NOTE[themes.source]}</p>
    </section>
  );
}

function ThemeList({ title, items, tone, summaryById }) {
  return (
    <div className={`card theme-card theme-${tone}`}>
      <h2>{title}</h2>
      {items.length === 0 && <p className="muted">None found.</p>}
      <ol>
        {items.map((item) => (
          <li key={item.theme}>
            <div className="theme-title">
              {item.theme}
              <span className="pill">{item.count} review{item.count === 1 ? '' : 's'}</span>
            </div>
            <div className="muted small" title={item.review_ids.map((id) => `${id}: ${summaryById.get(id) ?? ''}`).join('\n')}>
              {item.review_ids.join(', ')}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
