/* Welcome tour — 4 steps for first-time users */
export function WelcomeTour({ onClose }) {
  const steps = [
    { title: 'Complete your profile', desc: 'Add your photo, bio, and hobbies so others can find you.' },
    { title: 'Find friends with similar hobbies', desc: 'Browse events and people who match your personality.' },
    { title: 'Start chatting and making plans', desc: 'Send messages and join events that interest you.' },
    { title: 'Enjoy your new hobby friends!', desc: 'Build real connections with people who share your energy.' },
  ];
  return `
    <div class="welcome-tour" style="position:fixed;inset:0;background:rgba(45,24,16,0.6);display:flex;align-items:center;justify-content:center;z-index:10001;">
      <div style="background:#fff;padding:2.5rem;border-radius:16px;max-width:420px;width:90%;box-shadow:0 20px 60px rgba(194,65,12,0.15);animation:slideUp .4s ease-out;">
        <h2 style="font-size:1.5rem;font-weight:800;color:#c2410c;margin-bottom:1rem;">Welcome to HobbyBuddy!</h2>
        <ol style="padding-left:1.25rem;margin-bottom:1.5rem;line-height:1.7;color:#3a2618;">
          ${steps.map((s,i) => `<li style="margin-bottom:.75rem;"><strong>${i+1}. ${s.title}</strong> — ${s.desc}</li>`).join('')}
        </ol>
        <button onclick="(${onClose?.toString() || '()=>{}'})()" style="padding:.75rem 1.75rem;background:#c2410c;color:#fff;border:none;border-radius:999px;font-weight:600;cursor:pointer;">Got it!</button>
      </div>
    </div>
  `;
}
