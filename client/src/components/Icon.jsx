/** Material Symbols icon (font loaded in index.html). Decorative, so hidden from screen readers. */
export default function Icon({ name, className = '' }) {
  return (
    <span className={`icon material-symbols-outlined ${className}`} aria-hidden="true">
      {name}
    </span>
  );
}
