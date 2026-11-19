import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function UploadPanel({ onUpload, loading, disabled }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  function handleSubmit(event) {
    event.preventDefault();
    if (file) onUpload(file);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  return (
    <form className="card upload" onSubmit={handleSubmit}>
      <motion.label
        className={`dropzone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        animate={{ scale: dragging ? 1.015 : 1 }}
        whileHover={{ scale: 1.005 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="visually-hidden"
          onChange={(e) => setFile(e.target.files[0] ?? null)}
        />
        <motion.span
          className="drop-icon"
          animate={dragging ? { y: [0, -6, 0] } : { y: 0 }}
          transition={{ duration: 0.8, repeat: dragging ? Infinity : 0 }}
        >
          <UploadIcon />
        </motion.span>
        <AnimatePresence mode="wait">
          <motion.span
            key={file?.name ?? 'empty'}
            className="drop-text"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {file ? (
              <>
                <strong>{file.name}</strong>
                <span className="muted small">{(file.size / 1024).toFixed(1)} KB · click to change</span>
              </>
            ) : (
              <>
                <strong>Drop your reviews CSV here</strong>
                <span className="muted small">or click to browse · review_id, product, rating, date, review_text</span>
              </>
            )}
          </motion.span>
        </AnimatePresence>
      </motion.label>

      <motion.button
        type="submit"
        className="btn btn-primary"
        disabled={!file || loading || disabled}
        whileHover={!file || loading || disabled ? undefined : { scale: 1.04, y: -1 }}
        whileTap={{ scale: 0.97 }}
      >
        {loading ? (
          <>
            <motion.span
              className="spinner"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
            Analysing…
          </>
        ) : (
          'Analyse reviews →'
        )}
      </motion.button>
    </form>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}
