from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = "mistral_soru.json"

@app.get("/question")
def get_question():
    """Son kaydedilen soruyu getirir"""
    if not os.path.exists(DATA_FILE):
        return {"error": "Dosya bulunamadı"}

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, list) and len(data) > 0:
        last = data[-1]
    else:
        last = data

    return {
        "topic": last.get("topic", ""),
        "question": last.get("question", ""),
        "answer": last.get("answer", "")
    }
