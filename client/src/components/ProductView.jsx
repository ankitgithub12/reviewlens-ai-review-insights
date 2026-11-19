import ReviewsTable from './ReviewsTable.jsx';
import { SentimentBar, TopicTag } from './badges.jsx';

export default function ProductView({ product, reviews }) {
  const productReviews = reviews.filter((r) => r.product === product.product);
  return (
    <>
      <section className="card product-overview">
        <div>
          <h2>{product.product}</h2>
          <p className="muted">
            {product.analyzed} analysed review{product.analyzed === 1 ? '' : 's'} · average rating{' '}
            {product.avg_rating ?? 'unknown'} · {product.needs_reply} need a reply
          </p>
          <SentimentBar sentiment={product.sentiment} />
        </div>
        <div>
          <h3>Top issues</h3>
          {product.top_issues.length === 0 ? (
            <p className="muted">No negative reviews.</p>
          ) : (
            <ul className="issue-list">
              {product.top_issues.map((issue) => (
                <li key={issue.topic}>
                  <TopicTag topic={issue.topic} /> {issue.count} negative review{issue.count === 1 ? '' : 's'}
                  <span className="muted small"> ({issue.review_ids.join(', ')})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <ReviewsTable reviews={productReviews} products={[product.product]} />
    </>
  );
}
