import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FlagTag, SentimentBadge, TOPIC_LABELS, TopicTag } from './badges.jsx';
import { easeOut, Reveal } from './motion.jsx';
import ReplyCell from './ReplyCell.jsx';

const ALL = '';

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

  const hasFilters = Boolean(product || sentiment || topic || replyOnly);
  const clearFilters = () => {
    setProduct(ALL);
    setSentiment(ALL);
    setTopic(ALL);
    setReplyOnly(false);
  };

  return (
    <Reveal className="card table-card">
      <div className="table-header">
        <div>
          <h2>Reviews</h2>
          <p className="muted small">
            Showing{' '}
            <motion.strong key={filtered.length} initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              {filtered.length}
            </motion.strong>{' '}
            of {reviews.length} rows
          </p>
        </div>
        <div className="filters">
          {products.length > 1 && (
            <Select label="Product" value={product} onChange={setProduct} options={products.map((p) => [p, p])} />
          )}
          <Select
            label="Sentiment"
            value={sentiment}
            onChange={setSentiment}
            options={['positive', 'neutral', 'negative'].map((s) => [s, s])}
          />
          <Select label="Topic" value={topic} onChange={setTopic} options={Object.entries(TOPIC_LABELS)} />
          <label className={`toggle ${replyOnly ? 'on' : ''}`}>
            <input type="checkbox" checked={replyOnly} onChange={(e) => setReplyOnly(e.target.checked)} />
            <span className="toggle-track">
              <motion.span className="toggle-thumb" layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
            </span>
            Needs reply
          </label>
          <AnimatePresence>
            {hasFilters && (
              <motion.button
                type="button"
                className="btn btn-ghost"
                onClick={clearFilters}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                ✕ Clear
              </motion.button>
            )}
          </AnimatePresence>
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
              🔍 No reviews match these filters.
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.35, delay: Math.min(position * 0.03, 0.5), ease: easeOut } }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
    >
      <td className="nowrap id-cell">{review.review_id}</td>
      <td>{review.product}</td>
      <td className="nowrap">
        {review.rating != null ? <span className="stars">{'★'.repeat(review.rating)}<span className="stars-off">{'★'.repeat(5 - review.rating)}</span></span> : <span className="muted">unknown</span>}
        {review.rating_mismatch && (
          <div>
            <span className="tag tag-warn" title="Star rating disagrees with the review text">
              Rating mismatch
            </span>
          </div>
        )}
      </td>
      <td>{analysis ? <SentimentBadge sentiment={analysis.sentiment} /> : <span className="muted">—</span>}</td>
      <td>{analysis?.topics.map((t) => <TopicTag key={t} topic={t} />)}</td>
      <td className="col-summary">
        {statusLabel && (
          <div className="status-line">
            <strong>{statusLabel}</strong>
            {review.duplicate_of && ` of ${review.duplicate_of}`}
            {review.error && <span className="muted small"> — {review.error}</span>}
          </div>
        )}
        {analysis && <div className="summary-text">{analysis.summary}</div>}
        {review.text && <div className="original">“{review.text}”</div>}
        <div>
          {review.flags.map((flag) => (
            <FlagTag key={flag} flag={flag} />
          ))}
          {review.source === 'cache' && <span className="tag">⚡ cached</span>}
        </div>
      </td>
      <td>{review.status === 'analyzed' && analysis.needs_reply ? <ReplyCell review={review} /> : null}</td>
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
