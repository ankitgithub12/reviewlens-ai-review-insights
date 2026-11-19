import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from './Icon.jsx';
import { suggestReply } from '../api.js';

const swap = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2 },
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
          <motion.div key="done" className="reply-box" {...swap}>
            <div className="reply-box-head">
              <span className="dot dot-primary" />
              <span className="mono-label">Suggested reply</span>
            </div>
            <p>{state.reply}</p>
            <button type="button" className="link-btn" onClick={copy}>
              <Icon name={copied ? 'check' : 'content_copy'} />
              {copied ? 'Copied' : 'Copy'}
            </button>
          </motion.div>
        ) : (
          <motion.div key="idle" className="reply-actions" {...swap}>
            <span className="chip tone-bg-warn">
              <span className="dot dot-warn pulse" />
              Needs reply
            </span>
            <button type="button" className="btn btn-secondary btn-small" onClick={generate} disabled={state.status === 'loading'}>
              {state.status === 'loading' ? <span className="spinner" /> : <Icon name="auto_awesome" className="tone-primary" />}
              {state.status === 'loading' ? 'Writing…' : 'Suggest reply'}
            </button>
            {state.status === 'error' && <p className="error-text">{state.error}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
