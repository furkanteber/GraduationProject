from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import json
from datetime import datetime
from app.db.mongodb_connection import insert_documents

print("Model yükleniyor...")
model_path = "./mistral-7b-4bit-quantized"

tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForCausalLM.from_pretrained(
    model_path,
    torch_dtype=torch.float16,
    device_map="cuda:0"
)
model.eval()
print("Model yüklendi!\n")
print(model.hf_device_map)

def generate_question(
    topic="Python",
    level="Orta",
    role="Yazılım Mühendisi",
    company_size="Orta ölçekli şirket",
    context="gerçek bir iş görüşmesi",
    question_type="Teknik derinlemesine",
    expected_answer_type="Kod örneği",
    experience_years="3+",
    framework_version="",
    interview_style="Profesyonel teknik",
    fast_mode=False
):
    """
    fast_mode=True -> Daha hızlı, kısa ve net çıktılar (bağlam korunur)
    fast_mode=False -> Daha yaratıcı, uzun ve çeşitli çıktılar
    """

    prompt = f"""
    Aşağıdaki bağlama göre profesyonel bir iş görüşmesi sorusu oluştur.
    
    Şirket: {company_size}
    Pozisyon: {role}
    Konu: {topic} {framework_version}
    Tecrübe: {experience_years} yıl
    Seviye: {level}
    Soru tipi: {question_type}
    Cevap tipi: {expected_answer_type}
    Mülakat tarzı: {interview_style}
    Bağlam: {context}

    Kurallar:
    - Soru teknik bir yeterliliği ölçmeli.
    - Basit veya tanımsal soru sorma ("pandas nedir?" gibi).
    - Gerçek bir proje senaryosu veya problem durumu içermeli.
    - Kod veya mimari düşünmeye teşvik etsin.
    - Gereksiz semboller, çizgiler, açıklamalar ekleme.
    - Sadece bir soru ve ardından 'Cevap:' yaz.
    
    Biçim:
    Soru: <doğrudan soruyu yaz>
    Cevap: <örnek, mantıklı bir cevap üret>
    """

    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        truncation=True,
        max_length=512,
    ).to(model.device)

    if fast_mode:
        generation_config = {
            "max_new_tokens": 160,
            "do_sample": True,
            "temperature": 0.7,
            "top_p": 0.9,
            "repetition_penalty": 1.1,
            "num_return_sequences": 1,
        }
    else:
        generation_config = {
            "max_new_tokens": 256,
            "do_sample": True,
            "temperature": 0.8,
            "top_p": 0.9,
            "repetition_penalty": 1.15,
            "num_return_sequences": 1,
        }

    with torch.inference_mode():
        outputs = model.generate(
            **inputs,
            pad_token_id=tokenizer.eos_token_id,
            **generation_config
        )

    all_results = []
    num_sequences = generation_config["num_return_sequences"]

    for i in range(num_sequences):
        new_tokens = outputs[i][inputs["input_ids"].shape[1]:]
        result = tokenizer.decode(new_tokens, skip_special_tokens=True).strip()

        if "Cevap:" in result:
            parts = result.split("Cevap:")
            question_text = parts[0].replace("Soru:", "").strip()
            answer_text = parts[1].strip()
        else:
            question_text = result.strip()
            answer_text = "Cevap bulunamadı."

        doc = {
            "topic": topic,
            "question": question_text,
            "answer": answer_text,
            "metadata": {
                "role": role,
                "level": level,
                "company_size": company_size,
                "question_type": question_type,
                "expected_answer_type": expected_answer_type,
                "experience_years": experience_years,
                "framework_version": framework_version,
                "interview_style": interview_style,
                "created_at": datetime.utcnow().isoformat()
            }
        }
        all_results.append(doc)

    with open("mistral_soru.json", "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=4)
    print(f"{num_sequences} adet soru JSON dosyasına kaydedildi: mistral_soru.json")
    insert_documents("premadeQuestions", all_results)

    return all_results


def generate_answer_for_question(question_en: str, fast_mode: bool = True) -> str:
    question_en = (question_en or "").strip()
    if not question_en:
        return ""

    prompt = (
        "You are an experienced senior software engineer.\n"
        "Provide a strong, clear and practical interview answer in English to the following question.\n"
        "Focus on real-world reasoning and, if appropriate, include a short code example in a single language.\n"
        "Do not repeat the question. Do not add explanations outside the answer itself.\n\n"
        f"Question: {question_en}\n\n"
        "Answer:"
    )

    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        truncation=True,
        max_length=512,
    ).to(model.device)

    if fast_mode:
        generation_config = {
            "max_new_tokens": 256,
            "do_sample": True,
            "temperature": 0.7,
            "top_p": 0.9,
            "repetition_penalty": 1.1,
            "num_return_sequences": 1,
        }
    else:
        generation_config = {
            "max_new_tokens": 512,
            "do_sample": True,
            "temperature": 0.8,
            "top_p": 0.9,
            "repetition_penalty": 1.15,
            "num_return_sequences": 1,
        }

    with torch.inference_mode():
        outputs = model.generate(
            **inputs,
            pad_token_id=tokenizer.eos_token_id,
            **generation_config,
        )

    new_tokens = outputs[0][inputs["input_ids"].shape[1]:]
    raw_answer = tokenizer.decode(new_tokens, skip_special_tokens=True).strip()

    if "Answer:" in raw_answer:
        raw_answer = raw_answer.split("Answer:", 1)[-1].strip()

    return raw_answer

