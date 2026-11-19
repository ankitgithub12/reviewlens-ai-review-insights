import { motion } from 'framer-motion';
import { CountUp, fadeUp, Reveal, stagger } from './motion.jsx';

export default function RunStats({ stats, summary }) {
  const items = [
    ['🤖', 'AI calls made', stats.ai_calls],
    ['⚡', 'Served from cache', stats.cache_hits],
    ['🔁', 'Rate-limit / server retries', stats.http_retries],
    ['🧪', 'Invalid-output retries', stats.validation_retries],
    ['🧾', 'Unique texts', stats.unique_texts],
    ['🚫', 'Skipped empty', summary.skipped_empty],
    ['👯', 'Duplicates', summary.duplicates],
    ['❌', 'Failed', summary.failed],
  ];
  return (
    <Reveal as="footer" className="card run-stats">
      <div className="run-header">
        <h2>Run log</h2>
        <span className="muted small">
          Model: <code>{stats.model}</code> · processed in <strong>{(stats.processing_ms / 1000).toFixed(1)} s</strong>
        </span>
      </div>
      <motion.dl initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger(0.05)}>
        {items.map(([icon, label, value]) => (
          <motion.div key={label} className="run-item" variants={fadeUp}>
            <dt>
              <span aria-hidden="true">{icon}</span> {label}
            </dt>
            <dd>
              <CountUp value={value} duration={0.8} />
            </dd>
          </motion.div>
        ))}
      </motion.dl>
    </Reveal>
  );
}
