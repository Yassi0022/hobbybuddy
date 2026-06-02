import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="legal-container" style={{ maxWidth: '760px', margin: '0 auto', padding: '4rem 2rem' }}>
      <Link to="/" className="back-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#c2410c', fontWeight: 600, textDecoration: 'none', marginBottom: '3rem' }}>
        <i className="fas fa-arrow-left"></i> Back to Home
      </Link>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>Terms of Service</h1>
      <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '3rem' }}>Last Updated: May 7, 2026</div>

      {[
        { title: '1. Introduction', content: 'By accessing or using HobbyBuddy, you agree to be bound by these Terms of Service.' },
        { title: '2. Eligibility', content: 'You must be at least 18 years of age to create an account and use HobbyBuddy.' },
        { title: '3. Account Responsibilities', content: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.' },
        { title: '4. Acceptable Use', content: 'You agree not to use HobbyBuddy for any illegal purpose. This includes harassment, hate speech, spam, impersonation, or uploading illegal content.' },
        { title: '5. Personality Data and Matching', content: 'HobbyBuddy uses quiz results solely for matching users. We do not provide professional psychological diagnoses or medical advice.' },
        { title: '6. Intellectual Property', content: 'HobbyBuddy owns all rights in the platform\'s design, code, and brand. Users retain ownership of their content but grant HobbyBuddy a license to display it.' },
        { title: '7. Disclaimer', content: 'HobbyBuddy is provided "as is" without warranties. We do not guarantee matches or friendships.' },
        { title: '8. Limitation of Liability', content: 'HobbyBuddy is not liable for user interactions. Exercise caution when meeting people in person.' },
        { title: '9. Governing Law', content: 'These terms are governed by Italian Law and the GDPR.' },
        { title: '10. Changes to Terms', content: 'We may modify these terms at any time. Continued use constitutes acceptance.' },
      ].map((section) => (
        <div key={section.title}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginTop: '2.5rem', borderLeft: '4px solid #FF6B35', paddingLeft: '12px' }}>{section.title}</h2>
          <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#475569' }}>{section.content}</p>
        </div>
      ))}

      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginTop: '2.5rem', borderLeft: '4px solid #FF6B35', paddingLeft: '12px' }}>11. Contact</h2>
      <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#475569' }}>Email: <strong>contact@hobbybuddy.app</strong></p>

      <footer style={{ marginTop: '80px', paddingTop: '40px', borderTop: '1px solid #e2e8f0', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
        <Link to="/" style={{ color: '#c2410c', textDecoration: 'none', fontWeight: 600 }}>Back to Home</Link>
        <p style={{ marginTop: '20px' }}>&copy; 2026 HobbyBuddy. Personality-based matching for real friendships.</p>
      </footer>
    </div>
  );
}
