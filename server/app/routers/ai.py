"""AI suggestion routes backed by Google Gemini and Firestore."""
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..config import settings
from ..db import (
    get_document,
    query_documents,
)
from ..deps import get_current_user

router = APIRouter(prefix="/ai", tags=["ai"])

class SuggestRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    childId: Optional[str] = None

def _child_context(child_id: str, parent_id: str) -> str:
    child = get_document("children", child_id)
    if child is None or child.get("parent_id") != parent_id:
        return ""
    lines = [
        f"- Child: {child['name']}, date of birth {child['dob']}, sex {child.get('sex', 'male')}.",
    ]
    
    analyses = query_documents("vision_analyses", {"child_id": child_id, "parent_id": parent_id})
    if analyses:
        analyses.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        analysis = analyses[0]
        lines.append(
            f"- Latest vision screening: risk score {analysis.get('risk_score', 0):.0f}/100, "
            f"risk level {analysis.get('risk_level', 'low')}."
        )
        
    sdqs = query_documents("sdq", {"child_id": child_id, "parent_id": parent_id})
    if sdqs:
        sdqs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        sdq = sdqs[0]
        scores = sdq.get("scores") or {}
        lines.append(
            f"- Latest SDQ assessment: total difficulties {scores.get('total', 'n/a')}/40, "
            f"risk category {scores.get('risk', 'n/a')}."
        )
        
    return "\n".join(lines)

def _build_prompt(user_message: str, context: str) -> str:
    system = (
        "You are a supportive developmental screening assistant for parents of young "
        "children (ages 3-5). Your answers must be clear, practical and age-appropriate. "
        "Always remind the parent that you are not a doctor and that a pediatrician or "
        "child development specialist should be consulted for any diagnosis. "
        "Use plain text only, no emojis and no markdown formatting."
    )
    parts = [system]
    if context:
        parts.append(f"Known context about the child:\n{context}")
    parts.append(
        "If the question is not related to child development, parenting, early "
        "intervention, or the provided context, politely redirect to those topics."
    )
    parts.append(f"Parent question: {user_message}")
    return "\n\n".join(parts)

async def call_gemini(prompt: str) -> str:
    url = f"{settings.GEMINI_URL}/{settings.GEMINI_MODEL}:generateContent"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"maxOutputTokens": 900},
    }
    headers = {"Content-Type": "application/json"}
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                url, params={"key": settings.GEMINI_API_KEY}, headers=headers, json=payload
            )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"AI service unavailable: {exc}")
    if resp.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"AI service error ({resp.status_code}): {resp.text[:200]}",
        )
    data = resp.json()
    try:
        parts = data["candidates"][0]["content"]["parts"]
        text = "".join(
            part.get("text", "") for part in parts if isinstance(part, dict) and part.get("text")
        ).strip()
    except (KeyError, IndexError, TypeError):
        text = ""
    if not text:
        raise HTTPException(status_code=502, detail="AI service returned an empty response.")
    return text

@router.post("/suggest")
async def suggest(body: SuggestRequest, user=Depends(get_current_user)):
    context = ""
    if body.childId is not None:
        context = _child_context(body.childId, user["id"])
    prompt = _build_prompt(body.message, context)
    reply = await call_gemini(prompt)
    return {"reply": reply}
