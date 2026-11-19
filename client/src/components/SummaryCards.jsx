export default function SummaryCards({ summary, agreement }) {
  const { sentiment } = summary;
  return (
    <section className="cards">
      <Card label="Reviews analysed" value={summary.analyzed} note={`of ${summary.total_rows} rows`} />
      <Card label="Positive" value={`${sentiment.positive.pct}%`} note={`${sentiment.positive.count} reviews`} tone="positive" />
      <Card label="Neutral" value={`${sentiment.neutral.pct}%`} note={`${sentiment.neutral.count} reviews`} tone="neutral" />
      <Card label="Negative" value={`${sentiment.negative.pct}%`} note={`${sentiment.negative.count} reviews`} tone="negative" />
      <Card label="Need a reply" value={summary.needs_reply} note="complaints & open issues" tone="negative" />
      <Card
        label="Rating ↔ text agreement"
        value={`${agreement.agreement_pct}%`}
        note={`${agreement.mismatched_ids.length} strong mismatch${agreement.mismatched_ids.length === 1 ? '' : 'es'} (${agreement.compared} rated)`}
      />
    </section>
  );
}

function Card({ label, value, note, tone }) {
  return (
    <div className={`card stat ${tone ? `stat-${tone}` : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="muted small">{note}</div>
    </div>
  );
}
