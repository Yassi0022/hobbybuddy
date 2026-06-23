import { Link } from 'react-router-dom';

/**
 * EmptyState — warm, editorial empty-state component.
 *
 * Every empty screen should:
 *   1. Explain what's happening
 *   2. Give a clear next action
 *   3. Feel visually balanced, not placeholder-ish
 *
 * Props:
 *   icon       — emoji (e.g. '🌱')
 *   title      — short headline
 *   body       — optional explanation paragraph
 *   action     — { label, href, onClick } — primary CTA
 *   secondary  — { label, href, onClick } — optional secondary link
 */
export default function EmptyState({ icon, image, title, body, action, secondary }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '56px 24px',
      background: 'var(--color-surface, #fff)',
      borderRadius: 16,
      border: '1px solid var(--color-border, #eee)',
    }}>
      {image ? (
        <div style={{ marginBottom: 20, lineHeight: 1 }}>
          <img src={image} alt="" style={{ maxWidth: 240, width: '100%', height: 'auto', borderRadius: 12, display: 'inline-block' }} />
        </div>
      ) : icon ? (
        <div style={{
          fontSize: '3rem',
          marginBottom: 20,
          lineHeight: 1,
        }}>
          {icon}
        </div>
      ) : null}

      <h3 style={{
        margin: '0 0 10px',
        fontSize: '1.15rem',
        fontWeight: 700,
        letterSpacing: '-0.01em',
        color: 'var(--color-text-main, #1a1a2e)',
      }}>
        {title}
      </h3>

      {body && (
        <p style={{
          margin: '0 0 24px',
          fontSize: '0.88rem',
          color: 'var(--color-text-muted, #666)',
          lineHeight: 1.55,
          maxWidth: 400,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          {body}
        </p>
      )}

      {action && (
        action.href ? (
          <Link
            to={action.href}
            className="btn-primary"
            style={{ display: 'inline-block', minWidth: 180, textDecoration: 'none' }}
          >
            {action.label}
          </Link>
        ) : (
          <button
            className="btn-primary"
            onClick={action.onClick}
            style={{ minWidth: 180 }}
          >
            {action.label}
          </button>
        )
      )}

      {secondary && (
        <div style={{ marginTop: 12 }}>
          {secondary.href ? (
            <Link
              to={secondary.href}
              style={{
                fontSize: '0.82rem',
                color: 'var(--color-accent-warm, #c2410c)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              {secondary.label}
            </Link>
          ) : (
            <button
              className="btn-secondary"
              onClick={secondary.onClick}
              style={{ fontSize: '0.82rem', padding: '6px 16px' }}
            >
              {secondary.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
