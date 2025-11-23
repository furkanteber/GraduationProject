import google.generativeai as genai

genai.configure(api_key="AIzaSyC-iMjRC7cwPR4pnyXDksbV8mIDFYvTRWs")

def translate_to_turkish(text):
    model = genai.GenerativeModel("gemini-flash-latest")
    prompt = f"Translate the following English interview question to natural, fluent, professional Turkish. ONLY return the translation.\n\n{text}"

    response = model.generate_content(prompt)
    return response.text.strip()

# Test
english = "How would you design a Redis-backed microservices architecture?"
print(translate_to_turkish(english))
