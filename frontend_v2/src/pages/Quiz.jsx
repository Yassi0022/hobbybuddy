import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, QUESTIONS, TRAIT_LABELS, TRAIT_ICONS, SCALE_LABELS, HOBBIES_LIST, TOTAL } from '../utils/constants';
import { getArchetype } from '../utils/archetype';
import { showToast } from '../utils/toast';
import { shareVibe, shareToWhatsApp, shareToTelegram, shareToTwitter } from '../utils/share';

export default function Quiz() {
  const { token, authFetch } = useAuth();
  const navigate = useNavigate();
  const [screen, setScreen] = useState('consent');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [traits, setTraits] = useState(null);
  const [selectedHobbies, setSelectedHobbies] = useState(new Set());
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    setScreen('splash');
    const timer = setTimeout(() => setScreen('quiz'), 2500);
    return () => clearTimeout(timer);
  }, [token, navigate]);

  const currentQ = QUESTIONS[currentIdx];
  const traitIdx = currentQ[0];
  const questionText = currentQ[1];

  const handleAnswer = useCallback((value) => {
    const newAnswers = { ...answers, [currentIdx]: value };
    const nextIdx = currentIdx + 1;
    const pct = Math.round((nextIdx / TOTAL) * 100);
    setProgress(pct);

    if (nextIdx >= TOTAL) {
      calculateTraits(newAnswers);
    } else if (nextIdx % 10 === 0) {
      setScreen('unlock');
      setTimeout(() => {
        setCurrentIdx(nextIdx);
        setScreen('quiz');
      }, 1500);
    } else {
      setCurrentIdx(nextIdx);
      setAnswers(newAnswers);
    }
  }, [currentIdx, answers]);

  const calculateTraits = (allAnswers) => {
    const scores = [0, 0, 0, 0, 0];
    const counts = [0, 0, 0, 0, 0];
    for (let i = 0; i < TOTAL; i++) {
      const q = QUESTIONS[i];
      const tIdx = q[0];
      const dir = q[2];
      const val = allAnswers[i] || 3;
      const score = dir === -1 ? 6 - val : val;
      scores[tIdx] += score;
      counts[tIdx]++;
    }
    const normalized = scores.map((s, i) => Math.round((s / (counts[i] * 5)) * 100));
    setTraits({
      extraversion: normalized[0],
      agreeableness: normalized[1],
      conscientiousness: normalized[2],
      neuroticism: 100 - normalized[3],
      openness: normalized[4],
    });
    setScreen('hobbies');
  };

  const toggleHobby = (hobby) => {
    setSelectedHobbies((prev) => {
      const next = new Set(prev);
      if (next.has(hobby)) { next.delete(hobby); }
      else {
        if (next.size >= 5) { showToast('Max 5 hobbies', 'error'); return prev; }
        next.add(hobby);
      }
      return next;
    });
  };

  const submitTraits = async () => {
    if (selectedHobbies.size < 3) { showToast('Select at least 3 hobbies', 'error'); return; }
    setScreen('reveal');
    try {
      const userId = localStorage.getItem('userId');
      const hobbies = Array.from(selectedHobbies).join(',');
      // Calculate trait scores from answers
      const scores = [0, 0, 0, 0, 0];
      const counts = [0, 0, 0, 0, 0];
      for (let i = 0; i < TOTAL; i++) {
        const q = QUESTIONS[i];
        const tIdx = q[0];
        const dir = q[2];
        const val = answers[i] || 3;
        const score = dir === -1 ? 6 - val : val;
        scores[tIdx] += score;
        counts[tIdx]++;
      }
      const payload = {
        openness: scores[4] / (counts[4] * 5) * 100,
        conscientiousness: scores[2] / (counts[2] * 5) * 100,
        extraversion: scores[0] / (counts[0] * 5) * 100,
        agreeableness: scores[1] / (counts[1] * 5) * 100,
        neuroticism: (1 - scores[3] / (counts[3] * 5)) * 100,
        hobbies,
        gdprConsent: true,
      };
      await authFetch(`${API_BASE_URL}/api/users/${userId}/quiz-submit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) { console.error('Quiz submit failed:', err); }
  };

  const archetype = traits ? getArchetype(traits) : null;

  // --- CONSENT ---
  if (screen === 'consent') {
    return (
      <>
        <div className="bg-mesh"><div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div></div>
        <nav className="navbar navbar-solid"><div className="nav-container"><a href="/" className="logo"><i className="fas fa-users"></i><span>HobbyBuddy</span></a></div></nav>
        <div className="gamified-screen" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', textAlign: 'center', padding: '40px 24px', minHeight: '100vh' }}>
          <div className="auth-icon" style={{ background: 'var(--color-accent-violet)', marginBottom: '30px' }}><i className="fas fa-shield-halved"></i></div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '20px' }}>Before we begin</h1>
          <div style={{ maxWidth: '500px', background: 'rgba(255,255,255,0.05)', padding: '30px', borderRadius: '20px', textAlign: 'left', marginBottom: '30px' }}>
            <p style={{ marginBottom: '15px' }}>You're about to complete the IPIP Big-Five personality assessment. Your results will be used exclusively to match you with compatible hobby buddies. We do not sell your data.</p>
            <label style={{ display: 'flex', gap: '12px', cursor: 'pointer', alignItems: 'flex-start' }}>
              <input type="checkbox" style={{ marginTop: '5px' }} onChange={(e) => { if (e.target.checked) setScreen('splash'); }} />
              <span style={{ fontSize: '0.95rem' }}>I consent to the processing of my personality data for matching purposes (GDPR Art. 6).</span>
            </label>
          </div>
        </div>
      </>
    );
  }

  // --- SPLASH ---
  if (screen === 'splash') {
    return (
      <>
        <div className="bg-mesh"><div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div></div>
        <nav className="navbar navbar-solid"><div className="nav-container"><a href="/" className="logo"><i className="fas fa-users"></i><span>HobbyBuddy</span></a></div></nav>
        <div className="gamified-screen" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', textAlign: 'center', padding: '20px', minHeight: '100vh' }}>
          <h1 className="splash-title animate-in">Discover who you really are</h1>
          <p className="splash-subtitle animate-in delay-1">
            <i className="fas fa-stopwatch" style={{ color: 'var(--color-accent-teal)' }}></i> Just 4 minutes &bull;
            <i className="fas fa-list-ol" style={{ color: 'var(--color-accent-violet)' }}></i> 50 questions &bull;
            <i className="fas fa-microscope" style={{ color: 'var(--color-accent-rose)' }}></i> Scientific backend
          </p>
        </div>
      </>
    );
  }

  // --- UNLOCK ---
  if (screen === 'unlock') {
    const unlockedTrait = Math.floor(currentIdx / 10) - 1;
    return (
      <>
        <div className="bg-mesh"><div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div></div>
        <nav className="navbar navbar-solid"><div className="nav-container"><a href="/" className="logo"><i className="fas fa-users"></i><span>HobbyBuddy</span></a></div></nav>
        <div className="gamified-screen" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', padding: '20px', minHeight: '100vh' }}>
          <div style={{ fontSize: '5rem', marginBottom: '20px', animation: 'bounceIn 0.5s ease', color: 'var(--color-accent-violet)' }}>
            <i className={`fas ${TRAIT_ICONS[unlockedTrait] || 'fa-unlock'}`}></i>
          </div>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '16px', textAlign: 'center', fontWeight: 800 }}>🔓 Unlocked: {TRAIT_LABELS[unlockedTrait] || 'Trait'}!</h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: '440px', margin: '0 auto', textAlign: 'center', fontSize: '1.05rem' }}>Our AI is building your personality map...</p>
        </div>
      </>
    );
  }

  // --- QUIZ ---
  if (screen === 'quiz') {
    return (
      <>
        <div className="bg-mesh"><div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div></div>
        <nav className="navbar navbar-solid">
          <div className="nav-container">
            <a href="/" className="logo"><i className="fas fa-users"></i><span>HobbyBuddy</span></a>
            <ul className="nav-menu"><li><span className="quiz-counter">{Math.min(currentIdx + 1, TOTAL)} / {TOTAL}</span></li></ul>
          </div>
        </nav>
        <div className="gamified-screen" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingTop: '70px' }}>
          <div style={{ padding: '0 20px', marginTop: '16px' }}>
            <div className="quiz-top-progress" style={{ position: 'relative', top: 'auto', left: 'auto', right: 'auto' }}>
              <div className="quiz-top-progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-text-light)', margin: '12px 0 0', fontWeight: 500 }}>
            Discovering your personality... {progress}% complete
          </div>
          <div className="quiz-card-container">
            <div className="quiz-card">
              <div className="quiz-card-trait badge" style={{ marginBottom: '20px', fontSize: '0.8rem', padding: '6px 14px' }}>
                Round {Math.floor(currentIdx / 10) + 1}: {TRAIT_LABELS[traitIdx]}
              </div>
              <p className="quiz-card-question">{questionText}</p>
              <div className="quiz-card-options btn-group-horizontal" style={{ display: 'flex', flexDirection: 'row', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '30px' }}>
                {SCALE_LABELS.map((label, i) => (
                  <button key={i} className="btn-quiz-option btn-secondary" onClick={() => handleAnswer(i + 1)} style={{ minWidth: '100px', padding: '12px 16px' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // --- HOBBIES ---
  if (screen === 'hobbies') {
    return (
      <>
        <div className="bg-mesh"><div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div></div>
        <nav className="navbar navbar-solid"><div className="nav-container"><a href="/" className="logo"><i className="fas fa-users"></i><span>HobbyBuddy</span></a></div></nav>
        <div className="gamified-screen" style={{ display: 'block', paddingTop: '80px' }}>
          <div style={{ maxWidth: '680px', margin: '0 auto', padding: '20px 24px' }}>
            <h1 style={{ fontSize: '2.2rem', textAlign: 'center', marginBottom: '10px' }}>What are your hobbies?</h1>
            <p style={{ textAlign: 'center', color: 'var(--color-text-light)', marginBottom: '30px' }}>Select 3 to 5 hobbies to complete your profile.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginBottom: '40px' }}>
              {HOBBIES_LIST.map((hobby) => (
                <button key={hobby} className={selectedHobbies.has(hobby) ? 'btn-primary' : 'btn-secondary'} style={{ margin: '4px', borderRadius: '100px' }} onClick={() => toggleHobby(hobby)}>
                  {hobby}
                </button>
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              <button className="btn-primary btn-large" disabled={selectedHobbies.size < 3} onClick={submitTraits}>
                Continue <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // --- REVEAL ---
  if (screen === 'reveal' && archetype) {
    return (
      <>
        <div className="bg-mesh"><div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div></div>
        <nav className="navbar navbar-solid"><div className="nav-container"><a href="/" className="logo"><i className="fas fa-users"></i><span>HobbyBuddy</span></a></div></nav>
        <div className="gamified-screen" style={{ display: 'block' }}>
          <div style={{ maxWidth: '680px', margin: '0 auto', padding: '80px 24px 60px', width: '100%' }}>
            <h1 style={{ fontSize: '2.2rem', textAlign: 'center', marginBottom: '10px' }} className="gradient-text">Your psychological profile is ready!</h1>
            <p style={{ textAlign: 'center', color: 'var(--color-text-light)', marginBottom: '40px' }}>Here is your digital footprint (IPIP-50 Big Five)</p>

            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <p style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700, color: 'var(--color-accent-violet)', marginBottom: '10px' }}>Your Identity Archetype</p>
              <h2 style={{ fontSize: '3rem', fontWeight: 800, color: '#6366f1', margin: 0 }}>{archetype.emoji} {archetype.name}</h2>
              <p style={{ color: 'var(--color-text-muted)', marginTop: '10px' }}>{archetype.desc}</p>
            </div>

            {traits && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px' }}>
                {Object.entries(traits).map(([key, val]) => (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{key}</span>
                      <span>{val}%</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--color-input-bg)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${val}%`, height: '100%', background: 'var(--gradient-primary)', borderRadius: '4px', transition: 'width 1s ease' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <button className="btn-primary btn-large" style={{ minWidth: '220px' }} onClick={() => navigate('/dashboard')}>
                <i className="fas fa-search"></i> Find your HobbyBuddy!
              </button>
              <button className="btn-primary btn-large" style={{ minWidth: '220px' }} onClick={() => shareVibe(archetype.name)}>
                <i className="fas fa-share-alt"></i> Share Your Vibe
              </button>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' }}>
                <button className="btn-secondary" style={{ padding: '10px 20px', fontSize: '0.9rem' }} onClick={() => shareToWhatsApp(archetype.name)}>
                  <i className="fab fa-whatsapp" style={{ color: '#25D366' }}></i> WhatsApp
                </button>
                <button className="btn-secondary" style={{ padding: '10px 20px', fontSize: '0.9rem' }} onClick={() => shareToTelegram(archetype.name)}>
                  <i className="fab fa-telegram" style={{ color: '#0088cc' }}></i> Telegram
                </button>
                <button className="btn-secondary" style={{ padding: '10px 20px', fontSize: '0.9rem' }} onClick={() => shareToTwitter(archetype.name)}>
                  <i className="fab fa-x-twitter" style={{ color: '#1DA1F2' }}></i> Twitter
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Fallback
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="spinner-border"></div>
    </div>
  );
}
