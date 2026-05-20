export const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
// When frontend is served from Spring Boot (integrated build), use relative paths
// When frontend is on a separate domain (Vercel), use the full backend URL
const IS_SEPARATE_DOMAIN = window.location.hostname.includes('vercel.app');
export const API_BASE_URL = IS_LOCAL ? '' : (IS_SEPARATE_DOMAIN ? 'https://hobbybuddy-springboot.onrender.com' : '');
export const WS_BASE_URL = IS_LOCAL ? '' : (IS_SEPARATE_DOMAIN ? 'wss://hobbybuddy-springboot.onrender.com' : '');

export const TRAIT_LABELS = ['Extraversion', 'Agreeableness', 'Conscientiousness', 'Emotional Stability', 'Openness'];
export const TRAIT_ICONS = ['fa-fire', 'fa-handshake', 'fa-tasks', 'fa-leaf', 'fa-lightbulb'];
export const TRAIT_CLASSES = ['extraversion', 'agreeableness', 'conscientiousness', 'neuroticism', 'openness'];
export const TRAIT_API_NAMES = ['extraversion', 'agreeableness', 'conscientiousness', 'neuroticism', 'openness'];
export const SCALE_LABELS = ['Disagree', 'Slightly Disagree', 'Neutral', 'Slightly Agree', 'Agree'];

export const HOBBIES_LIST = [
  'Photography 📷', 'Hiking 🥾', 'Coding 💻', 'Running 🏃', 'Gaming 🎮',
  'Music 🎵', 'Cooking 🍳', 'Travel ✈️', 'Reading 📚', 'Art 🎨',
  'Fitness 💪', 'Board Games 🎲', 'Cinema 🎬', 'Dancing 💃', 'Yoga 🧘',
  'Writing ✍️', 'Football ⚽', 'Tennis 🎾', 'Cycling 🚴', 'Volunteering 🤝'
];

export const TOTAL = 50;

export const QUESTIONS = [
  // Extraversion
  [0, 'I am the life of the party 🥳', 1],
  [0, "I don't talk a lot 😶", -1],
  [0, 'I feel comfortable around people 🤝', 1],
  [0, 'I keep in the background 👤', -1],
  [0, 'I start conversations 🗣️', 1],
  [0, 'I have little to say 🤐', -1],
  [0, 'I talk to a lot of different people at parties 🎊', 1],
  [0, "I don't like to draw attention to myself 🙈", -1],
  [0, 'I don\'t mind being the center of attention 🌟', 1],
  [0, 'I am quiet around strangers 🤫', -1],
  // Agreeableness
  [1, 'I am interested in people 🧑‍🤝‍🧑', 1],
  [1, 'I insult people 😤', -1],
  [1, 'I feel others\' emotions 💗', 1],
  [1, 'I am not interested in other people\'s problems 🧱', -1],
  [1, 'I have a soft heart 💖', 1],
  [1, 'I am not really interested in people 🙄', -1],
  [1, 'I take time out for others ⏰', 1],
  [1, 'I feel little concern for others 😐', -1],
  [1, 'I make people feel at home 🏠', 1],
  [1, 'I am hard to get to know 🧊', -1],
  // Conscientiousness
  [2, 'I am always prepared 📋', 1],
  [2, 'I leave my belongings around 🧸', -1],
  [2, 'I pay attention to details 🔍', 1],
  [2, 'I make a mess of things 🗑️', -1],
  [2, 'I get chores done right away ✅', 1],
  [2, 'I often forget to put things back 🔑', -1],
  [2, 'I like order 📐', 1],
  [2, 'I shirk my duties 😴', -1],
  [2, 'I follow a schedule 📅', 1],
  [2, 'I am exacting in my work 🎯', 1],
  // Emotional Stability (reverse-scored: high = stable)
  [3, 'I am relaxed most of the time 😌', 1],
  [3, 'I get stressed out easily 😰', -1],
  [3, 'I worry about things 🤔', -1],
  [3, 'I seldom feel blue 🌤️', 1],
  [3, 'I am easily disturbed 😵', -1],
  [3, 'I get upset easily 😢', -1],
  [3, 'I change my mood a lot 🎭', -1],
  [3, 'I have frequent mood swings 🎢', -1],
  [3, 'I get irritated easily 😠', -1],
  [3, 'I often feel blue 🌧️', -1],
  // Openness
  [4, 'I have a rich vocabulary 📖', 1],
  [4, 'I have difficulty understanding abstract ideas 🤯', -1],
  [4, 'I have a vivid imagination 🎨', 1],
  [4, 'I am not interested in abstract ideas 📊', -1],
  [4, 'I have excellent ideas 💡', 1],
  [4, 'I do not have a good imagination 🧱', -1],
  [4, 'I am quick to understand things ⚡', 1],
  [4, 'I use difficult words 📝', 1],
  [4, 'I spend time reflecting on things 🪞', 1],
  [4, 'I am full of ideas 🌟', 1],
];
