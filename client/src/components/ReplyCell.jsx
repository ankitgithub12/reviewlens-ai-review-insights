import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { suggestReply } from '../api.js';

const swap = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
  transition: { duration: 0.25 },
};

/** Suggested reply is generated only when the user clicks, never upfront. */
export default function ReplyCell({ review }) {
  const [state, setState] = useState({ status: 'idle', reply: '', error: '' });
  const [copied, setCopied] = useState(false);

  async function generate() {
    setState({ status: 'loading', reply: '', error: '' });
    try {
      const { reply } = await suggestReply(review);
      setState({ status: 'done', reply, error: '' });
    } catch (err) {
      setState({ status: 'error', reply: '', error: err.message });
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(state.reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="reply">
      <AnimatePresence mode="wait" initial={false}>
        {state.status === 'done' ? (
          <motion.div key="done" className="reply-bubble" {...swap}>
            <p>{state.reply}</p>
            <motion.button type="button" className="btn btn-small" onClick={copy} whileTap={{ scale: 0.92 }}>
              {copied ? '✓ Copied' : 'Copy'}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div key="idle" className="reply-actions" {...swap}>
            <span className="pill pill-warn">
              <span className="pill-dot pulse" />
              Needs reply
            </span>
            <motion.button
              type="button"
              className="btn btn-small btn-accent"
              onClick={generate}
              disabled={state.status === 'loading'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {state.status === 'loading' ? (
                <>
                  <motion.span
                    className="spinner spinner-small"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                  Writing…
                </>
              ) : (
                '✨ Suggest reply'
              )}
            </motion.button>
            {state.status === 'error' && <p className="error-text small">{state.error}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
