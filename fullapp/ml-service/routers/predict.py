from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from jose import jwt, JWTError
import os

router = APIRouter()

print("⏳ Loading summarization model...")
MODEL = "sshleifer/distilbart-cnn-12-6"
tokenizer = AutoTokenizer.from_pretrained(MODEL)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL)
print("✅ Model loaded")


class PredictRequest(BaseModel):
    text: str


from typing import Optional
def verify_token(authorization: Optional[str]):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    token = authorization.replace("Bearer ", "").strip()
    if token == "api-key-auth":
        return True
    try:
        jwt.decode(token, os.getenv("JWT_SECRET"), algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/predict")
async def predict(body: PredictRequest, authorization: Optional[str] = Header(None)):
    verify_token(authorization)

    text = body.text.strip()
    if len(text) < 50:
        raise HTTPException(status_code=400, detail="Text must be at least 50 characters")

    inputs = tokenizer(text[:3000], return_tensors="pt", max_length=1024, truncation=True)
    ids = model.generate(inputs["input_ids"], max_length=150, min_length=30)
    summary = tokenizer.decode(ids[0], skip_special_tokens=True)

    return {"summary": summary}