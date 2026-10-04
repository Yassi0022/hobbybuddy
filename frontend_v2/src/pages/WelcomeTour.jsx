import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function WelcomeTour() {
  const [step, setStep] = useState(0);
  const steps = [
    { title: 'Welcome to HobbyBuddy!', body: 'Find people who share your hobbies.' },
    { title: 'Complete your profile', body: 'Add interests and a photo.' },
    { title: 'Discover events', body: 'Browse local events and join them.' },
  ];

  return (
    <section aria-label="Welcome tour" style={{ maxWidth: 520, margin: '2rem auto', padding: '2rem', border: '1px solid #e5e7eb', borderRadius: 16, background: '#fff' }}>
      <h2>Getting started</h2>
      <p style={{ fontWeight: 600 }}>{steps[step].title}</p>
      <p>{steps[step].body}</p>
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button onClick={() => setStep(Math.max(0, step - 1))} aria-label="Previous step" disabled={step === 0} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>Back</button>
        <button onClick={() => setStep(Math.min(steps.length - 1, step + 1))} aria-label="Next step" disabled={step === steps.length - 1} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #ccc', background: '#fff', cursor: step === steps.length - 1 ? 'default' : 'pointer' }}>Next</button>
        <Link to="/dashboard" style={{ marginLeft: 'auto', padding: '0.5rem 1rem', borderRadius: 8, background: '#c2410c', color: '#fff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Done</Link>
      </div>
    </section>
  );
}
