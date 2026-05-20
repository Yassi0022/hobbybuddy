// ============================
// TOKEN STORAGE
// ============================
window._authToken = null;
function saveToken(token) {
    window._authToken = token;
    try { localStorage.setItem('hb_token', token); } catch(e) {}
}
function getToken() {
    if (window._authToken) return window._authToken;
    try {
        const t = localStorage.getItem('hb_token');
        if (t) window._authToken = t;
        return t;
    } catch(e) { return null; }
}
function removeToken() {
    window._authToken = null;
    try { localStorage.removeItem('hb_token'); } catch(e) {}
}

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
const API_BASE_URL = IS_LOCAL ? '' : 'https://hobbybuddy-springboot.onrender.com';
const WS_BASE_URL = IS_LOCAL ? '' : 'https://hobbybuddy-springboot.onrender.com';

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
window.fetch = async function (...args) {
    let [resource, config] = args;
    const token = getToken();
    if (token) {
        if (!config) config = {};
        if (!config.headers) config.headers = {};
        config.headers['Authorization'] = 'Bearer ' + token;
    }
    const response = await originalFetch(resource, config);
    // Intercept expired / invalid token responses
    if ((response.status === 401 || response.status === 403) && !_isRedirectingToLogin) {
        // Skip interception for login/register calls (they have their own handling)
        const url = typeof resource === 'string' ? resource : resource.url;
        const isInternal = url.startsWith('/') || url.includes(window.location.hostname);

        if (!url.includes('/login') && !url.includes('/register') && isInternal) {
            console.log('Redirecting to login due to 401/403. URL:', url, 'Status:', response.status);
            _isRedirectingToLogin = true;
            showToast('Sessione scaduta. Effettua di nuovo il login.', 'error');
            removeToken();
            localStorage.removeItem('userId');
            localStorage.removeItem('userName');
            setTimeout(() => { window.location.href = '/login'; }, 2000);
        }
    }
    return response;
}; // End of fetch override
