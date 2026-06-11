import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="legal-container" style={{ maxWidth: '760px', margin: '0 auto', padding: '4rem 2rem' }}>
      <Link to="/" className="back-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#c2410c', fontWeight: 600, textDecoration: 'none', marginBottom: '3rem' }}>
        <i className="fas fa-arrow-left"></i> Back to Home
      </Link>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>Privacy Policy</h1>
      <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '3rem' }}>Last Updated: May 7, 2026</div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginTop: '2.5rem', borderLeft: '4px solid #FF6B35', paddingLeft: '12px' }}>1. Introduction</h2>
      <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#475569' }}>HobbyBuddy ("we", "our", or "us") is a social platform designed to connect individuals based on shared interests and psychological compatibility. This Privacy Policy explains how we collect, use, and protect your personal data in compliance with the General Data Protection Regulation (GDPR) and Italian privacy laws.</p>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginTop: '2.5rem', borderLeft: '4px solid #FF6B35', paddingLeft: '12px' }}>2. Data We Collect</h2>
      <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#475569' }}>To provide our matching services and community features, we collect:</p>
      <ul style={{ paddingLeft: '1.2rem', fontSize: '1rem', lineHeight: 1.8, color: '#475569' }}>
        <li><strong>Account Information:</strong> Email address, password (encrypted), and display name.</li>
        <li><strong>Profile Information:</strong> Age, city, profile photos (URLs), and icebreaker prompts.</li>
        <li><strong>Personality Data:</strong> Trait scores derived from a short personality quiz (Mini-IPIP model).</li>
        <li><strong>Social Content:</strong> Hobbies, community posts, event participation data, and private messages.</li>
      </ul>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginTop: '2.5rem', borderLeft: '4px solid #FF6B35', paddingLeft: '12px' }}>3. How We Use Your Data</h2>
      <ul style={{ paddingLeft: '1.2rem', fontSize: '1rem', lineHeight: 1.8, color: '#475569' }}>
        <li><strong>Matching Algorithm:</strong> To calculate compatibility scores and suggest potential "hobby twins."</li>
        <li><strong>Profile Visibility:</strong> To display your identity card, hobbies, and prompts to other users.</li>
        <li><strong>Community Features:</strong> To enable the social feed, event organization, and messaging.</li>
        <li><strong>Platform Improvement:</strong> To analyze usage patterns and improve matching accuracy.</li>
      </ul>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginTop: '2.5rem', borderLeft: '4px solid #FF6B35', paddingLeft: '12px' }}>4. Legal Basis (GDPR Art. 6)</h2>
      <ul style={{ paddingLeft: '1.2rem', fontSize: '1rem', lineHeight: 1.8, color: '#475569' }}>
        <li><strong>Consent:</strong> Your explicit agreement when you register and complete the personality quiz.</li>
        <li><strong>Legitimate Interest:</strong> To maintain and improve core functionality and security.</li>
      </ul>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginTop: '2.5rem', borderLeft: '4px solid #FF6B35', paddingLeft: '12px' }}>5. Data Sharing and Storage</h2>
      <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#475569' }}><strong>We do NOT sell your personal data to third parties.</strong> Your data is stored securely using Aiven (MySQL Cloud) infrastructure.</p>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginTop: '2.5rem', borderLeft: '4px solid #FF6B35', paddingLeft: '12px' }}>6. Your Rights (GDPR)</h2>
      <ul style={{ paddingLeft: '1.2rem', fontSize: '1rem', lineHeight: 1.8, color: '#475569' }}>
        <li><strong>Access:</strong> Request a copy of the data we hold about you.</li>
        <li><strong>Rectification:</strong> Correct any inaccurate or incomplete data.</li>
        <li><strong>Erasure:</strong> Request deletion of your account and associated data.</li>
        <li><strong>Portability:</strong> Request that we transfer your data to another service.</li>
        <li><strong>Objection:</strong> Object to the processing of your data for specific purposes.</li>
      </ul>
      <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#475569' }}>Contact: <strong>contact@hobbybuddy.app</strong></p>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginTop: '2.5rem', borderLeft: '4px solid #FF6B35', paddingLeft: '12px' }}>7. Data Retention</h2>
      <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#475569' }}>Your data is retained as long as your account is active. Upon deletion request, all data is permanently deleted within 30 days.</p>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginTop: '2.5rem', borderLeft: '4px solid #FF6B35', paddingLeft: '12px' }}>8. Quiz Methodology</h2>
      <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#475569' }}>Our personality quiz is based on the Mini-IPIP model (Donnellan et al., 2006), a validated short-form Big Five instrument. Visit <a href="https://ipip.ori.org" target="_blank" rel="noopener noreferrer">ipip.ori.org</a> for more information.</p>

      <footer style={{ marginTop: '80px', paddingTop: '40px', borderTop: '1px solid #e2e8f0', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
        <Link to="/" style={{ color: '#c2410c', textDecoration: 'none', fontWeight: 600 }}>Back to Home</Link>
        <p style={{ marginTop: '20px' }}>&copy; {new Date().getFullYear()} HobbyBuddy. Personality-based matching for real friendships.</p>
      </footer>
    </div>
  );
}
