/* User-friendly error boundary — catches render errors and renders fallback */
import { Component } from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, _info) {
    // Safe logging — no secrets, no user data, no private info
    console.error('App error caught by ErrorBoundary:', error?.message || error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { message = 'Something went wrong — please try again', onRetry } = this.props;
    if (this.state.hasError) {
      return (
        <div className="error-box" role="alert" style={{ padding: '2rem', textAlign: 'center', maxWidth: '600px', margin: '4rem auto' }}>
          <h2>Oops!</h2>
          <p>{message}</p>
          {onRetry ? (
            <button onClick={onRetry} aria-label="Retry" style={{ padding: '0.75rem 1.5rem', margin: '1rem 0.5rem', borderRadius: '999px', border: 'none', background: '#c2410c', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
              Retry
            </button>
          ) : (
            <button onClick={this.handleRetry} aria-label="Retry" style={{ padding: '0.75rem 1.5rem', margin: '1rem 0.5rem', borderRadius: '999px', border: 'none', background: '#c2410c', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
              Retry
            </button>
          )}
          <p><Link to="/">Go Home</Link></p>
        </div>
      );
    }
    return this.props.children;
  }
}
