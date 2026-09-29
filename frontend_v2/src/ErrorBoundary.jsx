/* User-friendly error boundary */
import { Link } from 'react-router-dom';

export default function ErrorBoundary({ message = 'Something went wrong — please try again', onRetry }) {
  return (
    <div className="error-box" role="alert" style={{ padding: '2rem', textAlign: 'center', maxWidth: '600px', margin: '4rem auto' }}>
      <h2>Oops!</h2>
      <p>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          aria-label="Retry"
          style={{ padding: '0.75rem 1.5rem', margin: '1rem 0.5rem', borderRadius: '999px', border: 'none', background: '#c2410c', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
        >
          Retry
        </button>
      )}
      <p><Link to="/">Go Home</Link></p>
    </div>
  );
}
