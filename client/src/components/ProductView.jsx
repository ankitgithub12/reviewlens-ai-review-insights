import { motion } from 'framer-motion';
import ReviewsTable from './ReviewsTable.jsx';
import { SentimentBar, TopicTag } from './badges.jsx';
import { CountUp, fadeUp, stagger } from './motion.jsx';

export default function ProductView({ product, reviews }) {
  const productReviews = reviews.filter((r) => r.product === product.product);
  const avgRating =
    product.avg_rating == null ? (
      '—'
    ) : (
      <>
        <CountUp value={product.avg_rating} decimals={1} />
        <span className="star">★</span>
      </>
    );
  const metrics = [
    ['Analysed', <CountUp value={product.analyzed} />],
    ['Avg rating', avgRating],
    ['Need a reply', <CountUp value={product.needs_reply} />],
  ];

  return (
    <>
      <motion.section className="card product-overview" initial="hidden" animate="show" variants={stagger(0.08)}>
        <motion.div variants={fadeUp}>
          <h2 className="product-title">{product.product}</h2>
          <div className="product-metrics">
            {metrics.map(([label, value]) => (
              <div key={label} className="metric">
                <div className="metric-value">{value}</div>
                <div className="muted small">{label}</div>
              </div>
            ))}
          </div>
          <SentimentBar sentiment={product.sentiment} />
          <div className="legend small muted">
            <span className="legend-positive">Positive</span>
            <span className="legend-neutral">Neutral</span>
            <span className="legend-negative">Negative</span>
          </div>
        </motion.div>
        <motion.div variants={fadeUp}>
          <h3>Top issues</h3>
          {product.top_issues.length === 0 ? (
            <p className="muted">🎉 No negative reviews.</p>
          ) : (
            <motion.ul className="issue-list" variants={stagger(0.1, 0.2)}>
              {product.top_issues.map((issue) => (
                <motion.li key={issue.topic} variants={fadeUp}>
                  <TopicTag topic={issue.topic} /> {issue.count} negative review{issue.count === 1 ? '' : 's'}
                  <span className="muted small"> ({issue.review_ids.join(', ')})</span>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </motion.div>
      </motion.section>
      <ReviewsTable reviews={productReviews} products={[product.product]} />
    </>
  );
}
