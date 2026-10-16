/**
 * Curated live sample data for instant exploration when backend is waking up or in demo mode.
 */

export const DEMO_USER = {
  id: 'demo-user-1',
  name: 'Alex Rossi',
  email: 'alex.rossi@hobbybuddy.com',
  city: 'Milano',
  age: 26,
  archetype: 'The Catalyst',
  personalityTagline: 'Passionate photographer & weekend trail runner',
  hobbies: 'Photography 📷, Hiking 🥾, Running 🏃, Coffee ☕, Coding 💻',
  quizCompleted: true,
  token: 'mock-jwt-demo-session-token-2026',
};

export const DEMO_POSTS = [
  {
    id: 101,
    content: 'Anybody down for a golden hour photography photowalk around Parco Sempione this Saturday afternoon? 📸 Bring whatever camera you have (even phones are great)!',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    likesCount: 5,
    commentsCount: 2,
    viewerHasLiked: true,
    author: {
      id: 2,
      name: 'Giulia Colombo',
      archetype: 'The Luminary',
    },
  },
  {
    id: 102,
    content: 'Just finished coding a weekend audio visualizer in WebGL! Looking to connect with music producers or synth nerds in town 🎹⚡',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    likesCount: 8,
    commentsCount: 3,
    viewerHasLiked: false,
    author: {
      id: 3,
      name: 'Matteo Ferrari',
      archetype: 'The Architect',
    },
  },
  {
    id: 103,
    content: 'Sunday trail run meetup: 12k easy pace, great vibes, and specialty coffee after. Everyone is welcome to join at their own pace 🏃‍♂️💨',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    likesCount: 12,
    commentsCount: 4,
    viewerHasLiked: false,
    author: {
      id: 4,
      name: 'Sara Bianchi',
      archetype: 'The Dynamo',
    },
  },
];

export const DEMO_MATCHES = [
  {
    id: 201,
    buddyId: 2,
    buddyName: 'Giulia Colombo',
    buddyArchetype: 'The Luminary',
    status: 'CONFIRMED',
  },
  {
    id: 202,
    buddyId: 3,
    buddyName: 'Matteo Ferrari',
    buddyArchetype: 'The Architect',
    status: 'CONFIRMED',
  },
  {
    id: 203,
    buddyId: 4,
    buddyName: 'Sara Bianchi',
    buddyArchetype: 'The Dynamo',
    status: 'CONFIRMED',
  },
];

export const DEMO_PEOPLE = [
  {
    id: 2,
    name: 'Giulia Colombo',
    city: 'Milano',
    age: 25,
    archetype: 'The Luminary',
    compatibility: 94,
    matchReason: 'Shared love for street photography and creative arts',
    hobbies: ['Photography 📷', 'Art 🎨', 'Coffee ☕', 'Travel ✈️'],
    personalityTagline: 'Photographer and visual designer. Looking for weekend explore buddies and gallery visits.',
    bio: 'Photographer and visual designer. Looking for weekend explore buddies and gallery visits.',
    connected: false,
  },
  {
    id: 3,
    name: 'Matteo Ferrari',
    city: 'Milano',
    age: 28,
    archetype: 'The Architect',
    compatibility: 89,
    matchReason: 'High openness score and mutual enthusiasm for tech & gaming',
    hobbies: ['Coding 💻', 'Gaming 🎮', 'Electronic Music 🎵', 'Board Games 🎲'],
    personalityTagline: 'Software engineer by day, indie game tinkerer by night.',
    bio: 'Software engineer by day, indie game tinkerer by night.',
    connected: false,
  },
  {
    id: 4,
    name: 'Sara Bianchi',
    city: 'Milano',
    age: 27,
    archetype: 'The Dynamo',
    compatibility: 87,
    matchReason: 'Vibrant outdoor energy and shared fitness routines',
    hobbies: ['Running 🏃', 'Hiking 🥾', 'Yoga 🧘', 'Cooking 🍳'],
    personalityTagline: 'Trail enthusiast, amateur baker, always hunting for the next scenic view.',
    bio: 'Trail enthusiast, amateur baker, always hunting for the next scenic view.',
    connected: false,
  },
  {
    id: 5,
    name: 'Luca Moretti',
    city: 'Milano',
    age: 30,
    archetype: 'The Sage',
    compatibility: 84,
    matchReason: 'Deep conversational style and love for book clubs',
    hobbies: ['Reading 📚', 'Writing ✍️', 'Cinema 🎬', 'Cycling 🚴'],
    personalityTagline: 'Avid reader and cinema lover. Let\'s grab an espresso and discuss good books.',
    bio: 'Avid reader and cinema lover. Let\'s grab an espresso and discuss good books.',
    connected: false,
  },
];


