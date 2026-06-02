"""
HobbyBuddy Matching Engine — Weighted Manhattan Distance + Targeted Penalties

Why this approach:
  Cosine similarity is conceptually wrong for personality trait vectors on a 0–100
  scale because it ignores magnitude — [10,10,10,10,10] and [90,90,90,90,90] would
  score as perfectly similar.

  Recent Big Five / relationship-satisfaction literature (Malouff et al., 2010;
  Decuyper et al., 2012; Harris & Vazire, 2016) shows that:
    - Trait *levels* (especially high agreeableness, high conscientiousness, low
      neuroticism) predict relationship satisfaction more strongly than raw
      trait *similarity* alone.
    - A single large gap on a high-importance trait should not be easily
      absorbed by good scores on other traits.
    - But a large gap on a lower-importance trait (openness, extraversion)
      should not destroy an otherwise strong match.

  Our model:
    1. Weighted Manhattan distance → base similarity (interpretable, bounded).
    2. Saturating gap penalties on high-importance traits (Empathy, Calm,
       Steadiness) → large gaps hurt, smoothly but noticeably.
    3. Tiny complementarity bonus on Energy and Curiosity only → small gaps
       can be slightly beneficial, but never compensate a real mismatch.
    4. Final calibration curve → spreads scores into a useful 0–100 range.

  No cosine similarity. No sklearn. Numpy only.
"""

from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import numpy as np

app = FastAPI()


# ── Trait configuration ──────────────────────────────────────────────────────

# Internal keys (match Spring Boot DTO field names)
TRAIT_KEYS = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"]

# Vibe display names for UI-facing output
TRAIT_VIBE_NAMES = {
    "openness": "Curiosity",
    "conscientiousness": "Steadiness",
    "extraversion": "Energy",
    "agreeableness": "Empathy",
    "neuroticism": "Calm",          # displayed as Calm (inverted)
}

# Index mapping for the internal vector layout:
#   [0] openness  -> Curiosity
#   [1] conscientiousness -> Steadiness
#   [2] extraversion -> Energy
#   [3] agreeableness -> Empathy
#   [4] neuroticism -> Calm (inverted: calm = 100 - neuroticism)

# ── Scoring weights (Manhattan distance) ─────────────────────────────────────
# Higher weight = this trait's gap matters more.
# Agreeableness/Empathy, Conscientiousness/Steadiness, and low Neuroticism/Calm
# get the most weight, consistent with the literature.
MANHATTAN_WEIGHTS = {
    "openness":          0.14,   # Curiosity — matters, but less
    "conscientiousness": 0.24,   # Steadiness — high importance
    "extraversion":      0.16,   # Energy — moderate importance
    "agreeableness":     0.24,   # Empathy — high importance
    "neuroticism":       0.22,   # Calm (inverted) — high importance
}

# ── Saturating gap penalties ─────────────────────────────────────────────────
# Format: (trait_key, gap_threshold, max_penalty)
# Penalty grows smoothly from 0 at the threshold to max_penalty at (threshold + 20).
GAP_PENALTIES = [
    ("agreeableness", 35, 0.10),   # Empathy gap > 35 → up to -0.10
    ("neuroticism",   35, 0.12),   # Calm gap > 35    → up to -0.12
    ("conscientiousness", 40, 0.08),  # Steadiness gap > 40 → up to -0.08
    ("openness",      45, 0.05),   # Curiosity gap > 45 → up to -0.05
    ("extraversion",  45, 0.05),   # Energy gap > 45    → up to -0.05
]

# ── Complementarity bonuses (small, limited) ────────────────────────────────
# Format: (trait_key, gap_min, gap_max, max_bonus)
# Only applied when gap is in the sweet-spot range.
COMPLEMENTARITY_BONUSES = [
    ("extraversion",  8, 18, 0.03),   # Energy gap 8–18  → up to +0.03
    ("openness",      6, 16, 0.02),   # Curiosity gap 6–16 → up to +0.02
]

