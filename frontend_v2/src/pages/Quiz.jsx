import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, QUESTIONS, TRAIT_VIBE_LABELS, TRAIT_ICONS, TRAIT_VIBE_CLASSES, SCALE_LABELS, HOBBIES_LIST, HOBBY_CATEGORIES, TOTAL } from '../utils/constants';
import { getArchetype } from '../utils/archetype';
import { showToast } from '../utils/toast';
import { shareVibe, shareToWhatsApp, shareToTelegram, shareToTwitter } from '../utils/share';
import styles from '../styles/quiz.module.css';

export default function Quiz() {
  const { token, authFetch } = useAuth();
  const navigate = useNavigate();
  const [screen, setScreen] = useState('consent');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [traits, setTraits] = useState(null);
  const [selectedHobbies, setSelectedHobbies] = useState(new Set());
  const [progress, setProgress] = useState(0);
  const [consentChecked, setConsentChecked] = useState(false);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
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
    } else if (nextIdx % 4 === 0 && nextIdx < TOTAL) {
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
    if (window.plausible) window.plausible('Quiz Completed');
    setScreen('reveal');
    try {
      const userId = localStorage.getItem('userId');
      const hobbies = Array.from(selectedHobbies).join(',');
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

  // --- CONSENT + SPLASH (combined into one smooth flow) ---
  if (screen === 'consent') {
    return (
      <>
        <div className="bg-mesh"><div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div></div>
        <nav className="navbar navbar-solid"><div className="nav-container"><a href="/" className="logo"><i className="fas fa-users"></i><span>HobbyBuddy</span></a></div></nav>
        <div className={styles.gamifiedScreen}>

          {/* Progress steps */}
          <div className={styles.progressSteps}>
            {['Start quiz', 'Answer 20 Qs', 'Pick hobbies', 'See your vibe'].map((label, i) => (
              <div key={i} className={styles.progressStepItem}>
                <div className={styles.progressStepCircle} style={{
                  background: i === 0 ? 'var(--color-primary)' : 'var(--color-border)',
                  color: i === 0 ? 'white' : 'var(--color-text-muted)',
                }}>
                  {i + 1}
                </div>
                {i < 3 && <div className={styles.progressStepLine} style={{ background: 'var(--color-border)' }} />}
              </div>
            ))}
          </div>

          <div className="auth-icon" style={{ background: 'linear-gradient(135deg, #c2410c, #f43f5e)', marginBottom: '24px' }}><i className="fas fa-sparkles"></i></div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '12px' }}>Discover your vibe</h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--color-text-muted)', marginBottom: '8px', maxWidth: '420px' }}>
            Answer 20 quick questions and we'll reveal your unique vibe archetype — then match you with people who get you.
          </p>
          <p style={{ fontSize: '0.92rem', color: 'var(--color-accent-warm)', fontWeight: 700, marginBottom: '28px' }}>
            ⏱️ Just 2 minutes
          </p>

          <div className={styles.consentBox}>
            <label className={styles.consentLabel}>
              <input
                type="checkbox"
                className={styles.consentCheckbox}
                checked={consentChecked}
                onChange={(e) => {
                  setConsentChecked(e.target.checked);
                  if (e.target.checked) {
                    setTimeout(() => setScreen('quiz'), 400);
                  }
                }}
              />
              <span className={styles.consentText}>I consent to the processing of my answers for matching purposes. Your data is never sold. <Link to="/privacy" className={styles.consentLink}>Read our Privacy Policy</Link>.</span>
            </label>
          </div>

          <button
            className={`btn-primary btn-large ${consentChecked ? '' : styles.startQuizBtnDisabled}`}
            disabled={!consentChecked}
            onClick={() => {
              if (window.plausible) window.plausible('Quiz Started');
              setScreen('quiz');
            }}
            style={{
              minWidth: '220px',
              cursor: consentChecked ? 'pointer' : 'not-allowed',
            }}
          >
            Start the quiz <i className="fas fa-arrow-right" style={{ marginLeft: '8px' }}></i>
          </button>
        </div>
      </>
    );
  }

  // --- UNLOCK ---
  if (screen === 'unlock') {
    const unlockedTrait = Math.floor(currentIdx / 4);
    return (
      <>
        <div className="bg-mesh"><div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div></div>
        <nav className="navbar navbar-solid"><div className="nav-container"><a href="/" className="logo"><i className="fas fa-users"></i><span>HobbyBuddy</span></a></div></nav>
        <div className={styles.gamifiedScreen} style={{ padding: '20px' }}>
          <div className={styles.unlockIcon}>
            <i className={`fas ${TRAIT_ICONS[unlockedTrait] || 'fa-unlock'}`}></i>
          </div>
          <h2 className={styles.unlockTitle}>🔓 Unlocked: {TRAIT_VIBE_LABELS[unlockedTrait] || 'Trait'}!</h2>
          <p className={styles.unlockSubtitle}>Building your vibe profile...</p>
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
        <div className={styles.gamifiedScreenFlexColumn}>
          <div className={styles.quizProgressWrapper}>
            <div className={`quiz-top-progress ${styles.quizTopProgress}`}>
              <div className="quiz-top-progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
          <div style={{ textAlign: 'center', margin: '12px 0 0' }}>
            <div className={styles.progressStepsCompact}>
              {['Start quiz', 'Answer 20 Qs', 'Pick hobbies', 'See your vibe'].map((label, i) => (
                <div key={i} className={styles.progressStepItem}>
                  <div className={styles.progressStepCircleSm} style={{
                    background: i <= 1 ? 'var(--color-primary)' : 'var(--color-border)',
                    color: i <= 1 ? 'white' : 'var(--color-text-muted)',
                  }}>
                    {i < 1 ? '✓' : i + 1}
                  </div>
                  {i < 3 && <div className={styles.progressStepLineSm} style={{ background: i < 1 ? 'var(--color-primary)' : 'var(--color-border)' }} />}
                </div>
              ))}
            </div>
            <span className={styles.progressLabel} style={{ color: 'var(--color-text-light)' }}>
              Finding your vibe... {progress}%
            </span>
          </div>
          <div className="quiz-card-container">
            <div className="quiz-card">
              <div className={`quiz-card-trait ${TRAIT_VIBE_CLASSES[traitIdx] || ''}`} style={{ marginBottom: '20px', fontSize: '0.78rem', padding: '5px 14px' }}>
                Vibe {Math.floor(currentIdx / 4) + 1}/5: {TRAIT_VIBE_LABELS[traitIdx]}
              </div>
              <p className="quiz-card-question">{questionText}</p>
              <div className="quiz-scale">
                <div className="quiz-scale-labels">
                  <span>Strongly disagree</span>
                  <span>Strongly agree</span>
                </div>
                <div className="quiz-scale-options">
                  {SCALE_LABELS.map((label, i) => (
                    <button
                      key={i}
                      className={`quiz-scale-btn${answers[currentIdx] === i + 1 ? ' selected' : ''}`}
                      onClick={() => handleAnswer(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // --- HOBBIES (categorized) ---
  if (screen === 'hobbies') {
    const hobbyCount = selectedHobbies.size;
    const isReady = hobbyCount >= 3;

    return (
      <>
        <div className="bg-mesh"><div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div></div>
        <nav className="navbar navbar-solid"><div className="nav-container"><a href="/" className="logo"><i className="fas fa-users"></i><span>HobbyBuddy</span></a></div></nav>
        <div className={styles.gamifiedScreenBlock}>
          <div className={styles.hobbiesContainer}>
            <h1 className={styles.hobbiesTitle}>What are your hobbies?</h1>
            <p className={styles.hobbiesSubtitle} style={{ color: 'var(--color-text-light)' }}>Pick 3–5 things you love doing.</p>

            {/* Selected count indicator — celebration state */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              {!isReady ? (
                <span className={styles.hobbyCountBadge}>
                  {hobbyCount} of 5 selected — pick {3 - hobbyCount} more
                </span>
              ) : (
                <div className={styles.hobbyCountReady}>
                  <span className={styles.hobbyCountReadyText}>
                    ✓ {hobbyCount} selected — you're ready!
                  </span>
                  {hobbyCount === 5 && (
                    <span className={styles.hobbyCountMax}>Maximum reached</span>
                  )}
                </div>
              )}
            </div>

            {/* Hobby categories */}
            {HOBBY_CATEGORIES.map((cat) => (
              <div key={cat.name} className={styles.hobbyCategory}>
                <h3 className={styles.hobbyCategoryTitle}>{cat.name}</h3>
                <div className={styles.hobbyCategoryOptions}>
                  {cat.hobbies.map((hobby) => (
                    <button key={hobby} className={`${selectedHobbies.has(hobby) ? 'btn-primary' : 'btn-secondary'} ${styles.hobbyChip}`} onClick={() => toggleHobby(hobby)}>
                      {hobby}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className={styles.hobbiesSubmitWrap}>
              <button
                className={`btn-primary btn-large ${isReady ? '' : styles.startQuizBtnDisabled}`}
                disabled={!isReady}
                onClick={submitTraits}
                style={{
                  minWidth: '220px',
                  cursor: isReady ? 'pointer' : 'not-allowed',
                }}
              >
                {isReady ? <>Reveal my vibe <i className="fas fa-sparkles" style={{ marginLeft: 6 }}></i></> : <>Pick at least 3 to continue <i className="fas fa-arrow-down" style={{ marginLeft: 6 }}></i></>}
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
        <div className={styles.gamifiedScreenBlock}>
          <div className={styles.revealContainer}>
            <h1 className={`gradient-text ${styles.revealTitle}`}>Your vibe is ready!</h1>
            <p className={styles.revealSubtitle} style={{ color: 'var(--color-text-light)' }}>Based on your answers, here's who you are.</p>

            <div className={styles.revealArchetype}>
              <p className={styles.revealArchetypeLabel}>Your Vibe Archetype</p>
              <h2 className={styles.revealArchetypeName}>{archetype.emoji} {archetype.name}</h2>
              <p className={styles.revealArchetypeDesc}>{archetype.desc}</p>
            </div>

            {/* What's next context */}
            <div className={styles.nextStepsCard}>
              <p className={styles.nextStepsTitle}>
                Here's what happens next:
              </p>
              <div className={styles.nextStepsList}>
                {[
                  { icon: 'fa-compass', text: 'Browse people near you who match your vibe' },
                  { icon: 'fa-paper-plane', text: 'Send a match request — they\'ll see your archetype' },
                  { icon: 'fa-calendar-days', text: 'Join local events and meetups with your people' },
                ].map((step, i) => (
                  <div key={i} className={styles.nextStepItem}>
                    <div className={styles.nextStepIcon}>
                      <i className={`fas ${step.icon}`}></i>
                    </div>
                    <span className={styles.nextStepText}>{step.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.revealCtaWrap}>
              <button className={`btn-primary btn-large ${styles.revealCtaBtn}`} onClick={() => navigate('/dashboard')}>
                <i className="fas fa-search"></i> Find your people
              </button>
              <button className={`btn-secondary ${styles.revealCtaBtn}`} onClick={() => shareVibe(archetype.name)}>
                <i className="fas fa-share-alt"></i> Share your vibe
              </button>
              <div className={styles.revealShareRow}>
                <button className={`btn-secondary ${styles.revealShareBtn}`} onClick={() => shareToWhatsApp(archetype.name)}>
                  <i className="fab fa-whatsapp" style={{ color: '#25D366' }}></i> WhatsApp
                </button>
                <button className={`btn-secondary ${styles.revealShareBtn}`} onClick={() => shareToTelegram(archetype.name)}>
                  <i className="fab fa-telegram" style={{ color: '#0088cc' }}></i> Telegram
                </button>
                <button className={`btn-secondary ${styles.revealShareBtn}`} onClick={() => shareToTwitter(archetype.name)}>
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
    <div className={styles.fallbackSpinner}>
      <div className="spinner-border"></div>
    </div>
  );
}
