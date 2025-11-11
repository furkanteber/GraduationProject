from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import json
from datetime import datetime
from db.mongodb_connection import insert_documents

print("Model yükleniyor...")
model_path = "./mistral-7b-4bit-quantized"

tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForCausalLM.from_pretrained(
    model_path,
    torch_dtype=torch.float16,
    device_map="cuda:0"
)
print("Model yüklendi!\n")


def generate_question(
    topic="Python",
    level="Orta",
    role="Backend Yazılım Mühendisi",
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

    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

    if fast_mode:
        generation_config = {
            "max_new_tokens": 350,
            "do_sample": True,
            "temperature": 0.7,
            "top_p": 0.85,
            "repetition_penalty": 1.15,
            "num_return_sequences": 1
        }
    else:
        generation_config = {
            "max_new_tokens": 700,
            "do_sample": True,
            "temperature": 0.8,
            "top_p": 0.9,
            "repetition_penalty": 1.2,
            "num_return_sequences": 3
        }

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