export const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
// When frontend is served from Spring Boot (integrated build), use relative paths
// When frontend is on a separate domain (Vercel), use the full backend URL
const IS_SEPARATE_DOMAIN = window.location.hostname.includes('vercel.app');
export const API_BASE_URL = IS_LOCAL ? '' : (IS_SEPARATE_DOMAIN ? 'https://hobbybuddy.onrender.com' : '');
export const WS_BASE_URL = IS_LOCAL ? '' : (IS_SEPARATE_DOMAIN ? 'wss://hobbybuddy.onrender.com' : '');

export const TRAIT_LABELS = ['Extraversion', 'Agreeableness', 'Conscientiousness', 'Emotional Stability', 'Openness'];
export const TRAIT_VIBE_LABELS = ['Energy', 'Empathy', 'Steadiness', 'Calm', 'Curiosity'];
export const TRAIT_ICONS = ['fa-fire', 'fa-handshake', 'fa-tasks', 'fa-leaf', 'fa-lightbulb'];
export const TRAIT_CLASSES = ['extraversion', 'agreeableness', 'conscientiousness', 'neuroticism', 'openness'];
export const TRAIT_VIBE_CLASSES = ['vibe-energy', 'vibe-empathy', 'vibe-steadiness', 'vibe-calm', 'vibe-curiosity'];
export const TRAIT_API_NAMES = ['extraversion', 'agreeableness', 'conscientiousness', 'neuroticism', 'openness'];
export const SCALE_LABELS = ['Disagree', 'Slightly Disagree', 'Neutral', 'Slightly Agree', 'Agree'];

export const HOBBIES_LIST = [
  'Photography 📷', 'Hiking 🥾', 'Coding 💻', 'Running 🏃', 'Gaming 🎮',
  'Music 🎵', 'Cooking 🍳', 'Travel ✈️', 'Reading 📚', 'Art 🎨',
  'Fitness 💪', 'Board Games 🎲', 'Cinema 🎬', 'Dancing 💃', 'Yoga 🧘',
  'Writing ✍️', 'Football ⚽', 'Tennis 🎾', 'Cycling 🚴', 'Volunteering 🤝'
];

/** Hobby categories for structured presentation in Quiz and Profile */
export const HOBBY_CATEGORIES = [
  {
    name: '🏃 Sport & Fitness',
    hobbies: ['Running 🏃', 'Hiking 🥾', 'Fitness 💪', 'Yoga 🧘', 'Football ⚽', 'Tennis 🎾', 'Cycling 🚴', 'Dancing 💃'],
  },
  {
    name: '🎨 Creativity & Art',
    hobbies: ['Photography 📷', 'Art 🎨', 'Music 🎵', 'Writing ✍️', 'Cooking 🍳', 'Cinema 🎬'],
  },
  {
    name: '💻 Tech & Gaming',
    hobbies: ['Coding 💻', 'Gaming 🎮', 'Board Games 🎲'],
  },
  {
    name: '🌍 Culture & Community',
    hobbies: ['Travel ✈️', 'Reading 📚', 'Volunteering 🤝'],
  },
];

// ─────────────────────────────────────────────────────────────
// Mini-IPIP 20 (Donnellan et al., 2006)
// 4 items per trait × 5 traits = 20 questions
// Trait indices: 0=E, 1=A, 2=C, 3=N, 4=O
// Direction: +1 = forward, −1 = reverse scored
// Question order cycles E→A→C→N×2→O to spread trait items
// ─────────────────────────────────────────────────────────────
export const TOTAL = 20;

export const QUESTIONS = [
  // ── Cycle 1 (Q1–Q10) ──
  [0, 'I am the life of the party', 1],                              // E1 forward
  [1, 'I sympathize with others\' feelings', 1],                     // A1 forward
  [2, 'I get chores done right away', 1],                            // C1 forward
  [3, 'I have frequent mood swings', 1],                             // N1 forward
  [4, 'I have a vivid imagination', 1],                              // O1 forward
  [0, 'I don\'t talk a lot', -1],                                    // E2 reverse
  [1, 'I am not interested in other people\'s problems', -1],        // A2 reverse
  [2, 'I often forget to put things back in their proper place', -1],// C2 reverse
  [3, 'I am relaxed most of the time', -1],                          // N2 reverse
  [4, 'I am not interested in abstract ideas', -1],                  // O2 reverse

  // ── Cycle 2 (Q11–Q20) ──
  [0, 'I feel comfortable around people', 1],                        // E3 forward
  [1, 'I feel others\' emotions', 1],                                // A3 forward
  [2, 'I like order', 1],                                            // C3 forward
  [3, 'I get stressed out easily', 1],                               // N3 forward
  [4, 'I have difficulty understanding abstract ideas', -1],         // O3 reverse
  [0, 'I don\'t like to draw attention to myself', -1],              // E4 reverse
  [1, 'I take time out for others', 1],                              // A4 forward
  [2, 'I shirk my duties', -1],                                      // C4 reverse
  [3, 'I worry about things', 1],                                    // N4 forward
  [4, 'I have a rich vocabulary', 1],                                // O4 forward
];
