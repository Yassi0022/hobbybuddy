const ARCHETYPES = [
  { name: 'The Visionary', emoji: '🔮', desc: 'Creative, curious, and always exploring new ideas.', traits: { openness: 80, extraversion: 60 } },
  { name: 'The Champion', emoji: '🏆', desc: 'Energetic, sociable, and natural-born leader.', traits: { extraversion: 80, agreeableness: 70 } },
  { name: 'The Guardian', emoji: '🛡️', desc: 'Reliable, organized, and always there for others.', traits: { conscientiousness: 80, agreeableness: 70 } },
  { name: 'The Diplomat', emoji: '🕊️', desc: 'Empathetic, cooperative, and a natural peacemaker.', traits: { agreeableness: 80, extraversion: 50 } },
  { name: 'The Analyst', emoji: '🔬', desc: 'Thoughtful, detail-oriented, and intellectually sharp.', traits: { conscientiousness: 70, openness: 70 } },
  { name: 'The Explorer', emoji: '🧭', desc: 'Adventurous, open-minded, and always seeking new experiences.', traits: { openness: 80, extraversion: 70 } },
  { name: 'The Anchor', emoji: '⚓', desc: 'Calm, stable, and the rock everyone leans on.', traits: { neuroticism: 20, conscientiousness: 70 } },
  { name: 'The Catalyst', emoji: '⚡', desc: 'Dynamic, inspiring, and sparks change wherever they go.', traits: { extraversion: 70, openness: 70 } },
];

export function getArchetype(traits) {
  if (!traits) return ARCHETYPES[0];
  const scores = {
    openness: traits.openness || 50,
    conscientiousness: traits.conscientiousness || 50,
    extraversion: traits.extraversion || 50,
    agreeableness: traits.agreeableness || 50,
    neuroticism: 100 - (traits.neuroticism || 50),
  };

  let bestMatch = ARCHETYPES[0];
  let bestScore = -1;

  ARCHETYPES.forEach((arch) => {
    let score = 0;
    Object.keys(arch.traits).forEach((trait) => {
      score += 100 - Math.abs((scores[trait] || 50) - arch.traits[trait]);
    });
    if (score > bestScore) {
      bestScore = score;
      bestMatch = arch;
    }
  });

  return bestMatch;
}

export function getArchetypeFromScores(scores) {
  return getArchetype(scores);
}

export { ARCHETYPES };
