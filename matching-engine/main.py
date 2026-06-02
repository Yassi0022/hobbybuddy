"""
HobbyBuddy Matching Engine — Hybrid Weighted Euclidean + Complementarity Model

Why this approach:
  Cosine similarity measures only the angle between vectors, ignoring magnitude.
  Two people with traits [10,10,10,10,10] and [90,90,90,90,90] would score as
  perfectly similar — clearly wrong for personality matching.

  Instead we use a two-component model:

  1. Similarity component (65% weight): Weighted normalized Euclidean distance
     across openness, conscientiousness, and extraversion.  These dimensions are
     best predicted by how similar two people are — shared interests, similar
     energy levels, compatible planning styles.

  2. Complementarity component (35% weight): Agreeableness gap score (moderate
     differences create balance) plus a neuroticism average penalty (lower
     combined neuroticism predicts better social outcomes).  Research on
     interpersonal satisfaction shows these dimensions reward complementarity
     rather than raw similarity.

  Neuroticism is inverted before ALL computation (100 - score) so that higher
  values always mean "better" — consistent with the other four traits.

  The final score is mapped to [0, 100] and exposed as compatibility_score.
  A qualitative match_label is provided for frontend display.
"""

from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import numpy as np

app = FastAPI()

# ── Trait configuration ──────────────────────────────────────────────────────
# Backend keys (match Spring Boot DTO fields)
TRAIT_KEYS = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"]

# Display names for vibe-based UI
TRAIT_VIBE_NAMES = {
    "openness": "Curiosity",
    "conscientiousness": "Steadiness",
    "extraversion": "Energy",
    "agreeableness": "Empathy",
    "neuroticism": "Calm",
}

# Component 1: Similarity traits — weighted normalized Euclidean distance
# These traits reward being close to each other
SIMILARITY_TRAITS = ["openness", "conscientiousness", "extraversion"]
SIMILARITY_WEIGHTS = {
    "openness": 0.15,
    "conscientiousness": 0.20,
    "extraversion": 0.25,
}

# Component 2: Complementarity traits — gap-based + average penalty
COMPLEMENTARITY_TRAITS = ["agreeableness", "neuroticism"]
COMPLEMENTARITY_WEIGHTS = {
    "agreeableness": 0.25,
    "neuroticism": 0.15,
}

# Component blend
SIMILARITY_COMPONENT_WEIGHT = 0.65
COMPLEMENTARITY_COMPONENT_WEIGHT = 0.35

# Match label thresholds (on 0–100 scale)
MATCH_LABEL_THRESHOLDS = [
    (85, "Perfect vibe"),
    (70, "Top match"),
    (55, "Strong fit"),
    (40, "Good energy"),
    (0, "Different vibe"),
]


# ── Request / Response models ────────────────────────────────────────────────

class UserTraits(BaseModel):
    id: int
    openness: float
    conscientiousness: float
    extraversion: float
    agreeableness: float
    neuroticism: float


class MatchRequest(BaseModel):
    target_user: UserTraits
    potential_matches: List[UserTraits]


class TraitBreakdown(BaseModel):
    trait: str
    userScore: int
    matchScore: int
    matchQuality: str


class MatchResponse(BaseModel):
    best_match_id: int
    compatibility_score: int
    match_label: str
    shared_strengths: List[str]
    complementary_traits: List[str]
    trait_breakdowns: List[TraitBreakdown]


# ── Helpers ──────────────────────────────────────────────────────────────────

def _to_vector(user: UserTraits) -> np.ndarray:
    """Extract trait values into a numpy array, with neuroticism inverted."""
    raw = np.array([
        user.openness,
        user.conscientiousness,
        user.extraversion,
        user.agreeableness,
        user.neuroticism,
    ], dtype=np.float64)
    # Invert neuroticism: lower neuroticism = better, so flip to align direction
    raw[4] = 100.0 - raw[4]
    return raw


def _trait_index(trait_key: str) -> int:
    return TRAIT_KEYS.index(trait_key)


def _get_match_label(score: int) -> str:
    for threshold, label in MATCH_LABEL_THRESHOLDS:
        if score >= threshold:
            return label
    return MATCH_LABEL_THRESHOLDS[-1][1]


# ── Scoring functions ────────────────────────────────────────────────────────

def _similarity_score(t1: np.ndarray, t2: np.ndarray) -> float:
    """
    Weighted normalized Euclidean distance for similarity traits.
    Returns a value in [0, 1] where 1 = identical, 0 = maximally distant.
    """
    max_euclidean = np.sqrt(len(SIMILARITY_TRAITS))  # max possible distance in unit space
    weighted_sq_dist = 0.0
    total_weight = sum(SIMILARITY_WEIGHTS[t] for t in SIMILARITY_TRAITS)

    for trait in SIMILARITY_TRAITS:
        idx = _trait_index(trait)
        # Normalize to [0, 1] per trait
        n1 = t1[idx] / 100.0
        n2 = t2[idx] / 100.0
        weight = SIMILARITY_WEIGHTS[trait] / total_weight  # normalize weights to sum to 1
        weighted_sq_dist += weight * (n1 - n2) ** 2

    distance = np.sqrt(weighted_sq_dist)
    # Clamp to [0, 1] then invert so higher = more similar
    similarity = 1.0 - min(distance / max_euclidean, 1.0)
    return float(np.clip(similarity, 0.0, 1.0))