def analyze_and_feedback(qa_items, fast_mode: bool = True):
    """Soru+cevap listesini analiz edip soru bazlı geribildirim üretir.

    Parametreler
    qa_items: list[dict]
        Her eleman en azından şu alanlara sahip olmalıdır:
        - "question": str  -> sorunun metni
        - "user_answer": str -> adayın cevabı
        - "ideal_answer": str (opsiyonel) -> beklenen/örnek cevap

    Dönüş
    list[dict]
        Her soru için yaklaşık şu yapıda kayıtlar döner:
        {
          "index": int,
          "overall_score": float,          # 0-100
          "strengths": [str, ...],
          "missing_points": [str, ...],
          "advice": str
        }
    """

    if not qa_items:
        return []

    #prompt soru bazlı analiz isteyecek şekilde
    lines = [
        "Sen deneyimli bir teknik mülakat koçu ve geri bildirim asistanısın.",
        "Adayın verdiği yazılı cevapları inceleyip her soru için şu analizleri yap:",
        "- Güçlü yönler (strengths)",
        "- Eksik / atlanan önemli noktalar (missing_points)",
        "- Gelişim için net ve uygulanabilir tavsiyeler (advice)",
        "- 0-100 arası genel bir başarı puanı (overall_score)",
        "",
        "Her soru için sadece Türkçe yaz.",
        "Çıktıyı KESİNLİKLE geçerli JSON formatında üret ve başka açıklama ekleme.",
        "Biçim tam olarak şöyle olmalı:",
        "[",
        "  {",
        "    \"index\": 0,",
        "    \"overall_score\": 75.5,",
        "    \"strengths\": [\"...\"],",
        "    \"missing_points\": [\"...\"],",
        "    \"advice\": \"...\"",
        "  },",
        "  {",
        "    \"index\": 1,",
        "    \"overall_score\": 82.0,",
        "    \"strengths\": [\"...\"],",
        "    \"missing_points\": [\"...\"],",
        "    \"advice\": \"...\"",
        "  }",
        "]",
        "",
        "Şimdi aşağıdaki soru ve aday cevaplarını analiz et:",
        "",
    ]

    for idx, item in enumerate(qa_items):
        q_text = str(item.get("question") or "").strip()
        user_answer = str(item.get("user_answer") or "").strip()
        ideal_answer = str(item.get("ideal_answer") or "").strip()

        lines.append(f"Soru {idx}: {q_text}")
        lines.append(f"Adayın Cevabı: {user_answer if user_answer else '-'}")
        if ideal_answer:
            lines.append(f"Beklenen / Örnek Cevap: {ideal_answer}")
        lines.append("")

    prompt = "\n".join(lines)

    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        truncation=True,
        max_length=1024,
    ).to(model.device)

    if fast_mode:
        generation_config = {
            "max_new_tokens": 256,
            "do_sample": True,
            "temperature": 0.7,
            "top_p": 0.9,
            "repetition_penalty": 1.1,
            "num_return_sequences": 1,
        }
    else:
        generation_config = {
            "max_new_tokens": 512,
            "do_sample": True,
            "temperature": 0.8,
            "top_p": 0.9,
            "repetition_penalty": 1.15,
            "num_return_sequences": 1,
        }

    with torch.inference_mode():
        outputs = model.generate(
            **inputs,
            pad_token_id=tokenizer.eos_token_id,
            **generation_config,
        )

    new_tokens = outputs[0][inputs["input_ids"].shape[1]:]
    raw_result = tokenizer.decode(new_tokens, skip_special_tokens=True).strip()

    #sadece JSON kısmını ayıklamaya çalış
    json_text = raw_result
    start = json_text.find("[")
    end = json_text.rfind("]")
    if start != -1 and end != -1 and end > start:
        json_text = json_text[start : end + 1]

    try:
        parsed = json.loads(json_text)
        return parsed
    except Exception:
        #JSON parse edilemezse ham çıktıyı döndür
        return {
            "raw": raw_result,
            "error": "json_parse_failed",
        }
