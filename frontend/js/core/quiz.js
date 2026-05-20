// ============================
// IPIP BIG-FIVE QUIZ — Tinder-style
// ============================
document.addEventListener('DOMContentLoaded', () => {
const quizCard = document.getElementById('quiz-card');
if (quizCard) {
    const token = getToken();
    if (!token) { window.location.href = '/login'; return; }
    const userId = localStorage.getItem('userId');
    if (!userId || userId === 'undefined') { window.location.href = '/register'; }
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

    // Reset quiz state on load, do not resume
    localStorage.removeItem('hobbybuddy_answers');
    const answers = new Array(TOTAL).fill(null);

    const screenSplash = document.getElementById('screen-splash');
    const screenQuiz = document.getElementById('screen-quiz');
    const screenUnlock = document.getElementById('screen-unlock');
    const screenReveal = document.getElementById('screen-reveal');

    const cardTrait = document.getElementById('quiz-card-trait');
    const cardQuestion = document.getElementById('quiz-card-question');
    const cardOptions = document.getElementById('quiz-card-options');
    const topFill = document.getElementById('quiz-top-fill');
    const narrativeProgress = document.getElementById('quiz-narrative-progress');

    // Consent Screen Logic
    const screenConsent = document.getElementById('screen-consent');
    const consentCheckbox = document.getElementById('consent-checkbox');
    const btnStartQuiz = document.getElementById('btn-start-quiz');

    if (screenConsent && consentCheckbox && btnStartQuiz) {
        screenConsent.style.display = 'flex'; // Always show initially

        consentCheckbox.addEventListener('change', () => {
            btnStartQuiz.disabled = !consentCheckbox.checked;
        });

        btnStartQuiz.addEventListener('click', () => {
            screenConsent.style.display = 'none';
            startQuizFlow();
        });
    } else if (screenSplash) {
        startQuizFlow();
    }

    function startQuizFlow() {
        if (!screenSplash) return;
        screenSplash.style.display = 'flex';
        screenSplash.classList.add('active');

        setTimeout(() => {
            screenSplash.style.display = 'none';
            screenSplash.classList.remove('active');

            if (currentIdx >= TOTAL) {
                showHobbiesScreen();
            } else {
                screenQuiz.style.display = 'flex'; // Use flex for better layout control
                screenQuiz.classList.add('active');
                screenQuiz.classList.remove('hidden'); // Force removal of hidden class if any
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
            btn.innerHTML = `<span style="font-weight:bold; font-size:1.2rem; margin-right:8px;">${v}</span> ${SCALE_LABELS[v - 1]}`;

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
                        showHobbiesScreen();
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
        document.getElementById('unlock-title').textContent = `🔓 Unlocked: ${TRAIT_LABELS[traitIdx]}!`;

        setTimeout(() => {
            screenUnlock.style.display = 'none';
            screenQuiz.style.display = 'block';
            renderQuestion(currentIdx + 1, 'next');
        }, 1500);
    }

    function updateUI() {
        // Calculate percentage out of 50 based on currentIdx (source of truth)
        const pct = Math.round((currentIdx / TOTAL) * 100);

        if (topFill) topFill.style.width = pct + '%';
        if (narrativeProgress) narrativeProgress.textContent = `Discovering your personality... ${pct}% complete`;

        const navCounter = document.getElementById('nav-counter');
        if (navCounter) navCounter.textContent = `${Math.min(currentIdx + 1, TOTAL)} / ${TOTAL}`;
    }

    async function submitTraits() {
        screenQuiz.style.display = 'none';
        screenUnlock.style.display = 'flex'; // repurpose unlock screen temporarily as loader
        document.getElementById('unlock-icon').innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
        document.getElementById('unlock-title').textContent = `Analyzing your profile...`;

        // Create form dynamically to submit as application/x-www-form-urlencoded
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/quiz/submit';

        // Add answers
        for (let i = 0; i < TOTAL; i++) {
            const q = QUESTIONS[i];
            const key = q[1]; // Key like 'O1', 'C2', etc.
            const val = answers[i] || 3;
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = val;
            form.appendChild(input);
        }

        // Add hobbies
        const hobbiesInp = document.createElement('input');
        hobbiesInp.type = 'hidden';
        hobbiesInp.name = 'hobbies';
        hobbiesInp.value = Array.from(selectedHobbies).join(',');
        form.appendChild(hobbiesInp);

        // Add GDPR
        const gdprInp = document.createElement('input');
        gdprInp.type = 'hidden';
        gdprInp.name = 'gdprConsent';
        gdprInp.value = 'on';
        form.appendChild(gdprInp);

        document.body.appendChild(form);
        localStorage.removeItem('hobbybuddy_answers');
        form.submit();
    }

    function showFinalReveal(traits) {
        screenReveal.style.display = 'block';
        screenReveal.classList.add('active');
        const container = document.getElementById('reveal-traits-container');
        container.innerHTML = '';

        const archetype = getArchetype(traits);
        container.innerHTML = `
            <div style="text-align:center; margin-bottom:40px; animation: fadeIn 0.8s ease;">
                <p style="text-transform:uppercase; letter-spacing:2px; font-weight:700; color:var(--color-accent-violet); margin-bottom:10px;">Your Identity Archetype</p>
                <h2 class="archetype-label" style="font-size:3rem; font-weight:800; color:#6366f1; margin:0;">${archetype}</h2>
            </div>
        `;

        const btn = document.getElementById('btn-to-dashboard');
        btn.addEventListener('click', () => {
            window.location.href = '/dashboard';
        });

        const shareBtn = document.getElementById('btn-share-vibe-native');
        const downloadBtn = document.getElementById('btn-download-card');


        if (shareBtn) shareBtn.addEventListener('click', () => shareVibe(archetype));

        // Platform share buttons
        const btnWA = document.getElementById('btn-share-whatsapp');
        const btnTG = document.getElementById('btn-share-telegram');
        const btnTW = document.getElementById('btn-share-twitter');
        if (btnWA) btnWA.addEventListener('click', () => window.shareToWhatsApp(archetype));
        if (btnTG) btnTG.addEventListener('click', () => window.shareToTelegram(archetype));
        if (btnTW) btnTW.addEventListener('click', () => window.shareToTwitter(archetype));

        if (downloadBtn) downloadBtn.addEventListener('click', () => {
            const card = document.getElementById('vibe-card-final');
            if (window.html2canvas) {
                window.html2canvas(card).then(canvas => {
                    const link = document.createElement('a');
                    link.download = 'my-vibe-card.png';
                    link.href = canvas.toDataURL();
                    link.click();
                });
            }
        });

        // --- VIRAL: Share Your Vibe button ---
        const shareVibeBtn = document.getElementById('btn-share-vibe');
        const vibeModal = document.getElementById('vibe-modal');
        const btnCloseModal = document.getElementById('btn-close-modal');
        const btnDownloadVibe = document.getElementById('btn-download-vibe');
        const btnCopyLink = document.getElementById('btn-copy-link');

        if (shareVibeBtn) {
            shareVibeBtn.style.opacity = '0';
            shareVibeBtn.style.animation = `fadeIn 1s ease forwards 2s`;

            shareVibeBtn.addEventListener('click', async () => {
                shareVibeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
                shareVibeBtn.disabled = true;

                // Populate Hidden Render Div
                const userName = localStorage.getItem('userName') || 'Buddy';
                document.getElementById('vibe-card-name').textContent = userName;

                const archetype = getArchetype(traits);
                const traitsContainer = document.getElementById('vibe-card-traits');
                traitsContainer.innerHTML = `
                    <div style="text-align:center; margin: 40px 0;">
                        <h2 style="font-size: 4.5rem; font-weight: 800; color: white; margin: 0;">${archetype}</h2>
                    </div>
                `;

                const hobbiesContainer = document.getElementById('vibe-card-hobbies');
                hobbiesContainer.innerHTML = '';
                Array.from(selectedHobbies).slice(0, 3).forEach(hobby => {
                    hobbiesContainer.innerHTML += `<span style="background:rgba(255,255,255,0.2); padding:10px 24px; border-radius:100px; font-weight:700; font-size:1.4rem;">${hobby}</span>`;
                });

                // Render Canvas
                try {
                    const renderTarget = document.getElementById('vibe-card-render');
                    renderTarget.style.top = '0'; // Bring into view briefly for rendering
                    renderTarget.style.zIndex = '-100';

                    const canvas = await html2canvas(renderTarget, { scale: 1, backgroundColor: null });
                    renderTarget.style.top = '-9999px'; // Hide again

                    // Show Modal
                    const previewContainer = document.getElementById('vibe-preview-container');
                    previewContainer.innerHTML = '';
                    canvas.style.width = '100%';
                    canvas.style.height = 'auto';
                    canvas.style.display = 'block';
                    previewContainer.appendChild(canvas);

                    vibeModal.style.display = 'flex';
                    vibeModal.style.animation = 'fadeIn 0.3s ease forwards';

                    shareVibeBtn.innerHTML = '<i class="fas fa-share-alt"></i> Share Your Vibe';
                    shareVibeBtn.disabled = false;

                    // Setup Download
                    btnDownloadVibe.onclick = () => {
                        const link = document.createElement('a');
                        link.download = `hobbybuddy-vibe-${userName}.png`;
                        link.href = canvas.toDataURL('image/png');
                        link.click();
                    };

                    // Setup Copy Link
                    btnCopyLink.onclick = () => {
                        const inviteUrl = window.location.origin + '/register?ref=' + localStorage.getItem('userId');
                        navigator.clipboard.writeText(`Join me on HobbyBuddy! Find your hobby twin: ${inviteUrl}`)
                            .then(() => {
                                btnCopyLink.innerHTML = '<i class="fas fa-check"></i> Copied!';
                                setTimeout(() => btnCopyLink.innerHTML = '<i class="fas fa-link"></i> Copy Invite Link', 2000);
                            })
                            .catch(() => showToast('Failed to copy', 'error'));
                    };

                } catch (err) {
                    console.error("Vibe card generation failed:", err);
                    showToast('Failed to generate card', 'error');
                    shareVibeBtn.innerHTML = '<i class="fas fa-share-alt"></i> Share Your Vibe';
                    shareVibeBtn.disabled = false;
                }
            });

            btnCloseModal.onclick = () => { vibeModal.style.display = 'none'; };
        }
    }

    const HOBBIES_LIST = ['Photography 📷', 'Hiking 🥾', 'Coding 💻', 'Running 🏃', 'Gaming 🎮', 'Music 🎵', 'Cooking 🍳', 'Travel ✈️', 'Reading 📚', 'Art 🎨', 'Fitness 💪', 'Board Games 🎲', 'Cinema 🎬', 'Dancing 💃', 'Yoga 🧘', 'Writing ✍️', 'Football ⚽', 'Tennis 🎾', 'Cycling 🚴', 'Volunteering 🤝'];
    const selectedHobbies = new Set();

    function showHobbiesScreen() {
        const screenQuiz = document.getElementById('screen-quiz');
        const screenHobbies = document.getElementById('screen-hobbies');
        if (screenQuiz) {
            screenQuiz.classList.add('exit-left');
            setTimeout(() => {
                screenQuiz.style.display = 'none';
                screenHobbies.style.display = 'block';
                screenHobbies.classList.add('enter');
            }, 300);
        } else {
            screenHobbies.style.display = 'block';
        }

        const grid = document.getElementById('hobbies-grid');
        grid.innerHTML = '';
        HOBBIES_LIST.forEach(hobby => {
            const btn = document.createElement('button');
            btn.className = 'btn-secondary';
            btn.style.margin = '4px';
            btn.style.borderRadius = '100px';
            btn.textContent = hobby;
            btn.onclick = () => toggleHobby(btn, hobby);
            grid.appendChild(btn);
        });
    }

    function toggleHobby(btn, hobby) {
        if (selectedHobbies.has(hobby)) {
            selectedHobbies.delete(hobby);
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
        } else {
            if (selectedHobbies.size >= 5) {
                showToast('You can select a maximum of 5 hobbies', 'error');
                return;
            }
            selectedHobbies.add(hobby);
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-primary');
        }

        const submitBtn = document.getElementById('btn-submit-hobbies');
        if (selectedHobbies.size >= 3) {
            submitBtn.disabled = false;
        } else {
            submitBtn.disabled = true;
        }
    }

    const btnSubmitHobbies = document.getElementById('btn-submit-hobbies');
    if (btnSubmitHobbies) {
        btnSubmitHobbies.addEventListener('click', () => {
            document.getElementById('screen-hobbies').style.display = 'none';
            submitTraits();
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (screenQuiz && screenQuiz.style.display !== 'none') {
            if (e.key >= '1' && e.key <= '5') {
                const v = parseInt(e.key);
                const buttons = cardOptions.querySelectorAll('.btn-quiz-option');
                if (buttons && buttons[v - 1]) {
                    buttons[v - 1].click();
                }
            }
        }
    });

    // --- NATIVE SHARE (Web Share API) ---
    async function shareVibe(archetype) {
        const userName = localStorage.getItem('userName') || 'Buddy';
        const shareText = `I just discovered I'm a "${archetype}" on HobbyBuddy! 🧠✨\n\nTake the free personality quiz and find your hobby twin:`;
        const shareUrl = window.location.origin + '/register?ref=' + localStorage.getItem('userId');

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'HobbyBuddy — My Personality Vibe',
                    text: shareText,
                    url: shareUrl,
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    navigator.clipboard.writeText(shareText + ' ' + shareUrl);
                    showToast('Link copied to clipboard!', 'success');
                }
            }
        } else {
            // Fallback: copy to clipboard with platform options
            navigator.clipboard.writeText(shareText + ' ' + shareUrl);
            showToast('Link copied! Share it anywhere 🚀', 'success');
        }
    }

    // --- PLATFORM SHARE BUTTONS ---
    window.shareToWhatsApp = function(archetype) {
        const text = encodeURIComponent(`I just discovered I'm a "${archetype}" on HobbyBuddy! 🧠✨ Take the free personality quiz: ${window.location.origin}/register?ref=${localStorage.getItem('userId')}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    window.shareToTelegram = function(archetype) {
        const text = encodeURIComponent(`I just discovered I'm a "${archetype}" on HobbyBuddy! 🧠✨`);
        const url = encodeURIComponent(`${window.location.origin}/register?ref=${localStorage.getItem('userId')}`);
        window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
    };

    window.shareToTwitter = function(archetype) {
        const text = encodeURIComponent(`I just discovered I'm a "${archetype}" on HobbyBuddy! 🧠✨ Take the free personality quiz and find your hobby twin.`);
        const url = encodeURIComponent(`${window.location.origin}/register?ref=${localStorage.getItem('userId')}`);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    };

}
});
