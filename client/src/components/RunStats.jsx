export default function RunStats({ stats, summary }) {
  const items = [
    ['AI calls made', stats.ai_calls],
    ['Served from cache', stats.cache_hits],
    ['Rate-limit / server retries', stats.http_retries],
    ['Invalid-output retries', stats.validation_retries],
    ['Unique texts', stats.unique_texts],
    ['Skipped empty', summary.skipped_empty],
    ['Duplicates', summary.duplicates],
    ['Failed', summary.failed],
    ['Processing time', `${(stats.processing_ms / 1000).toFixed(1)} s`],
  ];
  return (
    <footer className="card run-stats">
      <h2>Run log</h2>
      <dl>
        {items.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="muted small">Model: {stats.model}</p>
    </footer>
  );
}
