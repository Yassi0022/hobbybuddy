/* User-friendly error boundary */
export default function ErrorBoundary({ message = 'Something went wrong — please try again', onRetry }) {
  return `<div class="error-box" role="alert">
    <h2>Oops!</h2>
    <p>${message}</p>
    ${onRetry ? `<button onclick="${onRetry}" aria-label="Retry">Retry</button>` : ''}
    <p><a href="/">Go Home</a></p>
  </div>`;
}
