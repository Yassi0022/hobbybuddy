import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main style={{ padding: '4rem 1.5rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#c2410c', marginBottom: '1rem' }}>404 — Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <p><Link to="/">Go back to the homepage</Link></p>
    </main>
  );
}
