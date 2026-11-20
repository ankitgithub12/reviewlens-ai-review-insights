import { motion } from 'framer-motion';
import Icon from './Icon.jsx';
import { SegmentedBar } from './badges.jsx';
import { CountUp, easeOut, fadeUp, stagger } from './motion.jsx';

const share = (part, whole) => (whole === 0 ? 0 : Math.round((part / whole) * 1000) / 10);

export default function SummaryCards({ summary, agreement, themes }) {
  const { sentiment } = summary;
  const topComplaint = themes.complaints[0]?.theme;
  const topPraise = themes.praises[0]?.theme;

  return (
    <motion.section className="kpi-grid" initial="hidden" animate="show" variants={stagger(0.06)}>
      <Kpi label="Reviews analysed" icon="inbox">
        <div className="kpi-value-row">
          <span className="kpi-value">
            <CountUp value={summary.analyzed} />
          </span>
          <span className="delta delta-neutral">of {summary.total_rows} rows</span>
        </div>
        <p className="kpi-desc">
          {summary.skipped_empty} empty and {summary.duplicates} duplicate skipped
        </p>
        <div className="kpi-foot">
          <SegmentedBar sentiment={sentiment} />
          <div className="legend">
            <span className="legend-positive">Pos {Math.round(sentiment.positive.pct)}%</span>
            <span className="legend-neutral">Neu {Math.round(sentiment.neutral.pct)}%</span>
            <span className="legend-negative">Neg {Math.round(sentiment.negative.pct)}%</span>
          </div>
        </div>
      </Kpi>

      <Kpi label="Positive share" icon="sentiment_satisfied" iconTone="positive">
        <div className="kpi-value-row">
          <span className="kpi-value tone-positive">
            <CountUp value={sentiment.positive.pct} decimals={1} suffix="%" />
          </span>
          <span className="kpi-count">({sentiment.positive.count})</span>
        </div>
        <p className="kpi-desc">{topPraise ? `Top praise: ${topPraise}` : 'No praise themes yet'}</p>
      </Kpi>

      <Kpi label="Neutral share" icon="sentiment_neutral" iconTone="warn">
        <div className="kpi-value-row">
          <span className="kpi-value">
            <CountUp value={sentiment.neutral.pct} decimals={1} suffix="%" />
          </span>
          <span className="kpi-count">({sentiment.neutral.count})</span>
        </div>
        <p className="kpi-desc">Mixed or purely factual feedback</p>
      </Kpi>

      <Kpi label="Negative share" icon="sentiment_dissatisfied" iconTone="negative">
        <div className="kpi-value-row">
          <span className="kpi-value tone-negative">
            <CountUp value={sentiment.negative.pct} decimals={1} suffix="%" />
          </span>
          <span className="kpi-count">({sentiment.negative.count})</span>
        </div>
        <p className="kpi-desc">{topComplaint ? `Top complaint: ${topComplaint}` : 'No complaint themes'}</p>
        <FootRow label="Failed analyses" value={summary.failed} tone={summary.failed > 0 ? 'negative' : 'positive'} />
      </Kpi>

      <Kpi label="Needs a reply" icon="notification_important" iconTone="warn">
        <div className="kpi-value-row">
          <span className="kpi-value">
            <CountUp value={summary.needs_reply} />
          </span>
          <span className="delta delta-warn">{share(summary.needs_reply, summary.analyzed)}% of reviews</span>
        </div>
        <p className="kpi-desc">Complaints and unresolved issues</p>
        <FootRow label="Replies" value="Generated on click" />
      </Kpi>

      <Kpi label="Rating ↔ text agreement" icon="analytics" iconTone="primary">
        <div className="kpi-value-row">
          <span className="kpi-value tone-primary">
            <CountUp value={agreement.agreement_pct} decimals={1} />
          </span>
          <span className="kpi-count">/ 100%</span>
        </div>
        <p className="kpi-desc">
          {agreement.mismatched_ids.length} strong mismatch{agreement.mismatched_ids.length === 1 ? '' : 'es'} of{' '}
          {agreement.compared} rated
        </p>
        <div className="kpi-foot">
          <div className="gauge">
            <motion.div
              className="gauge-fill"
              initial={{ width: 0 }}
              animate={{ width: `${agreement.agreement_pct}%` }}
              transition={{ duration: 0.9, delay: 0.2, ease: easeOut }}
            />
          </div>
          <div className="legend legend-plain">
            <span>0</span>
            <span>{agreement.mismatched_ids.slice(0, 3).join(', ') || 'no mismatches'}</span>
            <span>100</span>
          </div>
        </div>
      </Kpi>
    </motion.section>
  );
}

function Kpi({ label, icon, iconTone = 'muted', children }) {
  return (
    <motion.div className="panel kpi" variants={fadeUp}>
      <div className="kpi-head">
        <span className="mono-label">{label}</span>
        <Icon name={icon} className={`tone-${iconTone}`} />
      </div>
      {children}
    </motion.div>
  );
}

function FootRow({ label, value, tone }) {
  return (
    <div className="kpi-foot kpi-foot-row">
      <span>{label}</span>
      <strong className={tone ? `tone-${tone}` : ''}>{value}</strong>
    </div>
  );
}
