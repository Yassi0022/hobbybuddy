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
        removeToken();
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
        const errorDiv = document.getElementById('register-error');
        if (errorDiv) errorDiv.style.display = 'none';

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

        const urlParams = new URLSearchParams(window.location.search);
        const refId = urlParams.get('ref') || sessionStorage.getItem('hobbybuddy_ref');

        const userData = {
            name: document.getElementById('reg-name').value.trim(),
            email: document.getElementById('reg-email').value.trim(),
            password: document.getElementById('reg-password').value.trim()
        };
        if (refId) {
            userData.referredBy = parseInt(refId);
        }

        if (!userData.name || !userData.email || !userData.password) {
            showToast('Please fill in all fields.', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-arrow-right"></i> Continue';
            return;
        }

        try {
            const maxRetries = 2;
            let res;
            let retryCount = 0;
            while(retryCount <= maxRetries) {
                try {
                    res = await fetch(API_BASE_URL + '/api/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(userData)
                    });
                    break;
                } catch(err) {
                    if (err.message === 'Failed to fetch' && retryCount < maxRetries) {
                        retryCount++;
                        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Server is waking up, please wait 30 seconds...';
                        await new Promise(r => setTimeout(r, 10000));
                    } else {
                        throw err;
                    }
                }
            }
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const errorMsg = errorData.error || `Server Error (${res.status})`;
                console.error('[AUTH-ERROR] Registration failed:', { status: res.status, data: errorData });
                throw new Error(errorMsg);
            }
            const data = await res.json();
            localStorage.setItem('userId', data.id);
            localStorage.setItem('userName', data.name);
            if (data.token) saveToken(data.token);
            window.location.href = '/quiz';
        } catch (err) {
            const errorDiv = document.getElementById('register-error');
            if (errorDiv) {
                errorDiv.textContent = err.message;
                errorDiv.style.display = 'block';
            } else {
                showToast('Error: ' + err.message, 'error');
            }
            btn.disabled = false;
            btn.innerHTML = 'Discover your personality <i class="fas fa-arrow-right"></i>';
        }
    });
}
