import { useMemo, useState } from 'react';
import { FlagTag, SentimentBadge, TOPIC_LABELS, TopicTag } from './badges.jsx';
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

  const filtered = useMemo(
    () =>
      reviews.filter((r) => {
        if (product && r.product !== product) return false;
        if (sentiment && r.analysis?.sentiment !== sentiment) return false;
        if (topic && !r.analysis?.topics.includes(topic)) return false;
        if (replyOnly && !(r.status === 'analyzed' && r.analysis.needs_reply)) return false;
        return true;
      }),
    [reviews, product, sentiment, topic, replyOnly],
  );

  const clearFilters = () => {
    setProduct(ALL);
    setSentiment(ALL);
    setTopic(ALL);
    setReplyOnly(false);
  };

  return (
    <section className="card">
      <div className="table-header">
        <h2>Reviews</h2>
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
          <label className="checkbox">
            <input type="checkbox" checked={replyOnly} onChange={(e) => setReplyOnly(e.target.checked)} />
            Needs reply only
          </label>
          <button type="button" className="btn btn-link" onClick={clearFilters}>
            Clear
          </button>
        </div>
      </div>
      <p className="muted small">
        Showing {filtered.length} of {reviews.length} rows
      </p>

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
            {filtered.map((review, index) => (
              <ReviewRow key={`${review.review_id}-${index}`} review={review} />
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="muted empty">No reviews match these filters.</p>}
      </div>
    </section>
  );
}

function ReviewRow({ review }) {
  const { analysis } = review;
  const statusLabel = STATUS_LABELS[review.status];
  return (
    <tr className={review.status !== 'analyzed' ? 'row-dim' : ''}>
      <td className="nowrap">{review.review_id}</td>
      <td>{review.product}</td>
      <td className="nowrap">
        {review.rating != null ? `${review.rating}★` : <span className="muted">unknown</span>}
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
        {analysis && <div>{analysis.summary}</div>}
        {review.text && <div className="original">“{review.text}”</div>}
        <div>
          {review.flags.map((flag) => (
            <FlagTag key={flag} flag={flag} />
          ))}
          {review.source === 'cache' && <span className="tag">cached</span>}
        </div>
      </td>
      <td>{review.status === 'analyzed' && analysis.needs_reply ? <ReplyCell review={review} /> : null}</td>
    </tr>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="select">
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
