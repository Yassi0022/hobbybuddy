// ============================
// LOGIN
// ============================
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorDiv = document.getElementById('login-error');
        errorDiv.style.display = 'none';
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();
        if (!email || !password) { errorDiv.textContent = 'Please fill in all fields.'; errorDiv.style.display = 'block'; return; }

        const btn = loginForm.querySelector('.btn-form-primary');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

        try {
            const maxRetries = 2;
            let res;
            let retryCount = 0;
            while(retryCount <= maxRetries) {
                try {
                    res = await fetch(API_BASE_URL + `/api/users/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
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
            if (res.status === 404) { errorDiv.textContent = 'No account found with this email.'; errorDiv.style.display = 'block'; }
            else if (res.status === 401) { errorDiv.textContent = 'Wrong password.'; errorDiv.style.display = 'block'; }
            else if (!res.ok) { throw new Error('Login failed'); }
            else {
                const data = await res.json();
                localStorage.setItem('userId', data.id);
                localStorage.setItem('userName', data.name);
                if (data.token) saveToken(data.token);
                if (data.quizCompleted === false) {
                    window.location.href = '/quiz';
                } else {
                    window.location.href = '/dashboard';
                }
                return;
            }
        } catch (err) {
            errorDiv.textContent = 'Error: ' + err.message;
            errorDiv.style.display = 'block';
        }
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
    });
}

// ============================
// DASHBOARD & SOCIAL FEED
// ============================
document.addEventListener('DOMContentLoaded', () => {
    // Shared state
    let currentUserData = null;
    let currentChatPartnerId = null;
    let stompClient = null;

    const token = getToken();
    const userId = localStorage.getItem('userId');
    const dashboardSection = document.getElementById('view-home');

    if (dashboardSection) {
        if (!token || !userId || userId === 'undefined') {
            window.location.href = '/login';
            return;
        }
        initDashboard();
    }

    async function initDashboard() {
        await fetchCurrentUser();
        setupNavigation();
        setupCreatePost();
        setupEditProfile();
        setupDiscover();
        setupEvents();
        setupChat();

        // Load initial feed
        fetchPosts();

        // Auto-refresh discover in background
        setTimeout(() => {
            const navDiscover = document.getElementById('btn-nav-discover');
            if (navDiscover) navDiscover.click();
        }, 100);
    }

    // --- NAVIGATION ---
    function setupNavigation() {
        const navItems = {
            'btn-nav-home': 'view-home',
            'btn-nav-discover': 'view-discover',
            'btn-nav-messages': 'view-messages',
            'btn-nav-events': 'view-events'
        };

        Object.keys(navItems).forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => {
                    // Update classes
                    Object.keys(navItems).forEach(id => {
                        const b = document.getElementById(id);
                        const v = document.getElementById(navItems[id]);
                        if (b) b.classList.remove('active');
                        if (v) v.style.display = 'none';
                    });
                    btn.classList.add('active');
                    const targetView = document.getElementById(navItems[btnId]);
                    if (targetView) targetView.style.display = 'block';

                    // Specific tab triggers
                    if (btnId === 'btn-nav-home') fetchPosts();
                    if (btnId === 'btn-nav-discover') fetchDiscover();
                    if (btnId === 'btn-nav-events') fetchAllEvents();
                });
            }
        });

        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', (e) => {
                e.preventDefault();
                removeToken();
                localStorage.removeItem('userId');
                localStorage.removeItem('userName');
                window.location.href = '/';
            });
        }
    }

    // --- COMMUNITY POSTS ---
    function setupCreatePost() {
        const postContent = document.getElementById('post-content');
        const btnPublish = document.getElementById('btn-publish-post');
        const btnPhoto = document.getElementById('btn-post-image');
        const photoInput = document.getElementById('post-image-input');
        const preview = document.getElementById('post-image-preview');
        const hobbySelect = document.getElementById('post-hobby-tag');

        if (!postContent) return;

        // Auto-expand textarea
        postContent.addEventListener('input', () => {
            postContent.style.height = 'auto';
            postContent.style.height = (postContent.scrollHeight) + 'px';
        });

        // Populate hobby categories from user's hobbies
        const updateHobbyTags = () => {
            if (!currentUserData || !currentUserData.hobbies || !hobbySelect) return;
            const hobbies = currentUserData.hobbies.split(',').map(h => h.trim());
            hobbySelect.innerHTML = '<option value="">No Category</option>';
            hobbies.forEach(h => {
                const opt = document.createElement('option');
                opt.value = h;
                opt.textContent = h;
                hobbySelect.appendChild(opt);
            });
        };
        setTimeout(updateHobbyTags, 1000);

        if (btnPhoto) btnPhoto.addEventListener('click', () => photoInput.click());
        if (photoInput) {
            photoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (re) => {
                        const img = preview.querySelector('img');
                        if (img) img.src = re.target.result;
                        preview.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        const removeBtn = preview ? preview.querySelector('.btn-remove-img') : null;
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                preview.style.display = 'none';
                photoInput.value = '';
            });
        }

        if (btnPublish) {
            btnPublish.addEventListener('click', async () => {
                const content = postContent.value.trim();
                if (!content) return showToast('Please write something!', 'error');

                btnPublish.disabled = true;
                btnPublish.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

                const postData = {
                    content: content,
                    hobbyCategory: hobbySelect.value,
                    imageUrl: (preview && preview.style.display === 'block') ? preview.querySelector('img').src : null
                };

                try {
                    const res = await fetch(API_BASE_URL + '/api/posts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(postData)
                    });
                    if (!res.ok) throw new Error('Failed to post');

                    showToast('Post published!', 'success');
                    postContent.value = '';
                    postContent.style.height = 'auto';
                    if (preview) preview.style.display = 'none';
                    if (photoInput) photoInput.value = '';
                    fetchPosts(); // Refresh feed
                } catch (err) {
                    showToast(err.message, 'error');
                } finally {
                    btnPublish.disabled = false;
                    btnPublish.innerHTML = 'Post';
                }
            });
        }
    }

    async function fetchPosts() {
        const container = document.getElementById('posts-feed-container');
        if (!container) return;

        try {
            const res = await fetch(API_BASE_URL + '/api/posts');
            if (!res.ok) throw new Error('Failed to fetch posts');
            const posts = await res.json();

            if (posts.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-feather-alt"></i>
                        <h3>Feed is empty</h3>
                        <p>Follow more buddies or be the first to share something!</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = '';
            posts.forEach(post => {
                const date = new Date(post.createdAt).toLocaleDateString();
                const photos = JSON.parse(post.author.photosJson || '[]');
                const authorAvatar = photos.length > 0
                    ? `style="background: url('${photos[0]}') center/cover"`
                    : 'style="background: var(--gradient-primary); color:white; display:flex; justify-content:center; align-items:center;"';

                const avatarIcon = photos.length > 0 ? '' : '<i class="fas fa-user"></i>';

                container.innerHTML += `
                    <div class="post-card fade-in">
                        <div class="post-header">
                            <div class="avatar-sm" ${authorAvatar}>${avatarIcon}</div>
                            <div class="post-meta">
                                <h4>${post.author.name} ${post.hobbyCategory ? `<span class="badge" style="font-size:0.6rem; padding:2px 6px;">${post.hobbyCategory}</span>` : ''}</h4>
                                <span>${date}</span>
                            </div>
                        </div>
                        <div class="post-content">
                            <p>${post.content}</p>
                            ${post.imageUrl ? `<div class="post-img-container"><img src="${post.imageUrl}" alt="Post image"></div>` : ''}
                        </div>
                        <div class="post-actions" style="display:flex; gap:15px; color:var(--color-text-light); font-size:0.9rem; margin-top:15px;">
                            <span style="cursor:pointer;"><i class="far fa-heart"></i> ${post.likesCount || 0}</span>
                            <span style="cursor:pointer;"><i class="far fa-comment"></i> ${post.commentsCount || 0}</span>
                        </div>
                    </div>
                `;
            });
        } catch (err) {
            container.innerHTML = `<div class="empty-state" style="color:var(--color-error)">Failed to load feed. <button class="btn-outline" onclick="fetchPosts()">Retry</button></div>`;
        }
    }

    // --- DISCOVER GRID ---
    function setupDiscover() {
        const btnRefresh = document.getElementById('btn-refresh-discover');
        if (btnRefresh) btnRefresh.addEventListener('click', fetchDiscover);
    }

    async function fetchDiscover() {
        const grid = document.getElementById('discover-grid');
        if (!grid) return;

        // Loading state
        grid.innerHTML = Array(4).fill(0).map(() => `
            <div class="skeleton-card skeleton"></div>
        `).join('');

        try {
            const res = await fetch(API_BASE_URL + `/api/users/${userId}/find-buddy`);
            if (!res.ok) throw new Error('Match load failed');
            const data = await res.json();
            const matches = data.matches || [];

            if (matches.length === 0) {
                const message = data.message || "Complete your profile, add more hobbies, and try again!";
                const isUnavailable = data.message && data.message.includes("unavailable");

                grid.innerHTML = `
                    <div class="empty-state" style="grid-column: 1/-1; padding: 60px 20px;">
                        <div style="font-size: 5rem; margin-bottom: 24px; color: var(--color-input-border); opacity: 0.8;">
                            <i class="${isUnavailable ? 'fas fa-plug-circle-xmark' : 'fas fa-user-friends'}"></i>
                        </div>
                        <h3 style="font-size: 1.8rem; margin-bottom: 12px; color: var(--color-text-main);">${isUnavailable ? 'Engine Standby' : 'No matches yet'}</h3>
                        <p style="color: var(--color-text-muted); max-width: 400px; margin: 0 auto 28px;">${message}</p>
                        <button class="btn-primary" onclick="fetchDiscover()">
                            <i class="fas fa-sync-alt"></i> ${isUnavailable ? 'Retry Connection' : 'Refresh Matches'}
                        </button>
                    </div>
                `;
                return;
            }

            grid.innerHTML = '';
            matches.forEach(m => {
                const score = (m.matchVibeScore && m.matchVibeScore.length > 0) ? Math.round(m.matchVibeScore[0]) : 85;
                const label = getMatchLabel(score);
                const photos = JSON.parse(m.photosJson || '[]');
                const avatar = photos.length > 0 ? photos[0] : 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=300&h=300&fit=crop';

                const card = document.createElement('div');
                card.className = 'discover-card fade-in';
                card.innerHTML = `
                    <div class="discover-card-img">
                        <img src="${avatar}" alt="${m.name}">
                        <div class="discover-badge badge success">${label}</div>
                    </div>
                    <div class="discover-card-content">
                        <h3>${m.name}${m.age ? `, ${m.age}` : ''}</h3>
                        <p class="tagline">${m.personalityTagline || 'Looking for hobby buddies'}</p>
                        <div class="tags" style="justify-content: flex-start; margin-top: auto;">
                            ${(m.hobbies || '').split(',').slice(0, 2).map(h => `<span class="tag">${h.trim()}</span>`).join('')}
                        </div>
                    </div>
                    <div class="discover-card-footer">
                        <button class="btn-outline" style="flex:1; padding: 10px;" onclick="viewProfile('${m.id}')">Profile</button>
                        <button class="btn-primary" style="flex:1; padding: 10px;" onclick="openIcebreakerModalById('${m.id}')">Connect</button>
                    </div>
                `;
                grid.appendChild(card);
            });
        } catch (err) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; padding: 60px 20px;">
                    <div style="font-size: 5rem; margin-bottom: 24px; color: var(--color-error); opacity: 0.3;">
                        <i class="fas fa-wifi-slash"></i>
                    </div>
                    <h3 style="font-size: 1.8rem; margin-bottom: 12px;">Connection Issue</h3>
                    <p style="color: var(--color-text-muted); max-width: 400px; margin: 0 auto 28px;">We couldn't reach the matching engine. Please ensure the backend services are running.</p>
                    <button class="btn-outline" onclick="fetchDiscover()">
                        <i class="fas fa-sync-alt"></i> Retry Connection
                    </button>
                </div>
            `;
        }
    }

    // --- EVENTS REDESIGN ---
    function setupEvents() {
        const btnToggle = document.getElementById('btn-toggle-create-event');
        const panel = document.getElementById('events-create-panel');
        const form = document.getElementById('form-create-event');

        if (btnToggle) {
            btnToggle.addEventListener('click', () => {
                panel.classList.toggle('active');
                btnToggle.innerHTML = panel.classList.contains('active') ? '<i class="fas fa-times"></i> Close' : '<i class="fas fa-plus"></i> New Event';
            });
        }

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = document.getElementById('btn-submit-event');
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

                const eventData = {
                    title: document.getElementById('event-title').value,
                    hobbyCategory: document.getElementById('event-hobby').value,
                    date: document.getElementById('event-date').value,
                    location: document.getElementById('event-location').value,
                    maxParticipants: parseInt(document.getElementById('event-max').value),
                    description: document.getElementById('event-desc').value
                };

                try {
                    const res = await fetch(API_BASE_URL + '/api/events', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + getToken()
                        },
                        body: JSON.stringify(eventData)
                    });
                    if (!res.ok) throw new Error('Failed to create event');
                    showToast('Event published!', 'success');
                    form.reset();
                    panel.classList.remove('active');
                    btnToggle.innerHTML = '<i class="fas fa-plus"></i> New Event';
                    fetchAllEvents();
                } catch (err) {
                    showToast(err.message, 'error');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = 'Publish Event';
                }
            });
        }
    }

    async function fetchAllEvents() {
        const grid = document.getElementById('events-grid');
        const cityBadge = document.getElementById('event-city-badge');
        if (!grid) return;

        grid.innerHTML = Array(3).fill(0).map(() => `<div class="skeleton-card skeleton"></div>`).join('');

        try {
            let city = "";
            if ("geolocation" in navigator) {
                try {
                    const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, {timeout: 5000}));
                    const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
                    const geoData = await geoRes.json();
                    city = geoData.address.city || geoData.address.town || geoData.address.village || "";
                    if (cityBadge) cityBadge.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${city}`;
                } catch(e) { city = ""; }
            }

            const res = await fetch(API_BASE_URL + '/api/events' + (city ? '?city=' + city : ''));
            if (!res.ok) throw new Error('Event fetch failed');
            const events = await res.json();

            if (events.length === 0) {
                grid.innerHTML = `
                    <div class="empty-state" style="grid-column: 1/-1;">
                        <i class="fas fa-calendar-day"></i>
                        <h3>No events found</h3>
                        <p>Be the first to organize something in your area!</p>
                    </div>
                `;
                return;
            }

            grid.innerHTML = '';
            events.forEach(ev => {
                const date = new Date(ev.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                const isJoined = ev.participants.some(p => p.id == userId);
                const isFull = ev.participants.length >= ev.maxParticipants;

                grid.innerHTML += `
                    <div class="event-card fade-in">
                        <div class="event-card-header">
                            <span class="badge success">${ev.hobbyCategory}</span>
                            <span class="badge" style="background:var(--color-input-bg); border:none;">${date}</span>
                        </div>
                        <h3 class="event-card-title">${ev.title}</h3>
                        <div class="event-info-row"><i class="fas fa-map-marker-alt"></i> ${ev.location}</div>
                        <div class="event-info-row"><i class="fas fa-user-circle"></i> Hosted by ${ev.createdBy.name}</div>

                        <div class="event-card-footer">
                            <div class="participants-mini">
                                <i class="fas fa-users"></i> ${ev.participants.length}/${ev.maxParticipants}
                            </div>
                            ${isJoined ?
                                `<button class="btn-outline btn-sm" onclick="leaveEvent('${ev.id}')">Leave</button>` :
                                `<button class="btn-primary btn-sm" ${isFull ? 'disabled' : ''} onclick="joinEvent('${ev.id}')">${isFull ? 'Full' : 'Join'}</button>`
                            }
                        </div>
                    </div>
                `;
            });
        } catch (err) {
            grid.innerHTML = `<div class="empty-state">Error: ${err.message}</div>`;
        }
    }

    window.joinEvent = async (id) => {
        try {
            const res = await fetch(API_BASE_URL + `/api/events/${id}/join`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to join');
            showToast('Joined event!', 'success');
            fetchAllEvents();
        } catch(e) { showToast(e.message, 'error'); }
    };

    window.leaveEvent = async (id) => {
        try {
            const res = await fetch(API_BASE_URL + `/api/events/${id}/leave`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to leave');
            showToast('Left event', 'success');
            fetchAllEvents();
        } catch(e) { showToast(e.message, 'error'); }
    };

    // --- EDIT PROFILE ---
    function setupEditProfile() {
        const modal = document.getElementById('modal-edit-profile');
        const trigger = document.getElementById('btn-edit-profile-trigger');
        const close = document.getElementById('btn-close-profile-modal');
        const form = document.getElementById('form-edit-profile');

        if (!trigger) return;

        trigger.addEventListener('click', () => {
            populateProfileForm();
            modal.style.display = 'flex';
        });

        if (close) close.addEventListener('click', () => modal.style.display = 'none');

        if (form) {
            const btnDelete = document.getElementById('btn-delete-account');
            if (btnDelete) {
                btnDelete.addEventListener('click', async () => {
                    const confirmMsg = "ARE YOU SURE? This will permanently delete your account, personality profile, all posts, events you created, and messages. This action is IRREVERSIBLE.";
                    if (confirm(confirmMsg)) {
                        btnDelete.disabled = true;
                        btnDelete.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';

                        try {
                            const res = await fetch(API_BASE_URL + `/api/users/${userId}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': 'Bearer ' + getToken() }
                            });
                            if (!res.ok) throw new Error('Deletion failed');

                            showToast('Account deleted. We are sorry to see you go.', 'success');
                            setTimeout(() => {
                                localStorage.clear();
                                removeToken();
                                window.location.href = '/';
                            }, 2000);
                        } catch (err) {
                            showToast(err.message, 'error');
                            btnDelete.disabled = false;
                            btnDelete.innerHTML = '<i class="fas fa-trash-alt"></i> Delete Account';
                        }
                    }
                });
            }

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = document.getElementById('btn-save-profile');
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

                const photos = [];
                document.querySelectorAll('.photo-url-input').forEach(input => {
                    if (input.value.trim()) photos.push(input.value.trim());
                });

                const updateData = {
                    name: document.getElementById('edit-name').value,
                    personalityTagline: document.getElementById('edit-tagline').value,
                    age: parseInt(document.getElementById('edit-age').value) || null,
                    city: document.getElementById('edit-city').value,
                    bio: document.getElementById('edit-bio').value,
                    hobbies: Array.from(selectedEditHobbies).join(','),
                    photosJson: JSON.stringify(photos)
                };

                try {
                    const res = await fetch(API_BASE_URL + `/api/users/${userId}/profile`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + getToken()
                        },
                        body: JSON.stringify(updateData)
                    });
                    if (!res.ok) throw new Error('Update failed');
                    showToast('Profile updated!', 'success');
                    modal.style.display = 'none';
                    await fetchCurrentUser(); // Refresh dashboard UI
                } catch (err) {
                    showToast(err.message, 'error');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = 'Save Changes';
                }
            });
        }
    }

    let selectedEditHobbies = new Set();
    function populateProfileForm() {
        if (!currentUserData) return;
        const nameInp = document.getElementById('edit-name');
        const taglineInp = document.getElementById('edit-tagline');
        const ageInp = document.getElementById('edit-age');
        const cityInp = document.getElementById('edit-city');
        const bioInp = document.getElementById('edit-bio');

        if (nameInp) nameInp.value = currentUserData.name;
        if (taglineInp) taglineInp.value = currentUserData.personalityTagline || '';
        if (ageInp) ageInp.value = currentUserData.age || '';
        if (cityInp) cityInp.value = currentUserData.city || '';
        if (bioInp) bioInp.value = currentUserData.bio || '';

        selectedEditHobbies = new Set(currentUserData.hobbies ? currentUserData.hobbies.split(',').map(h => h.trim()) : []);
        renderEditHobbiesGrid();

        const photoContainer = document.getElementById('photo-inputs-container');
        if (photoContainer) {
            photoContainer.innerHTML = '';
            const photos = JSON.parse(currentUserData.photosJson || '[]');
            for (let i = 0; i < 4; i++) {
                const url = photos[i] || '';
                const item = document.createElement('div');
                item.className = 'photo-input-item';
                item.innerHTML = `
                    <div class="photo-preview-box">
                        ${url ? `<img src="${url}">` : '<i class="fas fa-camera"></i>'}
                    </div>
                    <input type="text" class="photo-url-input" placeholder="Image URL ${i+1}" value="${url}">
                `;
                photoContainer.appendChild(item);

                const inp = item.querySelector('.photo-url-input');
                inp.addEventListener('change', () => {
                    item.querySelector('.photo-preview-box').innerHTML = inp.value ? `<img src="${inp.value}">` : '<i class="fas fa-camera"></i>';
                });
            }
        }
    }

    function renderEditHobbiesGrid() {
        const grid = document.getElementById('edit-hobbies-grid');
        if (!grid) return;
        grid.innerHTML = '';
        const allHobbies = ['Photography 📷', 'Hiking 🥾', 'Coding 💻', 'Running 🏃', 'Gaming 🎮', 'Music 🎵', 'Cooking 🍳', 'Travel ✈️', 'Reading 📚', 'Art 🎨', 'Fitness 💪', 'Board Games 🎲', 'Cinema 🎬', 'Dancing 💃', 'Yoga 🧘', 'Writing ✍️', 'Football ⚽', 'Tennis 🎾', 'Cycling 🚴', 'Volunteering 🤝'];

        allHobbies.forEach(h => {
            const chip = document.createElement('div');
            chip.className = 'hobby-chip-edit' + (selectedEditHobbies.has(h) ? ' selected' : '');
            chip.textContent = h;
            chip.onclick = () => {
                if (selectedEditHobbies.has(h)) {
                    selectedEditHobbies.delete(h);
                } else {
                    if (selectedEditHobbies.size >= 5) return showToast('Max 5 hobbies', 'error');
                    selectedEditHobbies.add(h);
                }
                renderEditHobbiesGrid();
            };
            grid.appendChild(chip);
        });
    }

    // --- CHAT & ICEBREAKERS ---
    function setupChat() {
        const chatForm = document.getElementById('chat-form');
        const chatInput = document.getElementById('chat-input-text');
        const chatMessages = document.getElementById('chat-messages');

        if (chatForm) {
            chatForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const text = chatInput.value.trim();
                if (!text || !currentChatPartnerId) return;

                const msgData = {
                    senderId: parseInt(userId),
                    receiverId: parseInt(currentChatPartnerId),
                    content: text
                };

                try {
                    const res = await fetch(API_BASE_URL + '/api/messages', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + getToken()
                        },
                        body: JSON.stringify(msgData)
                    });
                    if (res.ok) {
                        chatInput.value = '';
                        appendMessageUI(text, 'msg-sent');
                    }
                } catch(e) {}
            });
        }

        const btnClose = document.getElementById('btn-close-chat');
        if (btnClose) btnClose.addEventListener('click', () => {
            document.getElementById('chat-modal').classList.remove('open');
            currentChatPartnerId = null;
        });
    }

    function appendMessageUI(content, type) {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'msg-bubble ' + type;
        div.textContent = content;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    window.openIcebreakerModalById = async (id) => {
        try {
            const res = await fetch(API_BASE_URL + `/api/users/${id}/find-buddy`);
            const data = await res.json();
            const target = (data.matches && data.matches.length > 0) ? data.matches[0] : {id, name: 'Buddy'};
            openIcebreakerModal(target);
        } catch(e) { showToast('Error opening connection', 'error'); }
    };

    let currentIbTarget = null;
    function openIcebreakerModal(user) {
        currentIbTarget = user;
        const nameEl = document.getElementById('ib-partner-name');
        if (nameEl) nameEl.textContent = user.name;
        const modal = document.getElementById('icebreaker-modal');
        if (modal) modal.classList.add('open');
        const ans = document.getElementById('ib-answer');
        if (ans) ans.value = '';
    }

    const btnSendIb = document.getElementById('btn-send-ib');
    if (btnSendIb) {
        btnSendIb.addEventListener('click', async () => {
            const val = document.getElementById('ib-answer').value.trim();
            if (!val) return showToast('Write something!', 'error');

            btnSendIb.disabled = true;
            try {
                await fetch(API_BASE_URL + '/api/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + getToken()
                    },
                    body: JSON.stringify({
                        senderId: userId,
                        receiverId: currentIbTarget.id,
                        content: "(Icebreaker): " + val
                    })
                });
                showToast('Vibe Check sent!', 'success');
                document.getElementById('icebreaker-modal').classList.remove('open');
            } catch(e) { showToast('Send failed', 'error'); }
            finally { btnSendIb.disabled = false; }
        });
    }

    async function fetchCurrentUser() {
        try {
            const res = await fetch(API_BASE_URL + '/api/users/me', {
                headers: { 'Authorization': 'Bearer ' + getToken() }
            });
            if (!res.ok) return;
            currentUserData = await res.json();

            // Update UI elements
            const nameEl = document.getElementById('user-name');
            if (nameEl) nameEl.textContent = currentUserData.name;

            const profileImg = document.querySelector('.profile-summary .avatar');
            if (profileImg && currentUserData.photosJson) {
                const photos = JSON.parse(currentUserData.photosJson);
                if (photos.length > 0) profileImg.style.background = `url('${photos[0]}') center/cover`;
            }
        } catch (e) { console.error('Fetch me failed', e); }
    }

    function getMatchLabel(score) {
        if (score >= 85) return "Top Match 🔥";
        if (score >= 70) return "Great Match ✨";
        if (score >= 55) return "Good Match 👍";
        return "Compatible";
    }

    window.openChat = function (partnerId, partnerName) {
        const modal = document.getElementById('chat-modal');
        document.getElementById('chat-partner-name').textContent = partnerName;
        currentChatPartnerId = partnerId;
        modal.classList.add('open');
        fetchMessages();
    };

    async function fetchMessages() {
        if (!currentChatPartnerId || !userId) return;
        const container = document.getElementById('chat-messages');
        try {
            const res = await fetch(API_BASE_URL + `/api/messages/${userId}/${currentChatPartnerId}`);
            if (!res.ok) return;
            const messages = await res.json();
            container.innerHTML = '';
            messages.forEach(msg => {
                const type = (msg.senderId == userId) ? 'msg-sent' : 'msg-received';
                appendMessageUI(msg.content, type);
            });
        } catch (err) {}
    }

    // --- ARCHETYPE MAPPING (Identity-based labels) ---
    function getArchetype(traits) {
        let maxVal = -1;
        let topTrait = 'openness';
        for (const [key, val] of Object.entries(traits)) {
            if (key === 'hobbies') continue;
            if (val > maxVal) { maxVal = val; topTrait = key; }
        }
        const archetypes = {
            'openness': 'The Creative Explorer',
            'conscientiousness': 'The Organized Leader',
            'extraversion': 'The Social Spark',
            'agreeableness': 'The Empathetic Guardian',
            'neuroticism': 'The Calm Zen Master'
        };
        return archetypes[topTrait] || 'The Hobby Enthusiast';
    }

    // --- VIRAL SHARING (Native Web Share) ---
    async function shareVibe(archetype) {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'My HobbyBuddy Vibe',
                    text: `I just discovered my vibe: ${archetype}! Find your hobby twin at HobbyBuddy.`,
                    url: window.location.origin
                });
            } catch (err) { console.log('Share failed', err); }
        } else {
            navigator.clipboard.writeText(`I just discovered my vibe: ${archetype}! Find your hobby twin at HobbyBuddy: ${window.location.origin}`);
            showToast('Link copied to clipboard!', 'success');
        }
    }

    // --- NAVIGATION FLOW (Multi-page Sync) ---
    document.addEventListener('click', (e) => {
        if (e.target && (e.target.id === 'btn-edit-profile-trigger' || e.target.closest('#btn-edit-profile-trigger'))) {
            window.location.href = '/profile';
        }
    });

    // --- VIBE CARD GENERATION (Identity Design) ---
    window.generateIdentityCard = function(traits) {
        const archetype = getArchetype(traits);
        const name = localStorage.getItem('userName') || 'Buddy';
        const revealContainer = document.getElementById('reveal-traits-container');
        if (!revealContainer) return;

        revealContainer.innerHTML = `
            <div class="vibe-card-identity glass-card" id="vibe-card-final" style="text-align:center; padding:40px; border-radius:24px; background:var(--gradient-primary); color:white; margin-bottom:30px;">
                <div class="avatar-xl" style="background:rgba(255,255,255,0.2); margin:0 auto 20px;"><i class="fas fa-user"></i></div>
                <h2 style="color:white; margin-bottom:5px;">${name}</h2>
                <p style="font-size:1.4rem; font-weight:800; opacity:0.9;">${archetype}</p>
                <div style="margin-top:20px; display:flex; gap:10px; justify-content:center;">
                    ${(traits.hobbies || '').split(',').slice(0,3).map(h => `<span style="background:rgba(255,255,255,0.2); padding:5px 15px; border-radius:100px; font-size:0.8rem;">#${h.trim()}</span>`).join('')}
                </div>
                <div style="margin-top:30px; font-size:0.8rem; opacity:0.6;">HobbyBuddy.app</div>
            </div>
            <div style="display:flex; flex-direction:column; gap:15px;">
                <button class="btn-primary" id="btn-share-vibe-native" style="width:100%;"><i class="fas fa-share-alt"></i> Share Your Vibe</button>
                <button class="btn-outline" id="btn-download-card" style="width:100%;"><i class="fas fa-download"></i> Download Image</button>
            </div>
        `;

        document.getElementById('btn-share-vibe-native').addEventListener('click', () => shareVibe(archetype));
        document.getElementById('btn-download-card').addEventListener('click', () => {
            const card = document.getElementById('vibe-card-final');
            html2canvas(card).then(canvas => {
                const link = document.createElement('a');
                link.download = 'my-vibe-card.png';
                link.href = canvas.toDataURL();
                link.click();
            });
        });
    };

    // --- INVITE FRIENDS ---
    const btnInvite = document.getElementById('btn-invite-friends');
    const referralCount = document.getElementById('referral-count');
    if (btnInvite) {
        btnInvite.addEventListener('click', () => {
            const userId = localStorage.getItem('userId');
            const inviteUrl = window.location.origin + '/register?ref=' + userId;
            const shareText = `Join me on HobbyBuddy! 🧠✨ Find your hobby twin with AI-powered personality matching: ${inviteUrl}`;
            navigator.clipboard.writeText(shareText).then(() => {
                btnInvite.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => btnInvite.innerHTML = '<i class="fas fa-share-alt"></i> Copy Invite Link', 2000);
            }).catch(() => showToast('Failed to copy', 'error'));
        });
    }
    // Show referral count if available
    if (referralCount && typeof currentUser !== 'undefined' && currentUser && currentUser.referralCount) {
        referralCount.textContent = `You've invited ${currentUser.referralCount} friends`;
    }
});
