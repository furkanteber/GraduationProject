from mistral_model import generate_question

if __name__ == "__main__":
    results = generate_question(
        topic="React",
        level="Orta",
        role="API istekleri",
        framework_version="react 19+",
        question_type="API istekleri",
        expected_answer_type="Kod örneği",
        experience_years="1-2",
        interview_style="Teknik bilgi",
        fast_mode=True
    )

    for i, r in enumerate(results, start=1):
        print(f"\n--- Soru {i} ---")
        print(f"Soru: {r['question']}")
        print(f"Cevap: {r['answer']}")
