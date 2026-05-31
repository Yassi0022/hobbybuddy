from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

app = FastAPI()

TRAIT_NAMES = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"]

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
    similarity_score: float
    compatibility_score: int
    shared_strengths: List[str]
    complementary_traits: List[str]
    trait_breakdowns: List[TraitBreakdown]

def compute_shared_strengths(t1: np.ndarray, t2: np.ndarray) -> List[str]:
    strengths = []
    for i, name in enumerate(TRAIT_NAMES):
        if t1[i] >= 60 and t2[i] >= 60:
            strengths.append(name.capitalize())
    if len(strengths) >= 4:
        strengths.append("Exceptional Personality Alignment")
    elif sum(1 for i in range(5) if t1[i] >= 60 and t2[i] >= 60) >= 2:
        strengths.append("Strong Personality Overlap")
    return strengths

def compute_complementary_traits(t1: np.ndarray, t2: np.ndarray) -> List[str]:
    complementary = []
    for i, name in enumerate(TRAIT_NAMES):
        if t1[i] >= 65 and 30 <= t2[i] < 65:
            complementary.append(name.capitalize() + " balance")
        elif t2[i] >= 65 and 30 <= t1[i] < 65:
            complementary.append(name.capitalize() + " complement")
    return complementary

def compute_trait_breakdowns(t1: np.ndarray, t2: np.ndarray) -> List[TraitBreakdown]:
    breakdowns = []
    for i, name in enumerate(TRAIT_NAMES):
        diff = abs(int(t1[i]) - int(t2[i]))
        if diff <= 10:
            quality = "Very High"
        elif diff <= 25:
            quality = "High"
        elif diff <= 45:
            quality = "Moderate"
        else:
            quality = "Low"
        breakdowns.append(TraitBreakdown(
            trait=name.capitalize(),
            userScore=int(t1[i]),
            matchScore=int(t2[i]),
            matchQuality=quality
        ))
    return breakdowns

@app.post("/calculate-match", response_model=List[MatchResponse])
def calculate_match(request: MatchRequest):
    target = request.target_user
    target_vector = np.array([[target.openness, target.conscientiousness, target.extraversion, target.agreeableness, target.neuroticism]])

    matches = []

    for buddy in request.potential_matches:
        buddy_vector = np.array([[buddy.openness, buddy.conscientiousness, buddy.extraversion, buddy.agreeableness, buddy.neuroticism]])

        similarity_matrix = cosine_similarity(target_vector, buddy_vector)
        similarity = float(similarity_matrix[0][0])
        compatibility_pct = int(round(similarity * 100))

        # Invert neuroticism for scoring (lower is better)
        t1 = target_vector.copy()[0]
        t2 = buddy_vector.copy()[0]
        t1[4] = 100 - t1[4]
        t2[4] = 100 - t2[4]

        matches.append(MatchResponse(
            best_match_id=buddy.id,
            similarity_score=similarity,
            compatibility_score=compatibility_pct,
            shared_strengths=compute_shared_strengths(t1, t2),
            complementary_traits=compute_complementary_traits(t1, t2),
            trait_breakdowns=compute_trait_breakdowns(t1, t2)
        ))

    matches.sort(key=lambda x: x.similarity_score, reverse=True)
    return matches[:5]

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
