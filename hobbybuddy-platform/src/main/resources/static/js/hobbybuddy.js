// ============================
// PWA: SERVICE WORKER REGISTRATION
// ============================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then((reg) => console.log('SW registered, scope:', reg.scope))
        .catch((err) => console.warn('SW registration failed:', err));
}

// ============================
// ENVIRONMENT: API BASE URL
// ============================
const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = IS_LOCAL ? '' : 'https://hobbybuddy-backend.onrender.com';
const WS_BASE_URL  = IS_LOCAL ? '' : 'https://hobbybuddy-backend.onrender.com';

// ============================
// PARTICLE SYSTEM (Canvas)
// ============================
(function initParticles() {
    const canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d');

    let w, h, particles = [];
    const PARTICLE_COUNT = 60;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.radius = Math.random() * 1.5 + 0.5;
            this.opacity = Math.random() * 0.25 + 0.05;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > w) this.vx *= -1;
            if (this.y < 0 || this.y > h) this.vy *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(139, 92, 246, ${this.opacity})`; // Violet 500
            ctx.fill();
        }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
    }

    function connectParticles() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(236, 72, 153, ${0.06 * (1 - dist / 150)})`; // Pink 500
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, w, h);
        particles.forEach(p => { p.update(); p.draw(); });
        connectParticles();
        requestAnimationFrame(animate);
    }

    animate();
})();

// ============================
// TOAST NOTIFICATIONS (UI)
// ============================
function showToast(message, type = 'error') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const icon = type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle';
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================
// GLOBAL FETCH OVERRIDE (JWT + 401 Interceptor)
// ============================
const originalFetch = window.fetch;
let _isRedirectingToLogin = false;
window.fetch = async function(...args) {
    let [resource, config] = args;
    const token = localStorage.getItem('jwt');
    if (token) {
        if (!config) config = {};
        if (!config.headers) config.headers = {};
        config.headers['Authorization'] = 'Bearer ' + token;
    }
    const response = await originalFetch(resource, config);
    
    const url = typeof resource === 'string' ? resource : resource.url || '';

    // Ignore server error statuses
    if (response.status >= 500) return response;
    
    // Ignore external API endpoints
    if (url.includes('google') || url.includes('translate') || !url.includes('/api/')) {
        return response;
    }

    // Intercept expired / invalid token responses only
    if (response.status === 401 || response.status === 403) {
        // ONLY redirect on global level if the explicit session check fails
        if (url.includes('/api/users/me') && !_isRedirectingToLogin) {
            _isRedirectingToLogin = true;
            console.warn("Session check failed (401/403). Redirecting to /login.");
            localStorage.removeItem('jwt');
            localStorage.removeItem('userId');
            localStorage.removeItem('userName');
            localStorage.removeItem('userEmail');
            window.location.href = '/login';
        }
    }
    return response;
};

// ============================
// NAVIGATION
// ============================
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}

document.querySelectorAll('.nav-menu a').forEach(n => n.addEventListener('click', () => {
    if (hamburger) { hamburger.classList.remove('active'); navMenu.classList.remove('active'); }
}));

const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('jwt');
        window.location.href = '/login'; // Redirect to login
    });
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        e.preventDefault();
        const t = document.querySelector(href);
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

if (document.querySelector('.hero')) {
    window.addEventListener('scroll', () => {
        document.querySelector('.navbar').classList.toggle('scrolled', window.scrollY > 80);
    });
}

const floatingCard = document.querySelector('.floating-card');
if (floatingCard) {
    window.addEventListener('scroll', () => {
        floatingCard.style.transform = `translateY(${window.pageYOffset * 0.18}px)`;
    });
}

// Intersection Observer — animate on scroll
const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.feature-card, .step-card, .stat-card, .cta-final').forEach((c, i) => {
    c.style.opacity = '0';
    c.style.transform = 'translateY(25px)';
    c.style.transition = `opacity 0.6s ease ${i * 0.1}s, transform 0.6s ease ${i * 0.1}s`;
    io.observe(c);
});

// ============================
// REGISTER (simple → redirect to /quiz)
// ============================
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-register');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

        const userData = {
            name: document.getElementById('reg-name').value.trim(),
            email: document.getElementById('reg-email').value.trim(),
            password: document.getElementById('reg-password').value.trim()
        };

        if (!userData.name || !userData.email || !userData.password) {
            showToast('Please fill in all fields.', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-arrow-right"></i> Continue';
            return;
        }

        try {
            console.log("Submitting registration...");
            const res = await fetch(API_BASE_URL + '/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Registration failed');
            }
            const data = await res.json();
            console.log("Registration OK:", data);
            
            // Unified keys
            localStorage.setItem('userId', data.id || data.userId || data.id);
            localStorage.setItem('userName', data.name);
            localStorage.setItem('userEmail', data.email || userData.email);
            if (data.token) localStorage.setItem('jwt', data.token);
            
            window.location.href = '/quiz';
        } catch (err) {
            showToast('Error: ' + err.message, 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-arrow-right"></i> Continue';
        }
    });
}

