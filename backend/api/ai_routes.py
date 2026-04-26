import logging
from fastapi import APIRouter, Header, HTTPException, Body
from pydantic import BaseModel
from openai import OpenAI

log = logging.getLogger(__name__)

router = APIRouter(tags=["AI"])

class AIGenerateRequest(BaseModel):
    title: str
    field: str
    current_content: str = ""

@router.post("/generate")
async def generate_ai_content(
    req: AIGenerateRequest,
    x_openai_key: str = Header(None, alias="X-OpenAI-Key")
):
    if not x_openai_key:
        raise HTTPException(status_code=401, detail="OpenAI API Key is required in X-OpenAI-Key header.")
        
    try:
        client = OpenAI(api_key=x_openai_key)
        
        system_prompt = (
            "You are an elite offensive security expert writing a VAPT (Vulnerability Assessment and Penetration Testing) report. "
            "Write the specific requested section concisely, using professional technical language. "
            "Use Markdown formatting (like code blocks, bolding, lists) where appropriate. "
            "Do NOT include introductory phrases like 'Here is the description'. Just output the raw markdown content for the section. "
            "Keep the length appropriate for a typical vulnerability report section (1-3 paragraphs)."
        )
        
        prompts = {
            "description": f"Write the 'Description' section for a vulnerability titled '{req.title}'. Explain what the vulnerability is and how it occurs.",
            "impact": f"Write the 'Business Impact' section for a vulnerability titled '{req.title}'. Explain what an attacker could achieve.",
            "poc": f"Write a hypothetical 'Proof of Concept' section for '{req.title}'. Provide generic steps or a code snippet to reproduce it.",
            "recommendation": f"Write the 'Recommendation' section for a vulnerability titled '{req.title}'. Explain how a developer should fix this issue."
        }
        
        if req.field not in prompts:
            raise HTTPException(status_code=400, detail="Invalid field specified.")
            
        user_prompt = prompts[req.field]
        if req.current_content:
            user_prompt += f"\n\nThe user started writing this, use it as context if helpful:\n{req.current_content}"
            
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=800
        )
        
        generated_text = response.choices[0].message.content.strip()
        return {"content": generated_text}
        
    except Exception as e:
        log.error("AI Generation error: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))
