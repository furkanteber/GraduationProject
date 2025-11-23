from llama_cpp import Llama
from datetime import datetime
import json
import re

# gemini çeviri servisini import et
from app.services.translate_service import translate_to_turkish
PHI3_MODEL = "phi3-gguf/Phi-3-mini-4k-instruct-q4_K_M.gguf"

print("Phi-3 yükleniyor...")

phi3 = Llama(model_path=PHI3_MODEL, n_gpu_layers=-1, n_ctx=2048)

print("Model yüklendi!\n")


def clean_english_question(text: str):
    text = re.sub(r"[-=]{2,}", " ", text)
    text = re.sub(r"\[.*?\]:", " ", text)
    text = re.sub(r"Here.*?format.*?\n", " ", text, flags=re.IGNORECASE)
    parts = re.split(r"Question:", text, flags=re.IGNORECASE)
    if len(parts) > 1:
        text = parts[-1]
    text = " ".join(line.strip() for line in text.splitlines())
    text = re.sub(r"\s+", " ", text).strip()
    return text


def generate_interview_question(topic="C",
        level="Zor",
        role="Bellek Yönetimi",
        question_type="Dosya İşlemleri",
        expected_answer_type="Kod örneği",
        interview_style="Teknik bilgi"):
    english_prompt = f"""
Generate ONE deep production-grade interview question.

Topic: {topic}
Level: {level}
Role: {role}
Question Type : {question_type}
Expected Answer Type : {expected_answer_type}
Interview Style : {interview_style}

Rules:
- ONLY output the English question.
- Must be realistic and scenario-based.
- No answers.
"""

    eng_raw = phi3(
        english_prompt,
        max_tokens=400,
        temperature=0.9
    )["choices"][0]["text"].strip()

    print("\n RAW İngilizce çıktı:")
    print(eng_raw)

    english_question = clean_english_question(eng_raw)

    print("\nTemizlenmiş İngilizce soru:")
    print(english_question)

    turkish_question = translate_to_turkish(english_question)

    print("\n🇹🇷 Türkçe çeviri:")
    print(turkish_question)

    result = {
        "topic": topic,
        "english_question": english_question,
        "turkish_question": turkish_question,
        "metadata": {
            "level": level,
            "generated_at": datetime.utcnow().isoformat()
        }
    }

    with open("interview_question.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=4)

    print("\n Kaydedildi: interview_question.json")

    return result


if __name__ == "__main__":
    generate_interview_question("Flutter")
