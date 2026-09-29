/* Skeleton component for loading states */
export default function Skeleton({ width = '100%', height = '1.5rem', className = '' }) {
  return (
    <div
      className={`skeleton ${className}`.trim()}
      style={{ width, height }}
      aria-label="Loading"
    />
  );
}
