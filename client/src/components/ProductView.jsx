import { motion } from 'framer-motion';
import Icon from './Icon.jsx';
import ReviewsTable from './ReviewsTable.jsx';
import { SegmentedBar, TopicTag } from './badges.jsx';
import { CountUp, fadeUp, stagger } from './motion.jsx';

export default function ProductView({ product, reviews }) {
  const productReviews = reviews.filter((r) => r.product === product.product);
  const { sentiment } = product;

  return (
    <>
      <motion.section className="panel product-head" initial="hidden" animate="show" variants={stagger(0.06)}>
        <motion.div className="product-main" variants={fadeUp}>
          <div className="product-title-row">
            <span className="icon-box icon-box-lg">
              <Icon name="inventory_2" />
            </span>
            <div>
              <h2 className="product-title">{product.product}</h2>
              <span className="mono-label">Product report</span>
            </div>
          </div>
          <div className="product-metrics">
            <Metric label="Analysed" value={<CountUp value={product.analyzed} />} />
            <Metric
              label="Avg rating"
              value={
                product.avg_rating == null ? (
                  '—'
                ) : (
                  <>
                    <CountUp value={product.avg_rating} decimals={1} />
                    <span className="star">★</span>
                  </>
                )
              }
            />
            <Metric label="Need a reply" value={<CountUp value={product.needs_reply} />} tone="warn" />
          </div>
          <SegmentedBar sentiment={sentiment} tall />
          <div className="legend">
            <span className="legend-positive">Positive {sentiment.positive.count}</span>
            <span className="legend-neutral">Neutral {sentiment.neutral.count}</span>
            <span className="legend-negative">Negative {sentiment.negative.count}</span>
          </div>
        </motion.div>

        <motion.div className="product-issues" variants={fadeUp}>
          <span className="mono-label">Top issues</span>
          {product.top_issues.length === 0 ? (
            <p className="muted">No negative reviews for this product.</p>
          ) : (
            <ul className="issue-list">
              {product.top_issues.map((issue) => (
                <li key={issue.topic} className="issue-item">
                  <TopicTag topic={issue.topic} />
                  <span>
                    {issue.count} negative review{issue.count === 1 ? '' : 's'}
                  </span>
                  <span className="id-list">{issue.review_ids.join(' · ')}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </motion.section>

      <ReviewsTable reviews={productReviews} products={[product.product]} />
    </>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div className="metric">
      <div className={`metric-value ${tone ? `tone-${tone}` : ''}`}>{value}</div>
      <span className="mono-label">{label}</span>
    </div>
  );
}