// ============================
// IPIP BIG-FIVE QUIZ — Tinder-style
// ============================
const quizCard = document.getElementById('quiz-card');
if (quizCard) {
    let userId = localStorage.getItem('userId');
    // Verify auth correctly with backend
    fetch(API_BASE_URL + '/api/users/me').then(async res => {
        if (!res.ok) { window.location.href = '/login'; }
        else {
            const data = await res.json();
            userId = data.id;
            localStorage.setItem('userId', data.id);
        }
    }).catch(() => { window.location.href = '/login'; });
    const TRAIT_LABELS = ['Extraversion', 'Agreeableness', 'Conscientiousness', 'Emotional Stability', 'Openness'];
    const TRAIT_ICONS = ['fa-fire', 'fa-handshake', 'fa-tasks', 'fa-leaf', 'fa-lightbulb'];
    const TRAIT_CLASSES = ['extraversion', 'agreeableness', 'conscientiousness', 'neuroticism', 'openness'];
    const TRAIT_API_NAMES = ['extraversion', 'agreeableness', 'conscientiousness', 'neuroticism', 'openness'];
    
    // Scale: 1=Disagree, 2=Slightly Disagree, 3=Neutral, 4=Slightly Agree, 5=Agree
    const SCALE_LABELS = ['Disagree', 'Slightly Disagree', 'Neutral', 'Slightly Agree', 'Agree'];

    const QUESTIONS = [
        // Extraversion
        [0, 'I am the life of the party 🥳', 1],
        [0, 'I don\'t talk a lot 😶', -1],
        [0, 'I feel comfortable around people 🤝', 1],
        [0, 'I keep in the background 👤', -1],
        [0, 'I start conversations 🗣️', 1],
        [0, 'I have little to say 🤐', -1],
        [0, 'I talk to a lot of different people at parties 🎊', 1],
        [0, 'I don\'t like to draw attention to myself 🙈', -1],
        [0, 'I don\'t mind being the center of attention 🌟', 1],
        [0, 'I am quiet around strangers 🤫', -1],
        // Agreeableness
        [1, 'I feel little concern for others 🧊', -1],
        [1, 'I am interested in people 👥', 1],
        [1, 'I insult people 😠', -1],
        [1, 'I sympathize with others\' feelings ❤️', 1],
        [1, 'I am not interested in other people\'s problems 🛑', -1],
        [1, 'I have a soft heart 💖', 1],
        [1, 'I am not really interested in others 🛌', -1],
        [1, 'I take time out for others ⏳', 1],
        [1, 'I feel others\' emotions 🌊', 1],
        [1, 'I make people feel at ease 🍃', 1],
        // Conscientiousness
        [2, 'I am always prepared 🎒', 1],
        [2, 'I leave my belongings around 🌪️', -1],
        [2, 'I pay attention to details 🔎', 1],
        [2, 'I make a mess of things 📉', -1],
        [2, 'I get chores done right away ⚡', 1],
        [2, 'I often forget to put things back 📦', -1],
        [2, 'I like order 📏', 1],
        [2, 'I shirk my duties 🏃‍♂️', -1],
        [2, 'I follow a schedule 📅', 1],
        [2, 'I am exacting in my work 👔', 1],
        // Emotional Stability
        [3, 'I get stressed out easily 😫', -1],
        [3, 'I am relaxed most of the time 🧘', 1],
        [3, 'I worry about things 😟', -1],
        [3, 'I seldom feel blue ☀️', 1],
        [3, 'I am easily disturbed 🌪️', -1],
        [3, 'I get upset easily 💢', -1],
        [3, 'I change my mood a lot 🎭', -1],
        [3, 'I have frequent mood swings 🎢', -1],
        [3, 'I get irritated easily 😠', -1],
        [3, 'I often feel blue 🌧️', -1],
        // Openness
        [4, 'I have a rich vocabulary 📚', 1],
        [4, 'I have difficulty understanding abstract ideas 🧩', -1],
        [4, 'I have a vivid imagination 🌈', 1],
        [4, 'I am not interested in abstract ideas 📐', -1],
        [4, 'I have excellent ideas 💡', 1],
        [4, 'I do not have a good imagination 🧱', -1],
        [4, 'I am quick to understand things 🧠', 1],
        [4, 'I use difficult words 🧐', 1],
        [4, 'I spend time reflecting on things 💭', 1],
        [4, 'I am full of ideas 🚀', 1]
    ];

    const TOTAL = QUESTIONS.length;
    let currentIdx = 0;
    
    // Load answers from localStorage or create new array
    let savedAnswers = localStorage.getItem('hobbybuddy_answers');
    const answers = savedAnswers ? JSON.parse(savedAnswers) : new Array(TOTAL).fill(null);

    // Find the first unanswered question
    for (let i = 0; i < TOTAL; i++) {
        if (answers[i] === null) {
            currentIdx = i;
            break;
        }
    }
    // If all answered
    if (currentIdx === 0 && answers[TOTAL-1] !== null) {
        currentIdx = TOTAL; 
    }

    const screenSplash = document.getElementById('screen-splash');
    const screenQuiz = document.getElementById('screen-quiz');
    const screenUnlock = document.getElementById('screen-unlock');
    const screenReveal = document.getElementById('screen-reveal');

    const cardTrait = document.getElementById('quiz-card-trait');
    const cardQuestion = document.getElementById('quiz-card-question');
    const cardOptions = document.getElementById('quiz-card-options');
    const topFill = document.getElementById('quiz-top-fill');
    const narrativeProgress = document.getElementById('quiz-narrative-progress');

    // Start flow
    if (screenSplash) {
        setTimeout(() => {
            screenSplash.style.display = 'none';
            screenSplash.classList.remove('active');
            
            if (currentIdx >= TOTAL) {
                // Already finished
                submitTraits();
            } else {
                screenQuiz.style.display = 'block';
                screenQuiz.classList.add('active');
                renderQuestion(currentIdx, null);
            }
        }, 2000);
    }

    function renderQuestion(idx, direction) {
        currentIdx = idx;
        const quizCard = document.getElementById('quiz-card');
        
        if (direction) {
            quizCard.classList.add(direction === 'next' ? 'exit-left' : 'exit-right');
            setTimeout(() => {
                quizCard.classList.remove('exit-left', 'exit-right');
                buildCardContent(idx);
                quizCard.classList.add('enter');
                setTimeout(() => quizCard.classList.remove('enter'), 350);
            }, 200);
        } else {
            buildCardContent(idx);
        }
    }

    function buildCardContent(idx) {
        if (idx >= TOTAL) return;
        const q = QUESTIONS[idx];
        const traitIdx = q[0];
        const roundNum = traitIdx + 1;

        cardTrait.innerHTML = `<i class="fas ${TRAIT_ICONS[traitIdx]}"></i> Question ${idx + 1} of 50 &bull; Round ${roundNum}: ${TRAIT_LABELS[traitIdx]}`;
        cardTrait.className = 'quiz-card-trait badge ' + TRAIT_CLASSES[traitIdx];
        cardQuestion.textContent = q[1];

        cardOptions.innerHTML = '';
        
        for (let v = 1; v <= 5; v++) {
            const btn = document.createElement('button');
            btn.className = 'btn-quiz-option' + (answers[idx] === v ? ' selected' : '');
            btn.innerHTML = `<span style="font-weight:bold; font-size:1.2rem; margin-right:8px;">${v}</span> ${SCALE_LABELS[v-1]}`;
            
            btn.addEventListener('click', () => {
                // Ignore clicks if already animating
                if (btn.classList.contains('selected')) return;
                
                answers[idx] = v;
                localStorage.setItem('hobbybuddy_answers', JSON.stringify(answers));
                
                cardOptions.querySelectorAll('.btn-quiz-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                updateUI();
                
                // Auto-advance
                setTimeout(() => {
                    if (idx % 10 === 9 && idx < TOTAL - 1) {
                        showUnlockScreen(traitIdx);
                    } else if (idx < TOTAL - 1) {
                        renderQuestion(idx + 1, 'next');
                    } else {
                        submitTraits();
                    }
                }, 300);
            });
            cardOptions.appendChild(btn);
        }

        updateUI();
    }

    function showUnlockScreen(traitIdx) {
        screenQuiz.style.display = 'none';
        screenUnlock.style.display = 'flex';
        
        document.getElementById('unlock-icon').innerHTML = `<i class="fas ${TRAIT_ICONS[traitIdx]}"></i>`;
        document.getElementById('unlock-title').textContent = `🔓 Hai sbloccato: ${TRAIT_LABELS[traitIdx]}!`;
        
        setTimeout(() => {
            screenUnlock.style.display = 'none';
            screenQuiz.style.display = 'block';
            renderQuestion(currentIdx + 1, 'next');
        }, 1500);
    }

    function updateUI() {
        let completed = answers.filter(a => a !== null).length;
        const navCounter = document.getElementById('nav-counter');
        if (navCounter) navCounter.textContent = `${completed}/50`;
        if (topFill) topFill.style.width = `${(completed / 50) * 100}%`;
        if (narrativeProgress) narrativeProgress.textContent = `Round ${Math.floor(completed / 10) + 1} - ${Math.round((completed / 50) * 100)}%`;
    }

    async function submitTraits() {
        screenQuiz.style.display = 'none';
        screenUnlock.style.display = 'flex'; // repurpose unlock screen temporarily as loader
        document.getElementById('unlock-icon').innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
        document.getElementById('unlock-title').textContent = `Analizzando il profilo...`;
        
        const traitSums = [0, 0, 0, 0, 0];
        for (let i = 0; i < TOTAL; i++) {
            const traitIdx = QUESTIONS[i][0];
            const sign = QUESTIONS[i][2];
            const rawVal = answers[i] || 3;
            traitSums[traitIdx] += sign === 1 ? rawVal : (6 - rawVal);
        }

        const traits = {};
        for (let t = 0; t < 5; t++) {
            // max score per trait is 50 (10 questions * 5). Min is 10.
            // (score - min) / (max - min) * 100
            traits[TRAIT_API_NAMES[t]] = Math.round(((traitSums[t] - 10) / 40) * 100);
        }

        try {
            await fetch(API_BASE_URL + `/api/users/${userId}/traits`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(traits)
            });
            localStorage.removeItem('hobbybuddy_answers'); // clear after success
            setTimeout(() => {
                screenUnlock.style.display = 'none';
                showFinalReveal(traits);
            }, 1000);
        } catch (err) {
            showToast('Error saving traits: ' + err.message, 'error');
        }
    }

    function showFinalReveal(traits) {
        screenReveal.style.display = 'block';
        screenReveal.classList.add('active');
        const container = document.getElementById('reveal-traits-container');
        container.innerHTML = '';
        
        for (let t = 0; t < 5; t++) {
            const score = traits[TRAIT_API_NAMES[t]];
            const barHTML = `
                <div style="margin-bottom: 20px; text-align:left; opacity:0; animation: fadeIn 0.5s ease forwards ${t * 0.2}s;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-weight:600; font-size:1.1rem; color:var(--color-text);">
                        <span><i class="fas ${TRAIT_ICONS[t]}" style="width:25px; color:var(--color-accent-violet);"></i> ${TRAIT_LABELS[t]}</span>
                        <span style="font-weight:800;" class="gradient-text">${score}%</span>
                    </div>
                    <div style="height:12px; background:var(--color-input-bg); border-radius:6px; overflow:hidden;">
                        <div style="height:100%; width:${score}%; background:var(--gradient-primary); border-radius:6px; box-shadow:var(--shadow-glow); animation: slideRight 1s ease-out forwards ${t * 0.2}s;"></div>
                    </div>
                </div>
            `;
            container.innerHTML += barHTML;
        }

        const btn = document.getElementById('btn-to-dashboard');
        btn.style.opacity = '0';
        btn.style.animation = `fadeIn 1s ease forwards 1.5s`;
        btn.addEventListener('click', () => {
            window.location.href = '/dashboard';
        });

        // --- VIRAL: Share Your Vibe button ---
        const shareVibeBtn = document.getElementById('btn-share-vibe');
        if (shareVibeBtn) {
            shareVibeBtn.style.opacity = '0';
            shareVibeBtn.style.animation = `fadeIn 1s ease forwards 2s`;
            shareVibeBtn.addEventListener('click', async () => {
                // Find the user's dominant trait
                let maxTrait = 'Openness';
                let maxScore = 0;
                for (let t = 0; t < 5; t++) {
                    const score = traits[TRAIT_API_NAMES[t]];
                    if (score > maxScore) { maxScore = score; maxTrait = TRAIT_LABELS[t]; }
                }
                const shareText = `Ho appena scoperto di avere un'aura di ${maxTrait} al ${maxScore}% su HobbyBuddy! \uD83C\uDF1F Fai il quiz e scopri la tua personalità:`;
                const shareData = {
                    title: 'Il mio Vibe su HobbyBuddy',
                    text: shareText,
                    url: window.location.origin + '/register'
                };
                if (navigator.share) {
                    try { await navigator.share(shareData); showToast('Vibe condiviso!', 'success'); }
                    catch(e) { /* user cancelled */ }
                } else {
                    try {
                        await navigator.clipboard.writeText(shareText + ' ' + shareData.url);
                        showToast('Testo copiato negli appunti!', 'success');
                    } catch(e) {
                        showToast('Non è stato possibile copiare il link.', 'error');
                    }
                }
            });
        }
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (screenQuiz && screenQuiz.style.display !== 'none') {
            if (e.key >= '1' && e.key <= '5') {
                const v = parseInt(e.key);
                const buttons = cardOptions.querySelectorAll('.btn-quiz-option');
                if (buttons && buttons[v-1]) {
                    buttons[v-1].click();
                }
            }
        }
    });

}


