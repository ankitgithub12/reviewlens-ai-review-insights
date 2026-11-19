import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Icon from './Icon.jsx';

/** Dataset bar: pick or drop a CSV, see what the last run did, and start the analysis. */
export default function ScopeBar({ onUpload, loading, disabled, report }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  const status = loading
    ? { tone: 'warn', label: 'Analysing', pulse: true }
    : report
      ? { tone: 'positive', label: 'Analysed' }
      : file
        ? { tone: 'primary', label: 'Ready to analyse' }
        : { tone: 'neutral', label: 'No dataset' };

  const summary = report?.summary;
  const chips = summary
    ? [
        [`${summary.skipped_empty} empty`, 'block'],
        [`${summary.duplicates} duplicate`, 'content_copy'],
        [`${summary.failed} failed`, 'error'],
        [`${report.stats.cache_hits} cached`, 'cached'],
      ]
    : [];

  return (
    <section
      className={`panel scope-bar ${dragging ? 'dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <div className="scope-info">
        <span className="icon-box icon-box-lg">
          <Icon name={file ? 'description' : 'upload_file'} />
        </span>
        <div className="scope-text">
          <div className="scope-title-row">
            <span className="scope-title">{file?.name ?? 'Upload a reviews CSV'}</span>
            <span className={`status-chip tone-${status.tone}`}>
              <span className={`live-dot live-${status.tone} ${status.pulse ? 'pulse' : ''}`} />
              {status.label}
            </span>
            {file && <span className="scope-meta">{(file.size / 1024).toFixed(1)} KB</span>}
          </div>
          <div className="scope-sub">
            {summary ? (
              <>
                <span className="mono-label">Dataset:</span>
                <span className="scope-strong">
                  {summary.analyzed} of {summary.total_rows} reviews analysed
                </span>
                <span className="chip-row">
                  {chips.map(([text, icon]) => (
                    <span key={text} className="chip">
                      <Icon name={icon} />
                      {text}
                    </span>
                  ))}
                </span>
              </>
            ) : (
              <span className="muted">
                Drop a file here or choose one · columns: <code>review_id, product, rating, date, review_text</code>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="scope-actions">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="visually-hidden"
          onChange={(e) => setFile(e.target.files[0] ?? null)}
        />
        <button type="button" className="btn btn-secondary" onClick={() => inputRef.current.click()} disabled={loading}>
          <Icon name="folder_open" />
          {file ? 'Change file' : 'Choose CSV'}
        </button>
        <motion.button
          type="button"
          className="btn btn-primary"
          disabled={!file || loading || disabled}
          onClick={() => onUpload(file)}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? <span className="spinner spinner-light" /> : <Icon name="radar" />}
          {loading ? 'Analysing…' : 'Analyse reviews'}
        </motion.button>
      </div>
    </section>
  );
}
