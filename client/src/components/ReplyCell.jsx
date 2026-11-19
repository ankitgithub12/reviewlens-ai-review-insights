import { useState } from 'react';
import { suggestReply } from '../api.js';

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

  if (state.status === 'done') {
    return (
      <div className="reply">
        <p>{state.reply}</p>
        <button type="button" className="btn btn-small" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    );
  }

  return (
    <div className="reply">
      <span className="pill pill-negative">Needs reply</span>
      <button type="button" className="btn btn-small" onClick={generate} disabled={state.status === 'loading'}>
        {state.status === 'loading' ? 'Writing…' : 'Suggest reply'}
      </button>
      {state.status === 'error' && <p className="error-text small">{state.error}</p>}
    </div>
  );
}
