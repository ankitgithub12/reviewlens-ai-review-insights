import { motion } from 'framer-motion';
import { CountUp, fadeUp, stagger } from './motion.jsx';

export default function SummaryCards({ summary, agreement }) {
  const { sentiment } = summary;
  const mismatches = agreement.mismatched_ids.length;
  const cards = [
    { label: 'Reviews analysed', icon: '📊', value: summary.analyzed, note: `of ${summary.total_rows} rows`, tone: 'primary' },
    { label: 'Positive', icon: '😊', value: sentiment.positive.pct, decimals: 1, suffix: '%', note: `${sentiment.positive.count} reviews`, tone: 'positive' },
    { label: 'Neutral', icon: '😐', value: sentiment.neutral.pct, decimals: 1, suffix: '%', note: `${sentiment.neutral.count} reviews`, tone: 'neutral' },
    { label: 'Negative', icon: '😞', value: sentiment.negative.pct, decimals: 1, suffix: '%', note: `${sentiment.negative.count} reviews`, tone: 'negative' },
    { label: 'Need a reply', icon: '💬', value: summary.needs_reply, note: 'complaints & open issues', tone: 'warn' },
    {
      label: 'Rating ↔ text agreement',
      icon: '⭐',
      value: agreement.agreement_pct,
      decimals: 1,
      suffix: '%',
      note: `${mismatches} strong mismatch${mismatches === 1 ? '' : 'es'} (${agreement.compared} rated)`,
      tone: 'primary',
    },
  ];

  return (
    <motion.section className="cards" initial="hidden" animate="show" variants={stagger(0.06)}>
      {cards.map((card) => (
        <motion.div
          key={card.label}
          className={`card stat stat-${card.tone}`}
          variants={fadeUp}
          whileHover={{ y: -5, transition: { type: 'spring', stiffness: 300, damping: 18 } }}
        >
          <div className="stat-top">
            <span className="stat-label">{card.label}</span>
            <span className="stat-icon">{card.icon}</span>
          </div>
          <div className="stat-value">
            <CountUp value={card.value} decimals={card.decimals} suffix={card.suffix} />
          </div>
          <div className="muted small">{card.note}</div>
        </motion.div>
      ))}
    </motion.section>
  );
}
