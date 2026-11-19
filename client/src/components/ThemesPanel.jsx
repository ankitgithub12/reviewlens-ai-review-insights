import { motion } from 'framer-motion';
import { easeOut, fadeUp, Reveal, stagger } from './motion.jsx';

const SOURCE_NOTE = {
  ai: '✨ Grouped by AI from the analysed reviews',
  cache: '✨ Grouped by AI (cached)',
  fallback: 'AI grouping unavailable — ranked by topic counts',
  none: 'No analysed reviews yet',
};

export default function ThemesPanel({ themes, reviews }) {
  const summaryById = new Map(reviews.filter((r) => r.analysis).map((r) => [r.review_id, r.analysis.summary]));
  return (
    <Reveal className="themes">
      <ThemeList title="Top complaints" icon="⚠️" items={themes.complaints} tone="negative" summaryById={summaryById} />
      <ThemeList title="Top praises" icon="💚" items={themes.praises} tone="positive" summaryById={summaryById} />
      <p className="muted small themes-note">{SOURCE_NOTE[themes.source]}</p>
    </Reveal>
  );
}

function ThemeList({ title, icon, items, tone, summaryById }) {
  const max = Math.max(1, ...items.map((item) => item.count));
  return (
    <motion.div className={`card theme-card theme-${tone}`} whileHover={{ y: -3 }}>
      <h2>
        <span className="theme-icon">{icon}</span> {title}
      </h2>
      {items.length === 0 && <p className="muted">None found.</p>}
      <motion.ol initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger(0.12, 0.15)}>
        {items.map((item, index) => (
          <motion.li key={item.theme} variants={fadeUp}>
            <span className="rank">{index + 1}</span>
            <div className="theme-body">
              <div className="theme-title">
                {item.theme}
                <span className="count-chip">{item.count}</span>
              </div>
              <div className="theme-track">
                <motion.div
                  className="theme-fill"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(item.count / max) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: 0.3 + index * 0.12, ease: easeOut }}
                />
              </div>
              <div
                className="muted small"
                title={item.review_ids.map((id) => `${id}: ${summaryById.get(id) ?? ''}`).join('\n')}
              >
                {item.review_ids.join(', ')}
              </div>
            </div>
          </motion.li>
        ))}
      </motion.ol>
    </motion.div>
  );
}