// ============================
// LOGIN (AJAX Handler for JWT Storage)
// ============================
const loginForm = document.getElementById('login-form');
if (loginForm) {
    console.log("Login form detected. Attaching AJAX handler.");
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Login form submit intercepted.");
        
        const errorDiv = document.getElementById('login-error');
        if (errorDiv) errorDiv.style.display = 'none';
        
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        
        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value.trim() : '';
        
        if (!email || !password) { 
            showToast('Please fill in all fields.', 'error');
            return; 
        }

        const btn = loginForm.querySelector('.btn-form-primary');
        const originalBtnHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

        try {
            console.log("Sending AJAX POST to /api/users/login for: " + email);
            const res = await fetch(API_BASE_URL + `/api/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (res.status === 401) {
                console.warn("Login failed: 401 Unauthorized");
                showToast('Invalid email or password.', 'error');
            } else if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Login failed');
            } else {
                const data = await res.json();
                console.log("Login success! Captured Data:", data);
                
                // Store unified keys
                localStorage.setItem('jwt', data.token);
                localStorage.setItem('userId', data.userId || data.id);
                localStorage.setItem('userName', data.name);
                localStorage.setItem('userEmail', data.email);
                
                showToast('Welcome back, ' + data.name + '!', 'success');
                setTimeout(() => { 
                    console.log("Redirecting to /dashboard");
                    window.location.href = '/dashboard'; 
                }, 800);
                return;
            }
        } catch (err) {
            console.error("AJAX Login error:", err);
            showToast('Error: ' + err.message, 'error');
        }
        btn.disabled = false;
        btn.innerHTML = originalBtnHtml;
    });
}

// ============================
// DASHBOARD
// ============================
// ============================
// DASHBOARD & SOCIAL FEED
// ============================
const btnFindBuddy = document.getElementById('btn-find-buddy');
if (btnFindBuddy) {
    let userId = localStorage.getItem('userId');
    let userName = localStorage.getItem('userName');
    
    // Auth Validation Check
    fetch(API_BASE_URL + '/api/users/me').then(async res => {
        if (!res.ok) {
            window.location.href = '/login';
        } else {
            const data = await res.json();
            userId = data.id;
            userName = data.name;
            localStorage.setItem('userId', data.id);
            localStorage.setItem('userName', data.name);
            localStorage.setItem('userEmail', data.email);
            
            const userNameEl = document.getElementById('user-name');
            if (userNameEl) userNameEl.textContent = userName;
        }
    }).catch(() => {
        window.location.href = '/login';
    });

    const userNameEl = document.getElementById('user-name');
    if (userNameEl && userName && userName !== 'undefined') userNameEl.textContent = userName;

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('userId');
            localStorage.removeItem('userName');
            window.location.href = '/';
        });
    }

    // --- TAB SWITCHING LOGIC ---
    const navHome = document.getElementById('btn-nav-home');
    const navDiscover = document.getElementById('btn-nav-discover');
    const navMessages = document.getElementById('btn-nav-messages');
    const navEvents = document.getElementById('btn-nav-events');
    const viewHome = document.getElementById('view-home');
    const viewDiscover = document.getElementById('view-discover');
    const viewMessages = document.getElementById('view-messages');
    const viewEvents = document.getElementById('view-events');

    function switchTab(activeNav, activeView) {
        // Reset Nav
        [navHome, navDiscover, navMessages, navEvents].forEach(n => {
            if(n) n.classList.remove('active');
        });
        // Reset Views
        [viewHome, viewDiscover, viewMessages, viewEvents].forEach(v => {
            if(v) v.style.display = 'none';
        });
        
        if (activeNav) activeNav.classList.add('active');
        if (activeView) activeView.style.display = 'block';
    }

    if (navHome) navHome.addEventListener('click', () => switchTab(navHome, viewHome));
    if (navMessages) navMessages.addEventListener('click', () => switchTab(navMessages, viewMessages));
    if (navEvents) navEvents.addEventListener('click', () => switchTab(navEvents, viewEvents));

    let discoverQueue = [];
    let discoverIndex = 0;
    let isSwipeAnimating = false; // Debounce flag to prevent spam clicks/swipes

    if (navDiscover) {
        navDiscover.addEventListener('click', async () => {
            switchTab(navDiscover, viewDiscover);
            const grid = document.getElementById('discover-grid');
            if (!grid) return;
            
            grid.innerHTML = `
                <div style="grid-column: 1/-1; display:flex; justify-content:center;">
                    <div class="skeleton-card">
                        <div class="skeleton skeleton-img"></div>
                        <div class="skeleton skeleton-text" style="margin-top:25px;"></div>
                        <div class="skeleton skeleton-text short"></div>
                        <div style="display:flex; gap:20px; padding: 0 35px;">
                            <div class="skeleton skeleton-text" style="height:60px; flex:1; border-radius:16px;"></div>
                            <div class="skeleton skeleton-text" style="height:60px; flex:2; border-radius:16px;"></div>
                        </div>
                    </div>
                </div>
            `;
            
            let answers = JSON.parse(localStorage.getItem('hobbybuddy_answers') || '[]');
            let completeCount = answers.filter(a => a !== null).length;
            if (completeCount < 50) {
                grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding: 60px 20px;">
                    <i class="fas fa-clipboard-list" style="font-size:4rem;color:var(--color-input-border);margin-bottom:20px;"></i>
                    <h2 style="font-size: 2rem; margin-bottom: 10px;">Profilo incompleto</h2>
                    <p style="color: var(--color-text-muted); margin-bottom:20px;">Rispondi a tutte le 50 domande per sbloccare i match AI.</p>
                    <a href="/quiz" class="btn-primary" style="padding:12px 24px; text-decoration:none; border-radius:50px;"><i class="fas fa-play"></i> Completa Quiz</a>
                </div>`;
                return;
            }
            
            try {
                const res = await fetch(API_BASE_URL + `/api/users/${userId}/find-buddy`);
                if (!res.ok) throw new Error('Failed to load matches');
                let others = await res.json();
                
                if (others.length === 0) {
                    grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 60px 20px;"><i class="fas fa-ghost" style="font-size:4rem;color:var(--color-input-border);margin-bottom:20px;"></i><h2 style="font-size: 2rem; margin-bottom: 10px;">Nessun match trovato</h2><p style="color: var(--color-text-muted); margin-bottom: 20px;">Aggiorna la pagina o riprova.</p><button id="btn-refresh-match" class="btn-primary" style="padding:12px 24px; border-radius:50px;"><i class="fas fa-sync"></i> Refresh AI Match</button></div>';
                    setTimeout(() => {
                        const btnRefresh = document.getElementById('btn-refresh-match');
                        if (btnRefresh) btnRefresh.addEventListener('click', () => navDiscover.click());
                    }, 100);
                    return;
                }
                
                // Use the score returned by the AI Engine 
                others = others.map(u => ({
                    ...u,
                    vibeScore: (u.matchVibeScore && u.matchVibeScore.length > 0) ? Math.round(u.matchVibeScore[0]) : 85
                }));
                
                discoverQueue = others;
                discoverIndex = 0;
                
                renderDiscoverCandidate(grid);
                
            } catch (err) {
                grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color: var(--color-error);">${err.message}</div>`;
            }
        });

        // AUTO-ENTER THE SOCIAL EXPERIENCES:
        // Automatically click discover when entering dashboard so it's instantly engaging
        setTimeout(() => navDiscover.click(), 100);
    }

    function renderDiscoverCandidate(container) {
        isSwipeAnimating = false; // Reset the lock so user can interact with the new card

        if (discoverIndex >= discoverQueue.length) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding: 60px 20px; animation: fadeIn 0.8s ease;">
                    <div style="width:110px;height:110px;margin:0 auto 25px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#ec4899);display:flex;justify-content:center;align-items:center;box-shadow:0 0 40px rgba(168,85,247,0.3);">
                        <i class="fas fa-user-plus" style="font-size:3rem;color:white;"></i>
                    </div>
                    <h2 style="font-size: 2.5rem; margin-bottom: 15px; font-weight: 800; letter-spacing:-0.03em;">Hai esplorato tutti i Buddy!</h2>
                    <p style="color: var(--color-text-muted); font-size:1.1rem; max-width: 450px; margin:0 auto 30px;">Non ci sono altri match per ora. Invita i tuoi amici a fare il test della personalità per scoprire nuove connessioni!</p>
                    <button id="btn-invite-friends" class="btn-primary" style="padding:16px 36px; font-size:1.15rem; background:var(--gradient-primary); border:none; border-radius:var(--radius-full); color:white; cursor:pointer; box-shadow:var(--shadow-glow); display:inline-flex; align-items:center; gap:12px; font-weight:700;">
                        <i class="fas fa-share-alt"></i> Invita Amici
                    </button>
                    <p id="invite-fallback" style="display:none; margin-top:20px; font-size:0.9rem; color:var(--color-text-muted);"></p>
                </div>
            `;
            // Wire up invite button with native share or fallback
            const inviteBtn = document.getElementById('btn-invite-friends');
            if (inviteBtn) {
                inviteBtn.addEventListener('click', async () => {
                    const shareData = {
                        title: 'HobbyBuddy — Trova il tuo Buddy ideale',
                        text: 'Ho appena completato il mio test della personalità su HobbyBuddy! Scopri anche tu con chi matchi in base ai tuoi hobby e alla tua personalità \uD83D\uDE80',
                        url: window.location.origin
                    };
                    if (navigator.share) {
                        try { await navigator.share(shareData); showToast('Link condiviso!', 'success'); }
                        catch(e) { /* user cancelled, nothing to do */ }
                    } else {
                        // Desktop fallback: copy link to clipboard
                        try {
                            await navigator.clipboard.writeText(shareData.text + ' ' + shareData.url);
                            showToast('Link copiato negli appunti!', 'success');
                        } catch(e) {
                            const fb = document.getElementById('invite-fallback');
                            if(fb) { fb.style.display = 'block'; fb.textContent = 'Condividi questo link: ' + shareData.url; }
                        }
                    }
                });
            }
            return;
        }

        const u = discoverQueue[discoverIndex];
        const matchLabel = getMatchLabel(u.vibeScore);
        
        container.innerHTML = `
            <div style="grid-column: 1/-1; display:flex; justify-content:center; padding: 10px 0; animation: scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                <div class="floating-card match-candidate-card" style="width: 100%; max-width: 480px; overflow: hidden; padding: 0; border: none; background: white;">
                    <div style="height: 350px; background: var(--gradient-secondary); display:flex; justify-content:center; align-items:center; color:white; font-size: 7rem; position:relative;">
                        <i class="fas fa-user"></i>
                        <div style="position: absolute; bottom: -20px; left: 0; width: 100%; height: 80px; background: linear-gradient(to top, white, transparent);"></div>
                    </div>

                    <div style="padding: 20px 35px 35px 35px; background: white; text-align:center;">
                        <h2 style="font-size: 2.8rem; font-weight: 800; margin-bottom: 5px; letter-spacing: -0.04em;">${u.name}</h2>
                        <p style="font-size: 1.15rem; color: var(--color-accent-violet); font-weight: 700; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 1px;"><i class="fas fa-fire"></i> ${matchLabel}</p>
                        
                        <div style="margin-bottom: 35px;">
                            <div class="tags" style="display:flex; flex-wrap:wrap; gap: 10px; justify-content:center;">
                                <span class="tag" style="background:var(--color-bg); padding:10px 18px; border-radius:20px; font-weight:700; color:var(--color-text-main);"><i class="fas fa-camera" style="margin-right:6px; opacity:0.6;"></i> Photography</span>
                                <span class="tag" style="background:var(--color-bg); padding:10px 18px; border-radius:20px; font-weight:700; color:var(--color-text-main);"><i class="fas fa-mountain" style="margin-right:6px; opacity:0.6;"></i> Hiking</span>
                            </div>
                        </div>

                        <div style="display:flex; gap: 20px; margin-top: 10px;">
                            <button id="btn-discover-pass" class="btn-outline" style="flex: 1; padding: 18px; font-size: 1.3rem; border-color: #e2e8f0; color: #94a3b8; border-width: 2px; border-radius: 16px;">
                                <i class="fas fa-times" style="font-size:1.5rem;"></i>
                            </button>
                            <button id="btn-discover-connect" class="btn-primary" style="flex: 2; padding: 18px; font-size: 1.3rem; background: var(--gradient-primary); box-shadow: var(--shadow-glow); border-radius: 16px;">
                                Connect <i class="fas fa-comment-dots" style="margin-left:8px;"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Gesture / Swipe Math
        const card = container.querySelector('.match-candidate-card');
        const passBtn = document.getElementById('btn-discover-pass');
        const connectBtn = document.getElementById('btn-discover-connect');

        let isDragging = false;
        let startX = 0;
        let currentX = 0;

        const handleDragStart = (e) => {
            if (isSwipeAnimating) return; // Block drags during animation
            isDragging = true;
            card.classList.add('moving');
            startX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        };

        const handleDragMove = (e) => {
            if (!isDragging) return;
            const x = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
            currentX = x - startX;
            const rotate = currentX * 0.05;
            card.style.transform = `translateX(${currentX}px) rotate(${rotate}deg)`;
        };

        const handleDragEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            card.classList.remove('moving');
            
            if (currentX > 100) { connectBtn.click(); } 
            else if (currentX < -100) { passBtn.click(); } 
            else { card.style.transform = 'translate(0) rotate(0)'; }
            currentX = 0;
        };

        card.addEventListener('mousedown', handleDragStart);
        card.addEventListener('touchstart', handleDragStart, {passive: true});
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('touchmove', handleDragMove, {passive: true});
        document.addEventListener('mouseup', handleDragEnd);
        document.addEventListener('touchend', handleDragEnd);

        passBtn.addEventListener('click', () => {
            if (isSwipeAnimating) return; // DEBOUNCE: block rapid clicks
            isSwipeAnimating = true;
            card.style.transform = 'translate(-150%) rotate(-15deg)';
            card.style.opacity = '0';
            setTimeout(() => { discoverIndex++; renderDiscoverCandidate(container); }, 350);
        });

        connectBtn.addEventListener('click', () => {
            if (isSwipeAnimating) return; // DEBOUNCE: block rapid clicks
            isSwipeAnimating = true;
            card.style.transform = 'translate(150%) rotate(15deg)';
            card.style.opacity = '0';
            setTimeout(() => { openIcebreakerModal(u); }, 350);
        });
    }

    // ============================
    // VIBE LOCK & ICEBREAKERS
    // ============================
    const ibModal = document.getElementById('icebreaker-modal');
    const btnCloseIb = document.getElementById('btn-close-ib');
    const btnSendIb = document.getElementById('btn-send-ib');
    let currentIbTarget = null;
    
    // Simple prompt generator
    const HOBBY_PROMPTS = {
        'Photography': "What's your favorite lens to shoot with on a weekend?",
        'Hiking': "Which mountain trail is at the top of your bucket list?",
        'Coffee': "Espresso, Chemex, or Cold Brew? What's your daily ritual?",
        'Board Games': "What's the one tabletop game you always win?",
        'Tech Startups': "What's an emerging technology you can't stop reading about?"
    };

    function openIcebreakerModal(user) {
        currentIbTarget = user;
        document.getElementById('ib-partner-name').textContent = user.name;
        
        // Pick a random hobby for the prompt
        const hobbies = ['Photography', 'Hiking', 'Coffee', 'Board Games', 'Tech Startups'];
        const sharedHobby = hobbies[Math.floor(Math.random() * hobbies.length)];
        
        document.getElementById('ib-hobby-tag').textContent = sharedHobby;
        document.getElementById('ib-prompt').textContent = `"${HOBBY_PROMPTS[sharedHobby]}"`;
        document.getElementById('ib-answer').value = '';
        
        ibModal.classList.add('open');
    }

    if (btnCloseIb) {
        btnCloseIb.addEventListener('click', () => {
            ibModal.classList.remove('open');
        });
    }

    if (btnSendIb) {
        btnSendIb.addEventListener('click', () => {
            const val = document.getElementById('ib-answer').value.trim();
            if (!val) {
                showToast("You must answer the prompt to send a Vibe Check!", "error");
                return;
            }
            
            btnSendIb.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Locking Vibe...';
            btnSendIb.disabled = true;
            
            setTimeout(async () => {
                ibModal.classList.remove('open');
                btnSendIb.innerHTML = '<i class="fas fa-paper-plane"></i> Send Vibe Check';
                btnSendIb.disabled = false;
                
                // Real DB save
                try {
                    await fetch(API_BASE_URL + '/api/messages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            senderId: userId,
                            receiverId: currentIbTarget.id,
                            content: "(Icebreaker): " + val
                        })
                    });
                    showToast(`Vibe Check sent to ${currentIbTarget.name}!`, 'success');
                } catch(err) {
                    showToast("Message send failed", "error");
                }
                
                // Advance discover queue
                discoverIndex++;
                const container = document.getElementById('discover-grid');
                if (container) renderDiscoverCandidate(container);
                
                // Add a mock incoming request to Messages tab to demonstrate the receiver experience
                addMockIncomingRequest();
            }, 800);
        });
    }

    function addMockIncomingRequest() {
        const pendingContainer = document.getElementById('pending-requests-container');
        if (!pendingContainer) return;

        // Give it a fresh realistic card
        pendingContainer.innerHTML = `
            <div class="post-card" style="border-left: 5px solid var(--color-accent-rose); animation: slideUpFade 0.5s ease forwards;">
                <div class="post-header" style="justify-content: space-between; border-bottom: 1px solid var(--color-input-bg); padding-bottom: 10px; margin-bottom: 15px;">
                    <div class="post-meta">
                        <h4>Sara M. <span class="badge" style="background: var(--gradient-primary); color: white; border: none; font-size: 0.7rem; padding: 3px 8px;">Top Match</span></h4>
                        <span>Sent a Vibe Check 5 mins ago</span>
                    </div>
                </div>
                
                <div style="background: var(--color-input-bg); border-radius: 12px; padding: 15px; border-left: 4px solid var(--color-accent-violet); margin-bottom: 15px;">
                    <span class="badge" style="margin-bottom: 8px;">Hiking</span>
                    <p style="font-weight: 600; font-size: 0.95rem; color: var(--color-text-main); margin-bottom: 8px;">"Which mountain trail is at the top of your bucket list?"</p>
                    <p style="color: var(--color-accent-violet); font-style: italic;">Sara's Answer: "Definitely the Tour du Mont Blanc! I've been training all spring for the elevation gains."</p>
                </div>
                
                <div style="display:flex; gap: 10px;">
                    <button class="btn-outline" style="flex: 1; padding: 8px;" onclick="this.parentElement.parentElement.remove()"><i class="fas fa-times"></i> Pass</button>
                    <button class="btn-primary" style="flex: 2; padding: 8px;" onclick="approveIcebreaker(this)"><i class="fas fa-heart"></i> Vibe Back & Chat</button>
                </div>
            </div>
        `;
    }

    window.approveIcebreaker = function(btnElem) {
        btnElem.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Unlocking...';
        setTimeout(() => {
            const card = btnElem.parentElement.parentElement;
            card.remove();
            
            // Add to active chats
            const activeContainer = document.getElementById('active-chats-container');
            activeContainer.innerHTML = `
                <div class="post-card" style="display:flex; align-items:center; cursor:pointer; transition: all 0.2s; border: 2px solid transparent;" onmouseover="this.style.borderColor='var(--color-accent-violet)'" onmouseout="this.style.borderColor='transparent'" onclick="openChat('mock1', 'Sara M.')">
                    <div class="match-avatar-social" style="background: var(--gradient-primary); color: white; margin-right: 15px;"><i class="fas fa-user"></i></div>
                    <div style="flex: 1;">
                        <h4 style="margin-bottom:2px;">Sara M.</h4>
                        <p style="font-size:0.85rem; color:var(--color-text-muted);">Vibe Check passed! Say hi 👋</p>
                    </div>
                    <div style="width: 12px; height: 12px; background: var(--color-accent-rose); border-radius: 50%;"></div>
                </div>
            `;
            
            // Auto open the chat!
            openChat('mock1', 'Sara M.');
        }, 600);
    };
    
    // ============================
    // EVENTS LOGIC
    // ============================
    const btnLoadEvents = document.getElementById('btn-load-events');
    if (btnLoadEvents) {
        btnLoadEvents.addEventListener('click', () => {
            const feed = document.getElementById('events-feed-container');
            const spinner = document.getElementById('events-spinner');
            
            feed.style.display = 'none';
            spinner.style.display = 'block';
            
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    try {
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;
                        // Reverse Geocode using Nominatim API (OpenStreetMap)
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                        const data = await res.json();
                        const city = data.address.city || data.address.town || data.address.village || data.address.county || "Your Area";
                        renderLocalEvents(city);
                    } catch(e) {
                        renderLocalEvents("Your Area");
                    }
                }, () => renderLocalEvents("Your Area"));
            } else {
                renderLocalEvents("Your Area");
            }
        });
    }

    function renderLocalEvents(city) {
        const feed = document.getElementById('events-feed-container');
        document.getElementById('events-spinner').style.display = 'none';
        feed.style.display = 'block';
        
        feed.innerHTML = `
            <div style="margin-bottom: 25px; padding: 10px 20px; background: rgba(139, 92, 246, 0.1); border-radius: 12px; font-weight: 700; color: var(--color-accent-violet); display: inline-block;">
                <i class="fas fa-map-pin"></i> Showing live events near: <span style="text-transform: capitalize;">${city}</span>
            </div>
            
            <div class="post-card" style="border-left: 5px solid var(--color-accent-violet); animation: slideUpFade 0.5s ease forwards;">
                <div class="post-header" style="justify-content: space-between;">
                    <div class="post-meta">
                        <h4>Urban Photography Walk</h4>
                        <span>Organized by Elena G.</span>
                    </div>
                    <div class="badge">Tomorrow, 06:30 AM</div>
                </div>
                <div class="post-content">Meet at the main square fountain in ${city} to catch the sunrise around the historical center. Bring your favorite prime lens!</div>
                <button class="btn-outline" style="padding: 6px 16px; font-size: 0.85rem;"><i class="fas fa-check"></i> I'm going</button>
            </div>
            
            <div class="post-card" style="border-left: 5px solid var(--color-accent-teal); animation: slideUpFade 0.5s ease forwards; animation-delay: 0.2s; opacity: 0;">
                <div class="post-header" style="justify-content: space-between;">
                    <div class="post-meta">
                        <h4>Weekend Trail Run (15k)</h4>
                        <span>Organized by Marco R.</span>
                    </div>
                    <div class="badge success">Sunday, 08:00 AM</div>
                </div>
                <div class="post-content">Medium difficulty trail just outside ${city}. We will keep a steady pace of ~6:00/km. Coffee afterwards!</div>
                <button class="btn-outline" style="padding: 6px 16px; font-size: 0.85rem;"><i class="fas fa-check"></i> I'm going</button>
            </div>
            
            <div class="post-card" style="border-left: 5px solid var(--color-accent-rose); animation: slideUpFade 0.5s ease forwards; animation-delay: 0.4s; opacity: 0;">
                <div class="post-header" style="justify-content: space-between;">
                    <div class="post-meta">
                        <h4>Indie Game Dev Meetup</h4>
                        <span>Organized by Tech ${city}</span>
                    </div>
                    <div class="badge" style="background:#fef3c7; color:#d97706;">Next Friday, 19:00</div>
                </div>
                <div class="post-content">Showcasing early builds and drinking beer. Open to developers, artists, and gamers in ${city}!</div>
                <button class="btn-outline" style="padding: 6px 16px; font-size: 0.85rem;"><i class="fas fa-check"></i> I'm going</button>
            </div>
        `;
    }

    function getMatchLabel(score) {
        if (score >= 90) return "Soulmate";
        if (score >= 80) return "Perfect Match";
        if (score >= 70) return "Great Buddy";
        if (score >= 60) return "Good Potential";
        return "New Friend";
    }

    window.openChat = function(partnerId, partnerName) {
        const modal = document.getElementById('chat-modal');
        document.getElementById('chat-partner-name').textContent = partnerName;
        currentChatPartnerId = partnerId;
        modal.classList.add('open');
        connectWebSocket();
        fetchMessages();
    };

    const btnCloseChat = document.getElementById('btn-close-chat');
    if (btnCloseChat) {
        btnCloseChat.addEventListener('click', () => {
            document.getElementById('chat-modal').classList.remove('open');
            currentChatPartnerId = null;
        });
    }

    btnFindBuddy.addEventListener('click', async () => {
        const matchesContainer = document.getElementById('matches-container');
        const errorEl = document.getElementById('dashboard-error');
        errorEl.style.display = 'none';
        
        matchesContainer.innerHTML = `
            <div class="match-card-social" style="width: 100%; border-style: dashed; justify-content:center;">
                <div class="spinner-border" style="margin-top:20px;"></div>
                <p>AI Engine analyzing personality vectors...</p>
            </div>
        `;
        btnFindBuddy.disabled = true;

        try {
            const res = await fetch(API_BASE_URL + `/api/users/${userId}/find-buddy`);
            if (!res.ok) { const t = await res.text(); throw new Error(t || 'Failed'); }
            const data = await res.json();

            const scoreRaw = data.matchVibeScore && data.matchVibeScore.length > 0 ? data.matchVibeScore[0] : 85;
            const label = getMatchLabel(scoreRaw);

            let traitsHtml = '';
            if (data.sharedStrengths && data.sharedStrengths.length > 0) {
                data.sharedStrengths.forEach(s => traitsHtml += `<span class="badge" style="margin-bottom:5px;">${s}</span>`);
            }
            if (data.complementaryTraits && data.complementaryTraits.length > 0) {
                data.complementaryTraits.forEach(s => traitsHtml += `<span class="badge success" style="margin-bottom:5px;">${s}</span>`);
            }

            matchesContainer.innerHTML = `
                <div class="match-card-social">
                    <div class="match-label-badge">${label}</div>
                    <div class="match-avatar-social" style="background:var(--gradient-secondary); color:white;"><i class="fas fa-user-astronaut"></i></div>
                    <h3>${data.name}</h3>
                    <p style="margin-bottom: 15px;">Personality Match via IPIP-50</p>
                    <div style="display:flex; flex-direction:column; gap:5px; margin-bottom:20px; align-items:center;">
                        ${traitsHtml || '<span class="badge">Unique Connection</span>'}
                    </div>
                    <button class="btn-msg" onclick="openChat('${data.id}', '${data.name}')"><i class="fas fa-comment-dots"></i> Message</button>
                </div>
            `;
        } catch (err) {
            matchesContainer.innerHTML = `
                <div class="match-card-social" style="width: 100%; border-style: dashed;">
                    <div class="match-avatar-social" style="background:transparent;"><i class="fas fa-exclamation-triangle"></i></div>
                    <h3>No matches yet</h3>
                    <p>Click 'Refresh AI Match' to find buddies!</p>
                </div>
            `;
            const errorText = document.getElementById('error-text');
            errorText.textContent = err.message.includes('Nessun altro utente')
                ? 'No other users yet. Invite friends to join!'
                : 'Could not find a buddy right now. Try again later.';
            errorEl.style.display = 'block';
        }
        btnFindBuddy.disabled = false;
    });

    // ============================
    // CHAT LOGIC (STOMP WebSockets)
    // ============================
    let currentChatPartnerId = null;
    let stompClient = null;
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input-text');
    const chatMessages = document.getElementById('chat-messages');

    function connectWebSocket() {
        if (!userId || stompClient) return;
        const token = localStorage.getItem('jwt') || '';
        const socket = new SockJS(WS_BASE_URL + '/ws-chat?token=' + token);
        stompClient = Stomp.over(socket);
        stompClient.debug = null; // Disable debug logs in console
        stompClient.connect({}, function (frame) {
            console.log('STOMP Connected');
            stompClient.subscribe('/topic/chat/' + userId, function (response) {
                const msg = JSON.parse(response.body);
                // Display message if we are currently chatting with the sender
                if (currentChatPartnerId && msg.senderId == currentChatPartnerId) {
                    appendMessageUI(msg.content, 'msg-received');
                } else {
                    showToast('New message received!', 'success');
                }
            });
        }, function(error) {
            console.error('STOMP error', error);
            stompClient = null;
            setTimeout(connectWebSocket, 5000); // retry
        });
    }

    function appendMessageUI(content, type) {
        const div = document.createElement('div');
        div.className = 'msg-bubble ' + type;
        div.textContent = content;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function fetchMessages() {
        if (!currentChatPartnerId || !userId) return;
        try {
            const res = await fetch(API_BASE_URL + `/api/messages/${userId}/${currentChatPartnerId}`);
            if (!res.ok) return;
            const messages = await res.json();
            
            chatMessages.innerHTML = '';
            if (messages.length === 0) {
                chatMessages.innerHTML = '<div style="text-align:center; font-size:0.8rem; color:var(--color-text-muted); margin-top:20px;">Say hi! This is the beginning of your conversation.</div>';
                return;
            }

            messages.forEach(msg => {
                const type = (msg.senderId == userId) ? 'msg-sent' : 'msg-received';
                appendMessageUI(msg.content, type);
            });
        } catch (err) {
            console.error('Failed to fetch messages', err);
        }
    }

    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (!text || !currentChatPartnerId || !userId) return;

            chatInput.disabled = true;
            try {
                // If STOMP client is active, send via WebSocket payload for realtime
                if (stompClient && stompClient.connected) {
                    const payload = {
                        senderId: parseInt(userId),
                        receiverId: parseInt(currentChatPartnerId),
                        content: text
                    };
                    stompClient.send("/app/chat.send", {}, JSON.stringify(payload));
                    appendMessageUI(text, 'msg-sent');
                    chatInput.value = '';
                } else {
                    // Fallback to REST API if STOMP fails (it will still trigger MessageController which wraps with template push)
                    const res = await fetch(API_BASE_URL + '/api/messages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            senderId: parseInt(userId),
                            receiverId: parseInt(currentChatPartnerId),
                            content: text
                        })
                    });
                    if (res.ok) {
                        chatInput.value = '';
                        await fetchMessages();
                    }
                }
            } catch (err) {
                console.error('Failed to send message', err);
            }
            chatInput.disabled = false;
            chatInput.focus();
        });
    }
}
