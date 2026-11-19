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
  prompt_injection_suspected: 'Injection attempt',
};

const SENTIMENT_TONE = { positive: 'positive', neutral: 'neutral', negative: 'negative' };

export const SentimentBadge = ({ sentiment }) => (
  <span className={`chip tone-bg-${SENTIMENT_TONE[sentiment]} sentiment-chip`}>
    <span className={`dot dot-${SENTIMENT_TONE[sentiment]}`} />
    {sentiment}
  </span>
);

export const TopicTag = ({ topic }) => <span className={`chip topic-${topic}`}>{TOPIC_LABELS[topic] ?? topic}</span>;

export const FlagTag = ({ flag }) => (
  <span className={`chip ${flag === 'prompt_injection_suspected' ? 'tone-bg-negative' : 'tone-bg-warn'}`}>
    {FLAG_LABELS[flag] ?? flag}
  </span>
);

/** Thin positive/neutral/negative bar whose segments grow in from zero. */
export function SegmentedBar({ sentiment, tall = false }) {
  return (
    <div className={`segmented ${tall ? 'segmented-tall' : ''}`} aria-label="Sentiment split">
      {['positive', 'neutral', 'negative'].map((key, index) =>
        sentiment[key].pct > 0 ? (
          <motion.div
            key={key}
            className={`seg seg-${key}`}
            initial={{ width: 0 }}
            animate={{ width: `${sentiment[key].pct}%` }}
            transition={{ duration: 0.8, delay: 0.15 + index * 0.1, ease: easeOut }}
          >
            {tall && sentiment[key].pct >= 12 ? `${Math.round(sentiment[key].pct)}%` : ''}
          </motion.div>
        ) : null,
      )}
    </div>
  );
}