def _complementarity_score(t1: np.ndarray, t2: np.ndarray) -> float:
    """
    Complementarity component for agreeableness and neuroticism.

    Agreeableness: moderate gap (10–30 points) is ideal — one person's warmth
    balances the other's assertiveness.  Identical or very large gaps score lower.

    Neuroticism (already inverted): lower average is better.  Penalize pairs
    where the average inverted score is low (i.e., high raw neuroticism).

    Returns a value in [0, 1] where 1 = perfectly complementary.
    """
    # ── Agreeableness gap score ──
    agree_idx = _trait_index("agreeableness")
    agree_gap = abs(t1[agree_idx] - t2[agree_idx])

    if agree_gap <= 10:
        # Very similar — decent but not complementary
        agree_score = 0.6
    elif agree_gap <= 30:
        # Sweet spot: moderate difference creates balance
        agree_score = 1.0
    elif agree_gap <= 50:
        # Noticeable difference — still workable
        agree_score = 0.7
    else:
        # Too far apart — friction likely
        agree_score = 0.3

    # ── Neuroticism average penalty (values already inverted) ──
    neuro_idx = _trait_index("neuroticism")
    neuro_avg = (t1[neuro_idx] + t2[neuro_idx]) / 2.0  # 0–100, higher = calmer
    # Map average to a 0–1 score: 0 avg → 0.0, 100 avg → 1.0
    neuro_score = neuro_avg / 100.0

    # Blend: agreeableness gap matters slightly more than neuroticism average
    total = COMPLEMENTARITY_WEIGHTS["agreeableness"] + COMPLEMENTARITY_WEIGHTS["neuroticism"]
    agree_w = COMPLEMENTARITY_WEIGHTS["agreeableness"] / total
    neuro_w = COMPLEMENTARITY_WEIGHTS["neuroticism"] / total

    return float(np.clip(agree_w * agree_score + neuro_w * neuro_score, 0.0, 1.0))


def compute_final_score(t1: np.ndarray, t2: np.ndarray) -> int:
    """
    Blend similarity and complementarity into a final 0–100 integer score.
    """
    sim = _similarity_score(t1, t2)
    comp = _complementarity_score(t1, t2)
    raw = SIMILARITY_COMPONENT_WEIGHT * sim + COMPLEMENTARITY_COMPONENT_WEIGHT * comp
    return int(round(raw * 100))


# ── Display helpers ──────────────────────────────────────────────────────────

def compute_shared_strengths(t1: np.ndarray, t2: np.ndarray) -> List[str]:
    """Identify traits where both users score high (using vibe names)."""
    strengths = []
    for key in TRAIT_KEYS:
        idx = _trait_index(key)
        if t1[idx] >= 60 and t2[idx] >= 60:
            strengths.append(TRAIT_VIBE_NAMES[key])

    high_count = len(strengths)
    if high_count >= 4:
        strengths.append("Exceptional alignment")
    elif high_count >= 2:
        strengths.append("Strong overlap")
    return strengths


def compute_complementary_traits(t1: np.ndarray, t2: np.ndarray) -> List[str]:
    """Identify traits where one user's strength balances the other (vibe names)."""
    complementary = []
    for key in TRAIT_KEYS:
        idx = _trait_index(key)
        vibe = TRAIT_VIBE_NAMES[key]
        if t1[idx] >= 65 and 30 <= t2[idx] < 65:
            complementary.append(f"{vibe} balance")
        elif t2[idx] >= 65 and 30 <= t1[idx] < 65:
            complementary.append(f"{vibe} complement")
    return complementary


def compute_trait_breakdowns(t1: np.ndarray, t2: np.ndarray) -> List[TraitBreakdown]:
    """Per-trait comparison for the UI, using vibe display names."""
    breakdowns = []
    for key in TRAIT_KEYS:
        idx = _trait_index(key)
        diff = abs(int(t1[idx]) - int(t2[idx]))
        if diff <= 10:
            quality = "Very High"
        elif diff <= 25:
            quality = "High"
        elif diff <= 45:
            quality = "Moderate"
        else:
            quality = "Low"
        breakdowns.append(TraitBreakdown(
            trait=TRAIT_VIBE_NAMES[key],
            userScore=int(t1[idx]),
            matchScore=int(t2[idx]),
            matchQuality=quality,
        ))
    return breakdowns


# ── Endpoint ─────────────────────────────────────────────────────────────────

@app.post("/calculate-match", response_model=List[MatchResponse])
def calculate_match(request: MatchRequest):
    target_vec = _to_vector(request.target_user)

    matches: List[MatchResponse] = []

    for buddy in request.potential_matches:
        buddy_vec = _to_vector(buddy)

        score = compute_final_score(target_vec, buddy_vec)
        label = _get_match_label(score)

        matches.append(MatchResponse(
            best_match_id=buddy.id,
            compatibility_score=score,
            match_label=label,
            shared_strengths=compute_shared_strengths(target_vec, buddy_vec),
            complementary_traits=compute_complementary_traits(target_vec, buddy_vec),
            trait_breakdowns=compute_trait_breakdowns(target_vec, buddy_vec),
        ))

    matches.sort(key=lambda m: m.compatibility_score, reverse=True)
    return matches[:5]


if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
