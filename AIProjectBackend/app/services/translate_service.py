import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

GENAI_KEY = os.getenv("GEMINI_API_KEY")
if not GENAI_KEY:
    raise ValueError("GEMINI_API_KEY .env içinde bulunamadı!")

genai.configure(api_key=GENAI_KEY)

model = genai.GenerativeModel("gemini-2.5-flash")


def translate_to_turkish(question_en: str) -> str:
    """
    Sadece verilen İngilizce soruyu, doğal ve profesyonel Türkçe'ye çevirir.
    Yeni soru uydurmasına izin yok.
    """
    prompt = f"""
You are a professional translator for software engineering interview questions.

Task:
- Translate ONLY the question below from English to natural, fluent, interview-style Turkish.
- Do NOT add or remove information.
- Do NOT create a new question.
- Do NOT explain anything.

English question:
{question_en}
"""

    response = model.generate_content(prompt)
    text = (response.text or "").strip()

    # Ufak temizlik
    import re
    text = re.sub(r'^[\"\-•\s]+', "", text).strip()

    # Soru işareti yoksa ekle
    if "?" not in text:
        text = text.rstrip(". ") + "?"

    return text


def translate_answer_to_turkish(answer_en: str) -> str:
    """Verilen İngilizce cevabı, doğal Türkçe'ye çevirir."""

    prompt = f"""
You are a professional translator for software engineering interview answers.

Task:
- Translate ONLY the answer below from English to natural, fluent Turkish.
- Preserve technical terms and code as much as possible.
- Do NOT add explanations.
- Output ONLY the translated Turkish answer.

English answer:
{answer_en}
"""
    response = model.generate_content(prompt)
    text = (response.text or "").strip()

    import re
    text = re.sub(r'^[\"\-•\s]+', "", text).strip()
    return text
