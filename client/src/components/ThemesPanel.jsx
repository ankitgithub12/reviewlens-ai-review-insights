import { motion } from 'framer-motion';
import Icon from './Icon.jsx';
import { fadeUp, Reveal, stagger } from './motion.jsx';

const SOURCE_NOTE = {
  ai: 'AI-grouped root causes from the analysed reviews.',
  cache: 'AI-grouped root causes from the analysed reviews (cached).',
  fallback: 'AI grouping unavailable — ranked by topic counts instead.',
  none: 'No analysed reviews yet.',
};

const SEVERITY = [
  { label: 'High priority', tone: 'negative' },
  { label: 'Medium', tone: 'warn' },
  { label: 'Low', tone: 'neutral' },
];

const MAX_QUOTE = 180;
const shorten = (text) => (text.length > MAX_QUOTE ? `${text.slice(0, MAX_QUOTE).trimEnd()}…` : text);

export default function ThemesPanel({ themes, reviews, analyzedCount }) {
  const byId = new Map(reviews.map((r) => [r.review_id, r]));
  const quoteFor = (ids) => byId.get(ids.find((id) => byId.get(id)?.text));

  return (
    <Reveal className="split-grid">
      <div className="panel insight-panel complaints">
        <div className="panel-head">
          <div className="panel-title">
            <span className="dot dot-negative" />
            <h2>Top complaints</h2>
            <span className="chip">{themes.complaints.length} clusters</span>
          </div>
        </div>
        <p className="panel-desc">{SOURCE_NOTE[themes.source]} Each card quotes a real review from the cluster.</p>

        <motion.div className="insight-list" initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger(0.08)}>
          {themes.complaints.length === 0 && <p className="muted">No complaints found.</p>}
          {themes.complaints.map((item, index) => {
            const quote = quoteFor(item.review_ids);
            const severity = SEVERITY[index] ?? SEVERITY[2];
            return (
              <motion.article key={item.theme} className="insight-item" variants={fadeUp}>
                <div className="insight-head">
                  <div className="insight-title-row">
                    <span className={`severity tone-bg-${severity.tone}`}>{severity.label}</span>
                    <span className="insight-title">{item.theme}</span>
                  </div>
                  <span className="insight-meta">
                    {item.count} review{item.count === 1 ? '' : 's'} •{' '}
                    {analyzedCount ? Math.round((item.count / analyzedCount) * 100) : 0}% share
                  </span>
                </div>
                {quote && <blockquote className={`quote quote-${severity.tone}`}>“{shorten(quote.text)}”</blockquote>}
                <div className="insight-foot">
                  {quote && <span className="chip chip-white">{quote.product}</span>}
                  <span className="id-list">{item.review_ids.join(' · ')}</span>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </div>

      <div className="panel insight-panel praises">
        <div className="panel-head">
          <div className="panel-title">
            <span className="dot dot-positive" />
            <h2>Top praises</h2>
          </div>
          <span className="chip tone-bg-positive">{themes.praises.reduce((n, t) => n + t.count, 0)} mentions</span>
        </div>
        <p className="panel-desc">What happy customers mention most often.</p>

        <motion.div className="insight-list" initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger(0.08)}>
          {themes.praises.length === 0 && <p className="muted">No praise found.</p>}
          {themes.praises.map((item) => {
            const quote = quoteFor(item.review_ids);
            return (
              <motion.article key={item.theme} className="insight-item" variants={fadeUp}>
                <div className="insight-head">
                  <div className="insight-title-row">
                    <Icon name="verified" className="tone-positive" />
                    <span className="insight-title">{item.theme}</span>
                  </div>
                  <span className="chip tone-bg-positive">
                    {item.count} review{item.count === 1 ? '' : 's'}
                  </span>
                </div>
                {quote && <p className="praise-quote">“{shorten(quote.text)}”</p>}
                <div className="insight-foot">
                  {quote && <span className="praise-source">{quote.product}</span>}
                  <span className="id-list">{item.review_ids.join(' · ')}</span>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </Reveal>
  );
}
