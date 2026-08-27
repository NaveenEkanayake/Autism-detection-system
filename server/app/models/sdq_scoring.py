# server/app/models/sdq_scoring.py

REVERSED_ITEMS = {6, 8, 9, 12, 13}

QUESTION_SCALES = {
    1: "prosocial",
    2: "prosocial",
    3: "prosocial",
    4: "prosocial",
    5: "prosocial",
    6: "hyperactivity",
    7: "conduct",
    8: "hyperactivity",
    9: "peer",
    10: "peer",
    11: "peer",
    12: "hyperactivity",
    13: "emotional",
    14: "emotional",
    15: "conduct",
    16: "conduct",
    17: "conduct",
    18: "emotional",
    19: "emotional",
    20: "emotional",
    21: "hyperactivity",
    22: "hyperactivity",
    23: "conduct",
    24: "peer",
    25: "peer"
}

def score_sdq(responses):
    """
    Scores a 25-item SDQ.
    responses: Can be a list of 25 numbers (0-indexed or 1-indexed) or a dict mapping '1'..'25' to 0..2.
    """
    if isinstance(responses, list):
        if len(responses) == 25:
            ans_dict = {i + 1: responses[i] for i in range(25)}
        else:
            raise ValueError(f"Expected list of 25 items, got {len(responses)}")
    elif isinstance(responses, dict):
        ans_dict = {int(k): int(v) for k, v in responses.items()}
    else:
        raise ValueError("Responses must be a list or dictionary of 25 items.")

    subscales = {
        "emotional": 0,
        "conduct": 0,
        "hyperactivity": 0,
        "peer": 0,
        "prosocial": 0
    }

    for q_id, val in ans_dict.items():
        if q_id not in QUESTION_SCALES:
            continue
        scale = QUESTION_SCALES[q_id]
        if val not in (0, 1, 2):
            raise ValueError(f"Value for item {q_id} must be 0, 1, or 2 (got {val}).")
        score = 2 - val if q_id in REVERSED_ITEMS else val
        subscales[scale] += score

    total = subscales["emotional"] + subscales["conduct"] + subscales["hyperactivity"] + subscales["peer"]
    
    # Classify band (Clinical is total >= 20 points, Borderline is total >= 15 points)
    if total >= 20:
        band = "very_high"
        is_clinical_range = True
    elif total >= 15:
        band = "slightly_raised"
        is_clinical_range = False
    else:
        band = "close_to_average"
        is_clinical_range = False

    return {
        "subscale_scores": subscales,
        "total_difficulties_score": total,
        "band": band,
        "is_clinical_range": is_clinical_range
    }