# ── Match label thresholds ──────────────────────────────────────────────────
MATCH_LABEL_THRESHOLDS = [
    (90, "Perfect vibe"),
    (78, "Top match"),
    (62, "Strong fit"),
    (45, "Good energy"),
    (0,  "Different vibe"),
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


# ── Internal helpers ─────────────────────────────────────────────────────────

def _to_vector(user: UserTraits) -> np.ndarray:
    """
    Build the internal 5-element trait vector.
    Neuroticism is inverted to 'calm' so that higher = better for ALL dimensions.
    """
    return np.array([
        float(user.openness),
        float(user.conscientiousness),
        float(user.extraversion),
        float(user.agreeableness),
        100.0 - float(user.neuroticism),   # calm = 100 - neuroticism
    ])


def _trait_index(trait_key: str) -> int:
    return TRAIT_KEYS.index(trait_key)


def _get_match_label(score: int) -> str:
    for threshold, label in MATCH_LABEL_THRESHOLDS:
        if score >= threshold:
            return label
    return MATCH_LABEL_THRESHOLDS[-1][1]


def _saturating_penalty(gap: float, threshold: float, max_penalty: float) -> float:
    """
    Smooth saturating penalty: 0 when gap <= threshold, rising smoothly
    to max_penalty at gap = threshold + 20, then flat.
    Uses a quadratic ease-in curve.
    """
    if gap <= threshold:
        return 0.0
    excess = gap - threshold
    if excess >= 20.0:
        return max_penalty
    t = excess / 20.0          # 0 → 1
    return max_penalty * (t * t)  # quadratic ease-in


def _complementarity_bonus(gap: float, gap_min: float, gap_max: float, max_bonus: float) -> float:
    """
    Small bell-shaped bonus centered in the [gap_min, gap_max] range.
    Zero outside the range, peaks at the midpoint.
    """
    if gap < gap_min or gap > gap_max:
        return 0.0
    midpoint = (gap_min + gap_max) / 2.0
    half_width = (gap_max - gap_min) / 2.0
    # Normalized distance from center: 0 at center, 1 at edges
    dist = abs(gap - midpoint) / half_width
    # Cosine bell: 1.0 at center, 0.0 at edges
    return max_bonus * 0.5 * (1.0 + np.cos(np.pi * dist))


# ── Core scoring ─────────────────────────────────────────────────────────────

def compute_final_score(t1: np.ndarray, t2: np.ndarray) -> int:
    """
    Full scoring pipeline:
      1. Weighted Manhattan distance → base_similarity ∈ [0, 1]
      2. Saturating gap penalties subtracted
      3. Small complementarity bonuses added
      4. Clamp to [0, 1], apply calibration curve, map to 0–100 int.
    """
    # ── 1. Weighted Manhattan distance ───────────────────────────────────────
    weighted_abs_diff_sum = 0.0
    for key in TRAIT_KEYS:
        idx = _trait_index(key)
        weighted_abs_diff_sum += MANHATTAN_WEIGHTS[key] * abs(t1[idx] - t2[idx]) / 100.0
    base_similarity = 1.0 - weighted_abs_diff_sum   # 0 → 1

    # ── 2. Saturating gap penalties ──────────────────────────────────────────
    total_penalty = 0.0
    for trait_key, threshold, max_pen in GAP_PENALTIES:
        idx = _trait_index(trait_key)
        gap = abs(t1[idx] - t2[idx])
        total_penalty += _saturating_penalty(gap, threshold, max_pen)

    # ── 3. Complementarity bonuses ───────────────────────────────────────────
    total_bonus = 0.0
    for trait_key, gap_min, gap_max, max_bon in COMPLEMENTARITY_BONUSES:
        idx = _trait_index(trait_key)
        gap = abs(t1[idx] - t2[idx])
        total_bonus += _complementarity_bonus(gap, gap_min, gap_max, max_bon)

    # ── 4. Combine, clamp, calibrate ─────────────────────────────────────────
    raw = base_similarity - total_penalty + total_bonus
    clamped = float(np.clip(raw, 0.0, 1.0))

    # Calibration curve: slight power < 1 would compress high scores,
    # power > 1 spreads them. We use **1.15 to give more differentiation
    # in the mid-range where most real matches land.
    calibrated = clamped ** 1.15
    return int(round(calibrated * 100))


# ── Display helpers ──────────────────────────────────────────────────────────

def compute_shared_strengths(t1: np.ndarray, t2: np.ndarray) -> List[str]:
    """Both users score ≥ 60 on a trait → shared strength (vibe name)."""
    strengths = []
    for key in TRAIT_KEYS:
        idx = _trait_index(key)
        if t1[idx] >= 60 and t2[idx] >= 60:
            strengths.append(TRAIT_VIBE_NAMES[key])
    if len(strengths) >= 4:
        strengths.append("Exceptional alignment")
    elif len(strengths) >= 2:
        strengths.append("Strong overlap")
    return strengths


def compute_complementary_traits(t1: np.ndarray, t2: np.ndarray) -> List[str]:
    """One user ≥ 65, the other in [30, 65) → complementary (vibe name)."""
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

@app.get("/health")
def health():
    return {"status": "ok"}


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
