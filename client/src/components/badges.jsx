export const TOPIC_LABELS = {
  quality: 'Quality',
  delivery: 'Delivery',
  price: 'Price',
  packaging: 'Packaging',
  support: 'Support',
  size_fit: 'Size / fit',
  other: 'Other',
};

const FLAG_LABELS = {
  empty_text: 'Empty text',
  missing_rating: 'No rating',
  invalid_rating: 'Invalid rating',
  invalid_date: 'Invalid date',
  html_stripped: 'HTML removed',
  prompt_injection_suspected: 'Injection attempt',
};

export const SentimentBadge = ({ sentiment }) => <span className={`pill pill-${sentiment}`}>{sentiment}</span>;

export const TopicTag = ({ topic }) => <span className="tag">{TOPIC_LABELS[topic] ?? topic}</span>;

export const FlagTag = ({ flag }) => <span className="tag tag-flag">{FLAG_LABELS[flag] ?? flag}</span>;

export function SentimentBar({ sentiment }) {
  return (
    <div className="sentiment-bar" aria-label="Sentiment split">
      {['positive', 'neutral', 'negative'].map((key) =>
        sentiment[key].pct > 0 ? (
          <div key={key} className={`bar-${key}`} style={{ width: `${sentiment[key].pct}%` }}>
            {sentiment[key].pct >= 12 ? `${sentiment[key].pct}%` : ''}
          </div>
        ) : null,
      )}
    </div>
  );
}
