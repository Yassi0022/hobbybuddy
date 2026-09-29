export default function Contact() {
  return (
    <main style={{ padding: '3rem 1.5rem', maxWidth: '760px', margin: '0 auto', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#c2410c', marginBottom: '0.5rem' }}>Contact Us</h1>
      <p>Questions, feedback, or issues? Reach out — we respond within 24 hours.</p>
      <form onSubmit={(e) => { e.preventDefault(); alert('Thanks! Your message was sent. We will respond shortly.'); }} style={{ maxWidth: '480px', background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(194,65,12,0.08)' }}>
        <label htmlFor="name" style={{ display: 'block', marginTop: '1rem', fontWeight: 600 }}>Name</label>
        <input id="name" name="name" placeholder="Your name" required style={{ width: '100%', padding: '.75rem', marginTop: '.25rem', border: '1px solid #e6ddd5', borderRadius: '8px', fontFamily: 'inherit', fontSize: '1rem', background: '#fff8f5' }} />
        <label htmlFor="email" style={{ display: 'block', marginTop: '1rem', fontWeight: 600 }}>Email</label>
        <input id="email" type="email" name="email" placeholder="you@example.com" required style={{ width: '100%', padding: '.75rem', marginTop: '.25rem', border: '1px solid #e6ddd5', borderRadius: '8px', fontFamily: 'inherit', fontSize: '1rem', background: '#fff8f5' }} />
        <label htmlFor="message" style={{ display: 'block', marginTop: '1rem', fontWeight: 600 }}>Message</label>
        <textarea id="message" name="message" rows="4" placeholder="How can we help?" required style={{ width: '100%', padding: '.75rem', marginTop: '.25rem', border: '1px solid #e6ddd5', borderRadius: '8px', fontFamily: 'inherit', fontSize: '1rem', background: '#fff8f5' }} />
        <button type="submit" style={{ marginTop: '1.5rem', padding: '.75rem 1.75rem', background: '#c2410c', color: '#fff', border: 'none', borderRadius: '999px', fontWeight: 600, cursor: 'pointer' }}>Send Message</button>
      </form>
      <p style={{ marginTop: '1rem' }}><a href="/">Back to Home</a></p>
    </main>
  );
}
