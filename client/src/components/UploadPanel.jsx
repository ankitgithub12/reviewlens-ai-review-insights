import { useState } from 'react';

export default function UploadPanel({ onUpload, loading, disabled }) {
  const [file, setFile] = useState(null);

  function handleSubmit(event) {
    event.preventDefault();
    if (file) onUpload(file);
  }

  return (
    <form className="card upload" onSubmit={handleSubmit}>
      <label className="upload-label">
        <span>Reviews CSV</span>
        <input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files[0] ?? null)} />
      </label>
      <button type="submit" className="btn btn-primary" disabled={!file || loading || disabled}>
        {loading ? 'Analysing… (this can take a minute)' : 'Analyse reviews'}
      </button>
      <p className="muted small">
        Columns: review_id, product, rating, date, review_text. Re-uploading a file reuses cached results.
      </p>
    </form>
  );
}
