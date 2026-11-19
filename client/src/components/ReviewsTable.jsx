import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from './Icon.jsx';
import { FlagTag, SentimentBadge, TOPIC_LABELS, TopicTag } from './badges.jsx';
import { easeOut, Reveal } from './motion.jsx';
import ReplyCell from './ReplyCell.jsx';

const ALL = '';
const SENTIMENTS = ['positive', 'neutral', 'negative'];

const STATUS_LABELS = {
  analyzed: null,
  duplicate: 'Duplicate',
  skipped: 'Skipped (empty)',
  analysis_failed: 'Analysis failed',
};

export default function ReviewsTable({ reviews, products }) {
  const [product, setProduct] = useState(ALL);
  const [sentiment, setSentiment] = useState(ALL);
  const [topic, setTopic] = useState(ALL);
  const [replyOnly, setReplyOnly] = useState(false);

  // Keep each review's original position as a stable React key (review_id alone may repeat in a CSV).
  const filtered = useMemo(
    () =>
      reviews
        .map((review, index) => ({ review, key: `${review.review_id}-${index}` }))
        .filter(({ review: r }) => {
          if (product && r.product !== product) return false;
          if (sentiment && r.analysis?.sentiment !== sentiment) return false;
          if (topic && !r.analysis?.topics.includes(topic)) return false;
          if (replyOnly && !(r.status === 'analyzed' && r.analysis.needs_reply)) return false;
          return true;
        }),
    [reviews, product, sentiment, topic, replyOnly],
  );

  const sentimentCounts = useMemo(
    () => Object.fromEntries(SENTIMENTS.map((s) => [s, reviews.filter((r) => r.analysis?.sentiment === s).length])),
    [reviews],
  );

  const hasFilters = Boolean(product || sentiment || topic || replyOnly);
  const clearFilters = () => {
    setProduct(ALL);
    setSentiment(ALL);
    setTopic(ALL);
    setReplyOnly(false);
  };

  const chips = [
    [ALL, 'All', reviews.length],
    ...SENTIMENTS.map((s) => [s, s[0].toUpperCase() + s.slice(1), sentimentCounts[s]]),
  ];

  return (
    <Reveal className="panel table-panel">
      <div className="panel-head">
        <div className="panel-title">
          <span className="dot dot-primary" />
          <h2>Reviews</h2>
          <span className="chip">
            <motion.span key={filtered.length} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
              {filtered.length}
            </motion.span>
            &nbsp;of {reviews.length}
          </span>
        </div>
        <AnimatePresence>
          {hasFilters && (
            <motion.button
              type="button"
              className="link-btn"
              onClick={clearFilters}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Icon name="filter_alt_off" />
              Clear filters
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="filter-rail">
        <div className="chip-filters" role="group" aria-label="Filter by sentiment">
          {chips.map(([value, label, count]) => (
            <button
              key={label}
              type="button"
              className={`filter-chip ${sentiment === value ? 'active' : ''}`}
              onClick={() => setSentiment(value)}
              aria-pressed={sentiment === value}
            >
              {label} <span className="filter-count">({count})</span>
            </button>
          ))}
        </div>
        <div className="filters">
          {products.length > 1 && (
            <Select label="Product" value={product} onChange={setProduct} options={products.map((p) => [p, p])} />
          )}
          <Select label="Topic" value={topic} onChange={setTopic} options={Object.entries(TOPIC_LABELS)} />
          <label className={`toggle ${replyOnly ? 'on' : ''}`}>
            <input type="checkbox" checked={replyOnly} onChange={(e) => setReplyOnly(e.target.checked)} />
            <span className="toggle-track">
              <motion.span className="toggle-thumb" layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
            </span>
            Needs reply
          </label>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Product</th>
              <th>Rating</th>
              <th>Sentiment</th>
              <th>Topics</th>
              <th className="col-summary">Summary / original review</th>
              <th>Reply</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={true} mode="popLayout">
              {filtered.map(({ review, key }, position) => (
                <ReviewRow key={key} review={review} position={position} />
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        <AnimatePresence>
          {filtered.length === 0 && (
            <motion.p className="muted empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              No reviews match these filters.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </Reveal>
  );
}

function ReviewRow({ review, position }) {
  const { analysis } = review;
  const statusLabel = STATUS_LABELS[review.status];
  return (
    <motion.tr
      layout
      className={review.status !== 'analyzed' ? 'row-dim' : ''}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.3, delay: Math.min(position * 0.025, 0.4), ease: easeOut } }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      <td className="nowrap id-cell" data-label="ID">
        {review.review_id}
      </td>
      <td data-label="Product">{review.product}</td>
      <td className="nowrap" data-label="Rating">
        {review.rating != null ? (
          <span className="stars" aria-label={`${review.rating} out of 5 stars`}>
            {'★'.repeat(review.rating)}
            <span className="stars-off">{'★'.repeat(5 - review.rating)}</span>
          </span>
        ) : (
          <span className="muted">unknown</span>
        )}
        {review.rating_mismatch && (
          <div>
            <span className="chip tone-bg-negative" title="Star rating disagrees with the review text">
              Rating mismatch
            </span>
          </div>
        )}
      </td>
      <td data-label="Sentiment">{analysis ? <SentimentBadge sentiment={analysis.sentiment} /> : <span className="muted">—</span>}</td>
      <td data-label="Topics">
        <span className="chip-row">
          {analysis?.topics.map((t) => (
            <TopicTag key={t} topic={t} />
          ))}
        </span>
      </td>
      <td className="col-summary" data-label="Review">
        {statusLabel && (
          <div className="status-line">
            <strong>{statusLabel}</strong>
            {review.duplicate_of && ` of ${review.duplicate_of}`}
            {review.error && <span className="muted"> — {review.error}</span>}
          </div>
        )}
        {analysis && <div className="summary-text">{analysis.summary}</div>}
        {review.text && <div className="original">“{review.text}”</div>}
        {(review.flags.length > 0 || review.source === 'cache') && (
          <div className="chip-row">
            {review.flags.map((flag) => (
              <FlagTag key={flag} flag={flag} />
            ))}
            {review.source === 'cache' && <span className="chip">cached</span>}
          </div>
        )}
      </td>
      <td className="col-reply" data-label="Reply">
        {review.status === 'analyzed' && analysis.needs_reply ? <ReplyCell review={review} /> : null}
      </td>
    </motion.tr>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className={`select ${value ? 'active' : ''}`}>
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value={ALL}>All</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
