import { motion } from 'framer-motion';
import { easeOut } from './motion.jsx';

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
  prompt_injection_suspected: '🛡️ Injection attempt',
};

export const SentimentBadge = ({ sentiment }) => (
  <span className={`pill pill-${sentiment}`}>
    <span className="pill-dot" />
    {sentiment}
  </span>
);

export const TopicTag = ({ topic }) => <span className={`tag tag-topic topic-${topic}`}>{TOPIC_LABELS[topic] ?? topic}</span>;

export const FlagTag = ({ flag }) => <span className="tag tag-flag">{FLAG_LABELS[flag] ?? flag}</span>;

/** Stacked positive/neutral/negative bar whose segments grow in from zero. */
export function SentimentBar({ sentiment }) {
  return (
    <div className="sentiment-bar" aria-label="Sentiment split">
      {['positive', 'neutral', 'negative'].map((key, index) =>
        sentiment[key].pct > 0 ? (
          <motion.div
            key={key}
            className={`bar-${key}`}
            initial={{ width: 0 }}
            animate={{ width: `${sentiment[key].pct}%` }}
            transition={{ duration: 0.8, delay: 0.15 + index * 0.1, ease: easeOut }}
          >
            {sentiment[key].pct >= 12 ? `${sentiment[key].pct}%` : ''}
          </motion.div>
        ) : null,
      )}
    </div>
  );
}
