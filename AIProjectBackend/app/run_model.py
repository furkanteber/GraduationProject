from app.microsoft_model import generate_interview_question

if __name__ == "__main__":
    result = generate_interview_question(
        topic="Python",
        level="Hard",
        role="Machine Learning",
        question_type="Data Science",
        expected_answer_type="Code ex.",
        interview_style="technical information",
    )

    print("\n--- Üretilen Soru ---")
    print(f"Konu: {result.get('topic')}")
    print(f"Soru (TR): {result.get('turkish_question')}")
    print(f"Soru (EN): {result.get('english_question')}")