export const DEMO_EVENTS = [
  {
    id: 301,
    title: 'Weekend Photography Walk: Navigli Sunset',
    description: 'Casual street & architectural photography walk along the canals. Open to all skill levels!',
    city: 'Milano',
    location: 'Darsena / Navigli, Milano',
    date: new Date(Date.now() + 86400000 * 2).toISOString(),
    hobbyCategory: 'Photography',
    source: 'community',
    maxParticipants: 15,
    currentParticipants: 8,
    host: { id: 2, name: 'Giulia Colombo', archetype: 'The Luminary' },
  },
  {
    id: 302,
    title: 'Board Games & Craft Beer Night',
    description: 'Catan, Wingspan, and social party games. Beginner friendly, snacks provided!',
    city: 'Milano',
    location: 'Isola District, Milano',
    date: new Date(Date.now() + 86400000 * 3).toISOString(),
    hobbyCategory: 'Board Games',
    source: 'community',
    maxParticipants: 12,
    currentParticipants: 9,
    host: { id: 3, name: 'Matteo Ferrari', archetype: 'The Architect' },
  },
  {
    id: 303,
    title: 'Morning 10k Run & Specialty Espresso',
    description: 'Lakeside run followed by breakfast and great conversations.',
    city: 'Milano',
    location: 'Idroscalo, Milano',
    date: new Date(Date.now() + 86400000 * 4).toISOString(),
    hobbyCategory: 'Running',
    source: 'community',
    maxParticipants: 20,
    currentParticipants: 14,
    host: { id: 4, name: 'Sara Bianchi', archetype: 'The Dynamo' },
  },
];


export const DEMO_CONVERSATIONS = [
  {
    partnerId: 2,
    partnerName: 'Giulia Colombo',
    partnerArchetype: 'The Luminary',
    lastMessage: 'Hey! Are you bringing your 35mm lens for the photowalk Saturday?',
    lastMessageTime: '10:32 AM',
    unreadCount: 1,
  },
  {
    partnerId: 3,
    partnerName: 'Matteo Ferrari',
    partnerArchetype: 'The Architect',
    lastMessage: 'Check out this new synth demo, what do you think?',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
  },
];

export const DEMO_MATCH_REQUESTS = [
  {
    id: 201,
    role: 'candidate',
    status: 'PENDING',
    buddyId: 5,
    buddyName: 'Elena Rostova',
    buddyArchetype: 'The Visionary',
    buddyCity: 'Milano',
  },
  {
    id: 202,
    role: 'requester',
    status: 'PENDING',
    buddyId: 6,
    buddyName: 'Luca Moretti',
    buddyArchetype: 'The Sage',
    buddyCity: 'Milano',
  },
  {
    id: 203,
    role: 'candidate',
    status: 'CONFIRMED',
    buddyId: 2,
    buddyName: 'Giulia Colombo',
    buddyArchetype: 'The Luminary',
    buddyCity: 'Milano',
  },
  {
    id: 204,
    role: 'requester',
    status: 'CONFIRMED',
    buddyId: 3,
    buddyName: 'Matteo Ferrari',
    buddyArchetype: 'The Architect',
    buddyCity: 'Milano',
  },
];

export const DEMO_THREAD_MESSAGES = [
  {
    id: 1,
    senderId: 2,
    content: 'Hey Alex! Glad we matched on HobbyBuddy 🙌',
    timestamp: 'Yesterday 18:20',
  },
  {
    id: 2,
    senderId: 1,
    content: 'Hey Giulia! Saw you love golden hour photography too! Any favorite spots around Milan?',
    timestamp: 'Yesterday 18:25',
  },
  {
    id: 3,
    senderId: 2,
    content: 'Definitely Parco Sempione and the Navigli right around 7 PM! Are you bringing your 35mm lens for the photowalk Saturday?',
    timestamp: '10:32 AM',
  },
];

export const getDemoPublicProfile = (id) => {
  const p = DEMO_PEOPLE.find(person => String(person.id) === String(id));
  if (p) {
    return {
      id: p.id,
      name: p.name,
      city: p.city,
      age: p.age,
      archetype: p.archetype,
      personalityTagline: p.bio,
      hobbies: p.hobbies.join(', '),
      prompt1: 'My favorite way to spend a Saturday',
      prompt2: 'Looking for buddies who enjoy deep conversations and outdoor adventures',
      prompt3: 'Top recommendation: always explore new neighbourhoods on foot',
      photosJson: '[]',
      connectionStatus: 'confirmed',
    };
  }
  return {
    id: id || 2,
    name: 'Giulia Colombo',
    city: 'Milano',
    age: 25,
    archetype: 'The Luminary',
    personalityTagline: 'Photographer and visual designer',
    hobbies: 'Photography 📷, Art 🎨, Coffee ☕',
    prompt1: 'Golden hour captures in the city',
    prompt2: 'Passionate about creative collabs',
    prompt3: 'Good coffee is non-negotiable',
    photosJson: '[]',
    connectionStatus: 'confirmed',
  };
};

