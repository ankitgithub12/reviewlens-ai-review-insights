import { motion } from 'framer-motion';
import Icon from './Icon.jsx';
import { CountUp, fadeUp, Reveal, stagger } from './motion.jsx';

export default function RunStats({ stats, summary }) {
  const items = [
    ['bolt', 'AI calls made', stats.ai_calls],
    ['cached', 'Served from cache', stats.cache_hits],
    ['replay', 'Rate-limit / server retries', stats.http_retries],
    ['rule', 'Invalid-output retries', stats.validation_retries],
    ['fingerprint', 'Unique texts', stats.unique_texts],
    ['block', 'Skipped empty', summary.skipped_empty],
    ['content_copy', 'Duplicates', summary.duplicates],
    ['error', 'Failed', summary.failed],
  ];
  return (
    <Reveal as="footer" className="panel run-stats">
      <div className="panel-head">
        <div className="panel-title">
          <span className="icon-box">
            <Icon name="terminal" />
          </span>
          <div>
            <h2>Run log</h2>
            <p className="panel-desc">Cost and speed of the last analysis.</p>
          </div>
        </div>
        <span className="run-meta">
          <code>{stats.model}</code>
          <span className="chip">
            <Icon name="timer" />
            {(stats.processing_ms / 1000).toFixed(1)} s
          </span>
        </span>
      </div>
      <motion.dl initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger(0.04)}>
        {items.map(([icon, label, value]) => (
          <motion.div key={label} className="run-item" variants={fadeUp}>
            <dt>
              <Icon name={icon} />
              {label}
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
