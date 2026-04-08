from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

app = FastAPI()

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

class MatchResponse(BaseModel):
    best_match_id: int
    similarity_score: float

@app.post("/calculate-match", response_model=List[MatchResponse])
def calculate_match(request: MatchRequest):
    target = request.target_user
    target_vector = np.array([[target.openness, target.conscientiousness, target.extraversion, target.agreeableness, target.neuroticism]])

    matches = []

    for buddy in request.potential_matches:
        buddy_vector = np.array([[buddy.openness, buddy.conscientiousness, buddy.extraversion, buddy.agreeableness, buddy.neuroticism]])
        
        similarity_matrix = cosine_similarity(target_vector, buddy_vector)
        current_score = float(similarity_matrix[0][0])
        matches.append(MatchResponse(best_match_id=buddy.id, similarity_score=current_score))
        
    matches.sort(key=lambda x: x.similarity_score, reverse=True)
    return matches

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
